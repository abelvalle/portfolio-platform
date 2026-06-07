# Deployment

## Frontend

Deploy recomendado: Vercel.

Variables:

- `NEXT_PUBLIC_API_URL=https://api.example.com/api/v1`

Comando de build: `npm --prefix apps/web run build`

## Backend

Deploy recomendado: Render, Fly.io o Railway.

Variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `API_CORS_ORIGIN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `STORAGE_DIR`
- `MEDIA_SIGNATURE_SCAN_ENABLED` opcional para activar/desactivar el bloqueo local de firmas EICAR
- `MEDIA_EXTERNAL_SCAN_URL`, `MEDIA_EXTERNAL_SCAN_API_KEY` y `MEDIA_EXTERNAL_SCAN_TIMEOUT_MS` opcionales para scanner HTTP externo de uploads
- `CONTACT_IP_HASH_SALT` opcional para saltear hashes de IP en contacto
- `CONTACT_STORE_USER_AGENT=false` opcional para no guardar user-agent en contacto
- `CONTACT_WEBHOOK_RETRY_WORKER_ENABLED=true` para procesar reintentos webhook dentro del backend
- `CONTACT_WEBHOOK_RETRY_WORKER_INTERVAL_MS=60000` para ajustar el intervalo del worker
- `CONTACT_WEBHOOK_RETRY_CRON_SECRET` si se usa un cron externo para procesar reintentos
- `CONTACT_EMAIL_PROVIDER=disabled|resend|generic` para activar notificacion email de contactos
- `CONTACT_EMAIL_API_URL`, `CONTACT_EMAIL_API_KEY`, `CONTACT_EMAIL_FROM`, `CONTACT_EMAIL_TO` para el proveedor HTTP de email
- `CONTACT_EMAIL_TIMEOUT_MS=5000` para limitar llamadas al proveedor email
- `ANALYTICS_IP_HASH_SALT` opcional para saltear hashes de IP
- `ANALYTICS_STORE_USER_AGENT=false` opcional para no guardar user-agent
- `ANALYTICS_RETENTION_DAYS` opcional para purgar eventos antiguos
- `ANALYTICS_RETENTION_WORKER_ENABLED=true` para activar purga periodica interna si hay retencion
- `ANALYTICS_RETENTION_WORKER_INTERVAL_MS=86400000` para ajustar el intervalo de purga

Comandos:

- Build: `npm --prefix apps/api run build`
- Start: `npm --prefix apps/api run start:prod`
- Migraciones: `npm --prefix apps/api run db:deploy`
- Seed: `npm --prefix apps/api run db:seed`

Health checks:

- Liveness: `GET /api/v1/health/live`
- Readiness: `GET /api/v1/health/ready` comprueba Prisma/PostgreSQL y devuelve 503 si la base de datos no responde.

Si configuras `MEDIA_EXTERNAL_SCAN_URL`, valida el proveedor desde `/admin/media` con `Probar scanner`; la prueba usa un archivo sintetico y no escribe nada en storage.

### Worker de reintentos webhook

En un despliegue de una sola instancia, deja `CONTACT_WEBHOOK_RETRY_WORKER_ENABLED=true`. El backend procesara periodicamente `ContactWebhookRetryJob` pendientes y el panel admin mostrara el estado del worker.

En un despliegue con varias replicas, usa una sola de estas opciones:

- Mantener el worker activo solo en una replica dedicada.
- Desactivar el worker en todas las replicas con `CONTACT_WEBHOOK_RETRY_WORKER_ENABLED=false` y llamar `POST /api/v1/contact-messages/webhook/retries/cron` desde un cron externo enviando `X-Portfolio-Cron-Secret`.

El secreto HMAC de webhooks sigue viviendo en `CONTACT_WEBHOOK_SECRET`; no se guarda en base de datos ni se expone desde la API.

### Notificacion email de contacto

La notificacion email es opcional y no sustituye el guardado en base de datos. Para Resend, configura `CONTACT_EMAIL_PROVIDER=resend`, `CONTACT_EMAIL_API_KEY`, `CONTACT_EMAIL_FROM` y `CONTACT_EMAIL_TO`; si `CONTACT_EMAIL_API_URL` queda vacia, se usa `https://api.resend.com/emails`. Para otro proveedor HTTP compatible, usa `CONTACT_EMAIL_PROVIDER=generic` y define `CONTACT_EMAIL_API_URL`.

El panel `/admin/settings` solo muestra si los valores estan configurados. No devuelve ni guarda API key, remitente ni destinatario. Tras desplegar, usa `Probar email` para enviar un mensaje sintetico sin datos personales y confirmar el proveedor.

### Rotacion de secreto webhook

El panel admin muestra un checklist de rotacion y permite validar un candidato contra `CONTACT_WEBHOOK_SECRET`, pero no guarda secretos. Flujo recomendado:

1. Crear el nuevo valor en el gestor de secretos del proveedor.
2. Desplegar el backend con el nuevo `CONTACT_WEBHOOK_SECRET`.
3. Validar el candidato desde `/admin/settings`.
4. Enviar `contact.webhook.test` desde el panel y revisar entregas recientes.
5. Retirar el secreto anterior del proveedor externo.

### Worker de retencion Analytics

Si `ANALYTICS_RETENTION_DAYS` esta configurado, `ANALYTICS_RETENTION_WORKER_ENABLED=true` activa una purga periodica interna de eventos antiguos.

En multi-replica, evita que todas las instancias purguen a la vez:

- Mantener el worker activo solo en una replica dedicada.
- O desactivar el worker con `ANALYTICS_RETENTION_WORKER_ENABLED=false` y ejecutar `POST /api/v1/analytics/retention/prune` desde una tarea programada con sesion admin/credenciales de backend.

## Base de datos

PostgreSQL 16. En local:

```bash
npm run docker:up
```

Adminer queda disponible en `http://localhost:8080`.

Para ejecutar la prueba e2e opcional con base de datos real, levanta primero Docker Desktop y PostgreSQL con `npm run docker:up`. Si usas una instancia Postgres local distinta, actualiza `DATABASE_URL` con credenciales reales antes de ejecutar `RUN_DB_E2E=true npm run test:e2e:db`.
