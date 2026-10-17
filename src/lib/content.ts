// Typed access to the site content. The content itself is edited at /admin and lives in content/;
// scripts/build-content.mjs turns it into src/generated/content.ts before every build.
import raw from '@/generated/content'

export type Cat = 'all' | 'teach' | 'sponsor' | 'lecturer' | 'activity' | 'template'
export type Review = { ep: string; rating?: number; intro: string; themes?: string; provides?: string; grades?: string; os?: string }
export type Entry = {
  id: string; cat: Exclude<Cat, 'all'>; added: string; sub: string; title: string; desc: string; grade: string; url: string; area?: string; source?: string; review?: Review
  file?: { href: string; name: string; format: string }; contents?: string[]
  lecturer?: { headline: string; photo?: string; quote?: string; topics: string[]; career: { org: string; role: string; note?: string; edu?: boolean }[] }
  activity?: { goal: string; people: string; time: string; space: string; props: string; steps: string[]; tips: string[]; variations?: string[]; links?: { t: string; u: string }[] }
}

export type Region = 'north' | 'central' | 'south' | 'east' | 'abroad'
export type Site = { name: string; detail: string; region?: Region; at?: [number, number] }
export type Club = {
  id: string; name: string; tagline: string; school: string; size?: string; ig?: string
  types: string[]; sites: Site[]; highlights: string[]; color: string; partial?: boolean
}

export type Series = '布穀好朋友' | '布可不資道' | '服務故事'
export type Post = {
  id: string; series: Series; ep: string; date: string; title: string; hook: string; sum: string; credit: string
  cover?: string; ig?: string; clubId?: string; resIds: string[]; html: string; closing?: string
}

export type Event = {
  id: string; title: string; ep: string; type: string; date: string; time: string; place: string; audience: string; quota: string; fee: string
  signupUrl: string; deadline: string; sum: string; cover: string; html: string; recap: string
}

const data = raw as unknown as { ENTRIES: Entry[]; CLUBS: Club[]; POSTS: Post[]; EVENTS: Event[]; SETTINGS: { joinFormUrl: string; joinFormEmbed: string; handbookUrl: string } }

export const ENTRIES = data.ENTRIES
export const CLUBS = data.CLUBS
export const POSTS = data.POSTS
export const EVENTS = data.EVENTS
export const SETTINGS = data.SETTINGS

export const REGION_LABEL: Record<Region, string> = { north: '北部', central: '中部', south: '南部', east: '東部', abroad: '海外' }

export const SERIES_INFO: Record<Series, { label: string; color: string; tint: string }> = {
  布穀好朋友: { label: '社團介紹', color: '#A3534A', tint: '#F6D9D3' },
  布可不資道: { label: '教學資源評比', color: '#2F6F5A', tint: '#D4EADF' },
  服務故事: { label: '服務故事與經驗', color: '#5B4A9A', tint: '#E3DCF2' },
}

export const fmtDate = (d: string) => (d ? `${+d.slice(0, 4)} 年 ${+d.slice(5, 7)} 月 ${+d.slice(8, 10)} 日` : '')
// newest first: by 登錄日期, then by the time-stamped file name
export const newestFirst = (a: Entry, b: Entry) => (b.added || '').localeCompare(a.added || '') || b.id.localeCompare(a.id)

// 活動狀態依「今天」自動判斷：報名中（有報名連結、還沒截止）→ 即將舉行 → 已結束
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export function eventStatus(e: Event): 'open' | 'soon' | 'past' {
  const t = today()
  if (e.date < t) return 'past'
  if (e.signupUrl && (!e.deadline || e.deadline >= t)) return 'open'
  return 'soon'
}
export const STATUS_LABEL = { open: '報名中', soon: '即將舉行', past: '已結束' } as const
const WEEK = '日一二三四五六'
export const weekday = (d: string) => WEEK[new Date(d + 'T00:00:00').getDay()]

// 編輯捷徑：開過 /admin 的瀏覽器會記住，網站上就會出現「在後台編輯」按鈕
export const isEditor = () => { try { return localStorage.getItem('bugu-editor') === '1' } catch { return false } }
export const editUrl = (collection: string, id?: string) => `/admin/#/collections/${collection}${id ? '/entries/' + id : ''}`
export const CAT_COLLECTION = { teach: 'teach', sponsor: 'sponsor', lecturer: 'lecturers', activity: 'activities', template: 'templates' } as const
