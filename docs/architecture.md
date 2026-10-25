# Arquitectura

Next App Router con features verticales y capas internas. Conserva Server
Components, componentes cliente, Server Actions, Route Handlers y proxy.ts.
TypeScript estricto; TanStack Query para datos remotos y Context para sesión.
Mensajes utiliza el contexto de Ant Design App.

| Capa                   | Dependencias permitidas                          | Responsabilidad                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------- |
| Types y formatters     | Contratos y helpers puros compartidos            | Modelos y conversión                  |
| Services               | Types, formatters y transporte                   | HTTP, envelope y mapeo                |
| Hooks                  | Services, Query y providers                      | Datos remotos, invalidación y errores |
| Componentes de feature | Hooks, contratos y UI compartida                 | Presentación y validación             |
| Compartido             | Otro código compartido y bibliotecas             | Infraestructura sin features          |
| app                    | Entradas concretas de features e infraestructura | Composición y adaptadores Next        |

lib/api/response.ts es puro: convierte paginación y auditoría sin transporte;
los formatters pueden usarlo. Las entradas de escritura enumeran campos
permitidos, sin Partial de un modelo API ni conversiones en componentes.
Las features no importan otras features. La identidad compartida vive en
lib/auth/types.ts y formatter.ts; no se requieren excepciones entre features.

## Composición y servidor/cliente

El layout protegido requiere sesión y pasa navegación, nombre y LogoutButton
por props al layout compartido. Este no importa auth ni permisos de features.
Las páginas componen vistas. Las entradas HTTP de auth desde composición se
limitan al proxy (service de auth de servidor) y Route Handlers refresh/logout
(adaptador de sesión de auth); no se permite cualquier service desde una página.

Los módulos .server.ts, lib/api/server.ts y next/headers son de servidor.
El cliente comunica con /api/backend; el bridge añade Bearer desde cookies,
valida segmentos de /api/v1/, no reenvía Authorization del navegador ni cookies,
y no sigue redirecciones externas. Respeta 204/304 y convierte fallos de red en 502.
Las Server Actions de actions/ con "use server" son el puente válido para hooks.
Solo devuelven resultados serializables sin tokens. Acciones y adaptadores pueden
capturar errores y guardar/limpiar cookies; los services no añaden estado ni mensajes.

El proxy renueva access vencido y consulta auth/me/ en navegaciones. El backend
valida identidad y todas las autorizaciones. La cookie de usuario es un snapshot.
Cookies httpOnly, SameSite strict, Secure en producción y maxAge derivado de exp.
El refresh cliente comparte una promesa entre 401 concurrentes y reintenta una vez.
Si otro 401 persiste, termina sesión. Un 403 no hace logout. Acción y Route Handler
de logout comparten revocación y limpieza en finally; usan refresh si access venció.
Cambiar contraseña propia termina sesión porque el backend revoca refresh.

## Reglas ejecutables

.dependency-cruiser.mjs descubre features nuevas y raíces use client, reconoce
alias y relativos y prohíbe ciclos, imports sin resolver, capas invertidas,
acoplamiento de features y transporte cliente en servidor.
tools/architecture-lib.mjs recorre además dependencias transitivas del cliente,
deteniéndose en Server Actions. No hay excepción global layout→features.
ESLint exige @/, prohíbe any/no nulidad y default exports en componentes reutilizables;
los archivos especiales Next y configuraciones conservan sus exports.

Los fixtures permitidos/prohibidos se crean en carpetas temporales fuera de src
y no cuentan para cobertura. Incluyen una feature nueva, alias, relativos,
Server Actions, ciclos, capas, features y acceso transitivo a servidor.

## Pruebas y cobertura

Vitest mide todo src/**/\*.ts y tsx, también archivos sin importar. Solo excluye
src/app/** (páginas, layouts, estilos y Route Handlers de composición Next) y
src/proxy.ts: se verifican mediante Playwright contra Next real. No se excluyen
componentes, hooks, services, Server Actions ni cookies. Archivos solo de tipos
no tienen instrucciones ejecutables. V8 no es cobertura del navegador.

El browser habitual inicia un build real y una API sintética, autentica por el
formulario y comprueba SSR/redirects/cookies/operaciones. SMOKE_BACKEND_URL permite
repetir el flujo con Django aislado; no es un requisito local de CI.
