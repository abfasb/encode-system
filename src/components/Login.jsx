// Login.jsx
import { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "../config/firebase";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import daLogo from "../assets/DA.png";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        console.log("User data:", userDoc.data());
      }
      toast.success("Welcome admin!");
      setTimeout(function () {
        navigate("/admin/dashboard");
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage(error.message);
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 p-2">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-8 py-8 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={daLogo} 
              alt="Department of Agriculture" 
              className="h-20 w-20 object-contain bg-white rounded-full p-2 shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Department of Agriculture
          </h1>
          <p className="text-green-100 text-sm mt-1">
            Sign In
          </p>
        </div>

        <div className="px-8 py-8">
       

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@da.gov.ph"
                className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>

            {message && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Sign In
            </button>

            
        
          </form>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            For technical support, contact IT Help Desk
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            © {new Date().getFullYear()} Department of Agriculture. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}