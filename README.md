# Quality Motors

SaaS multi-tenant para talleres mecánicos en español de México. Usa Next.js App Router, TypeScript, Tailwind, Lucide y Neon para PostgreSQL, Auth administrado y Object Storage privado.

Incluye talleres independientes, administradores y colaboradores, clientes y vehículos, inventario con reservas, cotizaciones, seguimiento de refacciones, evidencias fotográficas, portal del cliente y enlaces temporales de aprobación. Los adaptadores sólo abren `wa.me`, `mailto:` y `sms:`; no simulan envíos ni requieren credenciales de terceros.

## Estado en Neon

El proyecto está vinculado a **Quality-Motors** (`tiny-night-65739755`). La configuración y `schema.sql` se desplegaron en la rama aislada **quality-motors-neon** (`br-quiet-pine-ax2p8317`). Neon Auth y el bucket privado `service-photos` están habilitados allí. La rama `production` y sus tablas heredadas no se modificaron.

La arquitectura anterior se conserva en `legacy/` y no participa en la compilación. `schema.sql` preserva las tablas heredadas con nombres PascalCase si ya existen; es una instalación inicial y no importa ni concilia los datos anteriores.

## Ejecutar localmente

Requisitos: Node.js 22 o superior y pnpm.

```sh
pnpm install --frozen-lockfile
pnpm neon link --project-id tiny-night-65739755 --branch-id br-quiet-pine-ax2p8317
pnpm neon env pull
pnpm dev
```

`neon env pull` crea `.env.local`; ese archivo contiene credenciales y está ignorado por Git. Genera además `NEON_AUTH_COOKIE_SECRET` con un valor aleatorio de al menos 32 caracteres si no existe. Abre [localhost:3000](http://localhost:3000), regístrate, confirma tu correo y entra en **Mi cuenta** para crear el primer taller.

Para preparar otra rama ejecuta `pnpm neon config plan`, `pnpm neon config apply` y `pnpm neon env pull`. Después ejecuta `schema.sql` una sola vez contra `DATABASE_URL_UNPOOLED` con un cliente PostgreSQL. `neon.ts` declara Auth y el bucket; el SQL crea el modelo, funciones transaccionales, vistas, permisos y RLS.

## Uso

1. Regístrate con correo y contraseña, confirma el correo e inicia sesión.
2. En **Mi cuenta**, crea un taller. La primera cuenta queda como administradora.
3. Registra clientes, vehículos y refacciones. Los administradores pueden ajustar existencias.
4. Crea una cotización y agrega mano de obra, refacciones en existencia o por pedir con proveedor y guía.
5. Sube fotos desde cámara o galería. Se aceptan JPG, PNG y WebP de hasta 8 MB.
6. Genera el enlace. La cotización pasa a **Por autorizar**, se bloquean los precios y el enlace vence en 30 días.
7. Comparte por WhatsApp, correo, SMS o copia el enlace. El cliente puede aprobar o rechazar y ver fotos y seguimiento.
8. Una orden aprobada avanza por **En proceso → Lista para entrega → Entregada**.

Las invitaciones duran siete días, están ligadas al correo exacto, se guardan mediante hash y se consumen una sola vez. Una cuenta puede pertenecer a varios talleres.

## Inventario y seguridad

- La refacción se reserva al agregarla al borrador; el servidor toma el precio del catálogo.
- Eliminar el concepto, cancelar antes de iniciar o rechazar devuelve la reserva una sola vez.
- PostgreSQL deriva subtotal, IVA y total con `numeric`; el navegador no define importes confiables.
- RLS se fuerza en todas las tablas de negocio. Cada solicitud abre una transacción, cambia al rol `quality_motors_app` y fija el usuario de sesión.
- El navegador no recibe conexión PostgreSQL ni credenciales del bucket. El servidor valida sesión, membresía, estado y relaciones.
- Las fotos viven en un bucket privado y se muestran mediante URLs firmadas de corta duración.
- El token de cotización usa `#token=` para no formar parte de la solicitud HTTP ni del encabezado de referencia.
- Los permisos salen de membresías e invitaciones verificadas, nunca de metadatos editables.

## Estructura

```text
app/          Páginas y rutas de servidor para Auth, datos, enlaces y fotos
components/   Panel, formularios y vistas del cliente
lib/auth/     Neon Auth para servidor y navegador
lib/          PostgreSQL, Storage, formato MXN y notificaciones
types/        Modelos de dominio
schema.sql    PostgreSQL, funciones, permisos y RLS
neon.ts       Neon Auth y Object Storage
tests/        Aislamiento, inventario, totales y enlaces
legacy/       Código anterior fuera del build
```

## Verificación y despliegue web

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Neon hospeda la base, Auth y archivos; no hospeda la interfaz Next.js. Despliega la web en un host Node compatible y copia allí las variables privadas de `.env.local`. Configura en Neon Auth el dominio HTTPS final y el correo antes de abrir el servicio. Antes de promover el esquema a `production`, respalda y define cómo conservar o migrar las tablas heredadas.
