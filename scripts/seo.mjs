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
  { id: 'resources', title: `公開資料庫｜${NAME}`, desc: `給服務性社團的公開資料庫：${count('teach')} 筆教學資源、${count('sponsor')} 筆贊助資源與講師名單，附小編評分；團隊活動與文件模板開放給島鏈會員。` },
  { id: 'map', title: `社團地圖｜${NAME}`, desc: '全台教育服務性社團地圖：看看各社團在哪些學校、部落與社區服務，並閱讀《布穀好朋友》社團介紹。' },
  { id: 'handbook', title: `教育服務性社團生存指南｜經營手冊｜${NAME}`, desc: '教育服務性社團生存指南：招生、經費、教案、營隊安全、與學校溝通、交接，一屆屆累積下來的做法，會員可線上閱讀與留言補充。' },
  { id: 'events', title: `活動｜${NAME}`, desc: '布穀島社的交流活動報名資訊與活動紀錄。' },
  { id: 'column', title: `專欄｜${NAME}`, desc: '布穀島社專欄：《布可不資道》教學資源評比，以及服務故事與經驗分享。' },
  { id: 'lessons', title: `會員教案庫｜${NAME}`, desc: '布穀島社島鏈會員社團分享的教案：依年段與主題查詢，按讚、收藏、留言交流，看看最近最夯的教案。' },
  { id: 'member', title: `會員專區｜${NAME}`, desc: '布穀島社島鏈會員專區：用 Google 帳號登入，查看會員公告、社團名錄，以及經營手冊、會員教案庫、團隊活動與模板。', noindex: true },
  { id: 'logout', title: `已登出｜${NAME}`, desc: '你已經登出布穀島社會員專區。', noindex: true },
  { id: 'privacy', title: `隱私權政策｜${NAME}`, desc: '布穀島社網站如何蒐集、使用與保護會員登入資料與個人檔案。' },
  { id: 'match', title: `需求媒合｜${NAME}`, desc: '社團提出需求、企業與教育組織提供資源：企業 CSR 與員工志工合作、教案改編成營隊版本，布穀島社協助教育服務性社團與資源單位媒合。' },
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
  if (!p.noindex) urls.push({ loc: url, priority: p.id ? '0.8' : '1.0' })
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
  // 麵包屑：社團介紹（布穀好朋友）在社團地圖底下，其他文章在專欄底下，和頁面上顯示的一致
  const parent = post.series === '布穀好朋友' ? { id: 'map', name: '社團地圖' } : { id: 'column', name: '專欄' }
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: parent.name, item: urlOf(parent.id) },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }
  write(`p/column/${post.id.slice(5)}.html`, render({ url, title, desc, image: image(post.cover), type: 'article', jsonld: [article, crumbs] }))
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
Disallow: /member
Disallow: /logout
Disallow: /uploads/templates/

Sitemap: ${SITE}/sitemap.xml
`)
console.log(`seo: ${PAGES.length} 個頁面、${POSTS.length} 篇文章（含社團介紹）、${EVENTS.length} 場活動，已產生 sitemap.xml 與 robots.txt（網址：${SITE}）`)
