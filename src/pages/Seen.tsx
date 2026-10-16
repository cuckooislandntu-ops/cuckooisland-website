import { useState } from 'react'

type Who = 'sponsor' | 'edu' | 'club'
const WHO: { id: Who; label: string; does: string; color: string }[] = [
  { id: 'sponsor', label: '贊助單位', does: '提供資源', color: '#8A7F55' },
  { id: 'edu', label: '教育組織', does: '提供教案、教學方法', color: '#4E7F84' },
  { id: 'club', label: '學生社團', does: '人才培養、營運', color: '#A3534A' },
]
const Up = () => (
  <svg className="up" viewBox="0 0 22 22" aria-hidden="true"><path d="M11 2l8 9h-5v9H8v-9H3z" fill="currentColor" /></svg>
)

function Term({ who, title, note, bg, focus }: { who: Who; title: string; note: string; bg: string; focus: Who | null }) {
  const w = WHO.find(x => x.id === who)!
  const cls = 'term' + (focus ? (focus === who ? ' lit' : ' dim') : '')
  return (
    <div className={cls} style={{ background: bg }}>
      <Up />
      <b>{title}</b>
      <span>（{note}）</span>
      <div><span className="who" style={{ background: w.color }}>{w.label}：{w.does}</span></div>
    </div>
  )
}

export default function Seen() {
  const [focus, setFocus] = useState<Who | null>(null)
  return (
    <section className="flow seen dark" data-tone="dark">
      <div className="head">
        <p className="pre">當點連成了面，</p>
        <h2>企業、基金會與教育組織，都更能看見他們。</h2>
      </div>

      <div className="partners">
        <article className="partner">
          <h3>教育組織</h3>
          <div className="figs">
            <div className="fig"><b>50+</b><span>教育發展與資源相關組織</span></div>
            <div className="fig"><b>20+</b><span>議題組織在發展教育資源</span></div>
          </div>
          <p>有著專業的教學方法、上萬份教案及培訓資源，等待運用。</p>
        </article>
        <article className="partner">
          <h3>企業與贊助單位</h3>
          <div className="figs">
            <div className="fig"><b>上萬間</b><span>企業都有 CSR 目標</span></div>
            <div className="fig"><b>30+</b><span>企業、單位辦理相關贊助計畫</span></div>
          </div>
          <p>有些計畫卻接觸不到學生，或企業不知道能如何提供支持。</p>
        </article>
      </div>

      <div className="formula">
        <span className="ask">我們總在想……</span>
        <h3>如果全部的力量能集結起來，究竟會是多麼強大的事！</h3>
        <div className="eq" data-focus={focus || undefined} aria-live="polite">
          <div className="eq-row"><span className="result">一次服務<svg viewBox="0 0 22 22" width="20" height="20" aria-hidden="true"><path d="M11 2l8 9h-5v9H8v-9H3z" fill="currentColor" /></svg></span><span className="op" aria-label="等於">=</span></div>
          <div className="eq-row"><Term who="sponsor" title="資金、物資資源" note="做事的基礎" bg="#EDE6CC" focus={focus} /></div>
          <div className="eq-row"><span className="op" aria-label="加">+</span><span className="paren">（</span><div className="term plain"><b>服務時數</b></div></div>
          <div className="eq-row"><span className="op" aria-label="乘">×</span><Term who="edu" title="教學內容" note="做事的基礎" bg="#D7E3F2" focus={focus} /></div>
          <div className="eq-row"><span className="op" aria-label="乘">×</span><Term who="club" title="志工品質" note="教學力" bg="#F1DBD3" focus={focus} /><span className="paren">）</span></div>
        </div>
        <div className="who-pick" role="group" aria-label="看每個角色能提升哪一項">
          {WHO.map(w => (
            <button key={w.id} type="button" className="chip" aria-pressed={focus === w.id} onClick={() => setFocus(focus === w.id ? null : w.id)}>{w.label}</button>
          ))}
        </div>
      </div>
    </section>
  )
}
