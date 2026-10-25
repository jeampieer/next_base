# Verificación del 24 de octubre de 2026

Ejecutada en Windows, Node 24.22.1, npm 11.19.1 y Python 3.11.6. Se creó una
copia independiente de los 97 archivos entregables, sin node_modules, .next,
Git, entorno ni reportes de la instalación de trabajo. npm ci instaló 573
paquetes desde el lockfile. Antes del comando de tipos no existía .next.
La comparación SHA-256 confirmó que los 97 archivos coincidían con el destino.

## Comandos ejecutados en la copia independiente

| Comando                                    | Resultado actual                                               |
| ------------------------------------------ | -------------------------------------------------------------- |
| npm ci --no-audit --no-fund                | Correcto; instalación nueva desde lockfile                     |
| npm run format:check                       | Correcto, código 0                                             |
| npm run lint                               | Correcto, sin errores ni warnings                              |
| npm run typecheck                          | Correcto; next typegen seguido de tsc sin .next heredada       |
| npm run architecture                       | Correcto; sin ciclos, módulos sin resolver o límites rotos     |
| npm run test:architecture                  | 13 casos correctos, incluidas violaciones deliberadas          |
| npm run test:coverage                      | 5 archivos, 53 pruebas aprobadas, código 0                     |
| npm run test:coverage:negative             | Rechazo confirmado; el subproceso de cobertura devuelve 1      |
| npm run build                              | Build Next 16.2.10 correcto, código 0                          |
| npm run browser:install                    | Chromium 143 / Playwright 1.57.0 instalado en carpeta temporal |
| npm run test:browser                       | Flujo con backend simulado correcto, código 0                  |
| npm run test:browser con SMOKE_BACKEND_URL | Flujo con Django real correcto, código 0                       |
| python -m pip check en el venv nuevo       | Sin dependencias incompatibles                                 |

Los checks se invocaron mediante los scripts versionados; las opciones
--no-audit/--no-fund solo afectan mensajes de instalación. No se sobrescribieron
umbrales en comandos ni YAML. Las versiones directas coinciden con sus
resoluciones del lockfile y con el origen, salvo eslint-config-next alineado a
16.2.10. El lockfile contiene los paquetes opcionales de plataforma de Windows
y Linux; la ejecución local realizada fue exclusivamente Windows.

## Cobertura

| Métrica    | Cubierto / total | Resultado | Mínimo |
| ---------- | ---------------- | --------- | ------ |
| Líneas     | 380 / 403        | 94,29 %   | 80 %   |
| Sentencias | 409 / 432        | 94,67 %   | 80 %   |
| Funciones  | 162 / 175        | 92,57 %   | 80 %   |
| Ramas      | 236 / 247        | 95,54 %   | 70 %   |

Selección, exclusiones por archivo, reportes y umbrales viven únicamente en
vitest.config.ts. Se mide código ejecutable de src también sin importar;
no se excluyen directorios de componentes, hooks ni services. Las entradas
Next enumeradas son adaptadores de composición verificados mediante Playwright.
En el reporte local también permanecieron contadas a cero las entradas de
grupos de ruta; no se atribuyó cobertura de navegador a esas líneas.
Los fixtures de arquitectura quedan fuera de src y de la medición.

El control negativo seleccionó solo core.test.ts, mantuvo los cuatro umbrales
y midió todo src: 14,39 % líneas, 15,27 % sentencias, 18,28 % funciones y
33,19 % ramas. Vitest devolvió 1 por cobertura insuficiente; el script verificador
devolvió 0 al comprobar ese rechazo. No se añadieron tests artificiales ni se
redujeron umbrales. El reporte completo se guardó antes del control negativo.

## Smoke con backend real

Se copiaron únicamente archivos versionados del backend, omitiendo .env,
secretos, Git, bases, entornos y cachés. Se creó un venv nuevo y se instalaron
requirements/local.txt y sus transitivas. Se usaron config.settings.test,
SQLite temporal en archivo, migraciones estándar y dos usuarios sintéticos:
un gestor con capacidades y un miembro sin escritura. No se modificó backend.

Chromium ejecutó el build independiente: protección de /labels sin sesión,
login desde formulario, perfil y actualización real, cookies httpOnly, refresh
con el refresh obtenido por login, listado/creación/edición/desactivación/búsqueda
de Label y logout. Las cookies no se prefabricaron ni sustituyeron autenticación.
El registro desactivado siguió visible como inactivo.

El miembro intentó escribir mediante el bridge y recibió 403; a continuación
auth/me/ respondió 200 con la misma sesión. El logout invocó revocación real
en Django y limpió cookies locales. No se imprimieron ni guardaron tokens.
También se inspeccionó visualmente la tabla renderizada tras desactivar.

## Límites y conservación

No se ejecutó GitHub Actions en GitHub ni Linux, despliegue, publicación remota
o concurrencia del backend. El smoke real se limita a los flujos anteriores;
gestión avanzada de usuarios y contraseñas se comprobó con tests de contratos,
hooks y componentes, sin atribuirles un smoke real adicional.
La suite habitual de CI sigue usando datos sintéticos sin ruta local de backend.

Se confirmó que no quedaban procesos Node/Python asociados a las carpetas de
verificación. Ambas referencias conservaron árbol de trabajo limpio y HEAD:
frontend 6685c61c8027c920c1046d767eae12ce0557db50 y
backend fe066bd376e11f55ecc9333ad2e99b0ac630ff2f.
Git local se inicializa en main sin historial copiado ni remoto.

Limpieza temporal: completada; procesos detenidos y recursos temporales retirados.
