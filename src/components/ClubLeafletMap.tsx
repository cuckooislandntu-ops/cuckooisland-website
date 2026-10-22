// 社團地圖：OpenStreetMap 底圖（Leaflet）。據點位置在後台「社團 → 服務據點 → 地圖位置」設定。
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Club, Region } from '@/lib/content'

const TAIWAN: L.LatLngBoundsExpression = [[21.85, 119.9], [25.35, 122.05]]
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

type Props = { clubs: Club[]; region: Region | null; pick: string | null; onPick: (id: string) => void }

export default function ClubLeafletMap({ clubs, region, pick, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const pickRef = useRef(onPick); pickRef.current = onPick

  // create the map once
  useEffect(() => {
    if (!box.current) return
    const m = L.map(box.current, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: true, maxBounds: [[10, 105], [35, 135]] })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, minZoom: 6,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(m)
    m.attributionControl.setPrefix(false)
    m.fitBounds(TAIWAN)
    // scroll-to-zoom only after the map is clicked, so the page still scrolls normally
    m.on('click', () => m.scrollWheelZoom.enable())
    m.on('mouseout', () => m.scrollWheelZoom.disable())
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  // markers follow the filters
  useEffect(() => {
    const m = map.current, g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const pts: L.LatLng[] = []
    let open: L.Marker | null = null
    for (const c of clubs) for (const s of c.sites) {
      if (!s.at) continue
      const inRegion = !region || s.region === region
      const lit = !pick || pick === c.id
      const ll = L.latLng(s.at[1], s.at[0])
      const icon = L.divIcon({
        className: 'osm-pin' + (pick === c.id ? ' lit' : '') + (inRegion && lit ? '' : ' dim'),
        html: `<span style="--c:${c.color}"></span>`,
        iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12],
      })
      const pop = document.createElement('div')
      pop.className = 'osm-pop'
      pop.innerHTML = `<b>${esc(c.name)}</b><span>${esc(s.name)}</span>${s.detail ? `<p>${esc(s.detail)}</p>` : ''}<button type="button">看社團介紹</button>`
      pop.querySelector('button')!.addEventListener('click', () => pickRef.current(c.id))
      const mk = L.marker(ll, { icon, title: `${c.name}：${s.name}`, keyboard: true, riseOnHover: true, zIndexOffset: pick === c.id ? 500 : 0 }).bindPopup(pop, { maxWidth: 260 }).addTo(g)
      if (inRegion && lit) pts.push(ll)
      if (pick === c.id && !open) open = mk
    }
    if (pts.length) m.flyToBounds(L.latLngBounds(pts).pad(pts.length > 1 ? 0.35 : 0), { maxZoom: pick ? 11 : 9, duration: 0.6 })
    else if (!region) m.fitBounds(TAIWAN)
    if (open) setTimeout(() => (open as L.Marker).openPopup(), 650)
  }, [clubs, region, pick])

  const noPins = region === 'abroad' || (region && !clubs.some(c => c.sites.some(s => s.at && s.region === region)))
  return (
    <div className="osm-wrap">
      <div ref={box} className="osm-map" role="region" aria-label="社團服務據點地圖（OpenStreetMap）" />
      {noPins && <p className="osm-note">{region === 'abroad' ? '海外據點沒有標在地圖上，請看社團清單。' : '這個地區目前還沒有標在地圖上的據點。'}</p>}
    </div>
  )
}
