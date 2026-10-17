import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LOGO_SRC } from '@/lib/logo'

/* 需求媒合：三個角色各一段三拍的小動畫。
   畫風與首頁動畫（src/story/engine.ts）一致：扁平色塊、沒有描邊、偏移陰影、同一套人物與小島；
   故事用首頁的說話泡泡、萊姆綠虛線與光點來說，第三拍的背景從夜色轉成首頁結尾的粉色黎明。
   動畫只用 transform／opacity，由外層的 on1/on2/on3 class 觸發，樣式在 index.css「需求媒合：三拍動畫」。
   每一拍的標題與說明在 Sections.tsx 的 PARTNERS。 */

export type SceneRole = 'school' | 'company' | 'org'
export type Beat = { h: string; p: string }

const BEAT_MS = 3000
const HOLD_MS = 6400

// 首頁的色票（engine.ts 的 C）
const C = {
  ink: '#231F35', ink2: '#3A3556', coral: '#F06A5A', salmon: '#F4A7A0', gold: '#F7C948', butter: '#F7E3A6',
  lime: '#D6EC6E', green: '#9BB23F', green2: '#6E8C25', teal: '#4FB5C0', aqua: '#6FCFD5', sea2: '#1D4A5E',
  lilac: '#B7A6D9', skin: '#F6C7A8', cream: '#FFFDF6', sand: '#F3E2B8',
}
const SH = 'rgba(20,18,40,.26)'
const VW = 360, VH = 220

function usePrefersReducedMotion() {
  const [r, setR] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setR(m.matches)
    const f = () => setR(m.matches)
    m.addEventListener?.('change', f)
    return () => m.removeEventListener?.('change', f)
  }, [])
  return r
}

export default function MatchScene({ role, beats, label }: { role: SceneRole; beats: Beat[]; label: string }) {
  const reduced = usePrefersReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [step, setStep] = useState(-1)

  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => { if (reduced) { setPlaying(false); setStep(s => (s < 0 ? beats.length - 1 : s)) } }, [reduced, beats.length])

  useEffect(() => {
    if (!playing || !seen) return
    const last = beats.length - 1
    const wait = step < 0 ? 600 : step < last ? BEAT_MS : HOLD_MS
    const t = window.setTimeout(() => setStep(s => (s >= last ? -1 : s + 1)), wait)
    return () => window.clearTimeout(t)
  }, [playing, seen, step, beats.length])

  const jump = (i: number) => { setPlaying(false); setStep(i) }
  const toggle = () => { if (!playing && step >= beats.length - 1) setStep(-1); setPlaying(p => !p) }

  const cls = ['ms', 'ms-' + role]
  for (let i = 0; i < beats.length; i++) if (step >= i) cls.push('on' + (i + 1))
  if (step < 0) cls.push('rewind')
  const moving = !reduced

  return (
    <div className="ms-wrap" ref={box}>
      <div className="ms-stage">
        <svg className={cls.join(' ')} viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={label}>
          {role === 'school' && <SchoolScene moving={moving} />}
          {role === 'company' && <CompanyScene moving={moving} />}
          {role === 'org' && <OrgScene moving={moving} />}
        </svg>
      </div>
      <div className="ms-side">
      <ol className="ms-beats">
        {beats.map((b, i) => (
          <li key={b.h}>
            <button type="button" aria-current={step === i ? 'step' : undefined} onClick={() => jump(i)}>
              <i aria-hidden="true">{i + 1}</i>
              <b>{b.h}</b>
              <span>{b.p}</span>
              {step === i && playing && <em className="ms-timer" aria-hidden="true" style={{ animationDuration: (i < beats.length - 1 ? BEAT_MS : HOLD_MS) + 'ms' }} />}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="ms-toggle" onClick={toggle}>
        {playing
          ? <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><rect x="4" y="3" width="2.8" height="10" rx="1" /><rect x="9.2" y="3" width="2.8" height="10" rx="1" /></svg>
          : <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5z" /></svg>}
        {playing ? '暫停動畫' : step >= beats.length - 1 ? '從頭播放' : '繼續播放'}
      </button>
      </div>
    </div>
  )
}

/* ================= 首頁的零件，改寫成 SVG ================= */

type Arms = 'down' | 'up' | 'hold'
type Item = 'flag' | 'box' | 'book' | null

/* 首頁的人物：原點是腳底，原始高度約 96（含頭）。 */
function PersonShape({ body, skin, hair, arms, item, shadow }: { body: string; skin: string; hair: string; arms: Arms; item: Item; shadow?: boolean }) {
  const armD = arms === 'up' ? 'M-17 -40L-33 -76M17 -40L33 -76' : arms === 'hold' ? 'M-19 -40L-13 -24M19 -40L13 -24' : 'M-20 -38L-29 -12M20 -38L29 -12'
  const it = item === 'box' ? [C.coral, C.gold] : item === 'book' ? [C.ink2, C.cream] : [C.coral, C.coral]
  const i1 = shadow ? SH : it[0], i2 = shadow ? SH : it[1]
  return (
    <>
      <path d={armD} stroke={body} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M-27 0C-27 -34 -17 -54 0 -54C17 -54 27 -34 27 0Z" fill={body} />
      <circle cx="0" cy="-74" r="20" fill={skin} />
      <path d="M-20.74 -78.29A21 21 0 0 1 20.74 -78.29Q4 -82 -19.5 -80Z" fill={hair} />
      {item === 'flag' && <><path d="M33 -76L39 -140" stroke={shadow ? SH : C.ink} strokeWidth="3" /><path d="M39 -140L82 -128L39 -113Z" fill={i1} /></>}
      {item === 'box' && <><rect x="-21" y="-38" width="42" height="28" rx="4" fill={i1} /><rect x="-3" y="-38" width="6" height="28" fill={i2} /><rect x="-21" y="-27" width="42" height="6" fill={i2} /></>}
      {item === 'book' && <><rect x="-23" y="-40" width="46" height="30" rx="3" fill={i1} /><rect x="-19" y="-36" width="17" height="22" fill={i2} /><rect x="2" y="-36" width="17" height="22" fill={i2} /></>}
    </>
  )
}

function Person({ x, y, s, col, arms = 'down', item = null, smileOn, cls = '', glow }: {
  x: number; y: number; s: number; col: string; arms?: Arms; item?: Item; smileOn?: 'always' | 'on3'; cls?: string; glow?: string
}) {
  const mood = smileOn === 'always' ? ' happy' : smileOn === 'on3' ? ' warms' : ''
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={'ms-p ' + cls + mood}>
        {glow && <circle className="ms-glow" cx="0" cy="-62" r="100" fill={`url(#${glow})`} />}
        <g transform="translate(4 3)"><PersonShape body={SH} skin={SH} hair={SH} arms={arms} item={item} shadow /></g>
        <PersonShape body={col} skin={C.skin} hair={C.ink} arms={arms} item={item} />
        <circle cx="-7" cy="-72" r="2.5" fill={C.ink} /><circle cx="7" cy="-72" r="2.5" fill={C.ink} />
        <path className="ms-face-flat" d="M-5 -63L5 -63" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" />
        <g className="ms-face-smile">
          <path d="M5.35 -64.28A6 6 0 0 1 -5.35 -64.28" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="-13" cy="-66" r="3.4" fill="rgba(240,106,90,.45)" /><circle cx="13" cy="-66" r="3.4" fill="rgba(240,106,90,.45)" />
        </g>
      </g>
    </g>
  )
}

/* 首頁的小島：沙灘橢圓＋綠色半圓頂＋深綠陰影塊 */
function Islet({ cx, base, w, h }: { cx: number; base: number; w: number; h: number }) {
  const a = 1.62 * Math.PI, sx = cx + (w / 2) * Math.cos(a), sy = base + h * Math.sin(a)
  return (
    <g>
      <ellipse cx={cx} cy={base + 2} rx={(w / 2) * 1.06} ry={h * 0.42} fill={C.sand} />
      <path d={`M${cx + 4 - w / 2} ${base + 2}A${w / 2} ${h} 0 0 1 ${cx + 4 + w / 2} ${base + 2}Z`} fill={SH} />
      <path d={`M${cx - w / 2} ${base}A${w / 2} ${h} 0 0 1 ${cx + w / 2} ${base}Z`} fill={C.green} />
      <path d={`M${sx} ${sy}A${w / 2} ${h} 0 0 1 ${cx + w / 2} ${base}L${cx + w * 0.18} ${base}Z`} fill={C.green2} />
    </g>
  )
}
type Isle = { cx: number; base: number; w: number; h: number }
const top = (I: Isle, x: number) => { const d = (x - I.cx) / (I.w / 2); return I.base - I.h * Math.sqrt(Math.max(0, 1 - d * d)) + 2 }

/* 首頁的海：上淺下深的漸層、頂端一條米白浪線 */
function Sea({ y, id }: { y: number; id: string }) {
  let d = `M-40 ${y}`
  for (let x = -40; x <= VW + 40; x += 12) d += `L${x} ${(y + Math.sin(x * 0.07) * 2.6).toFixed(1)}`
  return (
    <g>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5BBCC4" /><stop offset="1" stopColor={C.sea2} /></linearGradient></defs>
      <g className="ms-sea">
        <path d={d + `L${VW + 40} ${VH + 10}L-40 ${VH + 10}Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke="rgba(255,253,246,.55)" strokeWidth="2" />
      </g>
    </g>
  )
}

/* 首頁的說話泡泡：米白膠囊＋深色陰影＋尖角；x,y 是尖角位置 */
function Bubble({ x, y, text, cls = '', bg = C.cream, fs = 11 }: { x: number; y: number; text: string; cls?: string; bg?: string; fs?: number }) {
  const tw = [...text].reduce((w, ch) => w + (/[\x00-\x7F]/.test(ch) ? fs * 0.56 : fs), 0)
  const pw = tw + fs * 1.4, ph = fs * 2.05, m = 6
  let off = 0
  if (x - pw / 2 < m) off = m - (x - pw / 2); else if (x + pw / 2 > VW - m) off = VW - m - (x + pw / 2)
  const bx = -pw / 2 + off, by = -ph - fs * 0.55, tb = Math.min(Math.max(0, bx + ph / 2), bx + pw - ph / 2)
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={'ms-bubble ' + cls}>
        <rect x={bx + 3} y={by + 3} width={pw} height={ph} rx={ph / 2} fill="rgba(8,10,28,.35)" />
        <rect x={bx} y={by} width={pw} height={ph} rx={ph / 2} fill={bg} />
        <path d={`M${tb - fs * 0.4} ${by + ph - 1}L0 0L${tb + fs * 0.32} ${by + ph - 1}Z`} fill={bg} />
        <text x={bx + pw / 2} y={by + ph / 2 + fs * 0.36} textAnchor="middle" className="ms-text" style={{ fontSize: fs }}>{text}</text>
      </g>
    </g>
  )
}

/* 首頁的標籤：米白小膠囊 */
function Tag({ x, y, text, cls = '' }: { x: number; y: number; text: string; cls?: string }) {
  const fs = 9.5, w = [...text].reduce((a, ch) => a + (/[\x00-\x7F]/.test(ch) ? fs * 0.56 : fs), 0) + fs * 1.5, h = fs * 2
  return (
    <g className={'ms-tag ' + cls}>
      <rect x={x - w / 2 + 2} y={y + 2} width={w} height={h} rx={h / 2} fill={SH} />
      <rect x={x - w / 2} y={y} width={w} height={h} rx={h / 2} fill={C.cream} />
      <text x={x} y={y + h / 2 + fs * 0.36} textAnchor="middle" className="ms-text" style={{ fontSize: fs }}>{text}</text>
    </g>
  )
}

/* 布穀島社：圓形徽章 */
function Badge({ x, y, id, cls = '' }: { x: number; y: number; id: string; cls?: string }) {
  return (
    <g className={'ms-badge ' + cls}>
      <defs><clipPath id={id}><circle cx={x} cy={y} r="12.5" /></clipPath></defs>
      <circle cx={x + 3} cy={y + 3} r="15" fill={SH} />
      <circle cx={x} cy={y} r="15" fill={C.cream} />
      <image href={LOGO_SRC} x={x - 12.5} y={y - 12.5} width="25" height="25" clipPath={`url(#${id})`} preserveAspectRatio="xMidYMid slice" />
    </g>
  )
}

/* 首頁的串聯線：虛線＋沿線移動的光點 */
function Link({ d, cls, moving, dots = 3, color = C.lime, dur = 2.4 }: { d: string; cls: string; moving: boolean; dots?: number; color?: string; dur?: number }) {
  return (
    <g className={'ms-link ' + cls}>
      <path className="ms-dash" d={d} fill="none" stroke={color} strokeWidth="1.8" strokeDasharray="4 6" strokeLinecap="round" opacity=".8" />
      {moving && Array.from({ length: dots }).map((_, i) => (
        <g key={i}>
          <circle r="6" fill={color} opacity=".3"><animateMotion dur={dur + 's'} begin={(-i * dur) / dots + 's'} repeatCount="indefinite" path={d} /></circle>
          <circle r="2.6" fill={color}><animateMotion dur={dur + 's'} begin={(-i * dur) / dots + 's'} repeatCount="indefinite" path={d} /></circle>
        </g>
      ))}
    </g>
  )
}

function Glow({ id, color }: { id: string; color: string }) {
  return <defs><radialGradient id={id}><stop offset="0" stopColor={color} stopOpacity=".6" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient></defs>
}

/* 背景：首頁的色彩腳本（夜色 → 黎明）＋只在背景層的紙張顆粒 */
function Sky({ id, night, dawn, stars, children }: { id: string; night: [string, string]; dawn: [string, string]; stars?: boolean; children?: ReactNode }) {
  return (
    <g>
      <defs>
        <linearGradient id={id + '-n'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night[0]} /><stop offset="1" stopColor={night[1]} /></linearGradient>
        <linearGradient id={id + '-d'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={dawn[0]} /><stop offset="1" stopColor={dawn[1]} /></linearGradient>
        <filter id={id + '-g'} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11" /><feColorMatrix values="0 0 0 0 .14  0 0 0 0 .12  0 0 0 0 .21  0 0 0 .6 -.2" /></filter>
      </defs>
      <rect width={VW} height={VH} fill={`url(#${id}-n)`} />
      <rect className="ms-dawn" width={VW} height={VH} fill={`url(#${id}-d)`} />
      {stars && <g className="ms-stars" fill={C.cream}>{STARS.map(([x, y, r], i) => <rect key={i} x={x} y={y} width={r} height={r} opacity={0.35 + ((i * 37) % 60) / 100} />)}</g>}
      <rect width={VW} height={VH} filter={`url(#${id}-g)`} opacity=".45" />
      {children}
    </g>
  )
}
const STARS: [number, number, number][] = [[22, 18, 1.6], [64, 34, 1.2], [118, 12, 2], [170, 28, 1.3], [214, 14, 1.7], [256, 36, 1.1], [300, 20, 1.9], [338, 44, 1.3], [40, 58, 1.1], [150, 50, 1.4], [232, 60, 1.2], [322, 70, 1.5], [96, 72, 1.2]]

/* 首頁開場的彩旗 */
function Bunting({ x0, y0, x1, y1, sag, cls = '' }: { x0: number; y0: number; x1: number; y1: number; sag: number; cls?: string }) {
  const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag, cols = [C.coral, C.teal, C.gold, C.lilac]
  const qb = (a: number, b: number, d: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * d
  return (
    <g className={'ms-bunting ' + cls}>
      <path d={`M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`} fill="none" stroke={C.ink} strokeWidth="1" />
      {Array.from({ length: 7 }).map((_, i) => { const t = (i + 0.5) / 7, x = qb(x0, cx, x1, t), y = qb(y0, cy, y1, t); return (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}><path className="ms-pennant" style={{ animationDelay: i * 0.2 + 's' }} d="M-5 0L5 0L0 10Z" fill={cols[i % 4]} /></g>
      ) })}
    </g>
  )
}

const KIDCOL = [C.aqua, C.gold, C.lilac, C.green]

/* ================= 學校：舉手 → 布穀島社配對 → 社團帶營隊來 ================= */
function SchoolScene({ moving }: { moving: boolean }) {
  const I: Isle = { cx: 104, base: 170, w: 192, h: 28 }, R: Isle = { cx: 300, base: 128, w: 88, h: 14 }
  return (
    <g>
      <Sky id="sc" night={['#FBF1D6', '#F7E3A6']} dawn={['#FDF1CF', '#F9D6A0']}>
        <g className="ms-sun"><circle cx="314" cy="46" r="26" fill={C.butter} /><circle cx="314" cy="46" r="17" fill={C.gold} /></g>
      </Sky>
      <Glow id="sc-glow" color={C.lime} />
      <Sea y={150} id="sc-sea" />
      <Islet {...R} />
      <Islet {...I} />
      <Tag x={58} y={186} text="你的學校" />
      <Tag x={R.cx} y={144} text="教育服務性社團" />
      {/* 學校 */}
      <g>
        <rect x="34" y="117" width="50" height="34" fill={SH} />
        <rect x="30" y="114" width="50" height="34" fill={C.cream} />
        <path d="M24 116L55 94L86 116Z" fill={C.coral} />
        <rect x="49" y="128" width="12" height="20" fill={C.ink} />
        <rect x="36" y="121" width="8" height="7" fill={C.aqua} /><rect x="66" y="121" width="8" height="7" fill={C.aqua} />
      </g>
      {/* 社團：第三拍沿著串聯線來到學校，站在孩子後面（同首頁結尾） */}
      <g className="ms-club">
        {[-17, 0, 17].map((dx, i) => <Person key={dx} x={R.cx + dx} y={top(R, R.cx + dx)} s={0.22} col={C.salmon} item={i === 1 ? 'flag' : null} arms={i === 1 ? 'up' : 'down'} smileOn="always" />)}
      </g>
      {/* 老師與孩子 */}
      <Person x={106} y={top(I, 106)} s={0.34} col={C.lilac} arms="up" smileOn="on3" />
      <Person x={86} y={top(I, 86)} s={0.21} col={KIDCOL[3]} smileOn="always" cls="kid late" glow="sc-glow" />
      <Person x={131} y={top(I, 131)} s={0.23} col={KIDCOL[0]} smileOn="on3" cls="kid" glow="sc-glow" />
      <Person x={152} y={top(I, 152)} s={0.23} col={KIDCOL[1]} smileOn="on3" cls="kid k2" glow="sc-glow" />
      <Person x={173} y={top(I, 173)} s={0.21} col={KIDCOL[2]} smileOn="always" cls="kid late k2" glow="sc-glow" />
      <Bunting x0={58} y0={78} x1={198} y1={84} sag={10} cls="b3" />
      {/* 配對 */}
      <Link d="M114 100Q206 4 292 92" cls="l2" moving={moving} />
      <Badge x={204} y={52} id="sc-logo" cls="b2" />
      <Tag x={204} y={70} text="布穀島社配對" cls="b2" />
      <Bubble x={106} y={100} text="暑假，想辦一場營隊！" cls="b1" />
      <Bubble x={300} y={82} text="我們可以去！" cls="b2 late" />
    </g>
  )
}

/* ================= 企業：想幫忙 → 找到社團 → 資源成了營隊，成果回來 ================= */
function CompanyScene({ moving }: { moving: boolean }) {
  const L: Isle = { cx: 84, base: 166, w: 140, h: 22 }, R: Isle = { cx: 280, base: 170, w: 150, h: 24 }
  const arc = 'M112 100Q190 14 262 118'
  return (
    <g>
      <defs><radialGradient id="co-halo"><stop offset="0" stopColor={C.gold} stopOpacity=".34" /><stop offset="1" stopColor={C.gold} stopOpacity="0" /></radialGradient></defs>
      <Sky id="co" night={['#1D4A5E', '#1A1B30']} dawn={['#F4A7A0', '#F7D7A0']} stars>
        <circle className="ms-halo" cx="84" cy="106" r="96" fill="url(#co-halo)" />
      </Sky>
      <Glow id="co-glow" color={C.lime} />
      <Sea y={158} id="co-sea" />
      <Islet {...L} />
      <Islet {...R} />
      {/* 漂浮的錢幣與物資（首頁「海的另一邊」） */}
      <g className="ms-props">
        {([[30, 62, 'box'], [150, 58, 'coin'], [24, 122, 'coin'], [150, 128, 'box']] as [number, number, string][]).map(([x, y, k], i) => (
          <g key={i} transform={`translate(${x} ${y})`}><g className="ms-float" style={{ animationDelay: i * 0.4 + 's' }}>
            {k === 'coin'
              ? <><circle cx="2.5" cy="2.5" r="8" fill={SH} /><circle r="8" fill={C.gold} /><circle r="4.8" fill="none" stroke="#C99A1F" strokeWidth="1.6" /></>
              : <><rect x="-6" y="-4" width="16" height="13" rx="2" fill={SH} /><rect x="-8" y="-6.5" width="16" height="13" rx="2" fill={C.coral} /><rect x="-1.5" y="-6.5" width="3" height="13" fill={C.gold} /></>}
          </g></g>
        ))}
      </g>
      <Person x={84} y={top(L, 84)} s={0.36} col={C.gold} arms="hold" item="box" smileOn="on3" />
      <Tag x={84} y={186} text="企業與基金會" />
      {/* 服務現場：社團與孩子 */}
      {[232, 251].map((x, i) => <Person key={x} x={x} y={top(R, x)} s={0.24} col={C.salmon} smileOn="always" item={i === 1 ? 'flag' : null} arms={i === 1 ? 'up' : 'down'} />)}
      {[278, 297, 316, 335].map((x, i) => <Person key={x} x={x} y={top(R, x)} s={0.21} col={KIDCOL[i]} smileOn="on3" cls={'kid' + (i % 2 ? ' k2' : '')} glow="co-glow" />)}
      <Tag x={R.cx} y={190} text="社團與孩子" />
      {/* 媒合線，第三拍變成資源的洋流 */}
      <Link d={arc} cls="l2" moving={moving} />
      <g className="ms-flow">{moving && [C.gold, C.coral, C.gold, C.gold, C.coral].map((col, i) => (
        <circle key={i} r={i % 2 ? 3.4 : 4.2} fill={col}><animateMotion dur="2.2s" begin={-i * 0.44 + 's'} repeatCount="indefinite" path={arc} /></circle>
      ))}</g>
      <Badge x={190} y={57} id="co-logo" cls="b2" />
      {/* 成果回傳：一張照片飛回企業 */}
      <g className="ms-photo">
        <rect x="-11" y="-8" width="26" height="20" rx="2" fill={SH} />
        <rect x="-13" y="-10" width="26" height="20" rx="2" fill={C.cream} />
        <rect x="-10" y="-7" width="20" height="10" fill={C.aqua} />
        <circle cx="-4" cy="-2" r="2.6" fill={C.salmon} />
        <path d="M-10 3L-4 -2L1 2L5 -1L10 3Z" fill={C.green} />
        <rect x="-9" y="5" width="12" height="2" fill={C.ink} opacity=".5" />
      </g>
      <Bubble x={84} y={98} text="想幫忙，要去哪找學生？" cls="b1" />
      <Bubble x={251} y={118} text="我們正需要！" cls="b2 late" />
      <Bubble x={84} y={98} text="看見孩子的笑容了！" cls="b3 last" bg={C.lime} />
    </g>
  )
}

/* ================= 教育組織：課堂教案 → 改成營隊版 → 走進營隊 ================= */
function OrgScene({ moving }: { moving: boolean }) {
  const L: Isle = { cx: 82, base: 166, w: 142, h: 22 }, R: Isle = { cx: 290, base: 170, w: 134, h: 22 }
  const kids: [number, number][] = [[287, 0.18], [304, 0.27], [322, 0.2], [340, 0.26]]
  return (
    <g>
      <defs><radialGradient id="og-halo"><stop offset="0" stopColor={C.aqua} stopOpacity=".34" /><stop offset="1" stopColor={C.aqua} stopOpacity="0" /></radialGradient></defs>
      <Sky id="og" night={['#2A7F8E', '#1A1B30']} dawn={['#F4A7A0', '#F7D7A0']} stars>
        <circle className="ms-halo" cx="88" cy="100" r="96" fill="url(#og-halo)" />
      </Sky>
      <Glow id="og-glow" color={C.lime} />
      <Sea y={158} id="og-sea" />
      <Islet {...L} />
      <Islet {...R} />
      {/* 黑板（首頁「海的另一邊：教育組織」） */}
      <g>
        <rect x="14" y="22" width="66" height="42" rx="5" fill={SH} />
        <rect x="8" y="16" width="66" height="42" rx="5" fill="#B98B5E" />
        <rect x="12" y="20" width="58" height="34" rx="3" fill="#2F5A46" />
        <path d="M19 30H49M19 37H62M19 44H42" stroke="rgba(255,253,246,.8)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="ms-props">
        {[[22, 118], [170, 72], [150, 30]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}><g className="ms-float" style={{ animationDelay: i * 0.5 + 's' }}>
            <rect x="-6" y="-8" width="16" height="20" rx="2" fill={SH} /><rect x="-8" y="-10" width="16" height="20" rx="2" fill={C.cream} />
            <path d="M-4 -4H4M-4 0H4M-4 4H1" stroke={C.teal} strokeWidth="1.6" strokeLinecap="round" />
          </g></g>
        ))}
      </g>
      <Person x={98} y={top(L, 98)} s={0.36} col={C.teal} arms="hold" item="book" smileOn="on3" />
      <Tag x={L.cx} y={186} text="教育組織" />
      {/* 營隊現場：社團＋高矮不一的孩子（混齡） */}
      {[246, 265].map(x => <Person key={x} x={x} y={top(R, x)} s={0.24} col={C.salmon} smileOn="always" />)}
      {kids.map(([x, s], i) => <Person key={x} x={x} y={top(R, x)} s={s} col={KIDCOL[i]} smileOn="on3" cls={'kid' + (i % 2 ? ' k2' : '')} glow="og-glow" />)}
      <Tag x={R.cx} y={190} text="營隊現場" />
      {/* 改編工作台 */}
      <Link d="M124 104Q150 66 186 62" cls="l2" moving={moving} dots={2} color={C.aqua} dur={1.6} />
      <Link d="M218 62Q258 66 258 116" cls="l3" moving={moving} dots={2} dur={1.6} />
      <Badge x={202} y={58} id="og-logo" cls="b2" />
      <g className="ms-spark">
        <path d="M172 92l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill={C.lime} />
        <path d="M232 98l2.4 4.6 4.6 2.4-4.6 2.4-2.4 4.6-2.4-4.6-4.6-2.4 4.6-2.4z" fill={C.salmon} />
      </g>
      {/* 那一份教案：課堂版 → 營隊版 */}
      <g className="ms-sheet">
        <rect x="-13" y="-17" width="30" height="38" rx="3" fill={SH} />
        <rect x="-15" y="-19" width="30" height="38" rx="3" fill={C.cream} />
        <path className="lesson" d="M-9 -11H9M-9 -5H9M-9 1H9M-9 7H5" stroke={C.teal} strokeWidth="2" strokeLinecap="round" />
        <g className="camp">
          <rect x="-10" y="-14" width="9" height="8" rx="2" fill={C.coral} />
          <rect x="1" y="-14" width="9" height="12" rx="2" fill={C.gold} />
          <rect x="-10" y="-4" width="9" height="12" rx="2" fill={C.green} />
          <rect x="1" y="0" width="9" height="8" rx="2" fill={C.aqua} />
        </g>
      </g>
      <Tag x={150} y={142} text="課堂 40 分鐘" cls="b1 only" />
      <Tag x={192} y={128} text="營隊版・混齡・短時" cls="b2 only late" />
      <Bubble x={98} y={98} text="這些教案，誰用得上？" cls="b1" />
      <Bubble x={304} y={114} text="大孩子小孩子都能玩！" cls="b3 last" bg={C.lime} />
    </g>
  )
}

/* 需求卡頂端的小插畫：學校的島，掛上彩旗、孩子在等營隊 */
export function CampCardArt() {
  const I: Isle = { cx: 180, base: 92, w: 230, h: 30 }
  return (
    <svg className="sf-card-art" viewBox="0 0 360 110" aria-hidden="true">
      <defs><linearGradient id="cc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBF1D6" /><stop offset="1" stopColor="#F7E3A6" /></linearGradient></defs>
      <rect width="360" height="110" fill="url(#cc-sky)" />
      <circle cx="318" cy="34" r="20" fill={C.butter} /><circle cx="318" cy="34" r="13" fill={C.gold} />
      <Sea y={84} id="cc-sea" />
      <Islet {...I} />
      <g transform="translate(80 -38)">
        <rect x="34" y="117" width="50" height="34" fill={SH} />
        <rect x="30" y="114" width="50" height="34" fill={C.cream} />
        <path d="M24 116L55 94L86 116Z" fill={C.coral} />
        <rect x="49" y="128" width="12" height="20" fill={C.ink} />
        <rect x="36" y="121" width="8" height="7" fill={C.aqua} /><rect x="66" y="121" width="8" height="7" fill={C.aqua} />
      </g>
      {[182, 202, 222, 242].map((x, i) => <Person key={x} x={x} y={top(I, x)} s={0.2} col={KIDCOL[i]} smileOn="always" />)}
      <Bunting x0={96} y0={30} x1={268} y1={36} sag={12} />
    </svg>
  )
}
