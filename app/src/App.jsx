import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  // State för meddelanden och input
  const [messages, setMessages] = useState([
    { role: 'system', content: 'NodeAL System online. I am ready to evolve.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Auto-scroll till botten
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMsg = { role: 'user', content: input };
    const newHistory = [...messages, newMsg];
    
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Anropet går till vite-proxyn -> http://localhost:3001/api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory })
      });

      const data = await response.json();

      // Uppdatera med AI:ns svar. 
      // OBS: Backend kan returnera uppdaterad historik om tools kördes.
      if (data.history) {
        setMessages(data.history);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || "No response" }]);
      }

    } catch (error) {
      console.error("Connection error:", error);
      setMessages(prev => [...prev, { role: 'system', content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>NodeAL <span>Architect</span></h1>
        <p>Self-Evolving Environment</p>
      </header>

      <div className="chat-window">
        {messages.map((msg, index) => (
          msg.role !== 'system' && ( // Dölj interna system-prompts om du vill
            <div key={index} className={`message ${msg.role}`}>
              <div className="avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
              <div className="content">
                {/* Enkel rendering av text. AI kan senare bygga Markdown-stöd här */}
                <pre>{msg.content}</pre>
              </div>
            </div>
          )
        ))}
        {loading && <div className="loading">NodeAL is working...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe how you want to change the platform..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default App