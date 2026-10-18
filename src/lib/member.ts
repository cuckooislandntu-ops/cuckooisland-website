// 會員功能：用 Google 登入（Supabase）。資料表與權限在 supabase/setup.sql，設定步驟見維護說明「會員登入」。
// 這裡的網址和 publishable key 本來就是公開用的，可以放在程式裡；真正的權限由 Supabase 的資料表規則把關。
// 絕對不要把 secret key（sb_secret_ 開頭）或 service_role key 放進網站。
import { createClient } from '@supabase/supabase-js'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useSyncExternalStore } from 'react'

const SUPABASE_URL = 'https://yvoxjmfemdtswpkaqiim.supabase.co'
const SUPABASE_KEY = 'sb_publishable_YexEM7Mlxt0X_ic6SqrlQw_N_3lSUj7'

declare const __PATH_ROUTES__: boolean
// claude.ai 預覽版沒辦法連到 Supabase，會員功能只在正式網站開啟
export const MEMBER_ENABLED = typeof __PATH_ROUTES__ !== 'undefined' && __PATH_ROUTES__ && !!SUPABASE_KEY

export type ContactMethod = '' | 'line' | 'ig' | 'email' | 'phone' | 'fb' | 'other'
export type Profile = {
  id: string; email: string; status: 'pending' | 'approved' | 'suspended'
  name: string; club_id: string; club_name: string; school: string; service_types: string[]
  contact_method: ContactMethod; contact_value: string; show_in_directory: boolean; avatar_url: string
}
// 會員資料以社團為單位：社團、服務性質、聯絡方式
export type EditableProfile = Pick<Profile, 'club_id' | 'club_name' | 'school' | 'service_types' | 'contact_method' | 'contact_value' | 'show_in_directory'>
export type DirectoryEntry = Pick<Profile, 'id' | 'club_id' | 'club_name' | 'school' | 'service_types' | 'contact_method' | 'contact_value' | 'avatar_url'>
export const SERVICE_TYPES = ['營隊', '課輔', '線上課輔', '平日服務', '偏鄉服務', '國際服務']
export type MemberPost = { id: number; title: string; body: string; link_url: string; link_label: string; pinned: boolean; created_at: string }
export type HandbookRow = { chapter: number; title: string; url: string; date: string | null; scenes: string[]; sort: number }

let client: SupabaseClient | null = null
export const sb = () => {
  if (!MEMBER_ENABLED) return null
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } })
  return client
}

// ---------- 共用的登入狀態（頁首、會員專區、經營手冊都讀同一份） ----------
export type MemberState = {
  ready: boolean            // 已經確認過登入狀態
  session: Session | null
  profile: Profile | null
  error: string             // 登入失敗之類的訊息
}
let state: MemberState = { ready: !MEMBER_ENABLED, session: null, profile: null, error: '' }
const subs = new Set<() => void>()
const set = (s: Partial<MemberState>) => { state = { ...state, ...s }; subs.forEach(f => f()) }
let started = false

async function loadProfile(session: Session | null) {
  const c = sb()
  if (!c || !session) { set({ ready: true, session, profile: null }); return }
  // 第一次登入時，資料庫會自動建立檔案；偶爾慢一點，就再試一次
  for (let i = 0; i < 3; i++) {
    const { data, error } = await c.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    if (data) {
      const p = data as Profile
      // 只有核可名單上的帳號能用：沒開通的帳號直接登出（正常情況下 Supabase 的 hook 已經在 Google 登入時擋掉了）
      if (p.status !== 'approved') {
        await c.auth.signOut()
        set({ ready: true, session: null, profile: null, error: p.status === 'suspended' ? 'SUSPENDED' : 'NOT_ALLOWED' })
        return
      }
      set({ ready: true, session, profile: { ...p, service_types: p.service_types || [] } })
      return
    }
    if (error) { set({ ready: true, session, profile: null, error: '讀不到你的會員資料，請重新整理再試一次。' }); return }
    await new Promise(r => setTimeout(r, 700))
  }
  set({ ready: true, session, profile: null, error: '找不到你的會員資料，請重新整理再試一次。' })
}

function start() {
  if (started) return
  started = true
  const c = sb()
  if (!c) return
  // Google 登入失敗時，網址會帶著錯誤訊息回來
  const q = new URLSearchParams(location.search)
  const err = q.get('error_description') || q.get('error')
  if (err) {
    // 不在核可名單上（supabase/setup.sql 的 hook_allowlist_signup）時，Supabase 可能把人送回首頁；帶著訊息轉到會員專區
    if (!/^\/(member|handbook)\/?$/.test(location.pathname)) { location.replace('/member' + location.search); return }
    set({ error: /not_allowlisted|hook/i.test(err)
      ? 'NOT_ALLOWED'
      : '登入沒有成功，請再試一次。' + (/access_denied/.test(err) ? '' : `（${err}）`) })
  }
  const clean = () => {
    const u = new URL(location.href)
    if (!['code', 'error', 'error_code', 'error_description', 'state'].some(k => u.searchParams.has(k))) return
    ;['code', 'error', 'error_code', 'error_description', 'state'].forEach(k => u.searchParams.delete(k))
    history.replaceState(history.state, '', u.pathname + (u.search === '?' ? '' : u.search) + u.hash)
  }
  let last = ''
  c.auth.onAuthStateChange((event, session) => {
    const id = session?.user.id ?? ''
    if (event === 'TOKEN_REFRESHED' && id === last) { set({ session }); return }
    last = id
    clean()
    // 不要在這個回呼裡直接等待資料庫（supabase-js 的建議），放到下一輪
    setTimeout(() => { void loadProfile(session) }, 0)
  })
}

export function useMember(): MemberState {
  useEffect(start, [])
  return useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb) } }, () => state, () => state)
}
export const isApproved = (m: MemberState) => m.profile?.status === 'approved'

export async function signIn() {
  const c = sb()
  if (!c) return
  set({ error: '' })
  const { error } = await c.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } },
  })
  if (error) set({ error: '沒辦法開啟 Google 登入：' + error.message })
}

export async function signOut() {
  await sb()?.auth.signOut()
  set({ session: null, profile: null, error: '' })
}

export async function saveProfile(p: EditableProfile): Promise<string> {
  const c = sb(), id = state.session?.user.id
  if (!c || !id) return '請先登入。'
  const { data, error } = await c.from('profiles').update(p).eq('id', id).select('*').single()
  if (error) return '存檔沒有成功：' + error.message
  set({ profile: { ...(data as Profile), service_types: (data as Profile).service_types || [] } })
  return ''
}

// 重新讀一次（例如管理者剛審核通過）
export const refreshProfile = () => loadProfile(state.session)

export async function fetchDirectory(): Promise<DirectoryEntry[]> {
  const { data, error } = await sb()!.rpc('member_directory')
  if (error) throw error
  return (data || []) as DirectoryEntry[]
}
export async function fetchPosts(): Promise<MemberPost[]> {
  const { data, error } = await sb()!.from('member_posts').select('id,title,body,link_url,link_label,pinned,created_at')
    .order('pinned', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as MemberPost[]
}
export async function fetchHandbook(): Promise<{ files: HandbookRow[]; folder: string }> {
  const c = sb()!
  const [f, s] = await Promise.all([
    c.from('handbook_files').select('chapter,title,url,date,scenes,sort').order('chapter').order('sort').order('id'),
    c.from('member_settings').select('value').eq('key', 'handbook_folder_url').maybeSingle(),
  ])
  if (f.error) throw f.error
  return { files: (f.data || []) as HandbookRow[], folder: (s.data?.value as string) || '' }
}

// ---------- 聯絡方式 ----------
export const CONTACTS: { id: Exclude<ContactMethod, ''>; label: string; hint: string }[] = [
  { id: 'ig', label: 'Instagram', hint: '社團帳號，例如 @cuckoo_island' },
  { id: 'email', label: 'Email', hint: '社團信箱，例如 club@gmail.com' },
  { id: 'fb', label: 'Facebook', hint: '粉專網址' },
  { id: 'other', label: '其他', hint: '寫下怎麼找到你們' },
]
// LINE、電話已經不開放選，但舊資料仍照樣顯示
const LABELS: Record<string, string> = { line: 'LINE', phone: '電話', ig: 'Instagram', email: 'Email', fb: 'Facebook', other: '其他' }
export const contactLabel = (m: ContactMethod) => LABELS[m] || ''
/** 把聯絡方式變成可以點的連結；沒辦法變成連結的就回傳空字串 */
export function contactHref(m: ContactMethod, v: string): string {
  const t = v.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  if (m === 'email' && /^[^\s@]+@[^\s@]+$/.test(t)) return 'mailto:' + t
  if (m === 'phone') { const d = t.replace(/[^\d+]/g, ''); return d.length >= 8 ? 'tel:' + d : '' }
  if (m === 'ig') { const h = t.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, ''); return /^[\w.]+$/.test(h) ? 'https://www.instagram.com/' + h + '/' : '' }
  if (m === 'line' && /^line\.me\//i.test(t)) return 'https://' + t
  if (m === 'fb' && /^(www\.)?facebook\.com\//i.test(t)) return 'https://' + t
  return ''
}
