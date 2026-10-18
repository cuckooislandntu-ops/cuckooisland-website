// 經營手冊頁：「教育服務性社團生存指南」
// ① 夜晚的荒島封面（火堆旁讀手冊的人、用炭畫上笑臉的椰子朋友）
// ② 書櫃：點章節名稱或左右滑動，一本一章；每章底下是一份份 Google 文件（後台「經營手冊」編輯，可換封面圖）
// ③ 使用說明
// 章節名稱、封面是公開的（後台「經營手冊」）；每一章的檔案和手冊資料夾只給審核通過的會員，
// 放在 Supabase 的 handbook_files、member_settings，用 Google 登入後才讀得到（src/lib/member.ts）。
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Empty } from '@/components/Chrome'
import EditLink from '@/components/EditLink'
import { SETTINGS } from '@/lib/content'
import type { Chapter, HandbookFile } from '@/lib/content'
import { to } from '@/lib/site'
import { MEMBER_ENABLED, fetchHandbook, isApproved, signIn, useMember } from '@/lib/member'
import type { HandbookRow } from '@/lib/member'

const RM = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const DEFAULT_CHAPTERS: Chapter[] = [
  { title: '招生與幹部培訓', tag: '生火', desc: '怎麼找到人、怎麼留住人。', points: ['招生文案與社博擺攤', '幹部分工怎麼排', '新幹部培訓流程'], files: [], cover: '', coverText: true },
  { title: '經費申請與核銷', tag: '找水源', desc: '補助計畫、預算表、收據整理。', points: ['常見的補助與贊助管道', '預算表怎麼編', '核銷與收據整理'], files: [], cover: '', coverText: true },
  { title: '教案與課程設計', tag: '搭營地', desc: '從教學目標到教案，附範本。', points: ['教學目標怎麼訂', '教案寫法與範本', '試教與修改'], files: [], cover: '', coverText: true },
  { title: '營隊安全與保險', tag: '避開危險', desc: '行前檢核、緊急應變、保險。', points: ['行前安全檢核表', '受傷、走失時怎麼處理', '保險怎麼保、保多少'], files: [], cover: '', coverText: true },
  { title: '與服務學校溝通', tag: '打信號', desc: '從第一次聯絡，到活動結束後的回饋。', points: ['第一封聯絡信怎麼寫', '行前要確認的事', '結束後的感謝與回饋'], files: [], cover: '', coverText: true },
  { title: '交接', tag: '留地圖', desc: '這一屆該留下什麼給下一屆。', points: ['交接清單', '帳號、檔案與財產', '寫給下一屆的話'], files: [], cover: '', coverText: true },
]
const COVERS = ['#F06A5A', '#F7C948', '#9EB14F', '#4FB5C0', '#B7A6D9', '#F4A7A0']

// 封面圖示：依章節順序輪替
const ICONS = [
  <path key="0" d="M12 21c-4 0-6-2.6-6-5.6 0-3 2.2-4.6 3-7.4 1.6 1.4 2 3 2 4.2.8-.6 1.6-2.4 1.4-5.2 3 2 5.6 5 5.6 8.4 0 3-2 5.6-6 5.6z" />,
  <path key="1" d="M12 3c3 4.4 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.6 6-11zM9.5 15a2.5 2.5 0 0 0 2.5 2.5" />,
  <path key="2" d="M3 20L12 4l9 16zM12 4v16M9 20l3-5 3 5" />,
  <path key="3" d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6zM12 9v6M9 12h6" />,
  <path key="4" d="M5 19V5M5 5c3-1.6 5 1.6 8 0s4-1 6 0v8c-2-1-3-1.6-6 0s-5-1.6-8 0" />,
  <path key="5" d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" />,
]

// 依章節名稱挑圖示和封面色，後台改了章節順序也不會配錯；認不出來的就依順序輪替
const KEYS = [/招生|幹部|培訓|人/, /經費|核銷|補助|預算|贊助/, /教案|課程|教學/, /安全|保險|急/, /溝通|學校|聯絡/, /交接|傳承/]
const look = (c: Chapter, i: number) => { const k = KEYS.findIndex(r => r.test(c.title)); return k >= 0 ? k : i % ICONS.length }

// 看的人是誰：off 預覽版、loading 確認中、out 沒登入、pending 審核中（或停權）、member 已通過
type Access = 'off' | 'loading' | 'out' | 'pending' | 'member'

export default function Handbook() {
  const m = useMember()
  const access: Access = !MEMBER_ENABLED ? 'off' : !m.ready ? 'loading' : !m.session ? 'out' : isApproved(m) ? 'member' : 'pending'
  const [hb, setHb] = useState<{ files: HandbookRow[]; folder: string } | null>(null)
  const [msg, setMsg] = useState('')
  const shelfRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (access !== 'member') { setHb(null); return }
    let alive = true
    fetchHandbook().then(d => alive && setHb(d), () => alive && setMsg('手冊檔案讀取失敗，請重新整理再試一次。'))
    return () => { alive = false }
  }, [access])

  const base = SETTINGS.chapters?.length ? SETTINGS.chapters : DEFAULT_CHAPTERS
  // 檔案依「第幾章」（書櫃上的編號）放進每一本書
  const chapters = useMemo<Chapter[]>(() => base.map((c, i) => ({
    ...c, files: (hb?.files || []).filter(f => f.chapter === i + 1).map(f => ({ title: f.title, url: f.url, date: f.date || '', scenes: f.scenes || [] })),
  })), [base, hb])
  const folder = hb?.folder || ''
  const gate: Gate = { access, folder, loaded: !!hb }
  const toShelf = () => shelfRef.current?.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' })

  return (
    <main className="page hb" id="main">
      <Hero gate={gate} onShelf={toShelf} onMsg={setMsg} msg={msg || (m.error && access === 'out' ? (m.error === 'NOT_ALLOWED' ? '這個 Google 帳號還沒有被核可，請改用申請時留的帳號登入。' : m.error) : '')} />
      <Shelf chapters={chapters} innerRef={shelfRef} gate={gate} />
      <Guide />
    </main>
  )
}

type Gate = { access: Access; folder: string; loaded: boolean }

// 還不能看檔案時，告訴對方下一步
function Locked({ access }: { access: Access }) {
  if (access === 'member') return null
  return (
    <div className="hb-lock">
      {access === 'out' && <><p>每一章的檔案只開放給島鏈會員。請用申請加入時留的 Google 帳號登入。</p><button className="hb-btn ink" type="button" onClick={() => void signIn()}>用 Google 登入</button></>}
      {access === 'pending' && <><p>你已經登入了，帳號還在等布穀島夥伴確認。開通後這裡就會出現檔案。</p><a className="hb-btn ink" href={to('member')}>查看會員狀態</a></>}
      {access === 'loading' && <p>確認登入狀態中⋯</p>}
      {access === 'off' && <p>每一章的檔案只開放給島鏈會員，正式網站登入後就能看到。</p>}
    </div>
  )
}

/* ---------- ① 荒島封面 ---------- */
function Hero({ gate, onShelf, onMsg, msg }: { gate: Gate; onShelf: () => void; onMsg: (s: string) => void; msg: string }) {
  const { access, folder } = gate
  const ref = useRef<HTMLElement>(null)
  // 捲出畫面時暫停火焰動畫，省電也讓下面的書櫃滑得更順
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-paused', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section className="hb-hero" ref={ref} aria-labelledby="hb-title">
      <div className="hb-hero-inner">
        <div className="hb-copy">
          <p className="hb-eyebrow">布穀島社 經營手冊・會員限定</p>
          <h1 id="hb-title"><span>教育服務性社團</span><span className="hb-big">生存指南</span></h1>
          <p className="hb-lede">招生、經費、教案、交接⋯⋯一屆屆撐過來的做法，都收在這座島上。接手的人，不用從零開始。</p>
          <div className="hb-actions">
            {access === 'member'
              ? folder
                ? <a className="hb-btn lime" href={folder} target="_blank" rel="noopener noreferrer">打開手冊</a>
                : <button className="hb-btn lime" type="button" onClick={onShelf}>翻開手冊</button>
              : access === 'out'
                ? <button className="hb-btn lime" type="button" onClick={() => void signIn()}>會員登入</button>
                : access === 'pending'
                  ? <a className="hb-btn lime" href={to('member')}>查看會員狀態</a>
                  : <button className="hb-btn lime" type="button" onClick={() => onMsg(access === 'off' ? '正式網站才能登入會員。' : '確認登入狀態中，請稍等一下。')}>會員登入</button>}
            <button className="hb-btn line" type="button" onClick={onShelf}>看看有哪些章節</button>
          </div>
          <p className="hb-status" role="status" aria-live="polite">{msg}</p>
        </div>
        <IslandNight />
      </div>
      <button className="hb-cue" type="button" onClick={onShelf} aria-label="往下看手冊書櫃">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </section>
  )
}

const STARS = [[18, 22, 1.2], [44, 54, .9], [70, 16, 1.4], [96, 40, .8], [128, 12, 1], [150, 58, 1.3], [176, 26, .9], [204, 48, 1.1], [232, 14, 1.4], [258, 66, .8], [338, 20, 1.2], [350, 70, .9], [22, 96, .8], [116, 86, 1], [206, 92, .8], [326, 104, 1.1], [270, 30, .9], [60, 120, .7]]

function IslandNight() {
  const ink = '#231F35', wood = '#7A5A35', sh = 'rgba(0,0,0,.28)'
  const ref = useRef<SVGSVGElement>(null)
  // 彩蛋：布穀鳥（按 C 叫出來）碰到火，火會熄掉；離開 1 秒後再燒起來
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let t = 0
    const hot = (e: Event) => {
      clearTimeout(t)
      if ((e as CustomEvent<{ touching: boolean }>).detail.touching) el.setAttribute('data-out', '')
      else t = window.setTimeout(() => el.removeAttribute('data-out'), 1000)
    }
    el.addEventListener('cuckoo:hot', hot)
    return () => { el.removeEventListener('cuckoo:hot', hot); clearTimeout(t) }
  }, [])
  return (
    <svg ref={ref} className="hb-scene" viewBox="0 0 360 230" role="img" aria-label="夜晚的小島上，一個人坐在火堆旁讀著生存指南，身邊坐著一顆用炭畫上笑臉的椰子朋友。">
      <defs>
        <radialGradient id="hbGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F7C948" stopOpacity=".5" />
          <stop offset=".55" stopColor="#F06A5A" stopOpacity=".16" />
          <stop offset="1" stopColor="#F06A5A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hbSeaFade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#1D4A5E" stopOpacity="0" />
          <stop offset=".14" stopColor="#1D4A5E" />
          <stop offset=".86" stopColor="#1D4A5E" />
          <stop offset="1" stopColor="#1D4A5E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 星星與月亮 */}
      {STARS.map(([x, y, r], i) => <circle key={i} className={i % 3 === 0 ? 'hb-twinkle' : undefined} style={{ animationDelay: `${(i % 5) * .7}s` }} cx={x} cy={y} r={r} fill="#FFFDF6" opacity=".85" />)}
      <circle cx="300" cy="44" r="16" fill="#FFFDF6" />
      <circle cx="307" cy="39" r="14" fill="#14152A" />
      {/* 海 */}
      <path className="hb-sea" d="M0 170h360v60H0z" fill="#1D4A5E" />
      <path d="M0 184q15-4 30 0t30 0 30 0 30 0M210 196q15-4 30 0t30 0 30 0 30 0 30 0M40 212q15-4 30 0t30 0 30 0" fill="none" stroke="#FFFDF6" strokeWidth="1.5" strokeLinecap="round" opacity=".22" />
      <path d="M290 182h16M294 190h10M288 200h20" stroke="#FFFDF6" strokeWidth="2" strokeLinecap="round" opacity=".35" />
      {/* 漂流瓶 */}
      <g className="hb-bob">
        <g transform="rotate(-18 92 196)">
          <rect x="80" y="190" width="22" height="11" rx="5" fill="#9FD3D6" opacity=".85" />
          <rect x="101" y="192.5" width="7" height="6" rx="1.5" fill="#9FD3D6" opacity=".85" />
          <rect x="107" y="192.5" width="4" height="6" rx="1" fill="#C9955A" />
          <rect x="85" y="193" width="11" height="5" rx="1" fill="#FFFDF6" />
        </g>
      </g>
      {/* 島 */}
      <path d="M24 178C70 148 290 148 338 178z" fill={sh} transform="translate(4 3)" />
      <path d="M24 178C70 148 290 148 338 178z" fill="#C8AE78" />
      <g className="hb-fire-glow"><circle className="hb-glow" cx="226" cy="156" r="96" fill="url(#hbGlow)" /></g>
      {/* 椰子樹 */}
      <path d="M72 168C68 138 60 110 50 84" fill="none" stroke={wood} strokeWidth="7" strokeLinecap="round" />
      <g fill="#4E6B1C">
        <path d="M50 84C32 74 16 78 6 92 22 84 36 84 50 84z" />
        <path d="M50 84C62 66 82 62 98 70 82 72 66 76 50 84z" />
        <path d="M50 84C42 62 28 54 14 56 28 62 40 72 50 84z" />
        <path d="M50 84C68 80 84 88 92 104 78 94 64 88 50 84z" />
        <path d="M50 84C52 64 62 50 74 46 64 58 56 70 50 84z" />
      </g>
      <circle cx="52" cy="89" r="3.4" fill="#5A3E22" /><circle cx="46" cy="90" r="3.4" fill="#5A3E22" />
      {/* 坐的木頭 */}
      <rect x="128" y="160" width="56" height="11" rx="5.5" fill={wood} />
      <circle cx="184" cy="165.5" r="5.5" fill="#A07A4A" /><circle cx="184" cy="165.5" r="2.2" fill="none" stroke={wood} strokeWidth="1.2" />
      {/* 讀手冊的人 */}
      <path d="M154 158L174 150 176 170" fill="none" stroke="#3B5A7A" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="180" cy="172" rx="5.5" ry="2.6" fill="#E9B48F" />
      <path d="M144 160L146 134Q156 124 166 132L168 160 163 156 158 161 153 156 148 161z" fill={sh} transform="translate(3 2)" />
      <path d="M144 160L146 134Q156 124 166 132L168 160 163 156 158 161 153 156 148 161z" fill="#F4A7A0" />
      <path d="M162 133L171 140" stroke="#F4A7A0" strokeWidth="7" strokeLinecap="round" />
      <circle cx="157" cy="116" r="10" fill="#E9B48F" />
      <path d="M147 116Q148 130 157 131Q166 130 167 116Q162 122 157 122Q152 122 147 116z" fill="#5A3E22" />
      <circle cx="162" cy="114" r="1.3" fill={ink} />
      <ellipse cx="157" cy="107" rx="15" ry="3.5" fill="#E3C770" />
      <path d="M149 107Q150 98 157 97Q164 98 165 107z" fill="#E3C770" />
      <path d="M149.5 104.5h15" stroke="#C9955A" strokeWidth="1.6" />
      <path d="M143 108l-2 2.5M171 108l2 2.5M146 109.5l-1 2.5" stroke="#E3C770" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M166 134L178 130 190 134V146L178 142 166 146z" fill="#D6EC6E" />
      <path d="M178 130v12" stroke={ink} strokeWidth="1.4" />
      <path d="M169 137l6-2M169 140l6-2M181 135l6 2M181 138l6 2" stroke="#6E8C25" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="170" cy="141" r="3" fill="#E9B48F" />
      {/* 火堆 */}
      <g fill="#6B6680"><ellipse cx="214" cy="172" rx="5" ry="3" /><ellipse cx="223" cy="175" rx="5" ry="3" /><ellipse cx="234" cy="175" rx="5" ry="3" /><ellipse cx="242" cy="172" rx="5" ry="3" /></g>
      <path d="M214 172l28-12M242 172l-28-12" stroke={wood} strokeWidth="4" strokeLinecap="round" />
      <g className="hb-fire" data-cuckoo-hot>
        <rect x="206" y="122" width="44" height="52" fill="transparent" />
        <path className="hb-flame f1" d="M228 171C212 171 212 156 220 146 221 154 225 156 226 152 226 141 232 133 237 128 235 140 246 147 243 160 241 167 236 171 228 171z" fill="#F06A5A" />
        <path className="hb-flame f2" d="M228 171C219 171 218 162 223 156 224 161 227 162 228 159 229 152 232 148 235 146 234 154 239 158 237 164 236 168 233 171 228 171z" fill="#F7C948" />
        <path className="hb-flame f3" d="M228 171C224 171 223 167 225 164 226 166 228 166 228 164 229 161 231 160 232 159 232 163 233 166 232 168 231 170 230 171 228 171z" fill="#FFFDF6" />
        <g fill="#F7C948"><circle className="hb-ember e1" cx="226" cy="138" r="1.4" /><circle className="hb-ember e2" cx="233" cy="132" r="1.2" /><circle className="hb-ember e3" cx="222" cy="128" r="1" /></g>
      </g>
      <g className="hb-smoke" fill="#B9B4C9"><circle cx="226" cy="160" r="4" /><circle cx="232" cy="150" r="5" /><circle cx="226" cy="138" r="6" /></g>
      {/* 椰子朋友：炭畫的笑臉 */}
      <circle cx="287" cy="163" r="13" fill={sh} />
      <circle cx="284" cy="160" r="13" fill="#7A5232" />
      <path d="M275 153l3 1M290 151l2 2M293 165l2-1M276 168l2 1" stroke="#5A3E22" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M272 158a13 13 0 0 1 5-8" fill="none" stroke="#F7C948" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <circle cx="279.5" cy="158" r="1.7" fill={ink} /><circle cx="288.5" cy="158" r="1.7" fill={ink} />
      <path d="M278.5 163.5Q284 168.5 289.5 163.5" fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M284 147C280 138 272 136 268 138 272 142 278 146 284 147z" fill="#9EB14F" />
      <path d="M284 147C288 136 296 134 300 137 296 142 290 146 284 147z" fill="#9EB14F" />
    </svg>
  )
}

/* ---------- ② 書櫃 ---------- */
const DAY = 864e5
const isNew = (d: string) => { const t = Date.parse(d); return !!d && !isNaN(t) && Date.now() - t <= 30 * DAY && t <= Date.now() + DAY }
const norm = (s: string) => s.toLowerCase().replace(/臺/g, '台').replace(/[\s・·、，,]/g, '')
const FileIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" /></svg>
const ExtIcon = () => <svg className="hb-ext" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>

function FileRow({ f, sub }: { f: HandbookFile; sub?: string }) {
  return (
    <li>
      <a href={f.url} target="_blank" rel="noopener noreferrer">
        <FileIcon />
        <span className="hb-file-main"><span>{f.title}{isNew(f.date) && <em className="hb-new">新</em>}</span>{sub && <small>{sub}</small>}</span>
        <ExtIcon />
        <span className="sr-only">（在新分頁開啟）</span>
      </a>
    </li>
  )
}

type FileHit = { f: HandbookFile; ch: number }
function Finder({ chapters, onJump }: { chapters: Chapter[]; onJump: (i: number) => void }) {
  const [q, setQ] = useState('')
  const [scene, setScene] = useState<string | null>(null)
  const all: FileHit[] = chapters.flatMap((c, ch) => c.files.map(f => ({ f, ch })))
  const scenes = [...new Set(all.flatMap(h => h.f.scenes))]
  const recent = all.filter(h => h.f.date).sort((a, b) => b.f.date.localeCompare(a.f.date)).slice(0, 4)
  const sub = (h: FileHit) => `第 ${h.ch + 1} 章・${chapters[h.ch].title}`
  const k = norm(q)

  let body: ReactNode = null
  if (scene) {
    const hits = all.filter(h => h.f.scenes.includes(scene))
    body = <><p className="hb-res-h">「{scene}」可以先看這些（{hits.length}）</p><ul className="hb-files">{hits.map((h, i) => <FileRow key={i} f={h.f} sub={sub(h)} />)}</ul></>
  } else if (k) {
    const files = all.filter(h => norm(h.f.title).includes(k))
    const chs = chapters.map((c, i) => {
      const why = [c.title, c.tag, c.desc, ...c.points].find(t => t && norm(t).includes(k))
      return why ? { i, why } : null
    }).filter((x): x is { i: number; why: string } => !!x)
    body = files.length + chs.length === 0
      ? <p className="hb-res-empty">找不到「{q.trim()}」。換個關鍵字，或直接翻下面的書櫃。</p>
      : <>
          <p className="hb-res-h">找到 {files.length + chs.length} 個結果</p>
          <ul className="hb-files">
            {files.map((h, i) => <FileRow key={'f' + i} f={h.f} sub={sub(h)} />)}
            {chs.map(({ i, why }) => (
              <li key={'c' + i}>
                <button type="button" onClick={() => onJump(i)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7" /></svg>
                  <span className="hb-file-main"><span>翻到第 {i + 1} 章〈{chapters[i].title}〉</span>{why !== chapters[i].title && <small>{why}</small>}</span>
                  <svg className="hb-ext" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
                </button>
              </li>
            ))}
          </ul>
        </>
  } else if (recent.length) {
    body = <><p className="hb-res-h">最近新增</p><ul className="hb-files">{recent.map((h, i) => <FileRow key={i} f={h.f} sub={`${sub(h)}・${+h.f.date.slice(5, 7)}/${+h.f.date.slice(8, 10)}`} />)}</ul></>
  }

  return (
    <div className="hb-find">
      <label className="hb-find-label" htmlFor="hb-q">找檔案</label>
      <div className="hb-search">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <input id="hb-q" type="search" value={q} autoComplete="off" enterKeyHint="search" placeholder="例如：預算表、家長同意書"
          onChange={e => { setQ(e.target.value); setScene(null) }} onKeyDown={e => { if (e.key === 'Escape') setQ('') }} />
        {q && <button type="button" className="hb-clear" onClick={() => setQ('')} aria-label="清除搜尋">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>}
      </div>
      {scenes.length > 0 && (
        <div className="hb-scenes" role="group" aria-label="依情境找">
          <span aria-hidden="true">依情境找</span>
          {scenes.map(sc => <button key={sc} type="button" className="hb-scene-chip" aria-pressed={scene === sc} onClick={() => { setScene(scene === sc ? null : sc); setQ('') }}>{sc}</button>)}
        </div>
      )}
      <div className="hb-results" aria-live="polite">{body && <div className="hb-res-card">{body}</div>}</div>
    </div>
  )
}

function Shelf({ chapters, innerRef, gate }: { chapters: Chapter[]; innerRef: React.RefObject<HTMLElement | null>; gate: Gate }) {
  const track = useRef<HTMLUListElement>(null)
  const chips = useRef<HTMLDivElement>(null)
  const detail = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const n = chapters.length

  const nearest = (el: HTMLElement) => {
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0, d = Infinity
    Array.from(el.children).forEach((c, i) => { const h = c as HTMLElement, dd = Math.abs(h.offsetLeft + h.offsetWidth / 2 - mid); if (dd < d) { d = dd; best = i } })
    return best
  }
  const goTo = (i: number, opts: { focus?: boolean; reveal?: boolean } = {}) => {
    const el = track.current, k = Math.max(0, Math.min(n - 1, i)), c = el?.children[k] as HTMLElement | undefined
    if (!el || !c) return
    el.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - el.clientWidth / 2, behavior: RM() ? 'auto' : 'smooth' })
    setActive(k)
    if (opts.focus) c.querySelector('button')?.focus({ preventScroll: true })
    if (opts.reveal) setTimeout(() => detail.current?.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'nearest' }), 60)
  }

  // 依捲動位置找出正中間那本書
  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const pick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setActive(nearest(el))) }
    el.addEventListener('scroll', pick, { passive: true })
    addEventListener('resize', pick)
    pick()
    return () => { el.removeEventListener('scroll', pick); removeEventListener('resize', pick); cancelAnimationFrame(raf) }
  }, [n])

  // 桌機：用滑鼠按住拖曳翻書（手機本來就能滑）
  useEffect(() => {
    const el = track.current
    if (!el) return
    let down = false, moved = false, sx = 0, sl = 0, t = 0
    const pd = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft }
    const pm = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - sx
      if (!moved && Math.abs(dx) > 6) { moved = true; clearTimeout(t); el.setAttribute('data-drag', ''); el.setPointerCapture(e.pointerId) }
      if (moved) el.scrollLeft = sl - dx
    }
    const pu = () => {
      if (!down) return
      down = false
      if (!moved) return
      const k = nearest(el), c = el.children[k] as HTMLElement
      el.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - el.clientWidth / 2, behavior: RM() ? 'auto' : 'smooth' })
      t = window.setTimeout(() => el.removeAttribute('data-drag'), 400)
    }
    // 拖完放開時不要順便觸發點擊
    const clk = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false } }
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu); el.addEventListener('click', clk, true)
    return () => { clearTimeout(t); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); el.removeEventListener('click', clk, true) }
  }, [n])

  // 章節按鈕列跟著目前的書捲動，選到的那顆保持在畫面裡
  useEffect(() => {
    const row = chips.current, chip = row?.children[active] as HTMLElement | undefined
    if (!row || !chip) return
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: RM() ? 'auto' : 'smooth' })
  }, [active])

  const onKey = (e: KeyboardEvent) => {
    const k = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: n - 1 }[e.key]
    if (k === undefined) return
    e.preventDefault(); goTo(k, { focus: true })
  }

  const ch = chapters[active] ?? chapters[0]
  return (
    <section className="hb-shelf" id="shelf" ref={innerRef} aria-labelledby="hb-shelf-title">
      <div className="hb-shelf-head">
        <h2 id="hb-shelf-title">手冊書櫃</h2>
        <p>直接搜尋，或翻翻下面的書：點章節名稱、左右滑動都可以。</p>
        <Finder chapters={chapters} onJump={i => goTo(i, { reveal: true })} />
      </div>

      <div className="hb-chips" ref={chips} role="group" aria-label="章節">
        {chapters.map((c, i) => (
          <button key={i} type="button" className="hb-chip" aria-pressed={i === active} onClick={() => goTo(i)}>
            <i>{String(i + 1).padStart(2, '0')}</i>{c.title}
          </button>
        ))}
      </div>

      <div className="hb-rack">
        <ul className="hb-track" ref={track} onKeyDown={onKey} aria-label="手冊章節封面，可左右滑動">
          {chapters.map((c, i) => (
            <li key={i} className="hb-book" data-active={i === active || undefined} style={{ ['--cover' as string]: COVERS[look(c, i)] }}>
              <button type="button" onClick={() => goTo(i, { reveal: i === active })} aria-label={`第 ${i + 1} 章：${c.title}${c.files.length ? `，${c.files.length} 份檔案` : ''}`} aria-current={i === active || undefined} tabIndex={i === active ? 0 : -1}>
                <span className="hb-spine" aria-hidden="true" />
                {c.files.some(f => isNew(f.date)) && <span className="hb-cover-new" aria-hidden="true">新</span>}
                {c.cover && <img className="hb-cover-img" src={c.cover} alt="" loading="lazy" decoding="async" draggable={false} />}
                <span className={'hb-cover' + (c.cover ? ' on-img' : '') + (c.cover && !c.coverText ? ' hidden-text' : '')} aria-hidden="true">
                  <span className="hb-no">{String(i + 1).padStart(2, '0')}</span>
                  {c.tag && <span className="hb-tag">{c.tag}</span>}
                  {c.cover ? <span /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[look(c, i)]}</svg>}
                  <span className="hb-ttl">{c.title}</span>
                  <span className="hb-imprint"><span>生存指南・布穀島社</span>{c.files.length > 0 && <span>{c.files.length} 份</span>}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="hb-nav">
        <button type="button" className="hb-arrow" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="上一章">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <span className="hb-count" aria-hidden="true">{active + 1} / {n}</span>
        <button type="button" className="hb-arrow" onClick={() => goTo(active + 1)} disabled={active === n - 1} aria-label="下一章">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      {ch && (
        <div className="hb-detail" aria-live="polite" key={active} ref={detail}>
          <p className="hb-detail-eyebrow">第 {active + 1} 章{ch.tag ? `・${ch.tag}` : ''}</p>
          <h3>{ch.title}</h3>
          {ch.desc && <p className="hb-detail-desc">{ch.desc}</p>}
          {ch.files.length > 0
            ? <>
                <p className="hb-files-h">這一章的檔案（{ch.files.length}）</p>
                <ul className="hb-files">{ch.files.map((f, j) => <FileRow key={j} f={f} />)}</ul>
              </>
            : <>
                {ch.points.length > 0 && <ul className="hb-points">{ch.points.map(p => <li key={p}>{p}</li>)}</ul>}
                {gate.access === 'member'
                  ? gate.loaded && <>
                      <p className="hb-note">這一章的檔案還在整理{gate.folder ? '，可以先到手冊資料夾看看' : ''}。</p>
                      {gate.folder && <a className="hb-btn ink" href={gate.folder} target="_blank" rel="noopener noreferrer">打開手冊資料夾</a>}
                    </>
                  : <Locked access={gate.access} />}
              </>}
        </div>
      )}
      <EditLink collection="handbook" label="在後台編輯章節與封面（檔案在 Supabase）" />
    </section>
  )
}

/* ---------- ③ 使用說明 ---------- */
function Guide() {
  return (
    <section className="hb-guide" aria-labelledby="hb-guide-title">
      <div className="content-inner">
        <div>
          <h2 id="hb-guide-title">使用說明</h2>
          <p className="section-lede">手冊放在線上，隨時更新。第一次打開前，先看這幾步。</p>
          <ol className="steps" style={{ marginTop: 14 }}>
            <li><div><b>先加入島鏈</b><span>手冊只開放給會員。先填<a href={to('join')}>會員申請表單</a>。</span></div></li>
            <li><div><b>用 Google 帳號登入網站</b><span>按「會員登入」，填好個人檔案。布穀島夥伴確認後就會開通，每一章的檔案會直接出現在書櫃上。</span></div></li>
            <li><div><b>遇到問題時查</b><span>依情境找章節，例如「第一次寫補助計畫」翻〈經費申請與核銷〉，「營隊前一週」翻〈營隊安全與保險〉。</span></div></li>
            <li><div><b>需要範本，到資料庫拿</b><span>預算表、家長同意書這類可以直接改的檔案，放在<a href={to('resources')}>資料庫</a>的「模板」分類。</span></div></li>
            <li><div><b>留言補上你們的做法</b><span>會員可以在手冊裡留言。你們社團的經驗，會整理進下一版，傳給下一屆。</span></div></li>
          </ol>
        </div>

        <details className="hb-help">
          <summary><h3>打不開手冊？</h3><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></summary>
          <ul>
            <li><b>登入後顯示「審核中」</b>：布穀島夥伴還在確認，通常幾天內完成。可以先到<a href={to('member')}>會員專區</a>把檔案填完整。</li>
            <li><b>登錯帳號</b>：到<a href={to('member')}>會員專區</a>登出，再用申請時留的 Google 帳號登入。</li>
            <li><b>打開檔案時看到「要求存取權」</b>：這份檔案的共用設定還沒開好，私訊我們，我們會盡快處理。</li>
          </ul>
          <p>還是不行，私訊 IG <a href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer">@cuckoo_island</a>。</p>
        </details>

        <Empty title="還不是會員？" action={<a className="btn primary" style={{ minHeight: 46, padding: '0 18px', fontSize: 15 }} href={to('join')}>申請加入島鏈</a>}>
          加入後就能打開整本生存指南，也能把你們社團的做法留給下一屆。
        </Empty>
      </div>
    </section>
  )
}
