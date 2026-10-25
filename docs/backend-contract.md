# Contrato backend utilizado

Revalidado en URLs, serializers, vistas, policies, services y tests de Django.
Prefijo /api/v1/, cuerpo JSON. La URL de backend solo se lee en servidor.

## Envelope y errores

```json
{
    "success": true,
    "status": "success",
    "message": "Correcto",
    "data": {},
    "meta": { "timestamp": "2026-01-01T00:00:00Z" }
}
```

No requiere version ni processing_time_ms. data puede ser null; operaciones
sin datos no usan unwrap. Se admite 204 sin JSON. Error añade
{code, type, message, details, timestamp}: type es abierto y details es unknown.
Se convierten a camelCase errores de campo con mensajes de texto. Texto,
listas u objetos anidados no se interpretan como campos. No se fija un único
status de validación: vistas usan 400 y el helper del core ofrece 422.
Unicidad de Label produce error general de integridad 400, sin inventar campo.

## Endpoints

Todas las rutas de la tabla llevan /api/v1/.

| Método/ruta                               | Entrada y salida dentro de data                                          |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| POST auth/token/                          | username/password → access, refresh, user                                |
| POST auth/token/refresh/                  | refresh → access, sin rotación                                           |
| GET auth/me/                              | perfil propio                                                            |
| POST auth/logout/                         | cuerpo vacío → revoca todos los refresh del usuario                      |
| GET users/                                | listado paginado y limitado por backend                                  |
| POST users/                               | username, email, first_name, last_name, password, role opcional → perfil |
| PATCH users/{uuid}/                       | campos autorizados del perfil → perfil                                   |
| POST users/change-password/               | current_password/new_password → id, last_password_change                 |
| POST users/{uuid}/change-password/        | new_password; exige current_password también para la propia cuenta       |
| POST users/{uuid}/change-role/            | role → id, role                                                          |
| POST users/{uuid}/activate/ y deactivate/ | cuerpo vacío → id, is_active                                             |
| GET/POST example/labels/                  | lista paginada / escritura de name                                       |
| PATCH example/labels/{uuid}/              | name → Label                                                             |
| DELETE example/labels/{uuid}/             | desactiva y conserva registro; data null                                 |

No se implementan otros recursos del ejemplo ni auditoría de sesiones.
El backend tiene detalle, PUT y filtros POST, pero no se añaden wrappers sin uso.
No existe catálogo HTTP de roles.

## Campos, filtros y paginación

User: UUID, username, email, first_name, last_name, role, is_active, created,
modified, created_by, updated_by, last_login, last_password_change.
Auditoría con UUID nullable. Sin empresa, área, documentos, avatar, firma,
role_display, is_staff, is_superuser ni capacidades en el perfil.
La edición propia expone nombre, apellidos y correo; username es de solo lectura.
La gestión autorizada puede enviar username. Contraseña, rol y estado usan casos
específicos; no se envían auditoría ni privilegios técnicos.

Label: UUID, name obligatorio/único/máximo 100, is_active y auditoría.
La API admite is_active al escribir; el ejemplo solo envía name y desactiva con DELETE.

Listados: page, per_page (máximo 100), q y order_by. meta.pagination:
page, per_page, total, total_pages, next, previous. Cliente convierte a
page/pageSize/total/totalPages; no navega usando enlaces externos.
Label filtra name/is_active, busca name y ordena created/name.
Users filtra username/email/first_name/last_name/role/is_active y ordena
created/username/first_name/last_name. La plantilla usa -created.

## Roles y autenticación

MANAGER y MEMBER son ejemplos sustituibles. src/config/roles.ts refleja
USER_ROLES: etiquetas, niveles y capacidades users.manage/example.write.
No identifica superusuarios. La UI permite una acción por capacidad general;
el backend decide objeto/estado. Pares, superiores y superusuarios pueden
producir 403 o 404 por alcance. No hay controles exclusivos de superusuario.

Al cambiar USER_ROLES, sincroniza ese archivo y revisa pruebas/etiquetas. Cambiar
códigos persistidos requiere migración en backend. Si auth/me/ incorpora
capacidades, sustituye el adaptador visual central por ese contrato verificado.

Access dura 1 h y refresh 7 días, sin rotación. Logout y cambio de contraseña
revocan refresh, mientras access emitidos mantienen vigencia. Desactivar bloquea
ambos por estado del usuario. Contraseña propia termina además la sesión local.
Decodificar exp no autentica: Django valida firma, estado, permisos y alcance.
No se devuelven tokens al JavaScript del navegador.
