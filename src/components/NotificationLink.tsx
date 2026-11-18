import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { NOTIFICATIONS_READ_EVENT, unreadNotificationCount } from '@/lib/notifications'
import { to } from '@/lib/site'

export default function NotificationLink({ current }: { current: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let request = 0
    const refresh = async () => {
      const latest = ++request
      try {
        const unread = await unreadNotificationCount()
        if (latest === request) setCount(unread)
      } catch { /* 下次回到頁面或定時更新時重試。 */ }
    }

    void refresh()
    const timer = window.setInterval(() => { if (!document.hidden) void refresh() }, 45_000)
    window.addEventListener('focus', refresh)
    window.addEventListener(NOTIFICATIONS_READ_EVENT, refresh)
    return () => {
      request++
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, refresh)
    }
  }, [current])

  return (
    <a className="menu-btn notification-link" aria-current={current ? 'page' : undefined} href={to('notifications')}
      aria-label={count ? `通知（${count} 則未讀）` : '通知'} title="通知">
      <Bell aria-hidden="true" />
      {count > 0 && <span aria-hidden="true">{count > 99 ? '99+' : count}</span>}
    </a>
  )
}
