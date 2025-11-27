import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";
import { getFutureSelfReply } from "./gptRequest";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import jsPDF from "jspdf";

const MOODS = [
  { label: "😞 Sad", value: "sad", color: "#3b82f6" },
  { label: "😐 Neutral", value: "neutral", color: "#9ca3af" },
  { label: "🙂 Good", value: "good", color: "#10b981" },
  { label: "😄 Happy", value: "happy", color: "#f59e0b" },
  { label: "🤩 Excited", value: "excited", color: "#ef4444" },
];

const HABITS_DEFAULT = [
  { id: "habit1", label: "Meditate", checked: false },
  { id: "habit2", label: "Exercise", checked: false },
  { id: "habit3", label: "Read", checked: false },
  { id: "habit4", label: "Sleep 7+ hours", checked: false },
];

function LifeTracker({ user }) {
  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState(null);
  const [habits, setHabits] = useState(HABITS_DEFAULT);
  const [tags, setTags] = useState("");
  const [entries, setEntries] = useState([]);
  const [aiReflection, setAiReflection] = useState("");
  const [loading, setLoading] = useState(false);

  const entriesRef = user ? collection(db, "users", user.uid, "lifeTracker") : null;

  useEffect(() => {
    if (!user) return setEntries([]);
    const fetchEntries = async () => {
      try {
        const q = query(entriesRef, orderBy("timestamp", "desc"), limit(20));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEntries(data);
      } catch (err) {
        console.error("Failed to fetch life entries:", err);
      }
    };
    fetchEntries();
  }, [user]);

  const toggleHabit = (id) => {
    setHabits(habits.map(h => (h.id === id ? { ...h, checked: !h.checked } : h)));
  };

  const handleSubmit = async () => {
    if (!entry.trim()) return alert("Please write something about your day.");
    if (!mood) return alert("Please select your mood.");

    setLoading(true);
    setAiReflection("");

    const prompt = `User's daily journal entry:\n"${entry.trim()}"\nMood: ${mood}\nHabits completed: ${habits.filter(h => h.checked).map(h => h.label).join(", ") || "None"}\nTags: ${tags || "None"}\n\nPlease provide a thoughtful, supportive reflection or advice for this day.`;

    try {
      const reply = await getFutureSelfReply(prompt);
      setAiReflection(reply);

      await addDoc(entriesRef, {
        text: entry.trim(),
        mood,
        habits: habits.filter(h => h.checked).map(h => h.label),
        tags: tags.split(",").map(t => t.trim()).filter(t => t.length > 0),
        timestamp: new Date(),
        aiReflection: reply,
      });

      const q = query(entriesRef, orderBy("timestamp", "desc"), limit(20));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);

      setEntry("");
      setMood(null);
      setHabits(HABITS_DEFAULT);
      setTags("");
    } catch (err) {
      console.error("Error saving life tracker entry:", err);
      alert("Failed to save entry. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const moodStats = useMemo(() => {
    const counts = MOODS.reduce((acc, m) => ({ ...acc, [m.value]: 0 }), {});
    entries.forEach(e => {
      if (e.mood && counts[e.mood] !== undefined) counts[e.mood]++;
    });
    return MOODS.map(m => ({ name: m.label, value: counts[m.value], color: m.color }));
  }, [entries]);

  const habitStats = useMemo(() => {
    const counts = HABITS_DEFAULT.reduce((acc, h) => ({ ...acc, [h.label]: 0 }), {});
    entries.forEach(e => {
      if (e.habits?.length) {
        e.habits.forEach(habitLabel => {
          if (counts[habitLabel] !== undefined) counts[habitLabel]++;
        });
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Fuverse Life Tracker Export", 10, 15);
    let y = 25;
    entries.slice(0, 10).forEach((e, i) => {
      doc.setFontSize(14);
      doc.text(`Entry ${i + 1} - ${new Date(e.timestamp.seconds ? e.timestamp.seconds * 1000 : e.timestamp).toLocaleDateString()}`, 10, y);
      y += 7;
      doc.setFontSize(12);
      doc.text(`Mood: ${e.mood}`, 10, y);
      y += 7;
      doc.text(`Habits: ${e.habits?.join(", ") || "None"}`, 10, y);
      y += 7;
      doc.text(`Tags: ${e.tags?.join(", ") || "None"}`, 10, y);
      y += 7;
      doc.text("Journal:", 10, y);
      y += 7;
      const splitText = doc.splitTextToSize(e.text, 180);
      doc.text(splitText, 10, y);
      y += splitText.length * 7 + 5;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("life-tracker-export.pdf");
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 font-sans w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Life Tracker
        </h1>

        <div className="mb-6">
          <p className="mb-2 font-semibold">How do you feel today?</p>
          <div className="flex gap-4 flex-wrap">
            {MOODS.map(({ label, value, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMood(value)}
                className="text-3xl p-2 rounded-lg border-2 hover:border-purple-600 transition"
                aria-label={label}
                title={label}
                style={{
                  borderColor: mood === value ? color : "transparent",
                  filter: mood === value ? "none" : "grayscale(80%)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={5}
          placeholder="Write about your day, progress, thoughts..."
          className="w-full bg-gray-900 rounded-lg p-4 mb-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          disabled={loading}
        />

        <div className="mb-6">
          <p className="font-semibold mb-2">Which habits did you complete today?</p>
          <div className="flex flex-wrap gap-4">
            {habits.map(({ id, label, checked }) => (
              <label key={id} className="inline-flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleHabit(id)}
                  className="form-checkbox h-5 w-5 text-purple-600 bg-gray-800 rounded"
                  disabled={loading}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Add tags (comma separated)"
          className="w-full bg-gray-900 rounded-lg p-3 mb-6 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={loading}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:opacity-50 mb-6"
        >
          {loading ? "Saving..." : "Save Entry & Get Reflection"}
        </button>

        {aiReflection && (
          <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-purple-600">
            <h2 className="text-xl font-bold mb-2">AI Reflection:</h2>
            <p className="whitespace-pre-wrap">{aiReflection}</p>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-purple-600">
            <h3 className="text-lg font-semibold mb-4">Mood Distribution</h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={moodStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label isAnimationActive={false}>
                    {moodStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-purple-600">
            <h3 className="text-lg font-semibold mb-4">Habits Completed Frequency</h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer>
                <BarChart data={habitStats} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Recent Entries</h2>
        {entries.length === 0 && <p className="text-gray-400">No entries yet.</p>}
        <ul className="space-y-6 max-h-[500px] overflow-y-auto">
          {entries.map(({ id, text, timestamp, mood, habits, tags, aiReflection }) => (
            <li key={id} className="bg-gray-900 rounded-lg p-5 border border-purple-600">
              <div className="flex justify-between items-center mb-2">
                <time className="text-gray-400 text-sm">
                  {new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp).toLocaleString()}
                </time>
                <div className="flex gap-2">
                  {MOODS.find(m => m.value === mood)?.label || "❓"}
                </div>
              </div>
              <p className="mb-3 whitespace-pre-wrap">{text}</p>
              {habits?.length > 0 && (
                <p className="mb-3 text-sm text-green-400">
                  <strong>Habits done:</strong> {habits.join(", ")}
                </p>
              )}
              {tags?.length > 0 && (
                <p className="mb-3 text-sm text-yellow-400">
                  <strong>Tags:</strong> {tags.join(", ")}
                </p>
              )}
              {aiReflection && (
                <div className="bg-gray-800 p-3 rounded border border-purple-700 text-sm">
                  <strong>AI Reflection:</strong>
                  <p className="whitespace-pre-wrap">{aiReflection}</p>
                </div>
              )}
            </li>
          ))}
        </ul>

        <button
          onClick={exportToPDF}
          className="mt-8 w-full bg-blue-700 hover:bg-blue-800 py-3 rounded-lg font-semibold"
        >
          Export Last 10 Entries to PDF
        </button>
      </div>
    </div>
  );
}

export default LifeTracker;