# Gestora — Backend (NestJS + MongoDB Atlas)

API REST para la app móvil **Gestora** (cronograma, PPC semanal, lookahead, urgencias, evidencias, reuniones/acuerdos y dashboards).

## Arquitectura elegida (y por qué)

Se usa un **monolito modular por dominio** (feature modules de NestJS):

- Cada bounded context tiene su **módulo**: `activities`, `projects`, `meetings`, `ppc`, etc.
- Por cada dominio: **controller** (HTTP), **service** (casos de uso), **schemas Mongoose** (persistencia) y **DTOs** con `class-validator`.
- **SOLID aplicado de forma pragmática**:
  - **S**: servicios acotados (`ActivitiesService`, `PpcService`, …).
  - **O**: nuevas pantallas/reglas suelen añadir endpoints o servicios sin romper contratos existentes.
  - **L**: guards sustituibles (`JwtAuthGuard`, `RolesGuard`, `ProjectAccessGuard`).
  - **I**: contratos HTTP explícitos vía DTOs pequeños.
  - **D**: los servicios dependen de modelos Mongoose inyectados (`@InjectModel`), no de implementaciones fijas.

**`CoreModule` (@Global)** centraliza el modelo `Project` y exporta `ProjectAccessGuard`, porque muchos guards/rutas necesitan validar acceso por `projectId`.

**Autenticación**: JWT (`Bearer`). Payload incluye rol, tipo de usuario, `companyId`, `specialtyId` y `projectIds`.

**Tipado TypeScript**: interfaces separadas (`JwtPayload` vs `AuthenticatedUser`) y `import type` donde hace falta para compatibilidad con `isolatedModules` + decoradores.

Prefijo global: **`/api/v1`**.

## Requisitos

- Node.js 20+
- Cuenta MongoDB Atlas y cadena de conexión

## Configuración

1. Copia `.env.example` a `.env`.
2. Completa al menos:
   - `MONGODB_URI` — URI de Atlas (usuario con permisos de lectura/escritura sobre la BD).
   - `MONGODB_DATABASE` — por defecto `gestora`.
   - `JWT_SECRET` — **mínimo 16 caracteres** (validado al arrancar).
   - `JWT_EXPIRES_IN` — ej. `7d`.

```bash
npm install
npm run start:dev
```

- Salud: `GET http://localhost:3000/api/v1/health`
- Primera vez (BD vacía): `POST /api/v1/setup/bootstrap` (crea empresa + usuario **último planificador**).

## MongoDB Atlas: ¿crear colecciones e índices a mano?

**No es obligatorio.** Al insertar documentos, Mongo crea las colecciones. Los **índices** están declarados en los schemas (`schema.index(...)`) y Mongoose los creará al sincronizar índices según versión/configuración.

**Recomendado en producción:**

1. Tras el primer deploy, revisar en Atlas → **Performance Advisor** / **Indexes** si falta algo.
2. Opcional: ejecutar en Atlas Shell o Compass la creación explícita de índices únicos críticos (`users.email`, `activities` por `projectId + code`, `ppcweeklies` por `projectId + specialtyId + weekStart`, etc.) si tu política es “infra-as-code” aparte.

## Convención de semanas (PPC / lookahead)

El backend normaliza con **`getWeekRangeMondaySunday`**: semana **lunes → domingo** en la zona horaria del **servidor** (MVP). Para alinear con `project.timezone`, el siguiente paso sería usar `luxon`/`date-fns-tz` en esos servicios.

## Endpoints principales (React Native)

| Área | Método | Ruta |
|------|--------|------|
| Setup | POST | `/setup/bootstrap` |
| Auth | POST | `/auth/login` |
| Usuario | GET | `/users/me` |
| Usuario | POST | `/users` (último planificador) |
| Usuario | GET | `/users/by-project/:projectId` |
| Empresa | POST | `/companies` |
| Empresa | GET | `/companies/:companyId` |
| Proyectos | GET | `/projects` |
| Proyectos | POST | `/projects` |
| Proyectos | GET | `/projects/:projectId` |
| Proyectos | PATCH | `/projects/:projectId` |
| Especialidades | GET/POST | `/companies/:companyId/specialties` |
| Sectores | GET/POST | `/projects/:projectId/sectors` |
| Partidas | GET/POST | `/projects/:projectId/work-packages` |
| Actividades | GET/POST/PATCH | `/projects/:projectId/activities` … |
| Actividades | POST | `.../activities/:activityId/restrictions` |
| Actividades | PATCH | `.../activities/:activityId/non-compliance` |
| Evidencias | GET/POST | `/projects/:projectId/activities/:activityId/evidence` |
| Urgencias | GET/POST/PATCH | `/projects/:projectId/duties` … |
| Áreas reunión | GET/POST | `/projects/:projectId/meeting-areas` (GET incluye `pendingAgreementsCount`) |
| Reuniones | GET/POST | `/projects/:projectId/meeting-areas/:areaId/meetings` (GET incluye `agreementsTotal`, `agreementsPending`) |
| Acuerdos | GET/POST | `/projects/:projectId/meetings/:meetingId/agreements` |
| Acuerdos | PATCH | `/projects/:projectId/agreements/:agreementId` |
| PPC | GET | `/projects/:projectId/ppc/weeks` (respuesta: `YYYY-MM-DD` por semana, TZ del proyecto) |
| PPC | GET | `/projects/:projectId/ppc` (query: `specialtyId`, `weekAnchor`=`YYYY-MM-DD` civil en `projects.timezone`) |
| PPC | POST | `/projects/:projectId/ppc/regenerate` (body: `specialtyId`, `weekAnchor` `YYYY-MM-DD`) |
| Lookahead | GET | `/projects/:projectId/lookahead` (`weekAnchor` `YYYY-MM-DD`) |
| Lookahead | PUT | `/projects/:projectId/lookahead` (body: `weekAnchor` `YYYY-MM-DD`, `items`) |
| Dashboard | GET | `/projects/:projectId/dashboard/summary` |
| Dashboard | GET | `/projects/:projectId/dashboard/progress-chart` |
| Dashboard | GET | `/projects/:projectId/dashboard/ranking-fallas` |
| Notificaciones | GET | `/me/notifications` |
| Notificaciones | PATCH | `/me/notifications/:notificationId/read` |
| Cronograma | GET/POST | `/projects/:projectId/schedule-uploads` |

Cabecera típica: `Authorization: Bearer <access_token>`.

## Permisos (resumen)

- **Cliente**: lectura en proyecto asignado; crea/edita **urgencias**; sin reuniones/acuerdos ni edición de actividades.
- **Gerente / Residente**: lectura (según acceso a proyecto).
- **Especialista**: lectura total del proyecto; **edición** solo actividades/evidencias de su **especialidad**; lookahead PUT permitido (refinar por especialidad en siguientes iteraciones).
- **Último planificador**: administración de proyecto (usuarios propios de empresa, reuniones/acuerdos, PPC regenerate, cronograma metadata, etc.).

## Qué te puede faltar para producción

- **Subida real de archivos** (S3 / Cloudflare R2 / GridFS): ahora evidencias y cronograma guardan **URL** ya subida desde el cliente o un servicio intermedio.
- **Jobs** (BullMQ / cron): alertas por `planned.end`, regeneración PPC recurrente, emails/push.
- **Semanas en zona horaria del proyecto** (`project.timezone`).
- **Parser de MS Project / Excel** para poblar `activities` desde `schedule-uploads`.
- **Rate limiting**, **helmet**, **rotación de JWT**, **refresh tokens**.
- **Tests e2e** por flujo crítico.

## Swagger (OpenAPI)

Con el servidor en marcha:

- **UI**: `http://localhost:3000/api/docs` (ajusta host/puerto si cambiaste `PORT`).
- Esquema **Bearer JWT**: tras hacer login en **Auth → POST /auth/login**, copia `access_token` y usa **Authorize** en Swagger.

## Scripts

```bash
npm run start:dev   # desarrollo
npm run build       # compilar
npm run start:prod  # node dist/main
npm run test        # unitarios
npm run test:e2e    # e2e (plantilla Nest)
```
