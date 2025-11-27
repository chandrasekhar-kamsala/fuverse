import { useNavigate } from "react-router-dom";

// ✨ Starfield Background
function StarField() {
  const stars = Array.from({ length: 100 });
  return (
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      {stars.map((_, i) => {
        const size = Math.random() * 2 + 1;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 3 + 2;
        return (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-0 animate-twinkle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              top: `${top}%`,
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          ></div>
        );
      })}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation-name: twinkle;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
      `}</style>
    </div>
  );
}

// 🌌 Subtle Solar System Animation
function SolarSystem() {
  return (
    <div className="absolute inset-0 flex items-center justify-center -z-20 pointer-events-none">
      <div className="relative w-[24rem] h-[24rem] flex items-center justify-center">
        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-[0_0_60px_15px] shadow-yellow-500/60 animate-pulse"></div>
        <div className="absolute w-44 h-44 rounded-full border border-white/20 animate-spinSlow">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full shadow-[0_0_15px_3px] shadow-blue-500/80"></div>
        </div>
        <div className="absolute w-60 h-60 rounded-full border border-white/20 animate-spinSlower">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full shadow-[0_0_20px_4px] shadow-green-400/80"></div>
        </div>
      </div>
      <style>{`
        @keyframes spinSlow { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes spinSlower { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .animate-spinSlow { animation: spinSlow 20s linear infinite; }
        .animate-spinSlower { animation: spinSlower 35s linear infinite; }
      `}</style>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1C2C] via-[#2E236C] to-[#533483] text-white flex items-center justify-center px-4 overflow-hidden">
      {/* Background animations */}
      <StarField />
      <SolarSystem />

      {/* Central glossy card */}
      <div className="relative bg-black/50 backdrop-blur-lg border border-white/20 rounded-3xl p-10 max-w-3xl w-full shadow-2xl">
        {/* Glowing border */}
        <div className="absolute inset-0 rounded-3xl border-2 border-purple-500 blur-xl opacity-30 animate-pulse pointer-events-none"></div>

        {/* Title */}
        <h1 className="text-6xl font-serif font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-lg">
          Fu<span className="text-pink-400">verse</span>
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-300 text-center mb-8 tracking-wide leading-relaxed font-light">
          Fuverse is your <span className="text-purple-400 font-medium">AI-powered future self</span> — talk to a smarter you and get real guidance for your <span className="text-cyan-400">life</span>, <span className="text-pink-400">career</span>, or <span className="text-yellow-400">dreams</span>.
        </p>

        {/* Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-tr from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-xl transition-all duration-300"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
