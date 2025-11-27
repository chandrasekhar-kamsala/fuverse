import { loginWithGoogle, db } from "./firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      const user = result.user;

      // Firestore user doc ref
      const userDocRef = doc(db, "users", user.uid);

      // Check if user doc exists
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create new user doc if doesn't exist
        await setDoc(userDocRef, {
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: new Date()
        });
      }

      navigate("/chat");
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      alert("Login failed. Try again.");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-black/40 backdrop-blur-lg border border-purple-600 p-8 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-serif font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-md">
          Login to <span className="text-cyan-400">Fu</span><span className="text-pink-400">verse</span>
        </h1>
        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-tr from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
