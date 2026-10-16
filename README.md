# 布穀島社官網

串聯全台教育服務性社團：交流經驗、共享資源、一起成長。

手機優先的網站：首頁是一段跟著捲動播放的動畫故事，另外有加入會員、資料庫、社團地圖、經營手冊、活動、專欄、需求媒合等頁面。

- IG：[@cuckoo_island](https://www.instagram.com/cuckoo_island/)
- 技術：React 18 + TypeScript + Vite + Tailwind CSS

---

## 編輯內容：用 /admin 後台

資料庫（教學資源、贊助資源、講師、團隊活動、模板）、社團地圖、專欄文章、會員表單連結，都在後台編輯：

1. 打開 https://cuckooisland-website.vercel.app/admin/
2. 第一次按「Sign In Using Access Token」，貼上 GitHub 權杖（產生方式見下方）。
3. 左邊選類別 →「New」新增，或點一筆修改 → 按「Save」。
4. 約 1–2 分鐘後網站自動更新。

**GitHub 權杖**：用布穀島的 GitHub 帳號登入 → 右上頭像 → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token。Repository access 選「Only select repositories」→ `cuckooisland-website`；Permissions 的 **Contents** 設成 **Read and write**。到期日可以選 1 年。權杖等於密碼，不要傳到群組。

小提醒：
- 取消「上架」就會從網站隱藏，不會刪除。
- 照片上傳會自動轉成 WebP、縮到 1600px。講師照片請先去背、臉放中間。
- 存檔後如果網站沒更新，到 Vercel 看最新一次部署有沒有失敗；建置時有問題的資料會被略過並在記錄裡寫「注意：」。

內容存放在 `content/` 資料夾（一筆一個 JSON 檔），`scripts/build-content.mjs` 會在每次建置時把它轉成網站讀的 `src/generated/content.ts`（自動產生，不要手動改）。後台的欄位設定在 `public/admin/config.yml`。

## 其他修改：要改哪個檔案

| 想改的東西 | 檔案 | 說明 |
|---|---|---|
| 首頁每一段的文字 | `src/pages/Home.tsx` | 每段都有註解標號，例如 `{/* 6. 海的另一邊：教育組織 */}` |
| 資料庫角色的台詞、類別顏色 | `src/pages/Resources.tsx` 最上方的 `PERSONA` | 每個類別一組 `lines` |
| 後台的分類選項、欄位 | `public/admin/config.yml` | 例如教學資源的「分類」選項 |
| 經營手冊章節、活動紀錄、需求媒合流程 | `src/pages/Sections.tsx` | |
| 加入會員頁的權益說明 | `src/pages/Join.tsx` | 表單連結在後台「網站設定」改 |
| 選單項目 | `src/lib/site.tsx` 的 `NAV` | |
| 顏色、字級 | `src/index.css` 最上方 `:root` | 字型是 Huninn（jf open 粉圓） |
| Logo | `src/lib/logo.ts`、`public/` | 網頁內的 Logo 以 base64 內嵌；`public/` 放網站圖示與分享預覽圖 |

### 直接在 GitHub 網頁上改

1. 在 GitHub 打開要改的檔案，按右上角的鉛筆圖示。
2. 改完按「Commit changes」。
3. 有接 Vercel 的話，約 1 分鐘後網站會自動更新。

---

## 在自己電腦上預覽

需要 [Node.js](https://nodejs.org/) 20 以上和 pnpm（`npm i -g pnpm`）。

```bash
pnpm install
pnpm dev      # 開發預覽，打開終端機顯示的網址
pnpm build    # 產生正式版到 dist/
```

---

## 部署到 Vercel（第一次設定）

1. 到 [vercel.com](https://vercel.com) 用這個 GitHub 帳號登入。
2. 「Add New → Project」，選這個 repo，按「Import」。
3. 設定會自動偵測為 Vite（Build Command `pnpm build`、Output Directory `dist`），直接按「Deploy」。
4. 完成後會拿到一個公開網址。之後每次推到 `main` 分支，網站都會自動更新。
5. 想用自己的網域：在 Vercel 專案的「Settings → Domains」加入網域，照指示設定 DNS。

網址格式：各頁是 `#join`、`#resources`、`#map` 這樣的錨點，專欄文章是 `#post-friends-1` 這種格式，可以直接分享。

---

## 資料來源

- 教學資源：布穀島社資源整理試算表（教學資源、TFT 參考資料、活動參觀行程）。
- 資源評分與介紹：IG《布可不資道》EP.1–4。
- 贊助資訊：[中國醫藥大學服務學習組公告](https://service-learning.cmu.edu.tw/news-cata/23)（第 1 頁）。
- 社團介紹：IG《布穀好朋友》EP.1、2、5、6。社團地圖上的點是大約位置。

## 之後可以做的

- 把資源、社團、文章改由 Google 試算表管理，網站自動讀取，不會寫程式的人也能更新。
- 會員登入與審核：接 Supabase 或 Firebase（Google 登入），審核通過的會員才看得到資源連結。
- 把 Google 表單直接嵌入加入會員頁。
