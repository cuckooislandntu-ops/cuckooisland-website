// 會員教案庫（/lessons、單篇 /lessons/123）
// 只有已開通的會員社團看得到：查教案、分享教案（可上傳檔案或貼連結）、按讚、收藏、留言，最上面是近 30 天最夯的教案。
// 資料在 Supabase（src/lib/lessons.ts、supabase/lessons.sql）；作者與留言者用 ClubIdentity 顯示社團身分。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Empty, HeroArt } from '@/components/Chrome'
import ClubIdentity from '@/components/ClubIdentity'
import { PillTab, PillTabsList } from '@/components/PillTabs'
import { go, to } from '@/lib/site'
import { MEMBER_ENABLED, isApproved, signIn, useMember } from '@/lib/member'
import {
  FILE_ACCEPT, FILE_MAX, GRADES, TOPICS, addComment, createLesson, deleteComment, deleteLesson, fetchComments, fetchLesson, fetchLessons,
  fileUrl, removeLessonFile, setLiked, setSaved, updateLesson, uploadLessonFile,
} from '@/lib/lessons'
import type { LessonCard, LessonComment, LessonInput } from '@/lib/lessons'

const DAY = 864e5
const ago = (d: string) => {
  const t = Date.parse(d), n = Date.now() - t
  if (isNaN(t)) return ''
  if (n < 36e5) return Math.max(1, Math.round(n / 6e4)) + ' 分鐘前'
  if (n < DAY) return Math.round(n / 36e5) + ' 小時前'
  if (n < 7 * DAY) return Math.round(n / DAY) + ' 天前'
  const x = new Date(t); return `${x.getFullYear()}/${x.getMonth() + 1}/${x.getDate()}`
}

/* ---------- 共用：頁面外框、權限 ---------- */
function Shell({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <main className="page" id="main">
      {!compact && (
        <section className="hero-band" style={{ backgroundColor: '#CFE8E5' }}>
          <div className="hero-inner">
            <h1>會員教案庫</h1>
            <p className="lede">會員社團親手寫、實際帶過的教案。找靈感、拿去改，也把你們的教案分享給下一個需要的社團。</p>
            <HeroArt kind="lessons" />
          </div>
        </section>
      )}
      <div className="content" style={compact ? { paddingTop: 20 } : undefined}><div className="content-inner">{children}</div></div>
    </main>
  )
}

function Gate({ children }: { children: ReactNode }) {
  const m = useMember()
  if (!MEMBER_ENABLED) return <Empty title="會員功能準備中">正式網站才能登入。預覽版看不到會員教案庫。</Empty>
  if (!m.ready) return <p className="status" role="status">確認登入狀態中⋯</p>
  if (!isApproved(m)) return <Locked />
  return <>{children}</>
}

function Locked() {
  return (
    <>
      <div className="sheet mb-box">
        <h2>會員社團才看得到</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>這裡的教案是會員社團分享給彼此的，不對外公開。公開的教學資源可以到<a href={to('resources')}>公開資料庫</a>查。</p>
        <div className="mb-out-actions">
          <button type="button" className="btn primary mb-inline-btn" onClick={() => void signIn()}>會員登入</button>
          <a className="btn ghost mb-inline-btn" href={to('join')}>申請成為會員</a>
        </div>
      </div>
      <div>
        <h2>加入後可以</h2>
        <div className="benefits" style={{ marginTop: 12 }}>
          <div className="benefit"><b>查其他社團的教案</b><span>依年段、主題找，看看別的社團怎麼帶閱讀課、SEL 或科學實驗。</span></div>
          <div className="benefit"><b>分享你們的教案</b><span>上傳檔案或貼雲端連結。你分享一份，其他社團就少準備一份。</span></div>
          <div className="benefit"><b>按讚、收藏、留言</b><span>收藏想用的教案，在留言問細節、分享改編心得，最受歡迎的會出現在「最夯教案」。</span></div>
        </div>
      </div>
    </>
  )
}

/* ---------- 圖示 ---------- */
const Heart = ({ on }: { on: boolean }) => <svg viewBox="0 0 24 24" aria-hidden="true" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
const Mark = ({ on }: { on: boolean }) => <svg viewBox="0 0 24 24" aria-hidden="true" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M6 4h12v17l-6-4-6 4z" /></svg>
const Bubble = () => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg>

/** 按讚、收藏：先改畫面，再送出；失敗就改回來 */
function useReact(init: LessonCard, onChange?: (l: LessonCard) => void) {
  const [l, setL] = useState(init)
  useEffect(() => setL(init), [init])
  const flip = async (kind: 'like' | 'save') => {
    const on = kind === 'like' ? !l.liked : !l.saved
    const next = kind === 'like'
      ? { ...l, liked: on, like_count: l.like_count + (on ? 1 : -1) }
      : { ...l, saved: on, save_count: l.save_count + (on ? 1 : -1) }
    setL(next); onChange?.(next)
    try { await (kind === 'like' ? setLiked : setSaved)(l.id, on) } catch { setL(l); onChange?.(l) }
  }
  return { l, like: () => flip('like'), save: () => flip('save') }
}

function Actions({ l, like, save, big }: { l: LessonCard; like: () => void; save: () => void; big?: boolean }) {
  return (
    <div className={'ls-actions' + (big ? ' big' : '')}>
      <button type="button" className="ls-act like" aria-pressed={l.liked} onClick={like} aria-label={`按讚，目前 ${l.like_count} 個讚`}>
        <Heart on={l.liked} /><span>{l.like_count}</span>{big && <em>{l.liked ? '已按讚' : '讚'}</em>}
      </button>
      <span className="ls-act ro" aria-label={`${l.comment_count} 則留言`}><Bubble /><span>{l.comment_count}</span>{big && <em>留言</em>}</span>
      <button type="button" className="ls-act save" aria-pressed={l.saved} onClick={save} aria-label={l.saved ? '取消收藏' : '收藏'}>
        <Mark on={l.saved} />{big ? <em>{l.saved ? '已收藏' : '收藏'}</em> : <span className="sr-only">{l.saved ? '已收藏' : '收藏'}</span>}
      </button>
    </div>
  )
}

const Tags = ({ l }: { l: Pick<LessonCard, 'grades' | 'topics' | 'duration'> }) => (
  <p className="sf-tags ls-tags">
    {l.grades.map(t => <span key={'g' + t} className="g">{t}</span>)}
    {l.topics.map(t => <span key={'t' + t}>{t}</span>)}
    {l.duration && <span className="d">{l.duration}</span>}
  </p>
)

/* ---------- 列表頁 ---------- */
export default function Lessons() {
  return <Shell><Gate><Library /></Gate></Shell>
}

function Library() {
  const [all, setAll] = useState<LessonCard[] | null>(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('hot')
  const [q, setQ] = useState('')
  const [grade, setGrade] = useState<string | null>(null)
  const [topic, setTopic] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const load = useCallback(() => { fetchLessons().then(setAll, e => setErr('教案讀取失敗，請重新整理再試一次。' + (e?.message ? `（${e.message}）` : ''))) }, [])
  useEffect(load, [load])
  const patch = (n: LessonCard) => setAll(a => a && a.map(x => (x.id === n.id ? n : x)))

  const published = useMemo(() => (all || []).filter(l => l.published), [all])
  const hot = useMemo(() => published.filter(l => l.hot > 0).sort((a, b) => b.hot - a.hot || b.like_count - a.like_count).slice(0, 3), [published])
  const topics = useMemo(() => [...new Set([...TOPICS.filter(t => published.some(l => l.topics.includes(t))), ...published.flatMap(l => l.topics)])], [published])
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    let r = tab === 'saved' ? published.filter(l => l.saved) : tab === 'mine' ? (all || []).filter(l => l.mine) : published
    r = r.filter(l => (!grade || l.grades.includes(grade)) && (!topic || l.topics.includes(topic))
      && (!k || [l.title, l.summary, l.club_name, l.school, ...l.topics].some(t => t?.toLowerCase().includes(k))))
    return tab === 'hot' ? [...r].sort((a, b) => b.hot - a.hot || b.like_count - a.like_count || b.created_at.localeCompare(a.created_at)) : r
  }, [all, published, tab, q, grade, topic])

  const openForm = () => { setAdding(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }

  if (err) return <p className="field-error" role="alert">{err}</p>
  if (!all) return <p className="status" role="status">讀取教案中⋯</p>
  return (
    <>
      <div className="ls-top">
        <p className="ls-count">{published.length} 份教案，來自會員社團</p>
        {!adding && <button type="button" className="btn primary mb-inline-btn" onClick={openForm}>分享教案</button>}
      </div>
      {adding && (
        <div ref={formRef} style={{ scrollMarginTop: 80 }}>
          <LessonForm onCancel={() => setAdding(false)} onSaved={id => go('lesson-' + id)} />
        </div>
      )}

      {hot.length > 0 && (
        <section className="ls-hot" aria-labelledby="ls-hot-h">
          <h2 id="ls-hot-h">最夯教案</h2>
          <p className="section-lede">近 30 天最多社團按讚、收藏、留言的教案。</p>
          <ol>
            {hot.map(l => (
              <li key={l.id}>
                <a href={to('lesson-' + l.id)}>
                  <b>{l.title}</b>
                  <span>{l.club_name}</span>
                  <small><Heart on={false} />{l.like_count}<Mark on={false} />{l.save_count}<Bubble />{l.comment_count}</small>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Tabs.Root value={tab} onValueChange={setTab} className="mb-tabs">
        <PillTabsList cols={4} aria-label="教案排序與篩選">
          <PillTab value="hot">最夯</PillTab>
          <PillTab value="new">最新</PillTab>
          <PillTab value="saved">收藏</PillTab>
          <PillTab value="mine">我們的</PillTab>
        </PillTabsList>
        <div className="ls-filters">
          <div className="sf-field">
            <label htmlFor="ls-q" className="sr-only">搜尋教案</label>
            <input id="ls-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋教案名稱、社團或主題" autoComplete="off" />
          </div>
          <div className="chips" role="group" aria-label="年段">
            {GRADES.map(g => <button key={g} type="button" className="chip" aria-pressed={grade === g} onClick={() => setGrade(grade === g ? null : g)}>{g}</button>)}
          </div>
          {topics.length > 0 && (
            <div className="chips" role="group" aria-label="主題">
              {topics.map(t => <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(topic === t ? null : t)}>{t}</button>)}
            </div>
          )}
          <p className="count" aria-live="polite">共 {list.length} 份</p>
        </div>
        {['hot', 'new', 'saved', 'mine'].map(v => (
          <Tabs.Content key={v} value={v}>
            {list.length === 0
              ? <Empty title={v === 'saved' ? '還沒有收藏' : v === 'mine' ? '你們還沒分享教案' : q || grade || topic ? '找不到符合的教案' : '還沒有教案'}
                  action={v === 'mine' || (!q && !grade && !topic && v !== 'saved') ? <button type="button" className="btn primary mb-inline-btn" onClick={openForm}>分享第一份教案</button> : undefined}>
                  {v === 'saved' ? '看到想用的教案，按書籤圖示收藏，之後就會整理在這裡。' : q || grade || topic ? '換個關鍵字，或取消年段、主題的篩選。' : '把你們帶過的教案分享出來，其他社團就能直接參考。'}
                </Empty>
              : <ul className="ls-list">{list.map(l => <Item key={l.id} init={l} onChange={patch} />)}</ul>}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </>
  )
}

function Item({ init, onChange }: { init: LessonCard; onChange: (l: LessonCard) => void }) {
  const { l, like, save } = useReact(init, onChange)
  return (
    <li className="ls-card">
      <a className="ls-card-link" href={to('lesson-' + l.id)}>
        <h3>{l.title}{!l.published && <em className="ls-hidden">未公開</em>}</h3>
        {l.summary && <p className="ls-sum">{l.summary}</p>}
      </a>
      <Tags l={l} />
      <div className="ls-card-foot">
        <ClubIdentity p={l} size="sm" as="p" />
        <Actions l={l} like={like} save={save} />
      </div>
    </li>
  )
}

/* ---------- 單篇教案 ---------- */
export function LessonPage({ id }: { id: number }) {
  return <Shell compact><Gate><Detail id={id} /></Gate></Shell>
}

function Detail({ id }: { id: number }) {
  const [data, setData] = useState<LessonCard | null | undefined>(undefined)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const reload = useCallback(() => { fetchLesson(id).then(setData, e => setErr('教案讀取失敗：' + (e?.message || ''))) }, [id])
  useEffect(reload, [reload])
  useEffect(() => { if (data) document.title = `${data.title}｜會員教案庫｜布穀島社` }, [data])

  if (err) return <p className="field-error" role="alert">{err}</p>
  if (data === undefined) return <p className="status" role="status">讀取中⋯</p>
  if (!data) return <Empty title="找不到這份教案" action={<a className="btn primary mb-inline-btn" href={to('lessons')}>回會員教案庫</a>}>可能已經被分享的社團刪除或隱藏。</Empty>
  if (editing) return <LessonForm init={data} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); reload() }} />
  return <DetailView init={data} onEdit={() => setEditing(true)} />
}

function DetailView({ init, onEdit }: { init: LessonCard; onEdit: () => void }) {
  const { l, like, save } = useReact(init)
  const [fileMsg, setFileMsg] = useState('')
  const [count, setCount] = useState(l.comment_count)
  const openFile = async () => {
    setFileMsg('準備下載連結⋯')
    try { const u = await fileUrl(l); setFileMsg(''); window.open(u, '_blank', 'noopener') } catch (e) { setFileMsg((e as Error).message) }
  }
  const remove = async () => {
    if (!confirm(`確定要刪除「${l.title}」？按讚、收藏和留言也會一起刪除，無法復原。`)) return
    try { await deleteLesson(l); go('lessons') } catch (e) { alert('刪除失敗：' + (e as Error).message) }
  }
  return (
    <>
      <a className="ls-back" href={to('lessons')}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>會員教案庫
      </a>
      <article className="sheet ls-article">
        <ClubIdentity p={l} />
        <h1>{l.title}{!l.published && <em className="ls-hidden">未公開</em>}</h1>
        <p className="ls-date">分享於 {ago(l.created_at)}</p>
        <Tags l={l} />
        {l.summary && <p className="ls-lead">{l.summary}</p>}
        {(l.file_path || l.link_url) && (
          <div className="ls-files">
            {l.file_path && <button type="button" className="btn primary mb-inline-btn" onClick={() => void openFile()}>下載檔案{l.file_name ? `：${l.file_name}` : ''}</button>}
            {l.link_url && <a className="btn ghost mb-inline-btn" href={l.link_url} target="_blank" rel="noopener noreferrer">打開教案連結</a>}
            {fileMsg && <p className="status" role="status">{fileMsg}</p>}
          </div>
        )}
        {l.body && <div className="ls-body">{l.body}</div>}
        <Actions l={{ ...l, comment_count: count }} like={like} save={save} big />
        {l.mine && (
          <div className="ls-owner">
            <span>這是你們分享的教案</span>
            <button type="button" className="link-plain" onClick={onEdit}>編輯</button>
            <button type="button" className="link-plain danger" onClick={() => void remove()}>刪除</button>
          </div>
        )}
      </article>
      <Comments id={l.id} onCount={setCount} />
    </>
  )
}

function Comments({ id, onCount }: { id: number; onCount: (n: number) => void }) {
  const [list, setList] = useState<LessonComment[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const me = useMember().profile
  const load = useCallback(() => fetchComments(id).then(r => { setList(r); onCount(r.length) }, () => setMsg('留言讀取失敗，請重新整理再試一次。')), [id, onCount])
  useEffect(() => { void load() }, [load])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) { setMsg('請先寫點什麼。'); return }
    setBusy(true)
    try { await addComment(id, t); setText(''); setMsg(''); await load() } catch (er) { setMsg('留言沒有送出：' + (er as Error).message) }
    setBusy(false)
  }
  const del = async (c: LessonComment) => {
    if (!confirm('確定要刪除這則留言？')) return
    try { await deleteComment(c.id); await load() } catch (er) { setMsg('刪除失敗：' + (er as Error).message) }
  }

  return (
    <section className="ls-comments" aria-labelledby="ls-c-h">
      <h2 id="ls-c-h">留言{list ? `（${list.length}）` : ''}</h2>
      {list === null ? <p className="status">讀取留言中⋯</p>
        : list.length === 0 ? <p className="section-lede">還沒有留言。用過這份教案、有改編心得或問題，都可以留在這裡。</p>
        : <ul className="ls-c-list">
            {list.map(c => (
              <li key={c.id}>
                <div className="ls-c-head">
                  <ClubIdentity p={c} size="sm" as="p" />
                  <span className="ls-c-time">{ago(c.created_at)}</span>
                </div>
                <p className="ls-c-body">{c.body}</p>
                {c.mine && <button type="button" className="link-plain danger ls-c-del" onClick={() => void del(c)}>刪除</button>}
              </li>
            ))}
          </ul>}
      <form className="ls-c-form" onSubmit={send}>
        {me && <ClubIdentity p={me} size="sm" as="p" />}
        <div className="sf-field">
          <label htmlFor="ls-c-text" className="sr-only">留言</label>
          <textarea id="ls-c-text" value={text} maxLength={1000} onChange={e => { setText(e.target.value); setMsg('') }} placeholder="分享你們帶這份教案的心得，或問問分享的社團" />
        </div>
        <div className="sf-submit">
          <button className="btn primary mb-inline-btn" type="submit" disabled={busy}>{busy ? '送出中⋯' : '送出留言'}</button>
          <p className="status" role="status" aria-live="polite">{msg}</p>
        </div>
      </form>
    </section>
  )
}

/* ---------- 分享／編輯教案 ---------- */
function LessonForm({ init, onCancel, onSaved }: { init?: LessonCard; onCancel: () => void; onSaved: (id: number) => void }) {
  const [f, setF] = useState<LessonInput>(() => ({
    title: init?.title || '', summary: init?.summary || '', body: init?.body || '', grades: init?.grades || [], topics: init?.topics || [],
    duration: init?.duration || '', link_url: init?.link_url || '', file_path: init?.file_path || '', file_name: init?.file_name || '',
  }))
  const [otherTopic, setOtherTopic] = useState(() => (init?.topics || []).filter(t => !TOPICS.includes(t)).join('、'))
  const [file, setFile] = useState<File | null>(null)
  const [dropFile, setDropFile] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const up = <K extends keyof LessonInput>(k: K, v: LessonInput[K]) => { setF(s => ({ ...s, [k]: v })); setMsg('') }
  const toggle = (k: 'grades' | 'topics', t: string) => up(k, f[k].includes(t) ? f[k].filter(x => x !== t) : [...f[k], t])
  const keptFile = !!f.file_path && !dropFile

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const extra = otherTopic.split(/[、,，\s]+/).map(t => t.trim()).filter(Boolean)
    const v: LessonInput = { ...f, title: f.title.trim(), summary: f.summary.trim(), body: f.body.trim(), duration: f.duration.trim(), link_url: f.link_url.trim(),
      topics: [...f.topics.filter(t => TOPICS.includes(t)), ...extra.filter(t => !TOPICS.includes(t))] }
    const er: Record<string, string> = {}
    if (!v.title) er.title = '請填教案名稱。'
    if (!v.summary) er.summary = '請用一兩句話介紹這份教案。'
    if (!v.grades.length) er.grades = '至少選一個適用年段。'
    if (v.link_url && !/^https?:\/\//i.test(v.link_url)) er.link_url = '連結要以 https:// 開頭。'
    if (!file && !keptFile && !v.link_url && !v.body) er.file = '請上傳檔案、貼上連結，或在內容欄寫下流程，至少一種。'
    if (file && file.size > FILE_MAX) er.file = '檔案超過 20 MB，請壓縮後再上傳，或改貼雲端連結。'
    setErrs(er)
    if (Object.keys(er).length) { setMsg('還有欄位沒填好。'); document.getElementById('lf-' + Object.keys(er)[0])?.focus(); return }
    setBusy(true)
    try {
      const old = init?.file_path || ''
      if (file) { setMsg('上傳檔案中⋯'); Object.assign(v, await uploadLessonFile(file)) }
      else if (dropFile) { v.file_path = ''; v.file_name = '' }
      setMsg('儲存中⋯')
      let id = init?.id
      if (id) await updateLesson(id, v); else id = await createLesson(v)
      if (old && old !== v.file_path) await removeLessonFile(old).catch(() => {})
      onSaved(id)
    } catch (er) { setMsg('沒有存成功：' + (er as Error).message); setBusy(false) }
  }

  const fieldErr = (k: string) => errs[k] ? <p className="field-error" id={`lf-${k}-err`}>{errs[k]}</p> : null
  const inv = (k: string) => errs[k] ? { 'aria-invalid': true as const, 'aria-describedby': `lf-${k}-err` } : {}

  return (
    <form className="sheet mb-form" onSubmit={submit} noValidate>
      <h2>{init ? '編輯教案' : '分享教案'}</h2>
      <div className="sf-field">
        <label htmlFor="lf-title">教案名稱<em>必填</em></label>
        <input id="lf-title" value={f.title} maxLength={80} onChange={e => up('title', e.target.value)} placeholder="例如：繪本裡的情緒怪獸" {...inv('title')} />
        {fieldErr('title')}
      </div>
      <div className="sf-field">
        <label htmlFor="lf-summary">簡介<em>必填</em></label>
        <textarea id="lf-summary" value={f.summary} maxLength={300} onChange={e => up('summary', e.target.value)} placeholder="教學目標、帶起來的感覺，一兩句就好" style={{ minHeight: 84 }} {...inv('summary')} />
        {fieldErr('summary')}
      </div>
      <fieldset className="sf-group" id="lf-grades" tabIndex={-1} {...inv('grades')}>
        <legend>適用年段<em>必填，可複選</em></legend>
        <div className="chips">{GRADES.map(g => <button key={g} type="button" className="chip" aria-pressed={f.grades.includes(g)} onClick={() => toggle('grades', g)}>{g}</button>)}</div>
        {fieldErr('grades')}
      </fieldset>
      <fieldset className="sf-group">
        <legend>主題<em className="opt">選填，可複選</em></legend>
        <div className="chips">{TOPICS.map(t => <button key={t} type="button" className="chip" aria-pressed={f.topics.includes(t)} onClick={() => toggle('topics', t)}>{t}</button>)}</div>
        <div className="sf-field" style={{ marginTop: 6 }}>
          <label htmlFor="lf-other" className="sf-hint" style={{ margin: 0 }}>其他主題（用頓號分開）</label>
          <input id="lf-other" value={otherTopic} onChange={e => { setOtherTopic(e.target.value); setMsg('') }} placeholder="例如：性平、環境教育" />
        </div>
      </fieldset>
      <div className="sf-field">
        <label htmlFor="lf-duration">時間長度<em className="opt">選填</em></label>
        <input id="lf-duration" value={f.duration} maxLength={40} onChange={e => up('duration', e.target.value)} placeholder="例如：90 分鐘、兩堂課、三天兩夜" />
      </div>
      <fieldset className="sf-group" id="lf-file" tabIndex={-1} {...inv('file')}>
        <legend>教案檔案或連結<em>至少一種</em></legend>
        <p className="sf-hint">檔案只有會員社團下載得到。可以上傳 PDF、Word、PowerPoint、Excel、圖片或 zip，20 MB 以內。</p>
        {keptFile && !file
          ? <p className="ls-file-kept"><span>目前的檔案：{f.file_name || '已上傳'}</span><button type="button" className="link-plain danger" onClick={() => setDropFile(true)}>移除</button></p>
          : <input className="ls-file-input" type="file" accept={FILE_ACCEPT} onChange={e => { setFile(e.target.files?.[0] || null); setMsg('') }} aria-label="選擇教案檔案" />}
        {file && <p className="sf-hint" style={{ margin: 0 }}>{file.name}（{(file.size / 1048576).toFixed(1)} MB）</p>}
        <div className="sf-field" style={{ marginTop: 6 }}>
          <label htmlFor="lf-link_url" className="sf-hint" style={{ margin: 0 }}>或貼上 Google 文件、簡報等連結</label>
          <input id="lf-link_url" type="url" inputMode="url" value={f.link_url} onChange={e => up('link_url', e.target.value)} placeholder="https://docs.google.com/…" {...inv('link_url')} />
          {fieldErr('link_url')}
        </div>
        {fieldErr('file')}
      </fieldset>
      <div className="sf-field">
        <label htmlFor="lf-body">內容<em className="opt">選填</em></label>
        <textarea id="lf-body" value={f.body} maxLength={8000} onChange={e => up('body', e.target.value)} placeholder={'教學流程、準備物、帶領小提醒⋯⋯\n沒有檔案的話，也可以直接寫在這裡。'} style={{ minHeight: 160 }} />
      </div>
      <p className="sf-hint" style={{ margin: 0 }}>分享後會用你們社團的名義顯示，其他會員社團可以按讚、收藏和留言。之後隨時可以編輯或刪除。</p>
      <div className="sf-submit">
        <div className="mb-out-actions">
          <button className="btn primary" type="submit" disabled={busy}>{busy ? '處理中⋯' : init ? '儲存修改' : '分享出去'}</button>
          <button className="btn ghost" type="button" onClick={onCancel} disabled={busy}>取消</button>
        </div>
        <p className="status" role="status" aria-live="polite">{msg}</p>
      </div>
    </form>
  )
}
