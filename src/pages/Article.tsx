import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { CLUBS, ENTRIES, POSTS, REGION_LABEL, SERIES_INFO, fmtDate } from '@/lib/content'
import { EntryCard } from '@/pages/Resources'

const IG = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>

// Tap a photo in the article body to see it large; Esc or tap again to close
function useLightbox() {
  const [shot, setShot] = useState<{ src: string; cap: string } | null>(null)
  useEffect(() => {
    if (!shot) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setShot(null) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [shot])
  const open = (e: MouseEvent<HTMLDivElement>) => {
    const img = (e.target as HTMLElement).closest('img')
    if (!img) return
    const fig = img.closest('figure')
    setShot({ src: img.currentSrc || img.src, cap: fig?.querySelector('figcaption')?.textContent || img.alt || '' })
  }
  const view = shot && createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="放大照片" onClick={() => setShot(null)}>
      <figure><img src={shot.src} alt={shot.cap} />{shot.cap && <figcaption>{shot.cap}</figcaption>}</figure>
      <button type="button" aria-label="關閉">×</button>
    </div>,
    document.body,
  )
  return { open, view }
}

export default function Article({ id }: { id: string }) {
  const lb = useLightbox()
  const i = POSTS.findIndex(p => p.id === id)
  const post = POSTS[i]
  if (!post) {
    return (
      <main className="page" id="main"><div className="content"><div className="content-inner">
        <h1 style={{ fontSize: 26 }}>找不到這篇文章</h1>
        <p className="section-lede">這篇文章可能已經移除，回專欄看看其他文章吧。</p>
        <a className="btn primary" href="#column">回到專欄</a>
      </div></div></main>
    )
  }
  const info = SERIES_INFO[post.series]
  const club = post.clubId ? CLUBS.find(c => c.id === post.clubId) : undefined
  const res = post.resIds.map(r => ENTRIES.find(e => e.id === r)).filter(Boolean) as typeof ENTRIES
  const newer = POSTS[i - 1], older = POSTS[i + 1]

  return (
    <main className="page" id="main">
      <header className="article-head" style={{ backgroundColor: info.tint }}>
        <div className="article-inner">
          <a className="back" href="#column">
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>專欄
          </a>
          <div className="entry-top" style={{ marginTop: 14 }}>
            <span className="cat-badge" style={{ background: info.color }}>{post.series} {post.ep}</span>
            <span className="sub-tag">{info.label}</span>
          </div>
          <h1>{post.title}</h1>
          <p className="article-hook">{post.hook}</p>
          <p className="byline">{[fmtDate(post.date), post.credit].filter(Boolean).join('｜')}</p>
          {post.cover && <img className="article-cover" src={post.cover} alt="" />}
        </div>
      </header>

      <article className="article-body">
        <div className="article-inner prose">
          {club && <>
            <p className="lead">{club.name}，{club.tagline}。</p>
            <section>
              <h2>社團小檔案</h2>
              <dl className="facts big">
                <dt>隸屬單位</dt><dd>{club.school}</dd>
                {club.size && <><dt>整體人數</dt><dd>{club.size}</dd></>}
                <dt>服務形式</dt><dd>{club.types.join('、')}</dd>
              </dl>
            </section>
            {post.html && <div className="md" onClick={lb.open} dangerouslySetInnerHTML={{ __html: post.html }} />}
            {club.sites.length > 0 && <section>
              <h2>服務據點</h2>
              <ul className="sites">
                {club.sites.map(s => <li key={s.name}><b>{s.name}{s.region && <em>{REGION_LABEL[s.region]}</em>}</b><span>{s.detail}</span></li>)}
              </ul>
            </section>}
            {club.highlights.length > 0 && <section>
              <h2>社團亮點</h2>
              <ul>{club.highlights.map(x => <li key={x}>{x}</li>)}</ul>
            </section>}
            {post.closing && <blockquote>{post.closing}</blockquote>}
            <div className="article-actions">
              <a className="btn primary" href="#map">在社團地圖上看{club.name.replace('台大', '')}</a>
              {club.ig && <a className="ig" href={`https://www.instagram.com/${club.ig}/`} target="_blank" rel="noopener noreferrer"><IG />@{club.ig}</a>}
            </div>
          </>}

          {!club && <>
            {post.html && <div className="md" onClick={lb.open} dangerouslySetInnerHTML={{ __html: post.html }} />}
            {res.length > 0 && <section>
              <h2>{post.series === '布可不資道' ? '這一集介紹的資源' : '文章提到的資源'}</h2>
              <div className="entries">{res.map(e => <EntryCard key={e.id} e={e} />)}</div>
            </section>}
            {post.closing && <blockquote>{post.closing}</blockquote>}
            <div className="article-actions">
              <a className="btn primary" href={res.length ? '#resources' : '#column'}>{res.length ? '到資料庫找更多資源' : '看更多專欄文章'}</a>
            </div>
          </>}

          <nav className="article-nav" aria-label="其他文章">
            {newer ? <a href={'#' + newer.id}><span>較新的文章</span><b>{newer.title}</b></a> : <span />}
            {older ? <a href={'#' + older.id} className="right"><span>較早的文章</span><b>{older.title}</b></a> : <span />}
          </nav>
          <a className="ig" href={post.ig || 'https://www.instagram.com/cuckoo_island/'} target="_blank" rel="noopener noreferrer"><IG />{post.ig ? '在 IG 看原始貼文' : '在 IG @cuckoo_island 看更多'}</a>
        </div>
      </article>
      {lb.view}
    </main>
  )
}
