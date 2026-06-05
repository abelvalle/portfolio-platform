# Roadmap

Estado actualizado: 2026-06-06 01:32 CEST.

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

### MFA preparado para admin

- Añadidos campos MFA en `User` y migración Prisma `000002_add_mfa_support`.
- Añadido servicio TOTP con códigos de 6 dígitos, ventana temporal estándar y recovery codes generados una sola vez.
- Recovery codes almacenados como hashes bcrypt, no en claro.
- Login mantiene el flujo actual cuando MFA está desactivado.
- Si MFA está activado, `POST /auth/login` devuelve un reto temporal y no emite tokens finales hasta `POST /auth/mfa/verify-login`.
- Añadidos endpoints protegidos para estado, setup, confirmación y desactivación MFA.
- Login frontend preparado para segundo paso MFA cuando la API responda `mfaRequired`.
- Admin settings muestra el estado funcional del módulo MFA y endpoints disponibles.
- `docs/api.md` actualizado con el flujo MFA.

Verificación realizada en este hito:

- `npm.cmd run db:generate`
- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`
- `npm.cmd --prefix apps/api run lint`
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Editor visual de estilos avanzado

- El editor de tema carga los tokens actuales desde el snapshot de portfolio.
- Añadidos controles de color con swatch y valor editable para principal, secundario, fondo y texto.
- Añadidos controles para tipografía, radio de bordes, estilo de cards, intensidad de animaciones y modo oscuro/claro.
- Añadida vista previa viva con estilos aplicados en tiempo real.
- Añadida persistencia: guardar borrador escribe `draftJson`; publicar envía tokens y `publishedAt` a `PATCH /theme`.
- Añadida acción `adminClient.updateTheme` para centralizar el consumo del endpoint.

Verificación realizada en este hito:

- `npm.cmd run build:web`
- `npm.cmd --prefix apps/web run lint`
- QA visual Playwright en `/admin/portfolio/theme` con cookie local de test; no se pulsó guardar al no existir sesión API real en la comprobación visual.
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Exportación ATS avanzada

- Añadido `CvAtsService` para scoring ATS, checks ponderados, keywords detectadas y recomendaciones.
- Añadidos tests unitarios del validador ATS.
- Añadidos endpoints protegidos:
  - `GET /api/v1/cv/:id/ats-report`
  - `POST /api/v1/cv/:id/generate-ats-pdf`
  - `POST /api/v1/cv/:id/generate-ats-docx`
- Exportación ATS genera archivos con sufijo `-ats` y metadata de score/status.
- La plantilla `ATS-friendly` del panel muestra capacidades específicas: texto plano, score ATS y PDF/DOCX ATS.
- `docs/api.md` actualizado con el reporte ATS y endpoints nuevos.

Verificación realizada en este hito:

- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run test`
- `npm.cmd run build:web`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

### Integración IA opcional para adaptación de CV

- Añadido `CvAiAdapterService` como proveedor IA externo opcional por HTTP.
- Añadidas variables `CV_AI_ADAPTER_URL` y `CV_AI_ADAPTER_API_KEY` en `.env.example`.
- Si no hay proveedor configurado, la adaptación sigue usando el motor por reglas.
- Si hay proveedor configurado, sus sugerencias quedan en `adaptationMeta.aiSuggestion` como pendientes de revisión.
- La IA solo puede influir en el orden de skills/experiencias existentes; no se aceptan datos profesionales nuevos.
- Añadido test unitario para el fallback sin proveedor IA.
- `docs/api.md` actualizado con el comportamiento IA opcional.

Verificación realizada en este hito:

- `npm.cmd run build:api`
- `npm.cmd --prefix apps/api run test`

## Deuda técnica abierta

- Persistencia i18n en backend/CMS: ahora la traducción pública vive en el frontend para el seed conocido; falta modelo/API para editar traducciones desde admin.
- `html lang` global sigue configurado en `es`; para accesibilidad perfecta conviene migrar a rutas con layout por locale.
- Traducción de CV generado/exportado: el CV online se localiza, pero las exportaciones PDF/DOCX principales siguen usando la versión pública marcada en backend.
- MFA UI avanzada: falta pantalla de configuración con QR visual, copia de recovery codes y regeneración controlada desde admin.
- MFA obligatorio por rol/política: el flujo existe, pero no se fuerza todavía para todos los admins.
- Auditoría MFA granular: conviene registrar setup/confirm/disable en `AuditLog`.
- Tema global desde API: el editor persiste tokens, pero falta aplicar automáticamente esos tokens a las variables CSS de la landing/admin en runtime.
- QA de guardado autenticado: falta prueba e2e con API real y sesión admin para validar `PATCH /theme` end to end desde UI.
- ATS end to end con DB real: falta prueba e2e que genere archivos ATS desde una versión persistida y valide descarga.
- ATS por oferta concreta: el score actual valida estructura general; falta comparar contra keywords de una oferta específica.
- IA real end to end: falta probar un proveedor externo real y registrar trazabilidad de prompts/respuestas sin almacenar secretos.
- Aceptar/rechazar sugerencias IA desde UI: actualmente se guardan como metadata pendiente, falta workflow visual de revisión granular.
- Publicación draft/publish: existe estructura inicial, pero falta workflow granular con revisión de cambios por entidad.
- Media: la estrategia actual es local/demo; falta almacenamiento externo y servicio desacoplado para producción.
- Prisma muestra aviso futuro de configuración en `package.json` para Prisma 7.

## Próximos hitos priorizados

1. Sistema multiusuario y permisos granulares.
2. Webhooks de formularios/contacto.
3. Integración con LinkedIn.
4. Plantillas públicas de CV.
5. Servicio de media independiente.
