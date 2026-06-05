# Roadmap

Estado actualizado: 2026-06-06 01:00 CEST.

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

## Deuda técnica abierta

- Persistencia i18n en backend/CMS: ahora la traducción pública vive en el frontend para el seed conocido; falta modelo/API para editar traducciones desde admin.
- `html lang` global sigue configurado en `es`; para accesibilidad perfecta conviene migrar a rutas con layout por locale.
- Traducción de CV generado/exportado: el CV online se localiza, pero las exportaciones PDF/DOCX principales siguen usando la versión pública marcada en backend.
- Publicación draft/publish: existe estructura inicial, pero falta workflow granular con revisión de cambios por entidad.
- Media: la estrategia actual es local/demo; falta almacenamiento externo y servicio desacoplado para producción.
- Prisma muestra aviso futuro de configuración en `package.json` para Prisma 7.

## Próximos hitos priorizados

1. MFA preparado para admin: añadir modelo/flujo base y documentación sin activar obligatoriedad por defecto.
2. Editor visual de estilos avanzado: ampliar preview y persistencia de tokens de tema.
3. Exportación ATS avanzada: plantilla ATS y validación de secciones críticas.
4. Integración IA opcional para adaptación de CV: proveedor desacoplado y fallback por reglas.
5. Sistema multiusuario y permisos granulares.
6. Webhooks de formularios/contacto.
7. Integración con LinkedIn.
8. Plantillas públicas de CV.
9. Servicio de media independiente.
