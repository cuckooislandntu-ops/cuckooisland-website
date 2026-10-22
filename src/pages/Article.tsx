import { useEffect, useRef, useState } from 'react'
import { useLightbox } from '@/components/Lightbox'
import { PostCard, ShareBar } from '@/components/ColumnBits'
import ColumnComments from '@/components/ColumnComments'
import { postTags, readMinutes, relatedPosts, rememberClub, rememberSeries } from '@/lib/column'
import { LOGO_SRC } from '@/lib/logo'
import { CLUBS, CLUB_INTROS, COLUMN_POSTS, ENTRIES, POSTS, REGION_LABEL, SERIES_INFO, fmtDate, isClubIntro, isMemberCat } from '@/lib/content'
import { isApproved, useMember } from '@/lib/member'
import { EntryCard } from '@/pages/Resources'
import EditLink from '@/components/EditLink'
import { to } from '@/lib/site'

const IG = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>

type Head = { id: string; text: string }

/** 閱讀進度與段落目錄：從文章裡的 h2 自動產生，捲動時標出目前讀到哪一段。 */
function useOutline(id: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [heads, setHeads] = useState<Head[]>([])
  const [active, setActive] = useState('')
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const hs = [...root.querySelectorAll('h2')].filter(h => !h.closest('.art-after'))
    hs.forEach((h, i) => { h.id = h.id || `sec-${i + 1}` })
    setHeads(hs.map(h => ({ id: h.id, text: h.textContent || '' })))
    const onScroll = () => {
      const r = root.getBoundingClientRect()
      const total = r.height - window.innerHeight * 0.6
      setProgress(Math.min(1, Math.max(0, -r.top / Math.max(1, total))))
      let cur = ''
      for (const h of hs) if (h.getBoundingClientRect().top < 140) cur = h.id
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [id])
  return { ref, heads, active, progress }
}

function Outline({ heads, active, onPick }: { heads: Head[]; active?: string; onPick?: () => void }) {
  return (
    <ol className="art-outline">
      {heads.map(h => <li key={h.id}><a href={'#' + h.id} aria-current={active === h.id ? 'true' : undefined} onClick={e => {
        e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); onPick?.()
      }}>{h.text}</a></li>)}
    </ol>
  )
}

export default function Article({ id }: { id: string }) {
  const lb = useLightbox()
  const { ref, heads, active, progress } = useOutline(id)
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
  const tags = postTags(post, 8)
  const related = relatedPosts(post)
  const mins = readMinutes(post)
  // 麵包屑與「回到哪裡」：社團介紹 → 社團地圖／社團名稱；專欄 → 專欄／系列
  const home = intro ? { id: 'map', label: '社團地圖' } : { id: 'column', label: '專欄' }
  const toClub = () => club && rememberClub(club.id)

  return (
    <main className="page" id="main">
      <div className="read-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
      <header className="article-head" style={{ backgroundColor: info.tint }}>
        <div className="article-inner art-head">
          <nav className="crumbs" aria-label="目前位置">
            <a href={to('')}>首頁</a><span aria-hidden="true">/</span>
            <a href={to(home.id)}>{home.label}</a><span aria-hidden="true">/</span>
            {intro
              ? <a href={to('map')} onClick={toClub}>{club?.name || post.series}</a>
              : <a href={to('column')} onClick={() => rememberSeries(post.series)}>{post.series}</a>}
          </nav>
          <div className="entry-top" style={{ marginTop: 12 }}>
            <span className="cat-badge" style={{ background: info.color }}>{post.series} {post.ep}</span>
            <span className="sub-tag">{info.label}</span>
          </div>
          <h1>{post.title}</h1>
          <p className="article-hook">{post.hook}</p>
          <p className="byline art-meta">
            {post.date && <time dateTime={post.date}>{fmtDate(post.date)}</time>}
            <span>閱讀約 {mins} 分鐘</span>
            {post.credit && <span>{post.credit}</span>}
          </p>
          <ShareBar title={post.title} compact />
          {post.cover && <img className="article-cover" src={post.cover} alt="" />}
        </div>
      </header>

      <article className="article-body">
        <div className="art-grid">
        <div className="article-inner prose" ref={ref}>
          {heads.length >= 3 && <details className="outline-box mobile-only">
            <summary>本文段落（{heads.length}）</summary>
            <Outline heads={heads} onPick={() => document.querySelector<HTMLDetailsElement>('.outline-box')?.removeAttribute('open')} />
          </details>}
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
              <a className="btn primary" href={to('map')} onClick={toClub}>在社團地圖上看{club.name.replace('台大', '')}</a>
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

          <div className="art-after">
            <div className="art-tags" aria-label="主題標籤">
              {intro
                ? <a className="tag" href={to('map')}>#社團介紹</a>
                : <a className="tag" href={to('column')} onClick={() => rememberSeries(post.series)}>#{post.series}</a>}
              {club && <a className="tag" href={to('map')} onClick={toClub}>#{club.name}</a>}
              {tags.map(t => <span key={t} className="tag">#{t}</span>)}
            </div>
            <div className="art-share-end">
              <span>{intro ? '認識的人也在找社團？分享給他' : '覺得有用，分享給正在籌備營隊的夥伴'}</span>
              <ShareBar title={post.title} />
            </div>
            <a className="ig" href={post.ig || 'https://www.instagram.com/cuckoo_island/'} target="_blank" rel="noopener noreferrer"><IG />{post.ig ? '在 IG 看原始貼文' : '在 IG @cuckoo_island 看更多'}</a>

            <section className="publisher" aria-label="關於布穀島社">
              <img src={LOGO_SRC} alt="" width={56} height={56} />
              <div>
                <h2>布穀島社</h2>
                <p>串聯全台教育服務性社團，交流經驗、共享資源、一起成長。你分享一份經驗，就能接住上千份。</p>
                <div className="publisher-act">
                  {member
                    ? <a className="btn primary" href={to('member')}>到會員專區</a>
                    : <a className="btn primary" href={to('join')}>加入島鏈</a>}
                  <a className="btn ghost" href={to('about')}>認識布穀島社</a>
                </div>
              </div>
            </section>

            <ColumnComments postId={post.id} intro={intro} />

            <nav className="article-nav" aria-label={'其他' + noun}>
              {newer ? <a href={to(newer.id)}><span>較新的{noun}</span><b>{newer.title}</b></a> : <span />}
              {older ? <a href={to(older.id)} className="right"><span>較早的{noun}</span><b>{older.title}</b></a> : <span />}
            </nav>
          </div>
        </div>

        <aside className="art-side" aria-label="本文段落與分享">
          <div className="art-side-in">
            {heads.length >= 2 && <><p className="side-label">本文段落</p>
            <Outline heads={heads} active={active} /></>}
            <p className="side-label">分享</p>
            <ShareBar title={post.title} compact />
          </div>
        </aside>
        </div>

        {related.length > 0 && <section className="related" aria-labelledby="related-h">
          <div className="related-in">
            <h2 id="related-h">{intro ? '認識更多社團' : '你可能也喜歡'}</h2>
            <div className="pc-grid">{related.map(p => <PostCard key={p.id} p={p} />)}</div>
            <a className="btn ghost" href={to(home.id)}>{intro ? '到社團地圖看所有社團' : '看所有專欄文章'}</a>
          </div>
        </section>}
      </article>
      <EditLink collection="posts" id={post.id} label="在後台編輯這篇" float />
      {lb.view}
    </main>
  )
}
