import { useEffect, useState } from 'react'
import { LOGO_SRC } from './logo'

export type RouteId = '' | 'about' | 'join' | 'resources' | 'map' | 'handbook' | 'events' | 'column' | 'match' | 'lessons' | 'member' | 'privacy' | 'logout'

export const NAV: { group: string; items: { id: RouteId; label: string; desc: string }[] }[] = [
  { group: '認識布穀島', items: [
    { id: '', label: '首頁', desc: '我們為什麼串聯' },
    { id: 'about', label: '關於我們', desc: '誰在做這件事' },
    { id: 'column', label: '專欄', desc: '服務故事與經驗' },
    { id: 'events', label: '活動', desc: '報名與活動紀錄' },
  ] },
  { group: '找資源', items: [
    { id: 'resources', label: '公開資料庫', desc: '贊助、教學資源、講師，人人可查' },
    { id: 'map', label: '社團地圖', desc: '全台社團與介紹' },
    { id: 'handbook', label: '經營手冊', desc: '一屆傳一屆的做法' },
    { id: 'match', label: '需求媒合', desc: '提出需求或提供資源' },
  ] },
  { group: '島鏈會員', items: [
    { id: 'join', label: '加入會員', desc: '成為島鏈的一份子' },
    { id: 'member', label: '會員專區', desc: '登入、公告、社團名錄' },
    { id: 'lessons', label: '會員教案庫', desc: '會員社團分享的教案' },
  ] },
]
export const ALL_ROUTES = NAV.flatMap(g => g.items)
// Two URL styles. The real site (Vite build on Vercel) uses normal paths like /join and /column/friends-1,
// so Google can index every page. The single-file claude.ai preview can't serve paths, so it keeps #join.
declare const __PATH_ROUTES__: boolean
export const PATH_ROUTES = typeof __PATH_ROUTES__ !== 'undefined' && __PATH_ROUTES__

const PAGE_IDS = new Set<string>([...ALL_ROUTES.map(r => r.id), 'privacy', 'logout']) // privacy 隱私權政策（頁尾連結）、logout 登出頁（選單與會員專區的「登出」）
const isRoute = (id: string) => PAGE_IDS.has(id) || /^(post|event|lesson)-[a-z0-9-]+$/.test(id)

/** link to a page id ('', 'join', …), an article ('post-friends-1' → /column/friends-1) or an event ('event-…' → /events/…) */
export const to = (id: string) =>
  !PATH_ROUTES ? (id ? '#' + id : '#')
    : id.startsWith('post-') ? '/column/' + id.slice(5)
    : id.startsWith('event-') ? '/events/' + id.slice(6)
    : id.startsWith('lesson-') ? '/lessons/' + id.slice(7)
    : '/' + id

// a route is a page id, an article id like "post-friends-1" or an event id like "event-20260426-1330"
function fromHash(): string | null {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  return isRoute(h) ? h : null
}
function fromPath(path: string): string | null {
  const p = decodeURIComponent(path).replace(/\/+$/, '').replace(/^\//, '')
  const m = p.match(/^(column|events|lessons)\/([a-z0-9-]+)$/)
  if (m) return ({ column: 'post-', events: 'event-', lessons: 'lesson-' } as Record<string, string>)[m[1]] + m[2]
  return PAGE_IDS.has(p) ? p : null
}
function read(): string {
  if (!PATH_ROUTES) return fromHash() ?? ''
  return fromPath(location.pathname) ?? ''
}

/** 程式裡換頁（例如存檔後到新教案）：路徑模式不重新載入整個網站 */
export function go(id: string) {
  if (!PATH_ROUTES) { location.hash = id; return }
  history.pushState(null, '', to(id))
  dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
}

export function useRoute(): string {
  const [r, setR] = useState<string>(() => {
    // old links shared as …/#join or …/#post-friends-1 keep working: move them to the path version
    if (PATH_ROUTES) { const h = fromHash(); if (h !== null && h !== '') history.replaceState(null, '', to(h)) }
    return read()
  })
  useEffect(() => {
    const go = () => { setR(read()); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }
    if (!PATH_ROUTES) {
      addEventListener('hashchange', go)
      return () => removeEventListener('hashchange', go)
    }
    // path mode: handle clicks on our own page links without reloading the whole site
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target instanceof Element ? e.target.closest('a') : null
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      const id = url.hash && url.pathname === location.pathname ? null : fromPath(url.pathname)
      if (id === null) return
      e.preventDefault()
      if (url.pathname !== location.pathname) history.pushState(null, '', url.pathname)
      go()
    }
    const back = () => setR(read())
    addEventListener('click', click)
    addEventListener('popstate', back)
    return () => { removeEventListener('click', click); removeEventListener('popstate', back) }
  }, [])
  return r
}

export function Logo({ className, label }: { className?: string; label?: string }) {
  return <img className={'logo ' + (className || '')} src={LOGO_SRC} alt={label || ''} width={320} height={320} decoding="async" />
}
