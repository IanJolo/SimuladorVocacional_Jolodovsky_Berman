import { Ollama } from "@llamaindex/ollama";
import { Settings } from "llamaindex";
import readline from "readline";


const ollamaLLM = new Ollama({
  model: "gemma3:1b", 
  temperature: 0.75,
});

Settings.llm = ollamaLLM;
Settings.embedModel = ollamaLLM;

const memoria = [
  {
    role: "system",
    content: `
    Eres un asistente vocacional que ayuda a los usuarios a elegir una carrera.
    Vas a hacer al menos 3 preguntas relevantes sobre sus gustos, intereses y preferencias personales durante la conversación.
    El usuario solo responderá tus preguntas; guía tú la conversación de forma clara.
    No pidas permiso para preguntar. Evita frases como "¿Querés que te pregunte algo?", "¿Seguimos?" o similares. Formula directamente la próxima pregunta.
    Tras mínimo	3 o 4 preguntas, entrega recomendaciones directamente sin pedir confirmación ni preguntar si quiere verlas.
    Sugiere 2 o más carreras posibles según lo que el usuario cuente.
    Mantén un tono amable, claro, empático y accesible.
    Refiere explícitamente a lo dicho anteriormente por el usuario en tus respuestas y preguntas.
    `
  }
];

let sugerenciasEntregadas = false;
const PREGUNTAS_OBJETIVO = 4; 

async function main() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    memoria.push({
      role: "user",
      content: "Preséntate brevemente como asistente vocacional y realiza tu primera pregunta para conocer intereses.",
    });
    const firstRes = await ollamaLLM.chat({ messages: memoria });
    const firstText = firstRes?.message?.content || firstRes?.message || "";
    memoria.push({ role: "assistant", content: typeof firstText === "string" ? firstText : String(firstText) });
    console.log(String(firstText).trim());
  } catch (e) {
    console.error("⚠️ No se pudo generar la primera pregunta:", e);
  }

  rl.on("line", async (input) => {
    if (input.toLowerCase() === "salir") {
      rl.close(); 
      return;
    }

    memoria.push({
      role: "user",
      content: input,
    });

    try {
      const userTurns = memoria.filter((m) => m.role === "user").length;
      if (userTurns < PREGUNTAS_OBJETIVO && !sugerenciasEntregadas) {
        memoria.push({
          role: "system",
          content:
            "Formula UNA sola pregunta directa sin pedir permiso, refiriéndote a lo dicho anteriormente, es decir, podés mencionar algo de lo que dijo el usuario antes. No ofrezcas aún recomendaciones.",
        });
      }
      if (userTurns >= PREGUNTAS_OBJETIVO && !sugerenciasEntregadas) {
        memoria.push({
          role: "system",
          content:
            "Ahora, sin hacer más preguntas ni pedir permiso, sugiere 2 o más carreras alineadas a los intereses del usuario, con breve justificación y posibles próximos pasos.",
        });
        sugerenciasEntregadas = true;
      }
      const res = await ollamaLLM.chat({ messages: memoria });

      const respuesta = res?.message?.content || res?.message || "";

      memoria.push({ role: "assistant", content: typeof respuesta === "string" ? respuesta : String(respuesta) });

      console.log("🤖 IA:", String(respuesta).trim());

    } catch (err) {

      console.error("⚠️ Error al llamar al modelo:", err);
    }

  });
}

main();
