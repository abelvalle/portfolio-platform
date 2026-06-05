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

MFA no está activado por defecto en seed para evitar bloquear el primer acceso admin.

## Endpoints principales

- `GET /profile`, `PATCH /profile`
- `GET /theme`, `PATCH /theme`
- `GET|POST|PATCH|DELETE /experiences`
- `GET|POST|PATCH|DELETE /education`
- `GET|POST|PATCH|DELETE /certifications`
- `GET|POST|PATCH|DELETE /skills`
- `GET|POST|PATCH|DELETE /projects`
- `POST /contact-messages`
- `GET /admin/dashboard`
- `GET|POST /users`
- `PATCH|DELETE /users/:id`
- `GET /users/permissions`
- `POST /analytics/events`

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
