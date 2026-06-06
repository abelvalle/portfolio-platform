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
- `ANALYTICS_IP_HASH_SALT` opcional para saltear hashes de IP
- `ANALYTICS_STORE_USER_AGENT=false` opcional para no guardar user-agent
- `ANALYTICS_RETENTION_DAYS` opcional para purgar eventos antiguos

Comandos:

- Build: `npm --prefix apps/api run build`
- Start: `npm --prefix apps/api run start:prod`
- Migraciones: `npm --prefix apps/api run db:deploy`
- Seed: `npm --prefix apps/api run db:seed`

## Base de datos

PostgreSQL 16. En local:

```bash
npm run docker:up
```

Adminer queda disponible en `http://localhost:8080`.
