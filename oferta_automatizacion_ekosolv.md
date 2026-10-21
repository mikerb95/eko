# Oferta automatización comercial Ekosolv: borrador

> **Estado:** borrador del 2026-10-07, escrito después de la reunión con el gerente. Las cifras son
> preliminares y todo lo marcado como **PENDIENTE** depende de las respuestas de la sección 8.
> Las secciones 1 a 6 son el texto para el cliente. Las secciones 7 a 9 son internas y no se envían.

---

## 1. Lo que entendimos

Hoy, preparar una propuesta comercial en Ekosolv le cuesta horas a un consultor: identificar qué
servicios necesita el cliente, redactar la propuesta, armar la estimación en Zoho Books, crear la
carpeta de cotización y costeo en WorkDrive y elaborar la presentación. Son tareas repetitivas que
le quitan tiempo al trabajo técnico y retrasan la respuesta al cliente.

El objetivo de este proyecto es que, a partir de la información básica de un prospecto, el sistema
deje listo en minutos un paquete completo para que el consultor solo tenga que revisarlo y ajustarlo:

- servicios recomendados, con la razón regulatoria de cada uno;
- borrador de propuesta con la plantilla de Ekosolv;
- estimación creada en Zoho Books;
- carpeta de cotización y costeo creada en Zoho WorkDrive;
- presentación con la marca de Ekosolv, guardada en esa misma carpeta.

La decisión final siempre es del consultor. El sistema prepara, no envía.

## 2. Propuesta en dos fases

Separamos el proyecto en dos fases porque resuelven problemas distintos. La primera ataca
directamente el tiempo de creación de propuestas y da resultados medibles en pocas semanas. La
segunda alimenta ese flujo con más oportunidades.

### Fase 1. De solicitud a propuesta lista para revisar

1. **Entrada de la oportunidad.** Un formulario corto (empresa, NIT, sector, actividad, ubicación,
   necesidad descrita por el cliente) que puede llenar el consultor o el mismo cliente desde el sitio
   web. Con el NIT se completan los datos públicos de la empresa.
2. **Diagnóstico de servicios.** El sistema cruza el perfil de la empresa con la matriz de
   obligaciones ambientales de Ekosolv y recomienda los servicios que aplican, explicando por qué
   (norma, autoridad, periodicidad). La matriz la valida el equipo técnico de Ekosolv antes de entrar
   en uso.
3. **Borrador de propuesta.** Se redacta sobre las plantillas actuales de Ekosolv: alcance,
   metodología, entregables, tiempos y condiciones. El consultor lo revisa y edita en un panel antes
   de aprobarlo.
4. **Estimación en Zoho Books.** Con los servicios aprobados se crea la estimación en Books, usando
   el catálogo de servicios y precios de Ekosolv.
5. **Carpeta en Zoho WorkDrive.** Se crea la carpeta del cliente con la estructura de cotización y
   costeo, y se copia la plantilla de costeo.
6. **Presentación.** Se genera la presentación comercial (PowerPoint) sobre la plantilla de marca de
   Ekosolv y se guarda en la carpeta del cliente.

### Fase 2. Detección de oportunidades

1. **Referidos.** Registro de quién refirió a cada prospecto, con entrada desde el sitio web y
   WhatsApp. Cada referido entra directo al flujo de la Fase 1, y se puede medir qué clientes y
   aliados generan más negocio.
2. **Base propia de clientes.** Alertas sobre los clientes actuales y anteriores de Ekosolv: permisos
   próximos a vencer, informes periódicos pendientes y clientes de una línea de servicio a los que les
   aplica otra (por ejemplo, clientes de EKORAEE con obligaciones de consultoría). Con un clic, la
   alerta se convierte en una oportunidad de la Fase 1.

La **prospección en frío** a partir de fuentes públicas (contratación estatal, actos administrativos
de autoridades ambientales, registros empresariales) queda fuera de esta propuesta. La recomendamos
como piloto acotado una vez esté funcionando la Fase 2, porque la calidad de esos datos es irregular
y el contacto con personas naturales tiene que cumplir la Ley 1581 de 2012.

## 3. Entregables y cómo se mide el resultado

| Entregable | Criterio de aceptación |
|---|---|
| Matriz de servicios y obligaciones | Validada y firmada por el equipo técnico de Ekosolv |
| Catálogo de servicios en Zoho Books | Ítems y precios cargados y revisados por Ekosolv |
| Flujo completo de la Fase 1 | Genera el paquete completo con 5 casos reales de Ekosolv |
| Panel de revisión | El consultor puede editar, aprobar o descartar cada borrador |
| Integración con Books y WorkDrive | Estimación y carpeta creadas sin intervención manual |
| Presentación generada | Respeta la plantilla de marca y se abre sin errores en PowerPoint |
| Capacitación | Sesión con el equipo comercial y manual de uso |
| Fase 2: referidos y alertas | Referidos trazables y alertas funcionando sobre la base de clientes |

**Indicador principal:** horas de preparación por propuesta, medidas antes y después. Antes de
empezar tomamos la línea base con Ekosolv (**PENDIENTE**: propuestas al mes y horas por propuesta).

## 4. Lo que necesitamos de Ekosolv

- Acceso a Zoho (Books y WorkDrive como mínimo) con un usuario de integración.
- Entre 3 y 5 propuestas reales recientes, con su presentación y su hoja de costeo.
- Plantillas actuales de propuesta, presentación y costeo.
- Lista de servicios con precios o reglas de precio (si hoy vive en Excel, la pasamos a Books juntos).
- Un responsable técnico que valide la matriz de servicios (estimado: 4 a 6 horas en total).
- Para la Fase 2: exportación de la base de clientes con fechas de permisos y obligaciones.

## 5. Supuestos y exclusiones

- Ekosolv usa Zoho Books y Zoho WorkDrive en un plan con acceso a la API (**PENDIENTE** confirmar
  productos y plan).
- La propuesta y la presentación se generan en español. La versión en inglés se cotiza aparte.
- El sistema no envía nada al cliente: todo pasa por aprobación del consultor.
- La presentación se entrega en PowerPoint. La edición nativa en Zoho Show no está incluida.
- No incluye la migración de datos históricos más allá de la base de clientes de la Fase 2.
- No incluye prospección en frío ni compra de bases de datos de terceros.
- El consumo de inteligencia artificial está incluido hasta 60 propuestas al mes. Por encima de ese
  volumen se revisa la tarifa de operación.

## 6. Cronograma

| Semana | Fase 1 |
|---|---|
| 1 a 2 | Levantamiento: plantillas, catálogo en Books, matriz de servicios |
| 3 a 5 | Construcción del flujo e integraciones con Zoho |
| 6 a 7 | Piloto en paralelo con propuestas reales y ajustes de calidad |
| 8 | Entrega, capacitación y medición contra la línea base |

La Fase 2 toma 4 semanas adicionales y puede empezar al terminar la Fase 1 o más adelante.

---

## 7. Precios (interno, preliminar)

Mismo modelo de la oferta de agosto (`oferta_comercial_ekosolv.md`): mensualidad a 24 meses que suma
construcción amortizada, operación y soporte, sin inversión inicial.

**Decisión de precio:** esta vez **no** se aplica el descuento del 50% de agosto. Esa oferta fue una
entrada agresiva porque Mike buscó al cliente. Esta necesidad la trajo el gerente y el valor se puede
argumentar en horas ahorradas.

### Estimación de esfuerzo

| Bloque | Fase 1 (h) | | Bloque | Fase 2 (h) |
|---|---|---|---|---|
| Levantamiento y matriz | 28 | | Referidos y trazabilidad | 16 |
| Entrada y enriquecimiento por NIT | 12 | | Base propia y alertas | 30 |
| Diagnóstico de servicios con IA | 20 | | Enriquecimiento y cruce de líneas | 12 |
| Generación de propuesta | 24 | | Notificaciones | 12 |
| Integración Books | 16 | | Pruebas | 10 |
| Integración WorkDrive | 8 | | | |
| Generación de presentación | 24 | | | |
| Panel de revisión | 16 | | | |
| Piloto y ajustes con casos reales | 20 | | | |
| Capacitación y manual | 6 | | | |
| **Total** | **174** | | **Total** | **80** |

### Mensualidad

| Componente | Fase 1 | Fase 1 + 2 |
|---|---|---|
| Construcción | $14.000.000 → $585.000/mes | $21.500.000 → $895.000/mes |
| Operación (servidores, IA hasta 60 propuestas/mes, monitoreo) | $180.000/mes | $240.000/mes |
| Soporte (bolsa de horas no acumulable) | $240.000/mes (6 h) | $320.000/mes (8 h) |
| **Total** | **$1.005.000/mes** | **$1.455.000/mes** |

- Total del contrato a 24 meses: **$24.120.000** (Fase 1) y **$34.920.000** (Fase 1 + 2).
- Desde el mes 25: **$420.000** y **$560.000**.
- Tarifa efectiva de construcción: unos $80.000/h (Fase 1) y $94.000/h (Fase 2). Por encima de la
  oferta de agosto, todavía razonable para Bogotá.
- **Si ya tomó el alcance 2 de agosto:** la operación y el soporte se comparten. Cobrar solo la
  construcción más un incremento de operación de $80.000 (IA y procesos), sin bolsa de soporte
  adicional, o sumando 2 h. Revisar también si el "CRM propio" del alcance 2 sobra frente a Zoho CRM.

### Palancas (en orden de qué ceder)

1. Plazo a 36 meses.
2. Anticipo del 30%.
3. Empezar solo con la Fase 1 (es la salida natural).
4. Bajar horas de soporte.

**No ceder:** plazo mínimo de 24 meses, liquidación del saldo de construcción si termina antes, y el
tope de propuestas al mes en la operación (es lo que protege el margen frente al consumo de IA).

### Argumento de retorno para el gerente (llenar con su línea base)

```
horas ahorradas al mes = propuestas/mes × (horas antes − horas después)
valor ahorrado al mes  = horas ahorradas × costo hora del consultor
```

Ejemplo ilustrativo, **no son datos de Ekosolv**: 10 propuestas al mes que pasan de 6 h a 1,5 h son
45 h liberadas. Con un costo de consultor de $45.000/h son $2.025.000 al mes, el doble de la
mensualidad de la Fase 1. El argumento fuerte no es solo el ahorro: es responder antes que la
competencia.

## 8. Preguntas pendientes para el gerente

- [ ] ¿Qué pasó con la oferta de agosto: alcance 1, 1+2 o ninguno? Define si esto es un alcance 3 o
      una oferta independiente.
- [ ] ¿Qué productos de Zoho usan y con qué plan? Si tienen **Zoho One**, parte del flujo se puede
      hacer con Zoho Flow y Deluge, y hay que dejar claro que el valor está en el diagnóstico con IA,
      la redacción y la presentación.
- [ ] Línea base: propuestas al mes, horas por propuesta, quién las hace, tasa de cierre.
- [ ] ¿Qué quiso decir con "mercado propio": su base de clientes o prospección en frío?
- [ ] 3 a 5 propuestas reales con presentación y costeo.
- [ ] ¿Los precios viven en Books, en Excel o en la cabeza de alguien?

## 9. Riesgos internos

- [ ] **Calidad de la IA sin muestras reales.** No prometer nivel de redacción antes de probar con
      propuestas de Ekosolv. El piloto en paralelo (semanas 6 y 7) existe para esto.
- [ ] **La matriz perfil-norma** del selector "¿Qué le exige la ANLA?" sigue sin validar por Ekosolv.
      Es la base del diagnóstico: si está mal, el sistema recomienda mal. Su validación es requisito
      de la Fase 1.
- [ ] **Responsabilidad regulatoria.** Dejar por escrito en el contrato que el sistema genera
      borradores y que la recomendación técnica final es del consultor de Ekosolv.
- [ ] **Data center de Zoho.** Confirmar en qué región está la cuenta (.com, .eu, .in), porque cambia
      los endpoints de la API y la configuración OAuth.
- [ ] **Costo de IA.** Medir el consumo real por propuesta en el piloto y ajustar el tope de 60
      propuestas al mes si hace falta, antes de firmar la mensualidad definitiva.
- [ ] **Soporte como consultoría abierta.** Igual que en agosto: horas no acumulables y registro de
      consumo. Ajustar plantillas o la matriz después de la entrega cuenta como hora de soporte.
- [ ] **Contexto sensible con el gerente** (ver `oportunidad_ekosolv.md`): mantener todo en tono de
      oferta profesional nueva.
