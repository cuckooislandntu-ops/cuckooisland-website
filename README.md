# 布穀島社官網

串聯全台教育服務性社團：交流經驗、共享資源、一起成長。

手機優先的網站：首頁是一段跟著捲動播放的動畫故事，另外有加入會員、資料庫、社團地圖、經營手冊、活動、專欄、需求媒合等頁面。

- IG：[@cuckoo_island](https://www.instagram.com/cuckoo_island/)
- 技術：React 18 + TypeScript + Vite + Tailwind CSS

---

## 常見修改：要改哪個檔案

大部分內容都是「資料檔」，改文字就好，不用碰畫面程式。

| 想改的東西 | 檔案 | 說明 |
|---|---|---|
| 首頁每一段的文字 | `src/pages/Home.tsx` | 每段都有註解標號，例如 `{/* 6. 海的另一邊：教育組織 */}` |
| 資料庫的資源（教學資源、贊助） | `src/lib/resources-data.ts` | 一筆一個 `{ ... }`。`id` 越大越新，最新的會出現在「最新登錄」 |
| 資源的評分、小編 OS | `src/lib/resources-data.ts` 裡的 `review` | `rating` 是 1–5 顆星 |
| 資料庫角色的台詞 | `src/pages/Resources.tsx` 最上方的 `PERSONA` | 每個類別一組 `lines` |
| 社團地圖上的社團 | `src/lib/clubs.ts` | `at: [經度, 緯度]` 決定地圖上的點，沒有就不標點 |
| 專欄文章 | `src/lib/posts.ts` | 社團介紹的內容來自 `clubs.ts`，資源評比的內容來自 `resources-data.ts` |
| 加入會員的 Google 表單 | `src/pages/Join.tsx` 的 `JOIN_FORM_URL` | 貼上 Google 表單的分享連結 |
| 經營手冊章節、需求媒合流程 | `src/pages/Sections.tsx` | |
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
