// 社團身分：頭像在左，右邊上面是學校或單位（小、灰），下面是社團全名（大、黑）。
// 會員專區的歡迎詞、社團名錄、教案作者、教案留言都用這個，樣式在 index.css「社團身分」。
import type { ReactNode } from 'react'
import { CLUBS } from '@/lib/content'

type Who = { club_id: string; club_name: string; school: string; avatar_url: string }
export const clubOf = (p: Pick<Who, 'club_id' | 'club_name'>) => p.club_name || CLUBS.find(c => c.id === p.club_id)?.name || ''
export const schoolOf = (p: Pick<Who, 'club_id' | 'school'>) => p.school || CLUBS.find(c => c.id === p.club_id)?.school || ''
// 社團地圖上同名的社團（名錄卡片連到地圖介紹、頭像沒圖時用地圖顏色）
export const mapClub = (p: Pick<Who, 'club_id' | 'club_name'>) => CLUBS.find(c => c.id === p.club_id) || CLUBS.find(c => c.name === (p.club_name || '').trim())

export default function ClubIdentity({ p, size = 'md', suffix, as: H = 'h3' }: { p: Who; size?: 'sm' | 'md' | 'lg'; suffix?: ReactNode; as?: 'h2' | 'h3' | 'p' }) {
  const name = clubOf(p), school = schoolOf(p), c = mapClub(p)
  return (
    <div className={'club-id ' + size}>
      {p.avatar_url
        ? <img src={p.avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
        : <span className="club-id-initial" aria-hidden="true" style={c ? { background: c.color } : undefined}>{name.slice(0, 1) || '社'}</span>}
      <div>
        {school && <p className="club-id-school">{school}</p>}
        <H className="club-id-name">{name || '會員社團'}{suffix}</H>
      </div>
    </div>
  )
}
