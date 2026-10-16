import { Suspense, lazy, useState } from 'react'
import { Empty, PageShell } from '@/components/Chrome'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CLUBS, POSTS, REGION_LABEL, SERIES_INFO } from '@/lib/content'
import type { Region, Series } from '@/lib/content'

const tabsListCls = 'grid w-full h-auto p-1 rounded-2xl bg-[#F3E2B8]'
const tabCls = 'min-h-[44px] rounded-xl text-[15px] font-bold data-[state=active]:bg-[#231F35] data-[state=active]:text-[#D6EC6E]'


/* ---------- 社團地圖 ---------- */
const REGIONS: Region[] = ['north', 'central', 'south', 'east', 'abroad']
const ClubLeafletMap = lazy(() => import('@/components/ClubLeafletMap'))
const IG = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>

export function ClubMap() {
  const [region, setRegion] = useState<Region | null>(null)
  const [pick, setPick] = useState<string | null>(null)
  const shown = CLUBS.filter(c => !region || c.sites.some(s => s.region === region))
  const choose = (id: string) => { setPick(pick === id ? null : id); setTimeout(() => document.getElementById('club-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50) }
  return (
    <PageShell kind="map" title="社團地圖" tint="#CDEBEC" lede="全台教育服務性社團在哪裡服務、怎麼服務。點地圖上的點，看看是哪個社團。">
      <div className="sheet map-sheet">
        <div className="chips" role="group" aria-label="依服務地區篩選">
          <button type="button" className="chip" aria-pressed={region === null} onClick={() => setRegion(null)}>全部</button>
          {REGIONS.map(r => <button key={r} type="button" className="chip" aria-pressed={region === r} onClick={() => setRegion(r)}>{REGION_LABEL[r]}</button>)}
        </div>
        <Suspense fallback={<div className="osm-wrap"><div className="osm-map osm-loading">地圖載入中…</div></div>}>
          <ClubLeafletMap clubs={CLUBS} region={region} pick={pick} onPick={id => { setPick(id); setTimeout(() => document.getElementById('club-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50) }} />
        </Suspense>
        <ul className="legend" aria-label="圖例">
          {CLUBS.map(c => <li key={c.id}><button type="button" aria-pressed={pick === c.id} onClick={() => choose(c.id)}><i style={{ background: c.color }} />{c.name}</button></li>)}
        </ul>
        <p className="status" style={{ fontSize: 12.5 }}>點地圖上的圓點看據點介紹；點一下地圖後可以用滑鼠滾輪縮放。部分社團的據點每學期更換，沒有標在地圖上。</p>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <h2>{region ? REGION_LABEL[region] + '的社團' : '所有社團'}（{shown.length}）</h2>
        <p className="section-lede" style={{ marginTop: -6 }}>社團介紹整理自布穀島社 IG《布穀好朋友》系列。</p>
        {shown.map(c => { const post = POSTS.find(p => p.clubId === c.id); return (
          <article key={c.id} id={'club-' + c.id} className={'club' + (pick === c.id ? ' lit' : '')} style={{ ['--club' as any]: c.color }}>
            <div className="club-head">
              <h3>{c.name}</h3>
              <p className="club-tag">{c.tagline}</p>
              <div className="entry-top">
                {c.types.map(t => <span key={t} className="sub-tag">{t}</span>)}
                {post?.series === '布穀好朋友' && <span className="sub-tag">{post.series} {post.ep}</span>}
              </div>
              <p className="club-meta"><span>{c.school}</span>{c.size && <span>{c.size}</span>}</p>
            </div>
            <ul className="sites">
              {c.sites.map(s => <li key={s.name}><b>{s.name}{s.region && <em>{REGION_LABEL[s.region]}</em>}</b><span>{s.detail}</span></li>)}
            </ul>
            <ul className="highlights">{c.highlights.map(h => <li key={h}>{h}</li>)}</ul>
            {c.partial && <p className="status">這個社團的介紹還在整理，內容可能不完整。</p>}
            <div className="entry-foot">
              {c.ig ? <a className="ig club-ig" href={`https://www.instagram.com/${c.ig}/`} target="_blank" rel="noopener noreferrer"><IG />@{c.ig}</a> : <span />}
              {post && <a className="open-link" href={'#' + post.id}>完整介紹</a>}
            </div>
          </article>
        ) })}
        <Empty title="你們的社團也想出現在這裡？" action={<a className="btn primary" style={{ minHeight: 46, padding: '0 18px', fontSize: 15 }} href="#join">申請加入島鏈</a>}>
          申請加入島鏈時填寫社團訪談文件，經你們審稿後，我們會把社團整理到地圖上，也寫成《布穀好朋友》專欄。
        </Empty>
      </div>
    </PageShell>
  )
}

/* ---------- 經營手冊 ---------- */
const CHAPTERS = [
  ['招生與幹部培訓', '怎麼找到人、怎麼留住人'],
  ['經費申請與核銷', '補助計畫、預算表、收據整理'],
  ['教案與課程設計', '從目標到教案，附範本'],
  ['營隊安全與保險', '行前檢核、緊急應變、保險'],
  ['與服務學校溝通', '第一次聯絡到活動結束後的回饋'],
  ['交接', '這一屆該留下什麼給下一屆'],
]
export function Handbook() {
  const [msg, setMsg] = useState('')
  return (
    <PageShell kind="handbook" title="社團經營手冊" tint="#E6F1B5" lede="把一屆屆累積下來的做法整理成手冊，接手的人不用從零開始。">
      <div className="sheet" style={{ display: 'grid', gap: 12 }}>
        <h2>打開手冊</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>手冊放在線上，隨時更新。會員可以留言補充自己社團的做法。</p>
        <button className="btn primary" type="button" onClick={() => setMsg('手冊網址還沒設定，上線時這顆按鈕會直接打開手冊。')}>打開經營手冊</button>
        <p className="status" role="status" aria-live="polite">{msg}</p>
      </div>
      <div>
        <h2>手冊裡有什麼</h2>
        <p className="section-lede">預計的章節，內容會依各社團的經驗持續補充。</p>
        <ol className="toc" style={{ marginTop: 14 }}>
          {CHAPTERS.map(([t, d], i) => <li key={t}><i>第 {i + 1} 章</i><div><b>{t}</b><span>{d}</span></div></li>)}
        </ol>
      </div>
      <div>
        <h2>怎麼用最順手</h2>
        <div className="paths" style={{ marginTop: 14 }}>
          <div className="path" style={{ background: 'var(--cream)', boxShadow: 'var(--shadow-riso)' }}><h3>遇到問題時查</h3><p>依情境找章節，例如「第一次寫補助計畫」或「營隊前一週」。</p></div>
          <div className="path" style={{ background: 'var(--cream)', boxShadow: 'var(--shadow-riso)' }}><h3>直接拿範本</h3><p>預算表、家長同意書、交接清單，下載後改成自己社團的版本。</p></div>
        </div>
      </div>
    </PageShell>
  )
}

/* ---------- 活動 ---------- */
export function Events() {
  return (
    <PageShell kind="events" title="活動" tint="#DDD3F0" lede="交流小聚、幹部培訓與聯合活動的報名資訊，以及過去活動的紀錄。">
      <Tabs defaultValue="open">
        <TabsList className={tabsListCls + ' grid-cols-2'}>
          <TabsTrigger value="open" className={tabCls}>報名中</TabsTrigger>
          <TabsTrigger value="past" className={tabCls}>活動紀錄</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-5">
          <Empty title="目前沒有開放報名的活動" action={<a className="btn primary" style={{ minHeight: 46, padding: '0 18px', fontSize: 15 }} href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer">追蹤 IG，第一時間收到通知</a>}>
            新活動會先公布在 IG @cuckoo_island。每場活動都會寫清楚時間、地點、適合對象和報名方式。
          </Empty>
        </TabsContent>
        <TabsContent value="past" className="mt-5" style={{ display: 'grid', gap: 12 }}>
          <article className="event">
            <div className="event-date"><b>4/26</b><span>2026 · 日</span></div>
            <div>
              <div className="entry-top"><span className="sub-tag">CUCKOO ACTIVITY EP.1</span><span className="sub-tag">已結束</span></div>
              <h3>布穀島社交流小聚</h3>
              <p className="entry-desc">一場屬於教育服務性社團的溫暖交流，全程免費，還有小禮物。</p>
              <dl className="facts">
                <dt>時間</dt><dd>13:30–16:30</dd>
                <dt>地點</dt><dd>台大第二活動中心 701 教室</dd>
                <dt>對象</dt><dd>台大、師大、台科大教育服務性社團的現任或曾任幹部，辦理國小、國中教育服務營隊的社團</dd>
                <dt>名額</dt><dd>16 位</dd>
              </dl>
            </div>
          </article>
          <p className="status">之後會在這裡補上活動照片與參與社團的心得。</p>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

/* ---------- 專欄 ---------- */
export function Column() {
  const [f, setF] = useState<string | null>(null)
  const list = POSTS.filter(p => !f || p.series === f)
  const series = (Object.keys(SERIES_INFO) as Series[]).filter(k => POSTS.some(p => p.series === k))
  return (
    <PageShell kind="column" title="專欄" tint="#F3E2B8" lede="服務現場的故事、社團的樣子，和我們實際評過的教學資源。">
      <div className="chips" role="group" aria-label="專欄系列">
        <button type="button" className="chip" aria-pressed={f === null} onClick={() => setF(null)}>全部</button>
        {series.map(k => <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(f === k ? null : k)}>{k}（{SERIES_INFO[k].label}）</button>)}
      </div>
      <div className="entries">
        {list.map(p => (
          <a key={p.id} className="entry post-card" href={'#' + p.id}>
            {p.cover && <img className="post-cover" src={p.cover} alt="" loading="lazy" />}
            <div className="entry-top"><span className="cat-badge" style={{ background: SERIES_INFO[p.series].color }}>{p.series} {p.ep}</span>{p.date && <span className="sub-tag">{+p.date.slice(5, 7)} 月 {+p.date.slice(8)} 日</span>}</div>
            <h3>{p.title}</h3>
            <p className="entry-desc">{p.sum}</p>
            <span className="read-more">閱讀全文<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5" /></svg></span>
          </a>
        ))}
      </div>
      <Empty title="想寫你們社團的故事？" action={<a className="btn primary" style={{ minHeight: 46, padding: '0 18px', fontSize: 15 }} href="#join">申請加入島鏈</a>}>
        帶營隊時印象最深的一刻、社團撐過的難關、交接時想對學弟妹說的話，都歡迎寫下來。
      </Empty>
    </PageShell>
  )
}

/* ---------- 需求媒合 ---------- */
export function Match() {
  const [msg, setMsg] = useState('')
  const soon = () => setMsg('媒合表單準備中，上線後填完就會由布穀島社協助配對。')
  return (
    <PageShell kind="match" title="服務需求媒合" tint="#BFE3E6" lede="社團、學校和資源單位，在這裡找到彼此。">
      <div className="paths">
        <div className="path" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
          <h3 style={{ color: 'var(--lime)' }}>我需要幫忙</h3>
          <p>給社團或服務學校。</p>
          <ul><li>缺講師、缺志工</li><li>缺物資、器材或場地</li><li>想找可以合作的社團</li></ul>
          <button className="btn" style={{ background: 'var(--lime)', color: 'var(--ink)', marginTop: 6 }} type="button" onClick={soon}>提出需求</button>
        </div>
        <div className="path" style={{ background: 'var(--cream)', boxShadow: 'var(--shadow-riso)' }}>
          <h3>我可以提供</h3>
          <p>給資源單位、講師或個人。</p>
          <ul><li>經費、物資、場地</li><li>專業分享或培訓</li><li>長期合作的機會</li></ul>
          <button className="btn primary" style={{ marginTop: 6 }} type="button" onClick={soon}>提供資源</button>
        </div>
      </div>
      <p className="status" role="status" aria-live="polite">{msg}</p>
      <div>
        <h2>媒合怎麼進行</h2>
        <ol className="steps" style={{ marginTop: 12 }}>
          <li><div><b>填寫需求或資源</b><span>說明需要什麼、什麼時候、在哪裡。</span></div></li>
          <li><div><b>布穀島社協助配對</b><span>從會員與資料庫裡找合適的對象。</span></div></li>
          <li><div><b>雙方直接對接</b><span>確認細節後，由雙方約好合作方式。</span></div></li>
          <li><div><b>完成後分享回饋</b><span>留下紀錄，讓下一次媒合更順利。</span></div></li>
        </ol>
      </div>
    </PageShell>
  )
}
