import { useEffect, useState } from 'react'
import { PageShell } from '@/components/Chrome'
import { POSTS } from '@/lib/content'
import { isApproved, useMember } from '@/lib/member'
import {
  NOTIFICATION_PAGE_SIZE, fetchEmailPreference, fetchNotifications, markNotificationsRead, saveEmailPreference,
} from '@/lib/notifications'
import type { Notification } from '@/lib/notifications'
import { to } from '@/lib/site'

const dateFormat = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })

export default function Notifications() {
  const member = useMember()

  return (
    <PageShell kind="member" title="通知" lede="查看站內通知並管理郵件通知設定。" tint="#E9E2F3">
      {!member.ready ? <p className="status" role="status">確認登入狀態中⋯</p>
        : isApproved(member) && member.session ? (
          <div className="notification-page" key={member.session.user.id}>
            <Inbox />
            <EmailSettings userId={member.session.user.id} email={member.session.user.email} />
          </div>
        ) : (
          <a className="btn primary" href={to('member')}>前往會員專區登入</a>
        )}
    </PageShell>
  )
}

function Inbox() {
  const [items, setItems] = useState<Notification[] | null>(null)
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [message, setMessage] = useState('')

  async function load(before?: number, signal?: AbortSignal) {
    setLoading(true)
    setMessage('')
    try {
      const rows = await fetchNotifications(before)
      if (signal?.aborted) return
      const page = rows.slice(0, NOTIFICATION_PAGE_SIZE)
      setMore(rows.length > page.length)
      setItems(previous => before === undefined ? page : [...(previous ?? []), ...page])
    } catch {
      if (!signal?.aborted) setMessage('通知讀取失敗，請再試一次。')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void load(undefined, controller.signal)
    return () => controller.abort()
  }, [])

  async function markRead(id?: number) {
    setMarking(true)
    setMessage('')
    try {
      const readAt = await markNotificationsRead(id)
      setItems(previous => previous?.map(n => !n.read_at && (id === undefined || n.id === id) ? { ...n, read_at: readAt } : n) ?? null)
    } catch {
      setMessage('無法標記為已讀，請再試一次。')
    } finally {
      setMarking(false)
    }
  }

  return (
    <section className="sheet mb-box" aria-labelledby="inbox-title">
      <div className="notification-inbox-header">
        <h2 id="inbox-title">站內通知</h2>
        <div className="notification-actions">
          <a className="link-plain" href="#notification-settings">通知設定</a>
          <button className="link-plain" type="button" disabled={loading || marking} onClick={() => void load()}>重新整理</button>
          {items?.some(n => !n.read_at) && (
            <button className="link-plain" type="button" disabled={loading || marking} onClick={() => void markRead()}>全部標為已讀</button>
          )}
        </div>
      </div>
      {loading && !items && <p className="status" role="status">讀取通知中⋯</p>}
      {items?.length === 0 && <p className="section-lede">目前沒有通知。</p>}
      {items && items.length > 0 && (
        <ul className="notification-list">
          {items.map(n => {
            const slug = n.kind === 'column_reply' ? n.link_path.match(/^\/column\/([a-z0-9-]+)#/)?.[1] : undefined
            const post = slug && POSTS.find(p => p.id === `post-${slug}`)
            return (
              <li key={n.id}>
                <a href={n.link_path} onClick={e => {
                  if (!n.read_at && !marking && !loading && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) void markRead(n.id)
                }}>
                  <strong>{!n.read_at && <span className="notification-unread">未讀</span>}{n.title}</strong>
                  {post && <span>{post.title}</span>}
                </a>
                <time dateTime={n.created_at}>{dateFormat.format(new Date(n.created_at))}</time>
              </li>
            )
          })}
        </ul>
      )}
      {more && items && (
        <button className="btn ghost mb-inline-btn" type="button" disabled={loading || marking} onClick={() => void load(items.at(-1)?.id)}>
          {loading ? '讀取中⋯' : '載入更多'}
        </button>
      )}
      {message && <p className="status" role="alert">{message}</p>}
    </section>
  )
}

function EmailSettings({ userId, email }: { userId: string; email?: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')

  async function load(signal?: AbortSignal) {
    setBusy(true)
    setMessage('')
    try {
      const value = await fetchEmailPreference(userId)
      if (!signal?.aborted) setEnabled(value)
    } catch {
      if (!signal?.aborted) setMessage('讀取郵件通知設定失敗。')
    } finally {
      if (!signal?.aborted) setBusy(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [userId])

  async function save(value: boolean) {
    const previous = enabled
    setEnabled(value)
    setBusy(true)
    setMessage('')
    try {
      await saveEmailPreference(userId, value)
      setMessage(value ? '已開啟郵件通知。' : '已關閉郵件通知。')
    } catch {
      setEnabled(previous)
      setMessage('設定儲存失敗，請再試一次。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sheet mb-box" aria-labelledby="notification-settings">
      <h2 id="notification-settings">通知設定</h2>
      <p id="notification-email-help">
        開啟後，新的通知會寄到你的登入信箱{email && <>（{email}）</>}。關閉郵件後，仍可在站內查看通知。
      </p>
      <label className="notification-email">
        <input type="checkbox" checked={enabled === true} disabled={busy || enabled === null || !email}
          aria-describedby="notification-email-help" onChange={e => void save(e.target.checked)} />
        接收郵件通知
      </label>
      {busy && <p className="status" role="status">{enabled === null ? '讀取設定中⋯' : '儲存設定中⋯'}</p>}
      {!busy && enabled === null && <button className="btn ghost mb-inline-btn" type="button" onClick={() => void load()}>重新讀取設定</button>}
      {message && <p className="status" role="status">{message}</p>}
    </section>
  )
}
