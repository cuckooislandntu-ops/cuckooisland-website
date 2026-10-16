import { useState } from 'react'
import { PageShell } from '@/components/Chrome'

// Paste the Google Form link here (the "send → link" URL). On the real site the form can be embedded with an <iframe>;
// this preview page cannot embed other sites, so it opens the form in a new tab instead.
export const JOIN_FORM_URL = ''

const ASKS = [
  { t: '基本資料', d: '姓名、Email，以及你是社團幹部、資源單位還是個人。' },
  { t: '社團小檔案', d: '隸屬學校、整體人數、理念目標。' },
  { t: '服務據點', d: '合作關係、服務對象與人數、志工人數、營隊或課輔頻率。' },
  { t: '社團亮點', d: '你們最想讓別人知道的特色。' },
  { t: '願意分享的經驗與資源', d: '教案、招生經驗、可出借的器材……你分享一份，其他社團就少準備一份。' },
]

export default function Join() {
  const [msg, setMsg] = useState('')
  return (
    <PageShell kind="join" title="加入布穀島會員" tint="#F9D3C9"
      lede="成為島鏈的一份子。通過審核後，就能使用資料庫、經營手冊與需求媒合。">
      <ol className="flow-steps" aria-label="加入流程">
        <li>填寫申請表單</li><li>完成社團訪談問卷</li><li>通過審核，開始使用資料庫</li>
      </ol>

      <div className="sheet" style={{ display: 'grid', gap: 12 }}>
        <h2>申請表單</h2>
        <p className="section-lede" style={{ marginTop: 0 }}>表單用 Google 表單填寫，約 10 分鐘。社團幹部的訪談內容，審核後會整理成社團地圖上的介紹，就像我們在 IG《布穀好朋友》做的那樣。</p>
        {JOIN_FORM_URL
          ? <a className="btn primary" href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer">開啟申請表單</a>
          : <button className="btn primary" type="button" onClick={() => setMsg('表單網址還沒設定。把 Google 表單連結交給網站管理者後，這顆按鈕就會開啟表單。')}>開啟申請表單</button>}
        <p className="status" role="status" aria-live="polite">{msg}</p>
      </div>

      <div>
        <h2>表單會問這些</h2>
        <p className="section-lede">先準備好，填起來會比較快。</p>
        <ul className="toc" style={{ marginTop: 12 }}>
          {ASKS.map((a, i) => <li key={a.t}><i>{i + 1}</i><div><b>{a.t}</b><span>{a.d}</span></div></li>)}
        </ul>
      </div>

      <div className="paths">
        <div className="path" style={{ background: 'var(--cream)', boxShadow: 'var(--shadow-riso)' }}>
          <h3>審核要多久？</h3>
          <p>布穀島社會在收到申請後聯絡你。通過審核後，就能查看資料庫的資源連結與聯絡窗口。</p>
        </div>
        <div className="path" style={{ background: 'var(--cream)', boxShadow: 'var(--shadow-riso)' }}>
          <h3>不是社團幹部？</h3>
          <p>資源單位或想幫忙的個人，也可以先到需求媒合留下你能提供的資源。</p>
          <a className="link-plain" href="#match">前往需求媒合</a>
        </div>
      </div>
    </PageShell>
  )
}
