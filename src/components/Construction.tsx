// 「施工中」畫面：還沒做完的頁面或分頁先放這個。兩條封鎖線橫跨整個畫面，中間是交通錐和說明。
// 用法：<Construction title="團隊成員" note="我們正在整理成員介紹。" />
import type { ReactNode } from 'react'

const TAPE = '施工中・請勿進入　'

function Tape({ tilt, reverse }: { tilt: number; reverse?: boolean }) {
  return (
    <div className={'uc-tape' + (reverse ? ' rev' : '')} style={{ ['--tilt' as string]: `${tilt}deg` }} aria-hidden="true">
      {/* 兩段一樣的文字接在一起，捲動時無縫循環 */}
      <div className="uc-tape-run"><span>{TAPE.repeat(10)}</span><span>{TAPE.repeat(10)}</span></div>
    </div>
  )
}

export default function Construction({ title, note, children }: { title: string; note?: ReactNode; children?: ReactNode }) {
  return (
    <section className="uc" aria-labelledby="uc-title">
      <Tape tilt={-7} />
      <Tape tilt={5} reverse />
      <div className="uc-card">
        <svg className="uc-cone" viewBox="0 0 120 110" aria-hidden="true">
          <ellipse cx="62" cy="100" rx="46" ry="7" fill="rgba(35,31,53,.16)" />
          <path d="M22 96h76l-6 8H28z" fill="#231F35" />
          <path d="M48 14Q60 6 72 14l22 82H26z" fill="#F06A5A" />
          <path d="M42 38h36l5 18H37zM33 70h54l4 14H29z" fill="#FFFDF6" />
          <circle cx="94" cy="30" r="10" fill="#F7C948" />
          <path d="M94 24v7M94 34.5v.5" stroke="#231F35" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        <h2 id="uc-title">{title}還在施工中</h2>
        <p>{note ?? '我們正在整理這一頁，完成後會在 IG 公告。'}</p>
        {children}
      </div>
    </section>
  )
}
