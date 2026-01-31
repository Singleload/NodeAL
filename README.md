# NodeAL: The Self-Evolving AI Platform

**NodeAL** is a recursive AI development environment designed to allow an AI model (via vLLM/OpenRouter) to build, extend, and maintain its own platform.

It utilizes a **Guardian Pattern** architecture to ensure stability: the AI operates on a sandboxed application layer (`/app`) while being supervised by a stable, immutable control layer (`/nodeal`). This allows for safe "surgical" operations on the codebase with automated rollback capabilities.

## 🏗 Architecture

The project is split into two distinct parts to separate the *Architect* from the *Building*:

1.  **`/nodeal` (The Guardian)**
    * **Role:** The immutable backend and control center.
    * **Responsibility:** Communicates with the LLM, executes file system operations, runs terminal commands, and manages Git checkpoints/rollbacks.
    * **Emergency Console:** Hosts a fail-safe UI at `http://localhost:3001`.
    * **Stability:** This code is *never* modified by the AI itself.

2.  **`/app` (The Application)**
    * **Role:** The target application (Frontend + Backend).
    * **Responsibility:** This is the playground. It is built entirely by the AI based on user prompts.
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
    # If app is empty, initialize basic structure
    npm create vite@latest . -- --template react
    npm install
    
    # Initialize Git for Rollback functionality (CRITICAL)
    git init
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
*The Guardian is now listening on port 3001.*

### 2. Start the App
Open a **new** terminal in the `/app` directory:

```bash
npm run dev
```
*The App is now running on port 5173 (default Vite port).*

### 3. Evolve the Platform
Open your browser and navigate to: **`http://localhost:5173`**

You can now chat with the AI through the UI. The AI can read the source code of the app it lives in and modify it in real-time.

---

## 🚑 Emergency Console & Recovery

**Scenario:** You ask the AI to refactor code, but it makes a syntax error. The React app crashes, and you see a blank screen or an error overlay at `localhost:5173`. You can no longer chat with the AI to fix it.

**Solution: The Guardian Console.**

1.  Keep the servers running.
2.  Open a new browser tab and go to: **`http://localhost:3001`**
3.  This is a static HTML interface served directly by the Guardian. It works even if the React App is broken.
4.  **Send a command:**
    * *"Rollback to the last checkpoint"* -> Restores files to working state.
    * *"You broke App.jsx with a syntax error. Fix it."* -> AI attempts to repair the file blindly.

---

## 🛡 Security & Safety

**⚠️ WARNING: Use at your own risk.**

NodeAL gives an AI model direct access to your file system (within the `/app` directory) and the ability to execute shell commands.

1.  **Sandboxing:** The AI is restricted to the `/app` directory by default logic.
2.  **Command Execution:** The AI can run `npm install`, `rm`, etc. inside the app folder.
3.  **Checkpoints:** NodeAL automatically creates Git commits before risky operations.

---

## 🧩 Modularity & Tools

The AI accesses capabilities through **Tools** defined in `nodeal/tools.js`:

* `read_file` / `write_file`: File manipulation.
* `run_command`: Terminal execution (npm, node, ls).
* `create_checkpoint` / `rollback`: Safety net using Git.
* `list_files`: Context awareness.

## 📄 License

[MIT License](LICENSE)