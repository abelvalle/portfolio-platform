# Roadmap

Estado actualizado: 2026-06-06 13:30 CEST.

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

## Deuda técnica abierta

- Persistencia i18n en backend/CMS: ahora la traducción pública vive en el frontend para el seed conocido; falta modelo/API para editar traducciones desde admin.
- Traducción de CV generado/exportado: el CV online se localiza, pero las exportaciones PDF/DOCX principales siguen usando la versión pública marcada en backend.
- Renderer fiel al preview: el HTML server-side ya renderiza secciones estructuradas y aplica tokens de plantilla; PDF/DOCX todavía no generan desde ese mismo HTML/CSS A4 del preview público.
- QA de guardado autenticado: falta prueba e2e con API real y sesión admin para validar `PATCH /theme` end to end desde UI.
- ATS end to end con DB real: falta prueba e2e que genere archivos ATS desde una versión persistida y valide descarga.
- IA real end to end: falta probar un proveedor externo real y registrar trazabilidad de prompts/respuestas sin almacenar secretos.
- Aceptar/rechazar sugerencias IA desde UI: actualmente se guardan como metadata pendiente, falta workflow visual de revisión granular.
- Adaptación CV a versión final: el wizard ya propone datos desde API y crea una `CvVersion` draft desde la propuesta; falta aceptar/rechazar cambios por bloque y publicar tras revisión.
- Auditoria CV avanzada: Versiones CV ya audita acciones clave y muestra eventos recientes filtrables por accion, detalle por evento y exportacion CSV de trazas visibles; faltan paginacion, filtros por fecha/usuario y exportacion server-side del historico completo.
- Webhooks configuración editable: existe UI de estado/prueba; falta edición persistente desde admin porque URL/secret siguen viviendo en variables de entorno.
- Reintentos webhooks: hay trazabilidad persistente y vista admin de entregas/test; falta cola/retry persistente para destinos externos caídos.
- Mensajes UI avanzada: la bandeja está conectada con filtros API por fecha/estado, vista detalle, confirmación de borrado, respuesta `mailto` y privacidad configurable de metadata técnica; falta integracion real con proveedor email.
- Analítica avanzada: el panel está conectado a eventos con filtros API por fecha/tipo, exportación CSV, tendencias, serie diaria histórica, tracking server-side de descargas CV, estado de privacidad, purga de retención, segmentación fuente/canal y embudo básico desde UI; faltan embudos configurables/multicanal.
- Dashboard avanzado: el resumen está conectado con drill-downs, filtros temporales de API, pulso operativo, segmentación operativa y cohorts mensuales; faltan cohorts avanzados por fuente/canal.
- Experiencias UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo y reordenado por botones; faltan drag/drop y asociación visual con skills/tecnologías.
- Proyectos UI avanzada: el CRUD está conectado con confirmación modal de borrado, gestion de categorias, edición completa por dialogo, selector de media y reordenado por botones; falta drag/drop.
- Skills UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo, gestion de categorias, selector de niveles y reordenado por botones; falta drag/drop.
- Estudios UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo, selector de adjuntos/media y reordenado por botones; falta drag/drop.
- Certificaciones UI avanzada: el CRUD está conectado con confirmación modal de borrado, edición completa por dialogo, selector de adjuntos/media y reordenado por botones; falta drag/drop.
- Versiones CV UI avanzada: el JSON estructurado ya se puede editar con validación semántica mínima, confirmación para cambios grandes, preservacion de campos ricos al aplicar listas simples y bloques de resumen/skills/idiomas/proyectos/educación/certificaciones/experiencia/secciones; faltan formularios avanzados por bloque.
- Editor CV por bloques: el editor principal está conectado a campos básicos y Versiones CV ya tiene bloques de resumen/skills/idiomas/proyectos/educación/certificaciones/experiencia/secciones y duplicado de versiones; falta duplicado por bloque y edición granular de responsabilidades/logros.
- Preview A4 admin avanzado: el preview está sincronizado; falta render fiel a la plantilla seleccionada, paginación real y comparación pixel-perfect con exportación PDF.
- LinkedIn OAuth persistente: el callback ya intercambia `code` y obtiene `userinfo` sanitizado; falta persistir/sincronizar perfil con una entidad segura de integración y credenciales reales.
- LinkedIn API real: falta validación end to end con credenciales reales y límites de la plataforma.
- Publicación por entidad CMS: existe workflow granular real para tema visual y perfil público; falta extenderlo a experiencias, proyectos, skills, educación, certificaciones y CV.
- Restauración por entidad CMS: existe restore para tema visual y perfil público; falta restaurar otras entidades cuando entren al workflow draft/publish.
- Media storage externo: existe servicio desacoplado local, pero falta adaptador real S3/R2/Supabase Storage y URLs firmadas.
- Media lifecycle: la biblioteca ya permite baja soft-delete con confirmacion, metricas de uso, cuota opcional, auditoria de upload/delete, purga fisica diferida y bloqueo local de firma EICAR; falta integracion antivirus externa real.
- NPM audit: quedan 2 vulnerabilidades moderadas reportadas por `npm install`; no se aplica `audit fix --force` para evitar cambios de versiones fuera de hito.

## Próximos hitos priorizados

1. Extender draft/publish a entidades CMS principales.
2. Renderer HTML/CSS server-side fiel al preview A4 público.
