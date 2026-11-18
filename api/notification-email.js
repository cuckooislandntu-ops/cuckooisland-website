import { timingSafeEqual } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SITE = 'https://cuckooisland-website.vercel.app'

function authorized(header, secret) {
  if (typeof header !== 'string') return false
  const given = Buffer.from(header)
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

async function send(job, mailKey, from, site) {
  const link = new URL(job.link_path, site)
  const settings = new URL('/notifications', site)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mailKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `member-notification/${job.notification_id}`,
    },
    body: JSON.stringify({
      from,
      to: [job.email],
      subject: `布穀島社｜${job.title}`,
      text: `${job.title}。請登入布穀島社網站查看：\n${link.href}\n\n通知設定：${settings.href}`,
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Resend HTTP ${response.status}`)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false })
  }

  const { NOTIFICATION_JOB_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, NOTIFICATION_FROM, SITE_URL } = process.env
  if (!NOTIFICATION_JOB_SECRET || !authorized(req.headers.authorization, NOTIFICATION_JOB_SECRET)) {
    return res.status(401).json({ ok: false })
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY || !NOTIFICATION_FROM) {
    return res.status(503).json({ ok: false, error: 'Missing mail configuration' })
  }

  try {
    const site = new URL(SITE_URL || DEFAULT_SITE)
    if (site.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS')
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: jobs, error } = await db.rpc('claim_notification_emails').abortSignal(AbortSignal.timeout(4000))
    if (error) throw error

    const results = await Promise.allSettled(jobs.map(async (job, index) => {
      // Pace the batch within Resend's request rate.
      if (index) await delay(index * 550)
      await send(job, RESEND_API_KEY, NOTIFICATION_FROM, site)
      const { error: finishError } = await db.rpc('finish_notification_email', {
        p_id: job.notification_id,
        p_attempt: job.attempt,
      }).abortSignal(AbortSignal.timeout(4000))
      if (finishError) throw finishError
    }))
    const failed = results.filter(result => result.status === 'rejected').length
    return res.status(failed ? 502 : 200).json({ ok: failed === 0, sent: results.length - failed, failed })
  } catch {
    return res.status(502).json({ ok: false, error: 'Notification email job failed' })
  }
}
