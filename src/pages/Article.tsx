import { useLightbox } from '@/components/Lightbox'
import { CLUBS, CLUB_INTROS, COLUMN_POSTS, ENTRIES, POSTS, REGION_LABEL, SERIES_INFO, fmtDate, isClubIntro, isMemberCat } from '@/lib/content'
import { isApproved, useMember } from '@/lib/member'
import { EntryCard } from '@/pages/Resources'
import EditLink from '@/components/EditLink'
import { to } from '@/lib/site'

const IG = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>

export default function Article({ id }: { id: string }) {
  const lb = useLightbox()
  const member = isApproved(useMember())
  const post = POSTS.find(p => p.id === id)
  // 社團介紹（布穀好朋友）屬於社團地圖，上一篇／下一篇只在社團介紹之間跳；其他文章在專欄之間跳
  const intro = isClubIntro(post)
  const group = intro ? CLUB_INTROS : COLUMN_POSTS
  const i = group.findIndex(p => p.id === id)
  if (!post) {
    return (
      <main className="page" id="main"><div className="content"><div className="content-inner">
        <h1 style={{ fontSize: 26 }}>找不到這篇文章</h1>
        <p className="section-lede">這篇文章可能已經移除，回專欄看看其他文章吧。</p>
        <a className="btn primary" href={to('column')}>回到專欄</a>
      </div></div></main>
    )
  }
  const info = SERIES_INFO[post.series]
  const club = post.clubId ? CLUBS.find(c => c.id === post.clubId) : undefined
  // 團隊活動、模板只給會員看
  const res = (post.resIds.map(r => ENTRIES.find(e => e.id === r)).filter(Boolean) as typeof ENTRIES).filter(e => member || !isMemberCat(e.cat))
  const newer = group[i - 1], older = group[i + 1]
  const noun = intro ? '社團介紹' : '文章'

  return (
    <main className="page" id="main">
      <header className="article-head" style={{ backgroundColor: info.tint }}>
        <div className="article-inner">
          <a className="back" href={to(intro ? 'map' : 'column')}>
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>{intro ? '社團地圖' : '專欄'}
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
              <a className="btn primary" href={to('map')}>在社團地圖上看{club.name.replace('台大', '')}</a>
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
              <a className="btn primary" href={to(res.length ? 'resources' : 'column')}>{res.length ? '到資料庫找更多資源' : '看更多專欄文章'}</a>
            </div>
          </>}

          <nav className="article-nav" aria-label={'其他' + noun}>
            {newer ? <a href={to(newer.id)}><span>較新的{noun}</span><b>{newer.title}</b></a> : <span />}
            {older ? <a href={to(older.id)} className="right"><span>較早的{noun}</span><b>{older.title}</b></a> : <span />}
          </nav>
          <a className="ig" href={post.ig || 'https://www.instagram.com/cuckoo_island/'} target="_blank" rel="noopener noreferrer"><IG />{post.ig ? '在 IG 看原始貼文' : '在 IG @cuckoo_island 看更多'}</a>
        </div>
      </article>
      <EditLink collection="posts" id={post.id} label="在後台編輯這篇" float />
      {lb.view}
    </main>
  )
}
