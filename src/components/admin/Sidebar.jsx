import { useState } from "react"; 
import { Link } from "react-router-dom"; 
import { FiHome, FiUser, FiSettings, FiLogOut, FiMenu, FiBook } from "react-icons/fi"; 
import Logo from '../../assets/DA.png' 

export default function Sidebar({ sidebarOpen, setSidebarOpen, activePage, setActivePage }) { 
    const links = [ 
      { name: "Dashboard", icon: <FiHome />, key: "dashboard" }, 
      { name: "Audit", icon: <FiUser />, key: "audit" },
      { name: "CSOs", icon: <FiBook />, key: "rces" }, 
    ]; 
   
    return ( 
      <div 
        className={`bg-white border-r-2 border-green-100 transition-all duration-300 ${ 
          sidebarOpen ? "w-64" : "w-16" 
        } flex flex-col shadow-sm`} 
      > 
        <div className="flex items-center justify-between p-4 border-b-2 border-green-600 "> 
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src={Logo} alt="DA Logo"  className="w-8 h-8 rounded-full flex items-center justify-center">
              </img>
              <h1 className="text-lg font-bold text-green-500">Agriculture</h1>
            </div>
          )} 
          <button 
            className="p-2 rounded-lg hover:bg-green-500 transition text-white" 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
          > 
            <FiMenu className=" text-green-500 hover:text-white" size={20} /> 
          </button> 
        </div> 
   
        {/* Navigation Links */} 
        <nav className="flex-1 mt-6 px-2"> 
          {links.map((link) => ( 
            <button 
              key={link.key} 
              onClick={() => setActivePage(link.key)} 
              className={`flex items-center gap-4 px-4 py-3 rounded-lg mx-1 my-2 w-full text-left 
                transition-all duration-200
                ${activePage === link.key 
                  ? "bg-green-600 text-white font-semibold shadow-md transform scale-105" 
                  : "text-green-800 hover:bg-green-50 hover:text-green-700 hover:shadow-sm"
                }`} 
            > 
              <span className={`text-xl text-center ${activePage === link.key ? "text-white" : "text-green-600"}`}>
                {link.icon}
              </span>
              {sidebarOpen && <span className="text-sm">{link.name}</span>} 
            </button> 
          ))} 
        </nav>

        {/* Footer branding */}
        {sidebarOpen && (
          <div className="p-4 border-t border-green-100">
            <p className="text-xs text-green-600 text-center font-medium">
              Department of Agriculture
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Dashboard v1.0
            </p>
          </div>
        )}
      </div> 
    ); 
}