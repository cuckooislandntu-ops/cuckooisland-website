// 會員專區頂端的島民：眼睛跟著游標（手機是手指）看，說鼓勵的話；點他會亮燈泡，再換一句。
// 台詞依登入狀態不同（沒登入／審核中／已開通），要改台詞改下面的 LINES。樣式在 index.css「會員專區島民」。
import { useEffect, useRef, useState } from 'react'

export type GuideMood = 'out' | 'pending' | 'member'
const LINES: Record<GuideMood, string[]> = {
  out: [
    '歡迎來到會員專區！先登入看看吧。',
    '用申請時留的 Google 帳號登入就對了。',
    '島鏈上的夥伴，都在這裡等你。',
    '還不是會員？先填申請表，我在這裡等你。',
  ],
  pending: [
    '資料收到了！夥伴正在確認中。',
    '檔案填得越完整，大家越快認識你。',
    '再等一下下，開通後手冊就打開了。',
    '趁現在想想，你們社團有什麼做法可以分享？',
  ],
  member: [
    '歡迎回來！今天想找什麼？',
    '服務的路上，你不是一個人。',
    '有好做法，記得留給下一屆。',
    '卡關的時候，名錄裡有很多夥伴可以問。',
    '你帶的那個夏天，孩子會記很久。',
    '一個社團自己扛很累，一群社團一起走就不會。',
  ],
}

const RM = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const pick = (n: number, not = -1) => { if (n < 2) return 0; let j = not; while (j === not) j = Math.floor(Math.random() * n); return j }

function useTalk(mood: GuideMood, name: string) {
  const lines = mood === 'member' && name ? [`${name}，歡迎回來！`, ...LINES.member.slice(1)] : LINES[mood]
  const [idx, setIdx] = useState(0) // 第一句固定是招呼
  const [n, setN] = useState(0)
  const line = lines[idx % lines.length]
  useEffect(() => { setIdx(0) }, [mood])
  useEffect(() => {
    if (RM()) { setN(line.length); return }
    setN(0)
    const id = setInterval(() => setN(v => (v >= line.length ? v : v + 1)), 70)
    return () => clearInterval(id)
  }, [line])
  const next = () => setIdx(i => pick(lines.length, i % lines.length))
  useEffect(() => { if (n >= line.length) { const t = setTimeout(next, 5200); return () => clearTimeout(t) } }, [n, line])
  return { shown: line.slice(0, n), line, talking: n < line.length, next }
}

// 眼睛中心（viewBox 座標）
const EYES = [[254, 104], [282, 104]] as const

export default function MemberGuide({ mood, name }: { mood: GuideMood; name: string }) {
  const talk = useTalk(mood, name)
  const svg = useRef<SVGSVGElement>(null)
  const pupils = useRef<(SVGGElement | null)[]>([])
  const [bulb, setBulb] = useState(0) // 每點一次 +1，重新播放燈泡動畫

  // 眼睛跟著游標或手指
  useEffect(() => {
    const el = svg.current
    if (!el) return
    let raf = 0, px = 0, py = 0
    const look = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      if (!r.width) return
      const s = 360 / r.width
      const x = (px - r.left) * s, y = (py - r.top) * s
      EYES.forEach(([ex, ey], i) => {
        const dx = x - ex, dy = y - ey, d = Math.hypot(dx, dy) || 1
        const k = Math.min(3.4, d / 26)
        pupils.current[i]?.setAttribute('transform', `translate(${(dx / d * k).toFixed(2)} ${(dy / d * k * .8).toFixed(2)})`)
      })
    }
    const move = (e: PointerEvent) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(look) }
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerdown', move, { passive: true })
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerdown', move); cancelAnimationFrame(raf) }
  }, [])

  const click = () => { setBulb(b => b + 1); talk.next() }

  return (
    <div className="stage-box mb-stage">
      <button type="button" className="mascot-btn" onClick={click} aria-label="點一下，換一句話">
        <svg ref={svg} className={'mascot mb-guide' + (talk.talking ? ' talking' : '')} viewBox="0 0 360 230" aria-hidden="true">
          {/* 小島與海 */}
          <path d="M0 206h360v24H0z" fill="#4FB5C0" />
          <path d="M0 206q15-4 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0" fill="none" stroke="#FFFDF6" strokeWidth="2" opacity=".55" />
          <path d="M150 210C176 182 336 182 360 200V214H150z" fill="rgba(35,31,53,.14)" transform="translate(4 3)" />
          <path d="M150 210C176 182 336 182 360 200V214H150z" fill="#9EB14F" />
          <path d="M300 214C318 196 344 192 360 196V214z" fill="#6E8C25" />
          {/* 布穀鳥的小旗子 */}
          <path d="M176 196V150" stroke="#231F35" strokeWidth="2.4" />
          <path d="M176 150l26 7-26 8z" fill="#F06A5A" />

          <g className="bob">
            {/* 身體：綠背心＋會員證 */}
            <path d="M226 234C226 176 242 142 268 142S310 176 310 234Z" fill="rgba(35,31,53,.18)" transform="translate(5 3)" />
            <path d="M226 234C226 176 242 142 268 142S310 176 310 234Z" fill="#6E8C25" />
            <path d="M252 146L268 176 284 146" fill="none" stroke="#FFFDF6" strokeWidth="3" strokeLinejoin="round" />
            <path d="M258 150L268 186 278 150" fill="none" stroke="#D6EC6E" strokeWidth="2" />
            <g transform="rotate(-4 268 202)">
              <rect x="252" y="186" width="32" height="24" rx="4" fill="#FFFDF6" />
              <circle cx="261" cy="196" r="4" fill="#F4A7A0" /><path d="M255 206c1-4 3.5-5.5 6-5.5s5 1.5 6 5.5z" fill="#F4A7A0" />
              <path d="M270 194h9M270 199h7M270 204h8" stroke="#231F35" strokeWidth="1.8" strokeLinecap="round" />
            </g>
            {/* 揮手 */}
            <g className="wave" style={{ transformOrigin: '304px 166px' }}>
              <path d="M304 168L328 132" stroke="#6E8C25" strokeWidth="13" strokeLinecap="round" />
              <circle cx="330" cy="129" r="7" fill="#F6C7A8" />
            </g>
            {/* 頭 */}
            <circle cx="268" cy="104" r="36" fill="#F6C7A8" />
            <path d="M232 100A36 36 0 0 1 304 100Q296 80 278 82Q262 74 246 84Q234 88 232 100Z" fill="#231F35" />
            {/* 頭上的小芽 */}
            <path d="M268 70C266 62 266 56 268 52" stroke="#6E8C25" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M268 56C258 50 252 54 250 58 256 60 262 60 268 56z" fill="#9EB14F" />
            <path d="M268 54C276 46 284 48 286 52 280 56 274 57 268 54z" fill="#9EB14F" />
            {/* 眼睛：白眼球＋會動的眼珠 */}
            <g className="mb-eyes">
              {EYES.map(([x, y], i) => (
                <g key={i}>
                  <ellipse cx={x} cy={y} rx="8" ry="8.6" fill="#FFFDF6" />
                  <g ref={el => { pupils.current[i] = el }}><circle cx={x} cy={y} r="4.3" fill="#231F35" /><circle cx={x + 1.6} cy={y - 1.8} r="1.3" fill="#FFFDF6" /></g>
                </g>
              ))}
            </g>
            <circle cx="244" cy="120" r="5" fill="rgba(240,106,90,.4)" /><circle cx="292" cy="120" r="5" fill="rgba(240,106,90,.4)" />
            <path className="m-closed" d="M260 122Q268 129 276 122" fill="none" stroke="#231F35" strokeWidth="3" strokeLinecap="round" />
            <g className="m-open"><ellipse cx="268" cy="124" rx="7.5" ry="6.5" fill="#231F35" /><ellipse cx="268" cy="127.5" rx="4" ry="2.5" fill="#F06A5A" /></g>

            {/* 燈泡：點一下才出現 */}
            {bulb > 0 && (
              <g key={bulb} className="mb-bulb" transform="translate(0 -6)">
                <g className="mb-rays" stroke="#F7C948" strokeWidth="3.2" strokeLinecap="round">
                  <path d="M236 30l-9-5M234 44h-11M300 30l9-5M302 44h11M268 6V-4M248 14l-6-8M288 14l6-8" />
                </g>
                <g className="mb-bulb-body">
                  <circle cx="268" cy="30" r="22" fill="#F7C948" opacity=".28" />
                  <path d="M268 14a14 14 0 0 0-8 25.5V44h16v-4.5A14 14 0 0 0 268 14z" fill="rgba(35,31,53,.18)" transform="translate(2.5 2)" />
                  <path d="M268 14a14 14 0 0 0-8 25.5V44h16v-4.5A14 14 0 0 0 268 14z" fill="#FFE27A" stroke="#231F35" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M263 32l3 4 2-4 2 4 3-4" fill="none" stroke="#E0A21B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="260" y="44" width="16" height="7" rx="2" fill="#8C8A99" stroke="#231F35" strokeWidth="2" />
                  <path d="M262 22a8 8 0 0 1 5-3" stroke="#FFFDF6" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>
              </g>
            )}
          </g>
        </svg>
      </button>
      <div className="stage-side">
        <div className="speech" aria-hidden="true">{talk.shown}<span className="caret" /></div>
      </div>
      <p className="sr-only" role="status">{talk.line}</p>
    </div>
  )
}
