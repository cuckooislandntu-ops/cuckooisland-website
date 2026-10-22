// 專欄文章底下的會員留言：已開通的會員社團可以看、可以留言、可以刪自己的留言；
// 沒登入或還沒開通的人只會看到說明（留言內容不公開）。資料在 src/lib/comments.ts、supabase/comments.sql。
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import ClubIdentity from '@/components/ClubIdentity'
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
  return <Thread postId={postId} intro={intro} />
}

function Thread({ postId, intro }: { postId: string; intro?: boolean }) {
  const me = useMember().profile
  const [list, setList] = useState<ColumnComment[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const load = useCallback(() => fetchColumnComments(postId).then(setList, () => { setList([]); setMsg('留言讀取失敗，請重新整理再試一次。') }), [postId])
  useEffect(() => { setList(null); void load() }, [load])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) { setMsg('請先寫點什麼。'); return }
    setBusy(true)
    try { await addColumnComment(postId, t); setText(''); setMsg(''); await load() } catch (er) { setMsg('留言沒有送出：' + (er as Error).message) }
    setBusy(false)
  }
  const del = async (c: ColumnComment) => {
    if (!confirm('確定要刪除這則留言？')) return
    try { await deleteColumnComment(c.id); await load() } catch (er) { setMsg('刪除失敗：' + (er as Error).message) }
  }

  return (
    <section className="cc" aria-labelledby="cc-h">
      <h2 id="cc-h">會員留言{list && list.length > 0 ? `（${list.length}）` : ''}</h2>
      <p className="cc-note">只有島鏈會員看得到，留言會顯示你們的社團名稱。</p>
      {list === null ? <p className="status">讀取留言中⋯</p>
        : list.length === 0 ? <p className="section-lede">還沒有留言。有什麼想法、相似的經驗，或想問問這篇的社團，都可以留在這裡。</p>
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
          <label htmlFor="cc-text" className="sr-only">留言</label>
          <textarea id="cc-text" value={text} maxLength={COMMENT_MAX} onChange={e => { setText(e.target.value); setMsg('') }}
            placeholder={intro ? '想認識這個社團、或有想交流的事，都可以留言' : '分享你們的想法或經驗，或問問寫這篇的社團'} />
        </div>
        <div className="sf-submit">
          <button className="btn primary mb-inline-btn" type="submit" disabled={busy}>{busy ? '送出中⋯' : '送出留言'}</button>
          <p className="status" role="status" aria-live="polite">{msg}</p>
        </div>
      </form>
    </section>
  )
}
