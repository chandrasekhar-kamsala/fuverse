import { useState, useEffect, useRef } from "react";
import { getFutureSelfReply } from "./gptRequest";
import ReactMarkdown from "react-markdown";
import html2pdf from "html2pdf.js";
import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

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
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
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

function SolarSystem() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
      <div className="relative flex items-center justify-center w-[30rem] h-[30rem]">
        <div className="w-24 h-24 bg-gradient-to-r from-yellow-300 to-orange-500 rounded-full shadow-2xl z-10"></div>
        <div className="absolute w-60 h-60 rounded-full animate-spinSlow">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full"></div>
        </div>
        <div className="absolute w-96 h-96 rounded-full animate-spinSlower">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"></div>
        </div>
        <div className="absolute w-[28rem] h-[28rem] rounded-full animate-spinSlowest">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

function FutureMirror({ user }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [personality, setPersonality] = useState("");
  const [coreValues, setCoreValues] = useState("");
  const [lifePriorities, setLifePriorities] = useState("");
  const [timeline, setTimeline] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiPlan, setAiPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const planRef = useRef();

  const memoryDocRef = user ? doc(db, "users", user.uid, "memory", "fuverseMemory") : null;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(memoryDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setGoal(data.goal || "");
        setSkillLevel(data.skillLevel || "Beginner");
        setPersonality(data.personality || "");
        setCoreValues(data.coreValues || "");
        setLifePriorities(data.lifePriorities || "");
        setTimeline(data.timeline || "");
        setAiPlan(data.aiPlan || "");
        setSaved(true);
      } else {
        setName("");
        setGoal("");
        setSkillLevel("Beginner");
        setPersonality("");
        setCoreValues("");
        setLifePriorities("");
        setTimeline("");
        setAiPlan("");
        setSaved(false);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user) return alert("User not logged in!");
    await setDoc(memoryDocRef, {
      name,
      goal,
      skillLevel,
      personality,
      coreValues,
      lifePriorities,
      timeline,
      aiPlan
    });
    setSaved(true);
    alert("✅ Memory saved successfully to cloud!");
  };

  const handleClear = async () => {
    if (!user) return alert("User not logged in!");
    await deleteDoc(memoryDocRef);
    setName("");
    setGoal("");
    setSkillLevel("Beginner");
    setPersonality("");
    setCoreValues("");
    setLifePriorities("");
    setTimeline("");
    setSaved(false);
    setAiPlan("");
    setAiFeedback("");
    setProgress("");
    alert("✅ Memory cleared successfully!");
  };

  const generatePlan = async () => {
    if (!name || !goal) return alert("❗Please fill in your name and goal first.");
    setLoading(true);
    setAiPlan("");
    const prompt = `Act like the future version of ${name}. I am currently a ${skillLevel} learner. My goal is: ${goal}.
Personality traits: ${personality}. Core values: ${coreValues}. Life priorities: ${lifePriorities}. Timeline: ${timeline}.
Please create a step-by-step, encouraging action plan to help me reach my goal based on all this information.`;
    const reply = await getFutureSelfReply(prompt);
    setAiPlan(reply);
    await setDoc(memoryDocRef, {
      aiPlan: reply
    }, { merge: true });
    setLoading(false);
  };

  const handleProgressSubmit = async () => {
    if (!progress.trim()) return;
    setLoading(true);
    const prompt = `Here is my current progress towards the goal "${goal}": ${progress}. I am a ${skillLevel} learner. Based on this, what should I do next?`;
    const reply = await getFutureSelfReply(prompt);
    setAiFeedback(reply);
    setLoading(false);
  };

  const downloadPlanAsPDF = () => {
    if (!aiPlan) return;
    const element = planRef.current;
    element.classList.remove("max-h-64", "overflow-y-auto");
    const opt = {
      margin: 0.5,
      filename: `FuversePlan_${name || "User"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.add("max-h-64", "overflow-y-auto");
    });
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-lg">
        🔒 Please login to access your Future Mirror.
      </div>
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1C2C] via-[#2E236C] to-[#533483] overflow-hidden px-6 py-12 font-sans flex flex-col items-center select-none">
      <StarField />
      <SolarSystem />
      <h1 className="text-6xl font-extrabold mb-8 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-md">
        Future <span className="text-pink-500">Mirror</span>
      </h1>
      <p className="max-w-3xl mb-12 text-center text-lg text-gray-300 font-light leading-relaxed tracking-wide">
        Reflect your future self’s wisdom. Let{" "}
        <span className="font-bold text-cyan-400">Fu</span>
        <span className="font-bold text-pink-500">verse</span> guide you with evolving insights based on your goals and growth.
      </p>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-3xl shadow-xl relative border border-cyan-600/50">
          <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400 opacity-30 blur-lg animate-pulse"></div>
          <div className="relative flex flex-col gap-6">
            <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-black bg-opacity-60 border border-cyan-500 rounded-lg px-5 py-3 text-sm text-cyan-200 placeholder-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500 transition" />
            <input type="text" placeholder="Your Big Goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="bg-black bg-opacity-60 border border-cyan-500 rounded-lg px-5 py-3 text-sm text-cyan-200 placeholder-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500 transition" />
            <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="bg-black bg-opacity-60 border border-cyan-500 rounded-lg px-5 py-3 text-sm text-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-500 transition">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <input type="text" placeholder="Personality traits" value={personality} onChange={(e) => setPersonality(e.target.value)} className="bg-black bg-opacity-60 border border-cyan-500 rounded-lg px-5 py-3 text-sm text-cyan-200 placeholder-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500 transition" />
            <input type="text" placeholder="Core values" value={coreValues} onChange={(e) => setCoreValues(e.target.value)} className="bg-black bg-opacity-60 border border-cyan-500 rounded-lg px-5 py-3 text-sm text-cyan-200 placeholder-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500 transition" />
            <input type="text" placeholder="Life priorities" value={lifePriorities} onChange={(e) => setLifePriorities(e.target.value)} className="bg-black bg-opacity-60 border border-cyan-500 rounded-lg px-5 py-3 text-sm text-cyan-200 placeholder-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500 transition" />
            <input type="text" placeholder="Timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} className="bg-black bg-opacity-60 border border-cyan-500 rounded-lg px-5 py-3 text-sm text-cyan-200 placeholder-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500 transition" />
            <div className="flex gap-4">
              <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-cyan-300 to-blue-300 text-black font-semibold rounded-lg py-2 shadow-lg hover:scale-105 transition">
                {saved ? "Update Memory" : "Save Memory"}
              </button>
              {saved && (
                <button onClick={handleClear} className="flex-1 bg-gradient-to-r from-pink-300 to-red-300 text-black font-semibold rounded-lg py-2 shadow-lg hover:scale-105 transition">
                  Clear Memory
                </button>
              )}
            </div>
            {saved && (
              <button onClick={generatePlan} className="w-full bg-gradient-to-r from-purple-300 to-indigo-300 text-black font-bold rounded-lg py-2 shadow-lg hover:scale-105 transition disabled:opacity-60" disabled={loading}>
                {loading ? "Thinking..." : "Generate AI Plan"}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-8">
          {aiPlan && (
            <div ref={planRef} className="bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 p-6 rounded-3xl shadow-xl border border-pink-600 max-h-[360px] overflow-y-auto relative">
              <div className="absolute top-3 right-3 text-xs font-mono text-pink-400">Plan</div>
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-md">
                <span className="text-cyan-400">Fu</span><span className="text-pink-400">verse</span> Says:
              </h2>
              <div className="text-sm leading-relaxed space-y-3 text-gray-100">
                <ReactMarkdown>{aiPlan}</ReactMarkdown>
              </div>
              <button onClick={downloadPlanAsPDF} className="mt-6 w-full bg-gradient-to-r from-pink-200 to-purple-300 text-black font-semibold py-2 rounded-lg shadow-lg hover:scale-105 transition">
                Download AI Plan as PDF
              </button>
            </div>
          )}
          {aiPlan && (
            <>
              <textarea placeholder="Share your progress..." value={progress} onChange={(e) => setProgress(e.target.value)} rows={5} className="w-full bg-black bg-opacity-70 border border-purple-600 rounded-lg px-5 py-3 text-sm text-purple-200 placeholder-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-600 transition resize-none" />
              <button onClick={handleProgressSubmit} className="w-full bg-gradient-to-r from-purple-200 to-pink-200 text-black font-semibold rounded-lg py-2 shadow-lg hover:scale-105 transition disabled:opacity-60" disabled={loading}>
                {loading ? "Analyzing..." : "Submit Progress"}
              </button>
            </>
          )}
          {aiFeedback && (
            <div className="bg-gradient-to-bl from-gray-900 via-gray-800 to-gray-900 p-5 rounded-3xl shadow-xl border border-cyan-600 max-h-[280px] overflow-y-auto relative">
              <div className="absolute top-3 right-3 text-xs font-mono text-cyan-400">Feedback</div>
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-md">
                <span className="text-cyan-400">Fu</span><span className="text-pink-400">verse</span> Recommends:
              </h2>
              <div className="text-gray-300 text-sm leading-relaxed space-y-2">
                <ReactMarkdown>{aiFeedback}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FutureMirror;
