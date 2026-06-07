# Roadmap

Estado actualizado: 2026-06-06 18:12 CEST.

## Hitos completados

### Plataforma base publicada

- Monorepo con frontend Next.js, API NestJS, paquetes compartidos, Docker, Prisma/PostgreSQL y documentación inicial.
- Landing pública, CV online, login/admin, módulos CMS, CV Manager, generación PDF/DOCX, adaptación por reglas, analítica básica y Swagger.
- Seed inicial construido desde los CVs de Abel sin inventar empresas, fechas, estudios ni certificaciones.
- Repositorio GitHub creado: `abelvalle/portfolio-platform`.
- Ramas creadas y publicadas: `master` estable y `develop` como rama principal de trabajo.

Verificación realizada:

- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

### Multi-idioma público ES/EN

- Añadida capa de localización para la experiencia pública.
- Rutas públicas nuevas: `/en`, `/en/cv` y `/en/contact`.
- Landing, intro, hero, navegación numerada, command palette, CV online y formulario de contacto muestran textos localizados.
- La command palette incluye cambio de idioma ES/EN.
- Las traducciones usan los datos reales extraídos del CV y conservan cualquier contenido que llegue desde la API cuando no exista traducción conocida.

Verificación realizada en este hito:

- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`
- QA visual Playwright en `/en` desktop y móvil; Browser integrado no mantuvo sesión conectada, se usó fallback local.

### MFA preparado para admin

- Añadidos campos MFA en `User` y migración Prisma `000002_add_mfa_support`.
- Añadido servicio TOTP con códigos de 6 dígitos, ventana temporal estándar y recovery codes generados una sola vez.
- Recovery codes almacenados como hashes bcrypt, no en claro.
- Login mantiene el flujo actual cuando MFA está desactivado.
- Si MFA está activado, `POST /auth/login` devuelve un reto temporal y no emite tokens finales hasta `POST /auth/mfa/verify-login`.
- Añadidos endpoints protegidos para estado, setup, confirmación y desactivación MFA.
- Login frontend preparado para segundo paso MFA cuando la API responda `mfaRequired`.
- Admin settings muestra el estado funcional del módulo MFA y endpoints disponibles.
- `docs/api.md` actualizado con el flujo MFA.

Verificación realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Editor visual de estilos avanzado

- El editor de tema carga los tokens actuales desde el snapshot de portfolio.
- Añadidos controles de color con swatch y valor editable para principal, secundario, fondo y texto.
- Añadidos controles para tipografía, radio de bordes, estilo de cards, intensidad de animaciones y modo oscuro/claro.
- Añadida vista previa viva con estilos aplicados en tiempo real.
- Añadida persistencia: guardar borrador escribe `draftJson`; publicar envía tokens y `publishedAt` a `PATCH /theme`.
- Añadida acción `adminClient.updateTheme` para centralizar el consumo del endpoint.

Verificación realizada en este hito:

- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run lint`
- QA visual Playwright en `/admin/portfolio/theme` con cookie local de test; no se pulsó guardar al no existir sesión API real en la comprobación visual.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Exportación ATS avanzada

- Añadido `CvAtsService` para scoring ATS, checks ponderados, keywords detectadas y recomendaciones.
- Añadidos tests unitarios del validador ATS.
- Añadidos endpoints protegidos:
  - `GET /api/v1/cv/:id/ats-report`
  - `POST /api/v1/cv/:id/generate-ats-pdf`
  - `POST /api/v1/cv/:id/generate-ats-docx`
- Exportación ATS genera archivos con sufijo `-ats` y metadata de score/status.
- La plantilla `ATS-friendly` del panel muestra capacidades específicas: texto plano, score ATS y PDF/DOCX ATS.
- `docs/api.md` actualizado con el reporte ATS y endpoints nuevos.

Verificación realizada en este hito:

- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd run build:web`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Integración IA opcional para adaptación de CV

- Añadido `CvAiAdapterService` como proveedor IA externo opcional por HTTP.
- Añadidas variables `CV_AI_ADAPTER_URL` y `CV_AI_ADAPTER_API_KEY` en `.env.example`.
- Si no hay proveedor configurado, la adaptación sigue usando el motor por reglas.
- Si hay proveedor configurado, sus sugerencias quedan en `adaptationMeta.aiSuggestion` como pendientes de revisión.
- La IA solo puede influir en el orden de skills/experiencias existentes; no se aceptan datos profesionales nuevos.
- Añadido test unitario para el fallback sin proveedor IA.
- `docs/api.md` actualizado con el comportamiento IA opcional.

Verificación realizada en este hito:

- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Sistema multiusuario y permisos granulares

- Añadido `UsersModule` con endpoints admin-only para listar, crear, actualizar y desactivar usuarios.
- Añadida matriz de permisos por rol (`admin`, `editor`, `viewer`).
- Protección contra auto-democión y auto-borrado de la cuenta admin actual.
- Passwords de nuevos usuarios hasheadas con bcrypt.
- Los endpoints devuelven usuario público sin hash de contraseña ni refresh token.
- Añadida ruta admin `/admin/settings/users` con tabla de roles/permisos.
- Sidebar admin incluye acceso a Usuarios.
- `docs/api.md` actualizado con endpoints de usuarios.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Webhooks de formularios/contacto

- Añadido `ContactWebhookService` con envío opcional `contact.message.created`.
- El mensaje se guarda siempre en base de datos; el webhook no bloquea el flujo si no está configurado o falla.
- Añadida firma HMAC SHA-256 opcional con `CONTACT_WEBHOOK_SECRET`.
- Añadidas variables `CONTACT_WEBHOOK_URL` y `CONTACT_WEBHOOK_SECRET` en `.env.example`.
- Añadido test unitario para fallback sin webhook configurado.
- `docs/api.md` actualizado con el comportamiento del webhook.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Integración con LinkedIn

- Añadido `IntegrationsModule` con endpoints LinkedIn.
- `GET /api/v1/integrations/linkedin/status` expone estado de configuración, URL pública de perfil y scopes previstos.
- `GET /api/v1/integrations/linkedin/share-url` construye URLs de compartir portfolio/CV en LinkedIn.
- `GET /api/v1/integrations/linkedin/auth-url` prepara URL OAuth protegida para admin cuando existan credenciales.
- Añadidas variables opcionales `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` y `PUBLIC_SITE_URL`.
- Añadida sección LinkedIn en `/admin/settings`.
- Añadidos tests unitarios de estado/share URL.
- `docs/api.md` actualizado con endpoints de integración.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Plantillas públicas de CV

- Añadidas rutas públicas `/cv/templates` y `/en/cv/templates`.
- La galería consume `GET /api/v1/cv-templates` y usa fallback local si la API no está disponible.
- El CV online enlaza la galería de plantillas en ES y EN.
- Las tarjetas muestran configuración real de cada plantilla: tipografía, densidad, foto e iconos.
- Añadida normalización tipada de plantillas para evitar confiar en datos sin forma desde la API.
- Añadida cobertura e2e desktop/mobile para ambas rutas públicas.

Verificación realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Servicio de media independiente

- Reemplazado el CRUD genérico de media por `MediaController`, `MediaService` y `MediaStorageService`.
- Añadido storage local desacoplado con proveedor configurable `MEDIA_STORAGE_PROVIDER=local`.
- Añadidos límites por entorno: `MEDIA_MAX_FILE_SIZE_MB` y `MEDIA_ALLOWED_MIME_TYPES`.
- Añadido endpoint protegido `POST /api/v1/media/upload` para subida `multipart/form-data`.
- Añadido endpoint protegido `GET /api/v1/media/storage/status` para estado de proveedor, límites y MIME types.
- Añadido endpoint público `GET /api/v1/media/:id/download` para descargar assets registrados.
- El panel `/admin/media` ahora muestra estado de storage, permite subir archivos y lista assets registrados desde la API.
- Añadido test unitario de defaults y validación de MIME types para `MediaStorageService`.
- `docs/api.md` y `.env.example` actualizados con el contrato de media.

Verificación realizada en este hito:

- `npm.cmd run build:api`
- `npm.cmd run build:web`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Preview A4 y URLs compartibles por plantilla de CV

- Añadidas rutas públicas `/cv/templates/:slug` y `/en/cv/templates/:slug`.
- Cada plantilla tiene URL compartible visible dentro de su detalle.
- Añadida previsualización A4 responsive con datos reales/fallback del CV.
- El preview aplica configuración de plantilla: color principal, tipografía, densidad, foto e iconos.
- La galería pública enlaza cada card con su preview.
- Añadida carga compartida de plantillas para evitar duplicación entre rutas ES/EN.
- Añadida cobertura e2e desktop/mobile para detalle ES y EN.

Verificación realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Workflow draft/publish con revisión de cambios

- Añadido `AdminPublicationController` bajo `/api/v1/admin/publication`.
- Añadido `AdminPublicationService` para comparar borrador y tema publicado campo a campo.
- `GET /api/v1/admin/publication/theme/review` devuelve diff granular de `ThemeSettings`.
- `POST /api/v1/admin/publication/theme/publish` publica el borrador, limpia `draftJson`, actualiza `publishedAt` y registra `ChangeLog` + `AuditLog`.
- `GET /api/v1/admin/publication/changelog` lista cambios recientes.
- Añadida pantalla `/admin/settings/publication` con revisión de campos, estado de borrador, publicación y últimos cambios.
- Añadida entrada "Publicacion" en el sidebar admin.
- Añadidos tests unitarios del diff de tema y rechazo de publicación sin cambios.
- Añadida cobertura e2e desktop/mobile de acceso a la pantalla protegida por proxy de sesión.

Verificación realizada en este hito:

- `npm.cmd run build:api`
- `npm.cmd run build:web`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Exportación PDF/DOCX aplicando plantilla seleccionada

- `CvService` carga `CvVersion.template` al resolver la versión primaria/publicada.
- `CvExportService` recibe configuración de plantilla en exportaciones PDF, DOCX y render HTML.
- Los archivos generados incluyen el slug de plantilla en el nombre.
- PDF aplica color principal y densidad compacta/normal.
- DOCX aplica fuente, color de secciones y densidad compacta/normal.
- Las exportaciones ATS mantienen prioridad ATS: color textual y densidad normal.
- `MediaAsset` y `CvGeneratedFile` guardan metadata `template` junto a cada exportación.
- `docs/api.md` actualizado con el comportamiento de exportación por plantilla.
- Añadido test unitario para validar aplicación de fuente, color y densidad en render HTML.

Verificación realizada en este hito:

- `npm.cmd run build:api`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Restauración de versiones en publicación

- Añadido endpoint `POST /api/v1/admin/publication/changelog/:id/restore`.
- La restauración usa `ChangeLog.beforeJson` para revertir cambios de tema visual.
- La restauración limpia `draftJson`, actualiza `publishedAt` y crea un nuevo `ChangeLog` con acción `restore`.
- También registra `AuditLog` con `changeLogId` y campos restaurados.
- La pantalla `/admin/settings/publication` permite restaurar entradas recientes de tema.
- Añadido test unitario para restauración de `primaryColor` desde una entrada de changelog.
- `docs/api.md` actualizado con el endpoint de restauración.

Verificación realizada en este hito:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Usuarios UI CRUD conectado a API

- Reemplazada la vista estática `/admin/settings/users` por un gestor conectado a `/api/v1/users`.
- El panel lista usuarios, roles y estado MFA desde la API.
- Añadido formulario para crear usuarios con email, nombre, rol y password inicial.
- Añadida edición rápida de rol por usuario con `PATCH /api/v1/users/:id`.
- Añadida baja/desactivación con `DELETE /api/v1/users/:id`.
- La matriz de permisos se carga desde `GET /api/v1/users/permissions`.
- Añadida cobertura e2e desktop/mobile de la ruta admin de usuarios tras proxy de sesión.

Verificación realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### UI de configuración MFA admin

- Añadido componente `MfaSettings` en `/admin/settings`.
- La UI carga estado MFA desde `GET /api/v1/auth/mfa/status`.
- Permite iniciar setup TOTP con `POST /api/v1/auth/mfa/setup`.
- Muestra `secret` y `otpauthUrl` sin depender de proveedores externos de QR.
- Permite confirmar MFA con código TOTP y muestra recovery codes una sola vez.
- Permite desactivar MFA con código TOTP o recovery code.
- Añadidos métodos MFA en `authClient`.
- Añadida cobertura e2e desktop/mobile de la card de seguridad admin.

Verificación realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### UI y prueba de webhooks de contacto

- Añadido estado de webhook en `ContactWebhookService` sin exponer URL ni secreto.
- Añadido evento de prueba `contact.webhook.test` sin datos personales.
- Añadidos endpoints protegidos:
  - `GET /api/v1/contact-messages/webhook/status`
  - `POST /api/v1/contact-messages/webhook/test`
- Añadida card `Webhooks contacto` en `/admin/settings`.
- La UI muestra configuración, firma HMAC, evento, timeout y permite lanzar prueba manual.
- Añadido test unitario para estado configurado con secreto.
- `docs/api.md` actualizado con endpoints de webhook.

Verificación realizada en este hito:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bandeja admin de mensajes conectada

- Reemplazada `/admin/messages` estática por `ContactMessageManagement`.
- La UI lista mensajes desde `GET /api/v1/contact-messages`.
- Añadidos filtros por estado: todos, no leídos y leídos.
- Permite marcar mensajes como leído/no leído con `PATCH /api/v1/contact-messages/:id/status`.
- Permite borrar mensajes con `DELETE /api/v1/contact-messages/:id`.
- Añadidos estados de carga, error y vacío.
- Añadida cobertura e2e desktop/mobile de la ruta admin de mensajes.

Verificación realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Analítica admin conectada a API

- Reemplazada `/admin/analytics` estática por `AnalyticsDashboard`.
- La UI carga resumen desde `GET /api/v1/analytics/summary`.
- La UI lista eventos recientes desde `GET /api/v1/analytics`.
- Añadidas tarjetas reales para visitas landing, descargas CV, formularios y vistas de proyecto.
- Añadida tabla responsive de eventos recientes con estados de carga, error y vacío.
- Añadida cobertura e2e desktop/mobile de la ruta admin de analítica.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Draft/publish de perfil público

- Añadida migración Prisma `000003_add_profile_publication`.
- `Profile` ahora soporta `draftJson` y `publishedAt`.
- Añadidos endpoints protegidos `GET /api/v1/admin/publication/profile/review` y `POST /api/v1/admin/publication/profile/publish`.
- La restauración de changelog ahora soporta cambios de `theme` y `profile`.
- Reemplazada `/admin/portfolio` placeholder por `ProfileEditor` conectado a API.
- El editor permite cargar perfil, guardar borrador, revisar diferencias y publicar perfil.
- La publicación rechaza borradores que dejen vacíos campos obligatorios del perfil.
- La pantalla de publicación muestra historial global y puede restaurar tema o perfil.
- Añadidos tests unitarios de revisión/publicación de perfil y cobertura e2e de la ruta admin.
- `docs/api.md` actualizado con los nuevos endpoints.

Verificación realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Dashboard admin conectado a API

- Reemplazadas las tarjetas estáticas de `/admin` por datos desde `GET /api/v1/admin/dashboard`.
- El dashboard muestra visitas, proyectos publicados, experiencias visibles, mensajes recibidos, CV principal y fecha de actualización del CV.
- Añadidos estados de carga/error y acción manual de refresco.
- Añadido panel de últimos cambios desde `ChangeLog`.
- Añadido panel de módulos activos desde `AppModule`.
- Añadida cobertura e2e desktop/mobile de la ruta raíz admin.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### CRUD básico de experiencia conectado

- Reemplazada `/admin/portfolio/experience` placeholder por `ExperienceManagement`.
- La pantalla lista experiencias desde `GET /api/v1/experiences?includeHidden=true`.
- Añadido formulario para crear experiencias con empresa, cargo, fechas, modalidad, descripción y listas de logros/responsabilidades/tecnologías/metodologías/skills.
- Añadidas acciones rápidas para ocultar/mostrar, marcar destacada/no destacada y borrar con soft delete.
- Añadidos estados de carga, error, vacío y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin de experiencia.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### CRUD básico de proyectos conectado

- Reemplazada `/admin/portfolio/projects` placeholder por `ProjectManagement`.
- La pantalla lista proyectos desde `GET /api/v1/projects?includeHidden=true`.
- Añadido formulario para crear proyectos con slug automático, estado, categoría, tecnologías, imagen y URLs.
- Añadidas acciones rápidas para ocultar/mostrar, destacar/no destacar, publicar/archivar y borrar con soft delete.
- Añadidos estados de carga, error, vacío y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin de proyectos.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### CRUD básico de skills conectado

- Reemplazada `/admin/portfolio/skills` placeholder por `SkillManagement`.
- La pantalla lista skills desde `GET /api/v1/skills?includeHidden=true`.
- Añadido formulario para crear skills con nombre, categoría, nivel y visibilidad.
- Añadidas acciones rápidas para ocultar/mostrar, ajustar orden y borrar con soft delete.
- Añadidos estados de carga, error, vacío y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin de skills.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### CRUD básico de estudios conectado

- Reemplazada `/admin/portfolio/education` placeholder por `EducationManagement`.
- La pantalla lista estudios desde `GET /api/v1/education?includeHidden=true`.
- Añadido formulario para crear estudios con título, institución, fecha, tipo, URL de certificado y descripción.
- Añadidas acciones rápidas para ocultar/mostrar, ajustar orden y borrar con soft delete.
- Añadidos estados de carga, error, vacío y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin de estudios.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### CRUD básico de certificaciones conectado

- Reemplazada `/admin/portfolio/certifications` placeholder por `CertificationManagement`.
- La pantalla lista certificaciones desde `GET /api/v1/certifications?includeHidden=true`.
- Añadido formulario para crear certificaciones con título, institución, fecha, URL de certificado, adjunto y descripción.
- Añadidas acciones rápidas para ocultar/mostrar, ajustar orden y borrar con soft delete.
- Añadidos estados de carga, error, vacío y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin de certificaciones.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Versiones de CV conectadas a API

- Reemplazada la tabla hardcodeada de `/admin/cv/versions` por carga real desde `GET /api/v1/cv-versions`.
- Añadido formulario para crear versiones mínimas a partir del CV base existente.
- Añadidas acciones rápidas para publicar/archivar y borrar versiones con soft delete.
- Añadidos estados de carga, error, vacío y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin de versiones CV.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Plantillas CV admin conectadas a API

- Reemplazado el selector hardcodeado de `/admin/cv/templates` por carga real desde `GET /api/v1/cv-templates?includeHidden=true`.
- Añadido formulario para crear plantillas con slug automático, color principal, tipografía, densidad, foto, iconos y descripción.
- Añadidas acciones rápidas para ocultar/mostrar, ajustar orden y borrar con soft delete.
- Añadidos estados de carga, error, vacío y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin de plantillas CV.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Adaptación de CV conectada a API

- Reemplazado el wizard estático de `/admin/cv/adapt` por integración real con `GET /api/v1/cv-versions`.
- El usuario puede seleccionar una versión base, introducir puesto objetivo, empresa opcional y descripción de oferta.
- La UI llama a `POST /api/v1/cv/adapt-to-role`.
- La respuesta muestra modo de adaptación, keywords, resumen propuesto, skills y experiencias priorizadas.
- Se muestra el guardrail de revisión humana y no invención de datos.
- Añadida cobertura e2e desktop/mobile de la ruta admin de adaptación CV.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Comparador de CV conectado a API

- Reemplazada la vista estática de `/admin/cv/compare` por carga real desde `GET /api/v1/cv-versions`.
- La UI permite seleccionar CV base y CV adaptado.
- La comparación llama a `POST /api/v1/cv/compare-versions`.
- Se muestran diferencias de resumen, orden de skills, experiencias destacadas y orden de secciones.
- Añadida cobertura e2e desktop/mobile de la ruta admin de comparador CV.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Editor de CV principal conectado

- Reemplazado el editor genérico de `/admin/cv/editor` por carga real desde `GET /api/v1/cv`.
- La UI permite editar nombre, titular profesional, resumen y estado del CV principal.
- El guardado usa `PATCH /api/v1/cv/:id`.
- Añadidos estados de carga, error, validación mínima, guardado y refresco manual.
- Añadida cobertura e2e desktop/mobile de la ruta admin del editor CV.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Preview A4 admin conectado

- Reemplazado `CvPreview` basado solo en fallback por carga desde `GET /api/v1/cv` y snapshot público del portfolio.
- La vista previa usa nombre, titular, resumen y experiencias reales cuando la API responde.
- Conserva fallback local para mantener el panel operativo si la API no está disponible.
- Añadidos estados de sincronización/fallback visibles.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Generación PDF/DOCX por versión CV

- Añadidos endpoints protegidos `POST /api/v1/cv-versions/:id/generate-pdf` y `POST /api/v1/cv-versions/:id/generate-docx`.
- La generación usa exactamente la `CvVersion` seleccionada y su plantilla asociada, no la versión primaria global del CV base.
- Cada generación registra un `MediaAsset`, crea un `CvGeneratedFile` y actualiza `generatedPdfId` o `generatedDocxId` en la versión.
- La tabla admin `/admin/cv/versions` permite generar PDF y DOCX desde cada fila.
- Cuando existen archivos generados, la tabla muestra estado `PDF listo`/`DOCX listo` y enlaces de descarga desde media.
- `docs/api.md` documenta el contrato nuevo.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Versión principal de CV robusta

- Añadido endpoint protegido `POST /api/v1/cv-versions/:id/set-primary`.
- El backend usa una transacción para limpiar `isPrimary` del resto de versiones del mismo `cvId` y publicar la versión seleccionada.
- La tabla admin `/admin/cv/versions` incorpora acción `Principal` por fila no principal.
- La UI refresca desde API tras la transacción para evitar estados locales inconsistentes.
- `docs/api.md` documenta el nuevo endpoint.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Selector de plantilla en versiones CV

- La pantalla `/admin/cv/versions` carga plantillas reales desde `GET /api/v1/cv-templates?includeHidden=true`.
- El formulario de creación de versiones permite asignar una plantilla inicial.
- Cada fila muestra la plantilla asignada y permite cambiarla con `PATCH /api/v1/cv-versions/:id`.
- La tabla mantiene estados de carga/error existentes y refresca desde API tras cambiar la plantilla.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Editor JSON estructurado en versiones CV

- Añadido editor JSON en `/admin/cv/versions` para modificar `structuredJson` de una versión concreta.
- El editor permite seleccionar versión, preformatea el JSON existente y valida sintaxis antes de guardar.
- El guardado usa `PATCH /api/v1/cv-versions/:id` y conserva feedback de éxito/error.
- Añadida cobertura e2e mínima para asegurar que el editor aparece en la ruta protegida.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bandeja de mensajes con fecha y detalle

- `/admin/messages` incorpora filtros de fecha `Desde` y `Hasta` sobre los mensajes cargados desde API.
- Añadida vista de detalle del mensaje seleccionado con asunto, contacto, fecha, estado y cuerpo completo.
- Las acciones de marcar leído/no leído y borrar se mantienen disponibles en listado y detalle.
- La lista muestra preview compacto para facilitar escaneo.
- Añadida cobertura e2e mínima para los filtros de fecha.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Analítica con filtros y exportación CSV

- `/admin/analytics` incorpora filtros de fecha `Desde` y `Hasta` para la tabla de eventos.
- El resumen se mantiene como métrica global de API para no mezclar semánticas.
- Añadida exportación CSV client-side de eventos filtrados.
- La tabla muestra fechas formateadas y estado vacío específico para filtros activos.
- Añadida cobertura e2e mínima para filtros y botón de exportación.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Dashboard admin con drill-downs

- Las tarjetas de resumen de `/admin` enlazan a las pantallas relacionadas: analítica, proyectos, experiencia, mensajes y CV Manager.
- Los últimos cambios enlazan a la pantalla de revisión/publicación.
- Los módulos activos conocidos enlazan a sus rutas admin correspondientes y los módulos futuros quedan como estado informativo.
- Añadida cobertura e2e mínima para el enlace de eventos desde el dashboard.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Gestión de módulos desde admin

- Añadida ruta protegida `/admin/settings/modules`.
- La pantalla lista `AppModule` desde `GET /api/v1/app-modules?includeHidden=true`.
- Permite activar/desactivar módulos y ajustar su orden con `PATCH /api/v1/app-modules/:id`.
- Sidebar y `/admin/settings` enlazan al gestor real de módulos.
- Añadida cobertura e2e mínima de la nueva ruta.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Auditoría granular MFA

- `AuthService` registra eventos MFA en `AuditLog` para setup iniciado, confirmación, desactivación y login MFA verificado.
- La auditoría usa `resource=User` y `resourceId=userId`.
- La metadata evita almacenar secretos TOTP, códigos de verificación o recovery codes.
- Añadidos tests unitarios de auditoría para setup, confirmación y desactivación.
- `docs/api.md` documenta las acciones de auditoría MFA.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Tema publicado aplicado a landing

- `PublicLanding` aplica tokens de `snapshot.theme` a variables CSS en runtime.
- Los tokens cubren color principal, fondo, texto, bordes, muted/accent, radio y tipografía.
- Añadido saneado básico de colores, longitudes y fuente para evitar valores CSS inesperados.
- La landing conserva fallback visual si la API no entrega un tema válido.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Tema público reutilizable

- Extraída utilidad `buildPublicThemeStyle` para compartir el saneado y mapeo de tokens de tema.
- El tema publicado se aplica también al CV online, contacto ES/EN, galería de plantillas y previews públicos.
- Las rutas de detalle `/cv/[slug]` quedan cubiertas al reutilizar el CV online.
- La deuda de tema público queda reducida al admin y a validación visual avanzada.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Tema runtime aplicado al admin

- El layout `/admin` carga el snapshot del portfolio y aplica `snapshot.theme` al shell admin.
- El admin reutiliza el mismo saneado de tokens que las rutas públicas.
- La aplicación se mantiene en el frontend y sigue consumiendo la API REST, sin acceso directo a base de datos.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Regeneración de recovery codes MFA

- Añadido endpoint protegido `POST /api/v1/auth/mfa/recovery-codes/regenerate`.
- La regeneración exige código TOTP o recovery code válido antes de sustituir hashes.
- Los nuevos recovery codes se devuelven solo en la respuesta y se muestran una vez en la UI.
- La acción se audita como `auth.mfa.recovery_codes_regenerated` sin almacenar códigos.
- `/admin/settings` permite regenerar recovery codes desde la sección MFA activa.

Verificación realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Validacion visual de contraste en tema

- Añadida utilidad frontend para calcular ratio de contraste WCAG desde tokens de tema.
- `/admin/portfolio/theme` muestra checks para texto/fondo, texto secundario, acento/fondo, texto/card y acento/card.
- La publicacion del tema queda bloqueada si fallan contrastes criticos de texto, manteniendo libre el guardado de borrador.
- Añadida cobertura e2e para asegurar que el editor de tema expone la validacion de contraste.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### DTO validado para perfil publico

- Añadido `UpdateProfileDto` para `PATCH /api/v1/profile`.
- El endpoint acepta solo campos propios del perfil, `draftJson` y `publishedAt`.
- El DTO valida email, longitudes razonables y rechaza `null` en campos no nulos.
- Añadidos tests del `ValidationPipe` para whitelist, email invalido y campos no nulos.
- `docs/api.md` documenta el comportamiento validado del endpoint.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### QR visual local para MFA

- Añadida dependencia `qrcode` en el workspace web para generar QR en cliente.
- `/admin/settings` renderiza un QR local desde `otpauthUrl` durante el setup TOTP.
- Secret y `otpauthUrl` siguen visibles como fallback manual.
- Añadida cobertura e2e con endpoints MFA mockeados para validar que el QR se muestra al iniciar setup.
- `docs/api.md` aclara que el QR se genera localmente sin enviar el secreto a servicios externos.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Filtros temporales API para analitica

- Añadido `AnalyticsDateRangeQueryDto` para `from/to` en formato `YYYY-MM-DD`.
- `GET /api/v1/analytics/summary` y `GET /api/v1/analytics` aplican filtro real por `createdAt`.
- El backend rechaza rangos invertidos.
- El panel `/admin/analytics` envia los filtros al backend y mantiene filtro local para CSV.
- Añadidos tests unitarios del servicio para summary, listado y rango invalido.
- `docs/api.md` documenta los query params de analitica.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Filtros temporales API para dashboard

- `GET /api/v1/admin/dashboard` acepta `from/to` en formato `YYYY-MM-DD`.
- El filtro se aplica a visitas landing, mensajes recibidos y ultimos cambios.
- Proyectos publicados, experiencias visibles y CV principal siguen mostrando estado actual.
- `/admin` permite seleccionar fechas y recargar el dashboard con filtros de API.
- Añadidos tests unitarios para rango aplicado y rango invertido.
- `docs/api.md` documenta los query params del dashboard.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### DTO validado para tema visual

- Añadido `UpdateThemeDto` para `PATCH /api/v1/theme`.
- El endpoint acepta solo tokens visuales, `draftJson` y `publishedAt`.
- Colores validados como hex `#RRGGBB`; `cardStyle` y `colorMode` quedan limitados a valores conocidos.
- Añadidos tests del `ValidationPipe` para whitelist, color invalido y campos no nulos.
- `docs/api.md` documenta la validacion del endpoint de tema.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Preparacion de respuesta email en mensajes

- El detalle de mensajes en `/admin/messages` incluye accion `Responder email`.
- El enlace usa `mailto` con destinatario, asunto `Re:` y cuerpo con mensaje original.
- No se añade proveedor externo ni secretos de email; queda como preparacion visual segura.
- Añadida cobertura e2e con mensaje mockeado para validar el enlace de respuesta.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Filtros temporales API para mensajes

- `GET /api/v1/contact-messages` acepta `status`, `from` y `to`.
- El backend filtra por `createdAt` y rechaza rangos invertidos.
- `/admin/messages` envia estado y fechas al backend, manteniendo filtro local como respaldo.
- Añadidos tests unitarios del servicio para rango aplicado y rango invalido.
- `docs/api.md` documenta los query params de mensajes.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Busqueda y confirmacion de baja de usuarios

- `/admin/settings/users` permite buscar usuarios por email, nombre o rol.
- La baja de usuario abre un dialogo de confirmacion antes de llamar a la API.
- La lista muestra estado vacio especifico para la busqueda activa.
- Añadida cobertura e2e con usuarios mockeados para buscar y abrir/cancelar confirmacion.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Diff visual por campo en comparador CV

- `/admin/cv/compare` resalta campos diferentes con paneles base/adaptado.
- Campos de lista muestran chips para elementos comunes, solo base y solo adaptado.
- El resumen profesional mantiene comparacion textual con estado visual diferente/igual.
- Añadida cobertura e2e con versiones y resultado de comparacion mockeados.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Enlaces de edicion desde comparador CV

- `/admin/cv/compare` muestra acciones de revision para la version adaptada seleccionada.
- La accion `Editar JSON adaptado` abre `/admin/cv/versions?versionId=...`.
- `/admin/cv/versions` selecciona automaticamente la version enlazada en el editor JSON estructurado.
- Añadida cobertura e2e para el flujo comparador -> versiones con `cv-adapted`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Paginacion basica en usuarios admin

- `/admin/settings/users` pagina la lista filtrada en bloques de 5 usuarios.
- La busqueda por email, nombre o rol reinicia la paginacion a la primera pagina.
- La pagina visible se ajusta cuando filtros o bajas reducen el total disponible.
- Añadida cobertura e2e para navegar a pagina 2 y volver a resultados filtrados.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Edicion inline de usuarios admin

- `/admin/settings/users` permite editar nombre desde cada fila.
- La password se puede actualizar inline con validacion minima de 8 caracteres.
- El campo de password se limpia tras guardar para no dejar secretos visibles en la UI.
- Añadida cobertura e2e para PATCH de datos de usuario y limpieza del campo password.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Tendencias basicas de analitica admin

- `/admin/analytics` calcula tendencias desde los eventos filtrados por la API.
- El panel muestra dias activos, dia con mas actividad y evento dominante.
- Añadido top 3 de tipos de evento con barras proporcionales.
- Añadida cobertura e2e con eventos mockeados para validar la seccion de tendencias.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Pulso operativo en dashboard admin

- `/admin` añade widgets derivados para conversion contacto/visita, contenido visible y modulos activos.
- Los widgets usan barras proporcionales y datos del endpoint existente `/admin/dashboard`.
- La seccion respeta filtros temporales ya presentes porque se recalcula con el resumen filtrado.
- Añadida cobertura e2e con dashboard mockeado para validar el pulso operativo.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Diff inline de resumen en comparador CV

- `/admin/cv/compare` muestra palabras nuevas, retiradas y comunes para el resumen profesional.
- El diff textual se calcula desde tokens del resumen base/adaptado sin alterar los datos originales.
- Se mantiene el diff por chips para listas de skills, experiencias y secciones.
- Añadida cobertura e2e para validar el bloque `Palabras nuevas`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de borrado en proyectos CMS

- `/admin/portfolio/projects` ya no ejecuta borrado directo desde el boton de papelera.
- Se añade modal de confirmacion con nombre del proyecto y recomendacion de ocultar/archivar.
- El boton de papelera tiene `aria-label` descriptivo para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal de borrado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de borrado en skills CMS

- `/admin/portfolio/skills` ya no ejecuta borrado directo desde el boton de papelera.
- Se añade modal de confirmacion con nombre de la skill y recomendacion de ocultarla.
- El boton de papelera tiene `aria-label` descriptivo para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal de borrado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de borrado en estudios CMS

- `/admin/portfolio/education` ya no ejecuta borrado directo desde el boton de papelera.
- Se añade modal de confirmacion con titulo del estudio y recomendacion de ocultarlo.
- El boton de papelera tiene `aria-label` descriptivo para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal de borrado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de borrado en certificaciones CMS

- `/admin/portfolio/certifications` ya no ejecuta borrado directo desde el boton de papelera.
- Se añade modal de confirmacion con titulo de la certificacion y recomendacion de ocultarla.
- El boton de papelera tiene `aria-label` descriptivo para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal de borrado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de borrado en experiencias CMS

- `/admin/portfolio/experience` ya no ejecuta borrado directo desde el boton de papelera.
- Se añade modal de confirmacion con empresa de la experiencia y recomendacion de ocultarla.
- El boton de papelera tiene `aria-label` descriptivo para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal de borrado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Validacion semantica de JSON en versiones CV

- `/admin/cv/versions` valida que el JSON estructurado sea un objeto raiz antes de guardarlo.
- Los campos comunes `experience`, `education`, `certifications`, `skills`, `projects`, `languages` y `sections` deben ser listas si existen.
- El campo `personal` debe ser un objeto si existe.
- Añadida cobertura e2e para bloquear una lista raiz `[]` antes de llamar al guardado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de borrado en plantillas CV

- `/admin/cv/templates` ya no elimina plantillas directamente desde el boton de papelera.
- Se añade modal de confirmacion con nombre de plantilla y recomendacion de ocultarla si solo debe retirarse de previews publicas y exportaciones.
- El boton de papelera tiene `aria-label` descriptivo para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal con una plantilla mockeada desde `/api/v1/cv-templates`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de archivado en versiones CV

- `/admin/cv/versions` ya no archiva versiones directamente desde el boton de papelera.
- Se añade modal de confirmacion con nombre de version y explicacion de la alternativa de cambiar estado.
- El boton destructivo tiene `aria-label` con el nombre de la version para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal de archivado con `CV Adaptado`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de borrado en mensajes de contacto

- `/admin/messages` ya no borra mensajes directamente desde la lista ni desde el detalle.
- Se añade modal de confirmacion con nombre y email del remitente.
- Los botones destructivos usan `aria-label` descriptivo para navegacion accesible.
- Añadida cobertura e2e para abrir y cancelar el modal con el mensaje `Recruiter Demo`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Segmentacion basica de analitica por evento

- `GET /api/v1/analytics` acepta query param opcional `type` para filtrar eventos por tipo.
- `/admin/analytics` incorpora selector de tipo de evento y aplica el filtro a tabla, tendencias y CSV.
- El resumen de tarjetas mantiene lectura global por rango de fechas para no mezclar semanticas.
- `docs/api.md` documenta el nuevo query param.
- Añadidos tests unitarios de API y cobertura e2e desktop/mobile para segmentar por `cv_download`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Confirmacion de cambios grandes en JSON de CV

- `/admin/cv/versions` detecta cambios grandes en el JSON estructurado antes de guardar.
- Si el payload supera el umbral definido o cambia mucho respecto al JSON cargado, se muestra modal de confirmacion.
- El guardado real sigue usando `PATCH /api/v1/cv-versions/:id` y no se ejecuta si el usuario cancela.
- Añadida cobertura e2e para JSON valido grande, apertura del modal y cierre antes de continuar.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Validacion basica de tokens en plantillas CV

- `/admin/cv/templates` valida que el color principal tenga formato HEX antes de crear plantilla.
- El campo de densidad pasa de texto libre a selector `normal` / `compact`.
- La configuracion enviada a la API normaliza densidad desconocida a `normal`.
- Añadida cobertura e2e para bloquear color no HEX y conservar el flujo de borrado con confirmacion.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Preview embebido de plantillas CV admin

- `/admin/cv/templates` muestra una mini preview por plantilla dentro de cada tarjeta.
- La preview aplica `primaryColor`, `fontFamily` y `density` desde la configuracion de la plantilla.
- Si los tokens llegan incompletos, se usan valores seguros para mantener render estable.
- Añadida cobertura e2e para validar la preview de `ATS-friendly`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Editor JSON de configuracion en plantillas CV

- `/admin/cv/templates` incorpora editor JSON para la `config` completa de la plantilla seleccionada.
- El editor valida que la config sea un objeto, que `primaryColor` sea HEX si existe y que `density` sea `normal` o `compact`.
- El guardado usa `PATCH /api/v1/cv-templates/:id` y mantiene feedback de carga/error/éxito.
- Añadida cobertura e2e para bloquear una lista raiz `[]` antes de guardar.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Callback OAuth de LinkedIn

- `GET /api/v1/integrations/linkedin/callback` intercambia `code` por token cuando LinkedIn OAuth esta configurado.
- El callback consulta OpenID `userinfo` y devuelve perfil sanitizado sin exponer el access token.
- El endpoint queda protegido para admin igual que `auth-url`.
- `docs/api.md` y `/admin/settings` documentan el callback.
- Añadidos tests unitarios con `fetch` mockeado para token/userinfo y cobertura e2e de visibilidad del endpoint.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Baja soft-delete en biblioteca Media

- `/admin/media` muestra accion de eliminar por asset registrado.
- La accion abre modal de confirmacion antes de llamar a `DELETE /api/v1/media/:id`.
- Tras borrar, el asset se retira de la lista local y se muestra feedback con nombre de archivo.
- Añadida cobertura e2e para abrir y cancelar el modal con `CV Demo.pdf`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Metricas de uso en storage Media

- `GET /api/v1/media/storage/status` devuelve `assetCount`, `usedBytes` y `usedMb` para assets activos.
- `/admin/media` muestra badges de numero de assets y uso de almacenamiento.
- `docs/api.md` documenta las nuevas metricas del endpoint.
- Añadido test unitario de `MediaService.storageStatus` y cobertura e2e de los badges.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Cuota opcional de storage Media

- Añadida variable `MEDIA_STORAGE_QUOTA_MB` para configurar cuota total de assets activos.
- `MediaService.upload` rechaza subidas que superarian la cuota antes de escribir el archivo.
- `GET /api/v1/media/storage/status` expone `quotaMb` cuando esta configurada.
- `/admin/media` muestra badge de cuota y `docs/api.md` documenta la variable nueva.
- Añadidos tests unitarios de cuota y cobertura e2e del badge.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Auditoria granular en Media

- `POST /api/v1/media/upload` registra `AuditLog` con usuario, asset y metadata no sensible.
- `DELETE /api/v1/media/:id` registra `AuditLog` al aplicar soft delete.
- El controlador propaga `CurrentUser` al servicio de Media para asociar actor cuando exista.
- `docs/api.md` documenta la auditoria de upload/delete.
- Añadidos tests unitarios para auditoria de subida y baja.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Purga fisica diferida de Media local

- `POST /api/v1/media/storage/purge-deleted` permite a `admin` purgar archivos locales de assets ya marcados con `deletedAt`.
- La purga usa `retentionDays` opcional y `dryRun` para revisar candidatos sin borrar archivos.
- `MediaStorageService.deleteLocalFile` valida que el archivo este dentro de `STORAGE_DIR` antes de eliminarlo.
- Los assets purgados limpian `storageKey` y registran metadata de borrado fisico.
- La accion registra `AuditLog` con actor, candidatos y resumen de archivos eliminados o ausentes.
- `docs/api.md` documenta el endpoint y sus efectos.
- Añadidos tests unitarios de purga real, `dryRun` y borrado local seguro.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Guard de permisos por accion

- Añadido `RequirePermissions` y `PermissionsGuard` para proteger endpoints por permiso granular.
- La matriz de permisos vive ahora en `common/permissions/permission-matrix.ts`, evitando duplicarla en `UsersService`.
- `/api/v1/users` usa el permiso `manage_users` para listar, crear, editar, eliminar y consultar la matriz.
- `docs/api.md` documenta el primer endpoint migrado a permisos por accion.
- Añadido test unitario para permitir admin, rechazar editor en `manage_users` y respetar rutas sin permisos explícitos.
- Corregido un selector e2e ambiguo de `Plantilla` usando coincidencia exacta.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permiso granular en Analytics

- `GET /api/v1/analytics/summary` usa `read_analytics` mediante `PermissionsGuard`.
- `GET /api/v1/analytics` usa `read_analytics` mediante `PermissionsGuard`.
- `POST /api/v1/analytics/events` se mantiene publico para registrar eventos anonimos igual que antes.
- `docs/api.md` marca los endpoints protegidos de analitica con `read_analytics`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permiso granular en Dashboard admin

- `GET /api/v1/admin/dashboard` usa `read_dashboard` mediante `PermissionsGuard`.
- La matriz de permisos incluye `read_dashboard` en `admin`, `editor` y `viewer`, preservando el acceso previo por roles.
- `docs/api.md` marca los endpoints de dashboard con `read_dashboard`.
- Añadido test unitario para confirmar que `editor` conserva acceso al dashboard.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permisos granulares en mensajes de contacto

- `GET /api/v1/contact-messages`, `GET /api/v1/contact-messages/:id` y `GET /api/v1/contact-messages/webhook/status` usan `read_messages`.
- `PATCH /api/v1/contact-messages/:id/status`, `DELETE /api/v1/contact-messages/:id` y `POST /api/v1/contact-messages/webhook/test` usan `manage_messages`.
- La matriz de permisos conserva lectura de mensajes para `viewer` y añade gestion de mensajes para `admin` y `editor`.
- `POST /api/v1/contact-messages` se mantiene publico con rate limiting para el formulario.
- `docs/api.md` documenta permisos de lectura/gestion de mensajes listados.
- Añadidos tests unitarios para lectura de mensajes por `viewer` y rechazo de gestion por `viewer`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permisos granulares en Media

- Los endpoints protegidos de subida, edicion, baja soft-delete y estado de storage usan `manage_media`.
- `POST /api/v1/media/storage/purge-deleted` usa `purge_media`, reservado a `admin`.
- Los endpoints publicos de listado, detalle y descarga de media se mantienen sin autenticacion.
- `docs/api.md` documenta `manage_media` y `purge_media`.
- Añadidos tests unitarios para permitir gestion de media a `editor` y rechazar purga fisica a `editor`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permisos granulares en Profile y Theme

- `PATCH /api/v1/profile` usa `manage_portfolio` mediante `PermissionsGuard`.
- `PATCH /api/v1/theme` usa `manage_portfolio` mediante `PermissionsGuard`.
- `GET /api/v1/profile` y `GET /api/v1/theme` se mantienen publicos.
- `docs/api.md` documenta el permiso de escritura de ambos recursos.
- Añadidos tests unitarios para permitir `manage_portfolio` a `editor` y rechazarlo a `viewer`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permisos granulares en CRUD CMS genericos

- La fabrica `createResourceController` usa `manage_portfolio` en `POST`, `PATCH` y `DELETE`.
- Quedan cubiertos experiencias, educacion, certificaciones, skills, categorias, proyectos, page sections y app modules.
- Los `GET` publicos de estas entidades se mantienen sin autenticacion igual que antes.
- `docs/api.md` documenta la escritura de los CRUD CMS con `manage_portfolio`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permisos granulares en CV Manager

- `CvController` usa `manage_cv` en creacion, edicion, importacion, generacion, ATS, adaptacion y comparacion.
- `CvVersionsController` usa `read_cv` para listar/ver versiones y `manage_cv` para crear, editar, generar, publicar y archivar.
- `cv-templates` y `cv-target-roles` usan `manage_cv` en escritura gracias al permiso configurable de `createResourceController`.
- Las rutas publicas `GET /api/v1/cv` y `GET /api/v1/cv/:id` se mantienen sin autenticacion.
- `docs/api.md` documenta `read_cv` y `manage_cv`.
- Añadidos tests unitarios para lectura CV por `viewer` y rechazo de gestion CV por `viewer`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permisos granulares en Publication

- `GET /api/v1/admin/publication/theme/review`, `profile/review` y `changelog` usan `read_publication`.
- `POST /api/v1/admin/publication/theme/publish`, `profile/publish` y `changelog/:id/restore` usan `manage_publication`.
- La matriz conserva lectura para `viewer` y gestion para `admin`/`editor`.
- `docs/api.md` documenta `read_publication` y `manage_publication`.
- Añadidos tests unitarios para lectura publication por `viewer` y rechazo de gestion publication por `viewer`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Permisos granulares en Integrations

- `GET /api/v1/integrations/linkedin/auth-url` usa `manage_integrations`.
- `GET /api/v1/integrations/linkedin/callback` usa `manage_integrations`.
- `GET /api/v1/integrations/linkedin/status` y `share-url` se mantienen publicos.
- La matriz reserva `manage_integrations` a `admin`.
- `docs/api.md` documenta `manage_integrations`.
- Añadidos tests unitarios para permitir integraciones a `admin` y rechazarlas a `editor`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Retirada de RolesGuard legacy

- Eliminados `roles.guard.ts` y `roles.decorator.ts` tras completar el barrido de controladores protegidos.
- `rg "RolesGuard|@Roles"` no devuelve usos en `apps/api/src`.
- La proteccion privada actual queda basada en `JwtAuthGuard` + `PermissionsGuard` + `RequirePermissions`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Politica MFA obligatoria por rol

- Añadida variable `AUTH_MFA_REQUIRED_ROLES` para forzar MFA por rol sin activarlo por defecto en seed.
- Si un rol requerido intenta iniciar sesion sin MFA confirmado, la API no emite tokens.
- El bloqueo se registra en `AuditLog` con accion `auth.mfa.policy_blocked_login` sin secretos.
- `GET /api/v1/auth/mfa/status` incluye `policyRequired`.
- `.env.example` y `docs/api.md` documentan la politica.
- Añadidos tests unitarios de bloqueo por politica y estado `policyRequired`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### ATS por oferta concreta

- Añadido `POST /api/v1/cv/:id/ats-role-report` protegido con `manage_cv`.
- El reporte compara la version primaria del CV contra una descripcion de oferta concreta.
- Devuelve `matchScore`, `jobKeywords`, `matchedKeywords`, `missingKeywords` y recomendaciones de revision.
- La logica no modifica el CV ni inventa experiencia; marca faltantes como puntos a revisar.
- `docs/api.md` documenta request/response esperado del endpoint.
- Añadidos tests unitarios para coincidencias reales y keywords ausentes.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Configuracion Prisma preparada para v7

- Añadido `apps/api/prisma.config.ts` con `schema`, `migrations.path` y `migrations.seed`.
- Eliminado `package.json#prisma.seed` para evitar el aviso de deprecacion hacia Prisma 7.
- Añadido `dotenv` como dependencia directa de API y carga explicita de `.env` en `prisma.config.ts`.
- `npm.cmd run db:generate` detecta `prisma.config.ts` y genera Prisma Client correctamente.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`
- `npm.cmd audit --audit-level=moderate` sigue reportando las 2 vulnerabilidades moderadas conocidas de Next/PostCSS, no corregibles sin `--force`.

### `html lang` SSR por locale

- `RootLayout` lee el pathname desde `x-pathname` y renderiza `lang="es"` o `lang="en"` desde servidor.
- `src/proxy.ts` propaga `x-pathname` para rutas publicas y admin manteniendo la redireccion de `/admin` sin cookie.
- Añadida cobertura e2e para comprobar `html[lang=es]` en `/` y `html[lang=en]` en `/en`.
- La mejora hace que el root layout sea dinamico, asumido como coste aceptable porque la app ya usa datos/API en la mayoria de rutas.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Privacidad y retención configurable en Analytics

- `ANALYTICS_IP_HASH_SALT` permite saltear el hash de IP sin guardar direcciones en claro.
- `ANALYTICS_STORE_USER_AGENT=false` evita persistir user-agent en nuevos eventos.
- `ANALYTICS_RETENTION_DAYS` habilita purga de eventos anteriores al umbral configurado.
- `GET /api/v1/analytics/privacy` expone solo configuración no sensible de privacidad.
- `POST /api/v1/analytics/retention/prune` ejecuta purga protegida con `manage_analytics`.
- `.env.example`, `README.md`, `docs/api.md` y `docs/deployment.md` documentan las variables y endpoints.
- Añadidos tests unitarios para hash con sal, descarte de user-agent y purga por retención.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Descarga pública de CV con override de plantilla

- Añadido `GET /api/v1/cv/download?template=ats-friendly` para descargar el PDF de la versión primaria con una plantilla pública concreta.
- Si `template` se omite, la descarga usa la plantilla asociada a la versión primaria.
- El override se persiste como `MediaAsset` y `CvGeneratedFile`, pero no pisa `generatedPdfId` de la versión primaria.
- Las páginas públicas `/cv/templates`, `/cv/templates/[slug]`, `/en/cv/templates` y `/en/cv/templates/[slug]` enlazan al endpoint correcto.
- La galería pública permite descargar cada plantilla directamente además de abrir el preview.
- `docs/api.md` documenta el contrato público de descarga.
- Añadidos tests unitarios del servicio CV y cobertura e2e de hrefs de descarga por plantilla.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Series históricas de Analytics

- Añadido `GET /api/v1/analytics/timeseries` protegido con `read_analytics`.
- El endpoint agrupa eventos por día y tipo, con días vacíos cuando el filtro incluye `from` y `to`.
- `/admin/analytics` consume la serie histórica desde la API para calcular días activos, día principal, total filtrado y top de eventos.
- El panel muestra una serie diaria compacta además del top de eventos.
- `docs/api.md` documenta el endpoint y su comportamiento con días sin eventos.
- Añadidos tests unitarios para agregación diaria y cobertura e2e del panel de analítica.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Segmentación operativa en Dashboard admin

- `GET /api/v1/admin/dashboard` devuelve `segments.analytics` con visitas landing, descargas CV, formularios y vistas de proyecto.
- `segments.content` resume proyectos publicados, experiencias visibles y módulos activos/totales.
- `/admin` muestra la nueva sección `Segmentacion operativa` con barras proporcionales por grupo.
- `docs/api.md` documenta el nuevo payload de segmentos.
- Añadidos tests unitarios del servicio admin y cobertura e2e del dashboard.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Escaneo básico de firma en uploads media

- `MediaStorageService` bloquea la firma de prueba EICAR antes de escribir archivos en storage local.
- `MEDIA_SIGNATURE_SCAN_ENABLED=false` permite desactivar el bloqueo en entornos controlados.
- `GET /api/v1/media/storage/status` expone `signatureScanEnabled`.
- `/admin/media` muestra el estado `scan on/off` en los badges de almacenamiento.
- `.env.example`, `README.md`, `docs/deployment.md` y `docs/api.md` documentan la variable y sus límites.
- Añadidos tests unitarios del storage y cobertura e2e del badge en media.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Privacidad configurable en mensajes de contacto

- `CONTACT_IP_HASH_SALT` permite saltear el hash de IP de nuevos mensajes.
- `CONTACT_STORE_USER_AGENT=false` evita persistir user-agent en nuevos mensajes.
- El saneado HTML, normalización de email y webhook no cambian.
- `.env.example`, `README.md`, `docs/deployment.md` y `docs/api.md` documentan las variables.
- Añadido test unitario para hash con sal y descarte de user-agent.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Adaptación CV a versión borrador

- `/admin/cv/adapt` permite crear una `CvVersion` draft desde la propuesta generada.
- La nueva versión conserva `pendingReview`, `createdFromRequestId` y el JSON propuesto por backend.
- La versión se crea con la misma `cvId`, idioma y plantilla de la versión base seleccionada.
- El flujo mantiene la guardrail: no publica ni marca primaria la versión adaptada automáticamente.
- Añadida cobertura e2e del flujo proponer adaptación -> crear versión borrador.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Tracking server-side de descargas CV

- `GET /api/v1/cv/download` registra `cv_download` desde backend al generar una descarga pública.
- El evento incluye `label=primary_cv` o el slug de plantilla solicitado.
- La ruta conserva la descarga directa de PDF y no depende de tracking frontend.
- `CvModule` importa `AnalyticsModule` para usar `AnalyticsService` sin acceso directo desde frontend a base de datos.
- `docs/api.md` documenta el tracking de la descarga.
- Añadida spec unitaria de `CvController` para headers de descarga y evento analítico.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Panel de privacidad y retención Analytics

- `/admin/analytics` muestra `retentionDays`, persistencia de user-agent y estado de sal IP desde `GET /api/v1/analytics/privacy`.
- El panel permite ejecutar `POST /api/v1/analytics/retention/prune` cuando hay retención configurada.
- La acción recarga los datos y muestra cuántos eventos fueron purgados.
- Añadidos tipos y cliente API frontend para privacidad y purga de retención.
- Añadida cobertura e2e del estado y acción de purga en el panel.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Trazabilidad persistente de webhooks de contacto

- `ContactWebhookService` registra cada entrega configurada en `AuditLog` con evento, resultado y estado HTTP cuando existe.
- Las pruebas manuales sin webhook configurado también dejan rastro de intento administrativo.
- La auditoría evita guardar URL, secreto, payload del mensaje o contenido personal del contacto.
- `docs/api.md` documenta la trazabilidad y sus límites de privacidad.
- Añadidos tests unitarios para entrega correcta, fallback sin URL y test manual no configurado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Historial admin de entregas webhook

- Añadido `GET /api/v1/contact-messages/webhook/deliveries` protegido con `read_messages`.
- El endpoint devuelve las 10 últimas entregas auditadas, normalizadas y sin metadatos sensibles.
- `/admin/settings` muestra el historial con evento, resultado, estado HTTP/error, fecha y referencia de mensaje cuando existe.
- El botón de actualizar recarga estado e historial de webhook.
- `docs/api.md` documenta el nuevo endpoint.
- Añadidos tests unitarios del historial y cobertura e2e de la card en settings.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Segmentacion por fuente y canal en Analytics

- `POST /api/v1/analytics/events` acepta `source` y `channel` opcionales y los guarda como metadata de atribucion.
- El cliente publico deriva fuente/canal desde `utm_source`, `utm_medium` o referrer externo.
- Añadido `GET /api/v1/analytics/channels` con filtros `from`, `to` y `type`.
- `/admin/analytics` muestra los 8 principales segmentos de fuentes y canales.
- `docs/api.md` documenta el nuevo endpoint y la estrategia de atribucion.
- Añadidos tests unitarios para persistencia/agregacion y cobertura e2e del panel.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Embudo basico de conversion Analytics

- Añadido `GET /api/v1/analytics/funnel` con filtros temporales `from` y `to`.
- El endpoint calcula el embudo fijo landing -> descarga CV -> formulario contacto.
- Cada paso devuelve conteo, ratio desde landing y ratio desde el paso anterior.
- `/admin/analytics` muestra el bloque `Embudo conversion` junto al resumen y tendencias.
- `docs/api.md` documenta el endpoint y sus ratios.
- Añadidos tests unitarios del calculo y cobertura e2e del panel.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Cohorts mensuales en Dashboard admin

- `GET /api/v1/admin/dashboard` devuelve `segments.cohorts` con visitas landing agrupadas por mes.
- Los cohorts respetan filtros temporales `from` y `to` y se limitan a los 6 periodos recientes.
- `/admin` muestra una card `Cohorts mensuales` con barras de visitas por periodo.
- `docs/api.md` documenta el nuevo campo del payload de dashboard.
- Añadidos tests unitarios del servicio admin y cobertura e2e del dashboard.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Edicion completa de Skills desde UI

- `/admin/portfolio/skills` añade accion `Editar` por fila.
- El dialogo permite modificar nombre, categoria, nivel, orden y visibilidad.
- El guardado usa `PATCH /api/v1/skills/:id` y recarga el listado.
- La tabla amplía el area de acciones para editar, ocultar, reordenar y borrar sin solapamientos.
- Añadida cobertura e2e del flujo editar skill -> guardar -> mensaje de exito.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Gestion de categorias de Skills

- `/admin/portfolio/skills` lista categorias desde `GET /api/v1/skill-categories?includeHidden=true`.
- El panel permite crear categorias con nombre, orden y visibilidad.
- Las categorias pueden ocultarse/mostrarse desde la misma vista.
- Los formularios de crear/editar skill usan las categorias como sugerencias.
- `docs/api.md` lista el endpoint genérico de `skill-categories`.
- Añadida cobertura e2e para listar, crear y ocultar categoria.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Selector consistente de niveles Skills

- Los formularios de crear y editar skill reemplazan el texto libre de nivel por selector.
- Opciones disponibles: sin nivel, Basico, Intermedio, Avanzado y Experto.
- El guardado conserva la misma API y envia `null` cuando no hay nivel seleccionado.
- Añadida cobertura e2e del selector en el dialogo de edicion.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Gestion de categorias de Proyectos

- `/admin/portfolio/projects` lista categorias desde `GET /api/v1/project-categories?includeHidden=true`.
- El panel permite crear categorias con nombre, orden y visibilidad.
- Las categorias pueden ocultarse/mostrarse desde la misma vista.
- El formulario de crear proyecto usa las categorias como sugerencias.
- `docs/api.md` lista el endpoint genérico de `project-categories`.
- Añadida cobertura e2e para listar, crear y ocultar categoria de proyecto.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Edicion completa de Proyectos desde UI

- `/admin/portfolio/projects` añade accion `Editar` por fila.
- El dialogo permite modificar nombre, descripcion, categoria, tecnologias, imagen, URLs, estado y flags.
- El guardado usa `PATCH /api/v1/projects/:id`, conserva el orden y recalcula slug desde el nombre.
- La tabla amplía el area de acciones para editar, ocultar, destacar, archivar y borrar sin solapamientos.
- Añadida cobertura e2e del flujo editar proyecto -> guardar -> mensaje de exito.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Edicion completa de Estudios desde UI

- `/admin/portfolio/education` añade accion `Editar` por fila.
- El dialogo permite modificar titulo, institucion, fecha, tipo, descripcion, URL de certificado, adjunto y visibilidad.
- El guardado usa `PATCH /api/v1/education/:id`, conserva el orden y recarga el listado.
- La tabla amplía el area de acciones para editar, ocultar, reordenar y borrar sin solapamientos.
- Añadida cobertura e2e del flujo editar estudio -> guardar -> mensaje de exito.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Edicion completa de Certificaciones desde UI

- `/admin/portfolio/certifications` añade accion `Editar` por fila.
- El dialogo permite modificar titulo, institucion, fecha, descripcion, URL de certificado, adjunto y visibilidad.
- El guardado usa `PATCH /api/v1/certifications/:id`, conserva el orden y recarga el listado.
- La tabla amplía el area de acciones para editar, ocultar, reordenar y borrar sin solapamientos.
- Añadida cobertura e2e del flujo editar certificacion -> guardar -> mensaje de exito.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Edicion completa de Experiencias desde UI

- `/admin/portfolio/experience` añade accion `Editar` por fila.
- El dialogo permite modificar empresa, cargo, fechas, actualidad, ubicacion, modalidad, descripcion, logros, responsabilidades, tecnologias, metodologias, skills y flags.
- El guardado usa `PATCH /api/v1/experiences/:id`, conserva el orden y recarga el listado.
- La tabla amplía el area de acciones para editar, ocultar, destacar y borrar sin solapamientos.
- Añadida cobertura e2e del flujo editar experiencia -> guardar -> mensaje de exito.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Reordenado rapido de Experiencias

- `/admin/portfolio/experience` añade acciones `Subir` y `Bajar` por fila.
- Los botones actualizan `order` mediante `PATCH /api/v1/experiences/:id` y recargan el listado.
- Las acciones tienen labels accesibles para uso por teclado y cobertura e2e.
- El mensaje de acciones rapidas se conserva despues de recargar datos desde la API.
- Añadida cobertura e2e del flujo subir experiencia -> mensaje de reordenado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Reordenado rapido de Proyectos

- `/admin/portfolio/projects` añade acciones `Subir` y `Bajar` por fila.
- Los botones actualizan `order` mediante `PATCH /api/v1/projects/:id` y recargan el listado.
- Las acciones tienen labels accesibles para uso por teclado y cobertura e2e.
- El mensaje de acciones rapidas se conserva despues de recargar datos desde la API.
- Añadida cobertura e2e del flujo subir proyecto -> mensaje de reordenado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Reordenado rapido de Estudios

- `/admin/portfolio/education` consolida las acciones `Subir` y `Bajar` por fila con labels accesibles.
- Los botones actualizan `order` mediante `PATCH /api/v1/education/:id` y recargan el listado.
- El mensaje de acciones rapidas se conserva despues de recargar datos desde la API.
- Añadida cobertura e2e del flujo subir estudio -> mensaje de reordenado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Reordenado rapido de Certificaciones

- `/admin/portfolio/certifications` consolida las acciones `Subir` y `Bajar` por fila con labels accesibles.
- Los botones actualizan `order` mediante `PATCH /api/v1/certifications/:id` y recargan el listado.
- El mensaje de acciones rapidas se conserva despues de recargar datos desde la API.
- Añadida cobertura e2e del flujo subir certificacion -> mensaje de reordenado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Selector de media para imagenes de Proyectos

- `/admin/portfolio/projects` carga la biblioteca media desde `GET /api/v1/media` junto con proyectos y categorias.
- Los formularios de crear y editar proyecto mantienen el campo manual de imagen y añaden selector de assets `image/*`.
- Al elegir una imagen de media, la UI copia su URL al campo `imageUrl` usado por `PATCH /api/v1/projects/:id`.
- El selector ignora assets no visuales como PDFs y muestra fallback cuando no hay imagenes.
- Añadida cobertura e2e del flujo editar proyecto -> seleccionar imagen media -> guardar.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Selector de media para adjuntos de Estudios

- `/admin/portfolio/education` carga la biblioteca media desde `GET /api/v1/media` junto con estudios.
- Los formularios de crear y editar estudio mantienen el campo manual `attachmentId` y añaden selector de assets media.
- Al elegir un asset, la UI copia su `id` al campo enviado como `attachmentId`.
- Añadida cobertura e2e del flujo editar estudio -> seleccionar adjunto media -> guardar.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Selector de media para adjuntos de Certificaciones

- `/admin/portfolio/certifications` carga la biblioteca media desde `GET /api/v1/media` junto con certificaciones.
- Los formularios de crear y editar certificacion mantienen el campo manual `attachmentId` y añaden selector de assets media.
- Al elegir un asset, la UI copia su `id` al campo enviado como `attachmentId`.
- Añadida cobertura e2e del flujo editar certificacion -> seleccionar adjunto media -> guardar.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Selector de media para avatar y Open Graph

- `/admin/portfolio` carga la biblioteca media desde `GET /api/v1/media` junto con perfil y revision de publicacion.
- El editor mantiene los campos manuales `avatarUrl` y `ogImageUrl`.
- Los nuevos selectores muestran solo assets `image/*` y copian su URL al borrador del perfil.
- El flujo respeta draft/publish: seleccionar media no publica automaticamente el perfil.
- Añadida cobertura e2e del flujo seleccionar avatar/OG desde media -> guardar borrador.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Reordenado rapido de Skills

- `/admin/portfolio/skills` consolida las acciones `Subir` y `Bajar` por fila con labels accesibles.
- Los botones actualizan `order` mediante `PATCH /api/v1/skills/:id` y recargan el listado.
- El mensaje de acciones rapidas se conserva despues de recargar datos desde la API.
- Añadida cobertura e2e del flujo subir skill -> mensaje de reordenado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Resumen en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Resumen profesional CV`.
- El bloque lee `structuredJson.summary` de la version seleccionada.
- `Aplicar resumen` actualiza el JSON estructurado sin guardar automaticamente.
- El guardado sigue usando `PATCH /api/v1/cv-versions/:id` con la validacion JSON existente.
- Añadida cobertura e2e del flujo editar resumen por bloque -> aplicar -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Skills en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Skills CV`.
- El bloque lee `structuredJson.skills` de la version seleccionada y lo muestra como lista editable.
- `Aplicar skills` convierte cada linea en un objeto `{ name }` dentro de `structuredJson.skills`.
- El guardado sigue usando `PATCH /api/v1/cv-versions/:id` con la validacion JSON existente.
- Añadida cobertura e2e del flujo editar skills por bloque -> aplicar -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Idiomas en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Idiomas CV`.
- El bloque lee `structuredJson.languages` de la version seleccionada y lo muestra como lista editable.
- `Aplicar idiomas` admite lineas `Idioma - Nivel` y actualiza `structuredJson.languages`.
- El guardado sigue usando `PATCH /api/v1/cv-versions/:id` con la validacion JSON existente.
- Añadida cobertura e2e del flujo editar idiomas por bloque -> aplicar -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Proyectos en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Proyectos CV`.
- El bloque lee `structuredJson.projects` de la version seleccionada y lo muestra como lista editable.
- `Aplicar proyectos` convierte cada linea en un objeto `{ name }` dentro de `structuredJson.projects`.
- El guardado sigue usando `PATCH /api/v1/cv-versions/:id` con la validacion JSON existente.
- Añadida cobertura e2e del flujo editar proyectos por bloque -> aplicar -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Educacion en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Educacion CV`.
- El bloque lee `structuredJson.education` de la version seleccionada y lo muestra como lista editable.
- `Aplicar educacion` admite lineas `Titulo - Institucion - Fecha` y actualiza `structuredJson.education`.
- El guardado sigue usando `PATCH /api/v1/cv-versions/:id` con la validacion JSON existente.
- Añadida cobertura e2e del flujo editar educacion por bloque -> aplicar -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Certificaciones en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Certificaciones CV`.
- El bloque lee `structuredJson.certifications` de la version seleccionada y lo muestra como lista editable.
- `Aplicar certificaciones` admite lineas `Titulo - Institucion - Fecha` y actualiza `structuredJson.certifications`.
- El guardado sigue usando `PATCH /api/v1/cv-versions/:id` con la validacion JSON existente.
- Añadida cobertura e2e del flujo editar certificaciones por bloque -> aplicar -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Experiencia en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Experiencia CV`.
- El bloque lee `structuredJson.experiences` y tambien soporta `structuredJson.experience` como legado de lectura.
- `Aplicar experiencia` admite lineas `Rol - Empresa - Periodo` y actualiza `structuredJson.experiences` con campos compatibles con exportacion/adaptacion.
- La validacion del JSON estructurado ahora comprueba tambien que `experiences` sea una lista.
- Añadida cobertura e2e del flujo editar experiencia por bloque -> aplicar -> confirmar cambio grande -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Bloque Secciones personalizadas en editor de Versiones CV

- `/admin/cv/versions` añade un bloque estructurado `Secciones personalizadas CV`.
- El bloque lee `structuredJson.sections` de la version seleccionada y lo muestra como lista editable.
- `Aplicar secciones` admite lineas `Titulo: contenido` y actualiza `structuredJson.sections`.
- El guardado sigue usando `PATCH /api/v1/cv-versions/:id` con confirmacion para cambios grandes.
- Añadida cobertura e2e del flujo editar secciones personalizadas por bloque -> aplicar -> confirmar cambio grande -> guardar JSON.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Preservacion de campos ricos al aplicar bloques CV

- Los bloques simples de `/admin/cv/versions` conservan objetos existentes cuando coinciden por nombre, titulo o rol/empresa.
- Skills, idiomas, proyectos, educacion, certificaciones, experiencia y secciones ya no descartan metadata, descripciones, responsabilidades o contenido adicional al aplicar una lista simple.
- Experiencia preserva `description`, `responsibilities`, `achievements` y otros campos existentes si el rol/empresa coincide.
- Añadida cobertura e2e para comprobar que experiencia y proyectos mantienen detalles ricos al aplicar bloques.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Duplicado de versiones CV

- `/admin/cv/versions` añade accion `Duplicar` por version.
- El duplicado crea una nueva `CvVersion` en estado `draft`, con slug unico, misma plantilla y mismo `structuredJson`.
- La version original no cambia y la copia queda lista para edicion/adaptacion antes de publicar.
- Añadida cobertura e2e del flujo duplicar version -> crear draft -> mostrar confirmacion.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Renderer HTML de CV con secciones estructuradas

- `CvExportService.renderHtml` ya renderiza resumen, experiencia, formacion/certificaciones, skills, idiomas, proyectos y secciones personalizadas.
- El HTML aplica tokens de plantilla existentes: tipografia, color principal y densidad.
- Añadido escape HTML basico para contenido de CV antes de renderizar en server-side HTML.
- Añadida cobertura unitaria para secciones estructuradas y escaping.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Auditoria de acciones en Versiones CV

- `CvVersionService` registra `AuditLog` al crear, actualizar, archivar, marcar principal y generar PDF/DOCX de versiones CV.
- `CvVersionsController` pasa el usuario autenticado al servicio para asociar las acciones admin.
- La auditoria usa `resource: cv-version`, `resourceId` y metadata con campos cambiados, estado, plantilla o media generada segun accion.
- Añadida cobertura unitaria para creacion, actualizacion, marcar principal y generacion PDF.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Vista de auditoria reciente en Versiones CV

- `GET /api/v1/cv-versions/audit-log` expone los ultimos eventos `AuditLog` de `resource=cv-version`.
- `/admin/cv/versions` muestra una seccion `Auditoria reciente CV` con accion, metadata resumida y fecha.
- La carga de auditoria es tolerante a errores y no bloquea la gestion de versiones.
- Añadida cobertura unitaria del endpoint de servicio y cobertura e2e de la seccion en UI.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Filtro de auditoria en Versiones CV

- `GET /api/v1/cv-versions/audit-log?action=...` permite filtrar trazas por accion.
- `/admin/cv/versions` añade selector de accion para ver todos los eventos o acciones concretas como `update`, `generate_pdf` y `set_primary`.
- La UI recarga auditoria sin bloquear el resto de datos de versiones.
- Añadida cobertura unitaria del filtro API y cobertura e2e del selector de auditoria.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Detalle de eventos de auditoria en Versiones CV

- `/admin/cv/versions` añade accion `Detalle` en cada evento reciente de auditoria CV.
- El dialogo de detalle muestra accion, recurso, ID de recurso, fecha y metadata completa.
- La metadata conserva valores simples, listas y objetos JSON sin perder trazabilidad tecnica.
- Añadida cobertura e2e para abrir un evento `generate_pdf` y validar su `mediaAssetId`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Exportacion CSV de auditoria en Versiones CV

- `/admin/cv/versions` añade accion `Exportar auditoria CSV` sobre los eventos cargados.
- El CSV respeta el filtro actual de accion y genera nombres como `cv-version-audit-update.csv`.
- La exportacion incluye accion, recurso, ID de recurso, fecha y metadata JSON completa.
- Añadida cobertura e2e para descargar el CSV tras filtrar auditoria por `update`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Filtros avanzados de auditoria en Versiones CV

- `GET /api/v1/cv-versions/audit-log` admite filtros `action`, `from`, `to` y `userId`.
- El backend ignora fechas invalidas y trata `to=YYYY-MM-DD` como fin de dia inclusivo.
- `/admin/cv/versions` añade filtros de fecha y usuario junto al selector de accion.
- `docs/api.md` documenta los query params y el uso esperado del endpoint.
- Añadida cobertura unitaria del filtro API y cobertura e2e del request con fecha/usuario.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Paginacion de auditoria en Versiones CV

- `GET /api/v1/cv-versions/audit-log` admite `page` y `limit` con `limit` maximo de 100.
- El backend calcula `skip/take` para navegar el historico de auditoria sin cargar solo los ultimos 20 eventos.
- `/admin/cv/versions` pide paginas de 6 eventos y añade controles `Anterior`/`Siguiente`.
- `docs/api.md` documenta la paginacion del endpoint.
- Añadida cobertura unitaria de `skip/take` y cobertura e2e del request `page=2&limit=6`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Revision por bloques en Adaptar CV

- `/admin/cv/adapt` añade checkboxes para aceptar o rechazar `resumen`, `skills` y `experiencias`.
- Los bloques rechazados se omiten del `structuredJson` usado para crear la nueva `CvVersion` draft.
- `adaptationMeta` registra `acceptedBlocks` y `rejectedBlocks` para mantener trazabilidad de revision humana.
- La propuesta sigue marcada como `pendingReview`; no publica ni inventa datos automaticamente.
- Añadida cobertura e2e para rechazar `skills` y validar el payload enviado a `POST /cv-versions`.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Revision granular de skills en Adaptar CV

- `/admin/cv/adapt` añade checkboxes por cada skill propuesta.
- Al crear la version draft, las skills rechazadas se eliminan de `structuredJson.skills`.
- `adaptationMeta` registra `acceptedSkills` y `rejectedSkills` junto a la revision por bloques.
- El flujo permite combinar rechazo de bloques completos con rechazo de skills concretas.
- Añadida cobertura e2e para rechazar `KPIs`, mantener `UAT` y combinarlo con rechazo de otros bloques.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Revision granular de experiencias en Adaptar CV

- `/admin/cv/adapt` añade checkboxes por cada experiencia propuesta.
- Al crear la version draft, las experiencias rechazadas se eliminan de `structuredJson.experiences`.
- `adaptationMeta` registra `acceptedExperiences` y `rejectedExperiences`.
- La revision granular de experiencias puede combinarse con rechazo de resumen o skills individuales.
- Añadida cobertura e2e para rechazar `IT Project Manager - Demo Company` sin inventar datos.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Enlaces de revision tras adaptar CV

- Tras crear una `CvVersion` draft desde `/admin/cv/adapt`, la UI muestra acciones directas para comparar y editar.
- El enlace de comparacion incluye `baseId` y `adaptedId`.
- `/admin/cv/compare` lee `baseId` y `adaptedId` desde la URL para preseleccionar versiones.
- El enlace de edicion abre `/admin/cv/versions?versionId=...` para revisar el JSON estructurado de la nueva version.
- Añadida cobertura e2e para validar los enlaces y la navegacion al comparador.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Publicacion de version adaptada desde Comparar CV

- `/admin/cv/compare` añade accion explicita `Publicar version adaptada`.
- La accion llama a `POST /api/v1/cv-versions/:id/set-primary` usando la version adaptada seleccionada.
- La publicacion no se ejecuta automaticamente al crear la draft; queda separada de la revision.
- La UI confirma cuando la version adaptada queda publicada como CV principal.
- Añadida cobertura e2e del flujo revisar -> publicar version adaptada.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Auditoria visual de publicacion adaptada

- `GET /api/v1/cv-versions/audit-log` admite filtro `resourceId` para localizar trazas de una version concreta.
- Tras publicar desde `/admin/cv/compare`, la UI carga la ultima traza `set_primary` de la version adaptada.
- El comparador muestra un panel `Auditoria publicacion` con accion, recurso y fecha.
- `docs/api.md` documenta el nuevo filtro `resourceId`.
- Añadida cobertura e2e para validar la traza visual de publicacion.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Exportacion server-side de auditoria CV

- `GET /api/v1/cv-versions/audit-log/export` devuelve CSV server-side con el historico filtrado.
- La exportacion usa los mismos filtros `action`, `resourceId`, `from`, `to` y `userId`, pero no aplica paginacion.
- `/admin/cv/versions` añade enlace `Exportar historico CSV` con los filtros actuales.
- `docs/api.md` documenta el endpoint de exportacion.
- Añadida cobertura unitaria de CSV y cobertura e2e del enlace filtrado.

Verificacion realizada en este hito:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Acciones ATS desde Editor de CV

- `/admin/cv/editor` expone un panel `Validacion ATS` para el CV principal.
- La UI consume `GET /api/v1/cv/:id/ats-report` y muestra score, estado, checks, keywords y recomendaciones.
- La UI permite generar `PDF ATS` y `DOCX ATS` usando los endpoints protegidos ya existentes.
- El ultimo archivo ATS generado queda disponible mediante enlace de descarga a `GET /api/v1/media/:id/download`.
- Añadida cobertura e2e para reporte ATS, keywords y descarga del PDF ATS generado.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/editor` desktop con mocks de CV/ATS; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Comparacion ATS contra oferta

- `/admin/cv/editor` añade un bloque `Comparar contra oferta` dentro de `Validacion ATS`.
- La UI valida una descripcion minima antes de llamar al backend.
- La accion consume `POST /api/v1/cv/:id/ats-role-report` con puesto objetivo y descripcion de oferta.
- El panel muestra `matchScore`, keywords encontradas, keywords pendientes y recomendaciones de revision.
- Las recomendaciones mantienen la guardrail de no incorporar datos sin comprobar que existen en la experiencia real.
- Añadida cobertura e2e para payload enviado, match de oferta y keyword pendiente.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/editor` desktop con mocks de CV/ATS/oferta; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Auditoria CV dedicada por version

- `/admin/cv/versions` añade el filtro visible `Version auditoria`.
- Cada fila de version incluye accion `Auditoria` para filtrar el historico por su `resourceId`.
- La exportacion server-side `Exportar historico CSV` conserva el filtro de version junto a accion, fecha y usuario.
- La cobertura e2e valida que el request de auditoria y la URL de exportacion incluyen `resourceId=cv-base`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/versions` desktop con mocks de versiones/auditoria; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Timeline visual de auditoria CV por version

- Cuando `Version auditoria` tiene valor, `/admin/cv/versions` muestra `Timeline version CV`.
- La timeline usa los eventos ya filtrados por `resourceId`, accion, fecha y usuario.
- Cada evento resume accion, fecha y metadata principal para lectura rapida.
- Añadida cobertura e2e para verificar que la timeline aparece al filtrar `cv-base`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/versions` desktop con mocks de versiones/auditoria; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Historial agregado de publicaciones CV

- `/admin/cv/versions` añade accion rapida `Ver publicaciones CV`.
- La accion filtra auditoria por `action=set_primary` y limpia `resourceId` para ver publicaciones entre versiones.
- El panel `Historial publicaciones CV` resume version publicada, metadata principal y fecha.
- Añadida cobertura e2e para validar el filtro `set_primary`, limpieza de version y render del historial.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/versions` desktop con mocks de publicaciones; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Renderer HTML A4 server-side

- `CvExportService.renderHtml` añade `@page A4` y un contenedor `main.cv-page`.
- El contenedor HTML usa ancho `210mm`, alto minimo `297mm`, fondo blanco y padding por densidad.
- Los estilos de pantalla añaden fondo y sombra para revisar el documento como hoja A4.
- Añadida cobertura unitaria para CSS A4, contenedor `cv-page` y dimensiones.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Paridad de contenido PDF/DOCX CV

- `CvExportService.generatePdf` incluye proyectos destacados cuando existen en `structuredJson.projects`.
- `CvExportService.generatePdf` incluye secciones personalizadas desde `structuredJson.sections`.
- `CvExportService.generateDocx` añade las mismas secciones de proyectos y secciones personalizadas.
- Añadida cobertura unitaria para preparar filas de proyectos y secciones compartidas por exportaciones binarias.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Gestion admin de roles objetivo CV

- Anadida ruta protegida `/admin/cv/target-roles`.
- El CV Manager enlaza la gestion de roles objetivo desde `/admin/cv`.
- La UI consume `GET|POST|PATCH|DELETE /api/v1/cv-target-roles`.
- Permite crear, editar y archivar perfiles objetivo con keywords reutilizables.
- Los mensajes de exito se conservan tras refrescar datos desde la API.
- `docs/api.md` documenta el consumo admin del recurso.
- Anadida cobertura e2e desktop/mobile de crear, guardar y archivar roles objetivo.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/target-roles` desktop con mocks de roles objetivo; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Roles objetivo en Adaptar CV

- `/admin/cv/adapt` carga roles objetivo junto a las versiones base.
- Anadido selector `Rol objetivo guardado` en el wizard de adaptacion.
- Al seleccionar un rol, la UI precarga puesto objetivo, descripcion y keywords guardadas.
- El flujo sigue enviando `POST /api/v1/cv/adapt-to-role` sin cambiar la logica backend ni inventar datos.
- `docs/api.md` documenta que el wizard reutiliza `cv-target-roles`.
- Anadida cobertura e2e desktop/mobile para validar el prefill antes de proponer adaptacion.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/adapt` desktop con mocks de versiones y roles objetivo; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Persistencia de rol objetivo en adaptaciones CV

- Anadido `targetRoleId` opcional en `CvAdaptationRequest`.
- Anadida relacion Prisma desde `CvAdaptationRequest` hacia `CvTargetRole`.
- Anadida migracion `000004_add_cv_adaptation_target_role`.
- `AdaptCvDto` acepta `targetRoleId` opcional.
- `CvAdaptationService` valida que el rol objetivo exista y no este archivado antes de persistirlo.
- `adaptationMeta` incluye `targetRoleId` y `targetRolePreset` con id, nombre y keywords para auditoria.
- `/admin/cv/adapt` envia el `targetRoleId` seleccionado al backend.
- `docs/api.md` documenta el nuevo campo y su trazabilidad.
- Anadido test unitario de service y cobertura e2e del payload enviado.
- Estabilizada la accion e2e de guardado JSON tras error previo usando foco y Enter.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd --prefix apps/api run test -- cv-adaptation.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:api`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Draft/publish API para experiencias

- Anadidos `draftJson` y `publishedAt` al modelo `Experience`.
- Anadida migracion `000005_add_experience_publication`.
- `GET /api/v1/admin/publication/experiences/:id/review` devuelve diffs campo a campo.
- `POST /api/v1/admin/publication/experiences/:id/publish` publica el borrador, limpia `draftJson` y actualiza `publishedAt`.
- La publicacion valida campos obligatorios de experiencia: empresa, cargo, fecha de inicio y descripcion.
- `ChangeLog` y `AuditLog` registran publicaciones de experiencias.
- `POST /api/v1/admin/publication/changelog/:id/restore` soporta restaurar experiencias desde `beforeJson`.
- `docs/api.md` documenta endpoints nuevos y restore de experiencias.
- Anadida cobertura unitaria para review, publish y restore de experiencia.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd --prefix apps/api run test -- admin-publication.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### UI draft/publish para experiencias

- `/admin/portfolio/experience` permite guardar borradores de experiencias desde el dialogo de edicion.
- La UI llama a `PATCH /api/v1/experiences/:id` con `draftJson` sin publicar cambios directamente.
- La UI consume `GET /api/v1/admin/publication/experiences/:id/review` para mostrar diffs del borrador.
- El dialogo muestra una revision resumida con campos modificados, valor publicado y valor propuesto.
- La accion `Publicar borrador` llama a `POST /api/v1/admin/publication/experiences/:id/publish`.
- El modal de edicion usa altura maxima y scroll propio para mantener acciones visibles en mobile.
- La pantalla global de publicacion ya puede restaurar cambios de tipo `experience`.
- Anadida cobertura e2e desktop/mobile del flujo guardar borrador -> revisar -> publicar.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/portfolio/experience` con dialogo de borrador visible; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Draft/publish API para proyectos

- Anadidos `draftJson` y `publishedAt` al modelo `Project`.
- Anadida migracion `000006_add_project_publication`.
- `GET /api/v1/admin/publication/projects/:id/review` devuelve diffs campo a campo.
- `POST /api/v1/admin/publication/projects/:id/publish` publica el borrador, limpia `draftJson` y actualiza `publishedAt`.
- La publicacion valida campos obligatorios de proyecto: nombre, slug y descripcion.
- `ChangeLog` y `AuditLog` registran publicaciones de proyectos.
- `POST /api/v1/admin/publication/changelog/:id/restore` soporta restaurar proyectos desde `beforeJson`.
- Anadida cobertura unitaria para review, publish y restore de proyecto.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd --prefix apps/api run test -- admin-publication.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd --prefix apps/api run test:e2e`

### UI draft/publish para proyectos

- `/admin/portfolio/projects` permite guardar borradores de proyectos desde el dialogo de edicion.
- La UI llama a `PATCH /api/v1/projects/:id` con `draftJson` sin publicar cambios directamente.
- La UI consume `GET /api/v1/admin/publication/projects/:id/review` para mostrar diffs del borrador.
- El dialogo muestra una revision resumida con campos modificados, valor publicado y valor propuesto.
- La accion `Publicar borrador` llama a `POST /api/v1/admin/publication/projects/:id/publish`.
- El modal de proyectos usa ancho responsive real (`sm:!max-w-4xl`), scroll y footer con wrap para evitar recortes en desktop/mobile.
- Se aplico el mismo ajuste responsive al dialogo largo de experiencias para mantener consistencia visual.
- Anadida cobertura e2e desktop/mobile del flujo guardar borrador -> revisar -> publicar.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/portfolio/projects` con dialogo de borrador visible y sin errores de consola; Browser integrado no expuso herramienta navegable en esta sesion.

### Draft/publish API para skills

- Anadidos `draftJson` y `publishedAt` al modelo `Skill`.
- Anadida migracion `000007_add_skill_publication`.
- `GET /api/v1/admin/publication/skills/:id/review` devuelve diffs campo a campo.
- `POST /api/v1/admin/publication/skills/:id/publish` publica el borrador, limpia `draftJson` y actualiza `publishedAt`.
- La publicacion valida el campo obligatorio de skill: nombre.
- `ChangeLog` y `AuditLog` registran publicaciones de skills.
- `POST /api/v1/admin/publication/changelog/:id/restore` soporta restaurar skills desde `beforeJson`.
- Anadida cobertura unitaria para review, publish y restore de skill.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd --prefix apps/api run test -- admin-publication.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd --prefix apps/api run test:e2e`

### UI draft/publish para skills

- `/admin/portfolio/skills` permite guardar borradores de skills desde el dialogo de edicion.
- La UI llama a `PATCH /api/v1/skills/:id` con `draftJson` sin publicar cambios directamente.
- La UI consume `GET /api/v1/admin/publication/skills/:id/review` para mostrar diffs del borrador.
- El dialogo muestra una revision resumida con campos modificados, valor publicado y valor propuesto.
- La accion `Publicar borrador` llama a `POST /api/v1/admin/publication/skills/:id/publish`.
- El modal de skills usa ancho responsive, scroll y footer con wrap para evitar recortes.
- Anadida cobertura e2e desktop/mobile del flujo guardar borrador -> revisar -> publicar.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/portfolio/skills` con dialogo de borrador visible y sin errores de consola; Browser integrado no expuso herramienta navegable en esta sesion.

### Draft/publish API para estudios

- Anadidos `draftJson` y `publishedAt` al modelo `Education`.
- Anadida migracion `000008_add_education_publication`.
- `GET /api/v1/admin/publication/education/:id/review` devuelve diffs campo a campo.
- `POST /api/v1/admin/publication/education/:id/publish` publica el borrador, limpia `draftJson` y actualiza `publishedAt`.
- La publicacion valida campos obligatorios de estudio: titulo, institucion, fecha y tipo.
- `ChangeLog` y `AuditLog` registran publicaciones de estudios.
- `POST /api/v1/admin/publication/changelog/:id/restore` soporta restaurar estudios desde `beforeJson`.
- Anadida cobertura unitaria para review, publish y restore de estudio.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd --prefix apps/api run test -- admin-publication.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd --prefix apps/api run test:e2e`

### UI draft/publish para estudios

- `/admin/portfolio/education` permite guardar borradores de estudios desde el dialogo de edicion.
- La UI llama a `PATCH /api/v1/education/:id` con `draftJson` sin publicar cambios directamente.
- La UI consume `GET /api/v1/admin/publication/education/:id/review` para mostrar diffs del borrador.
- El dialogo muestra una revision resumida con campos modificados, valor publicado y valor propuesto.
- La accion `Publicar borrador` llama a `POST /api/v1/admin/publication/education/:id/publish`.
- El modal de estudios usa ancho responsive, scroll y footer con wrap para evitar recortes.
- Anadida cobertura e2e desktop/mobile del flujo guardar borrador -> revisar -> publicar.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/portfolio/education` con dialogo de borrador visible y sin errores de consola; Browser integrado no expuso herramienta navegable en esta sesion.

### Draft/publish API para certificaciones

- Anadidos `draftJson` y `publishedAt` al modelo `Certification`.
- Anadida migracion `000009_add_certification_publication`.
- `GET /api/v1/admin/publication/certifications/:id/review` devuelve diffs campo a campo.
- `POST /api/v1/admin/publication/certifications/:id/publish` publica el borrador, limpia `draftJson` y actualiza `publishedAt`.
- La publicacion valida campos obligatorios de certificacion: titulo, institucion y fecha.
- `ChangeLog` y `AuditLog` registran publicaciones de certificaciones.
- `POST /api/v1/admin/publication/changelog/:id/restore` soporta restaurar certificaciones desde `beforeJson`.
- Anadida cobertura unitaria para review, publish y restore de certificacion.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd --prefix apps/api run test -- admin-publication.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd --prefix apps/api run test:e2e`

### UI draft/publish para certificaciones

- `/admin/portfolio/certifications` permite guardar borradores de certificaciones desde el dialogo de edicion.
- La UI llama a `PATCH /api/v1/certifications/:id` con `draftJson` sin publicar cambios directamente.
- La UI consume `GET /api/v1/admin/publication/certifications/:id/review` para mostrar diffs del borrador.
- El dialogo muestra una revision resumida con campos modificados, valor publicado y valor propuesto.
- La accion `Publicar borrador` llama a `POST /api/v1/admin/publication/certifications/:id/publish`.
- El modal de certificaciones usa ancho responsive, scroll y footer con wrap para evitar recortes.
- Anadida cobertura e2e desktop/mobile del flujo guardar borrador -> revisar -> publicar.
- Estabilizada en mobile la confirmacion de cambios grandes del editor de Versiones CV usando foco + Enter en el dialogo.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/portfolio/certifications` con dialogo de borrador visible y sin errores de consola; Browser integrado no expuso herramienta navegable en esta sesion.

### Draft/publish API para Versiones CV

- Anadidos `draftJson` y `publishedAt` al modelo `CvVersion`.
- Anadida migracion `000010_add_cv_version_publication`.
- `GET /api/v1/admin/publication/cv-versions/:id/review` devuelve diffs campo a campo de nombre, slug, rol objetivo, idioma, plantilla y `structuredJson`.
- `POST /api/v1/admin/publication/cv-versions/:id/publish` publica el borrador, fuerza estado `published`, limpia `draftJson` y actualiza `publishedAt`.
- La publicacion valida campos obligatorios de version CV: nombre, slug, rol objetivo, idioma y `structuredJson` como objeto.
- `ChangeLog` y `AuditLog` registran publicaciones de versiones CV.
- `POST /api/v1/admin/publication/changelog/:id/restore` soporta restaurar versiones CV desde `beforeJson`.
- El cliente web ya expone metodos tipados para review/publish de versiones CV sin acceder a base de datos.
- `docs/api.md` documenta endpoints nuevos y el soporte draft/publish de `CvVersion`.
- Anadida cobertura unitaria para review, publish y restore de version CV.

Verificacion realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd --prefix apps/api run test -- admin-publication.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd --prefix apps/api run test:e2e`
- Estabilizada la prueba e2e admin desktop/mobile con timeout especifico de 60s para el flujo largo de CMS/CV/media/mensajes/analytics.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### UI draft/publish para Versiones CV

- `/admin/cv/versions` mantiene el guardado JSON directo existente y anade un flujo separado de borrador/publicacion.
- El editor JSON permite guardar borrador CV enviando `draftJson.structuredJson` por `PATCH /api/v1/cv-versions/:id`.
- La UI consume `GET /api/v1/admin/publication/cv-versions/:id/review` para mostrar diffs del borrador.
- El panel `Revision borrador CV` muestra campos modificados, valor publicado y valor propuesto, truncando valores largos de JSON.
- La accion `Publicar borrador CV` llama a `POST /api/v1/admin/publication/cv-versions/:id/publish` y recarga versiones.
- La tabla de versiones muestra badge `borrador pendiente` cuando la API devuelve `draftJson`.
- Anadida cobertura e2e desktop/mobile del flujo guardar borrador CV -> revisar -> publicar borrador CV.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA visual Playwright fallback en `/admin/cv/versions` con panel de revision visible y sin errores de consola; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Paridad HTML A4 del renderer CV

- `CvExportService.renderHtml` usa una estructura A4 mas cercana al preview publico: `cv-header`, contacto separado, foto configurable, secciones con encabezados y chips de skills.
- La plantilla server-side respeta `fontFamily`, `primaryColor`, `density` compacta y `includePhoto`.
- El modo ATS sigue desactivando foto y conserva salida textual.
- El HTML limita experiencias, skills y formacion en modo compacto de forma similar al preview publico.
- Anadida cobertura unitaria de header, contacto, foto, chips, escaping seguro y configuracion `includePhoto`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### PDF server-side desde HTML/CSS A4

- `CvExportService.generatePdf` reutiliza el HTML A4 server-side y genera PDF con Playwright.
- La salida PDF usa A4, `printBackground`, `preferCSSPageSize` y margenes cero para respetar `@page`.
- El paquete API declara `playwright` como dependencia runtime y elimina `pdfkit`/`@types/pdfkit`.
- `STORAGE_DIR` puede ser relativo o absoluto para facilitar tests temporales y despliegue.
- Anadida cobertura unitaria que mockea Playwright y verifica que `page.setContent` recibe el HTML `.cv-page` y que `page.pdf` se invoca con opciones A4.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Formulario granular de experiencia en Versiones CV

- `/admin/cv/versions` anade un subformulario granular dentro del bloque `Experiencia CV`.
- El formulario permite editar rol, empresa, periodo, descripcion, responsabilidades y logros de la experiencia seleccionada.
- La aplicacion conserva campos ricos ya existentes del objeto de experiencia y solo reemplaza los campos controlados por el formulario.
- El selector de experiencia se sincroniza con el JSON estructurado y soporta crear la primera experiencia cuando no existe ninguna.
- Anadida cobertura e2e desktop/mobile para aplicar logros granulares sin perder responsabilidades previas.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Draft/publish de metadatos en Versiones CV

- `/admin/cv/versions` anade un formulario de metadatos para la version CV seleccionada.
- El formulario permite guardar como borrador nombre, slug derivado, puesto objetivo, empresa objetivo, idioma, estado, descripcion y plantilla.
- `Guardar metadatos CV` escribe `draftJson` sin publicar directamente la version ni tocar la base de datos fuera del endpoint REST.
- `Guardar borrador CV` preserva metadatos pendientes cuando actualiza `draftJson.structuredJson`.
- La revision/publicacion existente muestra y publica campos no JSON junto a `structuredJson`.
- Anadida cobertura e2e desktop/mobile para guardar y publicar cambios de `name`, `slug` y `targetRole`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Formulario granular de skills en Versiones CV

- `/admin/cv/versions` anade un subformulario granular dentro del bloque `Skills CV`.
- El formulario permite editar nombre, categoria y nivel de la skill seleccionada.
- La aplicacion conserva campos ricos ya existentes del objeto de skill y solo reemplaza los campos controlados por el formulario.
- El guardado e2e acepta tanto guardado directo como confirmacion de cambio grande cuando el JSON cruza el umbral.
- Anadida cobertura e2e desktop/mobile para aplicar categoria y nivel sin perder el nombre de la skill.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Formulario granular de proyectos en Versiones CV

- `/admin/cv/versions` anade un subformulario granular dentro del bloque `Proyectos CV`.
- El formulario permite editar nombre, categoria, estado y descripcion del proyecto seleccionado.
- La aplicacion conserva campos ricos ya existentes del objeto de proyecto y solo reemplaza los campos controlados por el formulario.
- Anadida cobertura e2e desktop/mobile para aplicar categoria, estado y descripcion sin perder el nombre del proyecto.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Formulario granular de educacion en Versiones CV

- `/admin/cv/versions` anade un subformulario granular dentro del bloque `Educacion CV`.
- El formulario permite editar titulo, institucion, fecha, tipo y descripcion de la formacion seleccionada.
- La aplicacion conserva campos ricos ya existentes del objeto de educacion y solo reemplaza los campos controlados por el formulario.
- Anadida cobertura e2e desktop/mobile para aplicar tipo y descripcion sin perder titulo, institucion ni fecha.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Formulario granular de certificaciones en Versiones CV

- `/admin/cv/versions` anade un subformulario granular dentro del bloque `Certificaciones CV`.
- El formulario permite editar titulo, institucion, fecha, URL de certificado y descripcion de la certificacion seleccionada.
- La aplicacion conserva campos ricos ya existentes del objeto de certificacion y solo reemplaza los campos controlados por el formulario.
- Anadida cobertura e2e desktop/mobile para aplicar URL y descripcion sin perder titulo, institucion ni fecha.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Orden y duplicado de bloques en Versiones CV

- `/admin/cv/versions` anade el bloque `Orden de bloques CV` para editar `structuredJson.sectionOrder`.
- El orden admite alias seguros para resumen, experiencia, formacion, skills, idiomas, proyectos y secciones personalizadas.
- El exportador PDF/DOCX respeta `sectionOrder` y mantiene el orden por defecto cuando no existe.
- El comparador de versiones usa `sectionOrder` explicito cuando esta disponible.
- Las secciones personalizadas se pueden duplicar, subir y bajar desde el editor antes de guardar JSON.
- Anadida cobertura unitaria para exportacion/comparacion y e2e desktop/mobile para aplicar orden, duplicar y reordenar secciones.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts cv-adaptation.service.spec.ts`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Contrato de paridad A4 preview/export

- Creado `CvA4Preview` compartido para las previews A4 publicas y admin.
- `/cv/templates/[slug]` y `/admin/cv/editor` usan la misma maqueta A4 web para reducir divergencia visual.
- El preview web expone `data-page-size`, `data-cv-renderer`, `data-cv-density`, `data-cv-template` y `data-cv-section`.
- `CvExportService.renderHtml` expone los mismos metadatos de contrato en el HTML server-side usado para PDF.
- Anadida cobertura unitaria del contrato server-side y e2e desktop/mobile del contrato en preview publico/admin.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail|admin publication"`
- QA funcional Playwright fallback en `/cv/templates/[slug]` y `/admin/cv/editor` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Descarga fisica de CV generado persistido

- `CvVersionService.generatePdf` queda cubierto con una prueba que persiste un `MediaAsset` generado.
- La prueba crea un archivo PDF temporal dentro de storage local relativo y lo descarga mediante `MediaService.download`.
- Se verifica que el asset generado conserva filename, MIME type y `storageKey` descargable.
- Este hito cubre el ciclo servicio -> media persistida -> stream local; sigue pendiente el e2e con Postgres real.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-version.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Alta granular de nuevos items CV

- Los selectores granulares de `/admin/cv/versions` permiten crear un nuevo item aunque ya existan elementos.
- Cubierto para skills, experiencias, proyectos, educacion y certificaciones usando una opcion `Nueva/Nuevo`.
- La logica existente de formularios conserva campos ricos y anade al final cuando el indice seleccionado coincide con la longitud de la lista.
- Anadida cobertura e2e desktop/mobile creando una skill granular nueva desde una lista existente.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Borrado granular de items CV

- Los formularios granulares de `/admin/cv/versions` anaden botones de borrado por item seleccionado.
- Cubierto para skills, experiencias, proyectos, educacion y certificaciones.
- El borrado elimina el item del JSON, sincroniza el textarea del bloque y reajusta el selector al item disponible mas cercano.
- Anadida cobertura e2e desktop/mobile creando una skill granular nueva y eliminandola antes de guardar.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Preview A4 admin por plantilla

- `/admin/cv/editor` carga plantillas de CV desde la API junto al CV principal y snapshot publico.
- Anadido selector `Plantilla preview admin` para aplicar color, tipografia, densidad y foto al componente A4 compartido.
- El preview puede volver al modo base sin plantilla.
- Anadida cobertura e2e desktop/mobile para verificar `data-cv-template` y `data-cv-density` al cambiar plantilla.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- QA funcional Playwright fallback en `/admin/cv/editor` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Duplicado granular de items CV

- Los formularios granulares de `/admin/cv/versions` anaden botones de duplicado por item seleccionado.
- Cubierto para skills, experiencias, proyectos, educacion y certificaciones.
- El duplicado conserva campos ricos, marca el campo principal con `copia` y selecciona el item duplicado para edicion inmediata.
- Anadida cobertura e2e desktop/mobile duplicando una skill y eliminando la copia antes de continuar.
- El timeout del e2e admin sube a 90s porque el flujo cubre mas interacciones reales en desktop/mobile.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"` tras ajustar timeout del flujo admin.
- QA funcional Playwright fallback en `/admin/cv/versions` desktop/mobile; Browser integrado no expuso herramienta navegable en esta sesion.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Drag/drop visual de orden CV

- `/admin/cv/versions` incorpora una lista visual reordenable para `sectionOrder`.
- Cada bloque se puede arrastrar y soltar, con botones de subir/bajar como fallback accesible.
- La lista sincroniza el textarea `Orden de bloques CV` y mantiene el paso explicito de aplicar/guardar JSON para evitar persistencias accidentales.
- Anadida cobertura e2e desktop/mobile para reordenar `summary` desde la lista visual y aplicar el orden al JSON estructurado.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Drag/drop visual de secciones CV

- `/admin/cv/versions` incorpora una lista visual reordenable para secciones personalizadas del CV.
- Cada seccion personalizada se puede arrastrar y soltar, con botones de subir/bajar como fallback accesible.
- La accion reutiliza la ruta existente de `updateCustomSections`, por lo que actualiza el JSON estructurado y mantiene el guardado explicito.
- Anadida cobertura e2e desktop/mobile para verificar draggability y reordenado visual de `Publicaciones copia`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Drag/drop visual de experiencias CMS

- `/admin/portfolio/experience` incorpora filas draggable con handle visual para reordenado de experiencias.
- Los botones existentes de subir/bajar se mantienen como fallback accesible.
- La accion reutiliza el endpoint existente de actualizacion de orden y mantiene el feedback `Experiencia reordenada`.
- La cobertura e2e desktop/mobile valida filas draggable con una segunda experiencia sample/demo en el mock.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Drag/drop visual de proyectos CMS

- `/admin/portfolio/projects` incorpora filas draggable con handle visual para reordenado de proyectos.
- Los botones existentes de subir/bajar se mantienen como fallback accesible.
- La accion reutiliza el endpoint existente de actualizacion de orden y mantiene el feedback `Proyecto reordenado`.
- La cobertura e2e desktop/mobile valida filas draggable con un segundo proyecto sample/demo en el mock.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Drag/drop visual de skills CMS

- `/admin/portfolio/skills` incorpora filas draggable con handle visual para reordenado de skills.
- Los botones existentes de subir/bajar se mantienen como fallback accesible.
- La accion reutiliza el endpoint existente de actualizacion de orden y mantiene el feedback `Skill reordenada`.
- La cobertura e2e desktop/mobile valida filas draggable con una segunda skill sample/demo en el mock.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Drag/drop visual de estudios y certificaciones CMS

- `/admin/portfolio/education` incorpora filas draggable con handle visual para reordenado de estudios.
- `/admin/portfolio/certifications` incorpora filas draggable con handle visual para reordenado de certificaciones.
- Los botones existentes de subir/bajar se mantienen como fallback accesible en ambas tablas.
- La cobertura e2e desktop/mobile valida filas draggable con segundos registros sample/demo en ambos mocks.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Contrato HTTP de descarga CV generado

- Anadido e2e API para `POST /cv-versions/:id/generate-pdf` con version persistida en memoria.
- El test persiste `MediaAsset` y `CvGeneratedFile` mediante Prisma mock en memoria.
- El mismo flujo descarga el archivo fisico por `GET /media/:id/download` usando storage local temporal.
- La prueba valida cabeceras HTTP, mime type PDF, `Content-Disposition` y bytes descargados.
- Este hito cubre el contrato HTTP sin requerir PostgreSQL real; DB real aislada sigue como deuda tecnica.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd --prefix apps/api run test:e2e`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Harness opcional e2e PostgreSQL para CV

- Anadido e2e API opcional `cv-version-db.e2e-spec.ts`, activado solo con `RUN_DB_E2E=true`.
- Anadidos scripts `test:e2e:db` en raiz y API para ejecutar el contrato DB bajo demanda.
- El test crea CV, plantilla y version en PostgreSQL, genera un PDF mediante exporter controlado, persiste `MediaAsset`/`CvGeneratedFile`, valida `generatedPdfId` y descarga por HTTP.
- README documenta el comando PowerShell y mantiene el test saltado por defecto para CI/local sin Postgres.
- Intento de validacion real: Docker CLI existe pero Docker Desktop daemon no estaba levantado; la instancia local en `localhost:5432` no acepto las credenciales de ejemplo. Queda pendiente validarlo con credenciales Postgres reales.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd --prefix apps/api run test:e2e`
- `npm.cmd --prefix apps/api run test:e2e:db` sin `RUN_DB_E2E` confirma skip seguro.

### Smoke visual A4 del renderer server-side

- Anadida prueba `cv-export-visual.spec.ts` con Chromium real de Playwright.
- Renderiza el HTML A4 server-side de `CvExportService.renderHtml` con plantilla compacta.
- Valida proporciones A4, secciones `data-cv-section`, renderer `server-html` y screenshot no vacio.
- Este hito cubre regresiones visuales basicas del HTML usado para PDF; el diff pixel-perfect contra PDF rasterizado sigue pendiente.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd --prefix apps/api run test -- cv-export-visual.spec.ts`

### Smoke real de generacion PDF CV

- Anadida prueba `cv-export-pdf.spec.ts` con `CvExportService.generatePdf` y Playwright real.
- La prueba escribe un PDF fisico en storage temporal, valida cabecera `%PDF-`, nombre con slug de plantilla y URL media generada.
- El caso usa HTML/CSS A4 server-side con plantilla `ATS-friendly` compacta para cubrir el flujo binario real, no solo mocks del navegador.
- Este hito cubre la generacion PDF real desde backend; el diff visual automatizado contra PDF rasterizado sigue pendiente.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd --prefix apps/api run test -- cv-export-pdf.spec.ts`

### Smoke real de generacion DOCX CV

- Anadida prueba `cv-export-docx.spec.ts` con `CvExportService.generateDocx` y el empaquetado DOCX real.
- La prueba escribe un DOCX fisico en storage temporal, valida cabecera ZIP `PK`, entradas `[Content_Types].xml` y `word/document.xml`, nombre con slug de plantilla y URL media generada.
- `CvExportService.generateDocx` usa `writeFile` estatico de `node:fs/promises` para evitar el fallo de import dinamico bajo Jest.
- Este hito cubre la generacion DOCX real desde backend; la paridad visual avanzada frente al preview A4 sigue siendo deuda del renderer.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd --prefix apps/api run test -- cv-export-docx.spec.ts`

### Edicion granular de listas internas de experiencia CV

- `/admin/cv/versions` permite editar responsabilidades y logros de la experiencia seleccionada mediante filas visuales.
- Cada lista permite anadir, editar, subir, bajar, duplicar y borrar items sin cambiar el contrato de `structuredJson`.
- Los textareas existentes se mantienen como respaldo y siguen serializando a arrays al aplicar la experiencia granular.
- Anadida cobertura e2e desktop/mobile para editar responsabilidades, reordenarlas, crear logros y persistirlos en JSON.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### Tecnologias granulares en proyectos CV

- `/admin/cv/versions` incorpora el campo `Tecnologias proyecto CV` dentro del formulario granular de proyectos.
- El campo acepta valores por lineas o comas y los persiste como `structuredJson.projects[].technologies`.
- El formulario carga tecnologias existentes desde el JSON y conserva descripcion/categoria/estado al aplicar cambios.
- Anadida cobertura e2e desktop/mobile para anadir tecnologias al proyecto demo y validar el array resultante en JSON.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### URL externa en educacion CV

- `/admin/cv/versions` incorpora el campo `URL educacion CV` dentro del formulario granular de educacion.
- El campo se carga desde `structuredJson.education[].url` y se elimina del JSON si queda vacio.
- La URL permite conservar enlaces a programas, certificados o evidencias externas sin inventar datos profesionales.
- Anadida cobertura e2e desktop/mobile para anadir URL a una formacion demo y validar el JSON resultante.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### ID de credencial en certificaciones CV

- `/admin/cv/versions` incorpora el campo `ID credencial certificacion CV` dentro del formulario granular de certificaciones.
- El campo se carga desde `structuredJson.certifications[].credentialId` y se elimina del JSON si queda vacio.
- Permite conservar identificadores de credenciales sin alterar certificados ni inventar datos.
- Anadida cobertura e2e desktop/mobile para anadir ID de credencial a una certificacion demo y validar el JSON resultante.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### Exportacion de metadatos avanzados de formacion CV

- `CvExportService` usa un helper compartido `formationRows` para HTML/PDF y DOCX.
- La exportacion incluye, cuando existen, descripcion y URL en educacion, y URL de certificado e ID de credencial en certificaciones.
- La salida mantiene el orden actual de formacion/certificaciones y no inventa campos si estan vacios.
- Anadida cobertura unitaria para filas binarias y HTML server-side.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run lint`
- `npm.cmd --prefix apps/api run build`
- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`

### Preview A4 de metadatos de formacion CV

- `CvA4Preview` muestra metadatos secundarios de formacion/certificaciones cuando existen.
- El preview mantiene la linea principal titulo-institucion-fecha y anade descripcion, URL/certificado o ID de credencial en texto compacto.
- La implementacion es defensiva: si los campos no existen, el preview conserva el aspecto anterior.
- Anadida cobertura e2e desktop/mobile del preview admin con descripciones reales del fallback de CV.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### Guard e2e de ratio A4 del preview

- Anadido smoke e2e para validar que el preview admin conserva ratio A4 `210/297`.
- La prueba tambien valida que no exista overflow horizontal significativo en el contenedor A4.
- El intento de exigir ausencia de overflow vertical detecto recorte real en contenido largo; se mantiene como deuda hasta implementar paginacion real.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### Guard A4 compartido en previews publico y admin

- El smoke de ratio A4 se factoriza en un helper e2e reutilizable.
- La cobertura ahora valida el preview publico `/cv/templates/minimalista` y el preview admin `/admin/cv/editor`.
- Ambos checks se ejecutan en desktop y mobile dentro de la suite Playwright web.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e`

### Documentacion API de metadatos CV exportados

- `docs/api.md` documenta que PDF/DOCX renderizan metadatos avanzados de formacion cuando existen en `structuredJson`.
- La nota cubre descripcion/URL de educacion y URL de certificado/ID de credencial en certificaciones.
- Se mantiene explicito que los campos vacios no se renderizan.

Verificacion realizada en este hito:

- `git diff --check`

### Estabilizacion de lint web con artefactos Playwright

- `apps/web/eslint.config.mjs` ignora explicitamente `test-results/**` y `playwright-report/**`.
- Esto evita que ESLint intente recorrer carpetas de artefactos mientras Playwright las crea o elimina.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`

### Revalidacion de bloqueo e2e DB real

- Reintentada la validacion real de `npm.cmd run test:e2e:db` con `RUN_DB_E2E=true`.
- Docker CLI sigue instalado pero el daemon de Docker Desktop no esta levantado.
- El puerto local `localhost:5432` responde, pero la base de datos rechaza las credenciales de ejemplo `portfolio:portfolio`.
- El hito queda bloqueado por dependencia externa: hacen falta Docker Desktop activo o credenciales Postgres reales.

Verificacion realizada en este hito:

- `docker info` falla por daemon no disponible.
- `Test-NetConnection localhost:5432` confirma puerto abierto.
- `RUN_DB_E2E=true DATABASE_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio_platform?schema=public npm.cmd run test:e2e:db` falla por autenticacion Postgres.

### Contrato compartido de metadatos de formacion

- `packages/shared` actualiza `EducationSeed` con `url` y `credentialId` opcionales.
- El contrato compartido queda alineado con el editor CV, preview/export y futuras seeds sin modificar datos reales existentes.

Verificacion realizada en este hito:

- `npm.cmd run build`

### README de prerequisitos e2e DB

- `README.md` aclara que el e2e DB opcional requiere Docker Desktop activo si se usa Docker Compose.
- Tambien indica que una instancia local externa necesita credenciales reales en `DATABASE_URL`, porque las credenciales de ejemplo pueden no coincidir.

Verificacion realizada en este hito:

- `git diff --check`

### Deployment docs de prerequisitos e2e DB

- `docs/deployment.md` replica el prerequisito operativo para ejecutar la prueba e2e DB opcional con Docker Compose.
- La documentacion distingue entre PostgreSQL levantado por `npm run docker:up` y una instancia local externa con credenciales propias.

Verificacion realizada en este hito:

- `git diff --check`

### Guard visual de overflow en HTML A4 server-side

- `cv-export-visual.spec.ts` mide `clientWidth/scrollWidth` y `clientHeight/scrollHeight` del render A4 server-side.
- El smoke visual ahora detecta regresiones de overflow horizontal o recorte vertical en el HTML usado para PDF antes de rasterizar el PDF.
- Se mantiene pendiente la comparacion pixel-perfect contra PDF generado/rasterizado.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export-visual.spec.ts`

### Smoke DOCX real con metadatos de formacion

- `cv-export-docx.spec.ts` abre el DOCX generado con `jszip` y lee `word/document.xml`.
- La prueba valida que descripcion/URL de educacion y URL/ID de certificacion llegan al documento Word real.
- `apps/api` declara `jszip` como dependencia de test para evitar depender de una transitoria de `docx`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export-docx.spec.ts`

### Smoke PDF real con trailer completo

- `cv-export-pdf.spec.ts` valida que el PDF generado por Playwright contiene cabecera `%PDF-` y trailer `%%EOF`.
- El smoke binario cubre mejor la integridad minima del archivo generado antes de publicar enlaces de descarga.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export-pdf.spec.ts`

### Contrato DOCX real de orden de secciones

- `cv-export-docx.spec.ts` valida en `word/document.xml` que el DOCX respeta `sectionOrder`.
- La prueba comprueba el orden Resumen -> Experiencia -> Formacion -> Skills dentro del documento Word generado.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export-docx.spec.ts`

### Proyectos destacados en preview A4 web

- `CvA4Preview` muestra un proyecto publicado/destacado usando los datos ya disponibles en `PortfolioSnapshot`.
- La seccion `projects` comparte el contrato `data-cv-section` de los previews A4 publico y admin.
- El preview mantiene render compacto con tecnologias limitadas para evitar desbordes horizontales.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail|admin publication"`

### Revalidacion de deuda NPM audit

- Revalidado `npm audit --audit-level=moderate` tras actualizar el lockfile con `jszip`.
- La deuda sigue abierta por `next@16.2.7` y su dependencia interna `postcss@8.4.31`.
- Se probo un override especifico `next -> postcss@8.5.10`, pero `npm ls postcss --workspace apps/web` dejo el arbol invalido; el intento se retiro sin cambios.

Verificacion realizada en este hito:

- `npm.cmd audit --audit-level=moderate` falla con 2 vulnerabilidades moderadas `next/postcss`.
- `npm.cmd ls postcss --workspace apps/web` confirma que el override deja `postcss@8.4.31` invalido bajo `next`.

### Build web tras preview A4 ampliado

- Ejecutado build de produccion del frontend despues de anadir proyectos destacados al preview A4.
- Next compila rutas publicas y privadas sin errores de TypeScript ni build.

Verificacion realizada en este hito:

- `npm.cmd run build:web`

### Build API tras specs de exportacion CV

- Ejecutado build de produccion del backend tras declarar `jszip` y ampliar los smokes PDF/DOCX.
- Nest compila el API sin errores de TypeScript ni resolucion de dependencias.

Verificacion realizada en este hito:

- `npm.cmd run build:api`

### Suite raiz tras hitos CV/A4

- Ejecutada la suite raiz despues de los cambios en exportacion CV, preview A4 y documentacion de deuda.
- Pasan los tests unitarios del API y el smoke test del frontend.

Verificacion realizada en este hito:

- `npm.cmd run test` (`24` suites y `109` tests API, mas smoke web)

### Documentacion de contrato A4 web

- `docs/api.md` documenta que los previews A4 publico/admin exponen `data-cv-section` tambien para `projects`.
- La nota alinea la documentacion con el componente compartido `CvA4Preview`.

Verificacion realizada en este hito:

- `git diff --check`

### Corte operativo 2026-06-06 antes de las 22:00

- Tanda cerrada y subida a `develop` con commits separados para documentacion DB e2e, guards A4/PDF/DOCX, preview A4 con proyectos, revalidacion de deuda audit y QA de build/test.
- Verificacion consolidada: `npm.cmd --prefix apps/web run lint`, e2e web focalizado desktop/mobile, `npm.cmd run build:web`, `npm.cmd run build:api` y `npm.cmd run test`.
- Deuda confirmada: e2e DB real bloqueado por Docker/credenciales Postgres, `npm audit` sigue pendiente por `next/postcss`, diff visual PDF rasterizado y paginacion A4 real siguen como siguientes hitos.

Verificacion realizada en este hito:

- `git diff --check`

### Idiomas en preview A4 web compartido

- `CvA4Preview` separa las skills de categoria `Idiomas`/`Languages` y las muestra como seccion `languages`.
- Los idiomas dejan de duplicarse dentro de `skills` y quedan alineados con las exportaciones HTML/DOCX.
- La documentacion API actualiza el contrato `data-cv-section` de previews A4 publico/admin.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail|admin publication"`

### Contacto filtrado en preview A4

- `CvA4Preview` renderiza los datos de contacto desde una lista filtrada para evitar items vacios cuando telefono u otros campos llegan nulos.
- Los items visibles exponen `data-cv-contact-item` para QA del contrato A4.
- La cobertura e2e valida conteo de contacto publico y ausencia de items vacios en preview admin.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail|admin publication"`

### Build web tras idiomas/contacto A4

- Ejecutado build de produccion del frontend despues de separar idiomas y filtrar contacto en el preview A4.
- Next compila rutas publicas y privadas sin errores de TypeScript ni build.

Verificacion realizada en este hito:

- `npm.cmd run build:web`

### Guard A4 en preview publico ingles

- La prueba de detalle de plantillas tambien valida ratio A4 y ausencia de overflow horizontal en `/en/cv/templates/ats-friendly`.
- El guard queda cubierto en desktop y mobile para previews publicos ES/EN.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail"`

### Contrato de contacto A4 server-side

- `CvExportService.renderHtml` expone `data-cv-contact-item="true"` en los items de contacto.
- El contrato queda alineado con `CvA4Preview` para futuros checks de paridad preview/export.
- `docs/api.md` documenta el atributo compartido y el filtrado de campos vacios.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`

### Build API tras contrato contacto A4

- Ejecutado build de produccion del backend despues de alinear el contrato de contacto A4 server-side.
- Nest compila sin errores de TypeScript.

Verificacion realizada en este hito:

- `npm.cmd run build:api`

### Revision granular de campos de experiencia en adaptacion CV

- `CvAdaptationWizard` permite aceptar/rechazar campos internos de cada experiencia propuesta: descripcion, responsabilidades y logros.
- La version draft conserva experiencias aceptadas, elimina campos rechazados y registra `acceptedExperienceFields`/`rejectedExperienceFields` en `adaptationMeta`.
- El flujo mantiene rechazo de experiencias completas y rechazo granular de skills/bloques.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### Build web tras revision granular CV

- Ejecutado build de produccion del frontend tras ampliar el wizard de adaptacion CV.
- Next compila rutas publicas y privadas sin errores de TypeScript ni build.

Verificacion realizada en este hito:

- `npm.cmd run build:web`

### Documentacion de adaptationMeta granular

- `docs/api.md` documenta la trazabilidad guardada al revisar una adaptacion CV desde admin.
- La nota cubre bloques, skills, experiencias completas y campos internos de experiencia aceptados/rechazados.

Verificacion realizada en este hito:

- `git diff --check`

### Suite raiz tras revision granular CV

- Ejecutada la suite raiz despues de ampliar el wizard de adaptacion y los contratos A4.
- Pasan los tests unitarios del API y el smoke test del frontend.

Verificacion realizada en este hito:

- `npm.cmd run test` (`24` suites y `109` tests API, mas smoke web)

### Analytics de uso por rol objetivo CV

- `POST /cv/adapt-to-role` registra evento server-side `cv_adaptation` con label del puesto objetivo.
- `GET /analytics/labels?type=cv_adaptation` agrega labels y permite consultar uso por rol objetivo.
- El cliente web declara `adminClient.analyticsLabels` para consumir el agregado desde futuras vistas.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv.controller.spec.ts`
- `npm.cmd --prefix apps/api run test -- analytics.service.spec.ts`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:api`

### Visualizacion admin de roles objetivo CV

- `/admin/analytics` consume `GET /analytics/labels?type=cv_adaptation` y muestra los roles objetivo mas usados.
- El filtro de tipo de evento incluye `cv_adaptation` para revisar adaptaciones CV desde el panel.
- La cobertura e2e mockeada valida la seccion nueva y el agregado de `Delivery Manager` en desktop y mobile.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

### Build web tras analytics de roles objetivo

- Ejecutado build de produccion del frontend despues de mostrar roles objetivo CV en `/admin/analytics`.
- Next compila el panel privado y las rutas publicas sin errores de TypeScript.

Verificacion realizada en este hito:

- `npm.cmd run build:web`

### Diff visual automatizado HTML/PDF A4

- `cv-export-visual.spec.ts` genera un PDF real desde el HTML A4 server-side y rasteriza la primera pagina con `pdfjs-dist` dentro de Playwright.
- El test compara la captura HTML contra el PNG rasterizado del PDF con umbral de diferencia media y ratio de diferencias significativas.
- Anadida dependencia dev `pdfjs-dist@4.10.38` solo en el workspace API para esta verificacion visual, manteniendo compatibilidad Node >=20.
- Revalidado `npm audit --audit-level=moderate`: la deuda restante sigue limitada a la cadena `next`/`postcss` ya conocida.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export-visual.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd audit --audit-level=moderate` (falla por deuda conocida `next`/`postcss`)

### Paginacion real del preview A4 web

- `CvA4Preview` divide el contenido en varias hojas A4 mediante un paginador determinista por bloques.
- Cada hoja expone `data-page-index`, `data-page-count`, ratio A4 y el contrato existente `data-cv-section`.
- En movil la hoja mantiene ancho minimo documental dentro de un contenedor con scroll horizontal para evitar reflow y overflow vertical.
- Los e2e publico/admin validan multiples paginas, ratio A4 y ausencia de overflow interno en desktop y mobile.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail"`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Investigacion de audit Next/PostCSS

- `next@16.2.7` sigue siendo la ultima version estable publicada y depende internamente de `postcss@8.4.31`.
- Se probo un override raiz de `next -> postcss@8.5.15`, pero npm no lo aplica al subarbol workspace de Next; se retiro para no dejar configuracion inerte.
- `npm audit fix --force` sigue proponiendo un downgrade rompedor a `next@9.3.3`, por lo que no se aplica.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web ls next postcss --depth=3`
- `npm.cmd view next version`
- `npm.cmd view next@latest dependencies.postcss version`
- `npm.cmd audit --audit-level=moderate` (falla por deuda conocida `next`/`postcss`)

### Paginacion PDF server-side para CV largos

- `CvExportService.renderHtml` mantiene overflow oculto en pantalla, pero permite overflow visible en `@media print` para que Playwright pagine el PDF.
- Las secciones y articulos usan `break-inside: avoid`/`page-break-inside: avoid` para reducir cortes internos.
- `cv-export-pdf.spec.ts` genera un CV largo real y valida que el PDF contiene mas de una pagina.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export-pdf.spec.ts`
- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`

### Marcadores visuales de pagina A4

- `CvA4Preview` muestra un marcador `n / total` en cada hoja A4.
- El marcador expone `data-cv-page-label` para QA y queda sincronizado con `data-page-count`.
- Los e2e publico/admin validan que cada hoja tenga marcador y que la primera muestre `1 / total`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail"`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Saltos manuales de pagina en CV

- `structuredJson.sectionOrder` acepta `page-break` como marcador manual para HTML/PDF server-side.
- El editor de Versiones CV permite insertar `page-break`, moverlo en el orden visual y guardarlo en el JSON estructurado.
- El exportador ignora `page-break` en DOCX para mantener compatibilidad de bloques, y lo respeta en HTML/PDF con `break-before`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv-export.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Saltos manuales en preview A4 web

- `PortfolioSnapshot.cv.sectionOrder` puede transportar `page-break` hacia `CvA4Preview`.
- El fallback publico inicial incluye un salto manual despues de experiencia para separar formacion/proyectos en la segunda hoja.
- El e2e publico valida que `formation` cae en `data-page-index="2"` en ES y EN.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "public CV template detail"`
- `npm.cmd run build:web`

### SectionOrder primario en GET /cv

- `CvService.getPrimary()` expone `sectionOrder` de la version CV primaria cuando existe en `structuredJson`.
- El contrato permite que el snapshot publico aplique los saltos manuales reales de la version publicada.
- Anadida cobertura unitaria para asegurar que `GET /cv` conserva `page-break`.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- cv.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`

### Suite raiz tras hitos A4/page-break

- Ejecutada la suite raiz despues de diff visual PDF, paginacion A4, marcadores, saltos manuales y `sectionOrder` primario.
- Pasan los tests unitarios del API y el smoke test del frontend.

Verificacion realizada en este hito:

- `npm.cmd run test` (`24` suites y `114` tests API, mas smoke web)

### Build raiz tras hitos A4/page-break

- Ejecutado build completo de produccion tras cerrar la tanda A4/page-break.
- Nest compila el API y Next compila las rutas publicas/privadas sin errores de TypeScript.

Verificacion realizada en este hito:

- `npm.cmd run build`

### Contextos analytics para adaptaciones CV

- `GET /analytics/labels?type=cv_adaptation` mantiene el agregado por rol objetivo y suma un agregado `paths` para ver desde que contexto se lanza la adaptacion.
- `/admin/analytics` muestra roles y contextos de adaptacion en dos listas, manteniendo el contrato existente de `labels`.
- La documentacion API recoge el nuevo shape de respuesta para facilitar integraciones futuras.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- analytics.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Cohorts dashboard por fuente/canal

- `GET /admin/dashboard` expone `segments.cohortSources` con visitas landing agrupadas por mes, fuente y canal.
- La atribucion usa metadata persistida o parametros UTM/source de la ruta, con fallback a `direct/direct`.
- `/admin` muestra las fuentes por mes junto a los cohorts mensuales, con labels responsive para rutas/canales largos.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- admin.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Embudo analytics multicanal

- `GET /analytics/funnel/channels` agrega visitas landing, descargas CV y formularios por fuente/canal.
- El endpoint calcula tasas de descarga CV y contacto sobre visitas landing por segmento.
- `/admin/analytics` muestra el top multicanal junto al embudo basico, con cobertura e2e desktop/mobile.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- analytics.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Suite raiz tras bloque analytics/dashboard

- Ejecutada la suite raiz despues de contextos de adaptacion CV, cohorts por fuente/canal y embudo multicanal.
- Ejecutado build raiz de produccion para API y web tras el bloque completo.
- Resultado: `24` suites y `115` tests API, smoke web y build Next/Nest correctos.

Verificacion realizada en este hito:

- `npm.cmd run test`
- `npm.cmd run build`

### Contexto version base en analytics CV

- `POST /cv/adapt-to-role` registra `baseCvVersionId`, `targetRoleId` y `hasTargetCompany` como metadata agregable, sin guardar descripcion de oferta ni empresa objetivo.
- `GET /analytics/labels?type=cv_adaptation` expone `contexts` junto a roles y rutas para analizar adaptaciones por version base/rol guardado.
- `/admin/analytics` muestra ese contexto como tercera columna dentro de Roles objetivo CV.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- analytics.service.spec.ts cv.controller.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Reintento manual de webhooks contacto

- `POST /contact-messages/webhook/messages/:id/retry` permite reintentar una entrega desde el mensaje persistido, sin guardar payloads en `AuditLog`.
- El panel de configuracion muestra un boton `Reintentar` solo en entregas fallidas con `messageId` y webhook configurado.
- Cada reintento crea una nueva auditoria de entrega, manteniendo ocultos URL, secreto y cuerpo del mensaje.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- contact-webhook.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Suite raiz tras retry webhooks

- Ejecutada la suite raiz despues del reintento manual de webhooks de contacto.
- Ejecutado build raiz de produccion para API y web.
- Resultado: `24` suites y `116` tests API, smoke web y build Next/Nest correctos.

Verificacion realizada en este hito:

- `npm.cmd run test`
- `npm.cmd run build`

### Affordances de restauracion CMS por entidad

- `/admin/settings/publication` habilita `Restaurar` para todas las entidades soportadas por el backend: tema, perfil, experiencias, proyectos, skills, estudios, certificaciones y versiones CV.
- Cada entrada de changelog muestra un enlace contextual `Abrir ...` hacia la pantalla admin de la entidad afectada.
- La e2e cubre enlaces contextuales para proyecto y version CV.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Export CSV analytics server-side

- `GET /analytics/export` genera CSV desde API con los mismos filtros `from/to/type` de la tabla de eventos.
- `/admin/analytics` incorpora accion `CSV API` para iniciar la descarga desde backend, manteniendo tambien el CSV client-side existente.
- La exportacion evita depender solo del estado cargado en el navegador.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- analytics.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Suite raiz tras CSV analytics

- Ejecutada la suite raiz despues de enlaces de restauracion por entidad y export CSV server-side de analytics.
- Ejecutado build raiz de produccion para API y web.
- Resultado: `24` suites y `117` tests API, smoke web y build Next/Nest correctos.

Verificacion realizada en este hito:

- `npm.cmd run test`
- `npm.cmd run build`

### Export CSV mensajes contacto server-side

- `GET /contact-messages/export` genera CSV desde API con filtros `status/from/to`, protegido por permiso `read_messages`.
- El CSV evita exponer metadata tecnica de privacidad como IP hash o user agent.
- `/admin/messages` incorpora accion `CSV API` para descargar la bandeja filtrada desde backend.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- contact-messages.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`
- `npm.cmd run build:web`

### Cohorts comparativos dashboard

- El dashboard API expone comparativas mensuales de visitas landing contra el mes anterior.
- Añadidas comparativas por fuente/canal, calculadas contra la misma fuente del mes previo.
- `/admin` muestra la nueva seccion `Comparativa cohorts` con conteo actual, conteo anterior y delta porcentual.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- admin.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"` (primer intento detecto ambiguedad strict-mode en una asercion; segundo intento correcto tras ajustar el test)

### Accion masiva de estado en mensajes

- `PATCH /contact-messages/status/bulk` permite marcar mensajes filtrados como leidos/no leidos desde backend.
- La mutacion respeta filtros de estado actual y rango `from/to`, manteniendo fuera los mensajes soft-deleted.
- `/admin/messages` incorpora acciones `Marcar filtrados leidos` y `Marcar filtrados no leidos` con refresco posterior de la bandeja.

Verificacion realizada en este hito:

- `npm.cmd --prefix apps/api run test -- contact-messages.service.spec.ts`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/web run lint`
- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run test:e2e -- --grep "admin publication"`

## Deuda técnica abierta

- Persistencia i18n en backend/CMS: ahora la traducción pública vive en el frontend para el seed conocido; falta modelo/API para editar traducciones desde admin.
- Traducción de CV generado/exportado: el CV online se localiza, pero las exportaciones PDF/DOCX principales siguen usando la versión pública marcada en backend.
- Renderer fiel al preview: el PDF ya se genera desde el HTML/CSS A4 server-side con Playwright, el exportador respeta `sectionOrder`, existe contrato `data-*` compartido con preview web, hay smoke visual A4 del renderer server-side, guard de overflow HTML, smoke de PDF real, diff visual automatizado contra PDF rasterizado, paginacion print para CV largos y saltos manuales `page-break`; DOCX comparte orden de bloques, tiene smoke real de paquete Word y valida metadatos ricos dentro de `word/document.xml`, aunque sigue usando renderer propio.
- QA de guardado autenticado: falta prueba e2e con API real y sesión admin para validar `PATCH /theme` end to end desde UI.
- ATS end to end con DB real: el editor ya permite reporte ATS, comparacion contra oferta y generacion PDF/DOCX desde la API con descarga cubierta en e2e mockeado; servicios y contrato HTTP cubren MediaAsset generado descargable desde storage local con version persistida en memoria; existe harness opcional `RUN_DB_E2E=true`, pero falta validarlo con credenciales Postgres reales porque Docker daemon no esta disponible y la instancia local no acepta las credenciales de ejemplo.
- IA real end to end: falta probar un proveedor externo real y registrar trazabilidad de prompts/respuestas sin almacenar secretos.
- Aceptar/rechazar sugerencias IA desde UI: el wizard ya permite aceptar/rechazar bloques principales, skills individuales, experiencias individuales y campos internos de experiencia con trazabilidad en `adaptationMeta`; falta extender la misma granularidad a otros bloques complejos si se incorporan propuestas mas ricas.
- Roles objetivo CV: la pantalla admin permite CRUD, el wizard los usa como precarga, el backend persiste el rol elegido y analytics registra/expone uso agregado por rol objetivo, ruta y version base mediante `cv_adaptation` + `analytics/labels`, ya visible en `/admin/analytics`; faltan desgloses historicos avanzados por oferta sin guardar contenido sensible.
- Adaptación CV a versión final: el wizard ya propone datos desde API, crea una `CvVersion` draft revisada por bloques, enlaza comparador/editor, permite publicarla como principal desde el comparador y muestra auditoria visual de publicacion; el historial agregado de publicaciones CV queda visible desde Versiones CV.
- Auditoria CV avanzada: Versiones CV ya audita acciones clave y muestra eventos paginados filtrables por accion, version/recurso, fecha y usuario, con timeline visual por version, historial agregado de publicaciones CV, detalle por evento, exportacion CSV visible y exportacion server-side del historico filtrado; falta analitica comparativa avanzada de cambios entre publicaciones.
- Webhooks configuración editable: existe UI de estado/prueba; falta edición persistente desde admin porque URL/secret siguen viviendo en variables de entorno.
- Reintentos webhooks: hay trazabilidad persistente, vista admin de entregas/test y reintento manual desde mensaje persistido; falta cola automatica/retry diferido para destinos externos caidos.
- Mensajes UI avanzada: la bandeja está conectada con filtros API por fecha/estado, vista detalle, confirmación de borrado, respuesta `mailto`, export CSV server-side, accion masiva filtrada de leido/no leido y privacidad configurable de metadata técnica; falta integracion real con proveedor email.
- Analítica avanzada: el panel está conectado a eventos con filtros API por fecha/tipo, exportación CSV, tendencias, serie diaria histórica, tracking server-side de descargas CV, estado de privacidad, purga de retención, segmentación fuente/canal, embudo basico y embudo multicanal por fuente/canal desde UI; faltan embudos configurables definidos por admin.
- Dashboard avanzado: el resumen está conectado con drill-downs, filtros temporales de API, pulso operativo, segmentación operativa, cohorts mensuales, cohorts por fuente/canal y comparativas contra mes previo; faltan desgloses mas ricos si se definen nuevos objetivos de negocio.
- Experiencias UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo, reordenado por botones, filas drag/drop y draft/publish desde UI; falta asociación visual con skills/tecnologías.
- Proyectos UI avanzada: el CRUD está conectado con confirmación modal de borrado, gestion de categorias, edición completa por dialogo, selector de media, reordenado por botones, filas drag/drop y draft/publish desde UI.
- Skills UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo, gestion de categorias, selector de niveles, reordenado por botones, filas drag/drop y draft/publish desde UI.
- Estudios UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo, selector de adjuntos/media, reordenado por botones, filas drag/drop y draft/publish desde UI.
- Certificaciones UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo, selector de adjuntos/media, reordenado por botones, filas drag/drop y draft/publish desde UI.
- Versiones CV UI avanzada: el JSON estructurado ya se puede editar con validación semántica mínima, confirmación para cambios grandes, preservacion de campos ricos al aplicar listas simples, bloques de resumen/skills/idiomas/proyectos/educación/certificaciones/experiencia/secciones, formularios granulares de experiencia/skills/proyectos/educacion/certificaciones con alta, duplicado y borrado de items, orden exportable `sectionOrder` con drag/drop visual y fallback por botones, duplicado y reordenado drag/drop de secciones personalizadas, borrador/revision/publicacion para `structuredJson` y draft/publish de metadatos no JSON; falta drag/drop visual en entidades CMS principales.
- Editor CV por bloques: el editor principal está conectado a campos básicos y Versiones CV ya tiene bloques de resumen/skills/idiomas/proyectos/educación/certificaciones/experiencia/secciones, duplicado de versiones, orden de bloques exportable, alta/duplicado/borrado granular multi-item, edición granular de una experiencia, una skill, un proyecto, un item de educacion y una certificacion, listas internas visuales para responsabilidades/logros de experiencia, tecnologias internas de proyectos, URL externa de educacion e ID de credencial de certificaciones; los metadatos avanzados de formacion ya se exportan en HTML/PDF y DOCX. Falta granularidad equivalente en campos internos avanzados de otros bloques.
- Preview A4 admin avanzado: el preview está sincronizado, comparte componente/contrato A4 con previews publicas, permite seleccionar plantilla, muestra metadatos secundarios de formacion/certificaciones, idiomas, proyectos destacados cuando existen, pagina en varias hojas A4, muestra marcadores `n / total` y tiene guard e2e de ratio A4/overflow interno; la comparacion visual HTML/PDF existe en backend con umbrales tolerantes.
- LinkedIn OAuth persistente: el callback ya intercambia `code` y obtiene `userinfo` sanitizado; falta persistir/sincronizar perfil con una entidad segura de integración y credenciales reales.
- LinkedIn API real: falta validación end to end con credenciales reales y límites de la plataforma.
- Publicación por entidad CMS: existe workflow granular real para tema visual, perfil público, experiencias, proyectos, skills, estudios, certificaciones y versiones CV; falta extenderlo a otros futuros módulos.
- Restauración por entidad CMS: existe restore para tema visual, perfil público, experiencias, proyectos, skills, estudios, certificaciones y versiones CV; `/admin/settings/publication` ya expone enlaces contextuales por entidad y habilita restore para todas las entidades soportadas. Falta llevar affordances de restore a pantallas especificas de cada modulo si se necesita un flujo mas directo.
- Media storage externo: existe servicio desacoplado local, pero falta adaptador real S3/R2/Supabase Storage y URLs firmadas.
- Media lifecycle: la biblioteca ya permite baja soft-delete con confirmacion, metricas de uso, cuota opcional, auditoria de upload/delete, purga fisica diferida y bloqueo local de firma EICAR; falta integracion antivirus externa real.
- NPM audit: quedan 2 vulnerabilidades moderadas en la cadena `next`/`postcss` confirmadas con `npm.cmd audit --audit-level=moderate`; `next@16.2.7` es la ultima version estable y todavia depende de `postcss@8.4.31`, no se aplica `audit fix --force` porque propone un downgrade rompedor a `next@9.3.3`.

## Próximos hitos priorizados

1. Prueba e2e con DB real para generar y descargar archivos CV persistidos por HTTP.
2. Monitorizar nueva version de Next que actualice `postcss` sin downgrade forzado.
3. Preparar el siguiente bloque funcional no dependiente de Docker/Postgres real.
