import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ALL_ROUTES, Logo, NAV, to } from '@/lib/site'
import type { RouteId } from '@/lib/site'
import type { ReactElement, ReactNode } from 'react'
import { isApproved, useMember } from '@/lib/member'
import { CLUBS } from '@/lib/content'

export function SiteHeader({ route: raw, tone }: { route: string; tone: 'light' | 'dark' }) {
  const route = (raw.startsWith('post-') ? 'column' : raw.startsWith('event-') ? 'events' : raw) as RouteId
  const onHome = raw === ''
  const m = useMember()
  const signedIn = isApproved(m) // 只有核可的會員帳號會停在登入狀態
  const clubName = m.profile ? CLUBS.find(c => c.id === m.profile!.club_id)?.name || m.profile.club_name : ''
  return (
    <header className={'bar' + (onHome ? (tone === 'dark' ? ' dark' : '') : ' solid') + (route === 'handbook' ? ' night' : '')}>
      <a className="brand" href={to('')} aria-label="布穀島社首頁"><Logo />布穀島社</a>
      <div className="bar-actions">
        {signedIn
          ? <MeButton name={clubName || m.profile?.name || ''} avatar={m.profile?.avatar_url || ''} current={route === 'member'} />
          : route !== 'join' && <a className="pill" href={to('join')}>加入會員</a>}
        <Sheet>
          <SheetTrigger asChild>
            <button className="menu-btn" type="button" aria-label="開啟選單">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
            <SheetHeader className="text-left mb-4">
              <SheetTitle style={{ fontFamily: 'var(--kai)', fontSize: 24 }}>布穀島社</SheetTitle>
              <SheetDescription style={{ color: 'var(--ink-soft)' }}>串聯全台教育服務性社團</SheetDescription>
            </SheetHeader>
            <nav aria-label="主選單">
              {NAV.map(g => (
                <div className="nav-group" key={g.group}>
                  <h2>{g.group}</h2>
                  {g.items.map(it => (
                    <SheetClose asChild key={it.id || 'home'}>
                      <a className="nav-link" href={to(it.id)} aria-current={route === it.id ? 'page' : undefined}>
                        <b>{it.label}</b><span>{it.desc}</span>
                      </a>
                    </SheetClose>
                  ))}
                </div>
              ))}
              {signedIn && (
                <div className="nav-group">
                  <h2>帳號</h2>
                  <SheetClose asChild>
                    <a className="nav-link" href={to('logout')}><b>登出</b><span>{m.session?.user.email}</span></a>
                  </SheetClose>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

// 登入後，頁首的「加入會員」換成自己的頭像，點了到會員專區
function MeButton({ name, avatar, current }: { name: string; avatar: string; current: boolean }) {
  const label = `會員專區${name ? `（${name}）` : ''}`
  return (
    <a className="me" href={to('member')} aria-label={label} title={label} aria-current={current ? 'page' : undefined}>
      {avatar
        ? <img src={avatar} alt="" width={38} height={38} referrerPolicy="no-referrer" decoding="async" />
        : <span aria-hidden="true">{(name || '我').slice(0, 1)}</span>}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <a className="brand" href={to('')} style={{ color: 'var(--cream)' }}><Logo />布穀島社</a>
        <nav aria-label="網站地圖">
          <ul className="sitemap">
            {ALL_ROUTES.map(r => <li key={r.id || 'home'}><a href={to(r.id)}>{r.label}</a></li>)}
          </ul>
        </nav>
        <a className="ig" aria-label="布穀島社 Instagram：@cuckoo_island" href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>@cuckoo_island</a>
        <p className="fine">串聯全台教育服務性社團。© 2026 布穀島社　<a href={to('privacy')}>隱私權政策</a></p>
      </div>
    </footer>
  )
}

// Flat riso illustration for each inner page's opening band
export function HeroArt({ kind }: { kind: RouteId }) {
  const ink = '#231F35', leaf = '#6E8C25', green = '#9BB23F', sand = '#F3E2B8', sea = '#4FB5C0', sh = 'rgba(35,31,53,.18)'
  const person = (x: number, y: number, col: string, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14 0c0-18 5-28 14-28s14 10 14 28z" fill={sh} transform="translate(3 2)" />
      <path d="M-14 0c0-18 5-28 14-28s14 10 14 28z" fill={col} />
      <circle cx="0" cy="-38" r="10.5" fill="#F6C7A8" />
      <path d="M-11 -39a11 11 0 0 1 22 0c-6-3-14-3-22 0z" fill={ink} />
    </g>
  )
  const motif: Record<string, ReactElement> = {
    about: <><path d="M112 112c4-34 26-56 56-56s46 26 50 56z" fill="rgba(35,31,53,.18)" transform="translate(4 3)" /><path d="M112 112c4-34 26-56 56-56s46 26 50 56z" fill="#231F35" /><path d="M138 112c0-16 10-26 24-26s22 10 22 26z" fill="#FFFDF6" /><path d="M152 98q4 3 8 0M168 98q4 3 8 0" stroke="#231F35" strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M176 78q4 3 8 0M190 76q4 3 8 0" stroke="#FFFDF6" strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M200 92c-8 10-14 16-22 18" stroke="#231F35" strokeWidth="8" strokeLinecap="round" /></>,
    join: <>{person(126, 112, '#F4A7A0')}{person(160, 108, '#F4A7A0', 1.08)}{person(194, 112, '#F4A7A0')}<path d="M100 54h120" stroke="#D6EC6E" strokeWidth="5" strokeLinecap="round" /></>,
    resources: <>{[[118, 90], [150, 90], [182, 90], [134, 64], [166, 64], [150, 38]].map(([x, y], i) => <g key={i}><rect x={x + 3} y={y + 3} width="30" height="24" rx="4" fill={sh} /><rect x={x} y={y} width="30" height="24" rx="4" fill={['#F7C948', '#F06A5A', '#B7A6D9', '#4FB5C0', '#F4A7A0', ink][i]} /></g>)}</>,
    map: <>{[[128, 76], [170, 58], [196, 92], [150, 100]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="13" fill="#D6EC6E" opacity=".35" /><circle cx={x} cy={y} r="5" fill={ink} /></g>)}<path d="M128 76L170 58L196 92L150 100Z" fill="none" stroke={ink} strokeWidth="1.6" strokeDasharray="4 5" /></>,
    handbook: <><path d="M160 64c-18-10-36-10-54-4v52c18-6 36-6 54 4 18-10 36-10 54-4V60c-18-6-36-6-54 4z" fill={sh} transform="translate(4 3)" /><path d="M160 64c-18-10-36-10-54-4v52c18-6 36-6 54 4 18-10 36-10 54-4V60c-18-6-36-6-54 4z" fill="#FFFDF6" /><path d="M160 64v52" stroke={ink} strokeWidth="2" /><path d="M118 74h30M118 86h30M118 98h22M172 74h30M172 86h30" stroke="#6E8C25" strokeWidth="3" strokeLinecap="round" /></>,
    events: <><path d="M124 112l26-58 26 58z" fill="#4FB5C0" /><path d="M150 82l8 30h-16z" fill="#1D4A5E" />{person(196, 112, '#F7C948', .9)}<path d="M150 54V26" stroke={ink} strokeWidth="2.5" /><path d="M150 26l26 7-26 8z" fill="#F06A5A" /></>,
    column: <><rect x="104" y="40" width="88" height="40" rx="20" fill={sh} transform="translate(3 3)" /><rect x="104" y="40" width="88" height="40" rx="20" fill="#FFFDF6" /><path d="M120 80l-4 14 18-14z" fill="#FFFDF6" /><path d="M120 56h56M120 66h36" stroke={ink} strokeWidth="3" strokeLinecap="round" />{person(214, 112, '#B7A6D9', .9)}</>,
    member: <><rect x="122" y="44" width="76" height="54" rx="8" fill={sh} transform="translate(4 3)" /><rect x="122" y="44" width="76" height="54" rx="8" fill="#FFFDF6" /><circle cx="144" cy="66" r="9" fill="#F4A7A0" /><path d="M132 88c2-8 7-11 12-11s10 3 12 11z" fill="#F4A7A0" /><path d="M162 62h26M162 72h20M162 82h24" stroke={ink} strokeWidth="3" strokeLinecap="round" /><rect x="152" y="36" width="16" height="12" rx="3" fill="#6E8C25" />{person(220, 112, '#B7A6D9', .85)}</>,
    logout: <><g transform="translate(206 0)"><path d="M-30 112h60l-10 12h-40z" fill={sh} transform="translate(3 2)" /><path d="M-30 112h60l-10 12h-40z" fill="#C9955A" /><path d="M0 112V58" stroke={ink} strokeWidth="2.5" /><path d="M2 60l28 46H2z" fill="#FFFDF6" /><path d="M-2 66l-22 40h22z" fill="#F4A7A0" /></g>{person(136, 112, '#F7C948', .85)}<path d="M146 98l14-18" stroke="#F7C948" strokeWidth="7" strokeLinecap="round" /><circle cx="161" cy="78" r="4.5" fill="#F6C7A8" /></>,
    privacy: <><rect x="134" y="66" width="52" height="44" rx="8" fill={sh} transform="translate(4 3)" /><rect x="134" y="66" width="52" height="44" rx="8" fill="#B7A6D9" /><path d="M146 66v-10a14 14 0 0 1 28 0v10" fill="none" stroke={ink} strokeWidth="6" /><circle cx="160" cy="84" r="5" fill={ink} /><path d="M160 86v10" stroke={ink} strokeWidth="4" strokeLinecap="round" /></>,
    match: <>{person(104, 104, '#F7C948', .85)}{person(216, 104, '#F4A7A0', .85)}<path d="M120 64Q160 22 200 64" fill="none" stroke="#D6EC6E" strokeWidth="6" strokeLinecap="round" /><circle cx="160" cy="43" r="6" fill={ink} /></>,
  }
  return (
    <svg className="hero-art" viewBox="0 0 320 150" aria-hidden="true">
      <rect x="0" y="118" width="320" height="32" fill={sea} />
      <path d="M0 118q20-5 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0" fill="none" stroke="#FFFDF6" strokeWidth="2" opacity=".6" />
      <ellipse cx="160" cy="120" rx="128" ry="8" fill={sand} />
      <path d="M36 120a124 34 0 0 1 248 0z" fill={green} />
      <path d="M210 120a80 26 0 0 0-30-20 124 34 0 0 1 104 20z" fill={leaf} />
      {motif[kind]}
    </svg>
  )
}

export function PageShell({ kind, title, lede, tint, children }: { kind: RouteId; title: string; lede: string; tint: string; children: ReactNode }) {
  return (
    <main className="page" id="main">
      <section className="hero-band" style={{ backgroundColor: tint }}>
        <div className="hero-inner">
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
          <HeroArt kind={kind} />
        </div>
      </section>
      <div className="content"><div className="content-inner">{children}</div></div>
    </main>
  )
}

export function Empty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <svg viewBox="0 0 44 44" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 30a16 7 0 0 1 32 0" /><path d="M4 34h36" /><path d="M22 23v-9M22 14l6 3-6 3" /></svg>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}
