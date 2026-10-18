// 會員教案庫的資料：讀寫 Supabase 的 lessons、lesson_likes、lesson_saves、lesson_comments 與 Storage 的 lesson-files。
// 資料表與權限在 supabase/lessons.sql；只有已開通的會員社團讀寫得到。
import { sb } from '@/lib/member'

export type LessonCard = {
  id: number; title: string; summary: string; body: string; grades: string[]; topics: string[]; duration: string
  link_url: string; file_path: string; file_name: string; published: boolean; created_at: string
  author_id: string; club_id: string; club_name: string; school: string; avatar_url: string
  like_count: number; save_count: number; comment_count: number; liked: boolean; saved: boolean; hot: number; mine: boolean
}
export type LessonComment = { id: number; body: string; created_at: string; author_id: string; club_id: string; club_name: string; school: string; avatar_url: string; mine: boolean }
export type LessonInput = Pick<LessonCard, 'title' | 'summary' | 'body' | 'grades' | 'topics' | 'duration' | 'link_url' | 'file_path' | 'file_name'>

export const GRADES = ['低年級', '中年級', '高年級', '國中', '高中', '不限年段']
export const TOPICS = ['閱讀', '語文', '數學', '科普', 'SEL', '品格', '社會議題', 'SDGs', '資訊素養', '藝術', '體育', '團康', '戶外教育']
export const FILE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip'
export const FILE_MAX = 20 * 1024 * 1024

const c = () => { const x = sb(); if (!x) throw new Error('會員功能只在正式網站開放'); return x }
const fix = (r: LessonCard): LessonCard => ({ ...r, grades: r.grades || [], topics: r.topics || [] })

export async function fetchLessons(): Promise<LessonCard[]> {
  const { data, error } = await c().rpc('lesson_cards')
  if (error) throw error
  return ((data || []) as LessonCard[]).map(fix)
}
export async function fetchLesson(id: number): Promise<LessonCard | null> {
  const { data, error } = await c().rpc('lesson_cards', { p_id: id })
  if (error) throw error
  const r = (data as LessonCard[] | null)?.[0]
  return r ? fix(r) : null
}
export async function fetchComments(id: number): Promise<LessonComment[]> {
  const { data, error } = await c().rpc('lesson_comment_list', { p_lesson: id })
  if (error) throw error
  return (data || []) as LessonComment[]
}

export async function setLiked(id: number, on: boolean) {
  const t = c().from('lesson_likes')
  const { error } = on ? await t.insert({ lesson_id: id }) : await t.delete().eq('lesson_id', id).eq('user_id', await uid())
  if (error && !/duplicate/i.test(error.message)) throw error
}
export async function setSaved(id: number, on: boolean) {
  const t = c().from('lesson_saves')
  const { error } = on ? await t.insert({ lesson_id: id }) : await t.delete().eq('lesson_id', id).eq('user_id', await uid())
  if (error && !/duplicate/i.test(error.message)) throw error
}
export async function addComment(id: number, body: string) {
  const { error } = await c().from('lesson_comments').insert({ lesson_id: id, body })
  if (error) throw error
}
export async function deleteComment(id: number) {
  const { error } = await c().from('lesson_comments').delete().eq('id', id)
  if (error) throw error
}

async function uid() {
  const { data } = await c().auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('請先登入')
  return id
}

/** 上傳檔案到自己的資料夾；檔名只用時間和副檔名（中文檔名存在 file_name，下載時還原） */
export async function uploadLessonFile(file: File): Promise<{ file_path: string; file_name: string }> {
  if (file.size > FILE_MAX) throw new Error('檔案超過 20 MB，請壓縮後再上傳，或改貼雲端連結。')
  const ext = (file.name.match(/\.([a-z0-9]{1,5})$/i)?.[1] || 'bin').toLowerCase()
  const path = `${await uid()}/${Date.now()}.${ext}`
  const { error } = await c().storage.from('lesson-files').upload(path, file, { contentType: file.type || undefined, upsert: false })
  if (error) throw new Error('檔案上傳失敗：' + error.message)
  return { file_path: path, file_name: file.name }
}
export async function removeLessonFile(path: string) {
  if (path) await c().storage.from('lesson-files').remove([path])
}
/** 會員才拿得到的下載連結，1 小時內有效 */
export async function fileUrl(l: Pick<LessonCard, 'file_path' | 'file_name'>): Promise<string> {
  const { data, error } = await c().storage.from('lesson-files').createSignedUrl(l.file_path, 3600, { download: l.file_name || true })
  if (error || !data) throw new Error('拿不到檔案連結，請重新整理再試一次。')
  return data.signedUrl
}

export async function createLesson(v: LessonInput): Promise<number> {
  const { data, error } = await c().from('lessons').insert(v).select('id').single()
  if (error) throw error
  return (data as { id: number }).id
}
export async function updateLesson(id: number, v: LessonInput) {
  const { error } = await c().from('lessons').update(v).eq('id', id)
  if (error) throw error
}
export async function deleteLesson(l: Pick<LessonCard, 'id' | 'file_path'>) {
  const { error } = await c().from('lessons').delete().eq('id', l.id)
  if (error) throw error
  await removeLessonFile(l.file_path).catch(() => {})
}
