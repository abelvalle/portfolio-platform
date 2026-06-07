# Contributing

Gracias por revisar o extender Portfolio Platform. El objetivo del repositorio es mantener una arquitectura clara, publicable y facil de auditar.

## Flujo de ramas

- `develop`: rama principal de trabajo y default branch.
- `master`: rama estable.
- Abre ramas desde `develop` para cambios nuevos.
- Manten los commits pequenos y con una intencion clara.

## Antes de abrir PR

Ejecuta las comprobaciones relevantes:

```bash
npm run db:generate
npm run lint
npm run test
npm run build
```

Para cambios frontend con comportamiento renderizado:

```bash
npm --prefix apps/web run test:e2e -- landing.spec.ts --project=chromium
```

Para la prueba opcional con PostgreSQL real, usa `RUN_DB_E2E=true` solo cuando tengas una base de datos local valida.

## Reglas de contenido CV

- No inventes empresas, fechas, certificaciones, estudios ni experiencia profesional.
- Marca cualquier contenido demo como `sample/demo`.
- No guardes secretos ni credenciales reales en el repositorio.

## Arquitectura

- El frontend consume la API REST; no debe acceder directamente a PostgreSQL.
- El backend mantiene la logica de negocio, autenticacion, CV Manager, exportacion y adaptacion.
- Los cambios de infraestructura deben actualizar `docs/deployment.md` o `docs/arquitectura.md` cuando cambie el comportamiento operativo.

## Seguridad

- Manten validacion de inputs, guards y permisos en endpoints privados.
- No relajes CORS, headers, rate limiting ni protecciones admin sin justificarlo.
- Si anades integraciones externas, documenta variables de entorno en `.env.example` sin secretos reales.
