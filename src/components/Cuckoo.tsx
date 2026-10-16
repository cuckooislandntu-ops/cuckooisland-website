// 彩蛋：按 C 叫出一隻布穀鳥跟著游標飛，點一下牠會眨眼、張嘴說「布穀！」。再按 C 或 Esc 讓牠飛走。
// 鳥出現時按 O 打開叫聲（預設靜音），再按一次 O 關掉。
// 中文輸入法開著時 C、O 也有效（看實體按鍵，不看輸入的字）。
// 手機沒有鍵盤：連點三下左上角的 Logo 也能叫出來，牠會飛到手指點的地方。
import { useEffect, useRef, useState } from 'react'

const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// 「布穀」叫聲：兩個往下的音（約 E5 → C5），用網頁即時合成，音量放輕
let audio: AudioContext | null = null
function cuckooCall() {
  try {
    audio = audio || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
    const a = audio, t0 = a.currentTime + 0.02
    ;[[659.25, 0], [523.25, 0.32]].forEach(([f, at]) => {
      const o = a.createOscillator(), g = a.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(f * 1.02, t0 + at); o.frequency.exponentialRampToValueAtTime(f, t0 + at + 0.06)
      g.gain.setValueAtTime(0.0001, t0 + at)
      g.gain.exponentialRampToValueAtTime(0.12, t0 + at + 0.04)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.3)
      o.connect(g); g.connect(a.destination)
      o.start(t0 + at); o.stop(t0 + at + 0.32)
    })
  } catch { /* no audio */ }
}

function Bird({ flap, chirp }: { flap: boolean; chirp: boolean }) {
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
      {chirp
        ? <path d="M90 37.5 q4 3 8 0" stroke="#231F35" strokeWidth="2" fill="none" strokeLinecap="round" />
        : <><circle cx="95" cy="37" r="2.6" fill="#231F35" /><circle cx="96" cy="36" r=".9" fill="#fff" /></>}
      {chirp
        ? <><path d="M103 39 L118 34 L105 43 Z" fill="#F4A7A0" /><path d="M105 44 L117 52 L103 48 Z" fill="#E48C84" /><path d="M104 42 L110 44 L104 46 Z" fill="#A3534A" /></>
        : <path d="M104 40 L118 44 L104 47 Z" fill="#F4A7A0" />}
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
  const [chirp, setChirp] = useState(false)
  const [sound, setSound] = useState(false)
  const [tip, setTip] = useState('')
  const onRef = useRef(false), soundRef = useRef(false)
  onRef.current = on; soundRef.current = sound
  const el = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 }), pos = useRef({ x: 0, y: 0 }), face = useRef(1)

  // C to toggle (not while typing), Esc to dismiss; triple-tap the logo on phones
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target
      if (e.metaKey || e.ctrlKey || e.altKey || (t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]'))) return
      if (e.repeat) return
      if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C') setOn(v => !v)
      if ((e.code === 'KeyO' || e.key === 'o' || e.key === 'O') && onRef.current) {
        const next = !soundRef.current
        setSound(next); setTip(next ? '叫聲：開 🔊' : '叫聲：關')
        if (next) cuckooCall()
      }
      if (e.key === 'Escape') setOn(false)
    }
    let taps: number[] = []
    const tap = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('.brand, .logo, header a[href="#"]')) return
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
    let raf = 0, last = 0, flapT = 0, shut = 0
    const move = (e: PointerEvent) => { target.current = { x: e.clientX, y: e.clientY } }
    const click = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY }
      setSay(s => s + 1); setChirp(true); setTip('')
      if (soundRef.current) cuckooCall()
      clearTimeout(shut); shut = window.setTimeout(() => setChirp(false), 380)
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
    return () => { cancelAnimationFrame(raf); clearTimeout(shut); removeEventListener('pointermove', move); removeEventListener('pointerdown', click) }
  }, [on])

  useEffect(() => { if (!on) { setSound(false); setTip('') } else setTip('按 O 打開叫聲') }, [on])
  useEffect(() => { if (!tip) return; const t = setTimeout(() => setTip(''), 1800); return () => clearTimeout(t) }, [tip])

  if (!on) return null
  return (
    <div ref={el} className="cuckoo" role="img" aria-label="布穀鳥彩蛋：點一下牠會說布穀，按 C 讓牠飛走">
      <Bird flap={flap} chirp={chirp} />
      {tip && <span key={'t' + tip} className="cuckoo-say cuckoo-tip" style={{ transform: `scaleX(${face.current})` }}>{tip}</span>}
      {!tip && say > 0 && <span key={say} className="cuckoo-say" style={{ transform: `scaleX(${face.current})` }}>布穀！</span>}
    </div>
  )
}
