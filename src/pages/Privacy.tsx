// 隱私權政策（/privacy）。Google 登入的設定頁需要這個網址；內容要跟實際做法一致，改了會員功能記得一起改。
import { PageShell } from '@/components/Chrome'
import { to } from '@/lib/site'

const IG = 'https://www.instagram.com/cuckoo_island/'

export default function Privacy() {
  return (
    <PageShell kind="privacy" title="隱私權政策" tint="#E9E2F3" lede="布穀島社網站怎麼使用你登入時提供的資料。最後更新：2026 年 10 月 18 日。">
      <div className="policy" style={{ display: 'grid', gap: 26 }}>
        <section>
          <h2>我們蒐集哪些資料</h2>
          <p>只有在你使用<a href={to('member')}>會員專區</a>、按下「用 Google 登入」時，我們才會取得以下資料：</p>
          <ul>
            <li>Google 帳號提供的名字、Email 和大頭貼網址。</li>
            <li>你自己填的個人檔案：姓名、社團、學校、社團職位、習慣的聯絡方式、簡介，以及是否在會員名錄顯示。</li>
          </ul>
          <p>只瀏覽網站、不登入的話，我們不會蒐集任何個人資料。</p>
        </section>
        <section>
          <h2>資料用在哪裡</h2>
          <ul>
            <li>確認你是不是島鏈會員，開通會員專區和經營手冊的檔案。</li>
            <li>你選擇在會員名錄顯示時，讓其他已開通的會員看到你的姓名、社團、職位、聯絡方式和簡介。名錄不會顯示你的 Email 登入帳號。</li>
            <li>布穀島夥伴需要聯絡你時使用。</li>
          </ul>
          <p>我們不會把資料賣給或提供給其他單位，也不會用來投放廣告。</p>
        </section>
        <section>
          <h2>Google 使用者資料</h2>
          <p>本網站從 Google 帳號取得的資料，只用於登入和上面列出的用途，並遵守 <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API 服務使用者資料政策</a>，包括其中的「有限使用」規定。</p>
        </section>
        <section>
          <h2>資料存放在哪裡</h2>
          <p>會員資料存放在 Supabase 提供的雲端資料庫，傳輸過程加密。只有本人、已開通的會員（僅限名錄上你願意公開的內容）和布穀島的管理夥伴看得到。登入狀態會存在你的瀏覽器裡，按「登出」就會清除。</p>
        </section>
        <section>
          <h2>修改或刪除你的資料</h2>
          <p>你隨時可以在會員專區的「我的檔案」修改資料，或取消「在會員名錄顯示我的檔案」。想刪除整個帳號和資料，私訊 IG <a href={IG} target="_blank" rel="noopener noreferrer">@cuckoo_island</a>，我們會在 14 天內處理。</p>
        </section>
        <section>
          <h2>會員申請表單</h2>
          <p>申請加入時填的 Google 表單由 Google 表單保存，使用方式以表單上的說明為準。</p>
        </section>
        <section>
          <h2>聯絡我們</h2>
          <p>對這份政策有任何問題，請私訊 IG <a href={IG} target="_blank" rel="noopener noreferrer">@cuckoo_island</a>。</p>
        </section>
      </div>
    </PageShell>
  )
}
