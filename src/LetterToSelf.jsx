import React, { useState, useEffect } from "react";
import { db } from "./firebase/firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { getFutureSelfReply } from "./gptRequest";
import { jsPDF } from "jspdf";

const getMoodTag = async (text) => {
  try {
    const mood = await getFutureSelfReply(`Analyze this letter and return one word that best describes the emotional mood (e.g. Hopeful, Stressed, Calm): "${text}"`);
    return mood?.split(" ")[0] || "Unknown";
  } catch {
    return "Unknown";
  }
};

const LetterToSelf = ({ user }) => {
  const [letter, setLetter] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("6 months");
  const [vault, setVault] = useState([]);
  const [loading, setLoading] = useState(false);

  const vaultRef = user?.uid && doc(db, "users", user.uid, "letter", "vault");

  useEffect(() => {
    if (vaultRef) {
      getDoc(vaultRef).then((docSnap) => {
        if (docSnap.exists()) {
          setVault(docSnap.data().letters || []);
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!letter.trim()) return alert("Write your letter first.");
    setLoading(true);

    const now = new Date();
    const unlockDate = new Date(now);
    if (deliveryTime === "1 month") unlockDate.setMonth(now.getMonth() + 1);
    if (deliveryTime === "6 months") unlockDate.setMonth(now.getMonth() + 6);
    if (deliveryTime === "1 year") unlockDate.setFullYear(now.getFullYear() + 1);
    if (deliveryTime === "5 years") unlockDate.setFullYear(now.getFullYear() + 5);

    const moodTag = await getMoodTag(letter);

    const newEntry = {
      text: letter.trim(),
      savedAt: Timestamp.fromDate(now),
      unlockAt: Timestamp.fromDate(unlockDate),
      deliveryTime,
      mood: moodTag,
      aiReflection: "",
    };

    const updatedVault = [...vault, newEntry];
    await setDoc(vaultRef, { letters: updatedVault });

    setVault(updatedVault);
    setLetter("");
    setLoading(false);
    alert("Letter locked in your vault.");
  };

  const handleUnlock = async (entry, index) => {
    if (entry.aiReflection) return;

    const reflection = await getFutureSelfReply(`
      Pretend you are my future self. I wrote this letter "${entry.text}" ${entry.deliveryTime} ago.
      Now write a reply to me as my wiser, future self — encouraging, reflective, and warm.
    `);

    const updatedVault = [...vault];
    updatedVault[index].aiReflection = reflection;
    await setDoc(vaultRef, { letters: updatedVault });
    setVault(updatedVault);
  };

  const handleExportPDF = (entry) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Letter to My Future Self", 20, 20);
    doc.setFontSize(12);
    doc.text(`Saved: ${entry.savedAt.toDate().toDateString()}`, 20, 30);
    doc.text(`Delivery Time: ${entry.deliveryTime}`, 20, 38);
    doc.text(`Mood: ${entry.mood || "Unknown"}`, 20, 46);
    doc.text("Letter:", 20, 56);
    doc.text(doc.splitTextToSize(entry.text, 170), 20, 64);
    if (entry.aiReflection) {
      doc.text("Future Self Reflection:", 20, doc.lastAutoTable?.finalY + 80 || 120);
      doc.text(doc.splitTextToSize(entry.aiReflection, 170), 20, doc.lastAutoTable?.finalY + 88 || 128);
    }
    doc.save("letter_to_self.pdf");
  };

  const total = vault.length;
  const unlocked = vault.filter(v => new Date() >= v.unlockAt.toDate()).length;
  const growth = total ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 font-sans w-full">
      <h1 className="text-3xl font-bold text-center mb-6">💌 Letter to Self</h1>

      {/* Growth Meter */}
      <div className="mb-6 text-center">
        <p className="text-lg">📈 Growth Unlocked: {growth}% ({unlocked}/{total} letters)</p>
        <div className="w-full h-3 bg-zinc-700 rounded mt-2">
          <div
            className="h-3 bg-purple-500 rounded"
            style={{ width: `${growth}%`, transition: "width 0.5s" }}
          ></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Vaulted Letters */}
        <div className="w-full md:w-1/2 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h2 className="text-xl mb-4">🗂️ Vaulted Letters</h2>
          {vault.length === 0 && <p className="text-gray-500">No letters saved yet.</p>}
          {vault.map((entry, idx) => {
            const now = new Date();
            const unlockDate = entry.unlockAt.toDate();
            const isUnlocked = now >= unlockDate;
            const percent = Math.min(100, Math.round((now - entry.savedAt.toDate()) / (unlockDate - entry.savedAt.toDate()) * 100));

            return (
              <div key={idx} className="mb-4 p-3 bg-zinc-800 rounded">
                <p className="text-sm text-gray-400 mb-1">📅 Saved: {entry.savedAt.toDate().toDateString()}</p>
                <p className="text-sm text-gray-400 mb-1">🔓 Unlocks: {unlockDate.toDateString()}</p>
                <p className="text-sm text-gray-400 mb-1">⏳ Duration: {entry.deliveryTime}</p>
                <p className="text-sm text-gray-400 mb-2">🧠 Mood: {entry.mood || "Unknown"}</p>

                {/* Timeline Bar */}
                {!isUnlocked && (
                  <div className="w-full h-2 bg-gray-600 rounded mb-2">
                    <div className="h-2 bg-green-400 rounded" style={{ width: `${percent}%` }}></div>
                  </div>
                )}

                {isUnlocked ? (
                  <>
                    <p className="text-white whitespace-pre-wrap">📝 {entry.text}</p>
                    {entry.aiReflection ? (
                      <div className="mt-3 bg-blue-950 p-3 rounded border border-blue-800 text-blue-200">
                        <strong>🔮 Reply from Future You:</strong>
                        <p>{entry.aiReflection}</p>
                        <button
                          onClick={() => handleExportPDF(entry)}
                          className="mt-3 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white"
                        >
                          📄 Export as PDF
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnlock(entry, idx)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                      >
                        Unlock & Reflect
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-yellow-500">🔐 Still locked</p>
                )}
              </div>
            );
          })}
        </div>

        {/* New Letter */}
        <div className="w-full md:w-1/2 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h2 className="text-xl mb-4">✍️ Write a New Letter</h2>
          <textarea
            rows="8"
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            className="w-full p-3 bg-zinc-800 text-white rounded resize-none"
            placeholder="Dear future me..."
          ></textarea>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <select
              className="p-2 bg-zinc-800 text-white border border-zinc-700 rounded w-full sm:w-1/2"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
            >
              <option value="1 month">1 month</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="5 years">5 years</option>
            </select>

            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full sm:w-1/2"
            >
              {loading ? "Saving..." : "Lock Letter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterToSelf;
