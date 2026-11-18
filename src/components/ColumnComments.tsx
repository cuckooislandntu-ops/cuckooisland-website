// 專欄文章底下的會員留言：已開通的會員社團可以看、可以留言、可以刪自己的留言；
// 沒登入或還沒開通的人只會看到說明（留言內容不公開）。資料在 src/lib/comments.ts、supabase/comments.sql。
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import ClubIdentity, { clubOf } from '@/components/ClubIdentity'
import { COMMENT_MAX, addColumnComment, deleteColumnComment, fetchColumnComments } from '@/lib/comments'
import type { ColumnComment } from '@/lib/comments'
import { MEMBER_ENABLED, isApproved, signIn, useMember } from '@/lib/member'
import { to } from '@/lib/site'

const DAY = 864e5
const ago = (d: string) => {
  const t = Date.parse(d), n = Date.now() - t
  if (isNaN(t)) return ''
  if (n < 36e5) return Math.max(1, Math.round(n / 6e4)) + ' 分鐘前'
  if (n < DAY) return Math.round(n / 36e5) + ' 小時前'
  if (n < 7 * DAY) return Math.round(n / DAY) + ' 天前'
  const x = new Date(t); return `${x.getFullYear()}/${x.getMonth() + 1}/${x.getDate()}`
}

export default function ColumnComments({ postId, intro }: { postId: string; intro?: boolean }) {
  const m = useMember()
  // claude.ai 預覽版連不到 Supabase，不顯示留言區
  if (!MEMBER_ENABLED || !m.ready) return null
  if (!isApproved(m)) {
    return (
      <section className="cc cc-locked" aria-labelledby="cc-h">
        <h2 id="cc-h">會員留言</h2>
        <p>
          {m.session
            ? '你的帳號還在等布穀島夥伴確認，開通後就能在這裡看到其他社團的留言，也可以留下你們的想法。'
            : `島鏈會員可以在這裡交流對這篇${intro ? '社團介紹' : '文章'}的想法與經驗。留言只有會員看得到，用申請時登記的 Google 帳號登入即可。`}
        </p>
        <div className="cc-actions">
          {m.session
            ? <a className="btn primary mb-inline-btn" href={to('member')}>查看會員狀態</a>
            : <><button type="button" className="btn primary mb-inline-btn" onClick={() => void signIn()}>會員登入</button><a className="btn ghost mb-inline-btn" href={to('join')}>申請成為會員</a></>}
        </div>
      </section>
    )
  }
  return <Thread key={m.profile?.id} postId={postId} intro={intro} />
}

// 回覆可以接著回覆，畫面維持一層縮排。RPC 按 id 排序，先有被回覆的留言。
function groupThreads(comments: ColumnComment[]) {
  const threads: ColumnComment[][] = []
  const threadByComment = new Map<number, ColumnComment[]>()
  for (const comment of comments) {
    const parentThread = comment.parent_id == null ? undefined : threadByComment.get(comment.parent_id)
    const thread = parentThread ?? []
    if (!parentThread) threads.push(thread)
    thread.push(comment)
    threadByComment.set(comment.id, thread)
  }
  return threads
}

function replyAnchor() {
  return location.hash.match(/^#comment-(\d+)$/)?.[1] ?? ''
}

function Thread({ postId, intro }: { postId: string; intro?: boolean }) {
  const me = useMember().profile
  const [list, setList] = useState<ColumnComment[] | null>(null)
  const [activeReply, setActiveReply] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [target, setTarget] = useState(replyAnchor)
  const scrolled = useRef('')
  const load = useCallback(async () => {
    setLoadError(false)
    try {
      setList(await fetchColumnComments(postId))
    } catch {
      setLoadError(true)
    }
  }, [postId])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const sync = () => setTarget(replyAnchor())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    if (!target) scrolled.current = ''
    if (!list || !target || scrolled.current === target) return
    const comment = document.getElementById(`comment-${target}`)
    const destination = comment ?? document.getElementById('cc-h')
    destination?.scrollIntoView({ block: 'start' })
    if (comment) comment.focus({ preventScroll: true })
    scrolled.current = target
  }, [list, target])

  async function send(body: string, parentId?: number) {
    setBusy(true)
    try {
      await addColumnComment(postId, body, parentId)
      if (parentId !== undefined) setActiveReply(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function remove(comment: ColumnComment) {
    if (!confirm('確定要刪除這則留言？')) return
    setBusy(true)
    setDeleteError(false)
    try {
      await deleteColumnComment(comment.id)
      if (activeReply === comment.id) setActiveReply(null)
      await load()
    } catch {
      setDeleteError(true)
    } finally {
      setBusy(false)
    }
  }

  const byId = new Map(list?.map(c => [c.id, c]))
  const threads = groupThreads(list ?? [])

  function renderComment(comment: ColumnComment) {
    const parent = comment.parent_id == null ? undefined : byId.get(comment.parent_id)
    const replying = activeReply === comment.id
    return (
      <div id={`comment-${comment.id}`} className="cc-comment" tabIndex={-1}>
        <div className="ls-c-head">
          <ClubIdentity p={comment} size="sm" as="p" />
          <time className="ls-c-time" dateTime={comment.created_at}>{ago(comment.created_at)}</time>
        </div>
        {parent && <p className="cc-reply-to">回覆 {clubOf(parent) || '會員社團'}</p>}
        <p className="ls-c-body">{comment.body}</p>
        <div className="cc-comment-actions">
          <button type="button" className="link-plain" disabled={busy} aria-expanded={replying}
            onClick={() => setActiveReply(replying ? null : comment.id)}>回覆</button>
          {comment.mine && <button type="button" className="link-plain danger" disabled={busy} onClick={() => void remove(comment)}>刪除</button>}
        </div>
        {replying && (
          <CommentForm id={`cc-reply-${comment.id}`} label="回覆" busy={busy}
            placeholder={`回覆 ${clubOf(comment) || '會員社團'}的留言`}
            onSend={body => send(body, comment.id)} onCancel={() => setActiveReply(null)} />
        )}
      </div>
    )
  }

  return (
    <section className="cc" aria-labelledby="cc-h">
      <h2 id="cc-h">會員留言{list && list.length > 0 ? `（${list.length}）` : ''}</h2>
      <p className="cc-note">只有島鏈會員看得到，留言會顯示你們的社團名稱。</p>
      {loadError && <div className="cc-actions">
        <p className="status" role="alert">留言讀取失敗。</p>
        <button className="link-plain" disabled={busy} type="button" onClick={() => void load()}>重新讀取</button>
      </div>}
      {deleteError && <p className="status" role="alert">刪除失敗，請再試一次。</p>}
      {list && target && !byId.has(Number(target)) && !loadError && <p className="status">找不到這則留言，可能已被刪除。</p>}
      {!loadError && list === null && <p className="status">讀取留言中⋯</p>}
      {!loadError && list?.length === 0 && <p className="section-lede">還沒有留言。有什麼想法、相似的經驗，或想問問這篇的社團，都可以留在這裡。</p>}
      {threads.length > 0 && (
        <ul className="ls-c-list">
          {threads.map(([root, ...replies]) => (
            <li key={root.id}>
              {renderComment(root)}
              {replies.length > 0 && (
                <ul className="cc-replies" aria-label="留言回覆">
                  {replies.map(reply => <li key={reply.id}>{renderComment(reply)}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <CommentForm id="cc-text" label="留言" busy={busy} onSend={send}
        identity={me ? <ClubIdentity p={me} size="sm" as="p" /> : undefined}
        placeholder={intro ? '想認識這個社團、或有想交流的事，都可以留言' : '分享你們的想法或經驗，或問問寫這篇的社團'} />
    </section>
  )
}

function CommentForm({ id, label, busy, placeholder, identity, onSend, onCancel }: {
  id: string; label: string; busy: boolean; placeholder: string; identity?: ReactNode
  onSend: (body: string) => Promise<void>; onCancel?: () => void
}) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)

  const isReply = !!onCancel
  useEffect(() => { if (isReply) field.current?.focus() }, [isReply])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const body = text.trim()
    if (!body) { setMessage('請先寫點什麼。'); return }
    try {
      await onSend(body)
      setText('')
      setMessage('')
    } catch {
      setMessage(`${label}沒有送出，請重新整理留言或再試一次。`)
    }
  }

  return (
    <form className="ls-c-form" aria-label={label} onSubmit={submit}>
      {identity}
      <div className="sf-field">
        <label htmlFor={id} className="sr-only">{label}</label>
        <textarea id={id} ref={field} value={text} maxLength={COMMENT_MAX} disabled={busy}
          onChange={e => { setText(e.target.value); setMessage('') }} placeholder={placeholder} />
      </div>
      <div className="cc-actions">
        <button className="btn primary mb-inline-btn" type="submit" disabled={busy}>送出{label}</button>
        {onCancel && <button className="btn ghost mb-inline-btn" type="button" disabled={busy} onClick={onCancel}>取消</button>}
      </div>
      {message && <p className="status" role="status">{message}</p>}
    </form>
  )
}
