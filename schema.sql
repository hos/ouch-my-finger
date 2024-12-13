drop table if exists public.users;

create table public.users (
  id int generated always as identity primary key,
  value1 text,
  value2 text
);

insert into public.users (value1, value2) values ('value1', 'value2');

grant insert on public.users to public;
grant update on public.users to public;

alter table public.users enable row level security;

create policy select_policy on public.users for select using (true);
create policy insert_policy on public.users for insert with check (true);
create policy update_policy on public.users for update using (true);
create policy delete_policy on public.users for delete using (true);
