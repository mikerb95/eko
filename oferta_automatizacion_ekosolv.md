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
deje listo el mismo día un paquete completo para que el consultor solo tenga que revisarlo y ajustarlo:

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
| 1 | Levantamiento: plantillas, catálogo en Books, matriz de servicios |
| 2 | Construcción del flujo e integraciones con Zoho |
| 3 | Piloto en paralelo con propuestas reales y ajustes de calidad |
| 4 | Entrega, capacitación y medición contra la línea base |

La Fase 2 (panel web, agente y oportunidades) toma 4 semanas adicionales, de la 5 a la 8, y puede
empezar al terminar la Fase 1 o más adelante. Total: 8 semanas.

> **2026-10-21:** Mike redujo el tiempo de desarrollo a la mitad (antes 8 + 7 = 15 semanas).

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
      propuestas de Ekosolv. El piloto en paralelo (semana 3) existe para esto.
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
se cierran las cifras de la automatización, y genera ingreso inmediato. Sábados, con fechas y horario bajo acuerdo,
hasta 12 participantes, presencial en la oficina de Ekosolv o virtual.

| | Plan Esencial | Plan Completo |
|---|---|---|
| Sesiones | 2 sábados de 3 h (6 h) | 4 sábados de 3 h (12 h) |
| Fechas y horario | Bajo acuerdo | Bajo acuerdo |
| Material | Guía y biblioteca de instrucciones | + espacios de trabajo por área y borrador de política de uso de IA |
| Precio | $600.000 | $1.000.000 |

Pago 50% al confirmar la fecha y 50% al terminar. Cada participante necesita suscripción a Claude (Pro o Team), contratada por Ekosolv antes de la primera sesión.

**Contenido:** S1 fundamentos, cómo pedir y qué no subir (Ley 1581). S2 documentos largos (EIA, PMA,
ICA), revisión normativa con fuente, borradores de informe y propuesta. S3 proyectos con conocimiento
de Ekosolv, tablas y matrices, resultados de laboratorio frente a límites. S4 qué automatizar, IA con
Zoho y correo, casos por área y reglas internas de uso.

### Precio (interno)

- **2026-10-21: tarifa por hora, $100.000/h.** Esencial (6 h) $600.000, Completo (12 h) $1.200.000, y luego Completo bajó a $1.000.000.
  Historial: $2.400.000 / $4.200.000, luego a la mitad ($1.200.000 / $2.100.000), luego a $70.000 y
  $80.000/h, y quedó en $100.000/h. La preparación del material va incluida en la tarifa.
- **Sin acompañamiento posterior:** Mike solo atiende los sábados contratados. No ofrecer soporte por
  chat después de la última sesión.
- Coherente con agosto: allá se declararon 7 h en $3.200.000 (unos $457.000/h) como regalo de cierre.
  Si Mario saca esa comparación, la respuesta es que este programa es a la medida y con material propio.
- Mike no factura con IVA: los precios son finales y la propuesta no menciona IVA.
- **Palancas, en orden:** 10% de descuento por pago completo anticipado; subir el cupo a 15 personas
  sin costo; si firma la automatización en los 60 días siguientes, el sábado 4 hace también de
  levantamiento de la Fase 1 (ahorra horas de la semana 1).
- **No ceder:** el 50% antes de empezar.
- Valor estratégico: la capacitación pone a Mike frente a todo el equipo y deja recogidas las
  plantillas y documentos reales que pide la sección 4. Usar los sábados para tomar la línea base de
  horas por propuesta.

## 11. Respuesta al correo de Mario (actualizada 2026-10-21)

Asunto: RE: PROPUESTA AUTOMATIZACIÓN e IA PARA EKOSOLV

> Hola, Mario. Muy bien, gracias. ¿Cómo vas tú?
>
> Te comparto la propuesta con las dos cosas que hablamos:
>
> [LINK]
>
> Para la capacitación armé dos planes, los dos en sábado, con fechas y horario a convenir:
>
> - **Plan Esencial:** 2 sábados de 3 horas, por $600.000.
> - **Plan Completo:** 4 sábados de 3 horas, por $1.000.000. Además
>   del uso diario, deja montados los espacios de trabajo del equipo y unas reglas internas de uso de
>   IA.
>
> Estos valores aplican si contratan también la automatización; la capacitación sola vale
> $800.000 y $1.400.000.
>
> Los dos son para hasta 12 personas, presenciales en la oficina o virtuales, y trabajan sobre
> documentos reales de Ekosolv. Cada participante necesita una suscripción a Claude (plan Pro o
> Team) a nombre de la empresa.
>
> La automatización va en el mismo documento, ya ajustada a su Zoho CRM. Es un solo proyecto que
> incluye todo: arranca desde el Brief y deja lista la propuesta, la estimación en Books, la carpeta
> en WorkDrive y la presentación para que el consultor solo la revise. Además trae un panel web con
> un agente de cumplimiento que revisa todos los días la normativa nueva, los autos de sus clientes,
> los documentos y los vencimientos, y cuando algo aplica les manda una alerta con la norma, el
> plazo y la acción sugerida. La decisión siempre queda en manos del consultor.
>
> Y por contratar la automatización les incluyo un chat con IA en el sitio web de Ekosolv: atiende
> a clientes y visitantes al instante, a cualquier hora, con la normativa vigente, los casos de
> Ekosolv y la base de conocimiento de la empresa, y cuando hace falta le pasa la conversación a un
> consultor. También incluyo 2 horas de capacitación para el equipo en el uso del panel y del
> agente, en la fecha que acordemos.
>
> La mensualidad solo cambia según cuántas propuestas hagan al mes (hay niveles de 20, 40 y 80):
> desde $1.185.000 con hasta 20. El desarrollo arranca con un anticipo de $500.000 y la primera
> mensualidad se cobra cuando el sistema ya esté funcionando. Desde el mes 19 baja, porque la construcción ya queda pagada. En la página 5 del documento está el desglose de la mensualidad.
>
> Para ajustar las cifras necesito algunos datos que dejé al final del documento, sobre todo cuántas
> propuestas hacen al mes y cuánto tiempo les toma cada una.
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
  reglas 16, integración al panel 12, pruebas 10). Fase 2 pasa de 4 a 7 semanas (luego Mike lo dejó en 4 semanas al reducir el cronograma a la mitad).
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

> **Ajuste 2026-10-21:** Plan Completo baja a $1.000.000 (Esencial sigue en $600.000). Anticipo del 50%: $300.000 / $500.000.

> **Ajuste 2026-10-21:** mensualidades de automatización fijadas por Mike: Fase 1 $400.000/mes y Fase 1 + 2 $750.000/mes (meses 1 a 24). Desde el mes 25: $250.000 / $350.000.

> **Matriz por volumen 2026-10-21 (reemplaza el tope de 60 propuestas):** costo de IA estimado con
> Sonnet 5.5 a ~$9.500 COP por propuesta (mezcla 50% cortas ~$4.000 y 50% largas ~$15.000, TRM 4.000,
> sin Batch API), por 1,5 de margen = ~$14.250. Consumo: 40 propuestas $570.000, 80 propuestas
> $1.140.000, adicional sobre 80 a $15.000. Base fija sin IA: Fase 1 $400.000 / Fase 1 + 2 $750.000
> (desde el mes 25: $250.000 / $350.000).
>
> | | Hasta 40 | Hasta 80 | Mes 25+ (40) | Mes 25+ (80) |
> |---|---|---|---|---|
> | Fase 1 | $970.000 | $1.540.000 | $820.000 | $1.390.000 |
> | Fase 1 + 2 | $1.320.000 | $1.890.000 | $920.000 | $1.490.000 |
>
> La propuesta ahora tiene 6 páginas; la 5 explica el costo de la IA para alguien no técnico y lo
> compara con horas de consultor (supuestos: $50.000/h, 6 h hoy, 1,5 h de revisión). Si se usa Batch
> API el costo real de IA baja a la mitad y el margen sube.

> **Nivel de 20 propuestas (2026-10-21):** consumo IA 20 x $14.250 = $285.000. Fase 1 $685.000,
> Fase 1 + 2 $1.035.000; desde el mes 25: $535.000 / $635.000. Ahora es el precio "desde" de la portada.

> **Sin fases (2026-10-21, reemplaza todo lo anterior de Fase 1 / Fase 1 + 2):** Mike decidió un solo
> proyecto que incluye todo (flujo de propuestas, panel web, agente y oportunidades). La tarifa solo
> cambia por volumen. Se tomaron los valores de la antigua Fase 1 + 2 (base $750.000 / $350.000 +
> IA por volumen a costo x1,5), soporte 8 h al mes, cronograma único de 8 semanas.
>
> | Propuestas al mes | Meses 1 a 24 | Desde el mes 25 |
> |---|---|---|
> | Hasta 20 | $1.035.000 | $635.000 |
> | Hasta 40 | $1.320.000 | $920.000 |
> | Hasta 80 | $1.890.000 | $1.490.000 |
> | Más de 80 | + $15.000 por adicional | + $15.000 por adicional |
>
> Ejemplo de la página 5 (40 propuestas): $12.000.000 a mano frente a $4.320.000 con el sistema,
> ahorro de unos $7.700.000 y 180 horas al mes.

> **Bono chat con IA en la web (2026-10-21):** incluido sin costo al contratar la automatización.
> Responde con normativa, casos de Ekosolv (anonimizados) y RAG de la empresa; escala a un consultor
> con resumen. Va en el cronograma semanas 7 y 8. Condición: solo información aprobada por Ekosolv,
> sin datos personales. **Riesgo interno:** su consumo de IA sale del margen. Estimado con Sonnet 5.5
> y caché: ~$300 COP por conversación de 5 mensajes, unos $90.000/mes con 300 conversaciones. Con
> Haiku 5.5 sería mucho menos. Si el tráfico crece, poner un tope de uso razonable. Para construirlo,
> usar la skill `chat-ia`.

> **Desglose de la mensualidad (2026-10-21), mismos totales:**
>
> | Componente | Meses 1 a 24 | Desde el mes 25 |
> |---|---|---|
> | Construcción (todo lo de la página 3, en 24 cuotas = $9.600.000) | $400.000 | Ya pagada |
> | Infraestructura (servidores, base de datos, almacenamiento, copias) | $150.000 | $150.000 |
> | Funcionamiento del agente (vigilancia diaria, chat web, 8 h de soporte) | $200.000 | $200.000 |
> | Propuestas con IA (20 / 40 / 80) | $285.000 / $570.000 / $1.140.000 | Igual |
>
> El reparto 150/200 de los $350.000 fijos es una asignación propuesta; ajustarlo si el costo real
> de servidores es distinto. Va en la página 5 de la propuesta.

> **Construcción a 18 meses (2026-10-21):** misma cuota de $400.000, ahora 18 cuotas (total
> $7.200.000, antes $9.600.000). Plazo mínimo 18 meses. Meses 1 a 18: $1.035.000 / $1.320.000 /
> $1.890.000; desde el mes 19: $635.000 / $920.000 / $1.490.000.

> **2026-10-21:** se quitaron de la propuesta "Cómo cobra la IA" y la comparación con horas de
> consultor. La página 5 ahora es "Desglose de la mensualidad" (componentes + bono del chat).

> **Capacitación con o sin automatización (2026-10-21):** $600.000 / $1.000.000 solo si contratan
> también la automatización; sola: $900.000 / $1.500.000. Anticipo 50% de la sola: $450.000 / $750.000.

> **Ajuste:** capacitación sola pasa a $800.000 / $1.400.000 (anticipo 50%: $400.000 / $700.000).

> **Bono 2 h de capacitación con el agente (2026-10-21):** incluido al contratar la automatización; uso del panel y del agente de cumplimiento, en la semana de entrega.

> **Valores con descuento por volumen y cláusulas de protección (2026-10-21, reemplaza los anteriores):**
>
> | Componente | Hasta 20 | Hasta 40 | Hasta 80 |
> |---|---|---|---|
> | Construcción (18 cuotas) | $400.000 | $400.000 | $400.000 |
> | Infraestructura | $150.000 | $150.000 | $150.000 |
> | Funcionamiento (agente, chat, 8 h soporte) | $350.000 | $350.000 | $350.000 |
> | Propuestas con IA | $285.000 ($14.250 c/u) | $500.000 ($12.500 c/u) | $800.000 ($10.000 c/u) |
> | **Total meses 1 a 18** | **$1.185.000** ($59.250 c/u) | **$1.400.000** ($35.000 c/u) | **$1.700.000** ($21.250 c/u) |
> | **Desde el mes 19** | **$785.000** | **$1.000.000** | **$1.300.000** |
>
> - Excedente: $25.000 por propuesta sobre el nivel contratado (más caro que cualquier nivel, para empujar a subir).
> - Propuesta con documentos de más de 100 páginas cuenta como 2.
> - Cláusulas nuevas: tarifas se confirman con el consumo real de las primeras 4 semanas; ajuste anual
>   por IPC; si la TRM varía más del 10% se revisa el componente de IA.
> - Funcionamiento subió de $200.000 a $350.000 porque 8 h de soporte ya valían ~$400.000.
> - **Interno, obligatorio:** procesar con Batch API. Sin él, el nivel de 80 con propuestas largas
>   pierde ~$368.000/mes en IA. Con Batch, el peor caso (todas largas) cuesta ~$7.300 c/u.
> - Se quitó el cierre de la página 6 para que cupieran las cláusulas.

> **2026-10-21:** sin precio por propuesta visible en el documento (el colchón de IA también cubre el agente y el chat). En la página 5 el componente se llama "Consumo de IA: propuestas, agente y chat".

> **Rondas de ajuste (2026-10-21):** cada propuesta incluye 2 rondas de ajuste en 30 días (documentos,
> notas, cambios); la tercera cuenta como propuesta nueva; páginas agregadas suman a la regla de 100.
> Interno: ajustes con esfuerzo medio + Batch API + regenerar solo secciones afectadas (~$800 por
> ronda). Peor caso nivel 80 (larga + 2 rondas) ~$8.900 de IA por propuesta: margen justo.

> **Proveedor de IA y tiempos (2026-10-21):** cláusula agregada: si la TRM varía más del 10% o el
> proveedor de IA cambia sus tarifas, el consumo de IA se ajusta en la misma proporción. La promesa
> pasó de "en minutos" a "el mismo día" porque el Batch API puede tardar hasta 24 h (normalmente
> minutos). Interno: Batch por defecto, modo normal solo para propuestas marcadas como urgentes;
> sistema desacoplado del modelo (Haiku 5.5 para pasos mecánicos); indicador de costo real vs
> cobrado con alerta al 70%.

> **Límites del agente (2026-10-21):** vigila hasta 50 expedientes y revisa hasta 10 documentos al
> mes (ICA, PMA, permisos, informes); lo adicional se cotiza aparte. Autos y normativa nueva sin
> límite porque son baratos (auto de 40 págs ~$15 con Haiku, ~$450 con Sonnet bajo). Interno:
> filtro por capas (código/Haiku), OCR antes de IA para autos escaneados, presupuesto mensual por
> función (propuestas / agente / chat), agente por Batch salvo plazos < 48 h.

> **Pricing del agente según demanda (2026-10-21):** incluido en cualquier nivel: 50 expedientes y
> 10 revisiones de documentos al mes. Adicionales: $50.000/mes por cada 25 expedientes (costo
> estimado $5.000 a $25.000) y $20.000 por revisión de documento (costo $3.000 a $6.000). Así el
> uso intensivo del agente no se come el consumo de IA de las propuestas.

> **Anticipo (2026-10-21):** $1.000.000 al firmar, abonado a la construcción. Construcción total
> $7.210.000 = $1.000.000 + 18 x $345.000. Mensualidades meses 1 a 18: $1.130.000 / $1.345.000 /
> $1.645.000 (antes $1.185.000 / $1.400.000 / $1.700.000). Desde el mes 19 sin cambio: $785.000 /
> $1.000.000 / $1.300.000. Reduce el riesgo de financiar toda la construcción.

> **Revertido (2026-10-21):** Mike prefirió volver a "sin inversión inicial" por ser más atractivo. Vigente: construcción 18 x $400.000; meses 1 a 18: $1.185.000 / $1.400.000 / $1.700.000.

> **Tiempos de soporte (2026-10-21):** soporte por correo o el panel, sin atención inmediata. Errores
> urgentes se revisan dentro de las 12 horas hábiles siguientes al reporte; lo demás, dentro de 24
> horas hábiles. Para que cupiera, se fusionaron condiciones (borradores + reglas validadas; idioma y
> formato + exclusiones), sin quitar contenido.

> **Alcance del soporte (2026-10-21):** las 8 h cubren errores y ajustes, no funciones nuevas; lo nuevo se cotiza aparte bajo acuerdo previo.

> **Anticipo de desarrollo y primer cobro (2026-10-21):** el desarrollo inicia con un anticipo de
> $500.000, adicional al total (construcción = $500.000 + 18 x $400.000 = $7.700.000). La primera
> mensualidad se cobra en el primer mes de funcionamiento (después de las 8 semanas de desarrollo).
> Las mensualidades no cambian.
