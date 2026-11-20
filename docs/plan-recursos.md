# Banco de recursos de las capacitaciones (plan, sin construir)

> Plan del 2026-11-20. Destino del QR de la guía rápida impresa (`/academia/taller/1/entregables`): `ekosolv.codebymike.net/academia/recursos/<área>`. Hoy esas direcciones dan 404.

## Qué es

Una página pública por área con todo lo que la persona necesita después de cada capacitación: las instrucciones para copiar, las guías paso a paso y el material para descargar. Crece con cada sábado: la capacitación 1 al principio y las 2 a 4 cuando existan.

## Reglas que no se negocian

- **Sin login**: el QR no puede llevar a un login (regla de las capacitaciones). Excepción en `src/middleware.ts` por prefijo `/academia/recursos`, igual que la tarjeta resumen.
- **Sin datos personales ni nada interno**: solo contenido de las capacitaciones. Las lecciones, las entregas y el certificado siguen siendo privados.
- **noindex**, como todo el sitio.
- **Un área que no existe no da 404**: muestra el índice con las seis áreas para elegir. Un QR impreso no se puede corregir.

## Rutas

| Ruta | Qué muestra |
|---|---|
| `/academia/recursos` | Índice: las seis áreas para elegir. |
| `/academia/recursos/<área>` | El banco del área: `gerencia`, `finanzas`, `operaciones`, `logistica`, `ventas`, `mercadeo`. Arriba, un selector para ver las otras áreas. |

## Contenido de cada página (orden)

1. **Encabezado**: "Banco de recursos · <Área>", logo de Ekosolv y una frase de para qué sirve.
2. **Por capacitación**, la más reciente arriba. Las que todavía no se han dictado no aparecen (no se muestra cronograma).
   - **Capacitación 1, Inteligencia artificial por dentro**:
     - La plantilla de cuatro partes con el caso del área, con botón **Copiar**.
     - Las tres instrucciones del área de la guía impresa, con botón **Copiar** cada una.
     - Las instrucciones generales de la tarjeta resumen ("Plantilla de cuatro partes", "Pedir la fuente de cada dato").
     - **Guía paso a paso: conectar Claude con Zoho, solo para leer**: los 9 pasos de `conectarZoho.ts`, en texto y con sus maquetas.
     - Los cuatro hábitos antes de usar una respuesta y "dónde pegar".
     - Enlace a la tarjeta resumen (ya es pública).
3. **Fuentes oficiales para verificar**: SUIN-Juriscol, Diario Oficial y la página de la autoridad que corresponda (ANLA y CAR para Operaciones; DIAN para Finanzas).
4. **Descargas**: el checklist y la guía rápida del área en PDF, los mismos que se imprimieron.
5. **Pie**: Capacitación en IA para el equipo de Ekosolv.

Optimizada para celular primero, porque se llega por QR.

## De dónde sale el contenido

**Fase 1 (lista para el día de la capacitación 1): contenido en el código.**
- Reutiliza lo que ya existe: `src/lib/talleres/entregables1.ts` (plantilla, instrucciones, hábitos, dónde pegar), `taller1.ts` (`resumen.instrucciones`) y `conectarZoho.ts`. Lo impreso y lo publicado no se pueden contradecir, porque salen del mismo archivo.
- Nuevo módulo puro `src/lib/talleres/recursos.ts` que arma el banco de un área juntando las capacitaciones registradas en `index.ts`. Cuando se cree `taller2.ts` con su `entregables2.ts`, aparece solo.
- Los PDF se generan una vez con Playwright desde la vista de entregables y se guardan en `public/recursos/taller1-<área>-checklist.pdf` y `-guia.pdf`.

**Fase 2 (opcional, si Mike quiere subir material sin pedir cambios): editable desde el panel.**
- Pestaña **Recursos** en `/admin/academia` (solo admin): agregar enlaces o archivos por área y capacitación, con título y descripción. Tabla `ac_recursos`.
- Los archivos irían en Vercel Blob (público) o como enlaces a Drive. Por decidir.

## Relación con otros pendientes

- **Material por correo** (pendiente en `plan-capacitaciones.md`): el correo a los asistentes puede ser simplemente el enlace al banco de su área. Así no hay que adjuntar archivos.
- **Ventas y Mercadeo** salen con los textos generales de la guía impresa hasta que se itere su contenido.

## Cómo se verifica

- Prueba e2e **sin sesión**: las seis rutas responden 200, un área inválida muestra el índice y el botón Copiar funciona.
- Capturas en celular (390 px) y escritorio.
- Después de desplegar: abrir las seis direcciones en producción y escanear con el celular el QR de una hoja impresa de prueba.

## Decisiones pendientes de Mike

1. ¿Fase 1 sola (en código, rápida) o también la Fase 2 (editable desde el panel)?
2. ¿Se incluyen los PDF de las hojas impresas como descarga?
3. ¿Cada área ve solo lo suyo o puede pasar a las otras áreas con el selector?
