// 專欄用的元件：文章縮圖（沒有封面時自動畫一張系列色的封面）、文章卡片、分享按鈕。
// 樣式在 src/pages/column.css。
import { useEffect, useState } from 'react'
import { SERIES_INFO } from '@/lib/content'
import type { Post } from '@/lib/content'
import { postTags, readMinutes, shortDate } from '@/lib/column'
import { to } from '@/lib/site'
import '@/pages/column.css'

/** 有封面用封面；沒有就用系列色、集數和幾個色塊排成一張封面，每篇位置略有不同。 */
export function PostThumb({ p, big }: { p: Post; big?: boolean }) {
  const info = SERIES_INFO[p.series]
  if (p.cover) return <img className="pt-img" src={p.cover} alt="" loading={big ? 'eager' : 'lazy'} />
  const h = [...p.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7)
  return (
    <div className="pt-art" style={{ background: info.tint, color: info.color }} aria-hidden="true">
      <span className="pt-dot" style={{ background: info.color, left: `${55 + (h % 30)}%`, top: `${-20 + (h % 25)}%` }} />
      <span className="pt-dot sm" style={{ background: 'var(--lime)', left: `${8 + (h % 20)}%`, top: `${60 + (h % 15)}%` }} />
      <span className="pt-series">{p.series}</span>
      <span className="pt-ep">{p.ep || info.label}</span>
    </div>
  )
}

export function PostMeta({ p }: { p: Post }) {
  return (
    <p className="pc-meta">
      {p.date && <time dateTime={p.date}>{shortDate(p.date)}</time>}
      <span>閱讀約 {readMinutes(p)} 分鐘</span>
    </p>
  )
}

export function PostTags({ p, max = 2 }: { p: Post; max?: number }) {
  const info = SERIES_INFO[p.series]
  return (
    <div className="pc-tags">
      <span className="cat-badge" style={{ background: info.color }}>{p.series}</span>
      {postTags(p, max).map(t => <span key={t} className="sub-tag">{t}</span>)}
    </div>
  )
}

/** 文章卡片。feature＝總覽最上面的大卡；row＝側欄的小列表。 */
export function PostCard({ p, variant = 'card' }: { p: Post; variant?: 'card' | 'feature' | 'row' }) {
  if (variant === 'row') {
    return (
      <a className="pc-row" href={to(p.id)}>
        <div className="pc-row-thumb"><PostThumb p={p} /></div>
        <div className="pc-row-text">
          <span className="pc-row-series" style={{ color: SERIES_INFO[p.series].color }}>{p.series} {p.ep}</span>
          <b>{p.title}</b>
        </div>
      </a>
    )
  }
  return (
    <a className={'pc ' + variant} href={to(p.id)}>
      <div className="pc-thumb"><PostThumb p={p} big={variant === 'feature'} /></div>
      <div className="pc-body">
        <PostTags p={p} max={variant === 'feature' ? 3 : 2} />
        {variant === 'feature' ? <h2>{p.title}</h2> : <h3>{p.title}</h3>}
        <p className="pc-sum">{p.sum || p.hook}</p>
        <PostMeta p={p} />
      </div>
    </a>
  )
}

const Icon = {
  line: <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s6-3.5 8.2-6.1C21.6 14.1 22 12.6 22 11c0-4.4-4.5-8-10-8Zm-3.6 10.4H6.5c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.3h1.4c.3 0 .5.2.5.5s-.2.5-.5.5Zm2-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.8Zm4.6 0c0 .2-.1.4-.3.5h-.2c-.2 0-.3-.1-.4-.2l-2-2.7v2.4c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.2.1-.4.3-.5h.2c.2 0 .3.1.4.2l2 2.7V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.8Zm3.1-2.4c.3 0 .5.2.5.5s-.2.5-.5.5h-1.4v.9h1.4c.3 0 .5.2.5.5s-.2.5-.5.5h-1.9c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5h1.9c.3 0 .5.2.5.5s-.2.5-.5.5h-1.4v.9h1.4Z" /></svg>,
  fb: <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z" /></svg>,
  link: <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  share: <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>,
}

/** 分享：手機上有系統分享就用系統分享；另外提供 LINE、Facebook、複製連結。 */
export function ShareBar({ title, compact }: { title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')
  const [canShare, setCanShare] = useState(false)
  useEffect(() => { setUrl(window.location.href); setCanShare(typeof navigator.share === 'function') }, [])
  const u = encodeURIComponent(url)
  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch {
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className={'share' + (compact ? ' compact' : '')} role="group" aria-label="分享這篇文章">
      {canShare && <button type="button" className="share-btn" onClick={() => navigator.share({ title, url }).catch(() => {})}>{Icon.share}<span>分享</span></button>}
      <a className="share-btn" href={`https://social-plugins.line.me/lineit/share?url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="分享到 LINE">{Icon.line}<span>LINE</span></a>
      <a className="share-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" aria-label="分享到 Facebook">{Icon.fb}<span>Facebook</span></a>
      <button type="button" className="share-btn" onClick={copy}>{Icon.link}<span aria-live="polite">{copied ? '已複製' : '複製連結'}</span></button>
    </div>
  )
}
