import { useRef, useState } from 'react'
import { CampCardArt } from '@/components/MatchScene'

/* 學校提出營隊需求：原型。
   目前不會送出資料，只產生一張「需求卡」給學校確認，並可以複製內容私訊布穀島社。
   之後接上表單（Google 表單或資料庫）時，把 submit() 裡產生需求卡的地方換成送出即可。 */

const COUNTIES = ['基隆市', '台北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣']
const WHEN = ['寒假（1–2 月）', '暑假（7–8 月）', '學期中的週末', '學期中的平日']
const LENGTH = ['半天', '1 天', '2–3 天', '4–5 天', '都可以']
const THEMES = ['自然科學', '藝術創作', '閱讀與寫作', '品格與情緒', '戶外探索', '英語', '在地與多元文化', '體育與團隊遊戲', '都可以，想聽社團建議']
const GRADES = ['一、二年級', '三、四年級', '五、六年級', '國中']
const SIZES = ['15 人以下', '16–30 人', '31–50 人', '50 人以上']
const PROVIDE = ['教室', '操場或體育館', '住宿空間', '午餐', '交通接送', '老師一起參與']

type Form = {
  school: string; county: string; contact: string; reach: string
  when: string[]; whenNote: string; length: string
  themes: string[]; themeNote: string
  grades: string[]; size: string; kids: string
  provide: string[]; other: string
}
const EMPTY: Form = { school: '', county: '', contact: '', reach: '', when: [], whenNote: '', length: '', themes: [], themeNote: '', grades: [], size: '', kids: '', provide: [], other: '' }
type Errors = Partial<Record<keyof Form, string>>

function Choices({ name, legend, hint, options, value, multi, onChange, error, required }: {
  name: keyof Form; legend: string; hint?: string; options: string[]; value: string[] | string; multi?: boolean
  onChange: (v: string[] | string) => void; error?: string; required?: boolean
}) {
  const on = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o)
  const flip = (o: string) => {
    if (!multi) return onChange(value === o ? '' : o)
    const arr = value as string[]
    onChange(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o])
  }
  return (
    <fieldset className="sf-group" id={'sf-' + name} aria-describedby={error ? 'sf-' + name + '-err' : undefined} tabIndex={-1}>
      <legend>{legend}{required ? <em>必填</em> : <em className="opt">選填</em>}</legend>
      {hint && <p className="sf-hint">{hint}</p>}
      <div className="chips" role="group">
        {options.map(o => (
          <button key={o} type="button" className="chip" aria-pressed={on(o)} onClick={() => flip(o)}>
            {on(o) && <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>}
            {o}
          </button>
        ))}
      </div>
      {error && <p className="field-error" id={'sf-' + name + '-err'}>{error}</p>}
    </fieldset>
  )
}

function Text({ name, label, hint, value, onChange, error, required, area, placeholder, type = 'text', autoComplete }: {
  name: keyof Form; label: string; hint?: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean
  area?: boolean; placeholder?: string; type?: string; autoComplete?: string
}) {
  const id = 'sf-' + name
  const desc = [hint ? id + '-hint' : '', error ? id + '-err' : ''].filter(Boolean).join(' ') || undefined
  const common = { id, value, placeholder, 'aria-invalid': !!error || undefined, 'aria-describedby': desc, onChange: (e: any) => onChange(e.target.value) }
  return (
    <div className="sf-field">
      <label htmlFor={id}>{label}{required ? <em>必填</em> : <em className="opt">選填</em>}</label>
      {hint && <p className="sf-hint" id={id + '-hint'}>{hint}</p>}
      {area ? <textarea rows={4} {...common} /> : <input type={type} autoComplete={autoComplete} {...common} />}
      {error && <p className="field-error" id={id + '-err'}>{error}</p>}
    </div>
  )
}

export default function SchoolCampForm() {
  const [f, setF] = useState<Form>(EMPTY)
  const [err, setErr] = useState<Errors>({})
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState('')
  const card = useRef<HTMLDivElement>(null)
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => { setF(p => ({ ...p, [k]: v })); if (err[k]) setErr(e => ({ ...e, [k]: undefined })) }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!f.school.trim()) e.school = '請填學校名稱。'
    if (!f.county) e.county = '請選擇學校所在的縣市。'
    if (!f.contact.trim()) e.contact = '請填聯絡人，例如「教務處 王老師」。'
    if (!f.reach.trim()) e.reach = '請留下 Email 或電話，社團才聯絡得到你。'
    else if (!/@|\d{6,}/.test(f.reach.replace(/[\s-]/g, ''))) e.reach = '看起來不像 Email 或電話，請再確認一次。'
    if (!f.when.length) e.when = '至少選一個方便的時間。'
    if (!f.themes.length) e.themes = '至少選一個主題；還沒想法可以選「都可以」。'
    if (!f.grades.length) e.grades = '請選孩子的年級，社團才能設計適合的活動。'
    if (!f.size) e.size = '請選預估人數。'
    return e
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErr(e)
    const first = (Object.keys(EMPTY) as (keyof Form)[]).find(k => e[k])
    if (first) { document.getElementById('sf-' + first)?.focus(); return }
    setDone(true)
    setTimeout(() => { card.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); card.current?.focus() }, 60)
  }

  const summary = () => [
    `【學校營隊需求】${f.school}（${f.county}）`,
    `聯絡人：${f.contact}／${f.reach}`,
    `方便的時間：${f.when.join('、')}${f.whenNote ? `（${f.whenNote}）` : ''}`,
    f.length && `營隊長度：${f.length}`,
    `想要的主題：${f.themes.join('、')}${f.themeNote ? `（${f.themeNote}）` : ''}`,
    `孩子：${f.grades.join('、')}，${f.size}`,
    f.kids && `孩子的樣子：${f.kids}`,
    f.provide.length ? `學校可以提供：${f.provide.join('、')}` : '',
    f.other && `其他：${f.other}`,
  ].filter(Boolean).join('\n')

  const copy = async () => {
    try { await navigator.clipboard.writeText(summary()); setCopied('已複製，可以貼到 IG 私訊給我們。') }
    catch { setCopied('這個瀏覽器無法自動複製，請手動選取需求卡的文字。') }
  }

  if (done) return (
    <div className="sf-result" ref={card} tabIndex={-1} aria-labelledby="sf-card-title">
      <p className="sf-proto">原型展示：資料還不會送出</p>
      <p className="sf-next" style={{ marginTop: -4 }}>這是社團會看到的需求卡。</p>
      <article className="sf-card">
        <CampCardArt />
        <div className="sf-card-body">
          <div className="sf-card-top">
            <h4 id="sf-card-title">{f.school}</h4>
            <p>{f.county}・{f.grades.join('、')}・{f.size}</p>
          </div>
          <dl>
            <dt>方便的時間</dt><dd>{f.when.join('、')}{f.whenNote && <small>{f.whenNote}</small>}</dd>
            {f.length && <><dt>營隊長度</dt><dd>{f.length}</dd></>}
            <dt>想要的主題</dt><dd><span className="sf-tags">{f.themes.map(t => <span key={t}>{t}</span>)}</span>{f.themeNote && <small>{f.themeNote}</small>}</dd>
            {f.kids && <><dt>孩子的樣子</dt><dd>{f.kids}</dd></>}
            {f.provide.length > 0 && <><dt>學校可以提供</dt><dd>{f.provide.join('、')}</dd></>}
            {f.other && <><dt>其他</dt><dd>{f.other}</dd></>}
          </dl>
          <p className="sf-card-foot">聯絡人：{f.contact}（聯絡方式只給配對到的社團）</p>
        </div>
      </article>
      <p className="sf-next">正式上線後，這張需求卡會送到布穀島社。我們會從島鏈的社團中，找服務地區、時間和主題都合適的社團，再介紹雙方認識。</p>
      <div className="sf-actions">
        <button type="button" className="btn primary" onClick={copy}>複製需求內容</button>
        <a className="btn ghost" href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer">到 IG 私訊我們</a>
        <button type="button" className="btn ghost" onClick={() => { setDone(false); setCopied('') }}>修改內容</button>
      </div>
      <p className="status" role="status" aria-live="polite">{copied}</p>
    </div>
  )

  return (
    <form className="sf" onSubmit={submit} noValidate>
      <p className="sf-proto">原型展示：填完會產生一張需求卡，資料還不會送出。</p>

      <section className="sf-step">
        <h4><i>1</i>學校與聯絡人</h4>
        <Text name="school" label="學校名稱" required value={f.school} onChange={set('school')} error={err.school} autoComplete="organization" placeholder="例如：港西國小" />
        <div className="sf-field">
          <label htmlFor="sf-county">縣市<em>必填</em></label>
          <select id="sf-county" value={f.county} onChange={e => set('county')(e.target.value)} aria-invalid={!!err.county || undefined} aria-describedby={err.county ? 'sf-county-err' : undefined}>
            <option value="">請選擇</option>
            {COUNTIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {err.county && <p className="field-error" id="sf-county-err">{err.county}</p>}
        </div>
        <Text name="contact" label="聯絡人" required value={f.contact} onChange={set('contact')} error={err.contact} autoComplete="name" placeholder="例如：教務處 王老師" />
        <Text name="reach" label="Email 或電話" required value={f.reach} onChange={set('reach')} error={err.reach} autoComplete="email" />
      </section>

      <section className="sf-step">
        <h4><i>2</i>時間與主題</h4>
        <Choices name="when" legend="方便的時間" hint="可以複選。" multi required options={WHEN} value={f.when} onChange={v => set('when')(v as string[])} error={err.when} />
        <Text name="whenNote" label="時間補充" value={f.whenNote} onChange={set('whenNote')} placeholder="例如：7/10 之後、避開段考週" />
        <Choices name="length" legend="希望的營隊長度" options={LENGTH} value={f.length} onChange={v => set('length')(v as string)} />
        <Choices name="themes" legend="想要的主題" hint="可以複選。" multi required options={THEMES} value={f.themes} onChange={v => set('themes')(v as string[])} error={err.themes} />
        <Text name="themeNote" label="主題補充" value={f.themeNote} onChange={set('themeNote')} placeholder="例如：想讓孩子多認識家鄉的海" />
      </section>

      <section className="sf-step">
        <h4><i>3</i>孩子的樣子</h4>
        <Choices name="grades" legend="年級" hint="可以複選。社團會依年級設計活動，混齡也沒問題。" multi required options={GRADES} value={f.grades} onChange={v => set('grades')(v as string[])} error={err.grades} />
        <Choices name="size" legend="預估人數" required options={SIZES} value={f.size} onChange={v => set('size')(v as string)} error={err.size} />
        <Text name="kids" label="孩子概述" area value={f.kids} onChange={set('kids')} hint="孩子的興趣、個性、需要多留意的地方。請不要寫孩子的姓名。" placeholder="例如：很喜歡跑跳、對外人有點害羞；有兩位孩子需要注意力上的協助。" />
      </section>

      <section className="sf-step">
        <h4><i>4</i>學校可以提供</h4>
        <Choices name="provide" legend="場地與支援" hint="可以複選，幫助社團估算需要準備什麼。" multi options={PROVIDE} value={f.provide} onChange={v => set('provide')(v as string[])} />
        <Text name="other" label="其他想說的" area value={f.other} onChange={set('other')} />
      </section>

      <div className="sf-submit">
        <button className="btn primary" type="submit">產生需求卡</button>
        {Object.values(err).some(Boolean) && <p className="field-error" role="alert">還有 {Object.values(err).filter(Boolean).length} 個欄位需要補上，已幫你跳到第一個。</p>}
      </div>
    </form>
  )
}
