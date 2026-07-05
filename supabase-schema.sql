-- Run this entire file in Supabase SQL Editor
-- Go to supabase.com > your project > SQL Editor > New Query > paste > Run

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'client' check (role in ('client', 'coach')),
  created_at timestamp with time zone default now()
);

-- Workouts (a single session)
create table if not exists workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  notes text default '',
  created_at timestamp with time zone default now()
);

-- Workout sets (exercises within a session)
create table if not exists workout_sets (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references workouts(id) on delete cascade not null,
  exercise_name text not null,
  sets integer default 0,
  reps integer default 0,
  weight numeric default 0,
  unit text default 'lbs',
  notes text default '',
  created_at timestamp with time zone default now()
);

-- Programs (imported from Google Docs)
create table if not exists programs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text default '',
  created_at timestamp with time zone default now()
);

-- Program days (individual calendar days in a program)
create table if not exists program_days (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references programs(id) on delete cascade not null,
  date date not null,
  content text default '',
  created_at timestamp with time zone default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table programs enable row level security;
alter table program_days enable row level security;

-- Profiles: users see their own; coaches see all
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Coaches can view all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'coach'
    )
  );

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Workouts: users manage their own; coaches read all
create policy "Users manage own workouts" on workouts
  for all using (auth.uid() = user_id);

create policy "Coaches can view all workouts" on workouts
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'coach'
    )
  );

-- Workout sets: via workout ownership
create policy "Users manage own workout sets" on workout_sets
  for all using (
    exists (
      select 1 from workouts where id = workout_sets.workout_id and user_id = auth.uid()
    )
  );

create policy "Coaches can view all workout sets" on workout_sets
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'coach'
    )
  );

-- Programs: users manage their own
create policy "Users manage own programs" on programs
  for all using (auth.uid() = user_id);

create policy "Coaches can view all programs" on programs
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'coach'
    )
  );

-- Program days: via program ownership
create policy "Users manage own program days" on program_days
  for all using (
    exists (
      select 1 from programs where id = program_days.program_id and user_id = auth.uid()
    )
  );

create policy "Coaches can view all program days" on program_days
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'coach'
    )
  );
