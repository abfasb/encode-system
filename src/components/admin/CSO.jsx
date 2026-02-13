import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Accredited from "./CSO-component/Accredited";
import Deliberation from "./CSO-component/Deliberation";
import CsoOnProcess from "./CSO-component/CsoOnProcess";
import ExpiredCso from "./CSO-component/ExpiredCso";
import CertificateNumber from "./CSO-component/CertificateNumber";
import Deferred from "./CSO-component/Deferred";

const tabs = [
  "Accredited",
  "For Deliberation",
  "Received Application(On Process)",
  "Renewal Application",
  "Expired Accreditation",
  "CSOs disapproved",
  "Deferred",
  "Certificate Number",
];

export default function CSO() {
  const [activeTab, setActiveTab] = useState("Accredited");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30 p-6">
      
      {/* Header with subtle icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-4H7v4" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            CSO Management Panel
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Accreditation & oversight dashboard</p>
        </div>
      </div>

      {/* Tabs – modern glass container */}
      <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05)] p-1.5 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all"
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-green-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content card with animated entrance */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-8"
        >
          {activeTab === "Accredited" && <Accredited />}
          {activeTab === "For Deliberation" && <Deliberation />}
          {activeTab === "Received Application(On Process)" && <CsoOnProcess />}
          {activeTab === "Renewal Application" && <Section title="Document Center" />}
          {activeTab === "Expired Accreditation" && <ExpiredCso />}
          {activeTab === "CSOs disapproved" && <Section title="Announcements Board" />}
          {activeTab === "Deferred" && <Deferred />}
          {activeTab === "Certificate Number" && <CertificateNumber />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ✨ Enhanced placeholder component – same content, premium look
function Section({ title }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">
          {title}
        </h2>
      </div>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
        <p className="text-gray-600 leading-relaxed">
          This is the content area for <strong className="text-green-700">{title}</strong>.
          You can place tables, forms, analytics charts, or any dynamic content here.
        </p>
      </div>
    </div>
  );
}