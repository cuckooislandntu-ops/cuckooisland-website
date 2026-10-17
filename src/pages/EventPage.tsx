// 單場活動頁（#event-...）：活動資訊、報名按鈕、活動介紹，結束後顯示活動紀錄。
import { useLightbox } from '@/components/Lightbox'
import EditLink from '@/components/EditLink'
import { EVENTS, STATUS_LABEL, eventStatus, fmtDate, weekday } from '@/lib/content'
import { to } from '@/lib/site'

export default function EventPage({ id }: { id: string }) {
  const lb = useLightbox()
  const e = EVENTS.find(x => x.id === id)
  if (!e) {
    return (
      <main className="page" id="main"><div className="content"><div className="content-inner">
        <h1 style={{ fontSize: 26 }}>找不到這場活動</h1>
        <p className="section-lede">這場活動可能已經移除，回活動頁看看其他活動吧。</p>
        <a className="btn primary" href={to('events')}>回到活動</a>
      </div></div></main>
    )
  }
  const st = eventStatus(e)
  return (
    <main className="page" id="main">
      <header className="article-head" style={{ backgroundColor: '#DDD3F0' }}>
        <div className="article-inner">
          <a className="back" href={to('events')}>
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>活動
          </a>
          <div className="entry-top" style={{ marginTop: 14 }}>
            <span className={'cat-badge st-' + st}>{STATUS_LABEL[st]}</span>
            <span className="sub-tag">{e.type}</span>
            {e.ep && <span className="sub-tag">{e.ep}</span>}
          </div>
          <h1>{e.title}</h1>
          {e.sum && <p className="article-hook">{e.sum}</p>}
          {e.cover && <img className="article-cover" src={e.cover} alt="" />}
        </div>
      </header>

      <article className="article-body">
        <div className="article-inner prose">
          <dl className="facts big">
            <dt>日期</dt><dd>{fmtDate(e.date)}（{weekday(e.date)}）</dd>
            {e.time && <><dt>時間</dt><dd>{e.time}</dd></>}
            {e.place && <><dt>地點</dt><dd>{e.place}</dd></>}
            {e.audience && <><dt>對象</dt><dd>{e.audience}</dd></>}
            {e.quota && <><dt>名額</dt><dd>{e.quota}</dd></>}
            {e.fee && <><dt>費用</dt><dd>{e.fee}</dd></>}
            {e.deadline && st !== 'past' && <><dt>報名截止</dt><dd>{fmtDate(e.deadline)}</dd></>}
          </dl>
          {st === 'open' && <a className="btn primary" href={e.signupUrl} target="_blank" rel="noopener noreferrer">立即報名</a>}

          {st === 'past' && e.recap && <section>
            <h2>活動紀錄</h2>
            <div className="md" onClick={lb.open} dangerouslySetInnerHTML={{ __html: e.recap }} />
          </section>}
          {e.html && <section>
            {(st === 'past' && e.recap) ? <h2>活動介紹</h2> : null}
            <div className="md" onClick={lb.open} dangerouslySetInnerHTML={{ __html: e.html }} />
          </section>}
          {st === 'past' && !e.recap && <p className="status">活動照片和參與社團的心得整理中。</p>}

          <div className="article-actions">
            <a className="btn ghost" href={to('events')}>看其他活動</a>
            <a className="ig" href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer">新活動會先公布在 IG @cuckoo_island</a>
          </div>
          <EditLink collection="events" id={e.id} label="在後台編輯這場活動" float />
        </div>
      </article>
      {lb.view}
    </main>
  )
}
