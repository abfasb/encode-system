import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiBook,
  FiMenu,
  FiCloud,
  FiFileText,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { Handshake } from "lucide-react";
import Logo from "../../assets/DA.png";

/**
 * Enterprise‑grade Sidebar – pure Tailwind, no custom config required.
 *
 * @param {Object} props
 * @param {Array}  props.links         - Array of link objects: { name, icon, key }
 * @param {string} props.logo          - Image source for logo
 * @param {string} props.appName       - Main app name
 * @param {string} props.appSubtitle   - Subtitle below app name
 * @param {string} props.footerText    - Footer text (e.g., department name)
 * @param {string} props.footerVersion - Version info
 * @param {string} props.primaryColor  - Only 'green' or 'blue' (others can be added)
 * @param {boolean} props.defaultOpen  - Initial open state
 * @param {function} props.onToggle    - Callback when sidebar toggles
 */
export default function Sidebar({
  links = [
    { name: "Dashboard", icon: <FiHome />, key: "dashboard" },
    { name: "Farmers' Coop and Associations", icon: <Handshake />, key: "full-farmers" },
    { name: "CSO Accreditation", icon: <FiBook />, key: "cso" },
    { name: "RCEF Accreditation", icon: <FiFileText />, key: "rcef-reports" },
    { name: "Audit Logs", icon: <FiUser />, key: "audit" },

  ],
  logo = Logo,
  appName = "Agriculture",
  appSubtitle = "Management",
  footerText = "DEPARTMENT OF AGRICULTURE",
  footerVersion = "v1.2.0",
  primaryColor = "green",
  defaultOpen = true,
  onToggle = () => {}
}) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      onToggle(!prev);
      return !prev;
    });
  };

  const theme = {
    green: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      text: 'text-green-600',
      lightBg: 'bg-green-50',
      lightHover: 'hover:bg-green-100',
      border: 'border-green-100',
      ring: 'focus:ring-green-500'
    },
    blue: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50',
      lightHover: 'hover:bg-blue-100',
      border: 'border-blue-100',
      ring: 'focus:ring-blue-500'
    }
  }[primaryColor] || {
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    text: 'text-green-600',
    lightBg: 'bg-green-50',
    lightHover: 'hover:bg-green-100',
    border: 'border-green-100',
    ring: 'focus:ring-green-500'
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative top-0 left-0 z-50
          bg-white/80 backdrop-blur-md
          border-r ${theme.border}
          shadow-lg
          transition-all duration-300 ease-in-out
          flex flex-col h-screen
          ${sidebarOpen ? 'w-72' : 'w-20'}
          ${isMobile && !sidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}
        aria-label="Sidebar navigation"
      >
        <div
          className={`
            flex items-center px-4 h-20
            border-b ${theme.border}
            ${sidebarOpen ? 'justify-between' : 'justify-center'}
          `}
        >
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt={`${appName} logo`}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div>
                <h1 className={`text-lg font-bold ${theme.text}`}>{appName}</h1>
                <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                  {appSubtitle}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className={`
              p-2 rounded-lg ${theme.lightBg} ${theme.lightHover}
              transition-colors focus:outline-none ${theme.ring} focus:ring-2 focus:ring-offset-2
            `}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <FiChevronLeft className={theme.text} size={18} />
            ) : (
              <FiChevronRight className={theme.text} size={18} />
            )}
          </button>
        </div>

        <nav className="flex-1 mt-8 px-3 space-y-1.5 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.key}
              to={`/admin/${link.key}`}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive
                  ? `${theme.bg} text-white shadow-md`
                  : `text-gray-600 ${theme.lightHover}`
                }
                ${!sidebarOpen && 'justify-center'}
                `
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-lg ${isActive ? 'text-white' : theme.text}`}>
                    {link.icon}
                  </span>

                  {sidebarOpen && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {link.name}
                    </span>
                  )}

                  {!sidebarOpen && (
                    <span className="
                      absolute left-full ml-2 px-2 py-1
                      bg-gray-800 text-white text-xs rounded
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-150
                      pointer-events-none whitespace-nowrap
                      z-[60] shadow-lg
                    ">
                      {link.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {sidebarOpen && (
          <div className={`mt-auto p-5 border-t ${theme.border} text-center`}>
            <p className={`text-xs font-semibold ${theme.text} tracking-wider`}>
              {footerText}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {footerVersion}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}