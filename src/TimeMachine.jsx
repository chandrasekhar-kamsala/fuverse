import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";
import { getFutureSelfReply } from "./gptRequest";
import ReactMarkdown from "react-markdown";

function TimeMachine({ user }) {
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!question.trim() || !optionA.trim() || !optionB.trim()) {
      alert("Please fill all fields.");
      return;
    }
    if (!user || !user.uid) {
      alert("Please log in first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse("");

    const prompt = `
I am facing a challenge: "${question.trim()}".
I have two options:
Option A: ${optionA.trim()}
Option B: ${optionB.trim()}

Please give detailed outcomes for each option over 1 year, 5 years, and 10 years in the following format:

Option A:
1 Year: ...
5 Years: ...
10 Years: ...

Option B:
1 Year: ...
5 Years: ...
10 Years: ...
`;

    try {
      const reply = await getFutureSelfReply(prompt);
      if (!reply || typeof reply !== "string") {
        throw new Error("AI returned empty or invalid reply");
      }
      setResponse(reply);

      const docRef = doc(db, "users", user.uid, "time", "timeline-explorer");
      await setDoc(docRef, {
        date: new Date().toISOString(),
        question,
        optionA,
        optionB,
        reply,
      });
    } catch (err) {
      console.error("Error in handleAnalyze:", err);
      setError("Failed to get AI response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const extractTimeline = (text, option) => {
    try {
      const regex = new RegExp(`Option ${option}:([\\s\\S]*?)(?=Option ${option === "A" ? "B" : "A"}:|$)`, "i");

      const match = text.match(regex);
      const chunk = match ? match[1] : "";

      const parseYear = (label) => {
        const yearRegex = new RegExp(`${label}:([\\s\\S]*?)(?=\\d+ Year:|$)`, "i");
        const yearMatch = chunk.match(yearRegex);
        return yearMatch ? yearMatch[1].trim() : "Not provided.";
      };

      return {
        "1Y": parseYear("1 Year"),
        "5Y": parseYear("5 Years"),
        "10Y": parseYear("10 Years"),
      };
    } catch (err) {
      console.error("Error parsing timeline:", err);
      return { "1Y": "No data", "5Y": "No data", "10Y": "No data" };
    }
  };

  const renderTimelineBox = (label, text, color) => (
    <div className={`p-3 border-l-4 ${color} rounded bg-gray-900`}>
      <h4 className="text-sm font-bold mb-1">{label}</h4>
      <div className="text-sm text-gray-300 whitespace-pre-wrap">
        <ReactMarkdown>{text || "Not available"}</ReactMarkdown>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 font-sans flex flex-col items-center select-none">
      <h1 className="text-5xl font-extrabold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
        Timeline Consequence Explorer
      </h1>
      <p className="text-center text-gray-300 font-light mb-10 max-w-2xl">
        Describe your challenge and two possible decisions. AI will simulate outcomes from your 1, 5, and 10 year future selves.
      </p>

      <div className="w-full max-w-4xl bg-gray-900 border border-purple-600 rounded-2xl p-6 shadow-lg space-y-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What challenge are you facing?"
          rows={3}
          className="w-full bg-black bg-opacity-60 border border-purple-500 rounded-lg px-4 py-2 text-sm text-purple-200 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
        />
        <textarea
          value={optionA}
          onChange={(e) => setOptionA(e.target.value)}
          placeholder="Describe Option A"
          rows={2}
          className="w-full bg-black bg-opacity-60 border border-blue-500 rounded-lg px-4 py-2 text-sm text-blue-200 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        />
        <textarea
          value={optionB}
          onChange={(e) => setOptionB(e.target.value)}
          placeholder="Describe Option B"
          rows={2}
          className="w-full bg-black bg-opacity-60 border border-pink-500 rounded-lg px-4 py-2 text-sm text-pink-200 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-600 resize-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 transition rounded-lg py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Explore Future Timelines"}
        </button>
      </div>

      {error && (
        <p className="text-red-500 mt-4 font-semibold">
          {error}
        </p>
      )}

      {response && response.includes("Option") ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full max-w-6xl">
          {["A", "B"].map((opt) => {
            const timeline = extractTimeline(response, opt);
            const borderColor = opt === "A" ? "border-blue-400" : "border-pink-400";
            const bgLabel = opt === "A" ? "text-blue-300" : "text-pink-300";
            return (
              <div
                key={opt}
                className={`bg-gray-800 border ${borderColor} rounded-xl p-5 shadow-md flex flex-col gap-4`}
              >
                <h3 className={`text-xl font-bold mb-2 ${bgLabel}`}>
                  Option {opt}: Future Outcomes
                </h3>
                {renderTimelineBox("1Y", timeline["1Y"], "border-indigo-400")}
                {renderTimelineBox("5Y", timeline["5Y"], "border-purple-500")}
                {renderTimelineBox("10Y", timeline["10Y"], "border-pink-500")}
              </div>
            );
          })}
        </div>
      ) : response ? (
        <p className="text-red-400 font-medium mt-6">
          AI couldn't format the response correctly. Please try again.
        </p>
      ) : null}
    </div>
  );
}

export default TimeMachine;
