import { FiBell, FiUser } from "react-icons/fi";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between bg-white p-4 border-b-2 border-green-100 shadow-sm">
      <h2 className="text-2xl font-bold text-green-800">Dashboard</h2>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-green-50 transition relative">
          <FiBell size={20} className="text-green-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <FiUser size={16} className="text-white" />
          </div>
          <span className="text-green-800 font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}