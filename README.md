# Portfolio Platform

Portfolio/CV profesional para Abel Valle Rosa: landing pública premium, panel admin privado, API REST modular y CV Manager con versiones, exportación y adaptación a roles.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
- Backend: NestJS, TypeScript, REST, Swagger/OpenAPI.
- Base de datos: PostgreSQL.
- ORM: Prisma.
- Auth: JWT + refresh tokens, roles `admin`, `editor`, `viewer`.
- Infra: Docker Compose.

## Arquitectura

```text
apps/web      Next.js frontend
apps/api      NestJS REST API
packages/shared  tipos y seed compartidos
packages/ui      reservado para UI compartida
packages/config  configuración compartida
infra         Docker Compose
docs          documentación técnica
```

El frontend consume la API. No accede directamente a PostgreSQL.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4000/api/v1`

Swagger: `http://localhost:4000/api/docs` en desarrollo. En produccion queda desactivado salvo que `API_SWAGGER_ENABLED=true`.

Health: `http://localhost:4000/api/v1/health/live` y `/health/ready`

## PostgreSQL con Docker

```bash
npm run docker:up
```

## Variables de entorno

Copia `.env.example` a `.env` para desarrollo local y ajusta secretos.

Variables opcionales de analitica:

- `ANALYTICS_IP_HASH_SALT`: sal para hashes de IP.
- `ANALYTICS_STORE_USER_AGENT=false`: evita guardar user-agent.
- `ANALYTICS_RETENTION_DAYS`: dias de retencion antes de purgar eventos antiguos.

Variables opcionales de media:

- `MEDIA_SIGNATURE_SCAN_ENABLED=false`: desactiva el bloqueo local de firmas EICAR en uploads.
- `MEDIA_EXTERNAL_SCAN_URL`: activa scanner HTTP externo antes de escribir uploads.

Variables opcionales de contacto:

- `CONTACT_IP_HASH_SALT`: sal para hashes de IP en mensajes de contacto.
- `CONTACT_STORE_USER_AGENT=false`: evita guardar user-agent en mensajes de contacto.
- `CONTACT_EMAIL_PROVIDER=resend|generic`: activa notificacion email no bloqueante para nuevos mensajes.
- `CONTACT_EMAIL_API_KEY`, `CONTACT_EMAIL_FROM`, `CONTACT_EMAIL_TO`: credenciales y routing del proveedor, siempre fuera del repositorio.

## Migraciones y seed

```bash
npm run db:migrate
npm run db:seed
```

El seed usa los CVs adjuntos como fuente inicial y marca proyectos inventados como `sample/demo`.

## Pruebas

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

## CI

GitHub Actions ejecuta una puerta base sobre `develop` y `master`: `npm ci`, `db:generate`, instalacion de Chromium para tests PDF/visual, lint, tests, build y validacion de Docker Compose. Ademas corre un smoke e2e Chromium para headers de seguridad del frontend. Los e2e largos o con PostgreSQL real quedan como validacion manual/operativa para no depender de servicios externos en cada push.

Dependabot revisa semanalmente dependencias npm y GitHub Actions, agrupando actualizaciones de Next/React, Nest/Prisma y tooling frontend.

E2E opcional con PostgreSQL real para generacion/descarga de CV:

```powershell
$env:DATABASE_URL="postgresql://portfolio:portfolio@localhost:5432/portfolio_platform?schema=e2e_cv"
$env:RUN_DB_E2E="true"
npm run test:e2e:db
```

Sin `RUN_DB_E2E=true`, esta prueba se salta para no romper entornos sin Postgres disponible.

Para ejecutarla con Docker Compose, primero debe estar activo Docker Desktop y levantado PostgreSQL con `npm run docker:up`. Si usas una instancia local externa, ajusta `DATABASE_URL` con credenciales reales; las credenciales de ejemplo pueden fallar si tu Postgres local ya tiene otra configuración.

## Admin

Login: `/login`

Email por defecto: `abel.valle.rosa@gmail.com`

Password por defecto: valor de `ADMIN_PASSWORD` en `.env`. En `NODE_ENV=production`, la API rechaza arrancar con secretos placeholder.

## CV Manager

Incluye:

- CV principal estructurado.
- Versiones por rol.
- Plantillas Minimalista, Ejecutiva, Técnica, ATS-friendly, Una página y Dos páginas.
- Exportación DOCX/PDF.
- Adaptación a oferta basada en reglas, sin inventar experiencia.
- Comparador de versiones.

## Deploy

- Frontend: Vercel.
- Backend: Render, Fly.io o Railway.
- DB: PostgreSQL gestionado.
- Vercel frontend: config opcional en `apps/web/vercel.json`.
- Render backend: Blueprint opcional en `infra/render.yaml`.

Ver [deployment.md](docs/deployment.md).

## Ramas

- `master`: rama estable.
- `develop`: rama principal de trabajo.

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para flujo de ramas, checklist de PR y reglas de contenido CV.

## Capturas

Pendiente añadir capturas finales en `docs/screenshots/`.

## Roadmap

Ver [roadmap.md](docs/roadmap.md).
