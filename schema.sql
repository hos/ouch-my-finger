drop table if exists "public"."users";
create table "public"."users" (
  "id" serial primary key,
  "name" text not null
);

drop table if exists "public"."translations";
create table "public"."translations" (
  "id" serial primary key,
  "key" text not null,
  "value" text not null,
  "language" text not null,
  unique ("key", "language")
);

insert into public.users (name) values
  ('Alice'),
  ('Bob'),
  ('Charlie');

insert into public.translations (key, value, language) values
  ('Alice', 'Alice', 'en'),
  ('Alice', 'Alicia', 'es'),
  ('Bob', 'Bob', 'en'),
  ('Bob', 'Roberto', 'es'),
  ('Charlie', 'Charlie', 'en'),
  ('Charlie', 'Carlos', 'es');

