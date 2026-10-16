import { useEffect, useRef, useState } from 'react'
import { useRoute } from '@/lib/site'
import { Footer, SiteHeader } from '@/components/Chrome'
import Home from '@/pages/Home'
import Join from '@/pages/Join'
import { ClubMap, Column, Events, Handbook, Match } from '@/pages/Sections'
import Resources from '@/pages/Resources'
import Article from '@/pages/Article'
import { POSTS } from '@/lib/posts'

const TITLES: Record<string, string> = { '': '布穀島社', join: '加入會員', resources: '資料庫', map: '社團地圖', handbook: '經營手冊', events: '活動', column: '專欄', match: '需求媒合' }

export default function App() {
  const route = useRoute()
  const [tone, setTone] = useState<'light' | 'dark'>('light')
  const grain = useRef<HTMLDivElement>(null)

  useEffect(() => { const post = POSTS.find(p => p.id === route); document.title = post ? `${post.title}｜布穀島社` : route ? `${TITLES[route] || '專欄'}｜布穀島社` : '布穀島社' }, [route])
  useEffect(() => {
    // riso grain, generated once
    const n = document.createElement('canvas'); n.width = n.height = 180; const g = n.getContext('2d')!
    let s = 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(35,31,53,${.05 + r() * .11})`; g.fillRect(r() * 180, r() * 180, 1.2, 1.2) }
    if (grain.current) grain.current.style.backgroundImage = `url(${n.toDataURL()})`
  }, [])

  return (
    <>
      <div className="grain" ref={grain} aria-hidden="true" />
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
