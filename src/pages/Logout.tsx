// 登出頁（/logout）：一打開就登出，並確認已經登出。會員專區和選單裡的「登出」都連到這裡。
import { useEffect, useState } from 'react'
import { PageShell } from '@/components/Chrome'
import { to } from '@/lib/site'
import { MEMBER_ENABLED, signOut, useMember } from '@/lib/member'

export default function Logout() {
  const m = useMember()
  const [done, setDone] = useState(!MEMBER_ENABLED)
  useEffect(() => {
    if (!MEMBER_ENABLED || !m.ready) return
    if (!m.session) { setDone(true); return }
    void signOut().then(() => setDone(true))
  }, [m.ready, m.session])

  return (
    <PageShell kind="logout" title={done ? '你已經登出了' : '登出中⋯'} tint="#F3E2B8"
      lede={done ? '下次見！在公用電腦上用完，記得也登出 Google 帳號。' : '正在幫你登出，請稍等。'}>
      <div className="sheet mb-box" role="status" aria-live="polite">
        <h2>{done ? '已登出布穀島會員專區' : '登出中⋯'}</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>{done ? '要再看經營手冊或會員名錄，重新登入就好。' : '這通常只要一秒。'}</p>
        {done && <div className="mb-out-actions">
          <a className="btn primary mb-inline-btn" href={to('member')}>重新登入</a>
          <a className="btn ghost mb-inline-btn" href={to('')}>回首頁</a>
        </div>}
      </div>
    </PageShell>
  )
}
