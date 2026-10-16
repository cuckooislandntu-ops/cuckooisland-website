import { PageShell } from '@/components/Chrome'
import { SETTINGS } from '@/lib/content'

// 會員申請用的 Google 表單（加入布穀島｜島鏈計畫會員申請）：在 /admin 的「網站設定」修改。
// 要直接嵌入表單：在 Google 表單按「傳送 → <> 嵌入 HTML」，把 iframe 的 src 貼到「表單嵌入網址」。
export const JOIN_FORM_URL = SETTINGS.joinFormUrl
export const JOIN_FORM_EMBED = SETTINGS.joinFormEmbed

const BENEFITS = [
  { t: '收到整理好的資源', d: '布穀島整理的服務資源、工具與參考資料，包括教案、贊助資訊和講師名單。' },
  { t: '優先收到活動與贊助品', d: '我們媒合到的免費活動資訊與贊助品，會員會先知道。' },
  { t: '和其他社團交換經驗', d: '每個社團回答幾個外界很難找到答案的問題，例如出隊預算怎麼分配。有回答，就能看到其他社團的回答整理。' },
  { t: '用布穀島的名義聯絡', d: '對外找贊助、邀講師或發感謝狀時，可以用布穀島的名義聯絡。' },
]

const SECTIONS = [
  { t: '基本資料', who: '所有人', d: '姓名、Email（審核結果會寄到這裡）、手機或 LINE ID，以及申請身分。' },
  { t: '社團資料', who: '代表社團申請', d: '學校與社團全名、你的系級與社團角色、幹部任期、社團 IG 或 FB，以及社團訪談文件。' },
  { t: '單位或個人資料', who: '資源單位、個人', d: '單位或學校名稱，以及你想怎麼參與：提供贊助或物資、擔任講師、分享教案或經驗、活動志工，或先了解看看。' },
  { t: '最後幾題', who: '所有人', d: '從哪裡知道布穀島、是否有興趣加入布穀島團隊，以及資料使用同意。' },
]

const TIPS = [
  '可以由幾位幹部一起完成，不用一次填完。',
  '依社團願意公開的程度填寫就好。不想公開的內容，在該題後面標註【不公開】；不適用的題目填【無】。',
  '社團經營上的困難請照實寫，不用美化。我們想知道你們真正需要什麼。',
  '資料發布到 IG 或網站之前，我們一定會先請你們審稿。',
]

export default function Join() {
  return (
    <PageShell kind="join" title="加入布穀島" tint="#F9D3C9"
      lede="島鏈計畫會員申請。每個服務性社團都是一座島，加入島鏈，讓資源流通、經驗傳遞，一起發揮 1+1>2 的影響力。">
      <ol className="flow-steps" aria-label="申請流程">
        <li>填寫申請表單，約 3 分鐘</li>
        <li>填寫社團訪談文件</li>
        <li>布穀島夥伴聯絡確認，正式加入島鏈</li>
      </ol>

      <div className="sheet" style={{ display: 'grid', gap: 12 }}>
        <h2>申請表單</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>社團、資源單位或個人都可以申請。代表社團申請的話，表單會帶你下載社團訪談文件。</p>
        {JOIN_FORM_EMBED
          ? <iframe className="form-embed" src={JOIN_FORM_EMBED} title="島鏈計畫會員申請表單" loading="lazy">載入中…</iframe>
          : null}
        <a className="btn primary" href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer">填寫會員申請表單</a>
        <p className="status" style={{ margin: 0 }}>表單會在新分頁開啟，是 Google 表單。</p>
      </div>

      <div>
        <h2>加入島鏈，你們可以</h2>
        <div className="benefits" style={{ marginTop: 12 }}>
          {BENEFITS.map(b => <div key={b.t} className="benefit"><b>{b.t}</b><span>{b.d}</span></div>)}
        </div>
      </div>

      <div>
        <h2>表單會問這些</h2>
        <p className="section-lede">選好申請身分後，只需要回答和你有關的題目。</p>
        <ul className="toc" style={{ marginTop: 12 }}>
          {SECTIONS.map((s, i) => <li key={s.t}><i>{i + 1}</i><div><b>{s.t}<em className="who">{s.who}</em></b><span>{s.d}</span></div></li>)}
        </ul>
      </div>

      <div className="sheet" style={{ display: 'grid', gap: 10 }}>
        <h2>填寫社團訪談文件的小提醒</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>訪談文件的內容，經你們審稿後，會整理成社團地圖和專欄《布穀好朋友》裡的介紹。</p>
        <ul className="tips">{TIPS.map(t => <li key={t}>{t}</li>)}</ul>
        <a className="link-plain" href="#post-friends-1">看看《布穀好朋友》寫成的樣子</a>
      </div>

      <div className="paths">
        <div className="path" style={{ background: 'var(--cream)', boxShadow: 'var(--shadow-riso)' }}>
          <h3>送出之後</h3>
          <p>布穀島夥伴看過資料後，會用你留下的 Email 跟你們聯絡，確認後就正式成為島鏈的一份子。</p>
        </div>
        <div className="path" style={{ background: 'var(--cream)', boxShadow: 'var(--shadow-riso)' }}>
          <h3>有問題？</h3>
          <p>歡迎私訊 IG，我們會盡快回覆。</p>
          <a className="link-plain" href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer">IG @cuckoo_island</a>
        </div>
      </div>
    </PageShell>
  )
}
