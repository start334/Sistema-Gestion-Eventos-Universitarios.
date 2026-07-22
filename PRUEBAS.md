# Plan de pruebas

Se realizaron pruebas sobre las principales funcionalidades del Sistema de Gestión de Eventos Universitarios.

## CP-01 Registro de usuarios

**Objetivo:** Verificar que un usuario pueda registrarse correctamente.

**Datos de entrada:** Nombre completo, correo institucional, contraseña válida y rol del usuario.

**Procedimiento:**

1. Seleccionar la opción Registrarse.
2. Ingresar los datos solicitados.
3. Seleccionar el rol correspondiente.
4. Presionar el botón Crear cuenta.

**Resultado esperado:** El usuario queda registrado y puede continuar al apartado de selección de imagen de perfil.

**Resultado obtenido:** El usuario fue registrado correctamente y el sistema mostró la pantalla para elegir su imagen de perfil.

**Estado:** Aprobada.

## CP-02 Gestión de eventos

**Objetivo:** Verificar que un organizador pueda crear correctamente un evento universitario.

**Datos de entrada:** Nombre del evento, fecha, hora, lugar, cantidad de cupos y descripción.

**Procedimiento:**

1. Iniciar sesión como organizador.
2. Ingresar al apartado Gestionar eventos.
3. Completar los datos solicitados.
4. Presionar el botón Crear evento.

**Resultado esperado:** El evento queda almacenado y aparece en la lista de eventos registrados.

**Resultado obtenido:** El evento fue creado correctamente y apareció disponible en el sistema.

**Estado:** Aprobada.

## CP-03 Inscripción a eventos

**Objetivo:** Verificar que un estudiante pueda inscribirse correctamente en un evento disponible.

**Datos de entrada:** Estudiante autenticado y evento disponible con cupos.

**Procedimiento:**

1. Iniciar sesión como estudiante.
2. Ingresar al apartado Eventos disponibles.
3. Seleccionar un evento.
4. Presionar el botón Inscribirme.

**Resultado esperado:** El sistema registra la inscripción y muestra la confirmación correspondiente.

**Resultado obtenido:** El estudiante se inscribió correctamente y la inscripción quedó registrada.

**Estado:** Aprobada.
