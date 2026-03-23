import { useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../components/admin/Dashboard";
import AuditLogs from "../components/admin/AuditLogs";
import CSO from "../components/admin/CSO";
import { Navigate } from "react-router-dom";
import UploadCso from "../components/UploadCso";
import RCEF from "../components/admin/RCEF";
import FullCoopAssociations from "../components/admin/FullCoopAssociations";

export default function AdminPage() {

  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="full-farmers" element={<FullCoopAssociations />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="cso" element={<CSO />} />
        <Route path="upload-cso" element={<UploadCso />} />
        <Route path="rcef-reports" element={<RCEF />} />
        <Route path="*" element={<Navigate to="dashboard" />} />
      </Routes>
    </AdminLayout>
  );
}