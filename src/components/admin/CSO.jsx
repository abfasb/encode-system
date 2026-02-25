import { useState } from "react";
import { motion } from "framer-motion";
import Accredited from "./CSO-component/Accredited";
import Deliberation from "./CSO-component/Deliberation";
import CsoOnProcess from "./CSO-component/CsoOnProcess";
import ExpiredCso from "./CSO-component/ExpiredCso";
import CertificateNumber from "./CSO-component/CertificateNumber";
import Deferred from "./CSO-component/Deferred";
import CsoRenewal from "./CSO-component/CsoRenewal";
import CsoDisapproved from "./CSO-component/CsoDisapproved";
import CsoFarmers from "./CSO-component/CsoFarmers";

const tabs = [
  "Accredited",
  "For Deliberation",
  "Received Application(On Process)",
  "Renewal Application",
  "Expired Accreditation",
  "CSOs disapproved",
  "Deferred",
  "Certificate Number",
  "CSO Farmers",
];

export default function CSO() {
  const [activeTab, setActiveTab] = useState("Accredited");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        CSO Management Panel
      </h1>

      {/* Tabs */}
      <div className="relative bg-white rounded-2xl shadow-md p-2 flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-2 text-sm font-medium rounded-xl transition-all duration-300
              ${
                activeTab === tab
                  ? "text-white"
                  : "text-gray-600 hover:text-black"
              }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-lg p-8">
        {activeTab === "Accredited" && (
          <Accredited />
        )}
        {activeTab === "For Deliberation" && (
          <Deliberation />
        )}
        {activeTab === "Received Application(On Process)" && (
          <CsoOnProcess />
        )}
        {activeTab === "Renewal Application" && (
          <CsoRenewal />
        )}
        {activeTab === "Expired Accreditation" && (
          <ExpiredCso />
        )}
        {activeTab === "CSOs disapproved" && (
          <CsoDisapproved />
        )}
        {activeTab === "Deferred" && (
          <Deferred />
        )}
        {activeTab === "Certificate Number" && (
          <CertificateNumber/>
        )}
        {activeTab === "CSO Farmers" && (
          <CsoFarmers/>
        )}
      </div>
    </div>
  );
}