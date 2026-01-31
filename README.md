# NodeAL: The Self-Evolving AI Platform

**NodeAL** is a recursive AI development environment designed to allow an AI model (via vLLM/OpenRouter) to build, extend, and maintain its own platform.

It utilizes a **Guardian Pattern** architecture to ensure stability: the AI operates on a sandboxed application layer (`/app`) while being supervised by a stable, immutable control layer (`/nodeal`).

**The project comes pre-shipped with a functional React Chat Interface**, acting as the AI's "body". From here, the AI can read its own source code and evolve itself.

## 🏗 Architecture

The project is split into two distinct parts:

1.  **`/nodeal` (The Guardian)**
    * **Role:** The immutable backend and control center.
    * **Responsibility:** Communicates with the LLM, executes file system operations, and manages Git checkpoints/rollbacks.
    * **Emergency Console:** Hosts a fail-safe UI at `http://localhost:3001`.

2.  **`/app` (The Application)**
    * **Role:** The target application (Frontend + Backend).
    * **Status:** Contains a bootstrapped React/Vite Chat UI ready for modification.
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
    git clone https://github.com/your-username/nodeal.git
    cd nodeal
    ```

2.  **Setup the Guardian (NodeAL):**
    Install the control layer dependencies.
    ```bash
    cd nodeal
    npm install
    ```

3.  **Setup the App Environment:**
    The `/app` folder already contains the basic UI. We need to install its dependencies and initialize a local git repo for the AI's rollback feature.
    ```bash
    cd ../app
    npm install
    
    # Initialize Git for the AI's Rollback capability (CRITICAL)
    # This allows the Guardian to save/restore states inside the app folder.
    git init
    git add .
    git commit -m "Initial Bootstrapped State"
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

You will see the NodeAL chat interface. Since this interface is part of the `/app` codebase, you can ask the AI to modify it immediately.

**Try this prompt:**
> *"Read the file src/App.css. Then, change the background color of the chat window to a dark blue theme."*

---

## 🚑 Emergency Console & Recovery

**Scenario:** You ask the AI to refactor code, but it makes a syntax error. The React app crashes (White Screen of Death), and you can no longer chat with the AI to fix it.

**Solution: The Guardian Console.**

1.  Keep the servers running.
2.  Open a new browser tab and go to: **`http://localhost:3001`**
3.  This is a static HTML interface served directly by the Guardian. It works even if the React App is broken.
4.  **Send a command:**
    * *"Rollback to the last checkpoint"* -> Restores files to the working state.
    * *"You broke App.jsx with a syntax error. Fix it."* -> AI attempts to repair the file blindly.

---

## 🧩 Modularity & Tools

The AI accesses capabilities through **Tools** defined in `nodeal/tools.js`. The AI can read/write any file inside `/app`, allowing it to:
* Create new backend endpoints (in `/app/server.js` if you ask it to create one).
* Add new React components.
* Install new npm packages.

## 📄 License

[MIT License](LICENSE)