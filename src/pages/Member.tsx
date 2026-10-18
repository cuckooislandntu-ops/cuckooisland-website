// 會員專區（/member）
// 只有核可名單（Supabase allowed_emails）上的 Google 帳號能登入；不在名單上的，Google 登入時就會被擋下。
// 會員資料以社團為單位：社團、服務性質、聯絡方式。第一次登入先填社團資料，之後是公告、社團名錄、我們的社團三個分頁。
// 資料都在 Supabase（src/lib/member.ts、supabase/setup.sql）。
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Empty } from '@/components/Chrome'
import MemberGuide from '@/components/MemberGuide'
import { PillTab, PillTabsList } from '@/components/PillTabs'
import ClubIdentity, { clubOf, mapClub, schoolOf } from '@/components/ClubIdentity'
import { CLUBS } from '@/lib/content'
import { to } from '@/lib/site'
import {
  CONTACTS, MEMBER_ENABLED, SERVICE_TYPES, contactHref, contactsOf, contactLabel, fetchDirectory, fetchPosts, isApproved, saveProfile, signIn, useMember,
} from '@/lib/member'
import type { Contact, ContactMethod, DirectoryEntry, EditableProfile, MemberPost, Profile } from '@/lib/member'

const IG = 'https://www.instagram.com/cuckoo_island/'
const hasClub = (p: Profile) => !!(clubOf(p) && contactsOf(p).length)

export default function Member() {
  const m = useMember()
  const p = m.profile
  let body: ReactNode
  if (!MEMBER_ENABLED) body = <Empty title="會員功能準備中">正式網站才能登入。預覽版看不到會員功能。</Empty>
  else if (!m.ready) body = <p className="status" role="status">確認登入狀態中⋯</p>
  else if (!m.session || !p || !isApproved(m)) body = m.session && !m.error ? <p className="status" role="status">確認會員資格中⋯</p> : <SignedOut error={m.error} />
  else if (!hasClub(p)) body = <FirstTime profile={p} />
  else body = <Approved profile={p} />

  const mood = p && isApproved(m) ? 'member' : 'out'
  return (
    <main className="page" id="main">
      <section className="hero-band mb-hero">
        <div className="hero-inner">
          <h1>會員專區</h1>
          <p className="lede">島鏈社團的小據點：看公告、找到其他社團，也讓大家認識你們。</p>
          <MemberGuide mood={mood} name={p ? clubOf(p) : ''} />
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
      <a className="link-plain" href={to('logout')}>登出</a>
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

/* ---------- 還沒登入／沒有權限 ---------- */
function SignedOut({ error }: { error: string }) {
  const denied = error === 'NOT_ALLOWED' || error === 'SUSPENDED'
  return (
    <>
      <div className="sheet mb-box">
        <h2>會員登入</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>只有島鏈會員社團的 Google 帳號可以登入。請用申請加入時登記的帳號。</p>
        {denied
          ? <div className="mb-denied" role="alert">
              <b>{error === 'SUSPENDED' ? '這個帳號的會員資格已經停用' : '這個 Google 帳號沒有登入權限'}</b>
              <span>{error === 'SUSPENDED' ? '有疑問的話，' : '請換成申請時登記的帳號再試一次。確定是會員卻登不進來，'}私訊 IG <a href={IG} target="_blank" rel="noopener noreferrer">@cuckoo_island</a>，告訴我們社團名稱和要用的 Google 帳號。</span>
            </div>
          : error && <p className="field-error" role="alert">{error}</p>}
        <GoogleButton label={denied ? '換一個 Google 帳號登入' : '用 Google 登入'} />
      </div>
      <div>
        <h2>怎麼成為會員</h2>
        <ol className="steps" style={{ marginTop: 12 }}>
          <li><div><b>社團申請加入島鏈</b><span>在會員申請表單留下社團要用來登入的 Google 帳號，建議用社團的共用帳號。</span></div></li>
          <li><div><b>布穀島夥伴開通</b><span>確認後，我們會開通這個帳號的登入權限，通常幾天內完成。</span></div></li>
          <li><div><b>登入、填好社團資料</b><span>社團名稱、服務性質和聯絡方式，一分鐘就好。之後就能打開經營手冊的每一份檔案、會員公告和社團名錄。</span></div></li>
        </ol>
      </div>
      <Empty title="還不是會員？" action={<a className="btn primary mb-inline-btn" href={to('join')}>申請加入島鏈</a>}>
        先填會員申請表單。開通後，用表單上登記的 Google 帳號回來登入。
      </Empty>
    </>
  )
}

/* ---------- 第一次登入：先填社團資料 ---------- */
function FirstTime({ profile }: { profile: Profile }) {
  return (
    <>
      <div className="sheet mb-box">
        <p className="mb-badge">歡迎加入島鏈</p>
        <h2>先填好你們社團的資料</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>其他會員社團會在社團名錄看到這些資料，需要合作或交流時可以直接聯絡你們。</p>
        <Who email={profile.email} />
      </div>
      <ProfileForm profile={profile} submitLabel="完成，進入會員專區" />
    </>
  )
}

/* ---------- 已開通 ---------- */
function Approved({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState(() => (location.hash === '#profile' ? 'profile' : 'posts'))
  return (
    <>
      <div className="mb-hello">
        <p className="mb-hello-hi">歡迎回來</p>
        <ClubIdentity p={profile} size="lg" as="h2" />
        <Who email={profile.email} />
      </div>
      <a className="mb-hb-link" href={to('handbook')}>
        <b>經營手冊</b><span>每一章的檔案都打開了</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </a>
      <Tabs.Root value={tab} onValueChange={setTab} className="mb-tabs">
        <PillTabsList cols={3} aria-label="會員專區">
          <PillTab value="posts">公告</PillTab>
          <PillTab value="clubs">社團名錄</PillTab>
          <PillTab value="profile">我們的社團</PillTab>
        </PillTabsList>
        <Tabs.Content value="posts"><Posts /></Tabs.Content>
        <Tabs.Content value="clubs"><Directory me={profile.id} /></Tabs.Content>
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
  const [type, setType] = useState<string | null>(null)
  const types = useMemo(() => [...new Set((data || []).flatMap(d => d.service_types || []))], [data])
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return (data || []).filter(d => (!type || d.service_types?.includes(type)) && (!k || [clubOf(d), schoolOf(d), ...(d.service_types || [])].some(t => t?.toLowerCase().includes(k))))
  }, [data, q, type])
  if (error) return <p className="field-error">{error}</p>
  if (!data) return <p className="status">讀取中⋯</p>
  return (
    <div className="mb-dir">
      <div className="sf-field">
        <label htmlFor="mb-q">找社團</label>
        <input id="mb-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="社團名稱或學校" autoComplete="off" />
      </div>
      {types.length > 1 && (
        <div className="chips" role="group" aria-label="依服務性質篩選">
          {types.map(t => <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(type === t ? null : t)}>{t}</button>)}
        </div>
      )}
      <p className="status" aria-live="polite">{q || type ? `找到 ${list.length} 個社團` : `共 ${data.length} 個會員社團`}</p>
      {list.length === 0
        ? <Empty title={q || type ? '找不到符合的社團' : '名錄還是空的'}>{q || type ? '換個關鍵字或服務性質試試。' : '會員社團登入、填好資料後就會出現在這裡。'}</Empty>
        : <ul className="mb-people">
            {list.map(d => {
              const club = mapClub(d), contacts = contactsOf(d)
              return (
                <li key={d.id} className="sheet">
                  <ClubIdentity p={d} suffix={d.id === me ? <small>（你們）</small> : null} />
                  {d.service_types?.length > 0 && <p className="sf-tags">{d.service_types.map(t => <span key={t}>{t}</span>)}</p>}
                  {contacts.length > 0 && (
                    <ul className="mb-contacts">
                      {contacts.map((c, i) => {
                        const href = contactHref(c.method, c.value)
                        return (
                          <li key={i} className="mb-contact">
                            <span>{contactLabel(c.method)}</span>
                            {href ? <a href={href} target="_blank" rel="noopener noreferrer">{c.value}</a> : <b>{c.value}</b>}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {club && <a className="link-plain" href={to('map')}>在社團地圖看介紹</a>}
                </li>
              )
            })}
          </ul>}
      <p className="status">只有會員社團看得到這份名錄。請不要轉傳給會員以外的人。</p>
    </div>
  )
}

/* ---------- 社團資料表單 ---------- */
function ProfileForm({ profile, submitLabel }: { profile: Profile; submitLabel: string }) {
  const known = (t: string) => SERVICE_TYPES.includes(t)
  const allowed = (m: string) => CONTACTS.some(c => c.id === m)
  const [f, setF] = useState<Omit<EditableProfile, 'contacts' | 'contact_method' | 'contact_value'>>(() => ({
    club_id: profile.club_id, club_name: clubOf(profile), school: schoolOf(profile), service_types: profile.service_types || [],
    show_in_directory: profile.show_in_directory,
  }))
  // 聯絡方式可以複選：picked 是選了哪幾種（依選的順序），vals 是每一種填的內容。LINE、電話不再開放，舊資料要改選。
  const [picked, setPicked] = useState<ContactMethod[]>(() => contactsOf(profile).map(c => c.method).filter(allowed))
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(contactsOf(profile).filter(c => allowed(c.method)).map(c => [c.method, c.value])))
  const togglePick = (m: ContactMethod) => { setPicked(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]); setMsg('') }
  const [otherType, setOtherType] = useState(() => (profile.service_types || []).filter(t => !known(t)).join('、'))
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const up = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF(s => ({ ...s, [k]: v })); setMsg('') }
  const toggleType = (t: string) => up('service_types', f.service_types.includes(t) ? f.service_types.filter(x => x !== t) : [...f.service_types, t])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const extra = otherType.split(/[、,，\s]+/).map(t => t.trim()).filter(Boolean)
    const name = f.club_name.trim()
    const order = CONTACTS.map(c => c.id).filter(m => picked.includes(m))
    const contacts: Contact[] = order.map(m => ({ method: m, value: (vals[m] || '').trim() }))
    const filled = contacts.filter(c => c.value)
    const v: EditableProfile = {
      ...f, club_name: name, school: f.school.trim(), club_id: CLUBS.find(c => c.name === name)?.id || '',
      service_types: [...f.service_types.filter(known), ...extra.filter(t => !known(t))],
      contacts: filled, contact_method: filled[0]?.method || '', contact_value: filled[0]?.value || '',
    }
    const er: Record<string, string> = {}
    if (!v.school) er.school = '請填學校或單位。'
    if (!v.club_name) er.club_name = '請填社團全名。'
    if (!v.service_types.length) er.service_types = '至少選一種服務性質。'
    if (!picked.length) er.contacts = '至少選一種聯絡方式。'
    else { const empty = contacts.find(c => !c.value); if (empty) er['c_' + empty.method] = `請填${contactLabel(empty.method)}，或取消選取。` }
    setErrs(er)
    if (Object.keys(er).length) {
      setMsg('還有欄位沒填好。')
      document.getElementById('pf-' + Object.keys(er)[0].replace(/^c_/, 'contact-'))?.focus()
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
      <h2>社團資料</h2>
      <div className="sf-field">
        <label htmlFor="pf-school">學校或單位<em>必填</em></label>
        <input id="pf-school" value={f.school} onChange={e => up('school', e.target.value)} placeholder="例如：國立臺灣大學" autoComplete="organization" {...inv('school')} />
        {fieldErr('school')}
      </div>
      <div className="sf-field">
        <label htmlFor="pf-club_name">社團全名<em>必填</em></label>
        <input id="pf-club_name" value={f.club_name} onChange={e => up('club_name', e.target.value)} placeholder="例如：陽光椰子社會服務社" {...inv('club_name')} />
        {fieldErr('club_name')}
      </div>
      {(f.club_name.trim() || f.school.trim()) && (
        <div className="mb-preview" aria-hidden="true">
          <p className="sf-hint" style={{ margin: 0 }}>在名錄和留言會這樣顯示</p>
          <ClubIdentity p={{ ...profile, club_id: '', club_name: f.club_name.trim() || '社團全名', school: f.school.trim() }} size="sm" as="p" />
        </div>
      )}
      <fieldset className="sf-group" id="pf-service_types" tabIndex={-1} {...inv('service_types')}>
        <legend>服務性質<em>必填，可複選</em></legend>
        <div className="chips">
          {SERVICE_TYPES.map(t => <button key={t} type="button" className="chip" aria-pressed={f.service_types.includes(t)} onClick={() => toggleType(t)}>{t}</button>)}
        </div>
        <div className="sf-field" style={{ marginTop: 6 }}>
          <label htmlFor="pf-other-type" className="sf-hint" style={{ margin: 0 }}>其他（選填，用頓號分開）</label>
          <input id="pf-other-type" value={otherType} onChange={e => { setOtherType(e.target.value); setMsg('') }} placeholder="例如：閱讀推廣、兒童劇" />
        </div>
        {fieldErr('service_types')}
      </fieldset>
      <fieldset className="sf-group" id="pf-contacts" tabIndex={-1} {...inv('contacts')}>
        <legend>聯絡方式<em>必填，可複選</em></legend>
        <p className="sf-hint">其他會員社團和布穀島夥伴會用這些方式聯絡你們，請填社團的公開帳號。</p>
        <div className="chips">
          {CONTACTS.map(c => <button key={c.id} type="button" className="chip" aria-pressed={picked.includes(c.id)} onClick={() => togglePick(c.id)}>{c.label}</button>)}
        </div>
        {fieldErr('contacts')}
      </fieldset>
      {CONTACTS.filter(c => picked.includes(c.id)).map(c => (
        <div className="sf-field" key={c.id}>
          <label htmlFor={`pf-contact-${c.id}`}>{c.label}<em>必填</em></label>
          <input id={`pf-contact-${c.id}`} value={vals[c.id] || ''} placeholder={c.hint} inputMode={c.id === 'email' ? 'email' : undefined}
            onChange={e => { setVals(v => ({ ...v, [c.id]: e.target.value })); setMsg('') }} {...inv('c_' + c.id)} />
          {fieldErr('c_' + c.id)}
        </div>
      ))}
      <label className="mb-check">
        <input type="checkbox" checked={f.show_in_directory} onChange={e => up('show_in_directory', e.target.checked)} />
        <span>在社團名錄顯示我們的社團<small>只有會員社團看得到，不會顯示登入用的 Google 帳號。</small></span>
      </label>
      <div className="sf-submit">
        <button className="btn primary" type="submit" disabled={busy}>{busy ? '儲存中⋯' : submitLabel}</button>
        <p className="status" role="status" aria-live="polite">{msg}</p>
      </div>
    </form>
  )
}
