-- 布穀島社 會員教案庫：教案、按讚、收藏、留言、檔案
-- 用法：先執行過 setup.sql，再到 Supabase → SQL Editor 貼上這整份 → Run。重複執行不會出錯，也不會刪資料
--       （會跳出 destructive 提醒，是因為有 drop … if exists／revoke，只會重建規則）。
-- 只有已開通的會員社團（public.is_member()）看得到、能分享、按讚、收藏、留言；自己分享的教案和留言可以自己刪。
-- 管理者在 Supabase 後台（Table Editor）可以直接隱藏（published 取消勾選）或刪除任何教案和留言。

-- ---------- 教案 ----------
create table if not exists public.lessons (
  id bigint generated always as identity primary key,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  summary text not null default '' check (char_length(summary) <= 300),   -- 一段簡介
  body text not null default '' check (char_length(body) <= 8000),       -- 流程、準備物等內文
  grades text[] not null default '{}',                                    -- 適用對象，例如 {中年級,高年級}
  topics text[] not null default '{}',                                    -- 類別，例如 {閱讀,SEL}
  duration text not null default '' check (char_length(duration) <= 40), -- 例如「90 分鐘」「三天兩夜」
  link_url text not null default '' check (char_length(link_url) <= 500), -- Google 文件、簡報等連結
  file_path text not null default '',                                     -- 上傳的檔案（Storage：lesson-files）
  file_name text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lessons_created_idx on public.lessons (created_at desc);
alter table public.lessons enable row level security;
revoke all on public.lessons from anon, authenticated;
grant select, delete on public.lessons to authenticated;
grant insert (title, summary, body, grades, topics, duration, link_url, file_path, file_name) on public.lessons to authenticated;
grant update (title, summary, body, grades, topics, duration, link_url, file_path, file_name, published) on public.lessons to authenticated;
drop trigger if exists lessons_touch on public.lessons;
create trigger lessons_touch before update on public.lessons for each row execute function public.touch_updated_at();

drop policy if exists "members read lessons" on public.lessons;
create policy "members read lessons" on public.lessons for select to authenticated
  using ((select public.is_member()) and (published or author_id = (select auth.uid())));
drop policy if exists "members add lessons" on public.lessons;
create policy "members add lessons" on public.lessons for insert to authenticated
  with check ((select public.is_member()) and author_id = (select auth.uid()));
drop policy if exists "authors edit lessons" on public.lessons;
create policy "authors edit lessons" on public.lessons for update to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "authors delete lessons" on public.lessons;
create policy "authors delete lessons" on public.lessons for delete to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()));

-- ---------- 按讚、收藏 ----------
create table if not exists public.lesson_likes (
  lesson_id bigint not null references public.lessons (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);
create table if not exists public.lesson_saves (
  lesson_id bigint not null references public.lessons (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);
alter table public.lesson_likes enable row level security;
alter table public.lesson_saves enable row level security;
revoke all on public.lesson_likes, public.lesson_saves from anon, authenticated;
grant select, delete on public.lesson_likes, public.lesson_saves to authenticated;
grant insert (lesson_id) on public.lesson_likes, public.lesson_saves to authenticated;

drop policy if exists "members read likes" on public.lesson_likes;
create policy "members read likes" on public.lesson_likes for select to authenticated using ((select public.is_member()));
drop policy if exists "members like" on public.lesson_likes;
create policy "members like" on public.lesson_likes for insert to authenticated with check ((select public.is_member()) and user_id = (select auth.uid()));
drop policy if exists "members unlike" on public.lesson_likes;
create policy "members unlike" on public.lesson_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "read own saves" on public.lesson_saves;
create policy "read own saves" on public.lesson_saves for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "members save" on public.lesson_saves;
create policy "members save" on public.lesson_saves for insert to authenticated with check ((select public.is_member()) and user_id = (select auth.uid()));
drop policy if exists "members unsave" on public.lesson_saves;
create policy "members unsave" on public.lesson_saves for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- 留言 ----------
create table if not exists public.lesson_comments (
  id bigint generated always as identity primary key,
  lesson_id bigint not null references public.lessons (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists lesson_comments_lesson_idx on public.lesson_comments (lesson_id, created_at);
alter table public.lesson_comments enable row level security;
revoke all on public.lesson_comments from anon, authenticated;
grant select, delete on public.lesson_comments to authenticated;
grant insert (lesson_id, body) on public.lesson_comments to authenticated;
drop policy if exists "members read comments" on public.lesson_comments;
create policy "members read comments" on public.lesson_comments for select to authenticated using ((select public.is_member()));
drop policy if exists "members comment" on public.lesson_comments;
create policy "members comment" on public.lesson_comments for insert to authenticated with check ((select public.is_member()) and author_id = (select auth.uid()));
drop policy if exists "authors delete comments" on public.lesson_comments;
create policy "authors delete comments" on public.lesson_comments for delete to authenticated using (author_id = (select auth.uid()));

-- ---------- 給網站用的查詢 ----------
-- 教案卡片：作者社團、按讚／留言／收藏數、我有沒有按讚收藏、熱度（近 30 天：讚 1 分、收藏 2 分、留言 2 分）
drop function if exists public.lesson_cards(bigint);
create function public.lesson_cards(p_id bigint default null)
returns table (
  id bigint, title text, summary text, body text, grades text[], topics text[], duration text, link_url text, file_path text, file_name text,
  published boolean, created_at timestamptz, author_id uuid, club_id text, club_name text, school text, avatar_url text,
  like_count int, save_count int, comment_count int, liked boolean, saved boolean, hot int, mine boolean
)
language sql stable security definer set search_path = '' as $$
  select l.id, l.title, l.summary,
    case when p_id is null then '' else l.body end,
    l.grades, l.topics, l.duration, l.link_url, l.file_path, l.file_name, l.published, l.created_at,
    l.author_id, p.club_id, p.club_name, p.school, p.avatar_url,
    (select count(*) from public.lesson_likes x where x.lesson_id = l.id)::int,
    (select count(*) from public.lesson_saves x where x.lesson_id = l.id)::int,
    (select count(*) from public.lesson_comments x where x.lesson_id = l.id)::int,
    exists (select 1 from public.lesson_likes x where x.lesson_id = l.id and x.user_id = (select auth.uid())),
    exists (select 1 from public.lesson_saves x where x.lesson_id = l.id and x.user_id = (select auth.uid())),
    ((select count(*) from public.lesson_likes x where x.lesson_id = l.id and x.created_at > now() - interval '30 days')
      + 2 * (select count(*) from public.lesson_saves x where x.lesson_id = l.id and x.created_at > now() - interval '30 days')
      + 2 * (select count(*) from public.lesson_comments x where x.lesson_id = l.id and x.created_at > now() - interval '30 days'))::int,
    l.author_id = (select auth.uid())
  from public.lessons l join public.profiles p on p.id = l.author_id
  where public.is_member() and (l.published or l.author_id = (select auth.uid())) and (p_id is null or l.id = p_id)
  order by l.created_at desc;
$$;
revoke execute on function public.lesson_cards(bigint) from public, anon;
grant execute on function public.lesson_cards(bigint) to authenticated;

-- 一篇教案的留言，附留言社團的頭像、學校、社團名稱
drop function if exists public.lesson_comment_list(bigint);
create function public.lesson_comment_list(p_lesson bigint)
returns table (id bigint, body text, created_at timestamptz, author_id uuid, club_id text, club_name text, school text, avatar_url text, mine boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.body, c.created_at, c.author_id, p.club_id, p.club_name, p.school, p.avatar_url, c.author_id = (select auth.uid())
  from public.lesson_comments c join public.profiles p on p.id = c.author_id
  where public.is_member() and c.lesson_id = p_lesson
  order by c.created_at;
$$;
revoke execute on function public.lesson_comment_list(bigint) from public, anon;
grant execute on function public.lesson_comment_list(bigint) to authenticated;

-- ---------- 教案檔案（Storage） ----------
-- 私人儲存桶：只有會員下載得到（網站產生 1 小時有效的下載連結），每個檔案最大 20 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-files', 'lesson-files', false, 20971520, array[
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'application/zip'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members read lesson files" on storage.objects;
create policy "members read lesson files" on storage.objects for select to authenticated
  using (bucket_id = 'lesson-files' and (select public.is_member()));
drop policy if exists "members upload lesson files" on storage.objects;
create policy "members upload lesson files" on storage.objects for insert to authenticated
  with check (bucket_id = 'lesson-files' and (select public.is_member()) and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "owners delete lesson files" on storage.objects;
create policy "owners delete lesson files" on storage.objects for delete to authenticated
  using (bucket_id = 'lesson-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
