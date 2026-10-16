// From the 布穀好朋友 IG series (club interviews). Pin positions are approximate (town level), for the schematic map only.
export type Region = 'north' | 'central' | 'south' | 'east' | 'abroad'
export type Site = { name: string; detail: string; region?: Region; at?: [number, number] }
export type Club = {
  id: string; name: string; tagline: string; school: string; size?: string; ig?: string; ep?: string
  types: string[]; sites: Site[]; highlights: string[]; color: string; partial?: boolean
  overview?: string; ideals?: string[]; closing?: string
}

export const REGION_LABEL: Record<Region, string> = { north: '北部', central: '中部', south: '南部', east: '東部', abroad: '海外' }

export const CLUBS: Club[] = [
  {
    id: 'shanyou', overview: '每學期到花蓮瑞北國小舉辦兩次育樂營，山友稱為平服和假服：學期中 2 天的營隊，以及寒暑假 4 天的營隊。瑞北的小朋友多為布農族或阿美族，活潑不怕生，擁有治癒系的笑容。每週五也會在新北汐止的信望愛教會一對一課輔，和孩子建立深厚的友誼與信任。', ideals: ['陪伴關愛：以「哥哥姐姐」而不是「老師」的身分，提供陪伴與支持', '樹立典範：期待成為孩子的榜樣，一個可以學習的大人樣子', '共同成長：用多元主題課程，和孩子攜手探索世界（主要在育樂營）'], closing: '歡迎加入山友，與一群認真又溫暖的夥伴「長期耕耘」，與一群活潑又可愛的孩子「一起長大」！', name: '台大慈幼山友', tagline: '和山裡的孩子做朋友', school: '國立臺灣大學', size: '約 70 人', ig: 'ntukkf', ep: '布穀好朋友 EP.1',
    types: ['營隊', '課輔'], color: '#F06A5A',
    sites: [
      { name: '花蓮瑞北國小', region: 'east', at: [121.37, 23.53], detail: '每學期兩次育樂營：學期中 2 天的平服、寒暑假 4 天的假服。國小 1–6 年級，孩子約 55 人，志工約 50 人。' },
      { name: '新北汐止 信望愛教會', region: 'north', at: [121.65, 25.07], detail: '學期間每週五晚上一對一課輔（社會局小衛星計畫）。孩子約 20 人，志工約 25 人。' },
    ],
    highlights: ['真名互動：不使用暱稱，和孩子建立長期真實的連結', '雙據點：課輔班與營隊，用不同形式服務', '長期穩定：兩個據點都已服務超過 18 年'],
  },
  {
    id: 'wvs', overview: '服務分為寒暑假營隊和平時服務。寒假會到花蓮大禹、豐濱、奇美等地辦 3 日營隊；暑假會前往 1 個國外據點，以及花蓮豐濱，進行為期 2 週的營隊。平時，世志也和板橋扶青社的小太陽課輔班合作，協助英語課輔。', ideals: ['以伴育人：透過高品質的陪伴，引導孩子探索自我與未來', '青年培力：培力學生投入志工服務，拓展社會視野與行動力', '連結世界：透過本土與國際的人際連結，看見更多可能性', '深度出隊：重視出隊體驗，讓服務成為理解教育不平等的起點'], closing: '歡迎加入台大世界志工社，從台灣開始，往世界出發，一起踏上與孩子、夥伴共同成長的冒險！', name: '台大世界志工社', tagline: '一起做我們在乎的事', school: '國立臺灣大學', size: '約 40 人', ig: 'ntuwvs', ep: '布穀好朋友 EP.2',
    types: ['營隊', '課輔', '國際服務'], color: '#4FB5C0',
    sites: [
      { name: '花蓮奇美國小', region: 'east', at: [121.44, 23.47], detail: '每年寒假 3 日營隊。國小 1–6 年級，孩子約 10 人，志工約 8 人。' },
      { name: '花蓮大禹國小', region: 'east', at: [121.32, 23.35], detail: '寒假營隊，長期合作。孩子約 20 人，志工約 15 人。' },
      { name: '花蓮豐濱社區', region: 'east', at: [121.52, 23.6], detail: '寒假 3 日、暑假 2 週營隊，也協助社區的彈弓大賽、貓公路跑和釀酒節。' },
      { name: '板橋中山國小 小太陽課輔班', region: 'north', at: [121.46, 25.01], detail: '與板橋扶輪青年社合作，學期間 3–5 次英語課輔與雙語手作課。國小 4–6 年級，約 30 人。' },
      { name: '印度 耶拉吉里', region: 'abroad', detail: '與當地 YMCA 合作，暑假 7 日營隊。' },
      { name: '尼泊爾 加德滿都', region: 'abroad', detail: '與 Vinayak School 長期合作，暑假 10 日營隊（目前因旅遊警戒暫緩）。' },
    ],
    highlights: ['走向世界：疫情後前往尼泊爾、印度服務', '深耕國內：長期在花蓮豐濱、大禹、奇美服務', '志工推廣：培力更多志工投入行動'],
  },
  {
    id: 'coconut', overview: '學期中有兩天的平服，地點在雙北資源相對匱乏的國小；寒暑假則是一週的營隊，前往中南部偏鄉地區。每學期和不同學校合作，據點不固定。', ideals: ['希望能帶給小孩歡樂，因為跨越年齡的羈絆是非常珍貴的', '期盼透過與大學生的交流與陪伴，為孩子帶來正向榜樣與溫暖支持', '同時讓大學生社員們，再次體驗童年的純真'], closing: '在孩子們心中播下關懷與服務的種子，讓他們未來願意回饋社會，成為有責任感與行動力的公民。', name: '台大陽光椰子社會服務社', tagline: '陽光椰子，愛小孩子', school: '國立臺灣大學', size: '約 50 人', ig: 'ntusunnycoconut', ep: '布穀好朋友 EP.5',
    types: ['營隊', '平日服務'], color: '#F7C948',
    sites: [
      { name: '雙北國小（每學期不同）', region: 'north', detail: '學期中兩天的平服，到雙北資源相對匱乏的國小。' },
      { name: '中南部偏鄉國小', region: 'south', detail: '寒暑假一週營隊。孩子與志工各約 30 人。' },
    ],
    highlights: ['每學期有社遊與兩次社課，用輕鬆的氣氛凝聚團隊', '不限學校、年級、科系都可以加入'],
  },
  {
    id: 'kindkids', overview: '一學期通常有兩次平服（學期間）和一次假服（寒暑假）。平服上營一天，假服三天。每次出隊間隔約一個半月，讓社員有充足的時間準備，服務也不會太密集。服務的國小兩年更換一次。', ideals: ['為偏鄉的孩子提供更多元、豐富的資源', '透過陪伴與活動設計，和孩子一起玩、一起探索', '讓孩子在成長過程中，擁有更多不同的體驗與回憶'], closing: '大學四年，想體驗出隊帶小孩的服務嗎？慈幼社服歡迎你的加入～', name: '台大慈幼社服', tagline: '偏鄉國小，陪伴教育', school: '國立臺灣大學', size: '約 60–70 人', ig: 'ntukindkids__kk103', ep: '布穀好朋友 EP.6',
    types: ['營隊'], color: '#B7A6D9',
    sites: [
      { name: '港西國小（115-1 出隊）', detail: '每學期兩次 1 天平服、一次 3 天假服，服務國小兩年換一次。國小 1–6 年級，孩子約 32 人，志工約 40 人。' },
    ],
    highlights: ['輕鬆出隊：入社不用面試，I 人友善', '溫暖小卡：假服結束寫卡片給每個孩子', '創新不斷：正念、藏寶圖等創新教案'],
  },
  {
    id: 'dgsf', name: '台大東谷沙飛', tagline: '部落英語口說與課輔', school: '國立臺灣大學', color: '#9EB14F', partial: true,
    types: ['線上課輔', '營隊'],
    sites: [
      { name: '雙龍部落', region: 'central', at: [120.88, 23.74], detail: '上山進行田野調查、訪談居民，協助課輔並帶教案活動。' },
      { name: '線上英文口說課輔', detail: '每週兩節，五、六年級各一節，用自己設計的教案練習口說。' },
    ],
    highlights: ['用多元教案主題補上部落缺少的英語口說資源'],
  },
]
