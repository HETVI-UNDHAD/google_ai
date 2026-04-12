-- Run this in Supabase SQL Editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  phone text default '',
  role text check (role in ('Admin','NGO','Volunteer')) default 'Volunteer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text check (category in ('Food','Health','Education','Shelter')) not null,
  city text not null,
  area text not null,
  urgency int check (urgency between 1 and 3) not null,
  people_affected int not null,
  priority_score int default 0,
  image_url text,
  status text check (status in ('Pending','In Progress','Resolved')) default 'Pending',
  latitude float,
  longitude float,
  submitted_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) not null,
  skills text[] not null,
  availability boolean default true,
  available_slots text[] default '{}',
  city text not null,
  area text default '',
  latitude float,
  longitude float,
  current_latitude float,
  current_longitude float,
  last_location_update timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) not null,
  volunteer_id uuid references volunteers(id) not null,
  status text check (status in ('Assigned','Accepted','Rejected','Completed')) default 'Assigned',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid references volunteers(id) not null,
  request_id uuid references requests(id) not null,
  message text not null,
  distance_km float,
  read boolean default false,
  created_at timestamptz default now(),
  unique(volunteer_id, request_id)
);
