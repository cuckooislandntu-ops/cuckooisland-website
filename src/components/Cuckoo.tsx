// 彩蛋：按 C 叫出一隻布穀鳥跟著游標飛，點一下會叫「布穀」。再按 C 或 Esc 讓牠飛走。
// 手機沒有鍵盤：連點三下左上角的 Logo 也能叫出來，牠會飛到手指點的地方。
import { useEffect, useRef, useState } from 'react'

const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// The call itself: two falling notes (roughly E5 → C5), synthesised so no audio file is needed
let ctx: AudioContext | null = null
function cuckooCall() {
  try {
    ctx = ctx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t0 = ctx.currentTime + 0.02
    ;[[659.25, 0], [523.25, 0.32]].forEach(([f, at]) => {
      const o = ctx!.createOscillator(), o2 = ctx!.createOscillator(), g = ctx!.createGain()
      o.type = 'sine'; o2.type = 'triangle'
      o.frequency.setValueAtTime(f * 1.02, t0 + at); o.frequency.exponentialRampToValueAtTime(f, t0 + at + 0.06)
      o2.frequency.setValueAtTime(f * 2, t0 + at)
      const g2 = ctx!.createGain(); g2.gain.value = 0.08
      g.gain.setValueAtTime(0.0001, t0 + at)
      g.gain.exponentialRampToValueAtTime(0.32, t0 + at + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.3)
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(ctx!.destination)
      o.start(t0 + at); o2.start(t0 + at); o.stop(t0 + at + 0.32); o2.stop(t0 + at + 0.32)
    })
  } catch { /* no audio, still fun */ }
}

function Bird({ flap }: { flap: boolean }) {
  return (
    <svg viewBox="0 0 120 90" width="96" height="72" aria-hidden="true">
      {/* tail */}
      <path d="M14 52 L2 66 L10 68 L4 78 L28 62 Z" fill="#4E5A78" />
      <path d="M8 66 l6 -2 M8 72 l6 -3" stroke="#FBF1D6" strokeWidth="2" strokeLinecap="round" />
      {/* body with offset riso shadow */}
      <ellipse cx="56" cy="56" rx="34" ry="21" fill="#231F35" opacity=".18" transform="translate(4 4)" />
      <ellipse cx="56" cy="56" rx="34" ry="21" fill="#6B7896" />
      {/* barred belly */}
      <path d="M36 62 Q56 80 84 64 Q70 72 56 72 Q44 70 36 62Z" fill="#FBF1D6" />
      <path d="M44 68 q4 2 8 0 M56 71 q4 2 8 0 M68 69 q4 2 8 -1" stroke="#4E5A78" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* wing */}
      <g style={{ transformOrigin: '58px 50px', transform: flap ? 'rotate(-28deg)' : 'rotate(6deg)', transition: 'transform .12s' }}>
        <path d="M38 48 Q58 30 84 46 Q66 60 40 56 Z" fill="#4E5A78" />
        <path d="M50 50 q8 -4 16 0 M54 55 q8 -3 14 -1" stroke="#9EB14F" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* head */}
      <circle cx="90" cy="40" r="16" fill="#6B7896" />
      <circle cx="94" cy="37" r="5.2" fill="#F7C948" />
      <circle cx="95" cy="37" r="2.6" fill="#231F35" />
      <circle cx="96" cy="36" r=".9" fill="#fff" />
      <path d="M104 40 L118 44 L104 47 Z" fill="#F4A7A0" />
      <circle cx="86" cy="47" r="3.4" fill="#F4A7A0" opacity=".7" />
      {/* feet */}
      <path d="M52 76 v6 M62 76 v6 M49 82 h6 M59 82 h6" stroke="#E8A23A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Cuckoo() {
  const [on, setOn] = useState(false)
  const [say, setSay] = useState(0)
  const [flap, setFlap] = useState(false)
  const el = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 }), pos = useRef({ x: 0, y: 0 }), face = useRef(1)

  // C to toggle (not while typing), Esc to dismiss; triple-tap the logo on phones
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key === 'c' || e.key === 'C') setOn(v => !v)
      if (e.key === 'Escape') setOn(false)
    }
    let taps: number[] = []
    const tap = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('.brand, .logo, header a[href="#"]')) return
      const now = Date.now(); taps = [...taps.filter(x => now - x < 700), now]
      if (taps.length >= 3) { taps = []; setOn(v => !v) }
    }
    addEventListener('keydown', key); addEventListener('pointerdown', tap)
    return () => { removeEventListener('keydown', key); removeEventListener('pointerdown', tap) }
  }, [])

  useEffect(() => {
    if (!on) return
    // enter from the top-left corner
    pos.current = { x: -60, y: 80 }
    target.current = { x: innerWidth / 2, y: innerHeight / 2 }
    let raf = 0, last = 0, flapT = 0
    const move = (e: PointerEvent) => { target.current = { x: e.clientX, y: e.clientY } }
    const click = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY }
      cuckooCall(); setSay(s => s + 1)
    }
    const loop = (t: number) => {
      const dt = Math.min(48, t - (last || t)); last = t
      const p = pos.current, g = target.current
      const k = RM ? 1 : 1 - Math.pow(0.88, dt / 16)
      const dx = (g.x + 18 * face.current) - p.x, dy = (g.y - 26) - p.y
      p.x += dx * k; p.y += dy * k
      if (Math.abs(dx) > 4) face.current = dx > 0 ? 1 : -1
      const speed = Math.hypot(dx, dy)
      flapT += dt
      if (flapT > (speed > 30 ? 90 : 420)) { flapT = 0; setFlap(f => !f) }
      if (el.current) el.current.style.transform = `translate(${p.x - 48}px, ${p.y - 36}px) scaleX(${face.current}) rotate(${Math.max(-12, Math.min(12, dy * 0.08))}deg)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    addEventListener('pointermove', move); addEventListener('pointerdown', click)
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('pointerdown', click) }
  }, [on])

  if (!on) return null
  return (
    <div ref={el} className="cuckoo" role="img" aria-label="布穀鳥彩蛋：點一下聽牠叫，按 C 讓牠飛走">
      <Bird flap={flap} />
      {say > 0 && <span key={say} className="cuckoo-say" style={{ transform: `scaleX(${face.current})` }}>布穀！</span>}
    </div>
  )
}
