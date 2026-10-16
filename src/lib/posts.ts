// Column articles, written from the 布穀好朋友 (club interviews) and 布可不資道 (resource reviews) IG posts.
export type Post = {
  id: string; series: '布穀好朋友' | '布可不資道'; ep: string; date: string; title: string; hook: string; sum: string; credit: string
  clubId?: string; resIds?: number[]; intro?: string[]; keys?: { label: string; items: string[] }; closing?: string
}

export const SERIES_INFO = {
  布穀好朋友: { label: '社團介紹', color: '#A3534A', tint: '#F6D9D3' },
  布可不資道: { label: '教學資源評比', color: '#2F6F5A', tint: '#D4EADF' },
} as const

export const POSTS: Post[] = [
  {
    id: 'post-friends-6', series: '布穀好朋友', ep: 'EP.6', date: '2026-10-02', clubId: 'kindkids', credit: '內容：昀',
    title: '慈幼社服，找到幸福！', hook: '輕鬆出隊還能找到幸福？（心動）',
    sum: '台大慈幼社服的平服、假服，和寫給孩子的溫暖小卡。',
  },
  {
    id: 'post-friends-5', series: '布穀好朋友', ep: 'EP.5', date: '', clubId: 'coconut', credit: '內容：宥儀',
    title: '陽光椰子的服務據點在海邊嗎？', hook: '與布穀島作伙來一探究竟吧！',
    sum: '台大陽光椰子：學期中在雙北、寒暑假到中南部偏鄉，不限學校科系都能加入。',
  },
  {
    id: 'post-tools-4', series: '布可不資道', ep: 'EP.4', date: '2026-05-21', resIds: [52, 53, 49, 54, 51, 50], credit: '內容：偉齡、冠凱｜設計：偉齡',
    title: '想培養媒體素養？5 個網站給你肩膀！', hook: '吃西瓜不吐西瓜籽，竟長出整顆西瓜樹？',
    sum: '從數位素養資源網到真假人臉小遊戲，教孩子在網路與 AI 時代分辨資訊。',
    intro: [
      '媒體素養（Media Literacy）是解讀、評估、分析和產製紙本與電子媒體的能力。資訊素養（Information Literacy）則是確認、檢索、組織、使用與評估資訊的能力。',
      '小朋友比我們還活網？在資訊爆炸的年代，孩子接觸的資訊更複雜、更難分辨，如何妥善運用資訊成了必修課。一起來看看怎麼教吧！',
    ],
    closing: '媒素怎麼教，一看就知道！一起和孩子培養數位時代的重要能力。',
  },
  {
    id: 'post-friends-2', series: '布穀好朋友', ep: 'EP.2', date: '2026-05-10', clubId: 'wvs', credit: '內容：冠凱、亭安｜設計：偉齡',
    title: '世界志工社會去世界上什麼地方？', hook: '和布穀島社一起認識新世界吧～',
    sum: '台大世界志工社：深耕花蓮豐濱、大禹、奇美，也走到印度與尼泊爾。',
  },
  {
    id: 'post-tools-3', series: '布可不資道', ep: 'EP.3', date: '2026-05-08', resIds: [13, 14, 11, 12], credit: '內容：偉齡｜設計：偉齡',
    title: '沒聽過 SEL？4 個平台帶你跟上潮流', hook: '一生氣就爆發、不會面對挫折、對自我不認識……',
    sum: '社會情緒學習的五項核心能力，以及四個能直接拿來用的 SEL 教學平台。',
    intro: [
      '近年被瘋狂提起的 SEL 是什麼？社會情緒學習（Social Emotional Learning）強調學科以外的非認知能力。',
      '2025 年教育部頒布 SEL 相關計畫，期待培養孩子的情緒素養，建立面對挑戰的韌性。快來看看情緒教育這門軟實力，該如何變成一堂堂有趣的課程！',
    ],
    keys: { label: 'SEL 的五項核心能力（圖源：CASEL）', items: ['自我覺察', '自我管理', '社會覺察', '人際技巧', '負責任的決策'] },
    closing: '更懂 SEL 了嗎？趕快存起來，未來要用就有。一起和孩子成為 SEL 達人吧！',
  },
  {
    id: 'post-tools-2', series: '布可不資道', ep: 'EP.2', date: '2026-04-29', resIds: [36, 35, 39, 48, 41, 37], credit: '內容：冠凱｜設計：偉齡',
    title: 'SDGs 怎麼教？6 個網站讓你直接用！', hook: '我知道 SDGs，但要怎麼教？',
    sum: '環境探索館、黑松愛地兒、永續台灣創意教案……附上小編的推薦指數。',
    intro: [
      'SDGs（Sustainable Development Goals）是聯合國訂定的 17 項永續發展目標，希望 2030 年前讓世界朝更永續的方向前進。',
      '想帶孩子學習 SDGs，卻不知道從哪裡切入？這篇帶你認識可以落地、符合需求的教學資源。',
    ],
    closing: '快傳給你那位正在苦思教案的朋友，你就是他的救世主！',
  },
  {
    id: 'post-friends-1', series: '布穀好朋友', ep: 'EP.1', date: '2026-04-25', clubId: 'shanyou', credit: '內容：偉齡｜設計：偉齡',
    title: '什麼？原來慈幼山友沒有在爬山！', hook: '快和布穀島社一探究竟他們的服務內容吧～',
    sum: '台大慈幼山友：在花蓮瑞北國小辦育樂營、在汐止一對一課輔，已經超過 18 年。',
  },
  {
    id: 'post-tools-1', series: '布可不資道', ep: 'EP.1', date: '2026-04-16', resIds: [1, 3, 4, 7, 9], credit: '內容：冠凱｜設計：偉齡',
    title: '缺教學靈感？精選 5 個網站送給你！', hook: '（快開始籌備了）算了……跟之前一樣就好？',
    sum: 'Share Class、教育大市集、翻轉教育、博幼基金會、均一，五個綜合型資源平台。',
    intro: [
      '教案主題，攸關我們究竟帶給孩子什麼影響。面對課程設計，是否曾經沒有靈感，或是有想法，卻不知道怎麼實踐？',
      '這篇整理了 5 個綜合型資源平台，涵蓋國小、國中、高中的教學資源，讓你找到靈感、減輕負擔、看見更多可能。',
    ],
    closing: '快傳給你那位服務性社團的朋友，他一定會很愛你。下一集開始是主題式資源，別錯過！',
  },
]

export const fmtDate = (d: string) => (d ? `${+d.slice(0, 4)} 年 ${+d.slice(5, 7)} 月 ${+d.slice(8)} 日` : '')
