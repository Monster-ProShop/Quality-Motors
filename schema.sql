-- Quality Motors. Instalar una sola vez en un proyecto Supabase nuevo.
-- No borra ni transforma tablas o registros de la aplicación anterior.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table public.workshops (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 2 and 120),
 created_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 created_at timestamptz not null default now()
);
create table public.workshop_members (
 workshop_id uuid not null references public.workshops(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','worker')),
 primary key(workshop_id,user_id)
);
create index on public.workshop_members(user_id);
create table public.clients (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null references public.workshops(id),
 name text not null check (length(trim(name)) between 2 and 150),
 email text not null default '' check (length(email) <= 254),
 phone text not null default '' check (length(phone) <= 30),
 unique(workshop_id,id)
);
create table public.client_accounts (
 workshop_id uuid not null,
 client_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key(workshop_id,client_id,user_id),
 foreign key(workshop_id,client_id) references public.clients(workshop_id,id)
);
create index on public.client_accounts(user_id);
create table public.vehicles (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null,
 client_id uuid not null,
 make text not null check(length(trim(make)) between 1 and 80),
 model text not null check(length(trim(model)) between 1 and 80),
 year integer not null check(year between 1900 and 2100),
 vin text not null default '' check(length(vin) <= 17),
 plates text not null check(length(trim(plates)) between 1 and 20),
 foreign key(workshop_id,client_id) references public.clients(workshop_id,id),
 unique(workshop_id,client_id,id)
);
create index on public.vehicles(workshop_id,client_id);
create table public.inventory (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null references public.workshops(id),
 sku text not null check(length(trim(sku)) between 1 and 80),
 name text not null check(length(trim(name)) between 1 and 150),
 stock integer not null default 0 check(stock >= 0),
 price numeric(12,2) not null check(price >= 0 and price < 100000000),
 unique(workshop_id,id), unique(workshop_id,sku)
);
create table public.orders (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null references public.workshops(id),
 client_id uuid not null,
 vehicle_id uuid not null,
 folio bigint generated always as identity unique,
 title text not null check(length(trim(title)) between 2 and 150),
 notes text not null default '' check(length(notes) <= 4000),
 status text not null default 'borrador' check(status in ('borrador','pendiente','aprobada','rechazada','en_proceso','lista','entregada','cancelada')),
 tax_rate numeric(5,4) not null default 0.16 check(tax_rate between 0 and 1),
 created_at timestamptz not null default now(),
 foreign key(workshop_id,client_id,vehicle_id) references public.vehicles(workshop_id,client_id,id),
 unique(workshop_id,id)
);
create index on public.orders(workshop_id,created_at desc);
create index on public.orders(workshop_id,client_id,vehicle_id);
create table public.service_items (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null,
 order_id uuid not null,
 kind text not null check(kind in ('mano_obra','stock','por_pedir')),
 product_id uuid,
 description text not null check(length(trim(description)) between 1 and 200),
 quantity integer not null check(quantity between 1 and 10000),
 unit_price numeric(12,2) not null check(unit_price >= 0 and unit_price < 100000000),
 amount numeric(16,2) generated always as (quantity * unit_price) stored,
 supplier text check(length(supplier) <= 200),
 tracking text check(length(tracking) <= 200),
 foreign key(workshop_id,order_id) references public.orders(workshop_id,id),
 foreign key(workshop_id,product_id) references public.inventory(workshop_id,id),
 check ((kind = 'stock') = (product_id is not null)),
 check (kind <> 'por_pedir' or (supplier is not null and length(trim(supplier)) > 0))
);
create index on public.service_items(workshop_id,order_id);
create index on public.service_items(workshop_id,product_id);
create table public.service_photos (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null,
 order_id uuid not null,
 path text not null unique,
 caption text not null default '' check(length(caption) <= 250),
 created_at timestamptz not null default now(),
 foreign key(workshop_id,order_id) references public.orders(workshop_id,id)
);
create index on public.service_photos(workshop_id,order_id);
create table public.invitations (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null references public.workshops(id),
 email text not null check(length(email) between 3 and 254),
 role text not null check(role in ('admin','worker','client')),
 client_id uuid,
 token_hash text not null unique,
 expires_at timestamptz not null default now() + interval '7 days',
 used_at timestamptz,
 created_by uuid not null references auth.users(id),
 foreign key(workshop_id,client_id) references public.clients(workshop_id,id),
 check((role = 'client') = (client_id is not null))
);
create index on public.invitations(workshop_id,client_id);
create table private.order_links (
 order_id uuid primary key references public.orders(id),
 token_hash text not null unique,
 expires_at timestamptz not null,
 revoked boolean not null default false
);
create table public.order_events (
 id bigint generated always as identity primary key,
 workshop_id uuid not null,
 order_id uuid not null,
 actor_id uuid references auth.users(id),
 event text not null,
 created_at timestamptz not null default now(),
 foreign key(workshop_id,order_id) references public.orders(workshop_id,id)
);
create index on public.order_events(workshop_id,order_id);
create table public.stock_movements (
 id bigint generated always as identity primary key,
 workshop_id uuid not null,
 product_id uuid not null,
 order_id uuid,
 delta integer not null check(delta <> 0),
 reason text not null,
 actor_id uuid references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(workshop_id,product_id) references public.inventory(workshop_id,id),
 foreign key(workshop_id,order_id) references public.orders(workshop_id,id)
);
create index on public.stock_movements(workshop_id,product_id);
create index on public.stock_movements(workshop_id,order_id);

-- Las funciones privilegiadas viven fuera del esquema expuesto y fijan search_path.
create function private.member(w uuid, admin_only boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.workshop_members m
 where m.workshop_id=w and m.user_id=auth.uid() and (not admin_only or m.role='admin'));
$$;
create function private.client_access(w uuid, c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.client_accounts a
 where a.workshop_id=w and a.client_id=c and a.user_id=auth.uid());
$$;
create function private.order_access(o uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.orders x where x.id=o and
 (private.member(x.workshop_id) or (x.status <> 'borrador' and private.client_access(x.workshop_id,x.client_id))));
$$;
create function private.hash_token(t text) returns text
language sql immutable set search_path = '' as $$ select encode(sha256(convert_to(t,'UTF8')),'hex'); $$;
create function private.link_order(t text) returns uuid
language sql stable security definer set search_path = '' as $$
 select order_id from private.order_links where length(t)=64 and token_hash=private.hash_token(t)
 and not revoked and expires_at>now();
$$;
create function private.photo_access(p text) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.service_photos f where f.path=p and
 (private.order_access(f.order_id) or f.order_id=private.link_order(
 coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-order-token',''))));
$$;
create function private.photo_write(p text) returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.orders o
 where o.workshop_id::text=split_part(p,'/',1) and o.id::text=split_part(p,'/',2)
 and private.member(o.workshop_id));
$$;

alter table public.workshops enable row level security;
alter table public.profiles enable row level security;
alter table public.workshop_members enable row level security;
alter table public.clients enable row level security;
alter table public.client_accounts enable row level security;
alter table public.vehicles enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.service_items enable row level security;
alter table public.service_photos enable row level security;
alter table public.invitations enable row level security;
alter table public.order_events enable row level security;
alter table public.stock_movements enable row level security;
alter table private.order_links enable row level security;
create policy talleres_lectura on public.workshops for select to authenticated using(private.member(id));
create policy perfil_propio on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy miembros_lectura on public.workshop_members for select to authenticated using(user_id=(select auth.uid()) or private.member(workshop_id,true));
create policy clientes_lectura on public.clients for select to authenticated using(private.member(workshop_id) or private.client_access(workshop_id,id));
create policy vinculos_lectura on public.client_accounts for select to authenticated using(user_id=(select auth.uid()) or private.member(workshop_id,true));
create policy vehiculos_lectura on public.vehicles for select to authenticated using(private.member(workshop_id) or private.client_access(workshop_id,client_id));
create policy inventario_lectura on public.inventory for select to authenticated using(private.member(workshop_id));
create policy ordenes_lectura on public.orders for select to authenticated using(private.order_access(id));
create policy conceptos_lectura on public.service_items for select to authenticated using(private.order_access(order_id));
create policy fotos_lectura on public.service_photos for select to authenticated using(private.order_access(order_id));
create policy invitaciones_lectura on public.invitations for select to authenticated using(private.member(workshop_id,true));
create policy eventos_lectura on public.order_events for select to authenticated using(private.order_access(order_id));
create policy movimientos_lectura on public.stock_movements for select to authenticated using(private.member(workshop_id));
-- No hay escritura directa: todas las mutaciones validan pertenencia y estado.
revoke all on public.workshops, public.profiles, public.workshop_members, public.clients, public.client_accounts,
 public.vehicles, public.inventory, public.orders, public.service_items, public.service_photos,
 public.invitations, public.order_events, public.stock_movements from anon, authenticated;
grant select on public.workshops, public.profiles, public.workshop_members, public.clients, public.client_accounts,
 public.vehicles, public.inventory, public.orders, public.service_items, public.service_photos,
 public.order_events, public.stock_movements to authenticated;
grant select(id,workshop_id,email,role,client_id,expires_at,used_at,created_by) on public.invitations to authenticated;

create view public.order_totals with (security_invoker=true) as
 select o.*, c.name as client_name, concat(v.make,' ',v.model,' · ',v.plates) as vehicle_label,
 coalesce(s.subtotal,0)::numeric(16,2) as subtotal,
 round(coalesce(s.subtotal,0)*o.tax_rate,2) as tax,
 coalesce(s.subtotal,0)+round(coalesce(s.subtotal,0)*o.tax_rate,2) as total
 from public.orders o join public.clients c on c.id=o.client_id
 join public.vehicles v on v.id=o.vehicle_id
 left join lateral (select sum(i.amount) subtotal from public.service_items i where i.order_id=o.id) s on true;
grant select on public.order_totals to authenticated;

create function private.order_json(o uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
 'order',to_jsonb(t), 'workshop',w.name,'client',c.name,
 'vehicle',concat(v.make,' ',v.model,' ',v.year,' · ',v.plates),
 'items',coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from public.service_items i where i.order_id=o),'[]'::jsonb),
 'photos',coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at) from public.service_photos f where f.order_id=o),'[]'::jsonb))
 from public.order_totals t join public.workshops w on w.id=t.workshop_id
 join public.clients c on c.id=t.client_id join public.vehicles v on v.id=t.vehicle_id where t.id=o;
$$;
create function private.read_order(order_id uuid, token text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
 if not (private.order_access(order_id) or order_id=coalesce(private.link_order(token),'00000000-0000-0000-0000-000000000000'::uuid)) then
 raise exception 'No tienes acceso a esta orden.'; end if;
 return private.order_json(order_id);
end; $$;
create function private.public_order(token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare o uuid;
begin
 o:=private.link_order(token);
 if o is null then raise exception 'El enlace venció o fue revocado.'; end if;
 return private.order_json(o);
end; $$;

create function private.release_stock(o uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare i record;
begin
 for i in select product_id,workshop_id,sum(quantity)::integer qty from public.service_items
 where order_id=o and kind='stock' group by product_id,workshop_id order by product_id loop
 update public.inventory set stock=stock+i.qty where id=i.product_id;
 insert into public.stock_movements(workshop_id,product_id,order_id,delta,reason,actor_id)
 values(i.workshop_id,i.product_id,o,i.qty,'Liberación de reserva',auth.uid());
 end loop;
end; $$;

create function private.decide_order(order_id uuid, decision text, token text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
 select * into o from public.orders where id=order_id for update;
 if o.id is null or not (private.client_access(o.workshop_id,o.client_id)
 or o.id=coalesce(private.link_order(token),'00000000-0000-0000-0000-000000000000'::uuid)) then
 raise exception 'No tienes acceso a esta orden.'; end if;
 if decision not in ('aprobada','rechazada') or decision is null then raise exception 'Respuesta no válida.'; end if;
 if o.status=decision then return; end if;
 if o.status<>'pendiente' then raise exception 'Esta cotización ya no acepta respuestas.'; end if;
 update public.orders set status=decision where id=o.id;
 if decision='rechazada' then perform private.release_stock(o.id); end if;
 insert into public.order_events(workshop_id,order_id,actor_id,event) values(o.workshop_id,o.id,auth.uid(),'Cliente: '||decision);
end; $$;

-- API transaccional. El rol nunca se toma de metadatos editables del usuario.
create function private.mutate(action text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w uuid; oid uuid; cid uuid; vid uuid; pid uuid; result_id uuid; tok text; mail text;
 o public.orders; i public.service_items; product public.inventory; inv public.invitations;
 n integer; price numeric; target text; member_role text;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then
 raise exception 'Inicia sesión con un correo confirmado.'; end if;
 insert into public.profiles(id) values(auth.uid()) on conflict do nothing;
 if action='create_workshop' then
 insert into public.workshops(name) values(trim(payload->>'name')) returning id into w;
 insert into public.workshop_members values(w,auth.uid(),'admin');
 return jsonb_build_object('id',w);
 end if;
 if action='accept_invite' then
 select * into inv from public.invitations where token_hash=private.hash_token(payload->>'token') for update;
 select lower(email) into mail from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if inv.id is null or inv.used_at is not null or inv.expires_at<=now() or mail<>lower(inv.email) then
 raise exception 'La invitación no es válida para este correo o ya venció.'; end if;
 if inv.role='client' then
 insert into public.client_accounts values(inv.workshop_id,inv.client_id,auth.uid()) on conflict do nothing;
 else
 insert into public.workshop_members values(inv.workshop_id,auth.uid(),inv.role) on conflict do nothing;
 end if;
 update public.invitations set used_at=now() where id=inv.id;
 return jsonb_build_object('role',inv.role,'workshop_id',inv.workshop_id);
 end if;
 w:=(payload->>'workshop_id')::uuid;
 if not private.member(w) then raise exception 'No tienes acceso a este taller.'; end if;
 if action='create_client' then
 insert into public.clients(workshop_id,name,email,phone) values(w,trim(payload->>'name'),lower(trim(coalesce(payload->>'email',''))),coalesce(payload->>'phone','')) returning id into cid;
 return jsonb_build_object('id',cid);
 elsif action='create_vehicle' then
 insert into public.vehicles(workshop_id,client_id,make,model,year,vin,plates)
 values(w,(payload->>'client_id')::uuid,payload->>'make',payload->>'model',(payload->>'year')::integer,upper(coalesce(payload->>'vin','')),upper(payload->>'plates')) returning id into vid;
 return jsonb_build_object('id',vid);
 elsif action='create_product' then
 if not private.member(w,true) then raise exception 'Sólo administración puede modificar inventario.'; end if;
 n:=(payload->>'stock')::integer;
 insert into public.inventory(workshop_id,sku,name,stock,price) values(w,payload->>'sku',payload->>'name',n,(payload->>'price')::numeric) returning id into pid;
 if n<>0 then insert into public.stock_movements(workshop_id,product_id,delta,reason,actor_id) values(w,pid,n,'Existencia inicial',auth.uid()); end if;
 return jsonb_build_object('id',pid);
 elsif action='adjust_stock' then
 if not private.member(w,true) then raise exception 'Sólo administración puede modificar inventario.'; end if;
 n:=(payload->>'delta')::integer; pid:=(payload->>'product_id')::uuid;
 if n is null or n=0 or abs(n)>100000 or length(trim(coalesce(payload->>'reason','')))=0 then raise exception 'Indica cantidad y motivo del ajuste.'; end if;
 update public.inventory set stock=stock+n where id=pid and workshop_id=w and stock+n>=0;
 if not found then raise exception 'Producto no válido o existencia insuficiente.'; end if;
 insert into public.stock_movements(workshop_id,product_id,delta,reason,actor_id) values(w,pid,n,left(payload->>'reason',250),auth.uid());
 return '{}'::jsonb;
 elsif action='invite' then
 if not private.member(w,true) then raise exception 'Sólo administración puede invitar personas.'; end if;
 tok:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 insert into public.invitations(workshop_id,email,role,client_id,token_hash,created_by)
 values(w,lower(trim(payload->>'email')),payload->>'role',nullif(payload->>'client_id','')::uuid,private.hash_token(tok),auth.uid());
 return jsonb_build_object('token',tok);
 elsif action='revoke_invite' then
 if not private.member(w,true) then raise exception 'Sólo administración puede revocar invitaciones.'; end if;
 update public.invitations set expires_at=now() where id=(payload->>'id')::uuid and workshop_id=w;
 return '{}'::jsonb;
 elsif action='create_order' then
 insert into public.orders(workshop_id,client_id,vehicle_id,title,notes,tax_rate)
 values(w,(payload->>'client_id')::uuid,(payload->>'vehicle_id')::uuid,payload->>'title',coalesce(payload->>'notes',''),coalesce((payload->>'tax_rate')::numeric,0.16)) returning id into oid;
 insert into public.order_events(workshop_id,order_id,actor_id,event) values(w,oid,auth.uid(),'Cotización creada');
 return jsonb_build_object('id',oid);
 end if;
 oid:=(payload->>'order_id')::uuid;
 select * into o from public.orders where id=oid and workshop_id=w for update;
 if o.id is null then raise exception 'Orden no encontrada.'; end if;
 if action='add_item' then
 if o.status<>'borrador' then raise exception 'Sólo se editan cotizaciones en borrador.'; end if;
 n:=(payload->>'quantity')::integer; price:=(payload->>'unit_price')::numeric;
 if n is null or n<1 or n>10000 then raise exception 'Cantidad no válida.'; end if;
 pid:=null;
 if payload->>'kind'='stock' then
 pid:=(payload->>'product_id')::uuid;
 select * into product from public.inventory where id=pid and workshop_id=w for update;
 if product.id is null or product.stock<n then raise exception 'No hay suficientes existencias.'; end if;
 price:=product.price;
 update public.inventory set stock=stock-n where id=pid;
 insert into public.stock_movements(workshop_id,product_id,order_id,delta,reason,actor_id) values(w,pid,oid,-n,'Reserva de cotización',auth.uid());
 end if;
 insert into public.service_items(workshop_id,order_id,kind,product_id,description,quantity,unit_price,supplier,tracking)
 values(w,oid,payload->>'kind',pid,case when pid is not null then product.name else payload->>'description' end,n,price,nullif(payload->>'supplier',''),nullif(payload->>'tracking',''));
 elsif action='remove_item' then
 if o.status<>'borrador' then raise exception 'Sólo se editan cotizaciones en borrador.'; end if;
 delete from public.service_items where id=(payload->>'item_id')::uuid and order_id=oid returning * into i;
 if i.kind='stock' then
 update public.inventory set stock=stock+i.quantity where id=i.product_id;
 insert into public.stock_movements(workshop_id,product_id,order_id,delta,reason,actor_id) values(w,i.product_id,oid,i.quantity,'Concepto eliminado',auth.uid());
 end if;
 elsif action='tracking' then
 update public.service_items set supplier=nullif(payload->>'supplier',''),tracking=nullif(payload->>'tracking','')
 where id=(payload->>'item_id')::uuid and order_id=oid and kind='por_pedir';
 elsif action='share' then
 if o.status in ('rechazada','cancelada') then raise exception 'Esta orden está cerrada.'; end if;
 if not exists(select 1 from public.service_items where order_id=oid) then raise exception 'Agrega al menos un concepto.'; end if;
 tok:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 insert into private.order_links(order_id,token_hash,expires_at) values(oid,private.hash_token(tok),now()+interval '30 days')
 on conflict(order_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,revoked=false;
 if o.status='borrador' then update public.orders set status='pendiente' where id=oid; end if;
 insert into public.order_events(workshop_id,order_id,actor_id,event) values(w,oid,auth.uid(),'Enlace generado o renovado');
 return jsonb_build_object('token',tok);
 elsif action='revoke_link' then
 update private.order_links set revoked=true where order_id=oid;
 elsif action='status' then
 target:=payload->>'status';
 if target is null or not ((o.status='aprobada' and target='en_proceso') or (o.status='en_proceso' and target='lista') or (o.status='lista' and target='entregada')
 or (o.status in ('borrador','pendiente','aprobada') and target='cancelada')) then raise exception 'Cambio de estado no permitido.'; end if;
 if target='cancelada' then
 perform private.release_stock(oid);
 update private.order_links set revoked=true where order_id=oid;
 end if;
 update public.orders set status=target where id=oid;
 insert into public.order_events(workshop_id,order_id,actor_id,event) values(w,oid,auth.uid(),target);
 elsif action='add_photo' then
 if split_part(payload->>'path','/',1)<>w::text or split_part(payload->>'path','/',2)<>oid::text
 or not exists(select 1 from storage.objects where bucket_id='service-photos' and name=payload->>'path') then raise exception 'Archivo no válido.'; end if;
 insert into public.service_photos(workshop_id,order_id,path,caption) values(w,oid,payload->>'path',coalesce(payload->>'caption',''));
 else raise exception 'Operación no válida.';
 end if;
 return '{}'::jsonb;
end; $$;

-- Fachadas sin privilegios propios. PostgREST sólo expone public.
create function public.app_mutate(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.mutate(action,payload); $$;
create function public.get_order(order_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.read_order(order_id); $$;
create function public.get_public_order(token text) returns jsonb language sql stable security invoker set search_path='' as $$ select private.public_order(token); $$;
create function public.decide_order(order_id uuid,decision text,token text default null) returns void language sql security invoker set search_path='' as $$ select private.decide_order(order_id,decision,token); $$;

revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.app_mutate(text,jsonb),public.get_order(uuid),public.get_public_order(text),public.decide_order(uuid,text,text) from public,anon,authenticated;
grant execute on function private.member(uuid,boolean),private.client_access(uuid,uuid),private.order_access(uuid),private.mutate(text,jsonb),private.read_order(uuid,text),private.photo_write(text) to authenticated;
grant execute on function private.public_order(text),private.decide_order(uuid,text,text),private.photo_access(text) to anon,authenticated;
grant execute on function public.app_mutate(text,jsonb),public.get_order(uuid) to authenticated;
grant execute on function public.get_public_order(text),public.decide_order(uuid,text,text) to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('service-photos','service-photos',false,8388608,array['image/jpeg','image/png','image/webp']);
create policy evidencia_lectura on storage.objects for select to anon,authenticated
 using(bucket_id='service-photos' and private.photo_access(name));
create policy evidencia_subida on storage.objects for insert to authenticated
 with check(bucket_id='service-photos' and private.photo_write(name));
-- Sólo se permite limpiar archivos que todavía no tengan un registro de evidencia.
create policy evidencia_limpieza on storage.objects for delete to authenticated
 using(bucket_id='service-photos' and private.photo_write(name) and not exists(select 1 from public.service_photos f where f.path=name));
commit;
