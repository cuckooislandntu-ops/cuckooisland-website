import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IMPORTED } from '@/lib/resources-data'

type Cat = 'all' | 'teach' | 'sponsor' | 'lecturer' | 'activity' | 'template'
type Review = { ep: string; rating?: number; intro: string; themes?: string; provides?: string; grades?: string; os?: string }
type Entry = { id: number; cat: Exclude<Cat, 'all'>; sub: string; title: string; desc: string; grade: string; url: string; area?: string; source?: string; review?: Review
  file?: { href: string; name: string; format: string }; contents?: string[]
  activity?: { goal: string; people: string; time: string; space: string; props: string; steps: string[]; tips: string[]; variations?: string[]; links?: { t: string; u: string }[] } }

const PERSONA: Record<Cat, { label: string; bg: string; badge: string; lines: string[]; subs: string[] }> = {
  all: { label: '總覽', bg: '#E6F1B5', badge: '#6E8C25', subs: [],
    lines: ['來找資料嗎？看看最新的吧！', '我嗅到了有人需要資源的味道……', '走過路過不要錯過！', '今天也來挖寶嗎？'] },
  teach: { label: '教學資源', bg: '#CFE6D8', badge: '#2F6F5A', subs: ['教案', '教具', '團康活動', '營隊課程'],
    lines: ['用現成教案資源，讓你事半功倍！', '你們是我帶過最棒的一屆學生', '各位同學大家早安', '這一題，下次營隊會考喔。'] },
  sponsor: { label: '贊助資源', bg: '#F7E3A6', badge: '#8A6414', subs: ['經費補助', '物資捐贈', '場地', '交通'],
    lines: ['預算有了，就差你的好點子！', '這份企劃書，我收下了。', '我們的 CSR，正在找好夥伴。', '讓資源去到真正需要的地方。'] },
  lecturer: { label: '講師', bg: '#DDD3F0', badge: '#5B4A9A', subs: ['幹部培訓', '教學設計', '兒少安全', '社團經營'],
    lines: ['麥克風測試，一二、一二。', '下一場培訓，就等你來邀請！', '有問題嗎？現在舉手最划算。', '把經驗分享出去，是我最喜歡的事。'] },
activity: { label: '團隊活動', bg: '#D5EDC9', badge: '#B4531B', subs: [],
    lines: ['集合！今天來點破冰的。', '嗶——全員圍成一圈！', '再來一次，這次要更快！', '好的團隊，是玩出來的。'] },
    template: { label: '模板', bg: '#EADFCB', badge: '#7A5C3E', subs: [],
    lines: ['表單、範本都幫你準備好了，填空就好！', '這份同意書，記得請家長簽名喔。', '歸檔完畢，下一份！', '別再從零開始寫企劃書了。'] }
}
const ORDER: Cat[] = ['all', 'teach', 'sponsor', 'lecturer', 'activity', 'template']

const MERGE: Record<string, string> = { 'YT頻道': '科普', '各式課程皆有': '綜合型', '夢想實驗室': '綜合型', '公共衛生': '社會議題' }
// Templates clubs can download and edit; files live in public/templates/
const TEMPLATES: Entry[] = [
  { id: 1000, cat: 'template', sub: '同意書', title: '營隊家長同意書範本', grade: '營隊、課輔', url: '',
    desc: '營隊、課輔活動都能用的家長同意書。把【】裡的文字換成你們的活動資訊，就能直接列印。',
    file: { href: '/templates/parent-consent.docx', name: '營隊家長同意書範本.docx', format: 'Word 檔，一頁 A4' },
    contents: ['活動資訊', '學員資料', '健康與注意事項', '緊急聯絡人', '接送方式', '保險', '照片與影片使用', '家長簽名'] },
]
// Team-building activities, written as lead-it-yourself guides
const ACTIVITIES: Entry[] = [
  { id: 1001, cat: 'activity', sub: '團隊凝聚', title: '圍圈：每個人都被聽見', grade: '全年段', url: '',
    desc: '大家圍成一圈，輪流拿著發言物分享。適合營隊第一天、每天的開場或結束，讓孩子和隊輔都練習好好說、好好聽。',
    activity: { goal: '建立安全感、練習聆聽、凝聚團隊', people: '6–25 人', time: '15–30 分鐘', space: '室內或安靜的戶外，能坐成一圈', props: '一個發言物（小球、玩偶或石頭）',
      steps: ['大家坐成一圈，帶領者也坐在圈裡，和大家一樣高。', '說明三個約定：拿到發言物的人才說話；其他人專心聽、不打斷；不想說可以說「先跳過」。', '帶領者先示範，用一句話回答暖身題，例如「用一種天氣形容今天的心情」。', '把發言物依順時針傳下去，每個人輪流分享。', '第二輪換成深一點的題目，例如「今天最想謝謝誰」。', '最後由帶領者整理大家說到的共同點，謝謝每個人的分享。'],
      tips: ['題目從輕到重，先讓每個人都能輕鬆開口。', '尊重說「先跳過」的孩子，可以在最後再問一次。', '帶領者不評論分享內容，只回應「謝謝你」。'],
      variations: ['品格圈：每次圍繞一個品格主題，例如勇敢、感謝。', '心情溫度計：用 1 到 10 分說今天的心情，再說一個原因。'],
      links: [{ t: '圍圈在班級和課堂的應用', u: 'https://www.htcfoundation.org.tw/knowledge/show/11' }, { t: '耶拿輕鬆學：圍圈（影片）', u: 'https://www.youtube.com/watch?v=mzfzj6xekKM&t=156s' }] } },
  { id: 1002, cat: 'activity', sub: '暖身遊戲', title: '虎克船長', grade: '國小中年級以上', url: '',
    desc: '考驗反應的經典團康。指到誰，誰就要喊出口號、做出動作，旁邊的人也要一起動。幾分鐘就能讓全場醒過來。',
    activity: { goal: '暖身提神、訓練反應與專注', people: '8–30 人', time: '10–15 分鐘', space: '能圍成一圈的空間', props: '不需要',
      steps: ['大家站成一圈，帶領者先當第一位船長。', '船長雙手比向圈內任一人，喊「虎克」。', '被指到的人要馬上舉起雙手，喊「船長」。', '同時，被指到的人左右兩邊的人要做划船動作，一起喊「嘿咻」。', '剛剛被指到的人接著喊「虎克」，指向下一個人，遊戲繼續。', '慢了、喊錯或做錯動作的人，接受一個小懲罰，例如表演一個動作，再回到圈裡繼續玩。'],
      tips: ['先慢速示範一輪，確定大家都知道誰要做什麼。', '越玩越快，節奏是好玩的關鍵。', '懲罰以好玩、不羞辱為原則。'],
      variations: ['各社團的口號和動作常常不一樣，可以換成你們自己的版本。', '加入「颱風來了」之類的口令，讓所有人換位置，增加變化。'] } },
  { id: 1003, cat: 'activity', sub: '破冰', title: '兩真一假', grade: '國小中年級以上', url: '',
    desc: '每個人說三件關於自己的事，兩件是真的、一件是假的，讓大家猜哪一件是假的。剛認識的時候最好用。',
    activity: { goal: '破冰、快速認識彼此', people: '4–30 人（人多時分成 5–6 人一組）', time: '15–25 分鐘', space: '不限', props: '紙筆（選用）',
      steps: ['給大家 2 分鐘，想好三件關於自己的事，兩真一假。', '帶領者先示範，例如「我養過一隻烏龜、我會騎單輪車、我去過 10 個國家」。', '輪流說出三件事，其他人討論後，猜哪一件是假的。', '公布答案，請本人補充一個真話背後的小故事。', '所有人輪完後，選出「最會騙人」和「最讓人驚訝」的人。'],
      tips: ['提醒大家，假的那件也要說得像真的，才好玩。', '鼓勵說一些平常不會講的小事，更能拉近距離。', '小朋友可以先把三件事寫在紙上，比較不會忘記。'],
      variations: ['小隊競賽：猜對一次得一分，比哪一隊最會看穿。', '主題版：限定題目，例如「關於我的童年」或「關於服務的經驗」。'] } },
]
export const ENTRIES: Entry[] = [...(IMPORTED as unknown as Entry[]).map(e => ({ ...e, sub: MERGE[e.sub] || e.sub })), ...TEMPLATES, ...ACTIVITIES]
const rank = (e: Entry) => (e.review ? 100 + (e.review.rating || 2.5) * 10 : 0)
const PICKS = ENTRIES.filter(e => (e.review?.rating || 0) >= 4).sort((a, b) => (b.review!.rating! - a.review!.rating!) || b.id - a.id)
const subsOf = (c: Cat) => { const m = new Map<string, number>(); ENTRIES.filter(e => e.cat === c).forEach(e => m.set(e.sub, (m.get(e.sub) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]) }
const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function useTalk(cat: Cat) {
  const lines = PERSONA[cat].lines
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * lines.length))
  const [n, setN] = useState(0)
  const line = lines[idx % lines.length]
  useEffect(() => { setIdx(Math.floor(Math.random() * lines.length)) }, [cat])
  useEffect(() => {
    if (RM) { setN(line.length); return }
    setN(0); const id = setInterval(() => setN(v => (v >= line.length ? v : v + 1)), 75)
    return () => clearInterval(id)
  }, [line])
  const next = () => setIdx(i => { let j = i; while (lines.length > 1 && j === i) j = Math.floor(Math.random() * lines.length); return j })
  useEffect(() => { if (n >= line.length) { const t = setTimeout(next, 3800); return () => clearTimeout(t) } }, [n, line])
  return { shown: line.slice(0, n), line, talking: n < line.length, next }
}

function Mascot({ cat, talking }: { cat: Cat; talking: boolean }) {
  const ink = '#231F35', skin = '#F6C7A8', cream = '#FFFDF6'
  const body: Record<Cat, string> = { all: '#9EB14F', teach: '#4FB5C0', sponsor: '#2D3A63', lecturer: '#8E7CC3', activity: '#F08A3E', template: '#D9737F' }
  return (
    <svg className={'mascot' + (talking ? ' talking' : '')} viewBox="0 0 360 230" aria-hidden="true">
      <g key={cat} className="scene-in">
        {/* backdrops */}
        {cat === 'all' && <g opacity=".9">
          <ellipse cx="70" cy="214" rx="60" ry="12" fill="#9EB14F" /><ellipse cx="160" cy="222" rx="44" ry="9" fill="#9EB14F" />
          <path d="M70 202 Q115 160 160 212" fill="none" stroke="#6E8C25" strokeWidth="2.4" strokeDasharray="5 6" />
          <circle cx="70" cy="200" r="5" fill={ink} /><circle cx="160" cy="210" r="5" fill={ink} />
        </g>}
        {cat === 'teach' && <g>
          <rect x="140" y="10" width="214" height="112" rx="6" fill="#B98B5E" />
          <rect x="148" y="18" width="198" height="96" rx="3" fill="#2F5A46" />
          <text x="164" y="54" fill={cream} fontSize="22" fontFamily="Huninn, sans-serif">教案</text>
          <path d="M164 72h50M164 88h36M330 40l-6 12h12zM300 92a10 10 0 1 0 20 0" stroke={cream} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".85" />
          <rect x="146" y="120" width="202" height="6" rx="3" fill="#9A7149" />
        </g>}
        {cat === 'sponsor' && <g>
          {[[150, 196, 26, 34], [180, 180, 22, 50], [206, 200, 18, 30]].map(([x, y, w, h], i) => <rect key={i} x={x - 120} y={y} width={w} height={h} fill="#E8C66A" />)}
          {[[60, 54], [118, 34], [170, 72], [40, 118]].map(([x, y], i) => <g key={i} className="float" style={{ animationDelay: `${i * .4}s` }}>
            <circle cx={x + 3} cy={y + 3} r="15" fill="rgba(35,31,53,.15)" /><circle cx={x} cy={y} r="15" fill="#F7C948" /><circle cx={x} cy={y} r="9" fill="none" stroke="#C99A1F" strokeWidth="2.4" />
          </g>)}
        </g>}
        {cat === 'lecturer' && <g>
          <path d="M268 0 L196 230 H340 Z" fill="rgba(255,253,246,.55)" />
          <path d="M0 0h46c-6 40 6 120-10 230H0z" fill="#B5546A" /><path d="M360 0h-30c6 50-4 140 8 230h22z" fill="#B5546A" />
          <path d="M0 0h360v16c-20 8-40 8-60 0s-40-8-60 0-40 8-60 0-40-8-60 0-40 8-60 0-40-8-60 0z" fill="#93405A" />
        </g>}

        {cat === 'activity' && <g>
          <rect x="0" y="168" width="360" height="62" fill="#9EB14F" />
          <path d="M0 196 H360" stroke="#FFFDF6" strokeWidth="3" opacity=".8" />
          <ellipse cx="200" cy="168" rx="70" ry="10" fill="none" stroke="#FFFDF6" strokeWidth="3" opacity=".6" />
          {[[44, 214], [104, 206], [176, 218]].map(([x, y], i) => <g key={i}><path d={`M${x} ${y} l12 -30 l12 30 z`} fill="#F06A5A" /><rect x={x + 5} y={y - 15} width="14" height="5" fill="#FFFDF6" /><rect x={x - 3} y={y} width="30" height="5" rx="2" fill="#C9473A" /></g>)}
          <g className="float"><circle cx="146" cy="150" r="13" fill="#FFFDF6" stroke="#231F35" strokeWidth="2" /><path d="M146 143 l6 4 -2 7 h-8 l-2 -7 z" fill="#231F35" /></g>
        </g>}
        {cat === 'template' && <g>
          <rect x="150" y="12" width="208" height="200" rx="4" fill="#B98B5E" />
          <rect x="157" y="19" width="194" height="86" fill="#7E5535" /><rect x="157" y="112" width="194" height="92" fill="#7E5535" />
          {[0, 1].map(r => Array.from({ length: 13 }, (_, i) => {
            const cols = ['#F7C948', '#4FB5C0', '#F06A5A', '#9EB14F', '#B7A6D9', '#FFFDF6', '#2D3A63']
            const h = r ? 80 - (i * 7) % 18 : 74 - (i * 5) % 16
            return <rect key={r + '-' + i} x={160 + i * 14.6} y={(r ? 204 : 105) - h} width="12" height={h} rx="2" fill={cols[(i + r * 3) % cols.length]} />
          }))}
          <g className="float"><rect x="24" y="150" width="34" height="42" rx="3" fill="#FFFDF6" transform="rotate(-12 41 171)" /><path d="M30 162h20M30 170h18M30 178h12" stroke="#B9B2A0" strokeWidth="2.4" transform="rotate(-12 41 171)" /></g>
          {[0, 1, 2, 3, 4].map(i => <rect key={i} x={70 + (i % 2) * 3} y={214 - i * 7} width="64" height="6" rx="1.5" fill={i % 2 ? '#F3E2B8' : '#FFFDF6'} stroke="#D7CDB4" strokeWidth="1" />)}
          <rect x="74" y="178" width="58" height="8" rx="2" fill="#F7C948" />
        </g>}

        {/* character */}
        <g className="bob">
          <path d="M226 234 C226 176 242 142 268 142 C294 142 310 176 310 234 Z" fill="rgba(35,31,53,.18)" transform="translate(5 3)" />
          <path d="M226 234 C226 176 242 142 268 142 C294 142 310 176 310 234 Z" fill={body[cat]} />
          {cat !== 'all' && <path d="M256 144 L268 172 L280 144 Z" fill={cream} />}
          {cat === 'sponsor' && <path d="M265 150 L271 150 L274 178 L268 186 L262 178 Z" fill="#F06A5A" />}
          {cat === 'teach' && <path d="M226 186 L184 112" stroke="#8A5A3B" strokeWidth="4" strokeLinecap="round" />}
          {cat === 'all' && <g><path d="M256 146 Q268 162 280 146" fill="none" stroke={ink} strokeWidth="2" /><circle cx="259" cy="168" r="7" fill={ink} /><circle cx="277" cy="168" r="7" fill={ink} /><circle cx="259" cy="168" r="3" fill="#6FCFD5" /><circle cx="277" cy="168" r="3" fill="#6FCFD5" /></g>}
          {cat === 'activity' && <g><path d="M256 146 L268 166 L280 146" fill="none" stroke="#FFFDF6" strokeWidth="2" /><rect x="262" y="164" width="14" height="9" rx="3" fill="#C9C4B8" stroke="#8C8A99" strokeWidth="1.5" /><path d="M234 190 L234 230 M302 190 L302 230" stroke="#FFFDF6" strokeWidth="5" /><path d="M268 172 V230" stroke="#C9631F" strokeWidth="2" /></g>}
          {cat === 'template' && <g><rect x="246" y="176" width="40" height="50" rx="4" fill="#8A5A3B" /><rect x="251" y="184" width="30" height="38" rx="2" fill="#FFFDF6" /><rect x="258" y="171" width="16" height="9" rx="2" fill="#C9C4B8" /><path d="M256 194h20M256 202h20M256 210h12" stroke="#B9B2A0" strokeWidth="2.4" /></g>}
          {cat === 'sponsor' && <g><rect x="306" y="196" width="40" height="28" rx="4" fill="#8A5A3B" /><path d="M318 196v-6h16v6" fill="none" stroke="#8A5A3B" strokeWidth="4" /></g>}
          {/* arm */}
          <g className={cat === 'all' ? 'wave' : ''} style={{ transformOrigin: '304px 166px' }}>
            {cat === 'lecturer'
              ? <><path d="M304 168 L292 136" stroke={body[cat]} strokeWidth="13" strokeLinecap="round" /><path d="M291 138 L282 122" stroke={ink} strokeWidth="7" strokeLinecap="round" /><circle cx="279" cy="117" r="7.5" fill="#8C8A99" /></>
              : <><path d="M304 168 L328 132" stroke={body[cat]} strokeWidth="13" strokeLinecap="round" /><circle cx="330" cy="129" r="7" fill={skin} />{cat === 'activity' && <g><circle cx="338" cy="114" r="10" fill="#E8E5DC" stroke="#8C8A99" strokeWidth="2" /><path d="M338 114 V108 M338 104 V101" stroke="#231F35" strokeWidth="2" strokeLinecap="round" /></g>}</>}
          </g>
          <circle cx="268" cy="104" r="36" fill={skin} />
          {/* hair and hats */}
          {cat === 'all' && <><path d="M236 84 Q238 54 268 52 Q298 54 300 84 Z" fill="#D9C48A" /><ellipse cx="268" cy="84" rx="48" ry="9" fill="#C9B271" /></>}
          {cat === 'teach' && <><circle cx="268" cy="62" r="13" fill={ink} /><path d="M232 100 A36 36 0 0 1 304 100 Q290 80 268 82 Q246 80 232 100Z" fill={ink} /></>}
          {cat === 'sponsor' && <path d="M232 98 A36 36 0 0 1 304 96 Q296 76 276 78 Q262 70 240 84 Q234 90 232 98Z" fill={ink} />}
          {cat === 'lecturer' && <path d="M232 100 A36 36 0 0 1 304 100 Q300 84 288 86 Q280 74 268 80 Q256 72 246 84 Q236 84 232 100Z" fill={ink} />}
          {cat === 'activity' && <><path d="M232 92 Q234 60 268 58 Q302 60 304 92 Z" fill="#2F6F5A" /><ellipse cx="232" cy="92" rx="26" ry="6" fill="#24584A" /><circle cx="268" cy="58" r="4" fill="#24584A" /></>}
          {cat === 'template' && <><path d="M228 120 Q224 66 268 64 Q312 66 308 120 Q304 122 300 118 Q302 90 288 84 Q268 92 244 86 Q234 94 236 118 Q232 122 228 120Z" fill={ink} /><path d="M298 76 L314 60" stroke="#F7C948" strokeWidth="4" strokeLinecap="round" /><path d="M314 60 L317 57" stroke="#F06A5A" strokeWidth="4" strokeLinecap="round" /></>}
          {/* face */}
          <g className="eyes"><circle cx="256" cy="104" r="4" fill={ink} /><circle cx="280" cy="104" r="4" fill={ink} /></g>
          {cat === 'teach' && <g fill="none" stroke={ink} strokeWidth="2.2"><circle cx="256" cy="104" r="10" /><circle cx="280" cy="104" r="10" /><path d="M266 104h4" /></g>}
          <circle cx="246" cy="118" r="5" fill="rgba(240,106,90,.4)" /><circle cx="290" cy="118" r="5" fill="rgba(240,106,90,.4)" />
          <path className="m-closed" d="M260 120 Q268 127 276 120" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <g className="m-open"><ellipse cx="268" cy="122" rx="7.5" ry="6.5" fill={ink} /><ellipse cx="268" cy="125.5" rx="4" ry="2.5" fill="#F06A5A" /></g>
        </g>
      </g>
    </svg>
  )
}

function ActivityGuide({ a }: { a: NonNullable<Entry['activity']> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <dl className="facts">
        <dt>適合</dt><dd>{a.goal}</dd>
        <dt>人數</dt><dd>{a.people}</dd>
        <dt>時間</dt><dd>{a.time}</dd>
        <dt>場地</dt><dd>{a.space}</dd>
        <dt>道具</dt><dd>{a.props}</dd>
      </dl>
      <button type="button" className="guide-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起玩法' : '看怎麼帶'}</button>
      {open && (
        <div className="guide">
          <h4>玩法</h4>
          <ol>{a.steps.map(x => <li key={x}>{x}</li>)}</ol>
          <h4>帶領小技巧</h4>
          <ul>{a.tips.map(x => <li key={x}>{x}</li>)}</ul>
          {a.variations && <><h4>變化玩法</h4><ul>{a.variations.map(x => <li key={x}>{x}</li>)}</ul></>}
          {a.links && <><h4>延伸閱讀</h4><ul className="guide-links">{a.links.map(l => <li key={l.u}><a href={l.u} target="_blank" rel="noopener noreferrer">{l.t}</a></li>)}</ul></>}
        </div>
      )}
    </>
  )
}

export function EntryCard({ e, fresh }: { e: Entry; fresh?: boolean }) {
  const p = PERSONA[e.cat]
  const host = e.url ? e.url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '') : ''
  return (
    <article className="entry">
      <div className="entry-top">
        <span className="cat-badge" style={{ background: p.badge }}>{p.label}</span>
        <span className="sub-tag">{e.sub}</span>
        {e.grade && <span className="sub-tag">{e.grade}</span>}
        {e.area && <span className="sub-tag">{e.area}</span>}
        {fresh && <span className="fresh">新登錄</span>}
      </div>
      <h3>{e.title}</h3>
      {e.review?.rating && <p className="stars" aria-label={`推薦指數 ${e.review.rating} 顆星，滿分 5 顆`}>{[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= e.review!.rating! ? 'on' : ''} aria-hidden="true">★</span>)}<em>推薦指數</em></p>}
      {e.review ? <p className="entry-desc">{e.review.intro}</p> : e.desc && <p className="entry-desc">{e.desc}</p>}
      {e.review && (
        <dl className="facts">
          {e.review.themes && <><dt>主題方向</dt><dd>{e.review.themes}</dd></>}
          {e.review.provides && <><dt>提供內容</dt><dd>{e.review.provides}</dd></>}
          {e.review.grades && <><dt>適用年段</dt><dd>{e.review.grades}</dd></>}
        </dl>
      )}
      {e.review?.os && <p className="os">小編 OS：{e.review.os}</p>}
      {e.review && <p className="series">出自 IG 貼文「{e.review.ep}」</p>}
      {e.activity && <ActivityGuide a={e.activity} />}
      {e.contents && <><p className="contents-label">範本包含</p><ul className="tpl-contents">{e.contents.map(c => <li key={c}>{c}</li>)}</ul></>}
      <div className="entry-foot">
        <span className="host">{e.file ? e.file.format : host || '尚無連結'}</span>
        {e.file && <a className="open-link" href={e.file.href} download={e.file.name}>下載範本<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13h10" /></svg></a>}
        {e.url && <a className="open-link" href={e.url} target="_blank" rel="noopener noreferrer">開啟資源<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 3h4v4M13 3L7 9M12 10v3H3V4h3" /></svg></a>}
      </div>
    </article>
  )
}

export default function Resources() {
  const [cat, setCat] = useState<Cat>('all')
  const [q, setQ] = useState('')
  const [sub, setSub] = useState<string | null>(null)
  const talk = useTalk(cat)
  const p = PERSONA[cat]
  useEffect(() => { setQ(''); setSub(null) }, [cat])

  const latest = useMemo(() => [...ENTRIES].sort((a, b) => b.id - a.id).slice(0, 6), [])
  const subs = useMemo(() => subsOf(cat), [cat])
  const list = useMemo(() => ENTRIES.filter(e => e.cat === cat && (!sub || e.sub === sub) && (!q.trim() || (e.title + e.desc + e.sub + e.grade).toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => (rank(b) - rank(a)) || b.id - a.id), [cat, sub, q])

  return (
    <main className="page" id="main">
      <section className="db-stage" style={{ background: p.bg }}>
        <div className="hero-inner">
          <h1>資料庫</h1>
          <p className="lede">贊助、教學資源、講師、團隊活動和模板，都整理在這裡。</p>
          <div className="stage-box">
            <button type="button" className="mascot-btn" onClick={talk.next} aria-label="換一句話">
              <Mascot cat={cat} talking={talk.talking} />
            </button>
            <div className="speech" aria-hidden="true">{talk.shown}<span className="caret" /></div>
            <p className="sr-only" role="status">{talk.line}</p>
          </div>
        </div>
      </section>

      <div className="cat-bar" role="tablist" aria-label="資料類別">
        {ORDER.map(c => (
          <button key={c} type="button" role="tab" aria-selected={cat === c} className="cat-tab" onClick={() => setCat(c)}
            style={cat === c ? { background: PERSONA[c].badge, color: '#FFFDF6', borderColor: PERSONA[c].badge } : undefined}>
            {PERSONA[c].label}
          </button>
        ))}
      </div>

      <div className="content"><div className="content-inner">
        <p className="sample-note">共 {ENTRIES.length} 筆資源，整理自布穀島社現有的資源清單。島鏈會員會收到這些資源的整理與更新。</p>
        {cat === 'all' ? (
          <>
            <div>
              <h2>最新登錄</h2>
              <div className="entries" style={{ marginTop: 12 }}>{latest.map(e => <EntryCard key={e.id} e={e} fresh />)}</div>
            </div>
            <div>
              <h2>布可不資道：小編評分精選</h2>
              <p className="section-lede">我們在 IG 實際看過、評過分的教學資源，推薦指數 4 顆星以上。</p>
              <div className="entries" style={{ marginTop: 12 }}>{PICKS.map(e => <EntryCard key={e.id} e={e} />)}</div>
            </div>
            <div>
              <h2>依類別找</h2>
              <div className="cat-tiles" style={{ marginTop: 12 }}>
                {ORDER.slice(1).map(c => (
                  <button key={c} type="button" className="cat-tile" onClick={() => { setCat(c); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ background: PERSONA[c].bg }}>
                    <b>{PERSONA[c].label}</b><span>{ENTRIES.filter(e => e.cat === c).length} 筆</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <Label htmlFor="db-q" className="sr-only">搜尋{p.label}</Label>
              <Input id="db-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={`搜尋${p.label}`} className="h-12 text-base bg-white rounded-xl" />
            </div>
            <div className="chips" role="group" aria-label={p.label + '分類'}>
              <button type="button" className="chip" aria-pressed={sub === null} onClick={() => setSub(null)}>全部</button>
              {subs.map(s => <button key={s} type="button" className="chip" aria-pressed={sub === s} onClick={() => setSub(sub === s ? null : s)}>{s}</button>)}
            </div>
            <p className="count" aria-live="polite">共 {list.length} 筆</p>
            <div className="entries">
              {list.map(e => <EntryCard key={e.id} e={e} />)}
              {list.length === 0 && (ENTRIES.some(e => e.cat === cat)
                ? <div className="empty"><h3>沒有符合的資料</h3><p>換個關鍵字，或點「全部」看這一類的所有資料。</p></div>
                : <div className="empty"><h3>{p.label}資料整理中</h3><p>這一類還沒有登錄資料。認識合適的{cat === 'lecturer' ? '講師' : '單位'}，歡迎推薦給我們。</p><a className="btn primary" style={{ minHeight: 46, padding: '0 18px', fontSize: 15 }} href="#match">推薦給布穀島社</a></div>)}
            </div>
          </div>
        )}
        <div className="sheet" style={{ display: 'grid', gap: 8 }}>
          <h2>有資源想分享？</h2>
          <p className="section-lede" style={{ marginTop: 0 }}>加入島鏈後，可以把你們的教案、講師或贊助資訊分享進資料庫。你分享一份，其他社團就少準備一份。</p>
          <a className="btn primary" href="#join">申請加入島鏈</a>
        </div>
      </div></div>
    </main>
  )
}
