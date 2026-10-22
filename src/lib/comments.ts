// 專欄會員留言：讀寫 Supabase 的 column_comments（資料表與權限在 supabase/comments.sql）。
// 只有已開通的會員社團讀寫得到；留言者的社團身分用 ClubIdentity 顯示。
import { sb } from '@/lib/member'

export type ColumnComment = { id: number; body: string; created_at: string; author_id: string; club_id: string; club_name: string; school: string; avatar_url: string; mine: boolean }
export const COMMENT_MAX = 1000

const c = () => { const x = sb(); if (!x) throw new Error('會員功能只在正式網站開放'); return x }

export async function fetchColumnComments(postId: string): Promise<ColumnComment[]> {
  const { data, error } = await c().rpc('column_comment_list', { p_post: postId })
  if (error) throw error
  return (data || []) as ColumnComment[]
}
export async function addColumnComment(postId: string, body: string) {
  const { error } = await c().from('column_comments').insert({ post_id: postId, body })
  if (error) throw error
}
export async function deleteColumnComment(id: number) {
  const { error } = await c().from('column_comments').delete().eq('id', id)
  if (error) throw error
}
