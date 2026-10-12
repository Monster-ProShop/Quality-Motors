# Quality Motors

SaaS para talleres mecánicos en español de México. Next.js App Router, TypeScript, Tailwind, Lucide y Supabase (PostgreSQL, Auth y Storage).

## Estado de esta reconstrucción

Se inspeccionó `Monster-ProShop/Quality-Motors` y se creó la rama local `rebuild/supabase-multitenant` desde `main`. El código anterior está en `legacy/`, fuera de la compilación y las rutas. Se conservaron el logotipo y el historial Git. No se modificaron bases de datos, despliegues ni ramas remotas. El Supabase conectado contenía tablas ajenas (`bowlers`, `user_profiles`); no se utilizó como destino.

Esta versión sustituye Prisma, pagos y chat de la arquitectura anterior. **No migra datos ni procesa pagos.** Antes de reemplazar un despliegue con datos, prepara un respaldo y un proceso separado de importación y conciliación.

## Ejecutar localmente

Requisitos: Node.js 22 o superior y pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

En PowerShell, usa `Copy-Item .env.example .env.local`. Abre [localhost:3000](http://localhost:3000). Sin variables de Supabase, el inicio funciona y las rutas de datos muestran instrucciones de configuración; no simulan información real.

## Conectar Supabase

1. Crea un **proyecto nuevo** de Supabase o una instancia local desechable. `schema.sql` es una instalación inicial transaccional, no una migración para ejecutar sobre la base anterior. No lo ejecutes repetidamente sobre una instalación existente.
2. Ejecuta el contenido completo de `schema.sql` en el SQL Editor con el propietario del proyecto. Crea talleres, perfiles, membresías, clientes, cuentas vinculadas, vehículos, inventario, órdenes, conceptos, fotos, invitaciones, eventos y movimientos de existencias; también crea las funciones, RLS, vista de totales y bucket privado.
3. En la configuración de Data API, expón **sólo `public`** para esta app. No expongas `private`. Los permisos sobre tablas y funciones ya se incluyen en el script.
4. Copia la URL del proyecto y la clave **publicable** en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     No se necesita `service_role`, contraseña de PostgreSQL ni clave secreta en la aplicación.
5. En Auth, habilita correo/contraseña y **confirmación de correo**. Configura Site URL como `http://localhost:3000` y agrega `http://localhost:3000/auth/callback` a Redirect URLs. Para producción usa tu dominio HTTPS exacto.
6. La plantilla estándar de confirmación debe conservar `{{ .ConfirmationURL }}`. El flujo PKCE regresa a `/auth/callback`. Confirma desde el mismo navegador que inició el registro; si cambias de dispositivo, vuelve a iniciar sesión después de confirmar. Supabase debe poder entregar sus correos; para producción configura SMTP desde su panel.
7. Regístrate, confirma tu correo e inicia sesión. En **Mi cuenta**, crea tu taller. Esa operación te convierte en administrador únicamente del taller nuevo.
8. En **Equipo y accesos**, invita colaboradores o clientes. Comparte manualmente el enlace generado. La persona debe iniciar sesión con el correo invitado, confirmarlo y volver al enlace para aceptarlo.

No se aprovisiona ningún administrador por un correo predefinido. No se confía en metadatos de usuario para asignar permisos.

Documentación de referencia: [SSR de Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Storage y RLS](https://supabase.com/docs/guides/storage/security/access-control).

## Flujo de operación

1. Registra un cliente y uno o más vehículos (marca, modelo, año, VIN opcional y placas).
2. Agrega refacciones al catálogo con SKU, precio sin IVA y existencia inicial.
3. Crea una cotización y selecciona cliente, vehículo e IVA aplicable (16%, 8% o 0%; el taller es responsable de elegirlo).
4. Agrega mano de obra, refacciones del catálogo o refacciones por pedir con proveedor y guía opcional.
5. Sube evidencias desde cámara o galería: JPG, PNG o WebP, hasta 8 MB por imagen.
6. Genera el enlace. Esto pasa la cotización a **Por autorizar** y bloquea los conceptos y precios. El enlace vence en 30 días; renovarlo invalida el anterior y se puede revocar en cualquier momento.
7. Comparte por WhatsApp (`wa.me`), correo (`mailto:`), SMS (`sms:`) o copia el enlace. Se abre la aplicación correspondiente; el usuario confirma ahí el envío. **No hay envío automático ni integración de WhatsApp Business.**
8. El cliente puede aprobar o rechazar. La primera respuesta es definitiva para esa cotización. Si hay que cambiar importes, crea una nueva cotización. Las notas y evidencias se muestran al cliente.
9. Una orden aprobada avanza a **En proceso → Lista para entrega → Entregada**. Las guías y las fotos pueden actualizarse durante el servicio.

## Accesos

| Acceso              | Permisos                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Administrador       | Operar su taller, administrar inventario, generar y revocar invitaciones                          |
| Colaborador         | Ver datos del taller, registrar clientes/vehículos, cotizar, subir fotos y actualizar el servicio |
| Cliente vinculado   | Ver sus propios servicios publicados y responder sus cotizaciones pendientes                      |
| Portador del enlace | Ver y responder exclusivamente la orden del enlace durante su vigencia                            |

Una cuenta puede pertenecer a varios talleres y tener accesos de cliente independientes. La invitación vincula un cliente específico, no todos los registros que coincidan con su correo. Vence en 7 días, se almacena con hash y se consume una sola vez.

El enlace de una cotización es una credencial de acceso por posesión: sólo compártelo con el destinatario. Usa el fragmento `#token=` para que el token no viaje en la ruta HTTP ni en encabezados de referencia. Quien lo reciba puede aprobar o rechazar sin iniciar sesión; para acceso personal persistente usa la invitación de cliente. Las respuestas se registran como cliente autenticado o visitante por enlace; esto no es una firma electrónica certificada.

## Inventario y totales

- Las refacciones se **reservan al agregarlas al borrador** mediante bloqueo de filas y decremento transaccional.
- Se toma el precio del catálogo en el servidor; el navegador no puede sustituirlo.
- Eliminar un concepto del borrador, cancelar una orden antes de iniciar trabajo o rechazarla devuelve la reserva una sola vez.
- Aprobar o entregar no vuelve a descontar stock.
- Una cotización abandonada en borrador o pendiente mantiene su reserva. El administrador debe cancelarla para liberarla.
- Las entradas y ajustes requieren administrador y dejan un movimiento con motivo.
- Los importes usan `numeric`. Cantidad × precio genera el importe del concepto; la vista suma el subtotal, redondea el IVA a dos decimales y obtiene el total. No se acepta un total enviado por el cliente.
- Esta base admite cantidades enteras; no incluye fracciones de litros/horas ni compras automatizadas.

## Seguridad

- RLS en todas las tablas públicas; relaciones compuestas impiden combinar entidades de talleres distintos.
- Ninguna escritura directa a tablas de negocio desde el navegador. Las mutaciones pasan por una API transaccional con comprobación de usuario confirmado, membresía y estado.
- Funciones privilegiadas en `private`, con `search_path` fijo y permisos de ejecución explícitos. Las fachadas públicas son `security invoker`.
- La vista `order_totals` utiliza `security_invoker=true`.
- Bucket `service-photos` privado con límite de MIME/tamaño. Rutas `taller/orden/archivo` verificadas contra la orden. Fotos por enlace autorizadas mediante `x-order-token` y RLS; URLs firmadas con vigencia de 120 segundos. Al revocar, una URL ya firmada puede funcionar hasta que venza.
- No hay reemplazo arbitrario de archivos ni políticas de escritura para clientes. Un fallo al guardar la evidencia intenta limpiar el archivo recién subido.
- Las sesiones usan cookies de Supabase SSR; el proxy renueva y valida tokens. Las rutas protegidas verifican el usuario en servidor.
- No se registra el token de acceso en eventos. No se utiliza información editable del usuario para conceder roles.

Antes de producción: ejecuta los asesores de Supabase sobre el proyecto nuevo, prueba Auth y Storage reales con dos talleres, configura dominio/SMTP/backups y monitoreo, y añade límites de solicitudes en el proveedor de alojamiento. La interfaz incluye revocación de invitaciones pendientes y enlaces; la baja de membresías ya aceptadas requiere administración segura en la base de datos. La política de retención de fotos debe definirse antes de operar a escala; no hay borrado automático.

## Estructura

```text
app/                  Rutas, layout y callback de Auth
components/           Panel, formularios y vista compartida de orden
lib/supabase/         Clientes de servidor/navegador y acceso por enlace
lib/                  Mutaciones, formato MXN y adaptadores de notificación
types/                Modelos de dominio
schema.sql            Instalación de PostgreSQL y Storage
tests/                Pruebas del SQL real en PostgreSQL embebido y plantillas
docs/                 Notas de validación
legacy/               Código anterior conservado, excluido del build
public/               Logotipo original
```

## Verificación

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Las pruebas cargan `schema.sql` en PostgreSQL embebido (PGlite), con usuarios, roles y tablas mínimas de Auth/Storage de prueba. Verifican RLS, llaves entre talleres, roles, invitaciones, existencias, cálculo de IVA, enlaces, políticas de fotos y transiciones. **No sustituyen una prueba contra los servicios reales de Auth, Storage y correo de Supabase.**

`pnpm-lock.yaml` fija dependencias. Sólo se autoriza el script de instalación de esbuild mediante `pnpm-workspace.yaml`.

## Despliegue

Usa un host Node compatible con Next.js (no GitHub Pages). Instala con `pnpm install --frozen-lockfile`, compila con `pnpm build` y arranca con `pnpm start`. Configura las dos variables antes de compilar porque son públicas e incorporadas al navegador. Actualiza Site URL y Redirect URLs de Supabase al dominio final. El proyecto no se ha publicado ni conectado a una base productiva durante esta reconstrucción.
