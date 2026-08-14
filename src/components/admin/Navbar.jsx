import { FiBell, FiUser, FiChevronDown } from "react-icons/fi";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between bg-white/90 backdrop-blur-sm px-6 h-[72px] border-b border-slate-200 sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 leading-tight">
          Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Overview of your workspace
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="
            relative p-2.5 rounded-lg text-slate-500
            hover:text-slate-700 hover:bg-slate-100
            transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1
          "
          aria-label="Notifications"
        >
          <FiBell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          className="
            flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-lg
            hover:bg-slate-100 transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1
          "
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <FiUser size={14} className="text-white" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[13px] font-medium text-slate-900 leading-tight">Admin</p>
            <p className="text-[11px] text-slate-400 leading-tight">Administrator</p>
          </div>
          <FiChevronDown size={14} className="text-slate-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}