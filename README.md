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
    * **Status:** Comes pre-configured with a React/Vite frontend and a proxy connection to the Guardian.
    * **Volatility:** The AI has full read/write access here. It can redesign the UI, add backend routes, or install new packages.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **Git** installed and available in your terminal.
* **API Key** from [OpenRouter](https://openrouter.ai) (or a local vLLM endpoint).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/singleload/nodal.git
    cd nodal
    ```

2.  **Setup the Guardian (NodeAL):**
    This is the server that manages the AI logic.
    ```bash
    cd nodeal
    npm install
    ```

3.  **Setup the App Environment:**
    This is the UI where you interact with the AI.
    ```bash
    cd ../app
    npm install
    ```

4.  **Configure Environment:**
    Create a `.env` file in the `/nodeal` directory:
    ```env
    OPENROUTER_API_KEY=your_key_here
    # Optional: Set a specific model (Default: meta-llama/llama-3.3-70b-instruct)
    # AI_MODEL=meta-llama/llama-3.3-70b-instruct
    ```

---

## 🛠 Usage

You need to run two terminal processes simultaneously.

### 1. Start the Guardian
Open a terminal in the `/nodeal` directory:

```bash
node index.js
```
*The Guardian server will start on port 3001.*

### 2. Start the App
Open a new terminal in the `/app` directory:

```bash
npm run dev
```
*Vite will start the frontend (usually at http://localhost:5173).*

### 3. Start Building
Open your browser and navigate to the local URL shown by Vite.
Type your instructions in the chat interface.

**Example Prompt:**
> "Read the file src/App.jsx. Then, change the background color of the header to dark blue and add a button that clears the chat history."

---

## 🛡 Security & Safety

**⚠️ WARNING: Use at your own risk.**

NodeAL gives an AI model direct access to your file system (within the `/app` directory) and the ability to execute shell commands.

**The Safety Mechanisms:**
1.  **Sandboxing:** The AI is restricted to the `/app` directory logic.
2.  **Atomic Edits:** The system is designed to verify builds before committing.
3.  **Rollback:** If the AI breaks the application, you can instruct it to run the `rollback` tool (or the system can trigger it), reverting `/app` to the last working Git commit.

---

## 🧩 Modularity

NodeAL is built to be modular. The AI accesses capabilities through **Tools** defined in `nodeal/tools.js`.

* `read_file` / `write_file`: File manipulation.
* `run_command`: Terminal execution.
* `create_checkpoint` / `rollback`: Version control safety net.
* `list_files`: Context awareness.

To add new capabilities, extend the `tools` object in the NodeAL backend.

## 📄 License

[MIT License](LICENSE)