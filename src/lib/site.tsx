import { useEffect, useState } from 'react'
import { LOGO_SRC } from './logo'

export type RouteId = '' | 'about' | 'join' | 'resources' | 'map' | 'handbook' | 'events' | 'column' | 'match'

export const NAV: { group: string; items: { id: RouteId; label: string; desc: string }[] }[] = [
  { group: '認識布穀島', items: [
    { id: '', label: '首頁', desc: '我們為什麼串聯' },
    { id: 'about', label: '關於我們', desc: '誰在做這件事' },
    { id: 'column', label: '專欄', desc: '服務故事與經驗' },
    { id: 'events', label: '活動', desc: '報名與活動紀錄' },
  ] },
  { group: '找資源', items: [
    { id: 'resources', label: '資料庫', desc: '贊助、教學資源、講師' },
    { id: 'map', label: '社團地圖', desc: '全台社團與介紹' },
    { id: 'handbook', label: '經營手冊', desc: '一屆傳一屆的做法' },
    { id: 'match', label: '需求媒合', desc: '提出需求或提供資源' },
  ] },
  { group: '一起來', items: [
    { id: 'join', label: '加入會員', desc: '成為島鏈的一份子' },
  ] },
]
export const ALL_ROUTES = NAV.flatMap(g => g.items)
export const href = (id: RouteId) => (id ? '#' + id : '#')

// a route is a page id, or an article id like "post-friends-1" (plain #anchors survive in shared artifact links)
function read(): string {
  const h = location.hash.replace(/^#\/?/, '')
  if (/^post-[a-z0-9-]+$/.test(h)) return h
  return ALL_ROUTES.some(r => r.id === h) ? h : ''
}

export function useRoute(): string {
  const [r, setR] = useState<string>(read)
  useEffect(() => {
    const f = () => { setR(read()); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return r
}

export function Logo({ className, label }: { className?: string; label?: string }) {
  return <img className={'logo ' + (className || '')} src={LOGO_SRC} alt={label || ''} width={320} height={320} decoding="async" />
}
