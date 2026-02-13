import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Dashboard from "./Dashboard";
import AuditLogs from "./AuditLogs";
import CSO from "./CSO";
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("dashboard"); 

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "audit":
        return <AuditLogs />;
      case "rces":
        return <CSO />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen text-white">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage={activePage}
        setActivePage={setActivePage} // pass setter to sidebar
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {renderContent()}
      </div>
    </div>
  );
}
