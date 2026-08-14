import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiBook,
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
      bg: 'bg-emerald-600',
      bgSolid: 'bg-emerald-600',
      hover: 'hover:bg-emerald-700',
      text: 'text-emerald-700',
      textSoft: 'text-emerald-600',
      lightBg: 'bg-emerald-50',
      lightHover: 'hover:bg-emerald-50',
      border: 'border-slate-200',
      ring: 'focus:ring-emerald-500',
      glow: 'shadow-emerald-600/20'
    },
    blue: {
      bg: 'bg-blue-600',
      bgSolid: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-700',
      textSoft: 'text-blue-600',
      lightBg: 'bg-blue-50',
      lightHover: 'hover:bg-blue-50',
      border: 'border-slate-200',
      ring: 'focus:ring-blue-500',
      glow: 'shadow-blue-600/20'
    }
  }[primaryColor] || {
    bg: 'bg-emerald-600',
    bgSolid: 'bg-emerald-600',
    hover: 'hover:bg-emerald-700',
    text: 'text-emerald-700',
    textSoft: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    lightHover: 'hover:bg-emerald-50',
    border: 'border-slate-200',
    ring: 'focus:ring-emerald-500',
    glow: 'shadow-emerald-600/20'
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-40 transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative top-0 left-0 z-50
          bg-white
          border-r ${theme.border}
          transition-[width,transform] duration-300 ease-in-out
          flex flex-col h-screen
          ${sidebarOpen ? 'w-72' : 'w-[76px]'}
          ${isMobile && !sidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}
        aria-label="Sidebar navigation"
      >
        {/* Brand / header */}
        <div
          className={`
            flex items-center h-[72px] shrink-0 px-4
            border-b ${theme.border}
            ${sidebarOpen ? 'justify-between' : 'justify-center'}
          `}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logo}
                alt={`${appName} logo`}
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold text-slate-900 leading-tight truncate">
                  {appName}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
                  {appSubtitle}
                </p>
              </div>
            </div>
          ) : (
            <img
              src={logo}
              alt={`${appName} logo`}
              className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200"
            />
          )}

          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className={`
                shrink-0 p-1.5 rounded-md text-slate-400
                hover:text-slate-600 hover:bg-slate-100
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 ${theme.ring} focus-visible:ring-offset-1
              `}
              aria-label="Collapse sidebar"
            >
              <FiChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed-state toggle, shown beneath brand to avoid crowding the logo */}
        {!sidebarOpen && (
          <div className="flex justify-center pt-3 pb-1">
            <button
              onClick={toggleSidebar}
              className={`
                p-1.5 rounded-md text-slate-400
                hover:text-slate-600 hover:bg-slate-100
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 ${theme.ring} focus-visible:ring-offset-1
              `}
              aria-label="Expand sidebar"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 mt-2 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {sidebarOpen && (
            <p className="px-3 pt-3 pb-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              Menu
            </p>
          )}
          {links.map((link) => (
            <NavLink
              key={link.key}
              to={`/admin/${link.key}`}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `
                group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-[13.5px] font-medium
                transition-colors duration-150
                ${isActive
                  ? `${theme.bg} text-white shadow-sm ${theme.glow}`
                  : `text-slate-600 hover:text-slate-900 hover:bg-slate-100`
                }
                ${!sidebarOpen && 'justify-center px-0 py-3'}
                `
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 text-[17px] leading-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {link.icon}
                  </span>

                  {sidebarOpen && (
                    <span className="truncate">
                      {link.name}
                    </span>
                  )}

                  {!sidebarOpen && (
                    <span className="
                      absolute left-full ml-3 px-2.5 py-1.5
                      bg-slate-900 text-white text-xs font-medium rounded-md
                      opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0
                      transition-all duration-150
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

        {/* Footer */}
        <div className={`mt-auto p-4 border-t ${theme.border} shrink-0`}>
          {sidebarOpen ? (
            <div className={`rounded-lg ${theme.lightBg} px-3 py-3 text-center`}>
              <p className={`text-[11px] font-semibold ${theme.text} tracking-wide`}>
                {footerText}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {footerVersion}
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className={`w-2 h-2 rounded-full ${theme.bgSolid}`} title={footerVersion} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}