// 會員專區（/member）
// 沒登入：說明＋用 Google 登入。登入後：先填個人檔案 → 等布穀島夥伴審核（Supabase 後台把 status 改成 approved）
// 通過後：公告、會員名錄、我的檔案三個分頁。資料都在 Supabase（src/lib/member.ts、supabase/setup.sql）。
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Empty } from '@/components/Chrome'
import MemberGuide from '@/components/MemberGuide'
import { PillTab, PillTabsList } from '@/components/PillTabs'
import { CLUBS } from '@/lib/content'
import { to } from '@/lib/site'
import {
  CONTACTS, MEMBER_ENABLED, contactHref, contactLabel, fetchDirectory, fetchPosts, isApproved, refreshProfile, saveProfile, signIn, signOut, useMember,
} from '@/lib/member'
import type { DirectoryEntry, EditableProfile, MemberPost, Profile } from '@/lib/member'

const OTHER = '__other'
const clubOf = (p: Pick<Profile, 'club_id' | 'club_name'>) => CLUBS.find(c => c.id === p.club_id)?.name || p.club_name

export default function Member() {
  const m = useMember()
  const p = m.profile
  let body: ReactNode
  if (!MEMBER_ENABLED) body = <Empty title="會員功能準備中">正式網站才能登入。預覽版看不到會員功能。</Empty>
  else if (!m.ready) body = <p className="status" role="status">確認登入狀態中⋯</p>
  else if (!m.session) body = <SignedOut error={m.error} />
  else if (!p) body = <div className="sheet mb-box"><p style={{ margin: 0 }}>{m.error || '正在準備你的會員資料⋯'}</p><Who email={m.session.user.email || ''} /></div>
  else if (p.status === 'suspended') body = <div className="sheet mb-box"><h2>這個帳號目前停用</h2><p className="section-lede" style={{ marginTop: 0 }}>有疑問的話，私訊 IG <a href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer">@cuckoo_island</a>。</p><Who email={p.email} /></div>
  else if (!isApproved(m)) body = <Pending profile={p} />
  else body = <Approved profile={p} />

  const mood = !m.session || !p ? 'out' : isApproved(m) ? 'member' : 'pending'
  return (
    <main className="page" id="main">
      <section className="hero-band mb-hero">
        <div className="hero-inner">
          <h1>會員專區</h1>
          <p className="lede">島鏈會員的小據點：看公告、找到其他社團的夥伴，也讓大家認識你。</p>
          <MemberGuide mood={mood} name={p?.name || ''} />
        </div>
      </section>
      <div className="content"><div className="content-inner">{body}</div></div>
    </main>
  )
}

function Who({ email }: { email: string }) {
  return (
    <p className="mb-who">
      目前登入：{email}
      <button type="button" className="link-plain" onClick={() => void signOut()}>登出</button>
    </p>
  )
}

function GoogleButton({ label = '用 Google 登入' }: { label?: string }) {
  return (
    <button type="button" className="btn primary mb-google" onClick={() => void signIn()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FFFDF6" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" /><path fill="#D6EC6E" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" /><path fill="#F7C948" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" /><path fill="#F4A7A0" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 5.9 12 5.9z" /></svg>
      {label}
    </button>
  )
}

/* ---------- 還沒登入 ---------- */
function SignedOut({ error }: { error: string }) {
  return (
    <>
      <div className="sheet mb-box">
        <h2>登入會員專區</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>請用申請加入時留的 Google 帳號登入。第一次登入會請你填一份簡單的個人檔案。</p>
        <GoogleButton />
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
      <div>
        <h2>登入之後</h2>
        <ol className="steps" style={{ marginTop: 12 }}>
          <li><div><b>填好你的檔案</b><span>姓名、社團、職位和習慣的聯絡方式，大概 2 分鐘。</span></div></li>
          <li><div><b>等布穀島夥伴確認</b><span>我們確認你是島鏈會員後，就會開通。通常幾天內完成。</span></div></li>
          <li><div><b>打開會員資源</b><span>經營手冊的每一份檔案、會員公告，以及其他社團夥伴的聯絡方式。</span></div></li>
        </ol>
      </div>
      <Empty title="還不是會員？" action={<a className="btn primary mb-inline-btn" href={to('join')}>申請加入島鏈</a>}>
        先填會員申請表單。通過後，用表單上留的 Google 帳號回來登入。
      </Empty>
    </>
  )
}

/* ---------- 審核中 ---------- */
function Pending({ profile }: { profile: Profile }) {
  const filled = !!(profile.name && (profile.club_id || profile.club_name) && profile.contact_method && profile.contact_value)
  const [checking, setChecking] = useState(false)
  return (
    <>
      <div className="sheet mb-box">
        <p className="mb-badge">{filled ? '審核中' : '第一步'}</p>
        <h2>{filled ? '資料收到了，等布穀島夥伴確認' : '先填好你的檔案'}</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>
          {filled
            ? '確認你是島鏈會員後就會開通，通常幾天內完成。急的話可以私訊 IG @cuckoo_island。'
            : '布穀島夥伴會依這份資料確認你的會員身分。開通後，其他會員也能在會員名錄看到你（不想公開可以關掉）。'}
        </p>
        {filled && <button type="button" className="btn ghost mb-inline-btn" disabled={checking}
          onClick={async () => { setChecking(true); await refreshProfile(); setChecking(false) }}>{checking ? '確認中⋯' : '重新確認狀態'}</button>}
        <Who email={profile.email} />
      </div>
      <ProfileForm profile={profile} submitLabel={filled ? '更新檔案' : '送出檔案'} />
    </>
  )
}

/* ---------- 已通過 ---------- */
function Approved({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState(() => (location.hash === '#profile' ? 'profile' : 'posts'))
  return (
    <>
      <div className="mb-hello">
        {profile.avatar_url && <img src={profile.avatar_url} alt="" width={48} height={48} referrerPolicy="no-referrer" />}
        <div>
          <h2>{profile.name || '島鏈會員'}，歡迎回來</h2>
          <Who email={profile.email} />
        </div>
      </div>
      <a className="mb-hb-link" href={to('handbook')}>
        <b>經營手冊</b><span>每一章的檔案都打開了</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </a>
      <Tabs.Root value={tab} onValueChange={setTab} className="mb-tabs">
        <PillTabsList cols={3} aria-label="會員專區">
          <PillTab value="posts">公告</PillTab>
          <PillTab value="people">會員名錄</PillTab>
          <PillTab value="profile">我的檔案</PillTab>
        </PillTabsList>
        <Tabs.Content value="posts"><Posts /></Tabs.Content>
        <Tabs.Content value="people"><Directory me={profile.id} /></Tabs.Content>
        <Tabs.Content value="profile"><ProfileForm profile={profile} submitLabel="儲存" /></Tabs.Content>
      </Tabs.Root>
    </>
  )
}

function useLoad<T>(load: () => Promise<T>) {
  const [s, setS] = useState<{ data?: T; error?: string }>({})
  useEffect(() => {
    let alive = true
    load().then(data => alive && setS({ data }), e => alive && setS({ error: '讀取失敗，請重新整理再試一次。' + (e?.message ? `（${e.message}）` : '') }))
    return () => { alive = false }
  }, [load])
  return s
}

const fmt = (d: string) => { const t = new Date(d); return isNaN(+t) ? '' : `${t.getFullYear()}/${t.getMonth() + 1}/${t.getDate()}` }

function Posts() {
  const { data, error } = useLoad<MemberPost[]>(fetchPosts)
  if (error) return <p className="field-error">{error}</p>
  if (!data) return <p className="status">讀取中⋯</p>
  if (!data.length) return <Empty title="還沒有公告">有新的活動、贊助品或會員資源時，會先貼在這裡。</Empty>
  return (
    <ul className="mb-posts">
      {data.map(p => (
        <li key={p.id} className="sheet">
          <p className="mb-post-meta">{p.pinned && <span className="mb-badge">置頂</span>}{fmt(p.created_at)}</p>
          <h3>{p.title}</h3>
          {p.body && <div className="mb-post-body">{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>}
          {p.link_url && <a className="btn ghost mb-inline-btn" href={p.link_url} target="_blank" rel="noopener noreferrer">{p.link_label || '打開連結'}</a>}
        </li>
      ))}
    </ul>
  )
}

function Directory({ me }: { me: string }) {
  const { data, error } = useLoad<DirectoryEntry[]>(fetchDirectory)
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return (data || []).filter(d => !k || [d.name, clubOf(d), d.school, d.club_role].some(t => t?.toLowerCase().includes(k)))
  }, [data, q])
  if (error) return <p className="field-error">{error}</p>
  if (!data) return <p className="status">讀取中⋯</p>
  return (
    <div className="mb-dir">
      <div className="sf-field">
        <label htmlFor="mb-q">找夥伴</label>
        <input id="mb-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="姓名、社團或學校" autoComplete="off" />
      </div>
      <p className="status" aria-live="polite">{q ? `找到 ${list.length} 位` : `共 ${data.length} 位會員`}</p>
      {list.length === 0
        ? <Empty title={q ? '找不到符合的夥伴' : '名錄還是空的'}>{q ? '換個關鍵字試試。' : '會員開通、填好檔案後就會出現在這裡。'}</Empty>
        : <ul className="mb-people">
            {list.map(d => {
              const href = contactHref(d.contact_method, d.contact_value)
              return (
                <li key={d.id} className="sheet">
                  <div className="mb-person-top">
                    {d.avatar_url ? <img src={d.avatar_url} alt="" width={44} height={44} loading="lazy" referrerPolicy="no-referrer" /> : <span className="mb-initial" aria-hidden="true">{d.name.slice(0, 1)}</span>}
                    <div>
                      <h3>{d.name}{d.id === me && <small>（你）</small>}</h3>
                      <p>{[clubOf(d), d.club_role].filter(Boolean).join('・')}</p>
                      {d.school && <p>{d.school}</p>}
                    </div>
                  </div>
                  {d.bio && <p className="mb-bio">{d.bio}</p>}
                  {d.contact_method && d.contact_value && (
                    <p className="mb-contact">
                      <span>{contactLabel(d.contact_method)}</span>
                      {href ? <a href={href} target="_blank" rel="noopener noreferrer">{d.contact_value}</a> : <b>{d.contact_value}</b>}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>}
      <p className="status">只有已開通的會員看得到這份名錄。請不要轉傳給會員以外的人。</p>
    </div>
  )
}

/* ---------- 個人檔案表單 ---------- */
function ProfileForm({ profile, submitLabel }: { profile: Profile; submitLabel: string }) {
  const init = (): EditableProfile => ({
    name: profile.name, club_id: profile.club_id, club_name: profile.club_name, school: profile.school, club_role: profile.club_role,
    contact_method: profile.contact_method, contact_value: profile.contact_value, bio: profile.bio, show_in_directory: profile.show_in_directory,
  })
  const [f, setF] = useState<EditableProfile>(init)
  const [club, setClub] = useState(() => profile.club_id && CLUBS.some(c => c.id === profile.club_id) ? profile.club_id : profile.club_name ? OTHER : '')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const up = (k: keyof EditableProfile, v: string | boolean) => { setF(s => ({ ...s, [k]: v })); setMsg('') }
  const clubs = useMemo(() => [...CLUBS].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')), [])
  const hint = CONTACTS.find(c => c.id === f.contact_method)?.hint

  const pickClub = (v: string) => {
    setClub(v); setMsg('')
    const c = CLUBS.find(x => x.id === v)
    setF(s => ({ ...s, club_id: c ? c.id : '', club_name: c ? '' : s.club_name, school: c && !s.school ? c.school : s.school }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v: EditableProfile = { ...f, name: f.name.trim(), club_name: club === OTHER ? f.club_name.trim() : '', club_id: club === OTHER ? '' : club,
      school: f.school.trim(), club_role: f.club_role.trim(), contact_value: f.contact_value.trim(), bio: f.bio.trim() }
    const er: Record<string, string> = {}
    if (!v.name) er.name = '請填姓名。'
    if (!club) er.club = '請選擇社團；不在名單上的話選「其他」。'
    else if (club === OTHER && !v.club_name) er.club_name = '請填社團全名。'
    if (!v.contact_method) er.contact_method = '請選一種聯絡方式。'
    else if (!v.contact_value) er.contact_value = '請填聯絡資訊。'
    setErrs(er)
    if (Object.keys(er).length) {
      setMsg('還有欄位沒填好。')
      document.getElementById('pf-' + Object.keys(er)[0])?.focus()
      return
    }
    setBusy(true)
    const err = await saveProfile(v)
    setBusy(false)
    setMsg(err || '已儲存。')
  }

  const fieldErr = (k: string) => errs[k] ? <p className="field-error" id={`pf-${k}-err`}>{errs[k]}</p> : null
  const inv = (k: string) => errs[k] ? { 'aria-invalid': true as const, 'aria-describedby': `pf-${k}-err` } : {}

  return (
    <form className="sheet mb-form" onSubmit={submit} noValidate>
      <h2>我的檔案</h2>
      <div className="sf-field">
        <label htmlFor="pf-name">姓名<em>必填</em></label>
        <input id="pf-name" value={f.name} onChange={e => up('name', e.target.value)} autoComplete="name" {...inv('name')} />
        {fieldErr('name')}
      </div>
      <div className="sf-field">
        <label htmlFor="pf-club">社團<em>必填</em></label>
        <select id="pf-club" value={club} onChange={e => pickClub(e.target.value)} {...inv('club')}>
          <option value="">請選擇</option>
          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value={OTHER}>其他（不在名單上）</option>
        </select>
        {fieldErr('club')}
      </div>
      {club === OTHER && (
        <div className="sf-field">
          <label htmlFor="pf-club_name">社團全名<em>必填</em></label>
          <input id="pf-club_name" value={f.club_name} onChange={e => up('club_name', e.target.value)} placeholder="例如：國立臺灣大學陽光椰子社會服務社" {...inv('club_name')} />
          {fieldErr('club_name')}
        </div>
      )}
      <div className="sf-field">
        <label htmlFor="pf-school">學校<em className="opt">選填</em></label>
        <input id="pf-school" value={f.school} onChange={e => up('school', e.target.value)} autoComplete="organization" />
      </div>
      <div className="sf-field">
        <label htmlFor="pf-role">社團職位<em className="opt">選填</em></label>
        <input id="pf-role" value={f.club_role} onChange={e => up('club_role', e.target.value)} placeholder="例如：社長、公關、教學長" />
      </div>
      <fieldset className="sf-group" id="pf-contact_method" tabIndex={-1} {...inv('contact_method')}>
        <legend>習慣的聯絡方式<em>必填</em></legend>
        <p className="sf-hint">其他會員和布穀島夥伴會用這個方式找你。</p>
        <div className="chips" role="radiogroup" aria-label="聯絡方式">
          {CONTACTS.map(c => (
            <button key={c.id} type="button" role="radio" className="chip" aria-checked={f.contact_method === c.id}
              onClick={() => up('contact_method', c.id)}>{c.label}</button>
          ))}
        </div>
        {fieldErr('contact_method')}
      </fieldset>
      {f.contact_method && (
        <div className="sf-field">
          <label htmlFor="pf-contact_value">{contactLabel(f.contact_method)}<em>必填</em></label>
          <input id="pf-contact_value" value={f.contact_value} onChange={e => up('contact_value', e.target.value)} placeholder={hint}
            inputMode={f.contact_method === 'phone' ? 'tel' : f.contact_method === 'email' ? 'email' : undefined} {...inv('contact_value')} />
          {fieldErr('contact_value')}
        </div>
      )}
      <div className="sf-field">
        <label htmlFor="pf-bio">簡介<em className="opt">選填</em></label>
        <textarea id="pf-bio" value={f.bio} onChange={e => up('bio', e.target.value)} maxLength={300} placeholder="你在社團負責什麼、可以幫忙什麼、想認識怎樣的夥伴" />
      </div>
      <label className="mb-check">
        <input type="checkbox" checked={f.show_in_directory} onChange={e => up('show_in_directory', e.target.checked)} />
        <span>在會員名錄顯示我的檔案<small>只有開通的會員看得到，不會顯示 Email 登入帳號。</small></span>
      </label>
      <div className="sf-submit">
        <button className="btn primary" type="submit" disabled={busy}>{busy ? '儲存中⋯' : submitLabel}</button>
        <p className="status" role="status" aria-live="polite">{msg}</p>
      </div>
    </form>
  )
}
