import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, arrayUnion, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import SHA256 from "crypto-js/sha256"; // Install: npm install crypto-js

const avatarThemes = [
  { gradient: "from-green-500 to-emerald-400", icon: "🎮" },
  { gradient: "from-blue-500 to-cyan-400", icon: "🎯" },
  { gradient: "from-purple-500 to-pink-400", icon: "⚔️" },
  { gradient: "from-yellow-500 to-amber-400", icon: "🏆" },
  { gradient: "from-red-500 to-rose-400", icon: "🔥" },
  { gradient: "from-indigo-500 to-blue-400", icon: "🧙" },
  { gradient: "from-orange-500 to-red-400", icon: "🚀" },
  { gradient: "from-teal-500 to-green-400", icon: "🛡️" },
  { gradient: "from-pink-500 to-purple-400", icon: "✨" },
  { gradient: "from-cyan-500 to-blue-400", icon: "⚡" },
];

const roleIcons = {
  Reviewer: "🕵️",
  Evaluator: "⚖️",
  Admin: "👑",
  Viewer: "👀",
  Processor: "⚙️",
  Coordinator: "📋",
  Manager: "📊",
  Director: "🎯",
  default: "🧑‍💼",
};

export default function ChooseCharacter() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Viewer");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [hoveredCharId, setHoveredCharId] = useState(null);
  const [error, setError] = useState("");

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Ensure user document exists
  useEffect(() => {
    const ensureUserDoc = async () => {
      const userDocRef = doc(db, "users", "mimaropa.ids");
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        try {
          await setDoc(userDocRef, {
            email: "mimaropa.ids@gmail.com",
            name: "Department of Agriculture",
            characters: [],
            createdAt: serverTimestamp(),
          });
          console.log("User document created");
        } catch (err) {
          console.error("Error creating user document:", err);
          setError("Failed to initialize user data.");
        }
      }
    };
    ensureUserDoc();
  }, []);

  useEffect(() => {
    const userDocRef = doc(db, "users", "mimaropa.ids");
    const unsub = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const chars = docSnap.data().characters || [];
          setCharacters(chars);
          localStorage.setItem("characters", JSON.stringify(chars));
        } else {
          setCharacters([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching characters:", error);
        const localChars = localStorage.getItem("characters");
        if (localChars) {
          setCharacters(JSON.parse(localChars));
        }
        setLoading(false);
        setError("Unable to sync with server. Using cached data.");
      }
    );

    return () => unsub();
  }, []);

  const handleCharacterClick = (char) => {
    setSelectedCharacter(char);
    setShowPasswordModal(true);
    setPasswordInput("");
    setPasswordError("");
  };

  const verifyPassword = () => {
    if (!selectedCharacter) return;

    if (!selectedCharacter.passwordHash) {
      setPasswordError("This account has no password set. Please contact admin.");
      return;
    }

    const hashedInput = SHA256(passwordInput).toString();
    if (hashedInput === selectedCharacter.passwordHash) {
      localStorage.setItem("activeCharacter", JSON.stringify(selectedCharacter));
      setSelectedCharId(selectedCharacter.id);
      setShowPasswordModal(false);
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 300);
    } else {
      setPasswordError("Incorrect password. Try again.");
    }
  };

  const addCharacter = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("Please enter a name");
      return;
    }
    if (!newRole) {
      alert("Please select a role");
      return;
    }
    if (!newPassword) {
      alert("Please enter a password");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (newRole === "Admin" && adminPassword !== "DAMIMAROPA@IDU") {
      alert("Incorrect admin password!");
      return;
    }

    if (characters.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("Character with this name already exists!");
      return;
    }

    setAdding(true);
    setError("");

    // Hash the password
    const passwordHash = SHA256(newPassword).toString();

    const newCharacter = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      role: newRole,
      passwordHash,
      createdAt: new Date().toISOString(),
      // No photoURL field
    };

    const userDocRef = doc(db, "users", "mimaropa.ids");

    try {
      await updateDoc(userDocRef, {
        characters: arrayUnion(newCharacter),
      });
      console.log("Character added via updateDoc");
    } catch (error) {
      console.error("Update failed, attempting to create document:", error);
      try {
        await setDoc(
          userDocRef,
          {
            email: "mimaropa.ids@gmail.com",
            name: "Department of Agriculture",
            characters: [newCharacter],
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log("Character added via setDoc");
      } catch (innerError) {
        console.error("Failed to create document:", innerError);
        setError("Failed to add character. Please try again.");
        setAdding(false);
        return;
      }
    }

    // Reset form
    setNewName("");
    setNewRole("Viewer");
    setNewPassword("");
    setConfirmPassword("");
    setAdminPassword("");
    setAdding(false);
  };

  // Helper functions for avatar theme and role icon (unchanged)
  const getAvatarTheme = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarThemes.length;
    return avatarThemes[index];
  };

  const getRoleIcon = (role) => {
    const lowerRole = role.toLowerCase();
    for (const key in roleIcons) {
      if (lowerRole.includes(key.toLowerCase())) {
        return roleIcons[key];
      }
    }
    return roleIcons.default;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newName && newRole && newPassword && newPassword === confirmPassword && !adding) {
      addCharacter();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 relative overflow-hidden">
      {/* Animated background (same as before) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2322c55e\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-green-500/5 to-transparent animate-pulse"></div>
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-lg animate-slide-down">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-white to-emerald-300">
                CHOOSE YOUR DA ACCOUNT
              </span>
            </h1>
            <p className="text-green-200 text-lg md:text-xl max-w-2xl mx-auto opacity-90 animate-fade-in">
              Select your identity to continue your quest in the Department of Agriculture
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-green-100 text-sm">
              <span className="mr-2">📧</span> mimaropa.ids@gmail.com
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-white text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Character Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
                {characters.map((char) => {
                  const theme = getAvatarTheme(char.name);
                  const isSelected = selectedCharId === char.id;
                  const isHovered = hoveredCharId === char.id;

                  return (
                    <div
                      key={char.id}
                      onClick={() => handleCharacterClick(char)}
                      onMouseEnter={() => setHoveredCharId(char.id)}
                      onMouseLeave={() => setHoveredCharId(null)}
                      className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border ${
                        isSelected
                          ? "border-green-400 shadow-lg shadow-green-500/30"
                          : "border-white/20 hover:border-green-400/50"
                      } rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 ${
                        isHovered ? "translate-y-[-4px]" : ""
                      }`}
                    >
                      {/* Animated glow on hover */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/0 to-green-600/0 group-hover:from-green-400/20 group-hover:to-green-600/20 transition-all duration-500 pointer-events-none"></div>

                      {/* Avatar */}
                      <div className="relative mb-4">
                        <div
                          className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${theme.gradient} p-1 shadow-xl transform group-hover:rotate-6 transition-transform duration-300`}
                        >
                          <div className="w-full h-full rounded-full bg-gray-900/60 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                            <span className="text-4xl filter drop-shadow-lg">
                              {theme.icon}
                            </span>
                          </div>
                        </div>
                        {/* Role badge */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                          {char.role}
                        </div>
                      </div>

                      {/* Character info */}
                      <h3 className="text-xl font-bold text-white text-center mb-1 truncate">
                        {char.name}
                      </h3>
                      <p className="text-sm text-green-200 text-center opacity-80">
                        {char.role}
                      </p>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                      )}
                    </div>
                  );
                })}

                {/* Add New Character Card */}
                <div className="relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[280px] group hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
                  {!adding ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg
                          className="w-10 h-10 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        New Account
                      </h3>
                      <p className="text-sm text-green-200 text-center opacity-80 mb-4">
                        Create a new identity
                      </p>
                      <button
                        onClick={() => setAdding(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-lg"
                      >
                        Create
                      </button>
                    </>
                  ) : (
                    <div className="w-full space-y-4">
                      <h3 className="text-lg font-semibold text-white text-center">
                        Create Character
                      </h3>

                      {/* Name */}
                      <input
                        type="text"
                        placeholder="Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/20 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                        autoFocus
                      />

                      {/* Role dropdown */}
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition appearance-none cursor-pointer"
                      >
                        <option value="Viewer" className="bg-gray-800">Viewer</option>
                        <option value="Admin" className="bg-gray-800">Admin</option>
                        {/* Add other roles as needed */}
                      </select>

                      {/* Password */}
                      <input
                        type="password"
                        placeholder="Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/20 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                      />

                      {/* Confirm Password */}
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/20 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                      />

                      {newRole === "Admin" && (
                        <input
                          type="password"
                          placeholder="Admin VERIFICATION"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/20 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                        />
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={addCharacter}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAdding(false);
                            setNewName("");
                            setNewRole("Viewer");
                            setNewPassword("");
                            setConfirmPassword("");
                            setAdminPassword("");
                          }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hint message */}
              {characters.length === 0 && !adding && (
                <div className="text-center text-green-200 animate-pulse">
                  No characters yet. Create your first Account!
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="text-center mt-12 text-green-300/60 text-sm">
            <p>Select your DA Account to continue. Each person should have their own identity.</p>
          </div>
        </div>
      </div>

      {showPasswordModal && selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl transform animate-slide-up">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

            <div className="relative p-8">
              {/* Close button */}
              <button
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Avatar preview */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarTheme(selectedCharacter.name).gradient} p-1 shadow-xl`}
                  >
                    <div className="w-full h-full rounded-full bg-gray-900/60 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                      <span className="text-4xl filter drop-shadow-lg">
                        {getAvatarTheme(selectedCharacter.name).icon}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                    {selectedCharacter.role}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedCharacter.name}</h2>
                <p className="text-green-200 text-sm opacity-80">Enter your password to continue</p>
              </div>

              {/* Password input */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-3 pl-10 border border-white/20 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                    autoFocus
                  />
                  <svg
                    className="absolute left-3 top-3.5 w-5 h-5 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>

                {passwordError && (
                  <p className="text-red-400 text-sm text-center animate-shake">{passwordError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={verifyPassword}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    Unlock Account
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Hint */}
              <p className="text-center text-xs text-white/40 mt-6">
                Your password is securely hashed and never stored in plain text.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.6s ease-out; }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}