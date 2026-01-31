const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const simpleGit = require('simple-git');

// VIKTIGT: Peka på 'app'-mappen, inte nodeal
const TARGET_DIR = path.resolve(__dirname, '../app');
const git = simpleGit(TARGET_DIR);

const tools = {
  // --- FILE SYSTEM ---
  listFiles: async ({ dirPath = '.' }) => {
    try {
      // Ignorera node_modules och .git för att spara tokens
      const result = await execShellCommand(`find . -maxdepth 2 -not -path '*/.*'`, TARGET_DIR);
      return result;
    } catch (e) { return `Error listing files: ${e.message}`; }
  },

  readFile: async ({ filePath }) => {
    try {
      const fullPath = path.join(TARGET_DIR, filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (e) { return `Error reading file: ${e.message}`; }
  },

  writeFile: async ({ filePath, content }) => {
    try {
      const fullPath = path.join(TARGET_DIR, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      return `File written to ${filePath}. Don't forget to verify if it works.`;
    } catch (e) { return `Error writing file: ${e.message}`; }
  },

  // --- EXECUTION & SAFETY ---
  runCommand: async ({ command }) => {
    // Säkerhetsspärr: Förhindra att AI:n raderar allt eller går upp i mappar
    if (command.includes('rm -rf /') || command.includes('..')) {
      return "Forbidden command.";
    }
    
    try {
      console.log(`Executing in App: ${command}`);
      const output = await execShellCommand(command, TARGET_DIR);
      return output || "Command executed successfully with no output.";
    } catch (e) {
      return `Command failed:\n${e.message}`;
    }
  },

  // --- GIT / ROLLBACK ---
  createCheckpoint: async ({ message }) => {
    try {
      await git.add('.');
      await git.commit(message || "AI Checkpoint");
      return "Checkpoint created. You can rollback to this state if things break.";
    } catch (e) { return `Git error: ${e.message}`; }
  },

  rollback: async () => {
    try {
      // Återställ till senaste commit och rensa ofiltrerade filer
      await git.reset(['--hard', 'HEAD']);
      await git.clean('fd'); 
      return "System rolled back to last stable state.";
    } catch (e) { return `Rollback failed: ${e.message}`; }
  }
};

// Hjälpfunktion för shell commands
function execShellCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
      if (error) {
        // Vi rejectar inte, utan returnerar stderr så AI:n kan läsa felet
        resolve(`EXIT CODE: ${error.code}\nERROR:\n${stderr}\nOUTPUT:\n${stdout}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Definitioner för OpenAI/OpenRouter
const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List files in the app directory to understand structure.",
      parameters: { type: "object", properties: { dirPath: { type: "string" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read content of a file.",
      parameters: { type: "object", properties: { filePath: { type: "string" } }, required: ["filePath"] }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write code to a file. Overwrites existing content.",
      parameters: { type: "object", properties: { filePath: { type: "string" }, content: { type: "string" } }, required: ["filePath", "content"] }
    }
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Run terminal commands (npm install, npm run build, ls). Returns stdout/stderr.",
      parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] }
    }
  },
  {
    type: "function",
    function: {
      name: "create_checkpoint",
      description: "Save current state before making risky changes.",
      parameters: { type: "object", properties: { message: { type: "string" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "rollback",
      description: "Revert all changes made since the last checkpoint. Use this if build/test fails.",
      parameters: { type: "object", properties: {} }
    }
  }
];

module.exports = { tools, toolDefinitions };