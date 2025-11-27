import { useState, useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";
import { getFutureSelfReply } from "./gptRequest";
import ReactMarkdown from "react-markdown";
import { FaMicrophone } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function MindMode({ user }) {
  const [mood, setMood] = useState("");
  const [moodSlider, setMoodSlider] = useState(5);
  const [moodText, setMoodText] = useState("");
  const [style, setStyle] = useState("Coach");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [timer, setTimer] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const recognitionRef = useRef(null);

  const docRef = user ? doc(db, "users", user.uid, "mind", "today") : null;

  useEffect(() => {
    if (!user || !docRef) return;
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMood(data.mood || "");
        setMoodSlider(data.moodSlider || 5);
        setMoodText(data.moodText || "");
        setStyle(data.style || "Coach");
        setAiResponse(data.aiResponse || "");
        setHistory(data.history || []);
        localStorage.setItem(
          "fuverseMemory",
          JSON.stringify({
            name: user.displayName || "User",
            goal: "Improve mental clarity and emotional balance",
            skillLevel: "Intermediate",
          })
        );
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition not supported.");
      return;
    }
    recognitionRef.current = new webkitSpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (e) => {
      setMoodText(e.results[0][0].transcript);
    };
    recognitionRef.current.start();
  };

  // ✅ Updated speech control (Play / Stop)
  const speak = (text) => {
    if (!window.speechSynthesis) return alert("Speech synthesis not supported.");
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = window.speechSynthesis.getVoices()[0];
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const emojiOptions = ["😊", "😐", "😔", "😡", "😴", "😎", "😢"];

  const handleAnalyze = async () => {
    if (!user) return alert("Please login first.");
    if (!mood && !moodText)
      return alert("Please select a mood or describe your feelings.");

    setLoading(true);

    const prompt = `Act like a ${style}. The user's emoji mood is ${mood}, mood score is ${moodSlider}/10, and they describe their feelings as: "${moodText}". Reflect deeply on their mindset and suggest what they should focus on today to feel better or grow.`;

    const reply = await getFutureSelfReply(prompt);

    const newEntry = {
      date: new Date().toLocaleString(),
      mood,
      moodSlider,
      moodText,
      style,
      aiResponse: reply,
    };

    const updatedHistory = [newEntry, ...history].slice(0, 5);

    try {
      await setDoc(docRef, { ...newEntry, history: updatedHistory });
      setAiResponse(reply);
      setHistory(updatedHistory);
      // Removed auto voice
    } catch (error) {
      console.error("❌ Firestore Save Error:", error);
      alert("Failed to save your mood data. Try again.");
    }

    setLoading(false);
  };

  const handleResetMind = async () => {
    setLoading(true);
    const reply = await getFutureSelfReply(
      "Give me a 2-sentence calming reflection to reset my mindset."
    );
    setAiResponse(reply);
    // Removed auto speak here too
    setLoading(false);
  };

  const averageMood = history.length
    ? (history.reduce((acc, h) => acc + h.moodSlider, 0) / history.length).toFixed(1)
    : "N/A";

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 font-sans flex flex-col items-center select-none">
      <h1 className="text-6xl font-extrabold mb-4 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-md">
        Mind <span className="text-pink-500">Mode</span>
      </h1>
      <p className="text-center max-w-2xl text-gray-300 font-light mb-10">
        Let <span className="font-bold text-cyan-400">Fu</span>
        <span className="font-bold text-pink-500">verse</span> tune your mind.
      </p>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-3xl shadow-xl border border-purple-500/50">
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {emojiOptions.map((e) => (
              <button
                key={e}
                onClick={() => setMood(e)}
                className={`text-2xl rounded-full px-3 py-1 border transition ${
                  mood === e
                    ? "border-cyan-400 scale-110"
                    : "border-gray-700 hover:border-cyan-600"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label className="block mb-2 text-sm text-purple-300">
            Mood Intensity: {moodSlider}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={moodSlider}
            onChange={(e) => setMoodSlider(Number(e.target.value))}
            className="w-full mb-4"
          />

          <textarea
            placeholder="Describe what's on your mind..."
            value={moodText}
            onChange={(e) => setMoodText(e.target.value)}
            className="w-full bg-black bg-opacity-60 border border-purple-500 rounded-lg px-5 py-3 text-sm text-purple-200 placeholder-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-600 transition resize-none mb-3"
            rows={3}
          />

          <div className="flex gap-2 mb-3">
            <button
              onClick={startListening}
              className="bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600"
            >
              <FaMicrophone className="text-white text-lg" />
            </button>

            <button
              onClick={handleResetMind}
              className="bg-gray-700 text-sm px-3 py-1 rounded-lg hover:bg-gray-600"
            >
              Reset Mind
            </button>
          </div>

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="bg-black bg-opacity-60 border border-pink-500 rounded-lg px-5 py-2 text-sm text-pink-300 mb-4 focus:outline-none focus:ring-4 focus:ring-pink-500"
          >
            <option>Coach</option>
            <option>Monk</option>
            <option>Friend</option>
          </select>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg py-2 font-semibold shadow-lg transition disabled:opacity-60"
          >
            {loading ? "Reflecting..." : "Analyze My Mindset"}
          </button>

          {/* Timer */}
          <div className="mt-6 text-center">
            <div className="text-3xl font-bold mb-2">
              {Math.floor(timer / 60).toString().padStart(2, "0")}:
              {(timer % 60).toString().padStart(2, "0")}
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="bg-green-700 px-3 py-1 rounded"
              >
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                onClick={() => {
                  setTimer(25 * 60);
                  setIsRunning(false);
                }}
                className="bg-red-700 px-3 py-1 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {aiResponse && (
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-3xl shadow-xl border border-cyan-600 max-h-[300px] overflow-y-auto">
              <h2 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">
                <span className="text-cyan-400">Fu</span>
                <span className="text-pink-400">verse</span> Reflects:
              </h2>
              <div className="text-sm leading-relaxed text-gray-300 mb-3">
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => speak(aiResponse)}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  🎧 Play Voice
                </button>
                <button
                  onClick={stopSpeaking}
                  className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  ⏸ Stop Voice
                </button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <>
              <div className="bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 p-4 rounded-3xl shadow-xl border border-purple-600 text-sm max-h-[200px] overflow-y-auto">
                <h3 className="font-semibold text-purple-300 mb-2">
                  Recent Reflections:
                </h3>
                <ul className="space-y-1 text-gray-400 list-disc ml-4">
                  {history.map((entry, i) => (
                    <li key={i}>
                      <strong>{entry.date}:</strong> [{entry.mood}{" "}
                      {entry.moodSlider}/10] - {entry.moodText}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 p-4 rounded-3xl shadow-xl border border-cyan-500">
                <p className="text-sm text-cyan-300 mb-1">
                  Average Mood Score (Last {history.length}):
                </p>
                <p className="text-xl text-white font-semibold">
                  {averageMood}/10
                </p>
                <Line
                  data={{
                    labels: history.map((h) => h.date),
                    datasets: [
                      {
                        label: "Mood",
                        data: history.map((h) => h.moodSlider),
                        borderColor: "#38bdf8",
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    scales: { y: { min: 1, max: 10 } },
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MindMode;
