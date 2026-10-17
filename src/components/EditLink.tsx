// 「在後台編輯」捷徑：只有開過 /admin 的瀏覽器看得到，訪客不會看到。
import { editUrl, isEditor } from '@/lib/content'

export default function EditLink({ collection, id, label = '在後台編輯', float = false }: { collection: string; id?: string; label?: string; float?: boolean }) {
  if (!isEditor()) return null
  return (
    <a className={'edit-link' + (float ? ' float' : '')} href={editUrl(collection, id)} target="_blank" rel="noopener">
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 2.5l3 3L6 13H3v-3z" /></svg>{label}
    </a>
  )
}
