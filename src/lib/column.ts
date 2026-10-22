// 專欄總覽與文章頁共用的小工具：標籤、閱讀時間、相關文章、跨頁記住篩選。
// 《布穀好朋友》社團介紹歸在社團地圖，其他系列才是專欄；相關文章、上一篇／下一篇都只在同一邊找。
// 標籤全部從現有資料自動帶出（社團的服務地區與形式、資源的分類），不用在後台另外填。
import { CLUBS, CLUB_INTROS, COLUMN_POSTS, ENTRIES, REGION_LABEL, isClubIntro, isMemberCat } from '@/lib/content'
import type { Post } from '@/lib/content'

const clubOf = (p: Post) => (p.clubId ? CLUBS.find(c => c.id === p.clubId) : undefined)
const resOf = (p: Post) => (p.resIds.map(r => ENTRIES.find(e => e.id === r)).filter(Boolean) as typeof ENTRIES).filter(e => !isMemberCat(e.cat))

/** 同一邊的文章：社團介紹 → 其他社團介紹；專欄 → 其他專欄 */
export const groupOf = (p: Post) => (isClubIntro(p) ? CLUB_INTROS : COLUMN_POSTS)

/** 文章的主題標籤：社團介紹帶服務地區與服務形式，資源文章帶資源分類（只算公開的資源）。最多 max 個。 */
export function postTags(p: Post, max = 4): string[] {
  const out: string[] = []
  const club = clubOf(p)
  if (club) {
    for (const s of club.sites) if (s.region) out.push(REGION_LABEL[s.region])
    out.push(...club.types)
  }
  for (const e of resOf(p)) if (e.sub) out.push(e.sub)
  return [...new Set(out.filter(Boolean))].slice(0, max)
}

/** 閱讀時間（分鐘）：中文約每分鐘 400 字，社團小檔案、據點、亮點、資源卡片也算進去。 */
export function readMinutes(p: Post): number {
  const club = clubOf(p)
  const text = [
    p.html.replace(/<[^>]+>/g, ''), p.closing || '',
    club ? [club.tagline, ...club.highlights, ...club.sites.map(s => s.name + s.detail)].join('') : '',
    resOf(p).map(e => e.title + e.desc).join(''),
  ].join('')
  return Math.max(1, Math.round(text.replace(/\s/g, '').length / 400))
}

/** 你可能也喜歡：只在同一邊找。同一份資源優先，其次同系列，再依新舊。 */
export function relatedPosts(p: Post, n = 3): Post[] {
  const score = (q: Post) => q.resIds.filter(r => p.resIds.includes(r)).length * 2 + (q.series === p.series ? 1 : 0)
  return groupOf(p).filter(q => q.id !== p.id)
    .map((q, i) => ({ q, s: score(q), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n).map(x => x.q)
}

export const shortDate = (d: string) => (d ? `${+d.slice(0, 4)}.${+d.slice(5, 7)}.${+d.slice(8, 10)}` : '')

// 跨頁記住一個選擇（只在這個分頁有效，換頁讀過一次就清掉）：
// 從文章頁點系列標籤回專欄 → 篩好那個系列；從社團介紹點「在社團地圖上看」→ 地圖上展開那個社團
const remember = (k: string) => (v: string) => { try { sessionStorage.setItem(k, v) } catch { /* 無痕模式等情況可略過 */ } }
const take = (k: string) => (): string | null => { try { const v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v } catch { return null } }
export const rememberSeries = remember('bugu-column-series')
export const takeSeries = take('bugu-column-series')
export const rememberClub = remember('bugu-map-club')
export const takeClub = take('bugu-map-club')
