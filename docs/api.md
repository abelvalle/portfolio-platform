# API

Base URL local: `http://localhost:4000/api/v1`

Swagger: `http://localhost:4000/api/docs`

## Autenticación

`POST /auth/login`

```json
{
  "email": "abel.valle.rosa@gmail.com",
  "password": "ChangeMe123!"
}
```

Devuelve `accessToken`, `refreshToken` y usuario. Las rutas admin usan bearer token/cookie.

Si el usuario tiene MFA activado, el login no emite tokens finales todavía:

```json
{
  "mfaRequired": true,
  "mfaToken": "jwt-temporal",
  "user": {
    "email": "abel.valle.rosa@gmail.com",
    "role": "admin",
    "mfaEnabled": true
  }
}
```

`POST /auth/mfa/verify-login`

```json
{
  "mfaToken": "jwt-temporal",
  "code": "123456"
}
```

Devuelve `accessToken`, `refreshToken` y usuario tras validar TOTP o recovery code.

Endpoints protegidos para preparar MFA:

- `GET /auth/mfa/status`
- `POST /auth/mfa/setup`
- `POST /auth/mfa/confirm`
- `POST /auth/mfa/disable`
- `POST /auth/mfa/recovery-codes/regenerate`

`POST /auth/mfa/setup` devuelve `secret` y `otpauthUrl`; el panel admin genera el QR localmente desde `otpauthUrl` sin enviar el secreto a servicios externos.

Los cambios de estado MFA se registran en `AuditLog` con acciones `auth.mfa.setup_started`, `auth.mfa.confirmed`, `auth.mfa.disabled`, `auth.mfa.recovery_codes_regenerated` y `auth.mfa.login_verified`. El log no almacena secretos TOTP, códigos ni recovery codes.

MFA no está activado por defecto en seed para evitar bloquear el primer acceso admin.

La política opcional `AUTH_MFA_REQUIRED_ROLES=admin` fuerza MFA por rol. Si un usuario de un rol requerido intenta iniciar sesión sin MFA confirmado, la API no emite tokens y registra `auth.mfa.policy_blocked_login` en `AuditLog`. Mantener vacía la variable conserva el comportamiento del seed.

## Permisos

La API mantiene roles (`admin`, `editor`, `viewer`) y una matriz de permisos por accion. El primer guard por permiso se aplica a `/users` con `manage_users`; esto permite evolucionar endpoints hacia permisos granulares sin cambiar el contrato JWT.

## Endpoints principales

- `GET /profile`, `PATCH /profile` (`manage_portfolio`)
- `GET /theme`, `PATCH /theme` (`manage_portfolio`)
- `GET|POST|PATCH|DELETE /experiences` (writes: `manage_portfolio`)
- `GET|POST|PATCH|DELETE /education` (writes: `manage_portfolio`)
- `GET|POST|PATCH|DELETE /certifications` (writes: `manage_portfolio`)
- `GET|POST|PATCH|DELETE /skills` (writes: `manage_portfolio`)
- `GET|POST|PATCH|DELETE /skill-categories` (writes: `manage_portfolio`)
- `GET|POST|PATCH|DELETE /projects` (writes: `manage_portfolio`)
- `GET|POST|PATCH|DELETE /project-categories` (writes: `manage_portfolio`)
- `POST /contact-messages`
- `GET /contact-messages?status=unread&from=YYYY-MM-DD&to=YYYY-MM-DD` (`read_messages`)
- `GET /contact-messages/webhook/status` (`read_messages`)
- `GET /contact-messages/webhook/deliveries` (`read_messages`)
- `POST /contact-messages/webhook/test` (`manage_messages`)
- `GET /admin/dashboard` (`read_dashboard`)
- `GET /admin/publication/theme/review` (`read_publication`)
- `POST /admin/publication/theme/publish` (`manage_publication`)
- `GET /admin/publication/profile/review` (`read_publication`)
- `POST /admin/publication/profile/publish` (`manage_publication`)
- `GET /admin/publication/experiences/:id/review` (`read_publication`)
- `POST /admin/publication/experiences/:id/publish` (`manage_publication`)
- `GET /admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD` (`read_dashboard`)
- `GET /admin/publication/changelog` (`read_publication`)
- `POST /admin/publication/changelog/:id/restore` (`manage_publication`)
- `GET /app-modules`
- `PATCH /app-modules/:id` (`manage_portfolio`)
- `GET|POST /users` (`manage_users`)
- `PATCH|DELETE /users/:id` (`manage_users`)
- `GET /users/permissions` (`manage_users`)
- `GET /integrations/linkedin/status`
- `GET /integrations/linkedin/share-url`
- `GET /integrations/linkedin/auth-url` (`manage_integrations`)
- `GET /integrations/linkedin/callback?code=...&state=...` (`manage_integrations`)
- `GET /media`
- `GET /media/:id`
- `GET /media/:id/download`
- `GET /media/storage/status` (`manage_media`)
- `POST /media/storage/purge-deleted` (`purge_media`)
- `POST /media/upload` (`manage_media`)
- `POST /analytics/events`
- `GET /analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` (`read_analytics`)
- `GET /analytics/privacy` (`read_analytics`)
- `GET /analytics/timeseries?from=YYYY-MM-DD&to=YYYY-MM-DD&type=cv_download` (`read_analytics`)
- `GET /analytics/channels?from=YYYY-MM-DD&to=YYYY-MM-DD&type=landing_visit` (`read_analytics`)
- `GET /analytics/funnel?from=YYYY-MM-DD&to=YYYY-MM-DD` (`read_analytics`)
- `POST /analytics/retention/prune` (`manage_analytics`)
- `GET /analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&type=cv_download` (`read_analytics`)

## Analytics

`GET /admin/dashboard` devuelve `cards`, `latestChanges`, `modules` y `segments`. `segments.analytics` agrupa eventos clave (`landingVisits`, `cvDownloads`, `contactSubmits`, `projectViews`) con los mismos filtros temporales; `segments.content` resume proyectos, experiencias y modulos activos; `segments.cohorts` agrupa visitas landing por mes (`YYYY-MM`) hasta 6 periodos recientes.

`GET /media/storage/status` incluye `signatureScanEnabled`. Los uploads locales bloquean la firma de prueba EICAR antes de escribir archivos si `MEDIA_SIGNATURE_SCAN_ENABLED` no es `false`; esto es una puerta basica de seguridad, no sustituye un antivirus externo.

`POST /analytics/events` registra eventos anonimos de landing, descarga de CV, contacto y proyectos. La IP se guarda como hash SHA-256 y puede saltearse con `ANALYTICS_IP_HASH_SALT`.

`GET /analytics/channels` agrega eventos por fuente y canal usando `metadata.source/channel` o parametros UTM (`utm_source`, `utm_medium`) presentes en `path`. Devuelve los 8 segmentos principales de cada grupo.

`GET /analytics/funnel` devuelve un embudo fijo de conversion landing -> descarga CV -> formulario contacto, con ratio desde landing y desde el paso anterior.

Variables de privacidad:

- `ANALYTICS_IP_HASH_SALT`: sal opcional para el hash de IP.
- `ANALYTICS_STORE_USER_AGENT`: usa `false` para no persistir user-agent.
- `ANALYTICS_RETENTION_DAYS`: si es un numero positivo, habilita purga de eventos anteriores a ese umbral.

`GET /analytics/privacy` devuelve configuracion no sensible: dias de retencion, si se guarda user-agent y si hay sal configurada.

`GET /analytics/timeseries` agrupa eventos por dia y tipo. Si se envian `from` y `to`, devuelve tambien dias intermedios sin eventos con `total: 0`.

`POST /analytics/retention/prune` borra eventos anteriores a la retencion configurada y requiere `manage_analytics`.

## CV

- `GET /cv`
- `GET /cv/download?template=ats-friendly`
- `GET /cv/:id`
- `POST /cv` (`manage_cv`)
- `PATCH /cv/:id` (`manage_cv`)
- `DELETE /cv/:id` (`manage_cv`)
- `POST /cv/import` (`manage_cv`)
- `POST /cv/:id/generate-pdf` (`manage_cv`)
- `POST /cv/:id/generate-docx` (`manage_cv`)
- `GET /cv/:id/ats-report` (`manage_cv`)
- `POST /cv/:id/ats-role-report` (`manage_cv`)
- `POST /cv/:id/generate-ats-pdf` (`manage_cv`)
- `POST /cv/:id/generate-ats-docx` (`manage_cv`)
- `POST /cv/:id/set-primary` (`manage_cv`)
- `GET /cv-versions` y `GET /cv-versions/:id` (`read_cv`)
- `GET /cv-versions/audit-log?action=&resourceId=&from=&to=&userId=&page=&limit=` (`read_cv`)
- `GET /cv-versions/audit-log/export?action=&resourceId=&from=&to=&userId=` (`read_cv`)
- `POST|PATCH|DELETE /cv-versions` (`manage_cv`)
- `POST /cv-versions/:id/generate-pdf` (`manage_cv`)
- `POST /cv-versions/:id/generate-docx` (`manage_cv`)
- `POST /cv-versions/:id/set-primary` (`manage_cv`)
- `GET|POST|PATCH|DELETE /cv-templates` (writes: `manage_cv`)
- `GET|POST|PATCH|DELETE /cv-target-roles` (writes: `manage_cv`)
- `POST /cv/adapt-to-role` (`manage_cv`)
- `POST /cv/compare-versions` (`manage_cv`)

### Adaptación de CV

`GET /cv/download?template=ats-friendly` genera y descarga el PDF de la version primaria usando la plantilla publica solicitada. Si `template` se omite, usa la plantilla asociada a la version primaria. El override se guarda como `MediaAsset` y `CvGeneratedFile`, pero no reemplaza la referencia canonica `generatedPdfId` de la version. Cada descarga registra `cv_download` en analytics desde backend.

`POST /cv/adapt-to-role` usa el motor por reglas por defecto. Si `CV_AI_ADAPTER_URL` está configurado, el backend consulta un proveedor IA externo opcional y guarda sus sugerencias en `adaptationMeta.aiSuggestion`.

Las sugerencias IA quedan pendientes de revisión y solo pueden reordenar skills/experiencias existentes; no se aceptan empresas, títulos, fechas ni certificaciones nuevas.

### ATS

`GET /cv/:id/ats-report` valida la versión principal del CV y devuelve:

```json
{
  "score": 90,
  "status": "strong",
  "checks": [
    { "key": "contact", "passed": true, "weight": 15 }
  ],
  "keywords": ["Delivery Management", "KPIs", "UAT"],
  "recommendations": []
}
```

Las exportaciones ATS generan PDF/DOCX con layout textual, nombres de archivo `-ats` y metadata de score ATS.

En admin, `/admin/cv/editor` consume estos endpoints para mostrar el reporte ATS del CV principal, comparar contra una oferta concreta con `ats-role-report` y generar archivos ATS descargables desde `GET /media/:id/download`.

En admin, `/admin/cv/versions` permite filtrar la auditoria por version concreta usando `resourceId`, muestra una timeline visual para ese filtro, conserva `resourceId` en la exportacion historica CSV y ofrece un acceso directo al historial agregado de publicaciones CV (`action=set_primary`).

En admin, `/admin/cv/target-roles` consume `GET|POST|PATCH|DELETE /cv-target-roles` para gestionar perfiles objetivo y keywords reutilizables en futuras adaptaciones de CV.

En admin, `/admin/cv/adapt` lee esos roles objetivo para precargar puesto y keywords antes de llamar a `POST /cv/adapt-to-role`.

`POST /cv/adapt-to-role` acepta opcionalmente `targetRoleId`. Si se envia, la API valida que el rol objetivo exista y no este archivado, persiste ese id en `CvAdaptationRequest` y lo replica en `adaptationMeta.targetRolePreset` para trazabilidad.

`POST /cv/:id/ats-role-report` compara la versión primaria contra una descripción de oferta concreta:

```json
{
  "targetRole": "Delivery Manager",
  "jobDescription": "Oferta con UAT, Scrum, reporting ejecutivo y Cloud..."
}
```

Devuelve `matchScore`, `jobKeywords`, `matchedKeywords`, `missingKeywords` y recomendaciones de revisión. No modifica el CV ni inventa experiencia.

### Exportación con plantilla

`POST /cv/:id/generate-pdf` y `POST /cv/:id/generate-docx` usan la plantilla asociada a la versión primaria/publicada (`CvVersion.template`).

`POST /cv-versions/:id/generate-pdf` y `POST /cv-versions/:id/generate-docx` generan archivos para una versión concreta, actualizan `generatedPdfId` o `generatedDocxId` en esa fila y registran el resultado como `MediaAsset` descargable.

`POST /cv-versions/:id/set-primary` marca una versión como principal dentro de su CV, limpia `isPrimary` del resto de versiones del mismo `cvId` y publica la versión seleccionada.

`GET /cv-versions/audit-log` devuelve trazas `AuditLog` de versiones CV ordenadas por fecha descendente. Los filtros opcionales `action`, `resourceId`, `from`, `to`, `userId`, `page` y `limit` permiten revisar acciones concretas, recursos concretos, rangos de fecha y actividad de un usuario admin sin exponer secretos. `limit` se limita a 100 eventos por pagina.

`GET /cv-versions/audit-log/export` devuelve CSV server-side con el historico filtrado por `action`, `resourceId`, `from`, `to` y `userId`, sin paginar la respuesta.

La exportación aplica:

- `primaryColor` para títulos y secciones.
- `fontFamily` en DOCX y HTML de preview/export.
- `density=compact` para ajustar tamaños y espaciado.
- `slug` de plantilla en el nombre de archivo generado.
- metadata `template` en `MediaAsset` y `CvGeneratedFile`.

El HTML server-side de preview/export incluye `@page A4`, contenedor `main.cv-page` con ancho `210mm` y alto minimo `297mm`, y estilos de pantalla para revisar el documento como hoja A4.

PDF y DOCX incluyen tambien proyectos destacados y secciones personalizadas cuando existen en `structuredJson`.

Las exportaciones ATS siguen priorizando compatibilidad: fuerzan color textual y densidad normal aunque la versión tenga otra plantilla.

## Ejemplo contacto

```json
{
  "name": "Cliente",
  "email": "cliente@example.com",
  "subject": "Oportunidad",
  "message": "Me gustaría hablar sobre un proyecto."
}
```

Si `CONTACT_WEBHOOK_URL` está configurado, cada mensaje guardado dispara un `POST` externo con evento `contact.message.created`. Si `CONTACT_WEBHOOK_SECRET` existe, se añade firma HMAC SHA-256 en `X-Portfolio-Signature`.

Cada intento de entrega o prueba de webhook registra un `AuditLog` con evento, estado HTTP si existe y resultado `configured/dispatched`. No se guardan URL, secreto, cuerpo del mensaje ni contenido personal del contacto en ese registro.

Privacidad de contacto:

- `CONTACT_IP_HASH_SALT`: sal opcional para el hash de IP.
- `CONTACT_STORE_USER_AGENT=false`: evita persistir user-agent en nuevos mensajes.

Endpoints admin de webhook:

- `GET /contact-messages/webhook/status`: protegido para `admin`, `editor` y `viewer`; indica si URL/secret están configurados sin exponer valores.
- `GET /contact-messages/webhook/deliveries`: protegido para `admin`, `editor` y `viewer`; devuelve los 10 últimos intentos auditados sin URL, secreto ni payload.
- `POST /contact-messages/webhook/test`: protegido para `admin` y `editor`; envía un evento `contact.webhook.test` sin datos personales.

## Integraciones

### LinkedIn

- `GET /integrations/linkedin/status`: devuelve si OAuth está configurado, URL de perfil y scopes previstos.
- `GET /integrations/linkedin/share-url?path=/cv`: construye una URL de compartir en LinkedIn para una ruta pública.
- `GET /integrations/linkedin/auth-url`: protegido con `manage_integrations`; construye URL OAuth si `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` y `LINKEDIN_REDIRECT_URI` están configurados.
- `GET /integrations/linkedin/callback?code=...&state=...`: protegido con `manage_integrations`; intercambia el `code` por token, consulta OpenID `userinfo` y devuelve perfil sanitizado sin exponer el access token.

Sin credenciales LinkedIn, el sistema mantiene integración pública mediante enlace de perfil y share URL.

## Media

El módulo de media usa `MediaStorageService` para aislar almacenamiento. La implementación activa es local (`MEDIA_STORAGE_PROVIDER=local`) y queda preparada para sustituirse por S3/R2/Supabase Storage sin cambiar el frontend.

Variables principales:

- `STORAGE_DIR`: directorio base local.
- `MEDIA_STORAGE_PROVIDER`: proveedor activo. Actualmente soportado: `local`.
- `MEDIA_MAX_FILE_SIZE_MB`: tamaño máximo por archivo.
- `MEDIA_STORAGE_QUOTA_MB`: cuota total opcional para assets activos.
- `MEDIA_ALLOWED_MIME_TYPES`: lista separada por comas.

Endpoints:

- `GET /media`: lista assets no eliminados.
- `GET /media/:id`: obtiene metadata de un asset.
- `GET /media/:id/download`: descarga el binario asociado a `storageKey`.
- `GET /media/storage/status`: protegido con `manage_media`; devuelve proveedor, límites, cuota opcional, MIME types y métricas `assetCount`/`usedBytes`.
- `POST /media/storage/purge-deleted`: protegido con `purge_media`; purga archivos locales de assets ya eliminados con `retentionDays` opcional y `dryRun`.
- `POST /media/upload`: protegido con `manage_media`; acepta `multipart/form-data` con `file`, `altText` opcional y `type` opcional.
- `POST|PATCH|DELETE /media`: protegido con `manage_media`; mantiene registro manual/edición/soft delete de metadata.
- `POST /media/upload`, `DELETE /media/:id` y la purga diferida registran auditoría en `AuditLog`.

Ejemplo `multipart/form-data`:

```text
file=<PDF/DOCX/imagen>
altText=CV principal Abel Valle Rosa
type=cv-manual
```

## Publicación Admin

El workflow draft/publish real está conectado a `ThemeSettings` y `Profile`, que guardan `draftJson` y `publishedAt`.

`PATCH /profile` usa DTO validado: solo acepta campos propios del perfil, `draftJson` y `publishedAt`; campos desconocidos se descartan por whitelist y el email debe tener formato válido.

`PATCH /theme` usa DTO validado: solo acepta tokens visuales del tema, `draftJson` y `publishedAt`; los colores deben usar formato hex `#RRGGBB` y `cardStyle`/`colorMode` se limitan a valores conocidos.

- `GET /admin/publication/theme/review`: protegido con `read_publication`; devuelve comparación campo a campo entre tema publicado y borrador.
- `POST /admin/publication/theme/publish`: protegido con `manage_publication`; publica el borrador, limpia `draftJson`, actualiza `publishedAt` y registra `ChangeLog` + `AuditLog`.
- `GET /admin/publication/profile/review`: protegido con `read_publication`; devuelve comparación campo a campo entre perfil publicado y borrador.
- `POST /admin/publication/profile/publish`: protegido con `manage_publication`; publica el borrador del perfil, limpia `draftJson`, actualiza `publishedAt` y registra `ChangeLog` + `AuditLog`.
- `GET /admin/publication/experiences/:id/review`: protegido con `read_publication`; devuelve comparación campo a campo entre experiencia publicada y borrador.
- `POST /admin/publication/experiences/:id/publish`: protegido con `manage_publication`; publica el borrador de una experiencia, limpia `draftJson`, actualiza `publishedAt` y registra `ChangeLog` + `AuditLog`.
- `GET /admin/publication/changelog`: protegido con `read_publication`; lista cambios recientes.
- `POST /admin/publication/changelog/:id/restore`: protegido con `manage_publication`; restaura cambios de tema, perfil o experiencia usando `beforeJson` y registra una nueva entrada `restore`.

Ejemplo de respuesta de revisión:

```json
{
  "entityType": "theme",
  "entityId": "theme-id",
  "hasDraft": true,
  "fields": [
    {
      "field": "primaryColor",
      "before": "#5eead4",
      "after": "#14b8a6",
      "changed": true
    }
  ]
}
```
