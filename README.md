# NodeAL: The Self-Evolving AI Platform

**NodeAL** is a recursive AI development environment designed to allow an AI model (via vLLM/OpenRouter) to build, extend, and maintain its own platform.

It utilizes a **Guardian Pattern** architecture to ensure stability: the AI operates on a sandboxed application layer (`/app`) while being supervised by a stable, immutable control layer (`/nodeal`). This allows for safe "surgical" operations on the codebase with automated rollback capabilities.

## 🏗 Architecture

The project is split into two distinct parts to separate the *Architect* from the *Building*:

1.  **`/nodeal` (The Guardian)**
    * **Role:** The immutable backend and control center.
    * **Responsibility:** Communicates with the LLM, executes file system operations, runs terminal commands, and manages Git checkpoints/rollbacks.
    * **Stability:** This code is *never* modified by the AI itself.

2.  **`/app` (The Application)**
    * **Role:** The target application (Frontend + Backend).
    * **Responsibility:** This is the playground. It starts empty (or minimal) and is built entirely by the AI based on user prompts.
    * **Volatility:** The AI has full read/write access here. If the AI breaks the build, NodeAL can roll it back.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **Git** installed and available in your terminal.
* **API Key** from [OpenRouter](https://openrouter.ai) (or a local vLLM endpoint).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/singleload/nodeal.git
    cd nodeal
    ```

2.  **Setup the Guardian (NodeAL):**
    ```bash
    cd nodeal
    npm install
    ```

3.  **Setup the App Environment:**
    ```bash
    cd ../app
    npm init -y  # Initializes a basic package.json if empty
    git init     # Crucial: Initializes git for the rollback feature
    git add .
    git commit -m "Initial State"
    ```

4.  **Configure Environment:**
    Create a `.env` file in the `/nodeal` directory:
    ```env
    OPENROUTER_API_KEY=your_sk_or_pk_key_here
    # Optional: Set a specific model
    # AI_MODEL=meta-llama/llama-3.3-70b-instruct
    ```

---

## 🛠 Usage

### 1. Start the Guardian
Open a terminal in the `/nodeal` directory:

```bash
node index.js
```
*The server will start on port 3001.*

### 2. Bootstrapping the App
Since the `/app` folder is initially empty/minimal, you need to instruct the AI to build its own interface.

**Option A: Using Curl/Postman**
Send a request to `http://localhost:3001/api/chat`:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Initialize a new Vite React project in the current directory. Create a checkpoint first. Then install dependencies and create a basic UI."
    }
  ]
}
```

**Option B: Building the Interface**
Once the AI has generated the frontend (React/Vite), you can run the app:

```bash
cd app
npm run dev
```

Now you can use the web interface (built by the AI) to communicate with NodeAL and further evolve the platform.

---

## 🛡 Security & Safety

**⚠️ WARNING: Use at your own risk.**

NodeAL gives an AI model direct access to your file system (within the `/app` directory) and the ability to execute shell commands. While we have implemented safety guardrails (The Guardian Pattern), keep the following in mind:

1.  **Sandboxing:** The AI is restricted to the `/app` directory by default logic, but no software is 100% impenetrable.
2.  **Command Execution:** The AI can run `npm install`, `rm`, etc.
3.  **Manual Review:** Always review the logs in the NodeAL terminal to see what the AI is doing.

### The Rollback Feature
If the AI introduces a bug or breaks the build:
1.  NodeAL creates a Git commit (Checkpoint) before risky operations.
2.  If a command fails or you request it, NodeAL can execute a `rollback` to revert `/app` to the last stable state.

---

## 🧩 Modularity

NodeAL is built to be modular. The AI accesses capabilities through **Tools** defined in `nodeal/tools.js`.

* `read_file` / `write_file`: File manipulation.
* `run_command`: Terminal execution.
* `create_checkpoint` / `rollback`: Version control safety net.
* `list_files`: Context awareness.

To add new capabilities, extend the `tools` object and `toolDefinitions` in the NodeAL backend.

## 📄 License

[MIT License](LICENSE)