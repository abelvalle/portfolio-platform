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

Swagger: `http://localhost:4000/api/docs`

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

## Migraciones y seed

```bash
npm run db:migrate
npm run db:seed
```

El seed usa los CVs adjuntos como fuente inicial y marca proyectos inventados como `sample/demo`.

## Admin

Login: `/login`

Email por defecto: `abel.valle.rosa@gmail.com`

Password por defecto: valor de `ADMIN_PASSWORD` en `.env`.

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

Ver [deployment.md](docs/deployment.md).

## Ramas

- `master`: rama estable.
- `develop`: rama principal de trabajo.

## Capturas

Pendiente añadir capturas finales en `docs/screenshots/`.

## Roadmap

Ver [roadmap.md](docs/roadmap.md).
