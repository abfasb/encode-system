import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiBook,
  FiMenu,
  FiCloud,
  FiUsers,    // Added for the new CSO nav
  FiFileText  // Added for the RCEF nav
} from "react-icons/fi";
import Logo from "../../assets/DA.png";
import { Navigate } from "react-router-dom";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const links = [
    { name: "Dashboard", icon: <FiHome />, key: "dashboard" },
    { name: "Audit Logs", icon: <FiUser />, key: "audit" },
    { name: "CSOs", icon: <FiBook />, key: "cso" },
    { name: "Upload CSOs", icon: <FiCloud />, key: "upload-cso" },
    { name: "CSO", icon: <FiUsers />, key: "cso-single" }, 
    { name: "RCEF Reports", icon: <FiFileText />, key: "rcef-reports" }, 
  ];

  return (
    <div
      className={`
        bg-white/90 backdrop-blur-md
        border-r border-green-100/80
        shadow-[4px_0_25px_-8px_rgba(0,0,0,0.04)]
        transition-all duration-300
        flex flex-col h-screen
        ${sidebarOpen ? "w-72" : "w-20"}
      `}
    >
      {/* HEADER */}
      <div
        className={`
          flex items-center px-4 h-20
          border-b border-green-100/60
          ${sidebarOpen ? "justify-between" : "justify-center"}
        `}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-3">
            <img
              src={Logo}
              alt="DA Logo"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold text-green-700">
                Agriculture
              </h1>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                Management
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition"
        >
          <FiMenu className="text-green-600" size={18} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 mt-8 px-3 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.key}
            to={`/admin/${link.key}`}
            className={({ isActive }) =>
              `
              flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200
              ${
                isActive
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-green-50"
              }
              `
            }
          >
            <span className="text-lg">{link.icon}</span>

            {sidebarOpen && (
              <span className="text-sm font-medium">
                {link.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      {sidebarOpen && (
        <div className="mt-auto p-5 border-t border-green-100/60 text-center">
          <p className="text-xs font-semibold text-green-700 tracking-wider">
            DEPARTMENT OF AGRICULTURE
          </p>
          <p className="text-[10px] text-gray-400">
            Dashboard • v1.2.0
          </p>
        </div>
      )}
    </div>
  );
}