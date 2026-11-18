-- 先執行 setup.sql 和 notifications.sql。舊留言會保留，parent_id 為空。
begin;

create table if not exists public.column_comments (
  id bigint generated always as identity primary key,
  post_id text not null,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.column_comments add column if not exists parent_id bigint;
alter table public.column_comments drop constraint if exists column_comments_body_length;
alter table public.column_comments add constraint column_comments_body_length
  check (char_length(btrim(body)) between 1 and 1000 and body ~ '[^[:space:]]') not valid;
create unique index if not exists column_comments_post_and_comment_id_key on public.column_comments (post_id, id);
create index if not exists column_comments_parent_idx on public.column_comments (post_id, parent_id) where parent_id is not null;
alter table public.column_comments drop constraint if exists column_comments_parent_fk;
alter table public.column_comments add constraint column_comments_parent_fk
  foreign key (post_id, parent_id) references public.column_comments (post_id, id)
  on delete set null (parent_id);
alter table public.column_comments drop constraint if exists column_comments_parent_order;
alter table public.column_comments add constraint column_comments_parent_order check (parent_id < id);

alter table public.column_comments enable row level security;
revoke all on public.column_comments from public, anon, authenticated;
grant select, delete on public.column_comments to authenticated;
grant insert (post_id, body, parent_id) on public.column_comments to authenticated;

drop policy if exists "members read comments" on public.column_comments;
create policy "members read comments" on public.column_comments for select to authenticated
  using ((select public.is_member()));
drop policy if exists "members comment" on public.column_comments;
create policy "members comment" on public.column_comments for insert to authenticated
  with check ((select public.is_member()) and author_id = (select auth.uid()));
drop policy if exists "authors delete comments" on public.column_comments;
create policy "authors delete comments" on public.column_comments for delete to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()));

drop function if exists public.column_comment_list(text);
create function public.column_comment_list(p_post text)
returns table (id bigint, body text, created_at timestamptz, author_id uuid, club_id text, club_name text, school text, avatar_url text, mine boolean, parent_id bigint)
language sql stable security definer set search_path = '' as $$
  select c.id, c.body, c.created_at, c.author_id, p.club_id, p.club_name, p.school, p.avatar_url,
    c.author_id = (select auth.uid()), c.parent_id
  from public.column_comments c join public.profiles p on p.id = c.author_id
  where (select public.is_member()) and c.post_id = p_post
  order by c.id;
$$;
revoke execute on function public.column_comment_list(text) from public, anon;
grant execute on function public.column_comment_list(text) to authenticated;

create or replace function public.notify_column_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_id is not null and new.post_id ~ '^post-[a-z0-9-]+$' then
    insert into public.notifications (recipient_id, kind, title, link_path)
    select c.author_id, 'column_reply', '你的專欄留言有新回覆',
      '/column/' || substr(new.post_id, 6) || '#comment-' || new.id
    from public.column_comments c
    join public.profiles p on p.id = c.author_id and p.status = 'approved'
    where c.id = new.parent_id and c.post_id = new.post_id and c.author_id <> new.author_id;
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_column_reply() from public, anon, authenticated;
drop trigger if exists column_comments_notify_reply on public.column_comments;
create trigger column_comments_notify_reply after insert on public.column_comments
  for each row execute function public.notify_column_reply();

commit;
