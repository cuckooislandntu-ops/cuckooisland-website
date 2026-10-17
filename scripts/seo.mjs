// 讓 Google 和社群分享預覽看得懂每一頁。在 `pnpm build`（每次 Vercel 部署）時，vite build 之後自動執行：
//   - 每一頁（含每篇專欄、每場活動）都有自己的標題、摘要、分享預覽圖（dist/index.html 與 dist/p/*.html）
//   - dist/sitemap.xml：所有頁面與專欄文章的網址清單，交給 Google Search Console
//   - dist/robots.txt：告訴搜尋引擎可以收錄、哪裡不要收（/admin/）
// 網址對應寫在 vercel.json 的 rewrites：/join → /p/join.html、/column/friends-1 → /p/column/friends-1.html、/events/… → /p/events/….html
// 換成自訂網域時，改下面的 SITE（或在 Vercel 設定環境變數 SITE_URL）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = (process.env.SITE_URL || 'https://cuckooisland-website.vercel.app').replace(/\/+$/, '')
const NAME = '布穀島社'
const IG = 'https://www.instagram.com/cuckoo_island/'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')

// 讀 build-content.mjs 產生的內容（export default {...}）
const gen = fs.readFileSync(path.join(ROOT, 'src', 'generated', 'content.ts'), 'utf8')
const { ENTRIES, POSTS, EVENTS = [] } = JSON.parse(gen.slice(gen.indexOf('{'), gen.lastIndexOf('}') + 1))
const count = cat => ENTRIES.filter(e => e.cat === cat).length

// ---------- 每一頁的標題與摘要（搜尋結果下方那行字） ----------
const PAGES = [
  { id: '', title: `${NAME}｜串聯全台教育服務性社團`, desc: '布穀島社串聯全台教育服務性社團，整理教案、贊助、講師與團隊活動資源，讓服務隊、課輔與營隊社團的幹部交流經驗、共享資源、一起成長。' },
  { id: 'about', title: `關於我們｜${NAME}`, desc: '布穀島社的願景、起源與角色：一群服務性社團的夥伴，希望每座投入教育的島嶼都能突破圈層限制，串成彼此支持的島鏈。' },
  { id: 'join', title: `加入會員｜${NAME}`, desc: '教育服務性社團申請加入布穀島社島鏈：填寫申請表約 15 分鐘，即可取得整理好的教案、贊助與講師資源，並優先收到活動與贊助資訊。' },
  { id: 'resources', title: `資料庫｜${NAME}`, desc: `給服務性社團的資源資料庫：${count('teach')} 筆教學資源、${count('sponsor')} 筆贊助資源，以及講師、團隊活動與文件模板，附小編評分。` },
  { id: 'map', title: `社團地圖｜${NAME}`, desc: '全台教育服務性社團地圖：看看各社團在哪些學校、部落與社區服務，以及他們的介紹。' },
  { id: 'handbook', title: `經營手冊｜${NAME}`, desc: '服務性社團經營手冊：招生、經費、教案、交接，一屆傳一屆的做法整理。' },
  { id: 'events', title: `活動｜${NAME}`, desc: '布穀島社的交流活動報名資訊與活動紀錄。' },
  { id: 'column', title: `專欄｜${NAME}`, desc: '布穀島社專欄：《布穀好朋友》社團介紹、《布可不資道》教學資源評比，以及服務故事與經驗分享。' },
  { id: 'match', title: `需求媒合｜${NAME}`, desc: '社團提出需求、企業與組織提供資源：布穀島社協助教育服務性社團與講師、贊助單位媒合。' },
]

const abs = u => (!u ? '' : /^https?:/.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + encodeURI(decodeURI(u)))
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clip = (s, n = 120) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t }
const urlOf = id => (id.startsWith('post-') ? `${SITE}/column/${id.slice(5)}` : id.startsWith('event-') ? `${SITE}/events/${id.slice(6)}` : `${SITE}/${id}`)

const ORG = {
  '@context': 'https://schema.org', '@type': 'Organization', name: NAME, alternateName: 'Cuckoo Island',
  url: SITE + '/', logo: SITE + '/apple-touch-icon.png', sameAs: [IG],
  description: '串聯全台教育服務性社團：交流經驗、共享資源、一起成長。',
}

function render({ url, title, desc, image, type = 'website', jsonld = [] }) {
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:site_name" content="${NAME}" />`,
    `<meta property="og:locale" content="zh_TW" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ')
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(desc)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(desc)}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${esc(image)}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${type}" />`)
  return html.replace('</head>', '  ' + head + '\n  </head>')
}

function write(rel, html) {
  const out = path.join(DIST, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
}

const image = u => abs(u && !u.startsWith('data:') ? u : '/og.png')
const urls = []
for (const p of PAGES) {
  const url = urlOf(p.id)
  const jsonld = p.id ? [] : [ORG, { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE + '/' }]
  write(p.id ? `p/${p.id}.html` : 'index.html', render({ url, title: p.title, desc: p.desc, image: abs('/og.png'), jsonld }))
  urls.push({ loc: url, priority: p.id ? '0.8' : '1.0' })
}

for (const post of POSTS) {
  const url = urlOf(post.id)
  const title = `${post.title}｜${NAME}`
  const desc = clip(post.sum || post.hook || post.html.replace(/<[^>]+>/g, ' '))
  const article = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: desc, image: [image(post.cover)],
    datePublished: post.date || undefined, url, mainEntityOfPage: url,
    author: { '@type': 'Organization', name: NAME, url: SITE + '/' }, publisher: ORG,
  }
  write(`p/column/${post.id.slice(5)}.html`, render({ url, title, desc, image: image(post.cover), type: 'article', jsonld: [article] }))
  urls.push({ loc: url, lastmod: post.date, priority: '0.6' })
}

for (const ev of EVENTS) {
  const url = urlOf(ev.id)
  const title = `${ev.title}｜${NAME}`
  const desc = clip(ev.sum || [ev.date, ev.time, ev.place].filter(Boolean).join('，') || ev.html.replace(/<[^>]+>/g, ' '))
  const event = {
    '@context': 'https://schema.org', '@type': 'Event', name: ev.title, description: desc, image: [image(ev.cover)], url,
    startDate: ev.date, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: ev.place ? { '@type': 'Place', name: ev.place, address: ev.place } : undefined,
    organizer: { '@type': 'Organization', name: NAME, url: SITE + '/' },
    isAccessibleForFree: /免費/.test(ev.fee) || undefined,
  }
  write(`p/events/${ev.id.slice(6)}.html`, render({ url, title, desc, image: image(ev.cover), jsonld: [event] }))
  urls.push({ loc: url, lastmod: ev.date, priority: '0.6' })
}

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`)
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${SITE}/sitemap.xml
`)
console.log(`seo: ${PAGES.length} 個頁面、${POSTS.length} 篇專欄、${EVENTS.length} 場活動，已產生 sitemap.xml 與 robots.txt（網址：${SITE}）`)
