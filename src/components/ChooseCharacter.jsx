import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import SHA256 from "crypto-js/sha256";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ArrowRight,
  Plus,
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

const avatarThemes = [
  { gradient: "from-emerald-500 to-teal-400", icon: "🌱" },
  { gradient: "from-sky-500 to-cyan-400", icon: "💧" },
  { gradient: "from-violet-500 to-fuchsia-400", icon: "🌾" },
  { gradient: "from-amber-500 to-yellow-400", icon: "☀️" },
  { gradient: "from-rose-500 to-orange-400", icon: "🌶️" },
  { gradient: "from-lime-500 to-emerald-400", icon: "🍃" },
  { gradient: "from-cyan-500 to-blue-400", icon: "🐟" },
  { gradient: "from-teal-500 to-green-400", icon: "🌿" },
  { gradient: "from-pink-500 to-rose-400", icon: "🌸" },
  { gradient: "from-indigo-500 to-sky-400", icon: "🌏" },
];

const roleIcons = {
  Reviewer: "",
  Evaluator: "",
  Admin: "",
  Viewer: "",
  Processor: "",
  Coordinator: "",
  Manager: "",
  Director: "",
  default: "",
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
  const [error, setError] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ── Firestore (unchanged) ─────────────────────────────── */
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
        if (localChars) setCharacters(JSON.parse(localChars));
        setLoading(false);
        setError("Unable to sync with server. Using cached data.");
      }
    );
    return () => unsub();
  }, []);

  /* ── Escape closes modal / form ────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showPasswordModal) setShowPasswordModal(false);
        else if (adding) {
          setAdding(false);
          setNewName("");
          setNewRole("Viewer");
          setNewPassword("");
          setConfirmPassword("");
          setAdminPassword("");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPasswordModal, adding]);

  /* ── Handlers (unchanged) ──────────────────────────────── */
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
      localStorage.setItem(
        "activeCharacter",
        JSON.stringify(selectedCharacter)
      );
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
    if (
      characters.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
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
    if (
      e.key === "Enter" &&
      newName &&
      newRole &&
      newPassword &&
      newPassword === confirmPassword &&
      !adding
    ) {
      addCharacter();
    }
  };

  const resetForm = () => {
    setAdding(false);
    setNewName("");
    setNewRole("Viewer");
    setNewPassword("");
    setConfirmPassword("");
    setAdminPassword("");
  };

  const fieldBase =
    "h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-[12px] text-zinc-100 placeholder-zinc-600 transition-colors duration-100 hover:border-zinc-700 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/40";

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-200 antialiased selection:bg-emerald-500/30 selection:text-emerald-100">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {/* ── Static ambience ────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-[480px]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.10), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(ellipse at 50% 30%, black, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 30%, black, transparent 75%)",
          }}
        />
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>DA Encoding · Identity</span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-zinc-50 md:text-5xl">
              Choose your account
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-zinc-400">
              Select your identity to continue to the Department of Agriculture
              dashboard.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-[11px] text-zinc-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>mimaropa.ids@gmail.com</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mx-auto mb-8 flex max-w-xl items-start gap-2 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-red-400"
            >
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex h-64 items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              <Loader2
                className="h-4 w-4 animate-spin text-emerald-500"
                strokeWidth={2}
              />
              Loading identities…
            </div>
          ) : (
            <>
              {/* ── Grid ────────────────────────────────────── */}
              <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {characters.map((char) => {
                  const theme = getAvatarTheme(char.name);
                  const isSelected = selectedCharId === char.id;
                  return (
                    <button
                      type="button"
                      key={char.id}
                      onClick={() => handleCharacterClick(char)}
                      aria-label={`Sign in as ${char.name}`}
                      className={`group relative flex min-h-[260px] flex-col items-center justify-between overflow-hidden rounded-xl border bg-zinc-900/40 p-6 text-center transition-all duration-200 focus-visible:outline-none focus-visible:border-emerald-600 ${
                        isSelected
                          ? "border-emerald-600/70 bg-zinc-900/60"
                          : "border-zinc-800 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/70"
                      }`}
                    >
                      {/* corner id */}
                      <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-700">
                        {char.id.slice(-6)}
                      </span>

                      {/* Avatar + identity */}
                      <div className="mt-2 flex flex-col items-center gap-4">
                        <div
                          className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${theme.gradient} p-[2px] transition-transform duration-200 ${
                            isSelected
                              ? "shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                              : "group-hover:scale-[1.03]"
                          }`}
                        >
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
                            <span className="text-3xl drop-shadow-sm">
                              {theme.icon}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <h3 className="max-w-[180px] truncate text-[15px] font-semibold tracking-tight text-zinc-50">
                            {char.name}
                          </h3>
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                            <span className="mr-1">
                              {getRoleIcon(char.role)}
                            </span>
                            {char.role}
                          </p>
                        </div>
                      </div>

                      {/* footer action */}
                      <div className="mt-4 flex w-full items-center justify-center gap-1 border-t border-zinc-800/80 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600 transition-colors duration-150 group-hover:text-emerald-400">
                        <span>Select</span>
                        <ArrowRight
                          className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5"
                          strokeWidth={2}
                        />
                      </div>
                    </button>
                  );
                })}

                {/* ── Add card / inline form ───────────────── */}
                <div
                  className={`relative rounded-xl border bg-zinc-900/40 p-5 transition-colors duration-150 ${
                    adding
                      ? "border-zinc-700 bg-zinc-900/60 sm:col-span-2 lg:col-span-2 xl:col-span-2"
                      : "border-dashed border-zinc-800 hover:border-emerald-700/60 hover:bg-zinc-900/60 min-h-[260px] flex flex-col items-center justify-center text-center"
                  }`}
                >
                  {!adding ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 transition-colors duration-200 group-hover:border-emerald-700/60">
                        <Plus
                          className="h-6 w-6 text-zinc-600"
                          strokeWidth={1.75}
                        />
                      </div>
                      <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-zinc-100">
                        New account
                      </h3>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                        Create a new identity
                      </p>
                      <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-500 px-4 text-[12px] font-medium text-zinc-950 transition-colors duration-100 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-px"
                      >
                        Create
                        <ArrowRight
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                        />
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                          <Plus
                            className="h-3 w-3 text-emerald-500"
                            strokeWidth={2}
                          />
                          <span>New identity · SEC-02</span>
                        </div>
                        <button
                          type="button"
                          onClick={resetForm}
                          aria-label="Cancel"
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors duration-100 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="newName"
                            className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500"
                          >
                            <span>Name</span>
                            <span className="text-zinc-700">01</span>
                          </label>
                          <input
                            id="newName"
                            type="text"
                            placeholder="Enter name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={fieldBase}
                            autoFocus
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="newRole"
                            className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500"
                          >
                            <span>Role</span>
                            <span className="text-zinc-700">02</span>
                          </label>
                          <select
                            id="newRole"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={`${fieldBase} cursor-pointer appearance-none`}
                          >
                            <option value="Viewer">Viewer</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="newPassword"
                            className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500"
                          >
                            <span>Password</span>
                            <span className="text-zinc-700">03</span>
                          </label>
                          <input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={fieldBase}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="confirmPassword"
                            className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500"
                          >
                            <span>Confirm</span>
                            <span className="text-zinc-700">04</span>
                          </label>
                          <input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={fieldBase}
                          />
                        </div>

                        {newRole === "Admin" && (
                          <div className="space-y-1.5 md:col-span-2">
                            <label
                              htmlFor="adminPassword"
                              className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-500"
                            >
                              <span>Admin verification</span>
                              <span className="text-emerald-600/60">
                                Required for Admin
                              </span>
                            </label>
                            <input
                              id="adminPassword"
                              type="password"
                              placeholder="Enter admin verification"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className={`${fieldBase} border-emerald-900/60 focus:border-emerald-600`}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          Hashed before storage
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="inline-flex h-8 items-center rounded-md border border-zinc-800 bg-zinc-900 px-3 text-[12px] font-medium text-zinc-300 transition-colors duration-100 hover:border-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 active:translate-y-px"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={addCharacter}
                            disabled={adding}
                            className="group inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-500 px-3 text-[12px] font-medium text-zinc-950 transition-colors duration-100 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-px disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                          >
                            Create account
                            <ArrowRight
                              className="h-3 w-3 transition-transform duration-100 group-hover:translate-x-0.5"
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {characters.length === 0 && !adding && (
                <div className="py-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                  No accounts yet — create your first one
                </div>
              )}
            </>
          )}

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            Each person should have their own identity · Sessions are logged
          </p>
        </div>
      </div>

      {/* ── Password modal ───────────────────────────────────── */}
      {showPasswordModal && selectedCharacter && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false);
          }}
        >
          <div className="relative w-full max-w-[420px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">
            {/* Header rail */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                <Lock
                  className="h-3 w-3 text-emerald-500"
                  strokeWidth={2}
                />
                <span>Authenticate identity</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                aria-label="Close"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors duration-100 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>

            <div className="p-6">
              {/* Identity block */}
              <div className="mb-6 flex flex-col items-center">
                <div
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarTheme(selectedCharacter.name).gradient} p-[2px] shadow-[0_0_0_3px_rgba(16,185,129,0.10)]`}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900">
                    <span className="text-3xl drop-shadow-sm">
                      {getAvatarTheme(selectedCharacter.name).icon}
                    </span>
                  </div>
                </div>
                <h2
                  id="auth-title"
                  className="mt-4 text-[18px] font-semibold tracking-tight text-zinc-50"
                >
                  {selectedCharacter.name}
                </h2>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  <span>{getRoleIcon(selectedCharacter.role)}</span>
                  <span>{selectedCharacter.role}</span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyPassword();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="identity-password"
                    className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500"
                  >
                    <span>Password</span>
                    <span className="text-zinc-700">01</span>
                  </label>
                  <div className="relative">
                    <input
                      id="identity-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className={`${fieldBase} h-10 pr-10`}
                      autoFocus
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 transition-colors duration-100 hover:text-zinc-200 focus-visible:outline-none focus-visible:text-emerald-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-red-900/60 bg-red-950/30 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-red-400"
                  >
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="inline-flex h-9 items-center rounded-md border border-zinc-800 bg-zinc-950 px-3.5 text-[12px] font-medium text-zinc-300 transition-colors duration-100 hover:border-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 active:translate-y-px"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="group inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-500 px-3.5 text-[12px] font-medium text-zinc-950 transition-colors duration-100 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 active:translate-y-px"
                  >
                    Unlock account
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-100 group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </form>

              <p className="mt-5 border-t border-zinc-800 pt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                Password hashed client-side · never stored in plain text
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        body {
          font-family: 'Inter', system-ui, sans-serif;
          font-feature-settings: 'cv11', 'ss01';
        }

        h1, h2, h3 {
          font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
          font-feature-settings: 'ss01';
        }

        .font-mono, [class*='font-mono'] {
          font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-spin {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}