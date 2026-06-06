# Roadmap

Estado actualizado: 2026-06-06 01:59 CEST.

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

## Deuda técnica abierta

- Persistencia i18n en backend/CMS: ahora la traducción pública vive en el frontend para el seed conocido; falta modelo/API para editar traducciones desde admin.
- `html lang` global sigue configurado en `es`; para accesibilidad perfecta conviene migrar a rutas con layout por locale.
- Traducción de CV generado/exportado: el CV online se localiza, pero las exportaciones PDF/DOCX principales siguen usando la versión pública marcada en backend.
- Preview A4 por plantilla: la galería pública muestra configuración y disponibilidad, pero falta renderizar una previsualización visual real de cada plantilla.
- Selección pública de plantilla: el cambio de plantilla sigue siendo una acción de admin/CV Manager; falta selector público con URLs compartibles por plantilla y versión.
- MFA UI avanzada: falta pantalla de configuración con QR visual, copia de recovery codes y regeneración controlada desde admin.
- MFA obligatorio por rol/política: el flujo existe, pero no se fuerza todavía para todos los admins.
- Auditoría MFA granular: conviene registrar setup/confirm/disable en `AuditLog`.
- Tema global desde API: el editor persiste tokens, pero falta aplicar automáticamente esos tokens a las variables CSS de la landing/admin en runtime.
- QA de guardado autenticado: falta prueba e2e con API real y sesión admin para validar `PATCH /theme` end to end desde UI.
- ATS end to end con DB real: falta prueba e2e que genere archivos ATS desde una versión persistida y valide descarga.
- ATS por oferta concreta: el score actual valida estructura general; falta comparar contra keywords de una oferta específica.
- IA real end to end: falta probar un proveedor externo real y registrar trazabilidad de prompts/respuestas sin almacenar secretos.
- Aceptar/rechazar sugerencias IA desde UI: actualmente se guardan como metadata pendiente, falta workflow visual de revisión granular.
- Usuarios UI CRUD: existe API y vista de matriz de permisos, pero falta tabla conectada a API para crear/editar/desactivar usuarios desde el panel.
- Permisos por acción: existe matriz de permisos, pero los guards todavía se basan en roles por endpoint.
- Webhooks admin UI: falta pantalla para configurar/testear webhooks desde el panel; ahora se gestionan por variables de entorno.
- Reintentos webhooks: falta cola/retry persistente para destinos externos caídos.
- LinkedIn OAuth callback: está preparada la URL de autorización, pero falta implementar intercambio de `code` por token y sincronización real de perfil.
- LinkedIn API real: falta validación end to end con credenciales reales y límites de la plataforma.
- Publicación draft/publish: existe estructura inicial, pero falta workflow granular con revisión de cambios por entidad.
- Media storage externo: existe servicio desacoplado local, pero falta adaptador real S3/R2/Supabase Storage y URLs firmadas.
- Media lifecycle: falta borrado físico diferido, cuotas, antivirus y auditoría granular de subidas.
- Prisma muestra aviso futuro de configuración en `package.json` para Prisma 7.

## Próximos hitos priorizados

1. Preview A4 y URLs compartibles por plantilla de CV.
2. Workflow granular draft/publish con revisión de cambios por entidad.
