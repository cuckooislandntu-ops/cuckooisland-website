-- 先執行 setup.sql。通知收件匣與寄送偏好可供其他會員功能共用。
begin;

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  link_path text not null check (link_path ~ '^/[a-z0-9/-]*(#[a-z0-9-]+)?$' and left(link_path, 2) <> '//'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_inbox_idx on public.notifications (recipient_id, id desc);
create index if not exists notifications_unread_idx on public.notifications (recipient_id) where read_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated
  using ((select public.is_member()) and recipient_id = (select auth.uid()));
drop policy if exists "mark own notifications" on public.notifications;
create policy "mark own notifications" on public.notifications for update to authenticated
  using ((select public.is_member()) and recipient_id = (select auth.uid()));

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_enabled boolean not null default false
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from public, anon, authenticated;
grant select on public.notification_preferences to authenticated;
grant insert (user_id, email_enabled), update (user_id, email_enabled) on public.notification_preferences to authenticated;
drop policy if exists "manage own notification preferences" on public.notification_preferences;
create policy "manage own notification preferences" on public.notification_preferences for all to authenticated
  using ((select public.is_member()) and user_id = (select auth.uid()))
  with check ((select public.is_member()) and user_id = (select auth.uid()));

create table if not exists public.notification_email_queue (
  notification_id bigint primary key references public.notifications (id) on delete cascade,
  attempts int not null default 0,
  first_attempt_at timestamptz,
  available_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists notification_email_pending_idx
  on public.notification_email_queue (available_at, notification_id) where sent_at is null and attempts < 3;
alter table public.notification_email_queue enable row level security;
revoke all on public.notification_email_queue from public, anon, authenticated;

create or replace function public.enqueue_notification_email() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  enabled boolean;
begin
  -- 和偏好更新互斥，避免關閉郵件時漏掉同時寫入的待寄信。
  select p.email_enabled into enabled from public.notification_preferences p
    where p.user_id = new.recipient_id for share;
  if enabled then
    insert into public.notification_email_queue (notification_id) values (new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.enqueue_notification_email() from public, anon, authenticated;
drop trigger if exists notifications_enqueue_email on public.notifications;
create trigger notifications_enqueue_email after insert on public.notifications
  for each row execute function public.enqueue_notification_email();

create or replace function public.cancel_disabled_notification_emails() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not new.email_enabled then
    delete from public.notification_email_queue q using public.notifications n
      where q.notification_id = n.id and n.recipient_id = new.user_id and q.sent_at is null;
  end if;
  return new;
end;
$$;
revoke execute on function public.cancel_disabled_notification_emails() from public, anon, authenticated;
drop trigger if exists notification_preferences_cancel_email on public.notification_preferences;
create trigger notification_preferences_cancel_email after update of email_enabled on public.notification_preferences
  for each row execute function public.cancel_disabled_notification_emails();

-- 只有寄信工作可取得已驗證的登入 Email。領取後暫時鎖住工作，讓失敗的寄送能重試。
create or replace function public.claim_notification_emails()
returns table (notification_id bigint, attempt int, email text, title text, link_path text)
language sql security definer set search_path = '' as $$
  with pending as (
    select q.notification_id, u.email, n.title, n.link_path
    from public.notification_email_queue q
    join public.notifications n on n.id = q.notification_id
    join public.notification_preferences p on p.user_id = n.recipient_id and p.email_enabled
    join public.profiles m on m.id = n.recipient_id and m.status = 'approved'
    join auth.users u on u.id = n.recipient_id and u.email_confirmed_at is not null and u.email <> ''
    where q.sent_at is null and q.attempts < 3 and q.available_at <= now()
      and (q.first_attempt_at is null or q.first_attempt_at > now() - interval '20 hours')
    order by q.available_at, q.notification_id
    limit 10
    for update of q skip locked
  )
  update public.notification_email_queue q
  set attempts = q.attempts + 1, first_attempt_at = coalesce(q.first_attempt_at, now()),
    available_at = now() + interval '5 minutes'
  from pending p
  where q.notification_id = p.notification_id
  returning q.notification_id, q.attempts, p.email::text, p.title, p.link_path;
$$;
revoke execute on function public.claim_notification_emails() from public, anon, authenticated;
grant execute on function public.claim_notification_emails() to service_role;

create or replace function public.finish_notification_email(p_id bigint, p_attempt int) returns void
language sql security definer set search_path = '' as $$
  update public.notification_email_queue
  set sent_at = now()
  where notification_id = p_id and attempts = p_attempt and sent_at is null;
$$;
revoke execute on function public.finish_notification_email(bigint, int) from public, anon, authenticated;
grant execute on function public.finish_notification_email(bigint, int) to service_role;

commit;
