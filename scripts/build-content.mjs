// Reads everything the /admin editor saves under content/ and writes src/generated/content.ts for the site.
// Runs automatically before `pnpm dev` and `pnpm build` (so on every Vercel deploy).
// A broken or half-filled entry is skipped with a warning instead of failing the deploy.
//   node scripts/build-content.mjs            normal build
//   node scripts/build-content.mjs --inline   also embeds photos as data URIs (for the single-file preview)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = path.join(ROOT, 'content')
const OUT = path.join(ROOT, 'src', 'generated', 'content.ts')
const INLINE = process.argv.includes('--inline')
const warnings = []
const warn = (file, msg) => warnings.push(`  ${file}: ${msg}`)

const str = v => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())
const list = v => (Array.isArray(v) ? v.map(x => (x && typeof x === 'object' && 'text' in x ? x.text : x)).map(str).filter(Boolean) : [])
const date = v => { const s = str(v); return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '' }

function readDir(dir) {
  const full = path.join(CONTENT, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full).filter(f => f.endsWith('.json')).sort().flatMap(f => {
    const file = `content/${dir}/${f}`
    try {
      const data = JSON.parse(fs.readFileSync(path.join(full, f), 'utf8'))
      if (data.published === false) return []
      return [{ key: f.replace(/\.json$/, ''), file, data }]
    } catch (e) { warn(file, `JSON 格式錯誤，已略過（${e.message}）`); return [] }
  })
}

const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' }
function media(v, file) {
  const s = str(v)
  if (!s || !INLINE || !s.startsWith('/')) return s
  const p = path.join(ROOT, 'public', decodeURIComponent(s))
  if (!fs.existsSync(p)) { warn(file, `找不到檔案 ${s}`); return s }
  return `data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}`
}

// [lng, lat] from a map pick ({"type":"Point","coordinates":[lng,lat]}) or a pasted "lat, lng" from Google Maps
function coords(v, file) {
  const s = str(v)
  if (!s) return undefined
  try {
    if (s.startsWith('{')) { const g = JSON.parse(s); const c = g.coordinates || g.geometry?.coordinates; if (Array.isArray(c) && c.length >= 2) return [+(+c[0]).toFixed(4), +(+c[1]).toFixed(4)] }
    const n = s.split(/[,\s]+/).map(Number).filter(x => !Number.isNaN(x))
    // Google Maps copies "緯度, 經度"; Taiwan's longitude (> 90) tells us if someone typed it the other way round
    if (n.length >= 2) { const [a, b] = n; return Math.abs(a) > 90 ? [a, b] : [b, a] }
  } catch { /* fall through */ }
  warn(file, `看不懂地點「${s}」，這個據點不會出現在地圖上`)
  return undefined
}

// ---------- 資料庫 ----------
const entries = []
// 登錄日期 falls back to the date in the file name (new entries are named like 20261020-153045)
const addedOf = (key, v) => date(v) || (/^(\d{4})(\d{2})(\d{2})-/.test(key) ? key.replace(/^(\d{4})(\d{2})(\d{2})-.*/, '$1-$2-$3') : '')
const base = (cat, { key, data }) => ({ id: key, cat, added: addedOf(key, data.added), title: str(data.title), sub: str(data.sub) || '其他', desc: str(data.desc), grade: str(data.grade), url: str(data.url) })

for (const it of readDir('teach')) {
  const e = { ...base('teach', it), area: str(it.data.area), source: str(it.data.source) }
  const r = it.data.review
  if (r && str(r.intro)) {
    const rating = Number(r.rating)
    e.review = { ep: str(r.ep), intro: str(r.intro), themes: str(r.themes), provides: str(r.provides), grades: str(r.grades), os: str(r.os) }
    if (rating >= 1 && rating <= 5) e.review.rating = Math.round(rating * 2) / 2
  }
  entries.push(e)
}
for (const it of readDir('sponsor')) entries.push({ ...base('sponsor', it), area: str(it.data.area), source: str(it.data.source) })
for (const it of readDir('lecturers')) {
  const d = it.data
  entries.push({ ...base('lecturer', it), lecturer: {
    headline: str(d.headline), photo: media(d.photo, it.file), quote: str(d.quote), topics: list(d.topics),
    career: (Array.isArray(d.career) ? d.career : []).filter(c => str(c?.org) || str(c?.role)).map(c => ({ org: str(c.org), role: str(c.role), note: str(c.note), edu: !!c.edu })),
  } })
}
for (const it of readDir('activities')) {
  const d = it.data
  entries.push({ ...base('activity', it), activity: {
    goal: str(d.goal), people: str(d.people), time: str(d.time), space: str(d.space), props: str(d.props),
    steps: list(d.steps), tips: list(d.tips), variations: list(d.variations),
    links: (Array.isArray(d.links) ? d.links : []).filter(l => str(l?.url)).map(l => ({ t: str(l.title) || str(l.url), u: str(l.url) })),
  } })
}
for (const it of readDir('templates')) {
  const d = it.data, e = { ...base('template', it), contents: list(d.contents) }
  const href = str(d.file)
  if (href) {
    const ext = path.extname(href.split('?')[0]).toLowerCase()
    const fmt = { '.docx': 'Word 檔', '.doc': 'Word 檔', '.xlsx': 'Excel 檔', '.pptx': 'PowerPoint 檔', '.pdf': 'PDF 檔', '.odt': '文件檔' }[ext] || '檔案'
    e.file = { href, name: e.title + ext, format: str(d.fileFormat) || fmt }
  }
  entries.push(e)
}
for (const e of entries) if (!e.title) warn(`${e.cat}/${e.id}`, '沒有標題，已略過')
const ENTRIES = entries.filter(e => e.title)

// ---------- 社團 ----------
const REGIONS = ['north', 'central', 'south', 'east', 'abroad']
const CLUBS = readDir('clubs').filter(({ file, data }) => str(data.name) || (warn(file, '沒有社團名稱，已略過'), false)).map(({ key, file, data: d }) => ({
  id: key, order: Number(d.order) || 999, name: str(d.name), tagline: str(d.tagline), school: str(d.school), size: str(d.size), ig: str(d.ig).replace(/^@/, ''),
  types: list(d.types), color: /^#[0-9a-f]{3,8}$/i.test(str(d.color)) ? str(d.color) : '#9EB14F', partial: !!d.partial,
  highlights: list(d.highlights),
  sites: (Array.isArray(d.sites) ? d.sites : []).filter(s => str(s?.name)).map(s => {
    const site = { name: str(s.name), detail: str(s.detail) }
    if (REGIONS.includes(str(s.region))) site.region = str(s.region)
    const at = coords(s.location, file)
    if (at) site.at = at
    return site
  }),
})).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'zh-Hant'))

// ---------- 專欄 ----------
const SERIES = ['布穀好朋友', '布可不資道', '服務故事']
const entryIds = new Set(ENTRIES.map(e => e.id)), clubIds = new Set(CLUBS.map(c => c.id))
marked.setOptions({ gfm: true, breaks: true })
const POSTS = readDir('posts').filter(({ file, data }) => str(data.title) || (warn(file, '沒有標題，已略過'), false)).map(({ key, file, data: d }) => {
  const id = /^post-[a-z0-9-]+$/.test(key) ? key : 'post-' + key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const resIds = list(d.resources).filter(r => entryIds.has(r) || (warn(file, `找不到資源 ${r}`), false))
  const club = str(d.club)
  if (club && !clubIds.has(club)) warn(file, `找不到社團 ${club}`)
  let html = marked.parse(str(d.body))
  if (INLINE) html = html.replace(/src="(\/[^"]+)"/g, (_, s) => `src="${media(s, file)}"`)
  return {
    id, series: SERIES.includes(str(d.series)) ? str(d.series) : '服務故事', ep: str(d.ep), date: date(d.date), title: str(d.title), hook: str(d.hook), sum: str(d.sum),
    credit: str(d.credit), cover: media(d.cover, file), ig: str(d.ig), clubId: clubIds.has(club) ? club : '', resIds, html, closing: str(d.closing),
  }
}).sort((a, b) => (b.date || '0').localeCompare(a.date || '0') || b.id.localeCompare(a.id))

// ---------- 活動 ----------
const md = (v, file) => { let h = marked.parse(str(v)); if (INLINE) h = h.replace(/src="(\/[^"]+)"/g, (_, s) => `src="${media(s, file)}"`); return h }
const EVENTS = readDir('events').filter(({ file, data }) => (str(data.title) && date(data.date)) || (warn(file, '沒有活動名稱或日期，已略過'), false)).map(({ key, file, data: d }) => ({
  id: /^event-[a-z0-9-]+$/.test(key) ? key : 'event-' + key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  title: str(d.title), ep: str(d.ep), type: str(d.type) || '活動', date: date(d.date), time: str(d.time), place: str(d.place),
  audience: str(d.audience), quota: str(d.quota), fee: str(d.fee), signupUrl: str(d.signupUrl), deadline: date(d.deadline),
  sum: str(d.sum), cover: media(d.cover, file), html: md(d.body, file), recap: md(d.recap, file),
})).sort((a, b) => b.date.localeCompare(a.date))

// ---------- 網站設定 ----------
let SETTINGS = {}
try { SETTINGS = JSON.parse(fs.readFileSync(path.join(CONTENT, 'settings.json'), 'utf8')) } catch (e) { warn('content/settings.json', `讀不到（${e.message}），使用預設值`) }
// ---------- 經營手冊 ----------
// 書櫃上的書：後台「經營手冊」一章一筆（content/handbook/）。沒有的話用舊的 settings.chapters，再沒有就用網站預設（src/pages/Handbook.tsx 的 DEFAULT_CHAPTERS）
function chapter(c, file, i) {
  const name = str(c?.title) || `第 ${i + 1} 章`
  const files = (Array.isArray(c?.files) ? c.files : []).map(f => ({ title: str(f?.title), url: str(f?.url), date: date(f?.date),
    scenes: (Array.isArray(f?.scenes) ? f.scenes : []).map(str).filter(Boolean) })).filter(f => {
    if (f.title && f.url) return true
    if (f.title || f.url) warn(file, `手冊「${name}」有一份檔案缺少${f.title ? '網址' : '名稱'}，已略過`)
    return false
  })
  if (!files.length && str(c?.url)) files.push({ title: str(c?.title), url: str(c.url), date: '', scenes: [] }) // 舊格式：一章一個網址
  const ch = { title: str(c?.title), tag: str(c?.tag), desc: str(c?.desc), files,
    points: (Array.isArray(c?.points) ? list(c.points) : typeof c?.points === 'string' ? c.points.split(/[\n,，、]/).map(str).filter(Boolean) : []),
    cover: media(c?.cover, file), coverText: c?.coverText !== false }
  if (!ch.title) warn(file, `手冊第 ${i + 1} 章沒有章節名稱，已略過`)
  return ch
}
const fromAdmin = readDir('handbook').sort((x, y) => (Number(x.data.order) || 999) - (Number(y.data.order) || 999)).map(({ file, data }, i) => chapter(data, file, i))
const chapters = (fromAdmin.length ? fromAdmin : (Array.isArray(SETTINGS.chapters) ? SETTINGS.chapters : []).map((c, i) => chapter(c, 'content/settings.json', i))).filter(c => c.title)
SETTINGS = { joinFormUrl: str(SETTINGS.joinFormUrl) || 'https://forms.gle/Qm3Nj9ytpMLVAHbWA', joinFormEmbed: str(SETTINGS.joinFormEmbed), handbookUrl: str(SETTINGS.handbookUrl), chapters }

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, `// 自動產生的檔案，請不要手動修改：內容請到網站的 /admin 編輯（原始資料在 content/ 資料夾）。\nexport default ${JSON.stringify({ ENTRIES, CLUBS, POSTS, EVENTS, SETTINGS })}\n`)
console.log(`content: ${ENTRIES.length} 筆資源、${CLUBS.length} 個社團、${POSTS.length} 篇專欄、${EVENTS.length} 場活動${INLINE ? '（內嵌圖片）' : ''}`)
if (warnings.length) console.warn('注意：\n' + warnings.join('\n'))
