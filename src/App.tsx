import { useEffect, useState } from 'react'
import { useRoute } from '@/lib/site'
import { Footer, SiteHeader } from '@/components/Chrome'
import Home from '@/pages/Home'
import Join from '@/pages/Join'
import { ClubMap, Column, Events, Handbook, Match } from '@/pages/Sections'
import Resources from '@/pages/Resources'
import Article from '@/pages/Article'
import { POSTS } from '@/lib/content'

const TITLES: Record<string, string> = { '': '布穀島社', join: '加入會員', resources: '資料庫', map: '社團地圖', handbook: '經營手冊', events: '活動', column: '專欄', match: '需求媒合' }

export default function App() {
  const route = useRoute()
  const [tone, setTone] = useState<'light' | 'dark'>('light')

  useEffect(() => { const post = POSTS.find(p => p.id === route); document.title = post ? `${post.title}｜布穀島社` : route ? `${TITLES[route] || '專欄'}｜布穀島社` : '布穀島社' }, [route])
  useEffect(() => {
    // fine paper grain, one device pixel per speck; used as a background layer (--grain), never on top of content
    const dpr = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1))), size = 256
    const n = document.createElement('canvas'); n.width = n.height = size * dpr; const g = n.getContext('2d')!
    let s = 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
    for (let i = 0; i < 4200 * dpr * dpr; i++) { g.fillStyle = `rgba(35,31,53,${.05 + r() * .09})`; g.fillRect(Math.floor(r() * size * dpr), Math.floor(r() * size * dpr), 1, 1) }
    document.documentElement.style.setProperty('--grain', `url(${n.toDataURL()})`)
  }, [])

  return (
    <>
      <SiteHeader route={route} tone={tone} />
      {route === '' && <Home key="home" onTone={setTone} />}
      {route === 'join' && <Join />}
      {route === 'resources' && <Resources />}
      {route === 'map' && <ClubMap />}
      {route === 'handbook' && <Handbook />}
      {route === 'events' && <Events />}
      {route === 'column' && <Column />}
      {route === 'match' && <Match />}
      {route.startsWith('post-') && <Article key={route} id={route} />}
      <Footer />
    </>
  )
}
