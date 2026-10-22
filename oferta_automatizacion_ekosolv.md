# Oferta automatización comercial Ekosolv: borrador

> **Estado:** borrador del 2026-10-07, escrito después de la reunión con el gerente. Las cifras son
> preliminares y todo lo marcado como **PENDIENTE** depende de las respuestas de la sección 8.
> Las secciones 1 a 6 son el texto para el cliente. Las secciones 7 a 9 son internas y no se envían.
>
> **Actualización 2026-10-20:** Mario pidió por correo la propuesta y los horarios de capacitación en
> IA los sábados en la mañana. Se agregó la sección 10 (capacitación, servicio aparte con precio) y se
> ajustó la entrada de la Fase 1 al módulo Briefs de Zoho CRM. La versión para el cliente vive en el
> página PDF (3 hojas A4) `propuesta_ekosolv_ia.html`, publicada en
> https://claude.ai/artifact/86jonrUCcxDZn2SZNUMGgP (el doc anterior 4B39jPmwgbrmYcxyxtTxVJ quedó descartado).

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

1. **Entrada de la oportunidad.** El consultor registra el Brief en Zoho CRM como lo hace hoy (módulo
   "Briefs"). Con el NIT se completan los datos públicos de la empresa.
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

- Ekosolv usa Zoho One (confirmado por captura el 2026-10-07): CRM con módulo Briefs, Books y
  WorkDrive. **PENDIENTE** saber quién administra el CRM y en qué data center está la cuenta.
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

> **2026-10-20: Mike decidió bajar todos los precios a la mitad.** Lo que va al cliente es: Fase 1
> **$502.500/mes** (desde el mes 25, $210.000) y Fase 1 + 2 **$727.500/mes** (desde el mes 25,
> $280.000). Las tablas de abajo conservan las cifras completas como referencia. Ojo: a la mitad, la
> operación queda en unos $90.000/mes (Fase 1), justo para cubrir servidores y el consumo de IA de 60
> propuestas. Medirlo en el piloto antes de firmar, y no bajar más el tope de propuestas.

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
- [x] ¿Qué productos de Zoho usan y con qué plan? **Zoho One.** Parte del flujo se puede hacer con
      Zoho Flow y Deluge, así que hay que dejar claro que el valor está en el diagnóstico con IA, la
      redacción y la presentación.
- [ ] ¿Quién administra Zoho CRM?
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

---

## 10. Capacitación en IA (agregado 2026-10-20)

Servicio **aparte, con precio propio**, independiente de la automatización. Puede empezar ya mientras
se cierran las cifras de la automatización, y genera ingreso inmediato. Sábados de 8:00 a 11:00 a. m.,
hasta 12 participantes, presencial en la oficina de Ekosolv o virtual.

| | Plan Esencial | Plan Completo |
|---|---|---|
| Sesiones | 2 sábados de 3 h (6 h) | 4 sábados de 3 h (12 h) |
| Fechas propuestas | 7 y 14 de noviembre | 7, 14, 21 y 28 de noviembre |
| Material | Guía y biblioteca de instrucciones | + espacios de trabajo por área y borrador de política de uso de IA |
| Acompañamiento | 15 días por chat | 30 días por chat |
| Precio | $1.200.000 | $2.100.000 |

Pago 50% al confirmar la fecha y 50% al terminar. Las licencias de IA las paga Ekosolv.

**Contenido:** S1 fundamentos, cómo pedir y qué no subir (Ley 1581). S2 documentos largos (EIA, PMA,
ICA), revisión normativa con fuente, borradores de informe y propuesta. S3 proyectos con conocimiento
de Ekosolv, tablas y matrices, resultados de laboratorio frente a límites. S4 qué automatizar, IA con
Zoho y correo, casos por área y reglas internas de uso.

### Precio (interno)

- **2026-10-20: Mike bajó todos los precios a la mitad.** Esencial $1.200.000 ($200.000/h), Completo
  $2.100.000 ($175.000/h). Antes eran $2.400.000 y $4.200.000.
- Coherente con agosto: allá se declararon 7 h en $3.200.000 (unos $457.000/h) como regalo de cierre.
  Si Mario saca esa comparación, la respuesta es que este programa es a la medida y con material propio.
- **PENDIENTE** confirmar si Mike factura con IVA. En el doc del cliente no se mencionó IVA.
- **Palancas, en orden:** 10% de descuento por pago completo anticipado; subir el cupo a 15 personas
  sin costo; si firma la automatización en los 60 días siguientes, el sábado 4 hace también de
  levantamiento de la Fase 1 (ahorra horas de las semanas 1 y 2).
- **No ceder:** el 50% antes de empezar.
- Valor estratégico: la capacitación pone a Mike frente a todo el equipo y deja recogidas las
  plantillas y documentos reales que pide la sección 4. Usar los sábados para tomar la línea base de
  horas por propuesta.

## 11. Respuesta al correo de Mario (2026-10-20)

Asunto: RE: PROPUESTA AUTOMATIZACIÓN e IA PARA EKOSOLV

> Hola, Mario. Muy bien, gracias. ¿Cómo vas tú?
>
> Te comparto la propuesta con las dos cosas que hablamos:
>
> [LINK]
>
> Para la capacitación armé dos planes, los dos en sábado de 8:00 a 11:00 a. m.:
>
> - **Plan Esencial:** 2 sábados de 3 horas (7 y 14 de noviembre), por $1.200.000.
> - **Plan Completo:** 4 sábados de 3 horas (7, 14, 21 y 28 de noviembre), por $2.100.000. Además
>   del uso diario, deja montados los espacios de trabajo del equipo y unas reglas internas de uso de
>   IA.
>
> Los dos son para hasta 12 personas, presenciales en la oficina o virtuales, y trabajan sobre
> documentos reales de Ekosolv. Las fechas se pueden mover si les queda mejor otro sábado.
>
> La automatización de propuestas va en el mismo documento, ya ajustada a su Zoho CRM: arranca
> desde el Brief y deja lista la propuesta, la estimación en Books, la carpeta en WorkDrive y la
> presentación para que el consultor solo la revise. Para cerrar las cifras necesito algunos datos
> que dejé al final del documento, sobre todo cuántas propuestas hacen al mes y cuánto tiempo les
> toma cada una.
>
> ¿Te parece si me confirmas el plan de capacitación y la fecha de inicio? Con eso aparto los
> sábados.
>
> Un saludo,
>
> Mike

## 12. Agente de cumplimiento en el panel (agregado 2026-10-21)

Mike pidió sumar a la Fase 2 un agente dentro del panel de administración (`/admin`, ya contratado en la
oferta de agosto, así que aquí **solo se cobra el agente**). Apoya en lo importante de la consultoría,
con reglas tomadas de la norma y validadas por el equipo técnico de Ekosolv.

- **Vigila:** normativa nueva (MinAmbiente, ANLA, CAR), autos y requerimientos en los expedientes de
  los clientes, revisión de documentos (ICA, PMA, permisos) frente a la norma, y vencimientos.
- **Acción:** alerta al consultor responsable con resumen, norma aplicable, plazo y acción sugerida.
  No redacta respuestas ni actúa solo.
- **Esfuerzo estimado:** unas 130 h (normativa 30, autos 30, documentos 24, vencimientos 8, motor de
  reglas 16, integración al panel 12, pruebas 10). Fase 2 pasa de 4 a 7 semanas.
- **Precio a cliente (ya a la mitad):** Fase 1 + 2 con agente **$1.017.500/mes** (antes $727.500), desde
  el mes 25 **$320.000** (antes $280.000). A precio completo serían unos $12M de construcción más
  $80.000/mes de operación por el monitoreo diario.
- **Riesgos:** muchas CAR no publican autos en línea y la ANLA exige credenciales del titular para ver
  expedientes (cobertura parcial; quedó como condición). Las alertas no reemplazan revisión técnica ni
  jurídica. Falta la lista de autoridades y expedientes a vigilar.

**2026-10-21: Mike bajó 30% más las mensualidades de la automatización.** Fase 1 **$351.750/mes**
(desde el mes 25, $147.000) y Fase 1 + 2 con agente **$712.250/mes** (desde el mes 25, $224.000).
Sobre el precio de referencia completo es un descuento acumulado del 65%. La capacitación no cambió.

> **Ajuste 2026-10-21:** la capacitación baja un 30%. Plan Esencial $840.000 (antes $1.200.000) y Plan Completo $1.470.000 (antes $2.100.000). Anticipo del 50%: $420.000 / $735.000.

> **Ajuste 2026-10-21 (reemplaza el anterior):** la capacitación se cobra por hora a $80.000. Plan Esencial (6 h) $480.000 y Plan Completo (12 h) $960.000. Anticipo del 50%: $240.000 / $480.000.

> **Ajuste 2026-10-21 (reemplaza los anteriores):** capacitación a $100.000 por hora. Plan Esencial (6 h) $600.000 y Plan Completo (12 h) $1.200.000. Anticipo del 50%: $300.000 / $600.000.
