# next-base

Plantilla de panel administrativo con Next.js App Router, TypeScript estricto,
Ant Design y arquitectura por features y capas. Autenticación JWT con cookies
httpOnly, perfil, contraseñas, usuarios y un ejemplo funcional de etiquetas (Label).
Código en inglés; interfaz y documentación en español.

## Instalación

Node 24 (verificado con 24.22.1), npm 11 (11.19.1) y el backend descrito en
[el contrato](docs/backend-contract.md) para datos reales.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

En Bash usa cp en lugar de Copy-Item. Abre http://localhost:3000.
BACKEND_URL es el origen del backend sin /api/v1/ y se lee solo en servidor.
NEXT_PUBLIC_APP_NAME es público. No se incluyen cuentas ni credenciales reales.
Crea las cuentas en tu backend y sincroniza USER_ROLES con src/config/roles.ts.

## Rutas y comandos

/login autentica; /profile permite consultar/editar perfil y cambiar contraseña;
/users gestiona cuentas; /labels demuestra CRUD con Drawer y desactivación.
/ redirige a /users si la capacidad general permite gestión y, en otro caso,
a /profile. Sin sesión se redirige a /login. El backend conserva toda autorización.

| Script npm run         | Responsabilidad                                         |
| ---------------------- | ------------------------------------------------------- |
| dev / start            | Desarrollo / servidor de producción                     |
| format / format:check  | Formatear / comprobar formato                           |
| lint                   | ESLint y convenciones                                   |
| typecheck              | next typegen y TypeScript, sin depender de .next previa |
| architecture           | Grafo de producción y límites cliente/servidor          |
| test:architecture      | Casos permitidos y violaciones deliberadas              |
| test                   | Vitest y Testing Library                                |
| test:coverage          | Cobertura V8 y umbrales globales                        |
| test:coverage:negative | Rechazo de cobertura insuficiente sin cambiar umbral    |
| build                  | Build de producción                                     |
| browser:install        | Instalar Chromium para Playwright                       |
| test:browser           | Navegador sobre build previo, API sintética por defecto |

Los scripts de navegador arrancan y detienen sus servidores. Requieren build y
browser:install previos. CI usa datos sintéticos y no requiere backend local.
El control negativo reemplaza el reporte con una suite parcial; vuelve a ejecutar
test:coverage si necesitas conservar el reporte completo.

La cobertura global exige 80 % en líneas, sentencias y funciones; 70 % en ramas.
vitest.config.ts contiene toda su configuración. Los adaptadores Next y componentes
de servidor se comprueban con Playwright; Vitest no mide cobertura del navegador.

## Mapa

```text
src/
  app/                  composición, páginas y Route Handlers
  components/           layout y UI compartida
  features/auth/        autenticación, perfil y contraseña propia
  features/users/       gestión de cuentas
  features/example/     Label
  config/               entorno y catálogo configurable de roles
  hooks/                debounce y operaciones con mensajes
  lib/                  API, identidad, cookies, Query keys y fechas
  providers/            Query, Ant Design, mensajes y sesión
  types/                contratos genéricos
tests/                  unitarias, componentes y navegador
tools/                  verificaciones de arquitectura y cobertura
docs/                   documentación canónica
.github/workflows/      comprobaciones de GitHub Actions
```

Consulta [el índice](docs/INDEX.md), [arquitectura](docs/architecture.md),
[el checklist](docs/new-feature-checklist.md) y [verificación](docs/verification.md).
