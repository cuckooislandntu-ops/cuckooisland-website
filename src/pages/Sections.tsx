import { Suspense, lazy, useState } from 'react'
import { Empty, PageShell } from '@/components/Chrome'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { CLUBS, CLUB_INTROS, CLUB_SERIES, COLUMN_POSTS, EVENTS, REGION_LABEL, SERIES_INFO, STATUS_LABEL, eventStatus, weekday } from '@/lib/content'
import type { Event, Region, Series } from '@/lib/content'
import EditLink from '@/components/EditLink'
import { to } from '@/lib/site'
import MatchScene, { type Beat } from '@/components/MatchScene'
import SchoolCampForm from '@/components/SchoolCampForm'
import { PillTab, PillTabsList } from '@/components/PillTabs'
import { isApproved, useMember } from '@/lib/member'

const IG_URL = 'https://www.instagram.com/cuckoo_island/'
const ctaStyle = { minHeight: 46, padding: '0 18px', fontSize: 15 }



/* ---------- 社團地圖 ---------- */
const REGIONS: Region[] = ['north', 'central', 'south', 'east', 'abroad']
const ClubLeafletMap = lazy(() => import('@/components/ClubLeafletMap'))
const IG = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>

export function ClubMap() {
  const member = isApproved(useMember())
  const [region, setRegion] = useState<Region | null>(null)
  const [pick, setPick] = useState<string | null>(null)
  const shown = CLUBS.filter(c => !region || c.sites.some(s => s.region === region))
  // 選到的社團卡片會展開。等上一張收起的動畫（約 .28 秒）跑完再捲過去，位置才不會跑掉
  const reveal = (id: string) => setTimeout(() => document.getElementById('club-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 320)
  const choose = (id: string) => { const next = pick === id ? null : id; setPick(next); if (next) reveal(next) }
  return (
    <PageShell kind="map" title="社團地圖" tint="#CDEBEC" wide lede="全台教育服務性社團在哪裡服務、怎麼服務。點地圖上的點或社團名稱，展開看完整介紹。">
      {/* 手機：地圖在上、社團清單在下；電腦（960px 以上）：地圖固定在左邊，右邊捲動社團清單（樣式在 index.css「社團地圖：電腦版」） */}
      <div className="map-layout">
      <div className="sheet map-sheet">
        <div className="chips" role="group" aria-label="依服務地區篩選">
          <button type="button" className="chip" aria-pressed={region === null} onClick={() => setRegion(null)}>全部</button>
          {REGIONS.map(r => <button key={r} type="button" className="chip" aria-pressed={region === r} onClick={() => setRegion(r)}>{REGION_LABEL[r]}</button>)}
        </div>
        <Suspense fallback={<div className="osm-wrap"><div className="osm-map osm-loading">地圖載入中…</div></div>}>
          <ClubLeafletMap clubs={CLUBS} region={region} pick={pick} onPick={id => { setPick(id); reveal(id) }} />
        </Suspense>
        <ul className="legend" aria-label="圖例">
          {CLUBS.map(c => <li key={c.id}><button type="button" aria-pressed={pick === c.id} onClick={() => choose(c.id)}><i style={{ background: c.color }} />{c.name}</button></li>)}
        </ul>
        <p className="status" style={{ fontSize: 12.5 }}>點地圖上的圓點看據點介紹；點一下地圖後可以用滑鼠滾輪縮放。部分社團的據點每學期更換，沒有標在地圖上。</p>
      </div>

      <div className="map-list">
        <h2>{region ? REGION_LABEL[region] + '的社團' : '所有社團'}（{shown.length}）</h2>
        <p className="section-lede" style={{ marginTop: -6 }}>社團介紹整理自布穀島社 IG《布穀好朋友》系列，展開社團卡片，可以讀完整的一篇。</p>
        {/* 社團卡片：平常只顯示名稱、一句話、學校與據點名稱；點卡片或地圖上的點才展開服務內容、特色、社團介紹和 IG */}
        {shown.map(c => { const post = CLUB_INTROS.find(p => p.clubId === c.id); const open = pick === c.id; return (
          <article key={c.id} id={'club-' + c.id} className={'club' + (open ? ' lit open' : '')} style={{ ['--club' as any]: c.color }}>
            <div className="club-head">
              <h3><button type="button" className="club-toggle" aria-expanded={open} aria-controls={'club-more-' + c.id} onClick={() => choose(c.id)}>{c.name}<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6l4 4 4-4" /></svg></button></h3>
              <p className="club-tag">{c.tagline}</p>
              <p className="club-meta"><span>{c.school}</span>{c.size && <span>{c.size}</span>}</p>
              {c.sites.length > 0 && <p className="club-where">{c.sites.map(s => s.name).join('、')}</p>}
            </div>
            <div className="club-more" id={'club-more-' + c.id} inert={!open}>
              <div>
                <div className="entry-top">
                  {c.types.map(t => <span key={t} className="sub-tag">{t}</span>)}
                  {post && <span className="sub-tag">{post.series} {post.ep}</span>}
                </div>
                <ul className="sites">
                  {c.sites.map(s => <li key={s.name}><b>{s.name}{s.region && <em>{REGION_LABEL[s.region]}</em>}</b><span>{s.detail}</span></li>)}
                </ul>
                <ul className="highlights">{c.highlights.map(h => <li key={h}>{h}</li>)}</ul>
                {post && (
                  <a className="club-intro" href={to(post.id)}>
                    {post.cover && <img src={post.cover} alt="" loading="lazy" />}
                    <span><em>社團介紹 {post.ep}</em><b>{post.title}</b>{(post.sum || post.hook) && <small>{post.sum || post.hook}</small>}<i>閱讀社團介紹</i></span>
                  </a>
                )}
                {c.partial && <p className="status">這個社團的介紹還在整理，內容可能不完整。</p>}
                {c.ig && <div className="entry-foot"><a className="ig club-ig" href={`https://www.instagram.com/${c.ig}/`} target="_blank" rel="noopener noreferrer"><IG />@{c.ig}</a></div>}
                <EditLink collection="clubs" id={c.id} label="編輯社團資料" />
              </div>
            </div>
          </article>
        ) })}
        {member
          ? <Empty title="你們的社團還沒在地圖上？" action={<a className="btn primary" style={ctaStyle} href={IG_URL} target="_blank" rel="noopener noreferrer">私訊 IG 告訴我們</a>}>
              跟我們說一聲，我們會和你們一起整理社團訪談，經你們審稿後放上地圖，也寫成一篇社團介紹。
            </Empty>
          : <Empty title="你們的社團也想出現在這裡？" action={<a className="btn primary" style={ctaStyle} href={to('join')}>申請加入島鏈</a>}>
              加入島鏈後，我們會和你們一起整理社團訪談，經你們審稿後放上地圖，也寫成一篇社團介紹。
            </Empty>}
      </div>
      </div>
    </PageShell>
  )
}

/* ---------- 活動 ---------- */
function EventCard({ e }: { e: Event }) {
  const st = eventStatus(e)
  return (
    <a className="event event-link" href={to(e.id)}>
      <div className="event-date"><b>{+e.date.slice(5, 7)}/{+e.date.slice(8, 10)}</b><span>{e.date.slice(0, 4)} · {weekday(e.date)}</span></div>
      <div>
        <div className="entry-top"><span className={'cat-badge st-' + st}>{STATUS_LABEL[st]}</span><span className="sub-tag">{e.type}</span>{e.ep && <span className="sub-tag">{e.ep}</span>}</div>
        <h3>{e.title}</h3>
        {e.sum && <p className="entry-desc">{e.sum}</p>}
        <dl className="facts">
          {e.time && <><dt>時間</dt><dd>{e.time}</dd></>}
          {e.place && <><dt>地點</dt><dd>{e.place}</dd></>}
        </dl>
        <span className="read-more">{st === 'open' ? '看詳情與報名' : st === 'past' ? (e.recap ? '看活動紀錄' : '看活動資訊') : '看活動詳情'}<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5" /></svg></span>
      </div>
    </a>
  )
}

export function Events() {
  const coming = EVENTS.filter(e => eventStatus(e) !== 'past').sort((a, b) => a.date.localeCompare(b.date))
  const past = EVENTS.filter(e => eventStatus(e) === 'past')
  return (
    <PageShell kind="events" title="活動" tint="#DDD3F0" lede="交流小聚、幹部培訓與聯合活動的報名資訊，以及過去活動的紀錄。">
      <Tabs defaultValue={coming.length ? 'open' : 'past'}>
        <PillTabsList cols={2} aria-label="活動分頁">
          <PillTab value="open">報名中・即將舉行</PillTab>
          <PillTab value="past">活動紀錄</PillTab>
        </PillTabsList>
        <TabsContent value="open" className="mt-5" style={{ display: 'grid', gap: 12 }}>
          {coming.map(e => <EventCard key={e.id} e={e} />)}
          {coming.length === 0 && <Empty title="目前沒有開放報名的活動" action={<a className="btn primary" style={{ minHeight: 46, padding: '0 18px', fontSize: 15 }} href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer">追蹤 IG，第一時間收到通知</a>}>
            新活動會先公布在 IG @cuckoo_island。每場活動都會寫清楚時間、地點、適合對象和報名方式。
          </Empty>}
        </TabsContent>
        <TabsContent value="past" className="mt-5" style={{ display: 'grid', gap: 12 }}>
          {past.map(e => <EventCard key={e.id} e={e} />)}
          {past.length === 0 && <p className="status">還沒有活動紀錄。</p>}
        </TabsContent>
      </Tabs>
      <EditLink collection="events" label="在後台新增或編輯活動" />
    </PageShell>
  )
}

/* ---------- 專欄 ---------- */
// 《布穀好朋友》社團介紹搬到社團地圖，專欄只列其他系列
export function Column() {
  const member = isApproved(useMember())
  const [f, setF] = useState<string | null>(null)
  const list = COLUMN_POSTS.filter(p => !f || p.series === f)
  const series = (Object.keys(SERIES_INFO) as Series[]).filter(k => k !== CLUB_SERIES && COLUMN_POSTS.some(p => p.series === k))
  return (
    <PageShell kind="column" title="專欄" tint="#F3E2B8" lede="服務現場的故事，和我們實際評過的教學資源。各社團的介紹在社團地圖。">
      <div className="chips" role="group" aria-label="專欄系列">
        <button type="button" className="chip" aria-pressed={f === null} onClick={() => setF(null)}>全部</button>
        {series.map(k => <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(f === k ? null : k)}>{k}（{SERIES_INFO[k].label}）</button>)}
      </div>
      <div className="entries">
        {list.map(p => (
          <a key={p.id} className="entry post-card" href={to(p.id)}>
            {p.cover && <img className="post-cover" src={p.cover} alt="" loading="lazy" />}
            <div className="entry-top"><span className="cat-badge" style={{ background: SERIES_INFO[p.series].color }}>{p.series} {p.ep}</span>{p.date && <span className="sub-tag">{+p.date.slice(5, 7)} 月 {+p.date.slice(8)} 日</span>}</div>
            <h3>{p.title}</h3>
            <p className="entry-desc">{p.sum}</p>
            <span className="read-more">閱讀全文<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5" /></svg></span>
          </a>
        ))}
      </div>
      <p className="status">想認識各個社團？社團介紹都在<a href={to('map')}>社團地圖</a>。</p>
      <Empty title="想寫你們社團的故事？" action={member
        ? <a className="btn primary" style={ctaStyle} href={IG_URL} target="_blank" rel="noopener noreferrer">私訊 IG 投稿</a>
        : <a className="btn primary" style={ctaStyle} href={to('join')}>申請加入島鏈</a>}>
        帶營隊時印象最深的一刻、社團撐過的難關、交接時想對學弟妹說的話，都歡迎寫下來。
      </Empty>
    </PageShell>
  )
}

/* ---------- 需求媒合 ---------- */
/* 四個角色：社團、學校、企業、教育組織。每個分頁有一段三拍的動畫（beats）、合作重點（items）。文字直接改這裡；
   動畫畫面在 src/components/MatchScene.tsx，學校的需求表單在 src/components/SchoolCampForm.tsx。 */
const PARTNERS = {
  club: {
    tab: '社團',
    title: '缺什麼，說出來，島鏈一起接住',
    lede: '缺講師、缺物資、缺合作的學校……社團不必再一個人扛。把需要說清楚，布穀島社會從企業、教育組織、學校和其他社團裡，找到接得住的人。',
    beats: [
      { h: '說出你們的需要', p: '講師、志工、物資、場地，或想找合作的學校。' },
      { h: '布穀島社串起資源', p: '企業、教育組織和學校，都在同一條島鏈上。' },
      { h: '不用自己扛了', p: '資源接上之後，社團專心把營隊帶好。' },
    ],
    items: [
      { h: '提出需求', p: '缺講師、志工、物資、器材或場地時，布穀島社協助從會員、合作單位與資料庫裡找。' },
      { h: '接到學校的營隊邀請', p: '學校在這一頁提出營隊需求，我們會把地區、時間和主題合適的邀請轉給你們。' },
      { h: '用到改編好的教案', p: '教育組織的課堂教案，可以一起改成適合營隊的版本，混齡、時間更短也能用。' },
      { h: '加入島鏈，消息先到', p: '會員會優先收到活動與贊助品的消息，也能用布穀島社的名義對外聯絡。' },
    ],
    note: '社團的需求表單準備中，現在可以先到 IG 私訊我們。',
  },
  school: {
    tab: '學校',
    title: '想讓孩子有一場營隊？說說你們的需要',
    lede: '全台有上千個教育服務性社團，每年寒暑假都在找願意一起合作的學校。告訴我們方便的時間、想要的主題和孩子的樣子，我們幫你找到合適的社團。',
    beats: [
      { h: '學校舉手', p: '填下方便的時間、想要的主題和孩子的樣子。' },
      { h: '布穀島社配對', p: '從島鏈的社團裡，找地區、時間和主題都合適的。' },
      { h: '社團帶營隊來', p: '雙方討論細節後，社團帶著準備好的營隊抵達。' },
    ],
    items: [
      { h: '不用自己一間間找', p: '學校只要說清楚需要什麼，布穀島社會從島鏈的社團裡找合適的對象，再介紹你們認識。' },
      { h: '營隊依孩子設計', p: '社團會依年級、人數、孩子的興趣和需要留意的地方設計活動，混齡也可以。' },
      { h: '學校負擔不大', p: '多數社團自行準備教案、教材與人力；學校可以視情況提供場地、午餐或住宿等協助。' },
    ],
    note: '每個社團的服務方式、地區與費用不同，配對時會先說明清楚，再由學校決定。',
  },
  company: {
    tab: '企業',
    title: '和社團合作，讓 CSR 落在真實的服務現場',
    lede: '教育服務性社團每年寒暑假都在偏鄉、部落和各地國小帶營隊。企業的投入，可以直接變成孩子身邊的一場營隊、一份教材、一段陪伴。',
    beats: [
      { h: '企業提出資源', p: '經費、物資，或想帶著員工一起當志工。' },
      { h: '找到合適的社團', p: '依地區、服務對象和時間，配對到對的社團。' },
      { h: '營隊發生，成果回來', p: '資源用在孩子身上，紀錄與回饋送回企業。' },
    ],
    items: [
      { h: '具體的社會責任', p: '贊助營隊經費、物資或場地，每一筆都對應到一個社團、一個服務地點和一群孩子，不只是捐款數字。' },
      { h: '員工志工合作', p: '企業若有員工志工或志工時數的規劃，可以和社團一起設計：營隊的專業分享、職涯講座、陪伴活動，或在社團行前培訓擔任講師。' },
      { h: '成果看得見', p: '社團可以提供服務紀錄、照片與孩子的回饋，方便放進 ESG 或永續報告、內部分享與對外溝通。' },
      { h: '一次找到多個社團', p: '透過布穀島社，不必一間一間聯絡，就能依地區、服務對象和時間找到適合長期合作的社團。' },
    ],
    note: '合作細節（形式、時數、成果怎麼紀錄）會在媒合時和社團一起確認。',
  },
  org: {
    tab: '教育組織',
    title: '讓你們的教材與資源，走進更多營隊',
    lede: '許多優秀的教案與教材是為學校課堂設計的；社團則常常需要好資源，卻不知道去哪裡找。我們幫兩邊接上線。',
    beats: [
      { h: '課堂教案', p: '原本為 40 分鐘、同一個年級的課堂設計。' },
      { h: '一起改成營隊版', p: '布穀島社和組織一起調整成混齡、時間更短的活動。' },
      { h: '走進營隊', p: '社團把教案帶到各地營隊，孩子用得上。' },
    ],
    items: [
      { h: '資源被實際用上', p: '社團會把教材帶進營隊，服務偏鄉與各地的孩子，讓資源觸及原本接觸不到的地方，發揮更大的影響力。' },
      { h: '協助改成營隊版本', p: '營隊常是混齡、時間更短、活動更密集。布穀島社可以和組織一起，把課堂教案調整成適合營隊的形式。' },
      { h: '來自現場的回饋', p: '社團用過之後，會整理孩子的反應和帶活動時遇到的狀況，回饋給組織作為改版參考。' },
      { h: '被更多社團看見', p: '資源可以收錄進布穀島社的資料庫，或寫成《布可不資道》專欄，讓全台的社團幹部找得到、用得上。' },
    ],
    note: '教案調整需要組織同意，改編後的版本也會標註原始出處。',
  },
} as const
type PartnerKey = keyof typeof PARTNERS
const ROLE_KEYS = Object.keys(PARTNERS) as PartnerKey[]
// 與首頁「一次服務的三個面向」同色：學生社團鮭魚粉、贊助單位金黃、教育組織水藍；學校用首頁孩子的淡紫
const ROLE_COLOR: Record<PartnerKey, string> = { club: '#F4A7A0', school: '#B7A6D9', company: '#F7C948', org: '#6FCFD5' }
const IG_LINK = 'https://www.instagram.com/cuckoo_island/'

function RoleCta({ k, formOpen, openForm }: { k: PartnerKey; formOpen: boolean; openForm: () => void }) {
  const member = isApproved(useMember())
  if (k === 'club') return (
    <div className="role-cta">
      {member ? <a className="btn primary" href={to('member')}>到會員專區</a> : <a className="btn primary" href={to('join')}>申請加入島鏈</a>}
      <a className="btn ghost" href={IG_LINK} target="_blank" rel="noopener noreferrer">到 IG 私訊提出需求</a>
    </div>
  )
  if (k === 'school') return formOpen
    ? <div className="sf-wrap"><h3 className="sf-title">學校營隊需求</h3><SchoolCampForm /></div>
    : <div className="sf-open"><button className="btn primary" type="button" aria-expanded={false} onClick={openForm}>填寫營隊需求</button><span>約 3 分鐘，四個段落，填完會產生一張需求卡</span></div>
  return <div className="role-cta"><a className="btn primary" href={IG_LINK} target="_blank" rel="noopener noreferrer">到 IG 私訊聊聊合作</a></div>
}

function Roles({ role, setRole }: { role: PartnerKey; setRole: (r: PartnerKey) => void }) {
  const [formOpen, setFormOpen] = useState(false)
  const switchTo = (r: PartnerKey) => { setRole(r); requestAnimationFrame(() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  return (
    <section id="roles" className="roles" aria-labelledby="roles-title">
      <div>
        <h2 id="roles-title">你是哪一種角色？</h2>
        <p className="section-lede">選一個，看看可以怎麼和教育服務性社團一起合作。</p>
      </div>
      <Tabs value={role} onValueChange={v => setRole(v as PartnerKey)}>
        <PillTabsList cols={ROLE_KEYS.length} aria-label="選擇你的角色" className="role-tabs">
          {ROLE_KEYS.map(k => <PillTab key={k} value={k}><i className="role-dot" style={{ background: ROLE_COLOR[k] }} aria-hidden="true" />{PARTNERS[k].tab}</PillTab>)}
        </PillTabsList>
        {ROLE_KEYS.map(k => { const d = PARTNERS[k]; return (
          <TabsContent key={k} value={k} className="mt-5">
            <div className={'sheet partner-sheet role-' + k}>
              <h3>{d.title}</h3>
              <p className="partner-lede">{d.lede}</p>
              <MatchScene role={k} beats={d.beats as unknown as Beat[]} label={d.tab + '的合作流程：' + d.beats.map(b => b.h).join('、')} />
              <ul className="partner-list">
                {d.items.map(it => <li key={it.h}><b>{it.h}</b><span>{it.p}</span></li>)}
              </ul>
              <p className="status">{d.note}</p>
              <RoleCta k={k} formOpen={formOpen} openForm={() => setFormOpen(true)} />
            </div>
            <nav className="role-others" aria-label="看看其他角色">
              <span>看看其他角色</span>
              {ROLE_KEYS.filter(o => o !== k).map(o => (
                <button key={o} type="button" className="chip" onClick={() => switchTo(o)}><i className="role-dot" style={{ background: ROLE_COLOR[o] }} aria-hidden="true" />{PARTNERS[o].tab}</button>
              ))}
            </nav>
          </TabsContent>
        ) })}
      </Tabs>
    </section>
  )
}

export function Match() {
  const [role, setRole] = useState<PartnerKey>(() => {
    try { const r = new URLSearchParams(window.location.search).get('role'); return r && r in PARTNERS ? (r as PartnerKey) : 'club' } catch { return 'club' }
  })
  return (
    <PageShell kind="match" title="服務需求媒合" tint="#BFE3E6" lede="社團、學校、企業和教育組織，在這裡找到彼此。">
      <Roles role={role} setRole={setRole} />
      <section aria-labelledby="how-title">
        <h2 id="how-title">媒合怎麼進行</h2>
        <p className="section-lede">不論你是哪一種角色，都是這四步。</p>
        <ol className="steps" style={{ marginTop: 12 }}>
          <li><div><b>說出需要或可以提供的</b><span>需要什麼、什麼時候、在哪裡；或能提供什麼資源。</span></div></li>
          <li><div><b>布穀島社協助配對</b><span>從島鏈的社團、合作單位與資料庫裡，找合適的對象。</span></div></li>
          <li><div><b>雙方直接對接</b><span>我們介紹雙方認識，細節由你們一起約定。</span></div></li>
          <li><div><b>完成後分享回饋</b><span>留下紀錄與心得，讓下一次媒合更順利。</span></div></li>
        </ol>
      </section>
      <Empty title="還不確定自己適合哪一種？" action={<a className="btn primary" style={{ minHeight: 46, padding: '0 18px', fontSize: 15 }} href={IG_LINK} target="_blank" rel="noopener noreferrer">到 IG 私訊我們</a>}>
        講師、個人志工，或想用其他方式支持教育服務性社團，都歡迎直接聊聊。
      </Empty>
    </PageShell>
  )
}
