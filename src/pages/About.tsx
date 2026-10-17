// 關於布穀島：三個分頁。「我們的故事」（願景、起源、我們看見的問題、我們的角色、冷知識）、「團隊成員」、「感謝名單」。
// 團隊成員與感謝名單還沒做，先顯示施工中（src/components/Construction.tsx）。
// 文字整理自〈114-2 進領成果報告｜布穀島社〉與 IG 貼文〈布穀島名稱 & 手勢大揭秘〉。
import { useState } from 'react'
import type { ReactNode } from 'react'
import { PageShell } from '@/components/Chrome'
import Construction from '@/components/Construction'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { to } from '@/lib/site'

const HOLES = [
  { n: '①', t: '社團與社團之間', d: '彼此搶社員、搶合作機構和贊助，經驗留在各自的社辦裡。' },
  { n: '②', t: '社團與教育組織之間', d: '教育組織有方法和教案，卻找不到穩定合作的社團。' },
  { n: '③', t: '社團與贊助單位之間', d: '贊助單位有善意，卻不清楚社團真正需要什麼。' },
]

const FACTS: { q: string; a: ReactNode; tint: string }[] = [
  { q: '「布穀島社」這個名字，藏著兩個願望？', tint: '#E6F1B5',
    a: <>「布穀」是<b>不孤</b>，「島社」是<b>倒社</b>。我們希望每個服務性社團的夥伴，都<b>不孤單、不倒社</b>。</> },
  { q: '我們有一個專屬手勢？', tint: '#F6D9D3',
    a: <>有！比出來的是一隻<b>即將展翅高飛的小布穀鳥</b>。下次在活動上看到有人這樣比，就是自己人。</> },
  { q: '布穀島社是在哪裡誕生的？', tint: '#D4EADF',
    a: <>不是在社辦，是在教室。2025 年 9 月，臺大領導學程的<b>「領導學導論」</b>課上，一群在服務性社團裡的同學組成了布穀島社。</> },
  { q: '這個網站裡藏了一隻鳥？', tint: '#E3DCF2',
    a: <>在電腦上按鍵盤的 <kbd>C</kbd>，牠會跟著你的游標飛；鳥出來後按 <kbd>O</kbd> 可以聽牠叫。手機就連點三下左上角的 Logo。</> },
]

function Fact({ q, a, tint, i }: { q: string; a: ReactNode; tint: string; i: number }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={'fact-card' + (open ? ' open' : '')} style={{ ['--tint' as string]: tint }}>
      <button type="button" aria-expanded={open} aria-controls={'fact-' + i} onClick={() => setOpen(!open)}>
        <span className="fact-no">冷知識 {String(i + 1).padStart(2, '0')}</span>
        <span className="fact-q">{q}</span>
        <span className="fact-hint" aria-hidden="true">{open ? '收起' : '點開看答案'}</span>
      </button>
      <div id={'fact-' + i} className="fact-a" hidden={!open}>
        <p>{a}</p>
        {i === 1 && <img src="/about/team-gesture.webp" alt="布穀島社成員一起比出布穀鳥手勢" width={775} height={250} loading="lazy" />}
        {i === 3 && <button type="button" className="btn ghost fact-try" onClick={() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', bubbles: true }))}>現在叫牠出來</button>}
      </div>
    </li>
  )
}

const tabsListCls = 'grid w-full grid-cols-3 h-auto p-1 rounded-2xl bg-[#F3E2B8]'
const tabCls = 'min-h-[44px] rounded-xl text-[15px] font-bold data-[state=active]:bg-[#231F35] data-[state=active]:text-[#D6EC6E]'

export default function About() {
  const [tab, setTab] = useState('story')
  // 換分頁時，如果已經往下捲了，回到分頁列的位置
  const change = (v: string) => {
    setTab(v)
    const bar = document.querySelector('.about-tabs')
    if (bar && bar.getBoundingClientRect().top < 70) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      scrollTo({ top: (document.querySelector('.content') as HTMLElement).offsetTop - 60, behavior: reduce ? 'auto' : 'smooth' })
    }
  }
  const back = <button type="button" className="btn primary" onClick={() => change('story')}>先看我們的故事</button>
  return (
    <PageShell kind="about" title="關於布穀島社" tint="#E6F1B5" lede="一群也在社團裡扛過的人，想把一座座孤島，連成島鏈。">
      <Tabs value={tab} onValueChange={change} style={{ display: 'grid', gap: 30 }}>
        <div className="about-tabs">
          <TabsList className={tabsListCls} aria-label="關於我們的分頁">
            <TabsTrigger value="story" className={tabCls}>我們的故事</TabsTrigger>
            <TabsTrigger value="team" className={tabCls}>團隊成員</TabsTrigger>
            <TabsTrigger value="thanks" className={tabCls}>感謝名單</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="story" className="mt-0" style={{ display: 'grid', gap: 30 }}>
        <figure className="vision">
          <img src="/about/vision.webp" alt="手寫的願景：願有一天，每座投入教育的島嶼都能突破圈層限制，形成彼此支持的島鏈。" width={878} height={363} />
          <figcaption>願有一天，每座投入教育的島嶼都能突破圈層限制，形成彼此支持的島鏈。</figcaption>
        </figure>

        <section className="about-sec">
          <h2>我們是誰</h2>
          <p>布穀島社在 2025 年 9 月成立，起點是臺大領導學程的「領導學導論」課。</p>
          <p>我們大多也是教育服務性社團的一員，帶過營隊、寫過教案、跑過贊助。我們知道，社團撐不撐得下去，直接決定了偏鄉的孩子能不能等到哥哥姊姊再回來。</p>
        </section>

        <section className="about-sec">
          <h2>同處一片海洋，彼此卻是孤島</h2>
          <div className="about-stats" role="list">
            <div role="listitem"><b>140+</b><span>所大學</span></div>
            <div role="listitem"><b>上百個</b><span>以教育為核心的服務性社團</span></div>
            <div role="listitem"><b>上萬名</b><span>每年被陪伴的孩子</span></div>
          </div>
          <p>每年有上千位大學生志工走進偏鄉與資源較少的地區，光是臺大就有約 20 個活躍的教育服務性社團。</p>
          <blockquote className="about-quote">
            每年舉辦的贊助活動中，總能看到許多熟悉的社團前來參與，但同時也不乏因為解散而消失的優秀社團。
            <cite>中租青年展望基金會 訪談節錄</cite>
          </blockquote>
          <p>明明大家都在意孩子、都投入教育，卻像一座座孤島，各自奮戰。島和島之間，有三個洞：</p>
          <ol className="holes">
            {HOLES.map(h => <li key={h.n}><i aria-hidden="true">{h.n}</i><div><b>{h.t}</b><span>{h.d}</span></div></li>)}
          </ol>
          <p className="about-strong">問題不在資源太少。社團的熱忱在、教育組織的方法在、贊助單位的善意也在，缺的是一座橋。</p>
          <p className="footnote">
            註：「孤島」對應社會學家 Robert Putnam 的社會資本概念：社團內部的「黏著型社會資本」很充沛，跨越不同群體的「橋接型社會資本」卻很缺乏。「洞」則來自 Ronald Burt 的「結構洞」：兩個群體之間缺少連結時，中間就會形成真空地帶，可以共享的知識也就卡在各自的系統裡。
          </p>
        </section>

        <section className="about-sec">
          <h2>我們想成為的角色</h2>
          <p>布穀島社想成為服務性社團之間<b>類公會型的中介組織</b>：用實體交流活動和線上的資源整理，從兩個方向把孤島連成島鏈。</p>
          <div className="axes">
            <div className="axis h">
              <svg viewBox="0 0 120 44" aria-hidden="true"><ellipse cx="22" cy="30" rx="18" ry="8" fill="#9EB14F" /><ellipse cx="98" cy="30" rx="18" ry="8" fill="#9EB14F" /><path d="M38 24 Q60 4 82 24" fill="none" stroke="#231F35" strokeWidth="2.4" strokeDasharray="4 4" /><path d="M78 19l5 6-7 1" fill="none" stroke="#231F35" strokeWidth="2.4" strokeLinecap="round" /></svg>
              <h3>水平串聯</h3>
              <p>讓第一線的服務經驗、教學方法和組織運作，在社團之間自由流動、互相學習。</p>
            </div>
            <div className="axis v">
              <svg viewBox="0 0 120 44" aria-hidden="true"><rect x="44" y="2" width="32" height="12" rx="6" fill="#F7C948" /><ellipse cx="60" cy="36" rx="22" ry="7" fill="#9EB14F" /><path d="M52 16v12M48 24l4 5 4-5" fill="none" stroke="#231F35" strokeWidth="2.4" strokeLinecap="round" /><path d="M68 28V16M64 20l4-5 4 5" fill="none" stroke="#231F35" strokeWidth="2.4" strokeLinecap="round" /></svg>
              <h3>垂直串聯</h3>
              <p>讓資源往下流動、需求往上被看見，串起教育組織、贊助單位、學校與社團。</p>
            </div>
          </div>
          <p className="about-strong">我們相信，只要把橋搭起來，1 + 1 + 1 會大於 3。最後，這些力量會變成給孩子更好的陪伴與教育。</p>
        </section>

        <section className="about-sec">
          <h2>布穀島冷知識</h2>
          <ul className="facts-list">{FACTS.map((f, i) => <Fact key={f.q} {...f} i={i} />)}</ul>
        </section>

        <section className="sheet about-end">
          <h2>這座島還在長大</h2>
          <p>如果你也在社團裡扛著，歡迎一起來。</p>
          <div className="btns" style={{ marginTop: 6 }}>
            <a className="btn primary" href={to('join')}>申請加入島鏈</a>
            <a className="btn ghost" href={to('resources')}>先逛逛資料庫</a>
          </div>
        </section>
        </TabsContent>
        <TabsContent value="team" className="mt-0">
          <Construction title="團隊成員" note="我們正在整理每位夥伴的介紹：他們來自哪個社團、在布穀島負責什麼。">{back}</Construction>
        </TabsContent>
        <TabsContent value="thanks" className="mt-0">
          <Construction title="感謝名單" note="一路上幫過布穀島的社團、組織、老師和朋友，我們正在一一整理。">{back}</Construction>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
