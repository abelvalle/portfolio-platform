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

## Permisos

La API mantiene roles (`admin`, `editor`, `viewer`) y una matriz de permisos por accion. El primer guard por permiso se aplica a `/users` con `manage_users`; esto permite evolucionar endpoints hacia permisos granulares sin cambiar el contrato JWT.

## Endpoints principales

- `GET /profile`, `PATCH /profile`
- `GET /theme`, `PATCH /theme`
- `GET|POST|PATCH|DELETE /experiences`
- `GET|POST|PATCH|DELETE /education`
- `GET|POST|PATCH|DELETE /certifications`
- `GET|POST|PATCH|DELETE /skills`
- `GET|POST|PATCH|DELETE /projects`
- `POST /contact-messages`
- `GET /contact-messages?status=unread&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /contact-messages/webhook/status`
- `POST /contact-messages/webhook/test`
- `GET /admin/dashboard`
- `GET /admin/publication/theme/review`
- `POST /admin/publication/theme/publish`
- `GET /admin/publication/profile/review`
- `POST /admin/publication/profile/publish`
- `GET /admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /admin/publication/changelog`
- `POST /admin/publication/changelog/:id/restore`
- `GET /app-modules`
- `PATCH /app-modules/:id`
- `GET|POST /users` (`manage_users`)
- `PATCH|DELETE /users/:id` (`manage_users`)
- `GET /users/permissions` (`manage_users`)
- `GET /integrations/linkedin/status`
- `GET /integrations/linkedin/share-url`
- `GET /integrations/linkedin/auth-url`
- `GET /integrations/linkedin/callback?code=...&state=...`
- `GET /media`
- `GET /media/:id`
- `GET /media/:id/download`
- `GET /media/storage/status`
- `POST /media/upload`
- `POST /analytics/events`
- `GET /analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&type=cv_download`

## CV

- `GET /cv`
- `GET /cv/:id`
- `POST /cv`
- `PATCH /cv/:id`
- `DELETE /cv/:id`
- `POST /cv/import`
- `POST /cv/:id/generate-pdf`
- `POST /cv/:id/generate-docx`
- `GET /cv/:id/ats-report`
- `POST /cv/:id/generate-ats-pdf`
- `POST /cv/:id/generate-ats-docx`
- `POST /cv/:id/set-primary`
- `GET|POST|PATCH|DELETE /cv-versions`
- `POST /cv-versions/:id/generate-pdf`
- `POST /cv-versions/:id/generate-docx`
- `POST /cv-versions/:id/set-primary`
- `GET|POST|PATCH|DELETE /cv-templates`
- `GET|POST|PATCH|DELETE /cv-target-roles`
- `POST /cv/adapt-to-role`
- `POST /cv/compare-versions`

### Adaptación de CV

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

### Exportación con plantilla

`POST /cv/:id/generate-pdf` y `POST /cv/:id/generate-docx` usan la plantilla asociada a la versión primaria/publicada (`CvVersion.template`).

`POST /cv-versions/:id/generate-pdf` y `POST /cv-versions/:id/generate-docx` generan archivos para una versión concreta, actualizan `generatedPdfId` o `generatedDocxId` en esa fila y registran el resultado como `MediaAsset` descargable.

`POST /cv-versions/:id/set-primary` marca una versión como principal dentro de su CV, limpia `isPrimary` del resto de versiones del mismo `cvId` y publica la versión seleccionada.

La exportación aplica:

- `primaryColor` para títulos y secciones.
- `fontFamily` en DOCX y HTML de preview/export.
- `density=compact` para ajustar tamaños y espaciado.
- `slug` de plantilla en el nombre de archivo generado.
- metadata `template` en `MediaAsset` y `CvGeneratedFile`.

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

Endpoints admin de webhook:

- `GET /contact-messages/webhook/status`: protegido para `admin`, `editor` y `viewer`; indica si URL/secret están configurados sin exponer valores.
- `POST /contact-messages/webhook/test`: protegido para `admin` y `editor`; envía un evento `contact.webhook.test` sin datos personales.

## Integraciones

### LinkedIn

- `GET /integrations/linkedin/status`: devuelve si OAuth está configurado, URL de perfil y scopes previstos.
- `GET /integrations/linkedin/share-url?path=/cv`: construye una URL de compartir en LinkedIn para una ruta pública.
- `GET /integrations/linkedin/auth-url`: protegido para admin; construye URL OAuth si `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` y `LINKEDIN_REDIRECT_URI` están configurados.
- `GET /integrations/linkedin/callback?code=...&state=...`: protegido para admin; intercambia el `code` por token, consulta OpenID `userinfo` y devuelve perfil sanitizado sin exponer el access token.

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
- `GET /media/storage/status`: protegido para `admin` y `editor`; devuelve proveedor, límites, cuota opcional, MIME types y métricas `assetCount`/`usedBytes`.
- `POST /media/storage/purge-deleted`: protegido para `admin`; purga archivos locales de assets ya eliminados con `retentionDays` opcional y `dryRun`.
- `POST /media/upload`: protegido para `admin` y `editor`; acepta `multipart/form-data` con `file`, `altText` opcional y `type` opcional.
- `POST|PATCH|DELETE /media`: protegido para `admin` y `editor`; mantiene registro manual/edición/soft delete de metadata.
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

- `GET /admin/publication/theme/review`: protegido para `admin`, `editor` y `viewer`; devuelve comparación campo a campo entre tema publicado y borrador.
- `POST /admin/publication/theme/publish`: protegido para `admin` y `editor`; publica el borrador, limpia `draftJson`, actualiza `publishedAt` y registra `ChangeLog` + `AuditLog`.
- `GET /admin/publication/profile/review`: protegido para `admin`, `editor` y `viewer`; devuelve comparación campo a campo entre perfil publicado y borrador.
- `POST /admin/publication/profile/publish`: protegido para `admin` y `editor`; publica el borrador del perfil, limpia `draftJson`, actualiza `publishedAt` y registra `ChangeLog` + `AuditLog`.
- `GET /admin/publication/changelog`: protegido para `admin`, `editor` y `viewer`; lista cambios recientes.
- `POST /admin/publication/changelog/:id/restore`: protegido para `admin` y `editor`; restaura cambios de tema o perfil usando `beforeJson` y registra una nueva entrada `restore`.

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
