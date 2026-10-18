// 每天叫醒 Supabase 一次（vercel.json 的 crons 會呼叫 /api/keepalive）。
// 免費版的 Supabase 專案一週沒人用會自動暫停；這裡呼叫 supabase/setup.sql 裡的 ping() 函式，算是一次使用。
const URL = 'https://yvoxjmfemdtswpkaqiim.supabase.co'
const KEY = 'sb_publishable_YexEM7Mlxt0X_ic6SqrlQw_N_3lSUj7' // 公開用的 key，和 src/lib/member.ts 相同

export default async function handler(req, res) {
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/ping`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: '{}' })
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status })
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e) })
  }
}
