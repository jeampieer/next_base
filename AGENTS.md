# Reglas para agentes

Lee [el índice](docs/INDEX.md), [arquitectura](docs/architecture.md) y
[contrato backend](docs/backend-contract.md) antes de cambiar código.
Para una feature nueva sigue [el checklist](docs/new-feature-checklist.md).
README contiene el mapa y comandos reales. Estas reglas y docs son canónicas.

## Capas

app compone pantallas y adaptadores Next. components, lib, providers, hooks,
config y types no importan features. Las features son independientes; la
identidad compartida vive en lib/auth/types.ts, sin excepciones generales.

- Tipos API snake_case; cliente/entradas camelCase; UUID siempre string.
- Formatters explícitos fromDB/toDB cuando exista esa operación.
- Services: HTTP y mapeo; sin estado, permisos visuales ni mensajes.
- Hooks: Query, mutations, invalidación y errores de operaciones.
- Componentes: presentación, estado visual y validación; no HTTP ni formatters API.
- Named exports y Folder/index.tsx. Next y configuraciones conservan sus exports obligatorios.
- Imports internos @/; "use client" en entradas cliente.
- Mensajes con useAppMessage; errores con lib/api/errors; query keys en lib/query.
- Entorno exclusivamente en config; Ant Design y CSS Modules.
- Crear/editar en Drawer; Popconfirm/Modal para confirmar desactivaciones.
- Vistas completas solo para formularios largos, multipaso o con URL compartible.
- Crear únicamente piezas con consumidores. Sin any, no nulidad ni imports para eludir capas.

## Identidad y permisos

Tokens solo en cookies httpOnly; nunca localStorage ni resultados de acciones.
exp no autentica y la cookie de usuario es un snapshot para presentación.
Sincroniza el catálogo frontend con USER_ROLES. No inventes campos, endpoints,
capacidades ni privilegios de superusuario por rol/etiqueta/nivel. El backend
decide alcance y permisos por objeto. 401 usa refresh acotado; 403 no hace logout.
Todo logout intenta revocar y siempre limpia cookies. DELETE significa desactivar.

## Verificación

Ejecuta scripts de formato, lint, tipos, arquitectura, pruebas y build.
Cambios de flujo requieren navegador. Los umbrales y selección solo viven en
vitest.config.ts; no rebajarlos ni ampliar exclusiones para aprobar.
No tests triviales o snapshots para inflar cobertura. Actualiza documentación
cuando cambie un contrato, estructura o excepción. No declarar checks no ejecutados.
No secretos, datos reales, configuración personal, despliegue ni publicación remota.
