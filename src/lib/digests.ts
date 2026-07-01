// ─────────────────────────────────────────────────────────────────────────────
// Resúmenes consolidados por carrera (fallback sin IA).
// Estos son los digests generados a partir de las respuestas reales.
// Sirven como caché inicial: cuando se configure la API de Anthropic,
// /api/explorer/summary los regenera y guarda en la tabla career_summaries.
// ─────────────────────────────────────────────────────────────────────────────

import type { CareerKey } from './careers'

export type DigestGroup = { label: string; text: string }
export type DigestBlock = { qi: number; groups: DigestGroup[] }

// Las 6 preguntas del resumen (en orden). qi = índice acá.
export const DIGEST_QUESTIONS: { emoji: string; q: string }[] = [
  { emoji: '📅', q: '¿Cómo es en serio el día a día?' },
  { emoji: '👀', q: '¿Qué te sorprende cuando ya estás adentro?' },
  { emoji: '😮‍💨', q: 'Lo más difícil que nadie te avisa' },
  { emoji: '💼', q: '¿De qué se labura después?' },
  { emoji: '🧠', q: '¿Qué hay que tener para que te vaya bien?' },
  { emoji: '🎤', q: 'El consejo de los que ya están adentro' },
]

// Etiquetas cortas y amigables para las preguntas crudas de la encuesta,
// usadas al mostrar testimonios individuales.
export const SURVEY_QUESTION_LABELS: Record<string, string> = {
  b2_q1: 'Cómo llegó a elegirla',
  b3_q1: 'Qué esperaba vs. qué encontró',
  b3_q3: 'Lo que la/lo sorprendió',
  b4_q1: 'Cómo es la semana típica',
  b4_q2: 'Habilidades que hacen falta',
  b4_q3: 'De qué se trabaja',
  b4_q4: 'Lo más difícil que nadie avisa',
  b5_q1: 'Su consejo sin filtro',
  b5_q2: '¿Eligió bien?',
}

// Preguntas crudas priorizadas para mostrar en las tarjetas de testimonios.
export const TESTIMONIAL_QUESTION_KEYS = ['b5_q1', 'b4_q4', 'b3_q3', 'b4_q1', 'b4_q3', 'b5_q2', 'b4_q2', 'b2_q1']

export const DIGESTS: Record<CareerKey, DigestBlock[]> = {
  admin: [
    { qi: 0, groups: [
      { label: 'La mayoría', text: 'Coinciden en que la carga no es pesada: clases de 8 a 13 de lunes a viernes, y si trabajás tranquilamente podés con una o dos materias que le den al hueso por semana. Varios admiten que casi nadie estudia de forma constante — te ponés las pilas unas dos semanas antes de los parciales y obligatorios, y la sacás.' },
      { label: 'Otro grupo', text: 'Marca que lo que más ocupa son los trabajos grupales y prácticos: hay entregas en casi todas las materias y buena parte de la nota pasa por ahí. Traducción: armar un buen equipo es medio media carrera.' },
    ]},
    { qi: 1, groups: [
      { label: 'Casi todos', text: 'Entraron sabiendo que es una carrera generalista, y así la encontraron: "sabés un poco de todo pero nada en profundidad". Si buscás especializarte en algo puntual, ojo con esto.' },
      { label: 'Sorpresas buenas', text: 'A varios los sorprendió para bien el networking — los contactos, profesores y amistades que te deja — y que las materias se van actualizando con lo que pasa en el mundo real, incluida bastante tecnología.' },
      { label: 'Sorpresas malas', text: 'Del otro lado, muchos coinciden en que hay materias que sienten "de relleno" o repetitivas. Varios apuntan directo a la ORT: que "informan las cosas a medias" y te vas enterando de requisitos sobre la marcha. Y alguien que esperaba aprender a montar su propia empresa se encontró con que "te preparan para ser un buen empleado".' },
    ]},
    { qi: 2, groups: [
      { label: 'Un grupo', text: 'Dice que no hay nada "difícil" en sí — es más bancarte materias que no te enganchan y sostener la constancia.' },
      { label: 'Otro grupo', text: 'Lo complicado es de gestión: armar equipos de obligatorios que rindan a la par, llegar al 86 para exonerar, y enterarte tarde de requisitos (créditos de idiomas, que no te exoneran asistencia aunque trabajes). Para varios, lo peor fue la facultad en sí.' },
    ]},
    { qi: 3, groups: [
      { label: '', text: 'El común denominador: es súper amplia. Podés terminar en administración, finanzas o contabilidad, gerenciar un sector, y alguno ya se recibió y trabaja de analista de datos. También te da herramientas si querés fortalecer tu propio emprendimiento. La contra que marcan: al ser tan abarcativa, algunos sienten que "podés trabajar de cualquier cosa" pero sin una vocación definida.' },
    ]},
    { qi: 4, groups: [
      { label: '', text: 'Lo que más repiten: ser ordenado y manejar tus tiempos ("si le dedicás lo justo, la carrera va sobre rieles"), tener ambición y ganas, y sumar visión de negocio — saber venderte, negociar y algo de finanzas. Y bastante pensamiento crítico para analizar los casos que te tiran.' },
    ]},
    { qi: 5, groups: [
      { label: 'Los que la recomiendan', text: 'Destacan lo mismo: los contactos, las bases y las amistades que te deja, y que "no te cierra puertas". Varios que no sabían qué estudiar la usaron como base y no se arrepienten. Consejos que repiten: leé el programa de cada materia antes de entrar (que no te engañe el nombre), armá grupo de estudio desde primer año, y hablá con varios egresados porque cada uno te va a dar una visión distinta.' },
      { label: 'Los más críticos', text: 'Hay una parte bien filosa que vale escuchar: "si querés hacer plata, no estudies esto, ponete a laburar directo". Sienten que está desactualizada, con materias de relleno, y que "aprendés más haciendo, de pasante en una empresa". Un par la llamó "carrera de descarte" y otros dijeron que hoy elegirían otra cosa. Tip que aparece seguido: empezá a trabajar apenas arrancás, así descubrís qué área te copa de verdad.' },
    ]},
  ],

  sistemas: [
    { qi: 0, groups: [
      { label: 'Por un lado', text: 'Clases de lunes a jueves, unas 4-5 horas, que arrancan presenciales y se vuelven virtuales conforme avanzás. La carga horaria de clase es baja comparada con otras carreras — varios lo marcan como un gran punto a favor.' },
      { label: 'Pero ojo', text: 'El peso real está en los trabajos obligatorios. Es muy práctico: te dan un proyecto y una base de documentación, y de ahí lo resolvés vos buscando info, equivocándote y hablando con los compañeros. Como dijo uno, "simula bastante el ambiente laboral".' },
    ]},
    { qi: 1, groups: [
      { label: 'Lo más común', text: 'La sorpresa se repite con la matemática: varios entraron pensando que iba a ser todo números y se encontraron con que el foco está en programar y resolver problemas. A alguno hasta le sorprendió cuánto marketing y negocio tiene.' },
      { label: 'Lo otro', text: 'Todo cambia rapidísimo y el estudio es constante. Para bien, les encantó aprender "a base de equivocarse" y la independencia. Para mal, las horas — hubo quien contó jornadas de 9 de la mañana a 1 de la madrugada: "nadie te obliga, pero era necesario".' },
    ]},
    { qi: 2, groups: [
      { label: 'Un grupo', text: 'Lo que más repiten: gran parte la aprendés solo, "rebuscándotela". La facultad no te va a enseñar lo último — la tecnología se mueve más rápido que cualquier clase — así que salís con una forma de pensar y de resolver, y lo útil lo aprendés construyendo.' },
      { label: 'Otro grupo', text: 'Apunta a lo grupal: casi todos los trabajos son en equipo, y hay problemas que no vas a poder resolver solo, te obliga a apoyarte en los demás. Y un dato concreto: los exámenes son bastante más exigentes que los parciales.' },
    ]},
    { qi: 3, groups: [
      { label: '', text: 'Acá hay consenso: el abanico es enorme. Desde programador o desarrollador, analista de datos o funcional, hasta infraestructura (servidores, data centers), bases de datos, ciberseguridad, inteligencia artificial o gestión de proyectos. Como dijo uno, "podés ser programador 8 horas o product owner de algo". No todos lo tenían claro al empezar, pero coinciden en que opciones sobran.' },
    ]},
    { qi: 4, groups: [
      { label: '', text: 'Lo número uno: que te guste resolver problemas y tengas pensamiento lógico. Suman paciencia, disciplina y disponibilidad de horas. Y algo que remarcan y suele subestimarse: una faceta creativa, "pensar por fuera de lo común". Como es muy grupal, ser buen compañero también pesa.' },
    ]},
    { qi: 5, groups: [
      { label: 'Para quién es', text: 'El consejo estrella: es buenísima SI te gusta la tecnología y bancás aprender solo. Varios avisan que "no es para cualquier perfil" — hay que ser medio obsesivo, del que se pasa un día entero buscando una solución sin que nadie te guíe. Si ese es tu estilo, es ideal. Y armá un buen grupo de estudio desde el primer semestre, lo repiten un montón.' },
      { label: 'La respuesta más honesta', text: 'Una que pega fuerte: alguien contó que la hizo sin que le gustara y la pasó medio mal, y solo la disfrutó en la tesis. Su consejo: "elijan algo que les guste, porque lo van a hacer por mucho tiempo". La mayoría igual siente que eligió bien — les divierte, es súper aplicado y "no sentís que estás estudiando".' },
    ]},
  ],

  'negocios-digitales': [
    { qi: 0, groups: [
      { label: '', text: 'Bastante parejo: clases de lunes a jueves de 8 a 12, unas 4 horas, con todo el material en el portal. La exigencia es más bien baja y no pide estudio constante — te ponés las pilas en época de parciales. Las que sí complican son las "duras": finanzas, contabilidad y economía.' },
    ]},
    { qi: 1, groups: [
      { label: 'Qué es en realidad', text: 'La mayoría la describe igual: es como Administración pero con la capa digital arriba (marketing, datos, algo de programación), "lo moderno con lo tradicional". Varios entraron esperando algo más técnico y se toparon con bastante más de habilidades blandas — a alguno eso lo dejó medio desconforme.' },
      { label: 'Lo bueno y lo malo', text: 'Para bien: lo social, algunos profes muy buenos y los invitados a clase (emprendedores, especialistas). Para mal, se repite la queja de muchas materias "de relleno" y que no se profundiza casi en nada. Como lo resumió uno: "no sos experto en nada, sos generalista", y eso te puede gustar o no.' },
    ]},
    { qi: 2, groups: [
      { label: 'Lo académico', text: 'Lo pesado se concentra en las materias "duras": matemática, contabilidad, economía y finanzas. Fuera de eso, varios dicen que "no hay mucha dificultad, a lo sumo la tesis".' },
      { label: 'El verdadero desafío', text: 'El reto que más repiten no es estudiar: es enfocarte. Al ser tan amplia, cuesta elegir en qué especializarte, y todas las entregas y parciales se te amontonan en pocas semanas al final del semestre.' },
    ]},
    { qi: 3, groups: [
      { label: '', text: 'Otra vez, amplísima: marketing, análisis de datos, growth, project u operations manager, consultoría, finanzas… o directamente emprender, algo que la carrera empuja. La contra honesta que marcan: como no profundiza en nada puntual, "en el rubro que elijas vas a tener que aprender por tu cuenta o trabajando para hacerlo bien".' },
    ]},
    { qi: 4, groups: [
      { label: '', text: 'Lo que más aparece: ser proactivo y autodidacta — querer aprender por tu cuenta, porque la carrera te da la base pero no te hace experto. Suman curiosidad, estar siempre informado, trabajar en equipo (todo es grupal) y llevarte bien con algo de programación. Un plus actual que mencionan: saber usar bien la IA.' },
    ]},
    { qi: 5, groups: [
      { label: 'Pensalo según lo que buscás', text: 'El consejo más repetido: si te va algo tipo administración pero con lo digital, es tu carrera; si querés algo técnico de verdad, capaz te conviene ciencia de datos o sistemas. Y asumí desde el arranque que vas a salir generalista, no experto.' },
      { label: 'Cómo aprovecharla', text: 'Los que la recomiendan dan tips concretos: enfocate en las materias que te gusten, pegate a los 4-5 profes buenos (para varios, lo mejor de la carrera), evitá las clases online y hacé cursos en paralelo para profundizar. La mayoría siente que eligió bien, aunque a algunos les quedó "sabor amargo" por no haberse especializado en algo puntual.' },
    ]},
  ],

  comunicacion: [
    { qi: 0, groups: [{ label: '', text: 'Es una carrera bien práctica: clases de mañana casi todos los días (tipo 8 a 13) y muchas entregas, buena parte en grupo — porque en marketing y publicidad se trabaja así, debatiendo y llegando a acuerdos en equipo. Ronda las 6 materias por semestre, cada una con trabajos prácticos y un parcial.' }]},
    { qi: 1, groups: [{ label: '', text: 'La sorpresa que más se repite: esperaban algo súper práctico y se encontraron con una carga teórica grande — teoría de la comunicación, mucha lectura — que a varios les costó. Alguien que hoy trabaja en marketing avisa que le hubiera gustado más análisis de números. Del lado bueno, destacan que varios profesores son figuras reconocidas de la industria uruguaya.' }]},
    { qi: 2, groups: [{ label: '', text: 'Lo más difícil según ellos: cerrar la brecha entre la teoría y lo que el mercado te pide. Pocas materias te dejan a nivel de "calificar" para un laburo que exige experiencia con herramientas y programas, así que entrar a la industria sin experiencia previa cuesta. También mencionan la tesis, larga y algo desactualizada.' }]},
    { qi: 3, groups: [{ label: '', text: 'La salida es más amplia de lo que muchos creían al entrar (varios pensaban "solo agencias de publicidad"). Está el lado agencia, pero también los equipos de marketing dentro de las marcas, el marketing digital que crece fuerte, branding, paid media, diseño, organización de eventos y, para la orientación audiovisual, roles de rodaje y post-producción.' }]},
    { qi: 4, groups: [{ label: '', text: 'Lo que más nombran: curiosidad y creatividad, apertura mental y saber ponerte en el lugar del otro. Suman ser organizado y constante, y estar todo el tiempo actualizado de las tendencias y herramientas, porque cambian rápido. Un dato honesto que tiró alguien: ayuda tener interés genuino y, a veces, cierto respaldo económico al arrancar.' }]},
    { qi: 5, groups: [{ label: '', text: 'El consejo unánime: no te quedes solo con lo que te dan en clase y conseguí trabajo relacionado (agencia o marketing) lo antes posible, aunque al principio pague poco — esa experiencia después vale oro. Coinciden en que la teoría está buena, pero "recién aprendés de verdad cuando lo ponés en práctica". Y algo lindo: de todas las carreras, acá el "elegí bien" fue casi unánime — la describen como dinámica, con proyección, y disfrutan trabajar de esto.' }]},
  ],

  finanzas: [
    { qi: 0, groups: [{ label: '', text: 'Los pocos estudiantes de Finanzas que respondieron no contaron cómo es su semana típica, así que preferimos no inventarla. Es de las carreras con menos testimonios por ahora — tomá el resto como una primera pista, no como la foto completa.' }]},
    { qi: 1, groups: [{ label: '', text: 'Coinciden en algo: sintieron varias materias repetitivas o que "no tienen mucho que ver" con finanzas. Y un dato que sorprende: después de primer año no hay tanta matemática como se imaginaban.' }]},
    { qi: 2, groups: [{ label: '', text: 'Dos cosas: la matemática (de alto nivel, y hay que estudiar todo el tiempo porque el rubro cambia) y, sobre todo, que conseguir el primer trabajo en finanzas no es nada fácil — "mucho requiere contactos o años de experiencia".' }]},
    { qi: 3, groups: [{ label: '', text: 'Las opciones que nombran: asesor financiero, analista financiero o de datos, finanzas corporativas, portfolio manager, investment banking (fusiones y adquisiciones) o CFO. Varios admiten que no lo tenían claro al empezar y que les hubiera gustado saberlo antes.' }]},
    { qi: 4, groups: [{ label: '', text: 'Bastante directo: que te gusten los números y tengas capacidad analítica. Interés real por las finanzas — inversión, financiación, gestión del dinero — y bancarte la matemática.' }]},
    { qi: 5, groups: [{ label: '', text: 'Acá hay una advertencia fuerte que conviene escuchar: varios dicen que la salida laboral es más difícil de lo que parece y que "estudiar finanzas no te asegura entrar al sector". Un consejo que apareció: capaz conviene hacer otra carrera y después un máster o certificación (tipo CFA). Igual, si te gustan la economía, las inversiones y la contabilidad, es para vos — sabiendo que tiene mucha matemática y que gran parte la vas a aprender trabajando y estudiando después de recibirte. Sobre si eligieron bien están divididos: a alguno le terminó de gustar recién cuando empezó a trabajar en el rubro.' }]},
  ],

  medicina: [
    { qi: 0, groups: [{ label: '', text: 'Ojo que quienes respondieron están en etapas avanzadas (uno ya haciendo una especialización), así que pintan un panorama intenso: la base es hospital de mañana y estudiar de tarde, casi todos los días de la semana. En la especialización se suman prácticas, rotaciones y hasta 30 pacientes por día — sumando todo, semanas de 60 a 70 horas, buena parte sin remuneración.' }]},
    { qi: 1, groups: [{ label: '', text: 'Las verdades más filosas de todo el relevamiento están acá. Una: "ser médico general no vale de nada, los sueldos son muy malos — sí o sí hay que especializarse, y sin contactos conseguir trabajo es difícil". Otra: la formación no termina nunca, y a cierta edad pesa ("mis amigos ya están recibidos y trabajando, y yo sigo estudiando, resignando fines de semana"). También avisan que la carrera es "un mundo muy alejado" de la realidad del trabajo. Aun así, uno lo resume: "nuestra profesión es hermosa, nuestra formación difícil".' }]},
    { qi: 2, groups: [{ label: '', text: 'La carga de estudio es enorme, pero lo que más marcan es mental: acostumbrarte a que "los tiempos nunca te van a dar" y a que siempre queden cosas colgadas por aprender. Y que especializarte significa resignar un montón, porque la medicina es gigante.' }]},
    { qi: 3, groups: [{ label: '', text: 'Un dato práctico importante: mientras estudiás casi no podés trabajar de lo tuyo. Recién con el título intermedio de practicante (por 5to año) podés hacer triage o atención en servicios de emergencia — y aun así, varios dicen que "sin contactos no conseguís, no hay dónde mandar el CV". Ya recibido, la salida son hospitales y clínicas.' }]},
    { qi: 4, groups: [{ label: '', text: 'Coinciden fuerte: perseverancia, constancia y resiliencia. Bancarte presión de forma permanente —en el estudio y en la práctica— y acostumbrarte a que el tiempo nunca alcanza. Y tener un grupo de amigos o de estudio que haga el camino más llevadero.' }]},
    { qi: 5, groups: [{ label: '', text: 'El consejo: "es apasionante, pero preparate para ver cosas que no verías en ningún lado y para estudiar absolutamente todos los días". Y algo que emociona: a pesar de todas las quejas honestas de acá arriba, los tres coinciden en que volverían a elegirla. "Me encanta, tengo vocación a pesar de todo"; "si no es esto, no es nada". Acá la vocación le gana a lo difícil.' }]},
  ],

  psicomotricidad: [
    { qi: 0, groups: [{ label: '', text: 'Los estudiantes de Psicomotricidad que respondieron no describieron su semana típica, así que no la inventamos. Fijate en el resto de las preguntas, que ahí sí dejaron testimonios muy lindos.' }]},
    { qi: 1, groups: [{ label: '', text: 'Lo primero que sorprende: casi nadie la conoce. Varios ni sabían que existía hasta que un test vocacional se las mostró, y cuentan que tienen que explicar todo el tiempo de qué se trata — "es una remada en dulce de leche porque no es tan conocida". Otra sorpresa, buena: esperaban algo muy centrado en lo patológico y se encontraron con un abanico mucho más amplio.' }]},
    { qi: 2, groups: [{ label: '', text: 'Lo marcan claro: la carga emocional y, físicamente, "poner el cuerpo" — que es a la vez lo más lindo y lo más difícil. Y en lo práctico, compaginar el trabajo con el estudio y la evaluación continua.' }]},
    { qi: 3, groups: [{ label: '', text: 'Podés trabajar como psicomotricista en el ámbito clínico o educativo, como acompañante terapéutico o auxiliar de jardín. El mito que quieren romper: no es solo con niños — se trabaja con cualquier etapa, desde la infancia hasta adultos mayores, y con personas con discapacidad o adicciones. Eso fue justo lo que varias descubrieron dentro de la carrera.' }]},
    { qi: 4, groups: [{ label: '', text: 'Lo que más repiten: empatía, paciencia y mucho autoconocimiento. Suman flexibilidad, vocación y ganas de "poner el cuerpo" de verdad.' }]},
    { qi: 5, groups: [{ label: '', text: 'Consejo: andá con la cabeza abierta, no todo va a salir como esperás ni todo te va a gustar. Pero el balance es hermoso: la describen como una carrera que te forma "no solo para la profesión, sino como persona". Es cansadora, física y mental, "pero todo vale la pena cuando ves los frutos". Dato lindo: hasta las que no terminaron ejerciendo de psicomotricistas dicen que volverían a elegirla — "me dio una mirada del niño muy amorosa".' }]},
  ],
}
