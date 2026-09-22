-- Run once in an empty Neon database using the role in DATABASE_URL.
-- The browser never connects to this database. Only the Next.js server does.
begin;
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email)) and char_length(email) <= 254),
  password_hash text not null,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);
create table public.sessions (
  token_hash text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null
);
create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_expiry_idx on public.sessions(expires_at);
create table public.login_attempts (
  email text primary key,
  attempts integer not null default 1,
  window_started timestamptz not null default now()
);
create function public.session_user_id(p_session text) returns uuid
language sql stable set search_path = '' as $$
  select user_id from public.sessions where token_hash=p_session and expires_at>now();
$$;
create function public.is_admin(p_session text) returns boolean
language sql stable set search_path = '' as $$
  select exists(select 1 from public.users where id=public.session_user_id(p_session) and role='admin');
$$;
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text not null check (char_length(description) between 1 and 2000),
  category text not null check (category in ('Notebooks','Writing','Desk essentials','Art supplies')),
  price integer not null check (price between 1 and 1000000),
  stock integer not null default 0 check (stock between 0 and 1000000),
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  customer_name text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  total bigint not null default 0 check (total >= 0),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, request_id)
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  price integer not null check (price > 0),
  quantity integer not null check (quantity between 1 and 999),
  unique(order_id, product_id)
);
create index orders_user_id_idx on public.orders(user_id);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

create function public.place_order(p_session text,p_items jsonb,p_name text,p_request_id uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := public.session_user_id(p_session);
  v_order uuid;
  v_email text;
  v_item record;
  v_product public.products%rowtype;
  v_total bigint := 0;
begin
  if v_user is null then raise exception 'Sign in before checking out.'; end if;
  if p_request_id is null then raise exception 'Missing checkout reference.'; end if;
  -- A retry with the same reference must not create another order or reduce stock twice.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text || p_request_id::text, 0));
  select id into v_order from public.orders where user_id=v_user and request_id=p_request_id;
  if found then return v_order; end if;
  if p_name is null or char_length(trim(p_name)) not between 2 and 100 then raise exception 'Enter your full name.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Your bag is invalid.'; end if;
  if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Your bag must contain 1–100 products.'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) i
    where jsonb_typeof(i) <> 'object' or i->>'id' is null or i->>'quantity' is null
    or jsonb_typeof(i->'quantity') <> 'number' or (i->>'quantity') !~ '^[0-9]+$'
    or (i->>'quantity')::numeric not between 1 and 999) then raise exception 'Invalid product quantity.'; end if;
  if (select count(*) from jsonb_array_elements(p_items)) <> (select count(distinct (i->>'id')::uuid) from jsonb_array_elements(p_items) i) then raise exception 'Duplicate products in bag.'; end if;
  select email into v_email from public.users where id=v_user;
  insert into public.orders(user_id,customer_name,email,request_id) values(v_user,trim(p_name),v_email,p_request_id) returning id into v_order;
  -- Lock products in stable ID order to prevent overselling and avoid deadlocks.
  for v_item in select (i->>'id')::uuid as id,(i->>'quantity')::integer as quantity from jsonb_array_elements(p_items) i order by (i->>'id')::uuid loop
    select * into v_product from public.products where id=v_item.id for update;
    if not found or not v_product.active then raise exception 'A product is no longer available. Update your bag.'; end if;
    if v_product.stock < v_item.quantity then raise exception 'Not enough stock for %. Only % available.',v_product.name,v_product.stock; end if;
    update public.products set stock=stock-v_item.quantity where id=v_product.id;
    insert into public.order_items(order_id,product_id,product_name,price,quantity)
      values(v_order,v_product.id,v_product.name,v_product.price,v_item.quantity);
    v_total := v_total + v_product.price::bigint*v_item.quantity;
  end loop;
  update public.orders set total=v_total where id=v_order;
  return v_order;
end;
$$;

create function public.set_order_status(p_session text,p_order_id uuid,p_status text) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_order public.orders%rowtype; v_item record;
begin
  if not public.is_admin(p_session) then raise exception 'Admin access required.'; end if;
  if p_status is null or p_status not in ('completed','cancelled') then raise exception 'Invalid order status.'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.status=p_status then return; end if;
  if v_order.status <> 'pending' then raise exception 'Only pending orders can be completed or cancelled.'; end if;
  if p_status='cancelled' then
    for v_item in select product_id,quantity from public.order_items where order_id=p_order_id order by product_id loop
      update public.products set stock=stock+v_item.quantity where id=v_item.product_id;
    end loop;
  end if;
  update public.orders set status=p_status where id=p_order_id;
end;
$$;

-- Scope customer order reads in the database as well as on the server.
create function public.visible_orders(p_session text) returns setof public.orders
language sql stable set search_path = '' as $$
  select * from public.orders where user_id=public.session_user_id(p_session) or public.is_admin(p_session);
$$;
-- Only the database owner used by the server may execute these functions.
revoke all on public.users,public.sessions,public.login_attempts,public.products,public.orders,public.order_items from public;
revoke all on function public.session_user_id(text),public.is_admin(text),public.visible_orders(text),public.place_order(text,jsonb,text,uuid),public.set_order_status(text,uuid,text) from public;
commit;
