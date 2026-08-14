import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, arrayUnion, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import SHA256 from "crypto-js/sha256";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  Admin: "",
  Viewer: "",
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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    setShowPassword(false);
  };

  const verifyPassword = () => {
    if (!selectedCharacter) return;
    if (!selectedCharacter.passwordHash) {
      setPasswordError("This account has no password set. Contact admin.");
      return;
    }
    const hashedInput = SHA256(passwordInput).toString();
    if (hashedInput === selectedCharacter.passwordHash) {
      localStorage.setItem("activeCharacter", JSON.stringify(selectedCharacter));
      setSelectedCharId(selectedCharacter.id);
      setShowPasswordModal(false);
      toast.success(`Welcome, ${selectedCharacter.name}!`);
      setTimeout(() => navigate("/admin/dashboard"), 300);
    } else {
      setPasswordError("Incorrect password. Try again.");
      setPasswordInput("");
    }
  };

  const addCharacter = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error("Please enter a name");
      return;
    }
    if (!newRole) {
      toast.error("Please select a role");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newRole === "Admin" && adminPassword !== "DAMIMAROPA@IDU") {
      toast.error("Incorrect admin verification password!");
      return;
    }
    if (characters.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Character with this name already exists!");
      return;
    }

    setAdding(true);
    setError("");

    const passwordHash = SHA256(newPassword).toString();
    const newCharacter = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      role: newRole,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    const userDocRef = doc(db, "users", "mimaropa.ids");
    try {
      await updateDoc(userDocRef, {
        characters: arrayUnion(newCharacter),
      });
      toast.success("Account created successfully!");
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
        toast.success("Account created successfully!");
      } catch (innerError) {
        console.error("Failed to create document:", innerError);
        toast.error("Failed to add character. Please try again.");
        setAdding(false);
        return;
      }
    }

    setNewName("");
    setNewRole("Viewer");
    setNewPassword("");
    setConfirmPassword("");
    setAdminPassword("");
    setAdding(false);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 relative overflow-hidden font-sans antialiased">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {/* Animated background – simplified, no syntax errors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.15),_transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.1),_transparent_50%)]"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-white to-green-300">
                Choose Your Account
              </span>
            </h1>
            <p className="text-emerald-100/70 text-lg md:text-xl max-w-2xl mx-auto">
              Select your identity to continue to the Department of Agriculture dashboard
            </p>
            <div className="mt-6 inline-flex items-center px-5 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-emerald-100/80 text-sm">
              <svg className="w-4 h-4 mr-2 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              mimaropa.ids@gmail.com
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-200 text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Character Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
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
                      className={`group relative bg-white/5 backdrop-blur-md border ${
                        isSelected
                          ? "border-emerald-400 shadow-2xl shadow-emerald-500/20"
                          : "border-white/10 hover:border-emerald-400/40"
                      } rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.03] hover:shadow-2xl hover:shadow-emerald-500/10 ${
                        isHovered ? "-translate-y-1" : ""
                      }`}
                      role="button"
                      aria-label={`Select ${char.name}`}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-500 pointer-events-none"></div>

                      <div className="relative mb-5">
                        <div
                          className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${theme.gradient} p-1 shadow-xl transform group-hover:rotate-3 group-hover:scale-105 transition-all duration-300`}
                        >
                          <div className="w-full h-full rounded-full bg-slate-900/70 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                            <span className="text-4xl filter drop-shadow-lg">
                              {theme.icon}
                            </span>
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-emerald-300 text-xs px-3 py-1 rounded-full shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                          {getRoleIcon(char.role)} {char.role}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white text-center mb-1 truncate">
                        {char.name}
                      </h3>
                      <p className="text-sm text-emerald-200/70 text-center">
                        {char.role}
                      </p>

                      {isSelected && (
                        <div className="absolute top-3 right-3 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                      )}
                    </div>
                  );
                })}

                {/* Add New Character Card */}
                <div className="relative bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[280px] group hover:border-emerald-400/50 hover:bg-white/10 transition-all duration-300">
                  {!adding ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                        <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">New Account</h3>
                      <p className="text-sm text-emerald-200/70 text-center mb-5">Create a new identity</p>
                      <button
                        onClick={() => setAdding(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                      >
                        Create
                      </button>
                    </>
                  ) : (
                    <div className="w-full space-y-4">
                      <h3 className="text-lg font-semibold text-white text-center mb-2">Create Account</h3>

                      <div>
                        <label htmlFor="newName" className="block text-sm font-medium text-emerald-200/80 mb-1">
                          Name
                        </label>
                        <input
                          id="newName"
                          type="text"
                          placeholder="Enter name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-slate-800/50 text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/10 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label htmlFor="newRole" className="block text-sm font-medium text-emerald-200/80 mb-1">
                          Role
                        </label>
                        <select
                          id="newRole"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-slate-800/50 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition appearance-none cursor-pointer"
                        >
                          <option value="Viewer" className="bg-slate-800">Viewer</option>
                          <option value="Admin" className="bg-slate-800">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-emerald-200/80 mb-1">
                          Password
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          placeholder="Enter password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-slate-800/50 text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/10 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                        />
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-emerald-200/80 mb-1">
                          Confirm Password
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-slate-800/50 text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/10 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                        />
                      </div>

                      {newRole === "Admin" && (
                        <div>
                          <label htmlFor="adminPassword" className="block text-sm font-medium text-emerald-200/80 mb-1">
                            Admin Verification
                          </label>
                          <input
                            id="adminPassword"
                            type="password"
                            placeholder="Enter admin verification"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-800/50 text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/10 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                          />
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={addCharacter}
                          className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                        >
                          Create Account
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
                          className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-white/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {characters.length === 0 && !adding && (
                <div className="text-center text-emerald-200/60 animate-pulse">
                  No accounts yet. Create your first one!
                </div>
              )}
            </>
          )}

          <div className="text-center mt-12 text-emerald-200/40 text-sm">
            <p>Each person should have their own identity. Select yours to proceed.</p>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transform animate-slide-up">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-500/20 rounded-full filter blur-3xl"></div>

            <div className="relative p-8">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-5">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarTheme(selectedCharacter.name).gradient} p-1 shadow-xl`}>
                    <div className="w-full h-full rounded-full bg-slate-900/70 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                      <span className="text-4xl filter drop-shadow-lg">
                        {getAvatarTheme(selectedCharacter.name).icon}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-emerald-300 text-xs px-3 py-1 rounded-full shadow-lg border border-white/10 whitespace-nowrap">
                    {getRoleIcon(selectedCharacter.role)} {selectedCharacter.role}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedCharacter.name}</h2>
                <p className="text-emerald-200/70 text-sm">Enter your password to continue</p>
              </div>

              <div className="space-y-5">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
                    className="w-full bg-slate-800/50 text-white placeholder-white/40 rounded-xl px-4 py-3 pl-10 pr-12 border border-white/10 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                    autoFocus
                  />
                  <svg className="absolute left-3 top-3.5 w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/50 hover:text-white transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-red-400 text-sm text-center animate-shake">{passwordError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={verifyPassword}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    Unlock Account
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-white/40 mt-8">
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
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
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