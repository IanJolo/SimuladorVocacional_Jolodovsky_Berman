import { Ollama } from "@llamaindex/ollama";
import { Settings } from "llamaindex";
import readline from "readline";

  const ollamaLLM = new Ollama({
  model: "gemma3:4b", 
  temperature: 0.7,
});

Settings.llm = ollamaLLM;
Settings.embedModel = ollamaLLM;

// Paleta ANSI para resaltar sin saturar
const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
};

const CARRERAS_DATABASE = {
  tecnologia: [
    "Ingeniería en Sistemas",
    "Ciencia de Datos"
  ],
  salud: [
    "Medicina",
    "Biotecnología",
    "Nutrición"
  ],
  arte_creatividad: [
    "Animación y Multimedia",
    "Dirección de Arte",
    "Ilustración Digital",
    "Producción Musical"
  ],
  sociales: [
    "Relaciones Públicas",
    "Relaciones Internacionales",
    "Psicología"
  ],
  negocios_economia: [
    "Abogacía",
    "Contaduría",
    "Marketing Digital"
  ],
  educacion: [
    "Estudios Judaicos",
    "Letras",
  ]
};

class ConversationMemory {
  constructor() {
    this.messages = [];
    this.userProfile = {
      intereses: [],
      preferencias: [],
      respuestas: []
    };
  }

  addMessage(role, content) {
    this.messages.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  addUserResponse(question, answer) {
    this.userProfile.respuestas.push({
      pregunta: question,
      respuesta: answer,
      timestamp: new Date().toISOString()
    });
  }

  getConversationContext() {
    return this.messages.slice(-10); 
  }

  getUserProfile() {
    return this.userProfile;
  }

  getConversationSummary() {
    if (this.messages.length === 0) return "";
    
    const userMessages = this.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('. ');
    
    return `Resumen de la conversación: ${userMessages}`;
  }
}

class SimuladorVocacional {
  constructor() {
    this.memory = new ConversationMemory();
    this.currentStep = 0;
    this.questionLabels = {
      intereses_generales: 'intereses',
      preferencias_trabajo: 'preferencias de trabajo',
      habilidades_fortalezas: 'habilidades y fortalezas',
      motivacion_impacto: 'motivación e impacto'
    };
    this.questions = [
      {
        id: 'intereses_generales',
        text: 'Para empezar, quiero saber qué te entusiasma aprender o hacer.\nPuede ser algo sobre la tecnología, los deportes, los negocios o incluso las artes',
        category: 'intereses',
        opciones: [
          'Tecnología y software',
          'Arte y contenido creativo',
          'Deportes y bienestar',
          'Ciencias y laboratorio',
          'Ayuda comunitaria y salud',
          'Negocios y emprendimiento'
        ]
      },
      {
        id: 'preferencias_trabajo',
        text: '\nCuando imaginas un día laboral ideal, ¿qué te atrae más?',
        category: 'ambiente_laboral',
        opciones: [
          'Trabajar con personas',
          'Trabajar con datos',
          'Construir productos',
          'Investigar',
          'Al aire libre',
          'Oficina o remoto'
        ]
      },
      {
        id: 'habilidades_fortalezas',
        text: '\n¿En qué crees que te destacas, que sos bueno? Algo en lo que creas que la rompes toda',
        category: 'habilidades',
        opciones: [
          'Números y análisis',
          'Comunicación y escritura',
          'Creatividad y diseño',
          'Organización y liderazgo',
          'Trabajo en equipo',
          'Resolución de problemas'
        ]
      },
      {
        id: 'motivacion_impacto',
        text: '\nPara cerrar: ¿qué huella te gustaría dejar en el mundo? Algo por lo que la gente te debería recordar',
        category: 'impacto',
        opciones: [
          'Mejorar la vida de las personas',
          'Innovar con tecnología',
          'Cuidar el ambiente',
          'Impulsar negocios',
          'Educar y enseñar',
          'Aportar al arte y la cultura'
        ]
      }
    ];
    this.userAnswers = {};
  }

  getAnswersSummary() {
    const parts = [];
    for (const [qid, answer] of Object.entries(this.userAnswers)) {
      const label = this.questionLabels[qid] || qid;
      parts.push(`${label}: ${answer}`);
    }
    return parts.join(' | ');
  }

  async start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Arena (sand) color using ANSI 256-color (approx color code 180)
    console.log("\x1b[38;5;180mCURSO EXPRESS DE ORIENTACIÓN VOCACIONAL JEJEJE\x1b[0m\n");
    console.log(`${COLORS.dim}Bienvenido! Soy un orientador vocacional virtual y te acompañaré a explorar carreras que se correspondan a tus intereses.${COLORS.reset}`);
    console.log(`${COLORS.dim}Tomate el tiempo que quieras para responder. La idea es que sea lo más honesto posible así sale bien. Podes escribir 'salir' en cualquier momento.${COLORS.reset}\n`);

    await this.askQuestion(rl, 0);
  }

  async askQuestion(rl, questionIndex) {
    if (questionIndex >= this.questions.length) {
      await this.generateCareerSuggestions(rl);
      return;
    }

    const question = this.questions[questionIndex];
    const opts = Array.isArray(question.opciones) ? question.opciones : question.opciones;
    console.log(`${COLORS.bold}${question.text}${COLORS.reset}`);
    if (Array.isArray(opts) && opts.length > 0) {
      console.log(`\n${COLORS.cyan}Ejemplos (elegí un número o escribí tu propia respuesta):${COLORS.reset}`);
      opts.forEach((opt, idx) => {
        console.log(`${COLORS.gray}  ${idx + 1}. ${opt}${COLORS.reset}`);
      });
    }
    console.log(`\n${COLORS.green}Tu respuesta (número, texto o 'salir' si preferís terminar el curso):${COLORS.reset}`);

    rl.once('line', async (input) => {
      const raw = (input || '').trim();
      const lower = raw.toLowerCase();
      let processedAnswer = raw;

      if (lower === 'salir') {
        console.log("\n¡Gracias por usar el simulador! 🎓");
        rl.close();
        return;
      }

      

      
      if (/^\d+$/.test(lower) && Array.isArray(opts) && opts.length > 0) {
        const choice = parseInt(lower, 10);
        if (choice >= 1 && choice <= opts.length) {
          processedAnswer = opts[choice - 1];
        }
      }

      // Guardar respuesta en memoria
      this.memory.addMessage('user', processedAnswer);
      this.memory.addUserResponse(question.text, processedAnswer);
      this.userAnswers[question.id] = processedAnswer;

      // Generar respuesta contextual del bot
      await this.generateBotResponse(processedAnswer, question.category);

      // Continuar con siguiente pregunta
      await this.askQuestion(rl, questionIndex + 1);
    });
  }

  async generateBotResponse(userInput, category) {
    try {
      const context = this.memory.getConversationSummary();
      const profileSoFar = this.getAnswersSummary();
      const systemPrompt = `Actúas como un orientador vocacional cercano y profesional.

El usuario habló sobre ${category}. Su mensaje fue: "${userInput}"

Contexto resumido: ${context}

Perfil hasta ahora (resumen de respuestas previas): ${profileSoFar}

Podes mencionar esa información en tus respuestas

Respondé en 1-2 oraciones, con tono amable  y claro, demostrando comprensión específica de lo que dijo. No agregues preguntas.`;

      const res = await ollamaLLM.chat({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: userInput
          }
        ],
      });

      const response = res?.message?.content || res?.message || "";
      console.log(`\n${COLORS.yellow}Orientador:${COLORS.reset} ${response.trim()}\n`);
      
      this.memory.addMessage('assistant', response.trim());
      
    } catch (err) {
      console.log(`\n${COLORS.yellow}Orientador:${COLORS.reset} ¡Gracias por compartirlo! Me ayuda a pensar mejor tus intereses.\n`);
    }
  }

  async generateCareerSuggestions(rl) {
    console.log(`\n${COLORS.cyan}🔎 Revisando tus respuestas...${COLORS.reset}\n`);
    console.log(`${COLORS.dim}Con la información que me brindaste, te voy a recomendar algunas carreras que podrían encajar con tu perfil.${COLORS.reset}\n`);

    try {
      // Crear prompt con toda la información del usuario
      const userProfile = this.memory.getUserProfile();
      const allResponses = Object.values(this.userAnswers).join(' ');
      
      const analysisPrompt = `Eres un orientador vocacional. Analiza las respuestas y propone 2 o más carreras universitarias alineadas al perfil.

RESPUESTAS:
${allResponses}

Guía:
- Extrae intereses, fortalezas y preferencias de entorno.
- Recomienda 3-4 opciones realistas en el contexto hispanohablante (carreras).
- Justifica cada sugerencia con referencias claras a lo dicho por la persona.
- Mantén un tono claro, breve y alentador.

Formato de salida:
🎯 Opciones a considerar:

1) [carrera]
   Motivo: [explicación breve basada en sus respuestas]
2) [carrera]
   Motivo: [explicación breve basada en sus respuestas]
3) [carrera]
   Motivo: [explicación breve basada en sus respuestas]
4) [carrera]
   Motivo: [explicación breve basada en sus respuestas]`;

      const res = await ollamaLLM.chat({
        messages: [
          {
            role: "system",
            content: analysisPrompt
          }
        ],
      });

      const suggestions = res?.message?.content || res?.message || "";
      console.log(suggestions.trim());
      
      this.memory.addMessage('assistant', suggestions.trim());
      
    } catch (err) {
      // Fallback: sugerencias basadas en palabras clave
      console.log(`${COLORS.bold}🎯 Opciones a considerar (carreras):${COLORS.reset}\n`);
      const suggestions = this.generateFallbackSuggestions();
      suggestions.forEach((career, index) => {
        console.log(`${index + 1}. ${career.name}`);
        console.log(`   ${career.reason}\n`);
      });
    }

    await this.offerAdditionalHelp(rl);
  }

  generateFallbackSuggestions() {
    const allText = Object.values(this.userAnswers).join(' ').toLowerCase();
    const suggestions = [];

    if (
      allText.includes('tecnología') ||
      allText.includes('software') ||
      allText.includes('programar') ||
      allText.includes('código') ||
      allText.includes('computación') ||
      allText.includes('sistemas')
    ) {
      suggestions.push({
        name: "Ingeniería en Sistemas",
        reason: "Mencionas interés por lo tecnológico y el desarrollo, afín a sistemas."
      });
    }

    if (
      allText.includes('datos') ||
      allText.includes('estadística') ||
      allText.includes('análisis')
    ) {
      suggestions.push({
        name: "Ciencia de Datos",
        reason: "Tu afinidad por el análisis y la información encaja con data science."
      });
    }

    if (
      allText.includes('salud') ||
      allText.includes('medicina') ||
      allText.includes('hospital') ||
      allText.includes('pacientes')
    ) {
      suggestions.push({
        name: "Medicina",
        reason: "Te atrae el ámbito sanitario y el trabajo con pacientes."
      });
    }

    if (
      allText.includes('nutrición') ||
      allText.includes('alimentos') ||
      allText.includes('bienestar')
    ) {
      suggestions.push({
        name: "Nutrición",
        reason: "Tu interés por el bienestar y la alimentación sugiere esta orientación."
      });
    }

    if (
      allText.includes('psicología') ||
      allText.includes('escucha') ||
      allText.includes('emociones') ||
      allText.includes('ayudar')
    ) {
      suggestions.push({
        name: "Psicología",
        reason: "Muestras motivación por comprender y acompañar a las personas."
      });
    }

    if (
      allText.includes('relaciones públicas') ||
      allText.includes('comunicación') ||
      allText.includes('eventos') ||
      allText.includes('prensa')
    ) {
      suggestions.push({
        name: "Relaciones Públicas",
        reason: "Te interesan la comunicación, la articulación y el manejo de audiencias."
      });
    }

    if (
      allText.includes('derecho') ||
      allText.includes('leyes') ||
      allText.includes('abogacía')
    ) {
      suggestions.push({
        name: "Abogacía",
        reason: "Tu interés por el marco legal y la argumentación apunta a Derecho."
      });
    }

    if (
      allText.includes('contabilidad') ||
      allText.includes('impuestos') ||
      allText.includes('balances') ||
      allText.includes('contaduría')
    ) {
      suggestions.push({
        name: "Contaduría",
        reason: "Afinidad con números aplicados, normativa y gestión financiera."
      });
    }

    if (
      allText.includes('marketing') ||
      allText.includes('redes sociales') ||
      allText.includes('publicidad')
    ) {
      suggestions.push({
        name: "Marketing Digital",
        reason: "Combina estrategia, creatividad y análisis de audiencias."
      });
    }

    if (
      allText.includes('arte') ||
      allText.includes('dibujo') ||
      allText.includes('ilustración') ||
      allText.includes('audiovisual') ||
      allText.includes('diseño')
    ) {
      suggestions.push({
        name: "Dirección de Arte",
        reason: "Tu perfil creativo puede orientarse a dirección visual y conceptual."
      });
    }

    if (
      allText.includes('letras') ||
      allText.includes('literatura') ||
      allText.includes('escritura') ||
      allText.includes('idiomas')
    ) {
      suggestions.push({
        name: "Letras",
        reason: "Interés por la lectura, escritura y análisis del lenguaje."
      });
    }

    if (
      allText.includes('judaico') ||
      allText.includes('judío') ||
      allText.includes('religión') ||
      allText.includes('estudios judaicos')
    ) {
      suggestions.push({
        name: "Estudios Judaicos",
        reason: "Atracción por la tradición, historia y textos del judaísmo."
      });
    }

    // Si no hay coincidencias, sugerir alternativas versátiles (educativas o laborales)
    if (suggestions.length === 0) {
      suggestions.push(
        {
          name: "Administración de Empresas",
          reason: "Es una base amplia para explorar distintos roles y desarrollar habilidades transversales."
        },
        {
          name: "Relaciones Internacionales",
          reason: "Si te interesan los contextos globales, diplomacia y políticas públicas."
        },
        {
          name: "Desarrollador/a Web Junior (Bootcamp)",
          reason: "Una vía corta para iniciar en tecnología si te interesa lo digital."
        }
      );
    }

    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  }

  async offerAdditionalHelp(rl) {
    console.log(`\n${COLORS.cyan}💬 ¿Quieres profundizar en alguna de estas opciones?${COLORS.reset}`);
    console.log(`${COLORS.dim}También puedo responder dudas sobre tu perfil y próximos pasos.${COLORS.reset}`);
    console.log(`${COLORS.green}Escribe tu consulta o 'salir' para terminar:${COLORS.reset}\n`);

    rl.on('line', async (input) => {
      if (input.toLowerCase() === 'salir') {
        console.log(`\n${COLORS.dim}🧭 ¡Gracias por participar!${COLORS.reset}`);
        console.log(`${COLORS.dim}Esto es un punto de partida. Te sugiero explorar planes de estudio, charlas de carreras y conversar con profesionales.${COLORS.reset}`);
        console.log(`${COLORS.dim}¡Éxitos en los próximos pasos! 🌟${COLORS.reset}\n`);
        rl.close();
        return;
      }

      await this.answerFollowUpQuestion(input);
      console.log("\n¿Alguna otra pregunta? (o escribe 'salir'):");
    });
  }

  async answerFollowUpQuestion(question) {
    try {
      const context = this.memory.getConversationSummary();
      const userProfile = Object.values(this.userAnswers).join(' ');
      
      const systemPrompt = `Eres un orientador vocacional. El usuario hace una consulta de seguimiento tras completar un breve cuestionario.

Perfil sintetizado:
${userProfile}

Contexto:
${context}

Responde con información clara y práctica. Cuando corresponda, referencia su perfil. Si pregunta por una carrera, incluye campo laboral, duración aproximada de estudios y habilidades clave. Mantén un tono empático y profesional.`;

      const res = await ollamaLLM.chat({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: question
          }
        ],
      });

      const response = res?.message?.content || res?.message || "";
      console.log(`\n${COLORS.yellow}Orientador:${COLORS.reset} ${response.trim()}`);
      
      this.memory.addMessage('user', question);
      this.memory.addMessage('assistant', response.trim());
      
    } catch (err) {
      console.log(`\n${COLORS.yellow}Orientador:${COLORS.reset} Buena pregunta. Te recomiendo contrastar planes de estudio y hablar con estudiantes o egresados para tener una visión realista.`);
    }
  }
}

async function main() {
  const simulador = new SimuladorVocacional();
  await simulador.start();
}

main().catch(console.error);
