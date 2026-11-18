import { sb } from '@/lib/member'

export type Notification = { id: number; kind: string; title: string; link_path: string; created_at: string; read_at: string | null }
export const NOTIFICATION_PAGE_SIZE = 20
export const NOTIFICATIONS_READ_EVENT = 'member-notifications-read'

export async function fetchNotifications(before?: number): Promise<Notification[]> {
  let query = sb()!.from('notifications').select('id,kind,title,link_path,created_at,read_at')
    .order('id', { ascending: false }).limit(NOTIFICATION_PAGE_SIZE + 1)
  if (before !== undefined) query = query.lt('id', before)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function unreadNotificationCount(): Promise<number> {
  const { count, error } = await sb()!.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)
  if (error) throw error
  return count ?? 0
}

export async function markNotificationsRead(id?: number): Promise<string> {
  const readAt = new Date().toISOString()
  let query = sb()!.from('notifications').update({ read_at: readAt }).is('read_at', null)
  if (id !== undefined) query = query.eq('id', id)
  const { error } = await query
  if (error) throw error
  window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT))
  return readAt
}

export async function fetchEmailPreference(userId: string): Promise<boolean> {
  const { data, error } = await sb()!.from('notification_preferences').select('email_enabled').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.email_enabled ?? false
}

export async function saveEmailPreference(userId: string, enabled: boolean): Promise<void> {
  const { error } = await sb()!.from('notification_preferences').upsert({ user_id: userId, email_enabled: enabled })
  if (error) throw error
}
