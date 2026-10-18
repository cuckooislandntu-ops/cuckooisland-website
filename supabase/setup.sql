-- 布穀島社 會員功能：資料表與權限
-- 用法：Supabase 後台 → SQL Editor → New query → 整份貼上 → Run。重複執行不會出錯，也不會刪掉資料
--       （會跳出 destructive 提醒，是因為有 drop … if exists／revoke，只會重建規則）。
--       第一次設定還要到 Authentication → Auth Hooks → Add hook →「Before User Created」→ Postgres →
--       schema public、function hook_allowlist_signup → Create。
--
-- 資料表
--   allowed_emails  核可名單：只有名單上的 Google 帳號能登入。加一列＝核可；刪掉＝收回（已登入過的會被停用）
--   profiles        每個登入過的帳號一筆，以社團為單位：社團、服務性質、聯絡方式。
--                   status：approved 已開通／suspended 停用（pending 只會在沒開 hook 時出現，網站一律當作沒核可）
--   handbook_files  經營手冊每一章底下的檔案（只有已通過的會員讀得到）
--   member_posts    會員專區的公告
--   member_settings 會員才看得到的設定，例如手冊資料夾網址（key = handbook_folder_url）
--
-- 管理者在 Supabase 後台（Table Editor）直接改資料；後台登入的人不受下面的權限限制。

-- ---------- 個人檔案 ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  name text not null default '',
  club_id text not null default '',          -- 社團地圖上的社團（網站自動帶入）
  club_name text not null default '',        -- 不在社團地圖上的社團，自己填
  school text not null default '',
  club_role text not null default '',        -- 社團職位
  service_types text[] not null default '{}', -- 服務性質，例如 {營隊,課輔}
  contacts jsonb not null default '[]',      -- 聯絡方式，可以多個：[{"method":"ig","value":"@club"}, …]（contact_method/value 存第一個）
  contact_method text not null default '' check (contact_method in ('', 'line', 'ig', 'email', 'phone', 'fb', 'other')),
  contact_value text not null default '',
  bio text not null default '',
  show_in_directory boolean not null default true,
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.profiles add column if not exists service_types text[] not null default '{}';
alter table public.profiles add column if not exists contacts jsonb not null default '[]';

-- 會員自己只能改這些欄位；status、email 只有管理者能改
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, club_id, club_name, school, club_role, service_types, contacts, contact_method, contact_value, bio, show_in_directory) on public.profiles to authenticated;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- 現在登入的人是不是已通過的會員
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'approved');
$$;
revoke execute on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- 社團名錄：已開通、願意公開、填了社團的帳號；不含 Email。只有已開通的會員呼叫得到結果。
drop function if exists public.member_directory();
create function public.member_directory()
returns table (id uuid, club_id text, club_name text, school text, service_types text[], contacts jsonb, contact_method text, contact_value text, avatar_url text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.club_id, p.club_name, p.school, p.service_types, p.contacts, p.contact_method, p.contact_value, p.avatar_url
  from public.profiles p
  where public.is_member() and p.status = 'approved' and p.show_in_directory and (p.club_id <> '' or p.club_name <> '')
  order by p.club_name, p.club_id;
$$;
revoke execute on function public.member_directory() from public, anon;
grant execute on function public.member_directory() to authenticated;

-- ---------- 經營手冊檔案 ----------
create table if not exists public.handbook_files (
  id bigint generated always as identity primary key,
  chapter int not null,                      -- 第幾章（網站書櫃上顯示的章節編號：1、2、3…）
  title text not null,                       -- 檔案名稱
  url text not null,                         -- Google 文件網址
  date date,                                 -- 新增或大改的日期（30 天內會標「新」）
  scenes text[] not null default '{}',       -- 情境標籤，例如 {第一次寫補助計畫,營隊前一週}
  sort int not null default 0,               -- 同一章裡的排序，數字小的在前
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.handbook_files enable row level security;
revoke all on public.handbook_files from anon, authenticated;
grant select on public.handbook_files to authenticated;
drop policy if exists "members read handbook" on public.handbook_files;
create policy "members read handbook" on public.handbook_files for select to authenticated using (published and (select public.is_member()));

-- ---------- 會員專區公告 ----------
create table if not exists public.member_posts (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null default '',             -- 內文，換行會照樣顯示
  link_url text not null default '',         -- 選填：附上的連結（表單、檔案…）
  link_label text not null default '',       -- 選填：連結按鈕上的字，例如「下載簡報」
  pinned boolean not null default false,     -- 置頂
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.member_posts enable row level security;
revoke all on public.member_posts from anon, authenticated;
grant select on public.member_posts to authenticated;
drop policy if exists "members read posts" on public.member_posts;
create policy "members read posts" on public.member_posts for select to authenticated using (published and (select public.is_member()));

-- ---------- 會員設定 ----------
create table if not exists public.member_settings (
  key text primary key,
  value text not null default '',
  note text not null default ''
);
alter table public.member_settings enable row level security;
revoke all on public.member_settings from anon, authenticated;
grant select on public.member_settings to authenticated;
drop policy if exists "members read settings" on public.member_settings;
create policy "members read settings" on public.member_settings for select to authenticated using ((select public.is_member()));
insert into public.member_settings (key, value, note)
values ('handbook_folder_url', '', '經營手冊頁「打開手冊」按鈕連到的 Google 雲端資料夾')
on conflict (key) do nothing;

-- ---------- 保持清醒 ----------
-- 免費版專案一週沒人用會暫停；網站每天會自動呼叫一次這個函式（vercel.json 的 crons → api/keepalive.js）。
create or replace function public.ping() returns text language sql stable set search_path = '' as $$ select 'ok'::text $$;
grant execute on function public.ping() to anon, authenticated;

-- ---------- 核可名單 ----------
create table if not exists public.allowed_emails (
  email text primary key,
  note text not null default '',               -- 備註，例如「台大陽光椰子 社長」
  created_at timestamptz not null default now()
);
alter table public.allowed_emails enable row level security;
revoke all on public.allowed_emails from anon, authenticated;

-- Email 一律存成小寫、去掉空白，避免大小寫打錯對不上
create or replace function public.normalize_allowed_email() returns trigger
language plpgsql set search_path = '' as $$
begin new.email = lower(trim(new.email)); return new; end $$;
drop trigger if exists allowed_emails_normalize on public.allowed_emails;
create trigger allowed_emails_normalize before insert or update on public.allowed_emails for each row execute function public.normalize_allowed_email();

-- 名單變動時，同步已登入過的人的狀態
create or replace function public.sync_allowed_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update public.profiles set status = 'approved' where lower(email) = new.email and status <> 'approved';
  end if;
  if tg_op in ('DELETE', 'UPDATE') then
    if tg_op = 'DELETE' or old.email <> new.email then
      update public.profiles set status = 'suspended' where lower(email) = old.email;
    end if;
  end if;
  return null;
end $$;
drop trigger if exists allowed_emails_sync on public.allowed_emails;
create trigger allowed_emails_sync after insert or update or delete on public.allowed_emails for each row execute function public.sync_allowed_email();

-- 第一次登入時自動建立檔案：在名單上就直接開通
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name, avatar_url, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''),
    case when exists (select 1 from public.allowed_emails a where a.email = lower(coalesce(new.email, ''))) then 'approved' else 'pending' end
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Before User Created hook：不在名單上的帳號，Supabase 不會建立帳號，網站會顯示「這個帳號還沒有被核可」
create or replace function public.hook_allowlist_signup(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := lower(trim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if e <> '' and exists (select 1 from public.allowed_emails where email = e) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'not_allowlisted'));
end $$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_allowlist_signup(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_allowlist_signup(jsonb) from authenticated, anon, public;
