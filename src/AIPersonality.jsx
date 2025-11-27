import { useState, useEffect, useRef } from "react";
import {
  doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, updateDoc
} from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";
import { getFutureSelfReply } from "./gptRequest";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, BarElement,
  CategoryScale, LinearScale,
  Tooltip, Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PERSONALITIES = [
  { id: "mentor", label: "🧓 Mentor", prompt: "You are a wise mentor." },
  { id: "yogi", label: "🧘 Yogi", prompt: "You are a calm and spiritual yogi." },
  { id: "robot", label: "🤖 Robot", prompt: "You are a logical and efficient robot." },
  { id: "friend", label: "🧑 Friend", prompt: "You are a supportive best friend." },
  { id: "coach", label: "🏋️ Coach", prompt: "You are a tough, motivational coach." },
];

const synth = window.speechSynthesis;

function AIPersonality({ user }) {
  const [selectedA, setSelectedA] = useState("mentor");
  const [selectedB, setSelectedB] = useState("friend");
  const [question, setQuestion] = useState("");
  const [mood, setMood] = useState("🙂");
  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personalityUsage, setPersonalityUsage] = useState({});
  const [gameChallenge, setGameChallenge] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [questionHistory, setQuestionHistory] = useState([]);
  const recognitionRef = useRef(null);

  const pinnedRef = user ? collection(db, "users", user.uid, "personality") : null;
  const scoreRef = user ? doc(db, "users", user.uid, "personalityScore", "scoreData") : null;

  useEffect(() => {
    if (!user) return;
    const fetchPins = async () => {
      const snapshot = await getDocs(pinnedRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPinned(data);
    };
    const fetchScore = async () => {
      const docSnap = await getDoc(scoreRef);
      if (docSnap.exists()) setScore(docSnap.data().score || 0);
    };
    fetchPins();
    fetchScore();
  }, [user]);

  const handleAnalyze = async () => {
    if (!question || !user) return alert("Fill question and login.");
    setLoading(true);
    setResponseA("");
    setResponseB("");

    const moodNote = `The user is feeling ${mood}`;
    const styleA = PERSONALITIES.find(p => p.id === selectedA)?.prompt;
    const styleB = PERSONALITIES.find(p => p.id === selectedB)?.prompt;

    const replyA = await getFutureSelfReply(`${styleA}\n${moodNote}\nUser asked: ${question}`);
    const replyB = await getFutureSelfReply(`${styleB}\n${moodNote}\nUser asked: ${question}`);

    setResponseA(replyA);
    setResponseB(replyB);
    setLoading(false);

    setPersonalityUsage(prev => ({
      ...prev,
      [selectedA]: (prev[selectedA] || 0) + 1,
      [selectedB]: (prev[selectedB] || 0) + 1,
    }));

    setQuestionHistory(prev => [...prev, question]);
  };

  const handlePin = async (text) => {
    if (!user) return;
    const docRef = await addDoc(pinnedRef, { text, timestamp: new Date() });
    setPinned([...pinned, { id: docRef.id, text }]);
  };

  const handleUnpin = async (id) => {
    await deleteDoc(doc(pinnedRef, id));
    setPinned(pinned.filter(p => p.id !== id));
  };

  // ---------- Voice Controls ----------
  const speakResponse = (text, side) => {
    if (!text) return;
    stopSpeaking(side);
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = window.speechSynthesis.getVoices()[0];
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => console.log(`${side} finished`);
    synth.speak(utter);
  };

  const stopSpeaking = (side) => {
    if (synth.speaking) {
      console.log(`${side} stopped`);
      synth.cancel();
    }
  };
  // -----------------------------------

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported in this browser");

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };
    recognitionRef.current.start();
  };

  const generateChallenge = async () => {
    const response = await getFutureSelfReply("Give me a short daily riddle or brain teaser in the format 'Q: ... A: ...'");
    const match = response.match(/Q:\s*(.+)\s*A:\s*(.+)/i);
    if (match) {
      setGameChallenge(match[1]);
      setCorrectAnswer(match[2].toLowerCase().trim());
    } else {
      setGameChallenge("Error fetching challenge.");
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer) return;
    if (userAnswer.toLowerCase().trim() === correctAnswer) {
      const newScore = score + 1;
      setScore(newScore);
      await setDoc(scoreRef, { score: newScore });
      alert("✅ Correct! Score +1");
    } else {
      alert("❌ Incorrect. Try again tomorrow!");
    }
    setGameChallenge("");
    setUserAnswer("");
    setCorrectAnswer("");
  };

  const chartData = {
    labels: PERSONALITIES.map(p => p.label),
    datasets: [{
      label: "Times Used",
      data: PERSONALITIES.map(p => personalityUsage[p.id] || 0),
      backgroundColor: "rgba(168, 85, 247, 0.8)",
      borderRadius: 5,
    }]
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 sm:px-6 py-6 overflow-x-hidden">
      <h1 className="text-5xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        AI Personality Mode
      </h1>
      <p className="text-center text-gray-400 mb-8">
        Select two different personalities and compare how they respond to your situation.
      </p>

      {/* Selectors */}
      <div className="flex gap-4 mb-6 justify-center flex-wrap">
        <div>
          <label className="block mb-1 text-sm font-bold">Personality A</label>
          <select value={selectedA} onChange={(e) => setSelectedA(e.target.value)} className="bg-gray-800 p-2 rounded">
            {PERSONALITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-bold">Personality B</label>
          <select value={selectedB} onChange={(e) => setSelectedB(e.target.value)} className="bg-gray-800 p-2 rounded">
            {PERSONALITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-bold">🎭 Mood</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="bg-gray-800 p-2 rounded">
            {["🙂", "😟", "😡", "😢", "😎", "😇"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something to both personalities..."
        rows={3}
        className="w-full bg-gray-900 border border-purple-500 rounded-lg px-4 py-2 text-sm text-purple-200 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none mb-4"
      />

      <div className="flex gap-4 justify-center mb-6 flex-wrap">
        <button onClick={startListening} className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded">🎤 Speak Question</button>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 transition rounded-lg py-2 font-semibold text-white disabled:opacity-50 mb-8"
      >
        {loading ? "Analyzing..." : "Compare Personalities"}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[{ id: selectedA, response: responseA, side: "A" },
          { id: selectedB, response: responseB, side: "B" }].map(({ id, response, side }) => (
          <div key={id} className="bg-gray-800 border border-purple-600 rounded-xl p-5">
            <h3 className="text-xl font-bold mb-2 flex items-center justify-between">
              {PERSONALITIES.find(p => p.id === id)?.label} Response
              {response && (
                <div className="flex gap-2">
                  <button
                    onClick={() => speakResponse(response, side)}
                    className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-2 py-1 rounded-lg"
                  >
                    🎧 Play
                  </button>
                  <button
                    onClick={() => stopSpeaking(side)}
                    className="bg-red-700 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg"
                  >
                    ⏸ Stop
                  </button>
                </div>
              )}
            </h3>
            <p className="whitespace-pre-wrap text-sm mb-4">{response || "No reply yet."}</p>
            {response && <button onClick={() => handlePin(response)} className="text-sm bg-blue-600 hover:bg-blue-700 py-1 px-3 rounded">📌 Pin Advice</button>}
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4">📌 Pinned Advice</h2>
      {pinned.length === 0 && <p className="text-gray-400">No pinned responses yet.</p>}
      <ul className="space-y-4">
        {pinned.map((p) => (
          <li key={p.id} className="bg-gray-900 p-4 rounded border border-purple-700">
            <p className="text-sm whitespace-pre-wrap mb-2">{p.text}</p>
            <button onClick={() => handleUnpin(p.id)} className="text-xs text-red-400">🗑 Remove</button>
          </li>
        ))}
      </ul>

      {/* Analytics */}
      <div className="bg-gray-900 mt-12 p-4 rounded border border-purple-700">
        <h2 className="text-xl font-bold mb-4">📊 Personality Analytics</h2>
        <Bar data={chartData} options={{
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }} />
      </div>

      {/* Memory Coach */}
      <div className="bg-gray-900 mt-12 p-4 rounded border border-purple-700">
        <h2 className="text-xl font-bold mb-2">🧠 Memory Coach</h2>
        {questionHistory.length === 0 ? (
          <p className="text-sm text-gray-400">No repeated topics yet.</p>
        ) : (
          <ul className="text-sm text-purple-200 list-disc pl-4">
            {[...new Set(questionHistory.slice(-5))].map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Game Mode */}
      <div className="bg-gray-900 mt-12 p-4 rounded border border-purple-700 text-center">
        <h2 className="text-xl font-bold mb-2">🧩 Daily Challenge</h2>
        <button onClick={generateChallenge} className="mb-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm">
          Get New Challenge
        </button>
        {gameChallenge && (
          <>
            <p className="text-sm mt-2 text-purple-200">{gameChallenge}</p>
            <input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Your Answer"
              className="mt-3 px-3 py-1 rounded bg-gray-800 text-white border border-purple-500 text-sm"
            />
            <button onClick={submitAnswer} className="ml-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
              Submit Answer
            </button>
          </>
        )}
        <p className="text-xs text-gray-400 mt-3">🎯 Your Score: {score}</p>
      </div>
    </div>
  );
}

export default AIPersonality;
