require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const path = require('path');
const { tools, toolDefinitions } = require('./tools');

const app = express();
app.use(bodyParser.json());

// Servera Nödkonsolen (Emergency Console)
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurera OpenAI-klienten mot Ollama (eller OpenRouter via env)
const openai = new OpenAI({
  baseURL: process.env.AI_BASE_URL || "[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)",
  apiKey: process.env.OPENROUTER_API_KEY || "ollama",
});

const MODEL_NAME = process.env.AI_MODEL || "mistral-nemo";

// --- STRICT GUARDIAN PROMPT ---
// Optimerad för Mistral/Llama för att minska hallucinationer och felaktiga filskrivningar.
const SYSTEM_PROMPT = `
You are NodeAL, an expert AI Software Architect. 
You are running inside a "Guardian Shell" with direct access to a user's file system via specific tools.

### ENVIRONMENT
- **Root Directory:** You manage the contents of the \`/app\` directory.
- **Frontend:** React + Vite (running on port 5173).
- **Backend:** You can create/edit Node.js files in \`/app\`.

### YOUR TOOLKIT
You have access to the following functions. YOU MUST USE THEM. Do not guess file contents.
1. \`list_files({ dirPath })\`: See what exists.
2. \`read_file({ filePath })\`: READ THIS before editing any file.
3. \`write_file({ filePath, content })\`: Overwrite file content.
4. \`run_command({ command })\`: Run terminal commands (npm install, git init, etc).
5. \`create_checkpoint({ message })\`: Save state to Git.
6. \`rollback()\`: Restore state if you break something.

### CRITICAL RULES (STRICT COMPLIANCE REQUIRED)
1. **NO GUESSING:** Never generate code for a file without reading it first via \`read_file\`, unless it is a brand new file.
2. **VERIFICATION:** After writing code, running \`run_command("npm run build")\` or checking syntax is highly recommended.
3. **NO MARKDOWN IN TOOLS:** When using \`write_file\`, the \`content\` parameter must be pure code/text. DO NOT wrap the content in markdown code blocks (like \`\`\`javascript).
4. **DEPENDENCIES:** If you use a new library, you MUST run \`npm install <lib>\` via \`run_command\`.
5. **ERROR HANDLING:** If a tool returns an error, analyze it, think about a fix, and try again. Do not give up immediately.

### WORKFLOW
1. **THOUGHT:** Plan what needs to be done.
2. **OBSERVATION:** List/Read files to understand context.
3. **ACTION:** Execute changes (Atomic edits).
4. **VERIFY:** Ensure the build/server is still alive.
`;

app.post('/api/chat', async (req, res) => {
  let { messages } = req.body;

  // Se till att System Prompt alltid ligger först
  if (!messages.length || messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: SYSTEM_PROMPT });
  }

  try {
    console.log(`🧠 NodeAL (${MODEL_NAME}) is thinking...`);
    
    let keepGoing = true;
    let turnCount = 0;
    const MAX_TURNS = 8; // Begränsa loopar för lokala modeller som kan fastna

    while (keepGoing && turnCount < MAX_TURNS) {
      turnCount++;

      const completion = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: messages,
        tools: toolDefinitions,
        tool_choice: "auto", // Låt modellen bestämma när verktyg behövs
        temperature: 0.2,    // Låg temp för mer precisa kod-ändringar
      });

      const message = completion.choices[0].message;
      messages.push(message); // Lägg till AI:ns svar/tanke i historiken

      // Kontrollera om modellen vill använda verktyg
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🛠️  Tool Request: ${message.tool_calls.length} actions.`);
        
        // Loopa igenom alla verktyg som modellen vill köra
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          const rawArgs = toolCall.function.arguments;
          
          let args;
          try {
            args = JSON.parse(rawArgs);
          } catch (e) {
            console.error(`❌ JSON Parse Error from Model: ${rawArgs}`);
            // Feedback till modellen att den gjorde fel JSON
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Error: Invalid JSON format in arguments. Please try again without Markdown formatting."
            });
            continue;
          }

          console.log(`Running [${fnName}]...`);

          let result;
          try {
            if (fnName === 'list_files') result = await tools.listFiles(args);
            else if (fnName === 'read_file') result = await tools.readFile(args);
            else if (fnName === 'write_file') result = await tools.writeFile(args);
            else if (fnName === 'run_command') result = await tools.runCommand(args);
            else if (fnName === 'create_checkpoint') result = await tools.createCheckpoint(args);
            else if (fnName === 'rollback') result = await tools.rollback(args);
            else result = "Unknown tool function.";
          } catch (err) {
            result = `Tool Execution Error: ${err.message}`;
          }

          // Lägg till resultatet ("Observation")
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: String(result) 
          });
        }
        // Loopen fortsätter -> AI får se resultatet och reagera
      } else {
        // AI:n är klar och vill svara användaren
        keepGoing = false;
        
        // Om historiken blir för stor för en lokal modell, kan vi trimma den här (valfritt)
        // Men vi skickar tillbaka den så Frontend kan rendera
        res.json({ response: message.content, history: messages });
      }
    }

    if (turnCount >= MAX_TURNS) {
      res.json({ response: "I reached my maximum thought limit (safety stop). Did I finish the task?", history: messages });
    }

  } catch (error) {
    console.error("Critical Error:", error);
    res.status(500).json({ error: error.message || "AI Connection Failed" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`
🛡️  NodeAL Guardian Online
--------------------------
🔌 Port:     ${PORT}
🤖 Model:    ${MODEL_NAME}
🔗 Gateway:  ${process.env.AI_BASE_URL}
🚑 Console:  http://localhost:${PORT}
--------------------------
Waiting for input from App...
    `);
});