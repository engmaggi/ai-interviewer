-- Orbit · profiles, roles and row-level security
-- Run once in Supabase → SQL Editor.

create type public.developer_level as enum ('junior', 'mid', 'senior');
create type public.user_role as enum ('candidate', 'admin');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  -- Self-reported at registration. This is NOT the assessed level.
  level      public.developer_level not null default 'junior',
  role       public.user_role not null default 'candidate',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Security definer so the policy below can read `profiles` without recursing into RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Admins read all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

-- Intentionally NO insert / update / delete policies:
-- clients can never change a profile (or escalate their own role).
-- Writes happen through the signup trigger below or the server-side service role (admin area).

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_level text := new.raw_user_meta_data ->> 'level';
begin
  insert into public.profiles (id, email, full_name, level)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when requested_level in ('junior', 'mid', 'senior') then requested_level::public.developer_level
      else 'junior'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Make yourself the first admin (after you have registered):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
