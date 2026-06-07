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
- `CONTACT_IP_HASH_SALT` opcional para saltear hashes de IP en contacto
- `CONTACT_STORE_USER_AGENT=false` opcional para no guardar user-agent en contacto
- `CONTACT_WEBHOOK_RETRY_WORKER_ENABLED=true` para procesar reintentos webhook dentro del backend
- `CONTACT_WEBHOOK_RETRY_WORKER_INTERVAL_MS=60000` para ajustar el intervalo del worker
- `ANALYTICS_IP_HASH_SALT` opcional para saltear hashes de IP
- `ANALYTICS_STORE_USER_AGENT=false` opcional para no guardar user-agent
- `ANALYTICS_RETENTION_DAYS` opcional para purgar eventos antiguos

Comandos:

- Build: `npm --prefix apps/api run build`
- Start: `npm --prefix apps/api run start:prod`
- Migraciones: `npm --prefix apps/api run db:deploy`
- Seed: `npm --prefix apps/api run db:seed`

### Worker de reintentos webhook

En un despliegue de una sola instancia, deja `CONTACT_WEBHOOK_RETRY_WORKER_ENABLED=true`. El backend procesara periodicamente `ContactWebhookRetryJob` pendientes y el panel admin mostrara el estado del worker.

En un despliegue con varias replicas, usa una sola de estas opciones:

- Mantener el worker activo solo en una replica dedicada.
- Desactivar el worker en todas las replicas con `CONTACT_WEBHOOK_RETRY_WORKER_ENABLED=false` y llamar `POST /api/v1/contact-messages/webhook/retries/process` desde un cron externo autenticado.

El secreto HMAC de webhooks sigue viviendo en `CONTACT_WEBHOOK_SECRET`; no se guarda en base de datos ni se expone desde la API.

## Base de datos

PostgreSQL 16. En local:

```bash
npm run docker:up
```

Adminer queda disponible en `http://localhost:8080`.

Para ejecutar la prueba e2e opcional con base de datos real, levanta primero Docker Desktop y PostgreSQL con `npm run docker:up`. Si usas una instancia Postgres local distinta, actualiza `DATABASE_URL` con credenciales reales antes de ejecutar `RUN_DB_E2E=true npm run test:e2e:db`.
