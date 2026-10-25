# Incorporar una feature

- [ ] Confirmar URL, envelope, UUID, campos de escritura, filtros, errores y permisos.
- [ ] Crear features/{name}/ solo con piezas utilizadas; consultar Label funcional.
- [ ] Interfaces API snake_case, cliente camelCase y entradas de escritura explícitas.
- [ ] Formatter fromDB/toDB y filtros cuando tengan consumidores.
- [ ] Service con transporte y mapeo; verificar datos y paginación requerida.
- [ ] Query keys centralizadas y hooks con mutations, invalidación, pendientes y errores.
- [ ] Sincronizar capacidades reales con USER_ROLES; backend decide alcance y objeto.
- [ ] Formulario reutilizable en Drawer. Documentar vistas completas solo si es largo,
      multipaso o necesita URL compartible. No introducir navegación nueva sin requisito.
- [ ] Tabla densa, carga/vacío/error, búsqueda/paginación y confirmación de desactivación.
- [ ] Componer ruta y navegación desde app; compartido no importa la feature.
- [ ] Probar campos permitidos, formatters, services, errores, hooks, invalidación,
      permisos y flujos UI; 401/403 conservan su semántica.
- [ ] Adaptadores Next y Server Components asíncronos se prueban con Playwright.
- [ ] Ejecutar formato, lint, tipos, arquitectura, controles negativos, cobertura,
      build y browser. No reducir umbrales ni añadir exclusiones para aprobar.
- [ ] Actualizar contrato, arquitectura si cambia un límite, README e índice.
