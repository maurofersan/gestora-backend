Un App móvil

Notificaciones a todos por algún retraso (menos al cliente)

Cronograma

Una empresa tiene proyectos, cada proyecto tiene un solo cliente, el cliente solo puede ver su proyecto

Dos tipos de usuario:
Usuario de empresa:

> Gerente, Residente (Usuario que visualiza todo pero no modifica nada)
> Último planificador (Acceso total a modificar toda actividad, registrar urgencias, registra acuerdos de reuniones)
> Usuarios por especialidad que solo pueden editar las actividades relacionadas a su especialidad, puede ver todo
> Usuario cliente (puede visualizar todo lo de su proyecto, resuelve deberes)

Proyecto tiene varias partidas

Tenemos partidas, una partida tiene varias actividades, tiene una sola especialidad

Una actividad tiene un estado (verde, amarillo y rojo), identificador, descripción, tiene restricciones, evidencias, incumplimiento, un sector, fecha de inicio planificado, duración planificada y fecha fin planificada, fecha de inicio real, duración real, fecha fin real

Un incumplimiento tiene una medida correctiva (texto)

Una restricción: texto

Una evidencia son imágenes

La alerta por fecha fin, la alerta llega a notificaciones

Deberes, descripción o nota, su finalidad es que el cliente lea esta nota, se informe y levante las urgencias, también debe tener un estado (pendiente y resuelto)

Acuerdos, un acuerdo está relacionado a un Área, tiene un texto (nota), estado (pendiente o resuelto)

Pantallas:

Cliente:
Gráficos

Empresa:
Avance total es un resumen de avance de las actividades del proyecto
PPC (Porcentaje de plan cumplido): Lista de Actividades y un indicador que diga si se cumplieron o no
Ranking de fallas del proyecto

---

Último planificador será admin, podrá registrar usuarios

Último planificador: Compromisos, Avance gráfico, Avance Total, Lookahead, PPC Semanal,
Urgencias, Visualización de Proyecto, Registro de usuarios

Cliente: Avance gráfico, Urgencias, Visualización de Proyecto

Gerente o Residente: Compromisos, Avance gráfico, Avance Total, Lookahead, PPC Semanal,
Urgencias, Visualización de Proyecto (todo lectura)

Especialista: Compromisos, Avance gráfico, Avance Total, Lookahead, PPC Semanal,
Urgencias, Visualización de Proyecto (Ve todo, y solo puede modificar lo de su área)

Último planificador registra acuerdos de reuniones

---

Área (Nombre) > Reunión (Descripción y fecha) > Acuerdos (Descripción)

el select del filtro de fecha por semana debe ser asi (por ejemplo):

> Semana Actual 04/05/2026 - 10/05/2026
> Semana 27/04/2026 - 03/05/2026
> Semana 20/04/2026 - 26/04/2026

---

último planificador debe poder subir cronograma al inicios

---

Estados de actividad:

- verde: cuando esta culminado la actividad
- amarillo: pendiente pero todavia la fecha fin no ha llegado
- rojo: pendiente pero ya se paso de la fecha fin es rojo, esta atrasado

---

MongoDB Atlas:

- Usa variables de entorno en `.env` (no subir credenciales al repo). Copia `.env.example` → `.env`.
- `MONGODB_URI`: connection string de Atlas (usuario/clave con permisos de lectura/escritura).
- `MONGODB_DATABASE`: nombre de la base (ej. `gestora`).

**Importante:** si alguna vez pegaste usuario/clave en este archivo o en el chat, **rótalos en Atlas** y genera una contraseña nueva.
