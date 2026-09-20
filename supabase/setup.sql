-- First create your admin user in Supabase Authentication > Users.
-- Replace YOUR_ADMIN_EMAIL below with the email used for that account.
-- This script grants access only to that user's immutable ID, not to public signups.
begin;
create table if not exists public.reveal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.reveal_admins enable row level security;
revoke all on public.reveal_admins from anon, authenticated;
insert into public.reveal_admins(user_id)
select id from auth.users where lower(email) = 'YOUR_ADMIN_EMAIL'
on conflict do nothing;
do $$ begin
  if not exists(select 1 from public.reveal_admins) then
    raise exception 'Create the admin user in Authentication > Users before running this script.';
  end if;
end $$;
create or replace function public.is_reveal_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.reveal_admins where user_id = auth.uid()) $$;
revoke all on function public.is_reveal_admin() from public;
grant execute on function public.is_reveal_admin() to authenticated;
create table if not exists public.reveal_settings (
 id integer primary key check (id=1),
 path text not null check (path ~ '^[a-f0-9-]+\.(jpg|png|gif|webp|mp4|webm|mp3|wav|ogg)$'),
 mime text not null check (mime in ('image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','audio/mpeg','audio/wav','audio/ogg'))
);
alter table public.reveal_settings enable row level security;
revoke all on public.reveal_settings from anon, authenticated;
grant select on public.reveal_settings to anon, authenticated;
grant insert, update, delete on public.reveal_settings to authenticated;
drop policy if exists "Anyone can read current reveal" on public.reveal_settings;
create policy "Anyone can read current reveal" on public.reveal_settings for select to anon, authenticated using (true);
drop policy if exists "Admin can change reveal" on public.reveal_settings;
create policy "Admin can change reveal" on public.reveal_settings for all to authenticated using (public.is_reveal_admin()) with check (public.is_reveal_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('reveals','reveals',true,52428800,array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','audio/mpeg','audio/wav','audio/ogg'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Admin manages reveal files" on storage.objects;
create policy "Admin manages reveal files" on storage.objects for all to authenticated
using (bucket_id='reveals' and public.is_reveal_admin())
with check (bucket_id='reveals' and public.is_reveal_admin());
commit;
