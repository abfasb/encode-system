import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RcefAccredited from "./RCEF-component/RcefAccredited";
import RcefWithLackings from "./RCEF-component/RcefWithLackings";
import RcefExpired from "./RCEF-component/RcefExpired";
import RcefOnProcess from "./RCEF-component/RcefOnProcess";
import RcefRenewal from "./RCEF-component/RcefForRenewal";
import RcefCertificateNumber from "./RCEF-component/RcefCertificateNumber";

const tabs = ["RCEF Accredited", "RCEF With Lackings", "RCEF Expired", "RCEF OnProcess", "RCEF For Renewal", "Certificate Number"];

export default function RCEF() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          RCEF Management Panel
        </h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base font-medium">
          Manage, track, and export Farmers Cooperative/Association accreditations.
        </p>
      </div>

      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex overflow-x-auto hide-scrollbar sm:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap
              ${
                activeTab === tab
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="rcef-active-tab"
                className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl shadow-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100/50 p-6 md:p-8"
          >
            {activeTab === "RCEF Accredited" && <RcefAccredited />}
            {activeTab === "RCEF With Lackings" && <RcefWithLackings />}
            {activeTab === "RCEF Expired" && <RcefExpired />}
            {activeTab === "RCEF OnProcess" && <RcefOnProcess />}
            {activeTab === "RCEF For Renewal" && <RcefRenewal />}
            {activeTab === "Certificate Number" && <RcefCertificateNumber />}
          </motion.div>
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}