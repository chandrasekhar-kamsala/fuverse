import { useState, useEffect, useRef } from "react";
import { logout } from "./firebase/firebaseConfig";
import { getFutureSelfReply } from "./gptRequest";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

// ✨ Starfield Background
function StarField() {
  const stars = Array.from({ length: 80 });
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {stars.map((_, i) => (
        <div
          key={i}
          className="absolute bg-white shadow-sm rounded-full animate-twinkle"
          style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random(),
          }}
        ></div>
      ))}
    </div>
  );
}

// ☀️ Solar System Animation (bigger + slower)
function SolarSystem() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
      <div className="relative flex items-center justify-center w-[30rem] h-[30rem]">
        {/* Central Star (bigger) */}
        <div className="w-24 h-24 bg-gradient-to-r from-yellow-300 to-orange-500 rounded-full shadow-2xl z-10"></div>

        {/* Orbit 1 Planet */}
        <div className="absolute w-60 h-60 rounded-full animate-spinSlow">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full"></div>
        </div>

        {/* Orbit 2 Planet */}
        <div className="absolute w-96 h-96 rounded-full animate-spinSlower">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"></div>
        </div>

        {/* Orbit 3 Planet */}
        <div className="absolute w-[28rem] h-[28rem] rounded-full animate-spinSlowest">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}


function Chat({ user }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [language, setLanguage] = useState("English");
  const sidebarRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sendToFutureSelf = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: prompt }];
    setMessages(newMessages);
    setPrompt("");

    const reply = await getFutureSelfReply(prompt, language);
    setMessages([...newMessages, { role: "ai", content: reply }]);
    setLoading(false);
  };

  const resetChat = () => {
    setMessages([]);
    setPrompt("");
  };

  const handleOutsideClick = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setShowSidebar(false);
    }
  };

  useEffect(() => {
    if (showSidebar) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showSidebar]);

  const handleFeatureClick = (path) => {
    navigate(path);
    setShowSidebar(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1C2C] via-[#2E236C] to-[#533483] overflow-hidden">
      {/* 🌌 Background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarField />
        <SolarSystem />
      </div>

      <div className="relative z-10 flex flex-col h-screen text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 w-full bg-transparent shadow-none z-50 py-3">
          <div className="w-full flex items-center justify-between relative px-2">
            <button
              aria-label="Toggle menu"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-3xl font-extrabold select-none focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded ml-2"
            >
              {showSidebar ? (
                <span className="text-indigo-400">
                  Fu<span className="text-pink-400">verse</span>
                </span>
              ) : (
                "☰"
              )}
            </button>

            <div className="flex items-center gap-4 mr-2">
              {user && (
                <>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full border-2 border-indigo-400"
                      title={user.displayName}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-xl font-bold text-white border-2 border-indigo-400">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="hidden sm:inline font-semibold text-white select-none">
                    {user.displayName || "User"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 transition rounded px-4 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Sidebar */}
        {showSidebar && (
          <aside
            ref={sidebarRef}
            className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-900/90 backdrop-blur-md shadow-lg p-6 space-y-6 z-40 text-white"
          >
            <h2 className="text-2xl font-extrabold mb-6 bg-gradient-to-tr from-indigo-400 to-pink-400 bg-clip-text text-transparent select-none">
              Fu<span className="text-pink-400">verse</span> AI
            </h2>
            <nav className="flex flex-col gap-3 text-lg">
              {[
                { label: "Future Mirror", path: "/future-mirror" },
                { label: "Mind Mode", path: "/mind" },
                { label: "Timeline Explorer", path: "/time" },
                { label: "Life Tracker", path: "/tracker" },
                { label: "Letter to Self", path: "/letter" },
                { label: "AI Personality", path: "/personality" },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => handleFeatureClick(path)}
                  className="text-left hover:text-indigo-400 transition rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Chat messages */}
        <main className="flex-1 mt-16 flex flex-col items-center px-4 pb-24">
          <section className="w-full max-w-4xl flex flex-col overflow-visible h-auto mt-[0.5cm]">
            <div
              className="flex flex-col space-y-4 pr-4 chat-scroll-container overflow-y-auto"
              style={{
                maxHeight: "calc(100vh - 13rem)",
                paddingRight: "0.5rem",
                scrollbarGutter: "stable",
              }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[75%] p-4 rounded-2xl shadow-lg whitespace-pre-wrap backdrop-blur-md ${
                    msg.role === "user"
                      ? "self-end bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                      : "self-start bg-white/20 text-white border border-white/20"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ))}
              {loading && (
                <p className="text-center italic select-none text-indigo-300 text-lg">
                  Fu<span className="text-pink-400">verse</span> is thinking...
                </p>
              )}
              <div ref={chatEndRef} />
            </div>
          </section>
        </main>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendToFutureSelf();
          }}
          className="fixed bottom-4 left-0 right-0 max-w-4xl mx-auto px-4 flex gap-3 items-center backdrop-blur-md bg-white/10 border border-white/20 rounded-full py-3 shadow-lg z-50"
        >
          {/* 🌍 Language dropdown */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/20 backdrop-blur-md text-white px-3 py-2 rounded-lg border-none 
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none"
          >
            <option className="bg-gray-900 text-white" value="English">🇬🇧 English</option>
            <option className="bg-gray-900 text-white" value="Hindi">🇮🇳 Hindi</option>
            <option className="bg-gray-900 text-white" value="Telugu">🇮🇳 Telugu</option>
            <option className="bg-gray-900 text-white" value="Tamil">🇮🇳 Tamil</option>
            <option className="bg-gray-900 text-white" value="Kannada">🇮🇳 Kannada</option>
            <option className="bg-gray-900 text-white" value="Malayalam">🇮🇳 Malayalam</option>
            <option className="bg-gray-900 text-white" value="Marathi">🇮🇳 Marathi</option>
            <option className="bg-gray-900 text-white" value="Gujarati">🇮🇳 Gujarati</option>
            <option className="bg-gray-900 text-white" value="Punjabi">🇮🇳 Punjabi</option>
            <option className="bg-gray-900 text-white" value="Bengali">🇮🇳 Bengali</option>
            <option className="bg-gray-900 text-white" value="Odia">🇮🇳 Odia</option>
            <option className="bg-gray-900 text-white" value="Assamese">🇮🇳 Assamese</option>
            <option className="bg-gray-900 text-white" value="Urdu">🇮🇳 Urdu</option>
          </select>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask your future self..."
            className="flex-1 rounded-full px-5 py-3 text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-400"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendToFutureSelf();
              }
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-tr from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transition rounded-full px-6 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ask
          </button>
          <button
            type="button"
            onClick={resetChat}
            className="bg-yellow-400 hover:bg-yellow-500 transition rounded-full px-6 font-semibold text-gray-900"
            disabled={loading}
          >
            Reset
          </button>
        </form>

        <style>{`
          .chat-scroll-container {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .chat-scroll-container::-webkit-scrollbar {
            display: none;
          }
          @keyframes spinSlow { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
          @keyframes spinSlower { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
          @keyframes spinSlowest { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
          .animate-spinSlow { animation: spinSlow 20s linear infinite; }
          .animate-spinSlower { animation: spinSlower 35s linear infinite; }
          .animate-spinSlowest { animation: spinSlowest 50s linear infinite; }
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          .animate-twinkle {
            animation: twinkle 2.5s infinite ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
}

export default Chat;
