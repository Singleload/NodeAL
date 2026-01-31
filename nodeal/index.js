require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const path = require('path');
const { tools, toolDefinitions } = require('./tools');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(express.static('../app/dist'));

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `
You are the Architect AI. You have full control over the 'app' directory.
Your goal is to build, maintain, and evolve a React/Node application based on user requests.

CRITICAL RULES:
1. SAFETY FIRST: Before editing critical files, use 'create_checkpoint'.
2. VERIFY: After writing code, ALWAYS run 'run_command' (e.g., 'npm run build' or 'node -c file.js') to check for syntax errors.
3. RECOVER: If a command fails, read the error, try to fix it. If you cannot fix it, use 'rollback'.
4. DEPENDENCIES: If you import a package, make sure to run 'npm install' via 'run_command'.
5. Do not hallucinate file paths. Use 'list_files' first.
`;

app.post('/api/chat', async (req, res) => {
  let { messages } = req.body;
  
  // Lägg till system prompt om den saknas
  if (messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: SYSTEM_PROMPT });
  }

  try {
    let keepGoing = true;
    let turnCount = 0;
    const MAX_TURNS = 10; // Säkerhetsgräns för att undvika oändliga loopar

    while (keepGoing && turnCount < MAX_TURNS) {
      turnCount++;
      
      const completion = await openai.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct", // Bra balans mellan kodning och pris
        messages: messages,
        tools: toolDefinitions,
        tool_choice: "auto",
      });

      const message = completion.choices[0].message;
      messages.push(message); // Spara i historiken

      // Om AI:n vill köra tools
      if (message.tool_calls) {
        console.log("🤖 AI wants to use tools:", message.tool_calls.length);
        
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          
          console.log(`Running ${fnName} with args:`, args);
          
          let result;
          // Mappa funktionsnamn till implementation
          if (fnName === 'list_files') result = await tools.listFiles(args);
          else if (fnName === 'read_file') result = await tools.readFile(args);
          else if (fnName === 'write_file') result = await tools.writeFile(args);
          else if (fnName === 'run_command') result = await tools.runCommand(args);
          else if (fnName === 'create_checkpoint') result = await tools.createCheckpoint(args);
          else if (fnName === 'rollback') result = await tools.rollback(args);
          else result = "Unknown tool";

          // Lägg till resultatet i meddelandekedjan
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result
          });
        }
        // Loopen fortsätter för att låta AI:n kommentera resultatet eller köra fler tools
      } else {
        // Om inga tools anropas, är AI:n klar
        keepGoing = false;
        res.json({ response: message.content, history: messages });
      }
    }
  } catch (error) {
    console.error("Critical Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🛡️ NodeAL Active on port ${PORT}. Monitoring /app...`));