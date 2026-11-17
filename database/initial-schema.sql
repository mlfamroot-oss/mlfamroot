-- LEGACY PostgreSQL draft only. ROOTS now targets Firebase / Cloud Firestore.
-- Do not apply this SQL to the Firebase project. See the Firestore data model in README.md.

create extension if not exists pgcrypto;

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table family_memberships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','admin','contributor','viewer')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  invited_by uuid,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  created_by uuid,
  full_name text not null,
  tamil_name text,
  nickname text,
  gender text check (gender in ('male','female','other','unknown')),
  birth_date date,
  birth_year_approx integer,
  life_status text not null default 'unknown' check (life_status in ('living','deceased','unknown')),
  native_place text,
  current_location text,
  profile_photo_object_key text,
  profile_visibility text not null default 'family' check (profile_visibility in ('family','branch','private')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  related_person_id uuid not null references people(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'biological_parent','adoptive_parent','step_parent','spouse',
    'sibling','half_sibling','former_spouse','unknown'
  )),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  start_date date,
  end_date date,
  created_by uuid,
  approved_by uuid,
  created_at timestamptz not null default now(),
  check (person_id <> related_person_id)
);

create table family_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  person_id uuid references people(id) on delete set null,
  event_type text not null,
  title text not null,
  event_date date,
  approximate_year integer,
  description text,
  created_by uuid,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  invited_contact text not null,
  contact_type text not null check (contact_type in ('email','phone')),
  token_hash text not null,
  status text not null default 'sent' check (status in ('sent','verified','approved','rejected','expired')),
  expires_at timestamptz not null,
  invited_by uuid not null,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index people_family_name_idx on people(family_id, full_name);
create index people_family_tamil_name_idx on people(family_id, tamil_name);
create index relationships_person_idx on relationships(person_id);
create index relationships_related_person_idx on relationships(related_person_id);
create index events_family_date_idx on family_events(family_id, event_date);
