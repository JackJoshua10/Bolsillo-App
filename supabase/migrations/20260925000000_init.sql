-- Bolsillo · migración inicial
-- Modelo descrito en docs/03-modelo-de-datos.md
-- Dinero: bigint en céntimos. Todo dato financiero pertenece a un "espacio".

-- ─────────────────────────────────────────────────────────────
-- Tipos
-- ─────────────────────────────────────────────────────────────
create type public.currency as enum ('PEN', 'USD');
create type public.space_kind as enum ('personal', 'shared');
create type public.space_role as enum ('owner', 'editor', 'viewer');
create type public.account_type as enum ('cash', 'wallet', 'bank', 'credit_card', 'savings');
create type public.category_kind as enum ('expense', 'income');
create type public.transaction_type as enum ('expense', 'income', 'transfer', 'adjustment');
create type public.payment_method as enum ('yape', 'plin', 'debit_card', 'credit_card', 'bank_transfer', 'cash');
create type public.transaction_source as enum ('app', 'shortcut', 'import', 'recurring');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Perfiles y espacios
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text,
  avatar_url       text,
  base_currency    public.currency not null default 'PEN',
  theme            text not null default 'system' check (theme in ('system', 'light', 'dark')),
  month_start_day  smallint not null default 1 check (month_start_day between 1 and 28),
  default_space_id uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.spaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  kind       public.space_kind not null default 'shared',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un solo espacio personal por usuario
create unique index spaces_one_personal_per_user on public.spaces (created_by) where kind = 'personal';

alter table public.profiles
  add constraint profiles_default_space_fk
  foreign key (default_space_id) references public.spaces (id) on delete set null;

create table public.space_members (
  space_id   uuid not null references public.spaces (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.space_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create index space_members_user_idx on public.space_members (user_id);

create table public.space_invitations (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  email       text not null check (email = lower(email)),
  role        public.space_role not null default 'editor' check (role <> 'owner'),
  token_hash  text not null unique,
  invited_by  uuid not null references public.profiles (id) on delete cascade,
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Cuentas y categorías
-- ─────────────────────────────────────────────────────────────
create table public.accounts (
  id                    uuid primary key default gen_random_uuid(),
  space_id              uuid not null references public.spaces (id) on delete cascade,
  name                  text not null check (char_length(name) between 1 and 60),
  type                  public.account_type not null,
  currency              public.currency not null default 'PEN',
  institution           text,
  opening_balance_cents bigint not null default 0,
  credit_limit_cents    bigint check (credit_limit_cents > 0),
  statement_day         smallint check (statement_day between 1 and 31),
  due_day               smallint check (due_day between 1 and 31),
  card_group_id         uuid,
  color                 text,
  icon                  text,
  sort_order            integer not null default 0,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Los datos de tarjeta solo aplican a tarjetas
  constraint accounts_card_fields check (
    type = 'credit_card'
    or (credit_limit_cents is null and statement_day is null and due_day is null and card_group_id is null)
  )
);

create index accounts_space_idx on public.accounts (space_id);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  kind        public.category_kind not null,
  name        text not null check (char_length(name) between 1 and 40),
  icon        text,
  color       text,
  parent_id   uuid references public.categories (id) on delete set null,
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index categories_unique_name
  on public.categories (space_id, kind, lower(name))
  where archived_at is null;

-- ─────────────────────────────────────────────────────────────
-- Movimientos
-- ─────────────────────────────────────────────────────────────
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  space_id        uuid not null references public.spaces (id) on delete cascade,
  type            public.transaction_type not null,
  account_id      uuid not null references public.accounts (id) on delete restrict,
  -- Positivo siempre (el signo lo da `type`), salvo en ajustes que pueden ser negativos
  amount_cents    bigint not null,
  currency        public.currency not null,
  to_account_id   uuid references public.accounts (id) on delete restrict,
  to_amount_cents bigint,
  exchange_rate   numeric(12, 6) check (exchange_rate > 0),
  category_id     uuid references public.categories (id) on delete restrict,
  payment_method  public.payment_method,
  description     text check (char_length(description) <= 140),
  notes           text,
  occurred_on     date not null default ((now() at time zone 'America/Lima')::date),
  created_by      uuid references public.profiles (id) on delete set null,
  source          public.transaction_source not null default 'app',
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint transactions_amount check (
    (type = 'adjustment' and amount_cents <> 0) or (type <> 'adjustment' and amount_cents > 0)
  ),
  constraint transactions_transfer_fields check (
    case when type = 'transfer' then
      to_account_id is not null and to_account_id <> account_id
      and to_amount_cents > 0 and category_id is null
    else
      to_account_id is null and to_amount_cents is null and exchange_rate is null
    end
  ),
  constraint transactions_category_required check (
    type not in ('expense', 'income') or category_id is not null
  )
);

create index transactions_space_date_idx on public.transactions (space_id, occurred_on desc) where deleted_at is null;
create index transactions_account_idx on public.transactions (account_id, occurred_on);
create index transactions_to_account_idx on public.transactions (to_account_id) where to_account_id is not null;
create index transactions_category_idx on public.transactions (category_id);

-- ─────────────────────────────────────────────────────────────
-- Tipo de cambio y tokens de API
-- ─────────────────────────────────────────────────────────────
create table public.exchange_rates (
  date       date not null,
  base       public.currency not null,
  quote      public.currency not null,
  rate_buy   numeric(12, 6) not null check (rate_buy > 0),
  rate_sell  numeric(12, 6) not null check (rate_sell > 0),
  source     text not null default 'sunat' check (source in ('sunat', 'manual')),
  created_at timestamptz not null default now(),
  primary key (date, base, quote),
  check (base <> quote)
);

create table public.api_tokens (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 60),
  token_prefix       text not null, -- primeros caracteres, para reconocerlo en la UI
  token_hash         text not null unique,
  default_space_id   uuid references public.spaces (id) on delete set null,
  default_account_id uuid references public.accounts (id) on delete set null,
  last_used_at       timestamptz,
  revoked_at         timestamptz,
  created_at         timestamptz not null default now()
);

create index api_tokens_user_idx on public.api_tokens (user_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at
-- ─────────────────────────────────────────────────────────────
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger spaces_updated_at before update on public.spaces for each row execute function public.set_updated_at();
create trigger accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Funciones de permisos
-- ─────────────────────────────────────────────────────────────

-- ¿El usuario actual es miembro del espacio con al menos `min_role`?
-- security definer: evita recursión de RLS al consultar space_members.
create function public.is_space_member(p_space_id uuid, p_min_role public.space_role default 'viewer')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members m
    where m.space_id = p_space_id
      and m.user_id = (select auth.uid())
      and case p_min_role
            when 'viewer' then true
            when 'editor' then m.role in ('editor', 'owner')
            when 'owner'  then m.role = 'owner'
          end
  );
$$;

-- ¿El usuario actual comparte algún espacio con `p_user_id`? (para ver nombres de miembros)
create function public.shares_space_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members mine
    join public.space_members theirs on theirs.space_id = mine.space_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user_id
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Categorías por defecto
-- ─────────────────────────────────────────────────────────────
create function public.seed_default_categories(p_space_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (space_id, kind, name, icon, color, sort_order)
  values
    (p_space_id, 'expense', 'Comida',          'utensils',        'amber',   1),
    (p_space_id, 'expense', 'Supermercado',    'shopping-cart',   'lime',    2),
    (p_space_id, 'expense', 'Transporte',      'bus',             'sky',     3),
    (p_space_id, 'expense', 'Vivienda',        'house',           'stone',   4),
    (p_space_id, 'expense', 'Servicios',       'plug',            'teal',    5),
    (p_space_id, 'expense', 'Salud',           'heart-pulse',     'rose',    6),
    (p_space_id, 'expense', 'Entretenimiento', 'popcorn',         'violet',  7),
    (p_space_id, 'expense', 'Suscripciones',   'repeat',          'indigo',  8),
    (p_space_id, 'expense', 'Ropa',            'shirt',           'pink',    9),
    (p_space_id, 'expense', 'Educación',       'graduation-cap',  'cyan',   10),
    (p_space_id, 'expense', 'Regalos',         'gift',            'orange', 11),
    (p_space_id, 'expense', 'Otros',           'ellipsis',        'neutral',12),
    (p_space_id, 'income',  'Sueldo',          'briefcase',       'lime',    1),
    (p_space_id, 'income',  'Freelance',       'laptop',          'teal',    2),
    (p_space_id, 'income',  'Reembolso',       'undo-2',          'sky',     3),
    (p_space_id, 'income',  'Otros',           'ellipsis',        'neutral', 4);
$$;

-- Al crear un espacio: el creador queda como owner y se cargan categorías base
create function public.handle_new_space()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.space_members (space_id, user_id, role)
  values (new.id, new.created_by, 'owner');

  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

create trigger spaces_after_insert
  after insert on public.spaces
  for each row execute function public.handle_new_space();

-- Al registrarse: perfil + espacio Personal
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_space_id uuid;
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.spaces (name, kind, created_by)
  values ('Personal', 'personal', new.id)
  returning id into v_space_id;

  update public.profiles set default_space_id = v_space_id where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Validación de movimientos
-- Corre con los permisos del usuario: si no ve la cuenta (RLS), falla.
-- ─────────────────────────────────────────────────────────────
create function public.validate_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_account    public.accounts%rowtype;
  v_to_account public.accounts%rowtype;
  v_cat_kind   public.category_kind;
  v_cat_space  uuid;
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, (select auth.uid()));
  else
    new.created_by := old.created_by; -- inmutable
  end if;

  select * into v_account from public.accounts where id = new.account_id;
  if not found or v_account.space_id <> new.space_id then
    raise exception 'La cuenta no pertenece a este espacio' using errcode = '23514';
  end if;
  new.currency := v_account.currency;

  if new.type = 'transfer' then
    select * into v_to_account from public.accounts where id = new.to_account_id;
    if not found or v_to_account.space_id <> new.space_id then
      raise exception 'La cuenta destino no pertenece a este espacio' using errcode = '23514';
    end if;

    if v_to_account.currency = v_account.currency then
      new.to_amount_cents := coalesce(new.to_amount_cents, new.amount_cents);
      if new.to_amount_cents <> new.amount_cents then
        raise exception 'En una transferencia en la misma moneda los montos deben coincidir' using errcode = '23514';
      end if;
      new.exchange_rate := null;
    elsif new.to_amount_cents is null then
      raise exception 'Falta el monto recibido en la transferencia entre monedas' using errcode = '23514';
    end if;
  end if;

  if new.category_id is not null then
    select kind, space_id into v_cat_kind, v_cat_space from public.categories where id = new.category_id;
    if not found or v_cat_space <> new.space_id then
      raise exception 'La categoría no pertenece a este espacio' using errcode = '23514';
    end if;
    if v_cat_kind::text <> new.type::text then
      raise exception 'La categoría no corresponde al tipo de movimiento' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger transactions_validate
  before insert or update on public.transactions
  for each row execute function public.validate_transaction();

-- ─────────────────────────────────────────────────────────────
-- Saldos (respeta RLS del usuario que consulta)
-- ─────────────────────────────────────────────────────────────
create view public.account_balances
with (security_invoker = true)
as
select
  a.id       as account_id,
  a.space_id,
  a.currency,
  a.opening_balance_cents + coalesce(sum(
    case
      when t.account_id = a.id and t.type = 'income'     then t.amount_cents
      when t.account_id = a.id and t.type = 'expense'    then -t.amount_cents
      when t.account_id = a.id and t.type = 'adjustment' then t.amount_cents
      when t.account_id = a.id and t.type = 'transfer'   then -t.amount_cents
      when t.to_account_id = a.id                        then t.to_amount_cents
    end
  ), 0)::bigint as balance_cents
from public.accounts a
left join public.transactions t
  on (t.account_id = a.id or t.to_account_id = a.id)
  and t.deleted_at is null
group by a.id;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.spaces            enable row level security;
alter table public.space_members     enable row level security;
alter table public.space_invitations enable row level security;
alter table public.accounts          enable row level security;
alter table public.categories        enable row level security;
alter table public.transactions      enable row level security;
alter table public.exchange_rates    enable row level security;
alter table public.api_tokens        enable row level security;

-- profiles
create policy "profiles: ver el propio o de quien comparte espacio" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_space_with(id));
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- spaces
-- `created_by` es necesario para `insert ... returning`: Postgres valida la lectura
-- antes de que el trigger agregue al creador como miembro.
create policy "spaces: ver si soy miembro o creador" on public.spaces
  for select to authenticated
  using (created_by = (select auth.uid()) or public.is_space_member(id));
create policy "spaces: crear compartidos" on public.spaces
  for insert to authenticated
  with check (created_by = (select auth.uid()) and kind = 'shared');
create policy "spaces: owner edita" on public.spaces
  for update to authenticated
  using (public.is_space_member(id, 'owner')) with check (public.is_space_member(id, 'owner'));
create policy "spaces: owner borra compartidos" on public.spaces
  for delete to authenticated
  using (kind = 'shared' and public.is_space_member(id, 'owner'));

-- space_members
create policy "members: ver miembros de mis espacios" on public.space_members
  for select to authenticated
  using (public.is_space_member(space_id));
-- El owner cambia roles de otros (editor/viewer). Transferir la propiedad será una función aparte.
create policy "members: owner cambia roles de otros" on public.space_members
  for update to authenticated
  using (public.is_space_member(space_id, 'owner') and user_id <> (select auth.uid()))
  with check (public.is_space_member(space_id, 'owner') and user_id <> (select auth.uid()) and role <> 'owner');
create policy "members: owner quita o yo salgo" on public.space_members
  for delete to authenticated
  using (
    (public.is_space_member(space_id, 'owner') and user_id <> (select auth.uid()))
    or (user_id = (select auth.uid()) and role <> 'owner')
  );
-- Los miembros entran por invitación (función accept_invitation, fase 2), no con insert directo.

-- space_invitations
create policy "invitations: owner gestiona" on public.space_invitations
  for all to authenticated
  using (public.is_space_member(space_id, 'owner'))
  with check (public.is_space_member(space_id, 'owner') and invited_by = (select auth.uid()));

-- accounts / categories / transactions: ver = miembro; escribir = editor
create policy "accounts: ver" on public.accounts
  for select to authenticated using (public.is_space_member(space_id));
create policy "accounts: crear" on public.accounts
  for insert to authenticated with check (public.is_space_member(space_id, 'editor'));
create policy "accounts: editar" on public.accounts
  for update to authenticated
  using (public.is_space_member(space_id, 'editor')) with check (public.is_space_member(space_id, 'editor'));
create policy "accounts: borrar" on public.accounts
  for delete to authenticated using (public.is_space_member(space_id, 'editor'));

create policy "categories: ver" on public.categories
  for select to authenticated using (public.is_space_member(space_id));
create policy "categories: crear" on public.categories
  for insert to authenticated with check (public.is_space_member(space_id, 'editor'));
create policy "categories: editar" on public.categories
  for update to authenticated
  using (public.is_space_member(space_id, 'editor')) with check (public.is_space_member(space_id, 'editor'));
create policy "categories: borrar" on public.categories
  for delete to authenticated using (public.is_space_member(space_id, 'editor'));

create policy "transactions: ver" on public.transactions
  for select to authenticated using (public.is_space_member(space_id));
create policy "transactions: crear" on public.transactions
  for insert to authenticated with check (public.is_space_member(space_id, 'editor'));
create policy "transactions: editar" on public.transactions
  for update to authenticated
  using (public.is_space_member(space_id, 'editor')) with check (public.is_space_member(space_id, 'editor'));
create policy "transactions: borrar" on public.transactions
  for delete to authenticated using (public.is_space_member(space_id, 'editor'));

-- exchange_rates: lectura para todos los usuarios; escritura solo desde el servidor (service_role)
create policy "exchange_rates: ver" on public.exchange_rates
  for select to authenticated using (true);

-- api_tokens: cada uno los suyos
create policy "api_tokens: propios" on public.api_tokens
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- Permisos explícitos (no depender de los defaults del proyecto)
-- ─────────────────────────────────────────────────────────────
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.account_balances to authenticated;
revoke execute on function public.seed_default_categories(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_space() from public, anon, authenticated;
