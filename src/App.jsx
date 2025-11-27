import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import Home from "./Home";
import Login from "./Login";
import Chat from "./Chat";
import FutureMirror from "./FutureMirror";
import MindMode from "./MindMode";
import TimeMachine from "./TimeMachine";
import LifeTracker from "./LifeTracker";
import LetterToSelf from "./LetterToSelf";
import AIPersonality from "./AIPersonality";

function App() {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe; // Cleanup subscription on unmount
  }, [auth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Pass user to components that need it */}
        <Route path="/chat" element={<Chat user={user} />} />
        <Route path="/future-mirror" element={<FutureMirror user={user} />} />
        <Route path="/mind" element={<MindMode user={user} />} />
        <Route path="/time" element={<TimeMachine user={user} />} />
        <Route path="/tracker" element={<LifeTracker user={user} />} />
        <Route path="/letter" element={<LetterToSelf user={user} />} />
        <Route path="/personality" element={<AIPersonality user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
