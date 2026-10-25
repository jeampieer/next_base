# Extracción y adaptaciones

Referencias frontend y backend leídas sin modificarlas. Entrega independiente,
sin historial original, secretos, datos reales ni configuración personal.

Conservado: Next 16.2.10, React/DOM 19.2.0, TypeScript estricto 5.9.3, Ant Design
6.0.0, Query 5.91.2 y Devtools 5.91.3, Axios 1.16.1, Day.js 1.11.19,
App Router, Server Actions, Route Handlers, proxy, cookies, providers y capas.
Layout adaptable, debounce y patrones de tabla/formulario tienen consumidores reales.

Adaptado: auth, perfil, usuarios y permisos al contrato genérico. Label es el único
recurso del ejemplo; formularios compactos en Drawer y desactivación confirmada.

Descartado: negocio anterior, gráficos/reportes/exportación, marcas/imagenes,
MFA, firmas, auditoría de sesiones, campos organizacionales, generadores duplicados,
configuración de agentes/editor/MCP y despliegue. No se traslada otro servicio de CI.

## Correcciones verificadas

- Documentación autónoma y coherente con el código; sin rutas documentales externas.
- Ant Design y CSS Modules sustituyen Tailwind, shadcn/Base UI y sus helpers.
- Retirados Tailwind/PostCSS, tw-animate-css, class-variance-authority, clsx,
  tailwind-merge, Nivo, Chart.js/plugins, react-chartjs-2, Recharts, Lucide,
  QR/tipos y herramientas de captura/exportación sin consumidores.
- Solo alias @/\*, imports absolutos y excepciones correctas de exports Next.
- UUID string, entradas específicas; sin any ni data!; conversión en formatters.
- Identidad compartida y layout sin imports de features.
- Eliminado clearTokenCache vacío: no hay caché de tokens en navegador.
- Entorno centralizado y backend privado para servidor.
- eslint-config-next alineado a 16.2.10 sin actualizar framework.
- Redirecciones /users o /profile según capacidad; /login sin sesión.
- Login/refresh con envelope y metadatos reales; endpoints/campos de usuarios corregidos.
- Rol/estado/contraseña usan sus salidas específicas e invalidan consultas.
- Logout común con revocación y limpieza garantizada; 403 conserva sesión.
- Sin dashboard con mocks presentado como integración real.

## Herramientas nuevas

dependency-cruiser 17.3.1; Vitest/coverage-v8 4.1.11; Testing Library React 16.3.0,
user-event 14.6.1, jest-dom 6.9.1, DOM 10.4.1 (peer adicional autorizado);
jsdom 27.4.0. Engines y peers contrastados con Node 24 y React 19.
Vite llega con Vitest, sin dependencia directa adicional.
Playwright 1.57.0 y tsx 4.20.6 conservados; no se añade @playwright/test.
Dependencias directas exactas y entorno npm/Node fijado; transitivas nuevas en lockfile.
Los resultados actuales no se heredan de documentación histórica.
