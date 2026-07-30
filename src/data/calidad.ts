/**
 * Calidad: niveles de prueba, verificación y validación, y usabilidad.
 *
 * ── LEE ESTO ANTES DE TOCAR EL ARCHIVO ──────────────────────────────────
 * Este proyecto NO tiene pruebas automatizadas. Ni una. No hay Vitest, no hay
 * Playwright, no hay integración continua que corra nada en cada cambio.
 *
 * Se documenta igual, y con esa frase por delante, porque una sección de
 * testing que enumera quince niveles sin decir cuáles corren de verdad es peor
 * que no tenerla: convierte la documentación en publicidad. Aquí cada nivel
 * declara su estado real —`activo`, `manual` o `pend`— y la evidencia de por
 * qué se puede afirmar eso.
 *
 * `activo`  la comprobación corre y falla el build o el despliegue si no pasa.
 * `manual`  se hace, pero la ejecuta una persona y no queda registro repetible.
 * `pend`    no existe todavía.
 *
 * Al añadir pruebas de verdad: cambiar el estado aquí en el mismo commit que
 * las añade, no después.
 * ────────────────────────────────────────────────────────────────────────
 */

export type EstadoPrueba = 'activo' | 'manual' | 'pend'

export const ESTADO_PRUEBA_LABELS: Record<EstadoPrueba, string> = {
  activo: 'Automatizado',
  manual: 'Manual',
  pend: 'Pendiente',
}

/* ───────────────────────── Niveles de prueba ───────────────────────── */

export interface NivelPrueba
{
  id: string
  nombre: string
  /** Qué pregunta responde este nivel. */
  proposito: string
  estado: EstadoPrueba
  /** Cómo se ejecuta hoy, o qué haría falta para ejecutarlo. */
  como: string
  /** Por qué se puede afirmar el estado declarado. */
  evidencia: string
  herramienta?: string
}

export const NIVELES: NivelPrueba[] = [
  {
    id: 'N-01',
    nombre: 'Compilación',
    proposito: '¿El proyecto se construye entero, sin rutas rotas ni imports colgando?',
    estado: 'activo',
    como: '`npm run build` genera las 27 páginas públicas más los endpoints. Un fallo rompe el despliegue en Vercel.',
    evidencia: 'El despliegue de Vercel es la puerta: si el build falla, no hay producción.',
    herramienta: 'astro build',
  },
  {
    id: 'N-02',
    nombre: 'Tipos',
    proposito: '¿Los datos que viajan entre módulos son los que cada módulo espera?',
    estado: 'activo',
    como: '`astro check` sobre TypeScript en modo estricto, incluidos los datos tipados de src/data.',
    evidencia:
      'Es lo que sostiene el modelo de datos: un requerimiento con un campo mal escrito no compila.',
    herramienta: 'astro check + tsc',
  },
  {
    id: 'N-03',
    nombre: 'Revisión por pares',
    proposito: '¿Alguien más leyó este cambio antes de que entrara?',
    estado: 'manual',
    como: 'Programación en pareja humano–IA registrada en el tablero: cada historia tiene su pareja y su conductor.',
    evidencia: 'Las parejas y el autor de cada historia están en src/data/iteraciones.ts.',
  },
  {
    id: 'N-04',
    nombre: 'Verificación de Definition of Done',
    proposito: '¿Lo que dice el tablero que está hecho se puede abrir y comprobar?',
    estado: 'manual',
    como: 'Cada criterio del DoD apunta a un archivo o comportamiento concreto y se verifica a mano contra el repositorio.',
    evidencia:
      'Los criterios que se cumplieron y luego se retiraron quedan marcados como fallidos en el tablero, no borrados.',
  },
  {
    id: 'N-05',
    nombre: 'Prueba en navegador real',
    proposito: '¿La interfaz se comporta como se diseñó, en escritorio y en móvil?',
    estado: 'manual',
    como: 'Recorrido manual del flujo con el navegador, incluido el viewport angosto.',
    evidencia:
      'De aquí salieron dos defectos reales del tablero: los estilos que no aplicaban a los nodos creados por script, y el conmutador de vista que no ocultaba el tablero.',
  },
  {
    id: 'N-06',
    nombre: 'Auditoría de seguridad',
    proposito: '¿Hay secretos expuestos, dependencias vulnerables o configuración insegura?',
    estado: 'manual',
    como: 'Revisión documentada con hallazgos clasificados por severidad y acciones pendientes.',
    evidencia: 'AUDITORIA.md, con hallazgos críticos y medios y su estado.',
  },
  {
    id: 'N-07',
    nombre: 'Verificación de contenido contra la fuente',
    proposito: '¿Lo que afirma el sitio se sostiene contra el texto de la norma o el dato real?',
    estado: 'manual',
    como: 'Cada novedad del radar se marca verificada solo tras leer la norma; lo que viene de prensa espera.',
    evidencia: 'El radar regulatorio distingue verificado, por verificar y corregido.',
  },
  {
    id: 'N-08',
    nombre: 'Pruebas unitarias',
    proposito: '¿Cada función del dominio hace lo que promete, aislada?',
    estado: 'pend',
    como: 'Los candidatos naturales son puros y no necesitan servidor: derivación y verificación de contraseña, firma y expiración de sesión, contador del límite de tasa, recorte de campos y `hreflangFor`.',
    evidencia: 'No hay dependencia de pruebas en package.json.',
    herramienta: 'Vitest (propuesto)',
  },
  {
    id: 'N-09',
    nombre: 'Pruebas de integración',
    proposito: '¿El endpoint, el dominio y la base se entienden entre ellos?',
    estado: 'pend',
    como: 'Levantar SQLite en archivo y ejercer los endpoints contra una base real y desechable: alta de orden, transición de estado con bitácora, alta de contacto.',
    evidencia: 'Hoy esto se comprueba usando el panel a mano.',
  },
  {
    id: 'N-10',
    nombre: 'Pruebas de autorización',
    proposito: '¿Cada rol puede exactamente lo que debe y nada más?',
    estado: 'pend',
    como: 'Matriz de rol × área × método contra el middleware. Es el nivel de mayor valor pendiente: hoy la única garantía de que logística no escribe en el diario es leer el código.',
    evidencia: 'Las reglas están en un solo lugar y son datos, así que la matriz es directa de escribir.',
  },
  {
    id: 'N-11',
    nombre: 'Pruebas de extremo a extremo',
    proposito: '¿El visitante puede completar el flujo guiado y recibir su consecutivo?',
    estado: 'pend',
    como: 'Recorrer el flujo paso a paso en un navegador automatizado, en español e inglés, y verificar la orden creada.',
    evidencia: 'Sin cobertura: cada cambio en el flujo se prueba a mano.',
    herramienta: 'Playwright (propuesto)',
  },
  {
    id: 'N-12',
    nombre: 'Accesibilidad automática',
    proposito: '¿Hay violaciones de contraste, roles o etiquetas que una herramienta detecte?',
    estado: 'pend',
    como: 'Pasar un analizador por cada plantilla de página y fallar el build ante violaciones nuevas.',
    evidencia:
      'Hay prácticas aplicadas —foco visible, ARIA en pestañas y diálogos, movimiento reducido—, pero ninguna medición.',
    herramienta: 'axe-core (propuesto)',
  },
  {
    id: 'N-13',
    nombre: 'Rendimiento',
    proposito: '¿Las páginas cumplen un presupuesto de carga definido?',
    estado: 'pend',
    como: 'Medir Core Web Vitals por página con umbral que falle si se degrada.',
    evidencia:
      'El diseño ayuda —salida estática, sin framework de cliente, video con fachada— pero nadie lo ha medido.',
  },
  {
    id: 'N-14',
    nombre: 'Análisis estático de seguridad',
    proposito: '¿Hay patrones peligrosos introducidos en un cambio?',
    estado: 'pend',
    como: 'Análisis en cada cambio, más revisión automática de vulnerabilidades en dependencias.',
    evidencia: 'La revisión de dependencias es manual y puntual, según la auditoría.',
  },
  {
    id: 'N-15',
    nombre: 'Prueba de humo tras el despliegue',
    proposito: '¿Producción responde y los caminos críticos siguen vivos después de publicar?',
    estado: 'pend',
    como: 'Chequeo de portada, un endpoint público y el login inmediatamente después de cada despliegue.',
    evidencia: 'No existe. Un despliegue roto se detecta cuando alguien entra al sitio.',
  },
]

/** El resumen honesto que va sobre la tabla, para que no haya que deducirlo. */
export const RESUMEN_PRUEBAS = {
  automatizadas: 0,
  nota:
    'Cero pruebas automatizadas en el repositorio. Lo que hoy protege el sistema son dos comprobaciones que sí bloquean el despliegue —compilación y tipos— más cinco prácticas manuales. Los ocho niveles pendientes están descritos con su punto de entrada para que empezarlos no requiera decidir nada.',
}

/* ───────────────────── Verificación y validación ───────────────────── */

export type ClaseVyV = 'verificacion' | 'validacion'

export const VYV_LABELS: Record<ClaseVyV, string> = {
  verificacion: '¿Lo construimos bien?',
  validacion: '¿Construimos lo correcto?',
}

export interface ActividadVyV {
  id: string
  clase: ClaseVyV
  nombre: string
  /** Qué se comprueba y contra qué se compara. */
  descripcion: string
  /** Nivel de prueba o práctica que la ejecuta. */
  mecanismo: string
  estado: EstadoPrueba
}

export const VYV: ActividadVyV[] = [
  {
    id: 'V-01',
    clase: 'verificacion',
    nombre: 'El código construye y tipa',
    descripcion:
      'El sistema se compila completo y los contratos entre módulos son consistentes: es la comprobación más barata y la que corre siempre.',
    mecanismo: 'N-01 Compilación, N-02 Tipos',
    estado: 'activo',
  },
  {
    id: 'V-02',
    clase: 'verificacion',
    nombre: 'La implementación corresponde al requerimiento',
    descripcion:
      'Cada requerimiento de esta documentación apunta a los archivos donde se puede abrir y comprobar; lo que no se puede abrir queda como pendiente.',
    mecanismo: 'Trazabilidad requerimiento → archivos, N-04',
    estado: 'manual',
  },
  {
    id: 'V-03',
    clase: 'verificacion',
    nombre: 'El comportamiento observable coincide con el diseño',
    descripcion:
      'Recorrido del flujo en navegador real, en escritorio y móvil, incluida la degradación sin JavaScript.',
    mecanismo: 'N-05 Prueba en navegador',
    estado: 'manual',
  },
  {
    id: 'V-04',
    clase: 'verificacion',
    nombre: 'La configuración de seguridad es la declarada',
    descripcion:
      'Las cabeceras llegan en la respuesta, la CSP permite solo los orígenes que el sitio usa y el panel no es indexable.',
    mecanismo: 'N-06 Auditoría',
    estado: 'manual',
  },
  {
    id: 'V-05',
    clase: 'verificacion',
    nombre: 'Los permisos por rol se cumplen',
    descripcion:
      'Cada rol escribe solo en su área. Hoy la garantía es la lectura del middleware, no una comprobación ejecutable.',
    mecanismo: 'N-10 Pruebas de autorización',
    estado: 'pend',
  },
  {
    id: 'V-06',
    clase: 'verificacion',
    nombre: 'La degradación funciona cuando algo falla',
    descripcion:
      'Con la base caída el sitio sirve el JSON versionado, y sin correo configurado la orden sigue registrada.',
    mecanismo: 'N-09 Integración con fallo inducido',
    estado: 'pend',
  },
  {
    id: 'W-01',
    clase: 'validacion',
    nombre: 'El contenido publicado es cierto',
    descripcion:
      'Ninguna cifra, logo, testimonio o licencia se publica sin verificación explícita. Es la validación que este proyecto trata como crítica, porque ya falló una vez.',
    mecanismo: 'Guardas en código + N-07 Verificación contra la fuente',
    estado: 'manual',
  },
  {
    id: 'W-02',
    clase: 'validacion',
    nombre: 'El sistema resuelve el problema operativo real',
    descripcion:
      'El panel modela el ciclo de recolección tal como opera el negocio: ocho estados, responsable, fecha y bitácora.',
    mecanismo: 'Revisión del plan del panel con la operación',
    estado: 'manual',
  },
  {
    id: 'W-03',
    clase: 'validacion',
    nombre: 'El solicitante completa el flujo sin abandonarlo',
    descripcion:
      'El formulario se rediseñó paso a paso con esta hipótesis explícita, pero nadie la ha medido con usuarios ni con datos de abandono.',
    mecanismo: 'Usability testing',
    estado: 'pend',
  },
  {
    id: 'W-04',
    clase: 'validacion',
    nombre: 'El sitio es usable por quien depende de teclado o lector de pantalla',
    descripcion:
      'Hay decisiones tomadas en esa dirección; falta comprobarlas con herramienta y con una persona usando su tecnología de asistencia.',
    mecanismo: 'N-12 Accesibilidad + prueba con usuario',
    estado: 'pend',
  },
  {
    id: 'W-05',
    clase: 'validacion',
    nombre: 'Los requerimientos siguen siendo los correctos',
    descripcion:
      'Los requerimientos viven en el repositorio, así que un cambio de alcance es un commit revisable y no un documento que se desactualiza en silencio.',
    mecanismo: 'Esta documentación + tablero de iteraciones',
    estado: 'activo',
  },
]

/* ─────────────────────────── Usabilidad ─────────────────────────── */

export interface PasoUsabilidad {
  n: number
  nombre: string
  descripcion: string
  /** Lo que este paso produce. */
  entregable: string
  estado: EstadoPrueba
}

export const USABILIDAD_FLUJO = 'Agendar una recolección de RAEE'

export const USABILIDAD_HIPOTESIS =
  'Un formulario largo de trece campos hace abandonar a quien pide una recolección por primera vez. Preguntando una cosa a la vez, con avance visible, el abandono baja y los datos llegan más completos.'

export const USABILIDAD_PASOS: PasoUsabilidad[] = [
  {
    n: 1,
    nombre: 'Definir la tarea y el criterio de éxito',
    descripcion:
      'La tarea es completar la solicitud de recolección hasta ver el consecutivo. Éxito es terminarla sin ayuda ni abandono.',
    entregable: 'Tarea escrita, con criterio binario de éxito.',
    estado: 'activo',
  },
  {
    n: 2,
    nombre: 'Declarar la hipótesis',
    descripcion:
      'La razón por la que el flujo es paso a paso está escrita y es refutable, no una preferencia estética.',
    entregable: 'Hipótesis registrada, arriba en esta sección.',
    estado: 'activo',
  },
  {
    n: 3,
    nombre: 'Reclutar participantes del perfil real',
    descripcion:
      'Cinco personas del perfil que de verdad solicita: responsables de compras, TI o ambiental en empresas que dan de baja equipos.',
    entregable: 'Cinco sesiones de quince minutos.',
    estado: 'pend',
  },
  {
    n: 4,
    nombre: 'Observar sin guiar',
    descripcion:
      'La persona recorre el flujo en su propio dispositivo mientras se registran dudas, retrocesos y puntos de fricción, sin ayudarla.',
    entregable: 'Notas por sesión con los puntos donde se detuvo.',
    estado: 'pend',
  },
  {
    n: 5,
    nombre: 'Medir',
    descripcion:
      'Tasa de finalización, tiempo por paso, campos donde se retrocede y campos que quedan vacíos.',
    entregable: 'Tabla comparable entre sesiones.',
    estado: 'pend',
  },
  {
    n: 6,
    nombre: 'Corregir y volver a medir',
    descripcion:
      'Cada hallazgo entra al tablero como historia con su Definition of Done, y la corrección se vuelve a observar.',
    entregable: 'Historias en el tablero, trazables al hallazgo que las originó.',
    estado: 'pend',
  },
]

export const USABILIDAD_NOTA =
  'Los pasos 1 y 2 están hechos: la tarea y la hipótesis existen y el flujo se construyó sobre ellas. Del 3 al 6 no se han ejecutado, así que hoy el rediseño paso a paso es una decisión razonada, no una decisión validada. Lo que sí se corrigió con observación directa fue la lectura en móvil del tablero, y esa observación fue interna, no con usuarios.'

/* ──────────────────────────── Derivados ──────────────────────────── */

export const contarNiveles = () => ({
  total: NIVELES.length,
  activo: NIVELES.filter((n) => n.estado === 'activo').length,
  manual: NIVELES.filter((n) => n.estado === 'manual').length,
  pend: NIVELES.filter((n) => n.estado === 'pend').length,
})

export const vyvDe = (clase: ClaseVyV) => VYV.filter((v) => v.clase === clase)
