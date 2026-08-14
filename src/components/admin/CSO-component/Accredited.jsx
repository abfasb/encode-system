import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Check,
  AlertCircle,
  Users,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  Shield,
  ExternalLink,
  RefreshCw,
  Clock,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { db } from '../../../config/firebase';

// ======================================================================
// DESIGN SYSTEM — "Civic Registry"
// Paper/vellum ground, oxblood + brass accents, Fraunces for structure,
// IBM Plex Mono for every piece of record data (numbers, codes, dates).
// ======================================================================

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,550;9..144,650;9..144,700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`;

const ds = {
  page: 'bg-[#F5F1E6] text-[#2A241C]',
  cardBase: 'bg-[#FFFDF7] border border-[#DED2B4] rounded-lg shadow-[0_1px_2px_rgba(42,36,28,0.05)]',
  hairline: 'border-[#DED2B4]',
  eyebrow: "font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B7F63]",
  label: "block font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B7F63] mb-1.5",
  input:
    "w-full text-[#2A241C] bg-white border border-[#D8CDAE] rounded-md px-3.5 py-2.5 text-sm placeholder:text-[#AFA588] focus:outline-none focus:ring-2 focus:ring-[#7C2E2E]/25 focus:border-[#7C2E2E] transition-colors duration-150",
  select:
    "text-[#2A241C] bg-white border border-[#D8CDAE] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C2E2E]/25 focus:border-[#7C2E2E] transition-colors duration-150",
  mono: "font-['IBM_Plex_Mono']",
  display: "font-['Fraunces']",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C2E2E] text-[#F8F3E7] text-sm font-semibold rounded-md shadow-sm hover:bg-[#692525] active:bg-[#551D1D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150",
  btnSuccess:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3F6B4C] text-[#F8F3E7] text-sm font-semibold rounded-md shadow-sm hover:bg-[#345A3F] active:bg-[#2A4933] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#D8CDAE] text-[#2A241C] text-sm font-semibold rounded-md hover:bg-[#F1EADA] active:bg-[#E9E1CC] transition-colors duration-150",
  btnGhost:
    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#D8CDAE] bg-white text-[#5B5340] hover:bg-[#F1EADA] transition-colors duration-150",
  iconBtn:
    "p-1.5 rounded-md text-[#8B7F63] hover:bg-[#F1EADA] transition-colors duration-150",
};

const STAMP_STYLES = {
  Active: 'text-[#3F6B4C] border-[#3F6B4C]/50 bg-[#3F6B4C]/[0.07]',
  Inactive: 'text-[#7C2E2E] border-[#7C2E2E]/50 bg-[#7C2E2E]/[0.07]',
  Pending: 'text-[#9A6B1F] border-[#9A6B1F]/50 bg-[#9A6B1F]/[0.07]',
  Suspended: 'text-[#7C2E2E] border-[#7C2E2E]/50 bg-[#7C2E2E]/[0.07]',
};

// Rubber-stamp style status indicator — the signature motif of this registry UI
const StatusStamp = ({ status, className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-[3px] border-2 font-['IBM_Plex_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] -rotate-1 ${STAMP_STYLES[status] || 'text-[#5B5340] border-[#5B5340]/50 bg-[#5B5340]/[0.07]'} ${className}`}
  >
    {status || 'Unknown'}
  </span>
);

const ScopeTag = ({ scope }) => {
  const map = {
    Regional: 'bg-[#4A5F73]/10 text-[#4A5F73] border-[#4A5F73]/25',
    National: 'bg-[#6B4A73]/10 text-[#6B4A73] border-[#6B4A73]/25',
    Local: 'bg-[#5B5340]/10 text-[#5B5340] border-[#5B5340]/25',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-wider ${map[scope] || map.Local}`}>
      {scope}
    </span>
  );
};

// ---------- Helper: Check if a date string is expired ----------
const isExpired = (expirationDateString) => {
  if (!expirationDateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDateString);
  expDate.setHours(0, 0, 0, 0);
  return expDate < today;
};

// ---------- Helper: Check if a date string is expiring soon (within next 90 days) ----------
const isExpiringSoon = (expirationDateString) => {
  if (!expirationDateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDateString);
  expDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 90;
};

// ---------- Helper: Get days until expiration ----------
const getDaysUntilExpiration = (expirationDateString) => {
  if (!expirationDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDateString);
  expDate.setHours(0, 0, 0, 0);
  return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
};

// ---------- List of MIMAROPA provinces ----------
const MIMAROPA_PROVINCES = [
  'Occidental Mindoro',
  'Oriental Mindoro',
  'Marinduque',
  'Palawan',
  'Romblon'
];

// ---------- Helper: Check if a record belongs to a given province (based on province field or address) ----------
const recordMatchesProvince = (record, province) => {
  if (record.province && record.province.toLowerCase() === province.toLowerCase()) {
    return true;
  }
  if (record.address && record.address.toLowerCase().includes(province.toLowerCase())) {
    return true;
  }
  return false;
};

// ---------- Helper: Extract province and municipality from address ----------
const parseAddress = (address) => {
  if (!address) return { province: '', municipality: '' };
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    return {
      province: parts[parts.length - 1],
      municipality: parts[parts.length - 2]
    };
  } else if (parts.length === 2) {
    return {
      province: parts[1],
      municipality: parts[0]
    };
  } else {
    return { province: '', municipality: '' };
  }
};

const getTypeFromName = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('cooperative')) return 'Cooperative';
  if (lower.includes('irrigators association') || lower.includes('irrigators')) return 'Irrigators Association';
  if (lower.includes('farmers association') || lower.includes('farmers')) return 'Farmers Association';
  return 'Association';
};

const parseMemberString = (memberStr) => {
  if (!memberStr) return { total: 0, male: 0, female: 0 };

  let total = 0;
  let male = 0;
  let female = 0;

  const totalMatch = memberStr.match(/(\d+[\d,]*)\s*(?:members?|total|:)/i);
  if (totalMatch) total = parseInt(totalMatch[1].replace(/,/g, ''), 10);
  const maleMatch = memberStr.match(/[Mm][:\-\s]*(\d+)/);
  if (maleMatch) male = parseInt(maleMatch[1], 10);
  const femaleMatch = memberStr.match(/[Ff][:\-\s]*(\d+)/);
  if (femaleMatch) female = parseInt(femaleMatch[1], 10);
  if (total === 0 && (male > 0 || female > 0)) total = male + female;
  if (total === 0) { const anyNumber = memberStr.match(/^(\d+)/); if (anyNumber) total = parseInt(anyNumber[1], 10); }
  return { total, male, female };
};

const mapCsoToFarmers = (csoRecord) => {
  const { province: parsedProvince, municipality: parsedMunicipality } = parseAddress(csoRecord.address || '');
  const { total, male, female } = parseMemberString(csoRecord.no_of_members || '');
  const interventions = { seeds: false, mech: false, credit: false, extn: false };
  return {
    province: csoRecord.province || parsedProvince,
    municipality: parsedMunicipality,
    no: csoRecord.no ? String(csoRecord.no) : null,
    name: csoRecord.name_of_association || '',
    date_application_received: null,
    date_accredited: csoRecord.date_of_issuance || null,
    date_expiration: csoRecord.date_of_expiration || null,
    type_fca: getTypeFromName(csoRecord.name_of_association),
    male_members: male,
    female_members: female,
    total_members: total,
    area_covered: null,
    address: csoRecord.address || '',
    contact_person: csoRecord.contact_person || '',
    contact_no: csoRecord.contact_number || null,
    interventions: interventions,
    remarks: null,
    certificate_of_accreditation: csoRecord.certificate_of_accreditation || null,
    submitted_documents: null,
    createdAt: serverTimestamp()
  };
};

// ---------- DataTable Component ----------
const DataTable = ({
  columns,
  data,
  onRowClick,
  isLoading,
  onSort,
  sortField,
  sortDirection,
  pagination,
  onPageChange,
  onRowsPerPageChange
}) => {
  const handleRowClick = (row, e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) return;
    onRowClick(row);
  };

  return (
    <div className={`${ds.cardBase} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#EFE7D2] border-b border-[#DED2B4]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3.5 text-left font-['IBM_Plex_Mono'] text-[10px] font-semibold text-[#6B6350] uppercase tracking-[0.14em] whitespace-nowrap ${column.sortable ? 'cursor-pointer hover:text-[#2A241C] transition-colors' : ''}`}
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{column.header}</span>
                    {column.sortable && sortField === column.key && (
                      <span className="text-[#7C2E2E]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE2CB]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#DED2B4] border-t-[#7C2E2E]"></div>
                  </div>
                  <p className={`mt-3 text-sm text-[#8B7F63] ${ds.mono}`}>Loading registry records…</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-10 w-10 text-[#C9BE9F] mb-3" strokeWidth={1.5} />
                    <p className={`text-[#2A241C] text-base font-semibold ${ds.display}`}>No records found</p>
                    <p className="text-[#8B7F63] mt-1 text-sm">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`hover:bg-[#F1EADA]/70 transition-colors duration-100 ${idx % 2 === 1 ? 'bg-[#FBF8EF]/60' : ''}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-5 py-4 text-sm align-top"
                      onClick={(e) => { if (column.key !== 'actions') handleRowClick(row, e); }}
                      style={{ cursor: column.key !== 'actions' ? 'pointer' : 'default' }}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && data.length > 0 && (
        <div className="px-5 py-4 border-t border-[#DED2B4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FBF8EF]">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={pagination.rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className={`${ds.select} py-1.5 text-xs`}
            >
              {[5, 10, 25, 50, 100].map(size => <option key={size} value={size}>{size} per page</option>)}
            </select>
            <span className={`text-xs text-[#8B7F63] ${ds.mono}`}>
              {pagination.startIndex + 1}–{Math.min(pagination.endIndex, pagination.total)} of {pagination.total}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onPageChange(1)} disabled={pagination.currentPage === 1} className={`${ds.iconBtn} border border-[#D8CDAE] bg-white disabled:opacity-40 disabled:cursor-not-allowed`}>
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button onClick={() => onPageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className={`${ds.iconBtn} border border-[#D8CDAE] bg-white disabled:opacity-40 disabled:cursor-not-allowed`}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) pageNum = i + 1;
                else if (pagination.currentPage <= 3) pageNum = i + 1;
                else if (pagination.currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                else pageNum = pagination.currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-md text-xs font-semibold font-['IBM_Plex_Mono'] transition-colors ${pagination.currentPage === pageNum ? 'bg-[#7C2E2E] text-[#F8F3E7]' : 'border border-[#D8CDAE] bg-white text-[#5B5340] hover:bg-[#F1EADA]'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button onClick={() => onPageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className={`${ds.iconBtn} border border-[#D8CDAE] bg-white disabled:opacity-40 disabled:cursor-not-allowed`}>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => onPageChange(pagination.totalPages)} disabled={pagination.currentPage === pagination.totalPages} className={`${ds.iconBtn} border border-[#D8CDAE] bg-white disabled:opacity-40 disabled:cursor-not-allowed`}>
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Modal Component ----------
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-[#1C1710]/60 backdrop-blur-[2px] p-4 animate-[fadeIn_0.15s_ease-out]">
      <div className={`relative bg-[#FFFDF7] rounded-lg shadow-2xl w-full ${sizeClasses[size]} border border-[#DED2B4] animate-[modalIn_0.18s_ease-out]`}>
        <div className="sticky top-0 bg-[#FFFDF7] rounded-t-lg px-6 py-4 border-b border-[#DED2B4] z-10 flex items-center justify-between">
          <h3 className={`text-xl sm:text-2xl font-semibold text-[#2A241C] ${ds.display}`}>{title}</h3>
          <button onClick={onClose} className="text-[#8B7F63] hover:text-[#2A241C] hover:bg-[#F1EADA] transition-colors p-1.5 rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

const initialFormState = {
  no: '',
  name_of_association: '',
  contact_person: '',
  position: '',
  sex_female: false,
  sex_male: false,
  contact_number: '',
  email_address: '',
  no_of_members: '',
  address: '',
  scope: 'Regional',
  nature_of_services: '',
  accreditation_no: '',
  date_of_issuance: '',
  date_of_expiration: '',
  certificate_of_accreditation: '',
  province: '',
  region: 'MIMAROPA',
  status: 'Active'
};

// Small section wrapper used inside the Add/Edit form to keep the "dossier folder" rhythm
const FormSection = ({ index, title, children }) => (
  <div className={`${ds.cardBase} p-5`}>
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#EAE2CB]">
      <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-[#7C2E2E]/10 text-[#7C2E2E] text-[11px] font-bold ${ds.mono}`}>{index}</span>
      <h4 className={`font-semibold text-[#2A241C] text-sm uppercase tracking-wide ${ds.mono}`}>{title}</h4>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
  </div>
);

const Accredited = () => {
  const [csoData, setCsoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCSO, setSelectedCSO] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    scope: 'all',
    hasCertificate: 'all',
    status: 'all',
    province: 'all',
    expirationStatus: 'all'
  });
  const [sortConfig, setSortConfig] = useState({ field: 'no', direction: 'asc' });
  const [pagination, setPagination] = useState({ currentPage: 1, rowsPerPage: 10, totalPages: 1 });
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, withCertificates: 0 });
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    const saved = localStorage.getItem('dismissedRenewalNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [showExpiringModal, setShowExpiringModal] = useState(false);

  const syncToCsoFarmers = async (csoId, csoData) => {
    if (!csoId) return;
    const farmersData = mapCsoToFarmers(csoData);
    await setDoc(doc(db, 'fullcso-farmers', csoId), farmersData, { merge: true });
  };

  const removeFromCsoFarmers = async (csoId) => {
    if (!csoId) return;
    try { await deleteDoc(doc(db, 'fullcso-farmers', csoId)); } catch (error) { console.error(error); }
  };

  const moveExpiredRecord = async (docId, recordData) => {
    try {
      await setDoc(doc(db, 'cso-expired', docId), { ...recordData, expiredAt: serverTimestamp(), movedFrom: 'cso' });
      await deleteDoc(doc(db, 'cso', docId));
      return true;
    } catch (error) { console.error(error); throw error; }
  };

  const checkAndMoveExpiredRecords = useCallback(async (records) => {
    let movedCount = 0;
    for (const record of records) {
      if (isExpired(record.date_of_expiration)) {
        try { await moveExpiredRecord(record.id, record); movedCount++; } catch (e) { console.error(e); }
      }
    }
    return movedCount;
  }, []);

  const fetchCSOData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const q = query(collection(db, 'cso'), orderBy('no', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const movedCount = await checkAndMoveExpiredRecords(data);
      let finalData = data;
      if (movedCount > 0) {
        const newSnapshot = await getDocs(q);
        finalData = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSuccess(`${movedCount} expired record(s) moved to archive.`);
        setTimeout(() => setSuccess(''), 3000);
      }
      setCsoData(finalData);
      const total = finalData.length;
      const active = finalData.filter(i => i.status === 'Active').length;
      const withCertificates = finalData.filter(i => i.certificate_of_accreditation).length;
      const expiringSoon = finalData.filter(i => isExpiringSoon(i.date_of_expiration)).length;
      setStats({ total, active, expiringSoon, withCertificates });
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally { setLoading(false); }
  }, [checkAndMoveExpiredRecords]);

  useEffect(() => { fetchCSOData(); const interval = setInterval(fetchCSOData, 3600000); return () => clearInterval(interval); }, [fetchCSOData]);

  // List of expiring soon records (for notifications)
  const expiringSoonRecords = useMemo(() => {
    return csoData.filter(item => isExpiringSoon(item.date_of_expiration) && !isExpired(item.date_of_expiration));
  }, [csoData]);

  // Filter out dismissed notifications
  const visibleExpiringRecords = useMemo(() => {
    return expiringSoonRecords.filter(record => !dismissedNotifications.includes(record.id));
  }, [expiringSoonRecords, dismissedNotifications]);

  const dismissNotification = (id) => {
    const newDismissed = [...dismissedNotifications, id];
    setDismissedNotifications(newDismissed);
    localStorage.setItem('dismissedRenewalNotifications', JSON.stringify(newDismissed));
  };

  const dismissAllNotifications = () => {
    const allIds = expiringSoonRecords.map(r => r.id);
    setDismissedNotifications(allIds);
    localStorage.setItem('dismissedRenewalNotifications', JSON.stringify(allIds));
  };

  const resetNotifications = () => {
    setDismissedNotifications([]);
    localStorage.removeItem('dismissedRenewalNotifications');
    setShowNotificationBanner(true);
  };

  const handleRenewalClick = (cso) => {
    handleEdit(cso);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'sex_female' || name === 'sex_male') {
        setFormData(prev => ({ ...prev, sex_female: name === 'sex_female' ? checked : false, sex_male: name === 'sex_male' ? checked : false }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.no || !formData.name_of_association) { setError('No. and Name of Association are required'); return; }
    if (formData.date_of_expiration && isExpired(formData.date_of_expiration) && !window.confirm('This record appears expired. It will be moved to archive. Proceed?')) return;
    try {
      let docRef;
      if (editingId) {
        docRef = doc(db, 'cso', editingId);
        await updateDoc(docRef, formData);
        setSuccess('CSO record updated!');
        await syncToCsoFarmers(editingId, formData);
      } else {
        docRef = await addDoc(collection(db, 'cso'), formData);
        setSuccess('CSO record added!');
        await syncToCsoFarmers(docRef.id, formData);
      }
      setFormData(initialFormState);
      setEditingId(null);
      setShowAddModal(false);
      fetchCSOData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save data.');
    }
  };

  const handleEdit = (cso) => {
    setFormData(cso);
    setEditingId(cso.id);
    setShowViewModal(false);
    setShowAddModal(true);
  };

  const handleView = (cso) => {
    setSelectedCSO(cso);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedCSO) return;
    try {
      await removeFromCsoFarmers(selectedCSO.id);
      await deleteDoc(doc(db, 'cso', selectedCSO.id));
      setSuccess(`${selectedCSO.name_of_association} deleted!`);
      setShowDeleteModal(false);
      fetchCSOData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to delete record.');
    }
  };

  const openDeleteModal = (cso) => {
    setSelectedCSO(cso);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ---------- Export to Excel with filters respected ----------
  const exportToExcelWithBeautifulFormatting = async () => {
    try {
      // Use filteredData instead of csoData to respect current filters
      const extractProvinceFromAddress = (address) => {
        if (!address) return 'Unknown';
        for (const province of MIMAROPA_PROVINCES) if (address.toLowerCase().includes(province.toLowerCase())) return province;
        if (address.toLowerCase().includes('mindoro occ')) return 'Occidental Mindoro';
        if (address.toLowerCase().includes('mindoro or')) return 'Oriental Mindoro';
        return 'Unknown';
      };

      // Process the filtered data
      const processedData = filteredData.map(item => ({
        ...item,
        extractedProvince: item.province || extractProvinceFromAddress(item.address),
        numericNo: parseInt(item.no) || 0
      }));

      // Group by province
      const groupedData = {};
      processedData.forEach(item => {
        const prov = item.extractedProvince;
        if (!groupedData[prov]) groupedData[prov] = [];
        groupedData[prov].push(item);
      });

      // Sort items within each province by numeric no
      Object.keys(groupedData).forEach(prov => groupedData[prov].sort((a, b) => a.numericNo - b.numericNo));

      // Sort provinces in predefined order
      const provinceOrder = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Palawan', 'Romblon', 'Unknown'];
      const sortedProvinces = Object.keys(groupedData).sort((a, b) => provinceOrder.indexOf(a) - provinceOrder.indexOf(b));

      const now = new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      const wb = XLSXStyle.utils.book_new();
      const wsData = [];
      const merges = [];

      // Title rows
      wsData.push(['LIST OF ACCREDITED CIVIL SOCIETY ORGANIZATIONS']);
      wsData.push([`as of ${currentMonth} ${currentYear}`]);
      wsData.push([]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } });

      // Header rows
      wsData.push(['NO.', 'NAME OF THE ASSOCIATION', 'CONTACT PERSON', 'POSITION', 'SEX', '', 'CONTACT NUMBER', 'EMAIL ADDRESS', 'NO. OF MEMBERS', 'ADDRESS', 'SCOPE', 'NATURE OF SERVICES', 'ACCREDITATION NO.', 'DATE OF ISSUANCE', 'DATE OF EXPIRATION', 'CERTIFICATE OF ACCREDITATION']);
      wsData.push(['', '', '', '', 'F', 'M', '', '', '', '', '', '', '', '', '', '']);
      merges.push({ s: { r: 3, c: 4 }, e: { r: 3, c: 5 } });
      [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(col => merges.push({ s: { r: 3, c: col }, e: { r: 4, c: col } }));

      let currentRow = 5;

      // Add data grouped by province
      sortedProvinces.forEach(province => {
        // Province header row
        const pRow = Array(16).fill('');
        pRow[0] = province.toUpperCase();
        wsData.push(pRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 15 } });
        currentRow++;

        // Data rows for this province
        groupedData[province].forEach(item => {
          wsData.push([
            item.no || '',
            item.name_of_association || '',
            item.contact_person || '',
            item.position || '',
            item.sex_female ? '✓' : '',
            item.sex_male ? '✓' : '',
            item.contact_number ? String(item.contact_number) : '',
            item.email_address || '',
            item.no_of_members || '',
            item.address || '',
            item.scope || '',
            item.nature_of_services || '',
            item.accreditation_no || '',
            item.date_of_issuance || '',
            item.date_of_expiration || '',
            item.certificate_of_accreditation || ''
          ]);
          currentRow++;
        });

        // Empty row after province
        wsData.push(Array(16).fill(''));
        currentRow++;
      });

      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 8 }, { wch: 40 }, { wch: 25 }, { wch: 20 }, { wch: 6 }, { wch: 6 },
        { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 45 }, { wch: 15 }, { wch: 35 },
        { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 45 }
      ];

      // Row heights
      ws['!rows'] = wsData.map((row, i) => {
        if (i === 0) return { hpt: 40 };
        if (i === 1) return { hpt: 35 };
        if (i === 3 || i === 4) return { hpt: 30 };
        if (row && row[0] && !sortedProvinces.includes(row[0])) return { hpt: 35 };
        return { hpt: 25 };
      });

      // Define a base data style (fixes ReferenceError)
      const dataStyle = {
        font: { name: 'Arial', sz: 11 },
        alignment: { vertical: 'center', wrapText: true },
        border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      };

      // Apply cell styles
      const range = XLSXStyle.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSXStyle.utils.encode_cell({ r: R, c: C });
          const cell = ws[addr];
          if (!cell) continue;

          if (R === 0) {
            cell.s = { font: { sz: 16, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
          } else if (R === 1) {
            cell.s = { font: { sz: 14, italic: true }, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "B7E1CD" }, patternType: "solid" } };
          } else if (R === 3 || R === 4) {
            cell.s = { font: { bold: true }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, fill: { fgColor: { rgb: "93C47D" }, patternType: "solid" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
          } else {
            const isProvince = sortedProvinces.some(p => wsData[R] && wsData[R][0] === p.toUpperCase());
            if (isProvince) {
              cell.s = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "FCD34D" }, patternType: "solid" }, alignment: { horizontal: "left", vertical: "center" }, border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } } };
            } else if (wsData[R] && wsData[R][0] !== '') {
              if (C === 15 && cell.v && cell.v.toString().startsWith('http')) {
                cell.l = { Target: cell.v, Tooltip: "Click to view Certificate" };
                cell.s = { ...dataStyle, font: { name: 'Arial', sz: 11, color: { rgb: "0563C1" }, underline: true } };
              } else {
                cell.s = dataStyle;
              }
            }
          }
        }
      }

      ws['!merges'] = merges;
      XLSXStyle.utils.book_append_sheet(wb, ws, 'CSO List');
      const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), `CSO_Accredited_Organizations.xlsx`);
      setSuccess('Export Complete!');
    } catch (err) {
      console.error(err);
      setError('Export failed');
    }
  };

  const handleImport = async () => {
    if (!importFile) { setError('Please select a file'); return; }
    try {
      setImportProgress(10);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setImportProgress(30);
          let imported = 0;
          const total = jsonData.length;
          for (let i = 0; i < jsonData.length; i++) {
            const item = jsonData[i];
            let province = item['PROVINCE'] || '';
            if (province === 'Regional' && item['ADDRESS']) {
              const address = item['ADDRESS'];
              for (const p of MIMAROPA_PROVINCES) if (address.toLowerCase().includes(p.toLowerCase())) { province = p; break; }
            }
            const sexF = item['F'] === '✓' || item['F'] === true;
            const sexM = item['M'] === '✓' || item['M'] === true;
            const sexValue = item['SEX'] || '';
            const csoRecord = {
              no: item['NO.']?.toString() || '',
              name_of_association: item['NAME OF THE ASSOCIATION'] || '',
              contact_person: item['CONTACT PERSON'] || '',
              position: item['POSITION'] || '',
              sex_female: sexF || sexValue?.toLowerCase() === 'female',
              sex_male: sexM || sexValue?.toLowerCase() === 'male',
              contact_number: item['CONTACT NUMBER']?.toString() || '',
              email_address: item['EMAIL ADDRESS'] || '',
              no_of_members: item['NO. OF MEMBERS']?.toString() || '',
              address: item['ADDRESS'] || '',
              province: province || '',
              region: 'MIMAROPA',
              scope: item['SCOPE'] || 'Regional',
              nature_of_services: item['NATURE OF SERVICES'] || '',
              accreditation_no: item['ACCREDITATION NO.'] || '',
              date_of_issuance: item['DATE OF ISSUANCE OF ACCREDITATION'] || item['DATE OF ISSUANCE'] || '',
              date_of_expiration: item['DATE OF EXPIRATION'] || '',
              status: 'Active',
              certificate_of_accreditation: item['CERTIFICATE OF ACCREDITATION'] || ''
            };
            const existingQuery = query(collection(db, 'cso'), where('no', '==', csoRecord.no));
            const existingSnapshot = await getDocs(existingQuery);
            if (!existingSnapshot.empty) {
              const docRef = doc(db, 'cso', existingSnapshot.docs[0].id);
              await updateDoc(docRef, csoRecord);
              await syncToCsoFarmers(existingSnapshot.docs[0].id, csoRecord);
            } else {
              const docRef = await addDoc(collection(db, 'cso'), csoRecord);
              await syncToCsoFarmers(docRef.id, csoRecord);
            }
            imported++;
            setImportProgress(50 + Math.round((imported / total) * 50));
          }
          setImportProgress(100);
          setTimeout(() => { setImportFile(null); setImportProgress(0); setShowImportModal(false); setSuccess(`${imported} records imported!`); fetchCSOData(); setTimeout(() => setSuccess(''), 3000); }, 500);
        } catch (err) { console.error(err); setError('Error processing file'); setImportProgress(0); }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (err) { console.error(err); setError('Import failed'); setImportProgress(0); }
  };

  const handleSort = (field) => setSortConfig(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const handleFilterChange = (filterName, value) => { setFilters(prev => ({ ...prev, [filterName]: value })); setPagination(prev => ({ ...prev, currentPage: 1 })); };
  const handlePageChange = (page) => setPagination(prev => ({ ...prev, currentPage: page }));
  const handleRowsPerPageChange = (rows) => setPagination(prev => ({ ...prev, rowsPerPage: rows, currentPage: 1 }));

  const filteredData = useMemo(() => {
    let filtered = [...csoData];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => i.name_of_association?.toLowerCase().includes(term) || i.contact_person?.toLowerCase().includes(term) || i.accreditation_no?.toLowerCase().includes(term) || i.address?.toLowerCase().includes(term) || i.province?.toLowerCase().includes(term));
    }
    if (filters.scope !== 'all') filtered = filtered.filter(i => i.scope === filters.scope);
    if (filters.hasCertificate !== 'all') filtered = filtered.filter(i => filters.hasCertificate === 'yes' ? i.certificate_of_accreditation : !i.certificate_of_accreditation);
    if (filters.status !== 'all') filtered = filtered.filter(i => i.status === filters.status);
    if (filters.province !== 'all') filtered = filtered.filter(i => recordMatchesProvince(i, filters.province));
    if (filters.expirationStatus !== 'all') {
      if (filters.expirationStatus === 'expiringSoon') filtered = filtered.filter(i => isExpiringSoon(i.date_of_expiration));
      else if (filters.expirationStatus === 'valid') filtered = filtered.filter(i => !isExpiringSoon(i.date_of_expiration));
    }
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.field], bVal = b[sortConfig.field];
      if (sortConfig.field === 'no') { aVal = parseInt(aVal) || 0; bVal = parseInt(bVal) || 0; }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [csoData, searchTerm, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    return filteredData.slice(start, start + pagination.rowsPerPage);
  }, [filteredData, pagination]);

  useEffect(() => { setPagination(prev => ({ ...prev, totalPages: Math.ceil(filteredData.length / prev.rowsPerPage) })); }, [filteredData.length, pagination.rowsPerPage]);

  const provinces = useMemo(() => {
    const fromData = [...new Set(csoData.map(i => i.province).filter(Boolean))];
    return [...new Set([...fromData, ...MIMAROPA_PROVINCES])].sort();
  }, [csoData]);

  const columns = [
    {
      key: 'no',
      header: 'No.',
      sortable: true,
      render: row => (
        <div className={`inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded border border-[#DED2B4] bg-[#F1EADA] font-bold text-xs text-[#5B5340] ${ds.mono}`}>
          {row.no}
        </div>
      )
    },
    {
      key: 'name_of_association',
      header: 'Association',
      sortable: true,
      render: row => (
        <div>
          <div className={`font-semibold text-[#2A241C] ${ds.display} text-[15px] leading-snug`}>{row.name_of_association}</div>
          <div className="text-xs text-[#8B7F63] flex items-center mt-1 gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />{row.province || 'No province'}
          </div>
        </div>
      )
    },
    {
      key: 'contact_person',
      header: 'Contact Person',
      sortable: true,
      render: row => (
        <div>
          <div className="text-[#2A241C]">{row.contact_person}</div>
          <div className="text-xs text-[#8B7F63] mt-0.5">{row.position}</div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: row => (
        <div className={`space-y-1 text-xs ${ds.mono} text-[#5B5340]`}>
          {row.contact_number && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-[#8B7F63]" />{row.contact_number}</div>}
          {row.email_address && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-[#8B7F63]" />{row.email_address}</div>}
        </div>
      )
    },
    {
      key: 'scope',
      header: 'Scope & Members',
      render: row => (
        <div className="space-y-1.5">
          <ScopeTag scope={row.scope} />
          {row.no_of_members && (
            <div className={`flex items-center text-xs text-[#5B5340] ${ds.mono}`}>
              <Users className="h-3 w-3 mr-1.5 text-[#8B7F63]" />{row.no_of_members} members
            </div>
          )}
        </div>
      )
    },
    {
      key: 'accreditation',
      header: 'Accreditation',
      render: row => (
        <div className="space-y-1">
          <div className={`text-xs text-[#2A241C] ${ds.mono}`}>{row.accreditation_no}</div>
          {row.date_of_expiration && (
            <div className={`text-[11px] ${ds.mono} ${isExpiringSoon(row.date_of_expiration) ? 'text-[#9A6B1F] font-semibold' : 'text-[#8B7F63]'}`}>
              Exp: {new Date(row.date_of_expiration).toLocaleDateString()}{isExpiringSoon(row.date_of_expiration) && ' · soon'}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleView(row)} className={`${ds.iconBtn} hover:text-[#4A5F73]`} title="View"><Eye className="h-4 w-4" /></button>
          <button onClick={() => handleEdit(row)} className={`${ds.iconBtn} hover:text-[#3F6B4C]`} title="Edit"><Edit className="h-4 w-4" /></button>
          <button onClick={() => openDeleteModal(row)} className={`${ds.iconBtn} hover:text-[#7C2E2E]`} title="Delete"><Trash2 className="h-4 w-4" /></button>
          {row.certificate_of_accreditation && (
            <a href={row.certificate_of_accreditation} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`${ds.iconBtn} hover:text-[#6B4A73]`} title="Certificate">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )
    }
  ];

  return (
    <div className={`min-h-screen ${ds.page} p-4 md:p-8`}>
      <style>{`
        ${FONT_IMPORT}
        ::selection { background: rgba(124,46,46,0.18); }
      `}</style>

      {/* Notification Banner */}
      {visibleExpiringRecords.length > 0 && showNotificationBanner && (
        <div className="mb-6 bg-[#FBF3DF] border border-[#E3C77B]/60 border-l-4 border-l-[#9A6B1F] rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Bell className="h-5 w-5 text-[#9A6B1F]" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold text-[#7A5814] uppercase tracking-wide ${ds.mono}`}>Renewal Reminder</h3>
                  <p className="text-sm text-[#5B4A1F] mt-1">
                    {visibleExpiringRecords.length} organization{visibleExpiringRecords.length !== 1 ? 's' : ''} require renewal within 90 days.
                  </p>
                  <div className="mt-3 space-y-2">
                    {visibleExpiringRecords.slice(0, 5).map(record => {
                      const daysLeft = getDaysUntilExpiration(record.date_of_expiration);
                      return (
                        <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/70 border border-[#E3C77B]/40 rounded-md p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2A241C] truncate">{record.name_of_association}</p>
                            <p className={`text-xs text-[#8B7F63] ${ds.mono}`}>Expires {new Date(record.date_of_expiration).toLocaleDateString()} · {daysLeft}d left</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleRenewalClick(record)} className="px-3 py-1 text-xs font-semibold bg-[#9A6B1F] text-white rounded hover:bg-[#835B19] transition-colors">
                              Renew Now
                            </button>
                            <button onClick={() => dismissNotification(record.id)} className="px-2 py-1 text-xs text-[#8B7F63] hover:text-[#2A241C] transition-colors">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {visibleExpiringRecords.length > 5 && (
                      <p className={`text-xs text-[#9A6B1F] ${ds.mono}`}>+{visibleExpiringRecords.length - 5} more…</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => setShowExpiringModal(true)} className="text-xs font-semibold text-[#7A5814] hover:text-[#5B4A1F] transition-colors">View All</button>
                <button onClick={dismissAllNotifications} className="text-xs font-semibold text-[#7A5814] hover:text-[#5B4A1F] transition-colors">Dismiss All</button>
                <button onClick={() => setShowNotificationBanner(false)} className="text-[#8B7F63] hover:text-[#2A241C] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for all expiring records */}
      <Modal isOpen={showExpiringModal} onClose={() => setShowExpiringModal(false)} title="Organizations Requiring Renewal" size="lg">
        <div className="space-y-3">
          {expiringSoonRecords.length === 0 ? (
            <div className="text-center py-10 text-[#8B7F63]">No records expiring soon.</div>
          ) : (
            expiringSoonRecords.map(record => {
              const daysLeft = getDaysUntilExpiration(record.date_of_expiration);
              return (
                <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-[#DED2B4] rounded-lg hover:bg-[#F1EADA]/50 transition-colors">
                  <div>
                    <p className={`font-semibold text-[#2A241C] ${ds.display}`}>{record.name_of_association}</p>
                    <p className="text-sm text-[#8B7F63]">Province: {record.province || 'N/A'}</p>
                    <p className={`text-xs text-[#9A6B1F] ${ds.mono} mt-0.5`}>Expires {new Date(record.date_of_expiration).toLocaleDateString()} · {daysLeft}d left</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowExpiringModal(false); handleRenewalClick(record); }} className={ds.btnPrimary + ' !px-3 !py-1.5 text-xs'}>Renew</button>
                    <button onClick={() => { dismissNotification(record.id); }} className={ds.btnSecondary + ' !px-3 !py-1.5 text-xs'}>Dismiss</button>
                  </div>
                </div>
              );
            })
          )}
          {expiringSoonRecords.length > 0 && (
            <div className="pt-4 border-t border-[#DED2B4] flex justify-end">
              <button onClick={dismissAllNotifications} className="px-4 py-2 text-sm font-semibold text-[#7C2E2E] hover:text-[#551D1D] transition-colors">Dismiss All</button>
            </div>
          )}
        </div>
      </Modal>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b-2 border-[#2A241C]/10">
          <div>
            <p className={`${ds.eyebrow} mb-2`}>MIMAROPA Region · Department of Agriculture</p>
            <h1 className={`text-3xl md:text-[2.5rem] font-bold text-[#2A241C] ${ds.display} leading-tight`}>Civil Society Organization Registry</h1>
            <p className="text-[#6B6350] mt-2 text-sm">Accreditation records for Civil Society Organizations operating in the MIMAROPA region</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => setShowAddModal(true)} className={ds.btnPrimary}><Plus className="h-4 w-4" />Add New CSO</button>
            <button onClick={exportToExcelWithBeautifulFormatting} className={ds.btnSuccess}><Download className="h-4 w-4" />Export Excel</button>
            <button onClick={() => setShowImportModal(true)} className={ds.btnSecondary}><Upload className="h-4 w-4" />Import</button>
            <button onClick={fetchCSOData} className={ds.btnSecondary}><RefreshCw className="h-4 w-4" />Refresh</button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`${ds.cardBase} p-5 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#4A5F73]/[0.06] rounded-bl-full" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className={ds.eyebrow}>Total CSOs</p>
              <p className={`text-3xl font-bold mt-2 text-[#2A241C] ${ds.mono}`}>{stats.total}</p>
            </div>
            <Building className="h-8 w-8 text-[#4A5F73]/40" strokeWidth={1.5} />
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAE2CB]">
            <p className={`text-xs text-[#8B7F63] ${ds.mono}`}>Active: {stats.active}</p>
          </div>
        </div>
        <div className={`${ds.cardBase} p-5 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#3F6B4C]/[0.06] rounded-bl-full" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className={ds.eyebrow}>With Certificates</p>
              <p className={`text-3xl font-bold mt-2 text-[#2A241C] ${ds.mono}`}>{stats.withCertificates}</p>
            </div>
            <FileText className="h-8 w-8 text-[#3F6B4C]/40" strokeWidth={1.5} />
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAE2CB]">
            <p className={`text-xs text-[#8B7F63] ${ds.mono}`}>{Math.round((stats.withCertificates / stats.total) * 100) || 0}% of total</p>
          </div>
        </div>
        <button
          onClick={() => setShowExpiringModal(true)}
          className={`${ds.cardBase} p-5 relative overflow-hidden text-left hover:border-[#9A6B1F]/50 hover:shadow-md transition-all duration-150`}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#9A6B1F]/[0.08] rounded-bl-full" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className={ds.eyebrow}>Expiring Soon</p>
              <p className={`text-3xl font-bold mt-2 text-[#9A6B1F] ${ds.mono}`}>{stats.expiringSoon}</p>
            </div>
            <Calendar className="h-8 w-8 text-[#9A6B1F]/50" strokeWidth={1.5} />
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAE2CB]">
            <p className={`text-xs text-[#8B7F63] ${ds.mono}`}>Within next 90 days</p>
          </div>
        </button>
        <div className={`${ds.cardBase} p-5 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#6B4A73]/[0.06] rounded-bl-full" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className={ds.eyebrow}>Total Members</p>
              <p className={`text-3xl font-bold mt-2 text-[#2A241C] ${ds.mono}`}>{csoData.reduce((sum, i) => sum + (parseInt(i.no_of_members) || 0), 0).toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-[#6B4A73]/40" strokeWidth={1.5} />
          </div>
          <div className="mt-4 pt-3 border-t border-[#EAE2CB]">
            <p className={`text-xs text-[#8B7F63] ${ds.mono}`}>Across all organizations</p>
          </div>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 bg-[#7C2E2E]/[0.06] border border-[#7C2E2E]/30 border-l-4 border-l-[#7C2E2E] p-4 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-[#7C2E2E] mr-3 flex-shrink-0" />
          <div className="text-[#7C2E2E] font-medium text-sm flex-1">{error}</div>
          <button onClick={() => setError('')} className="text-[#7C2E2E] hover:opacity-70"><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-6 bg-[#3F6B4C]/[0.07] border border-[#3F6B4C]/30 border-l-4 border-l-[#3F6B4C] p-4 rounded-lg flex items-center">
          <Check className="h-5 w-5 text-[#3F6B4C] mr-3 flex-shrink-0" />
          <div className="text-[#3F6B4C] font-medium text-sm flex-1">{success}</div>
          <button onClick={() => setSuccess('')} className="text-[#3F6B4C] hover:opacity-70"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Search & Filters */}
      <div className={`mb-6 ${ds.cardBase} p-5`}>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AFA588]" />
              <input
                type="text"
                placeholder="Search by name, contact, accreditation, address, or province…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${ds.input} pl-10 pr-9`}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AFA588] hover:text-[#2A241C]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <select value={filters.scope} onChange={(e) => handleFilterChange('scope', e.target.value)} className={ds.select}>
              <option value="all">All Scopes</option><option value="Regional">Regional</option><option value="National">National</option><option value="Local">Local</option>
            </select>
            <select value={filters.hasCertificate} onChange={(e) => handleFilterChange('hasCertificate', e.target.value)} className={ds.select}>
              <option value="all">All Certificates</option><option value="yes">With Certificate</option><option value="no">Without Certificate</option>
            </select>
            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={ds.select}>
              <option value="all">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option>
            </select>
            <select value={filters.province} onChange={(e) => handleFilterChange('province', e.target.value)} className={ds.select}>
              <option value="all">All Provinces</option>{provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filters.expirationStatus} onChange={(e) => handleFilterChange('expirationStatus', e.target.value)} className={ds.select}>
              <option value="all">All Expiration</option><option value="valid">Valid (not expiring soon)</option><option value="expiringSoon">Expiring Soon (≤90 days)</option>
            </select>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#EAE2CB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className={`text-sm text-[#6B6350] ${ds.mono}`}>
            Showing <span className="font-semibold text-[#2A241C]">{filteredData.length}</span> of <span className="font-semibold text-[#2A241C]">{csoData.length}</span> records
            {searchTerm && <span className="ml-2 text-xs bg-[#7C2E2E]/10 text-[#7C2E2E] px-2 py-0.5 rounded-full">"{searchTerm}"</span>}
          </div>
          <div className={`text-xs text-[#AFA588] ${ds.mono}`}>Last updated: {new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={paginatedData} onRowClick={handleView} isLoading={loading} onSort={handleSort} sortField={sortConfig.field} sortDirection={sortConfig.direction} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, rowsPerPage: pagination.rowsPerPage, total: filteredData.length, startIndex: (pagination.currentPage - 1) * pagination.rowsPerPage, endIndex: Math.min(pagination.currentPage * pagination.rowsPerPage, filteredData.length) }} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} />

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-[#DED2B4]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-[#8B7F63] text-xs">
          <div className={`flex items-center gap-4 ${ds.mono}`}>
            <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /><span>MIMAROPA Region CSO Database</span></div>
            <div className="hidden md:block text-[#DED2B4]">•</div>
            <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /><span>{csoData.length} Organizations Registered</span></div>
          </div>
        </div>
      </div>

      {/* ---------- MODALS (unchanged logic) ---------- */}
      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setFormData(initialFormState); setEditingId(null); }} title={editingId ? "Edit CSO Record" : "Add New CSO Record"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection index="1" title="Basic Information">
            <div>
              <label className={ds.label}>No. *</label>
              <input type="text" name="no" value={formData.no} onChange={handleInputChange} required className={`${ds.input} ${ds.mono}`} placeholder="001" />
            </div>
            <div className="md:col-span-2">
              <label className={ds.label}>Association Name *</label>
              <input type="text" name="name_of_association" value={formData.name_of_association} onChange={handleInputChange} required className={ds.input} placeholder="Enter association name" />
            </div>
          </FormSection>

          <FormSection index="2" title="Contact Information">
            <div>
              <label className={ds.label}>Contact Person</label>
              <input type="text" name="contact_person" value={formData.contact_person} onChange={handleInputChange} className={ds.input} placeholder="Full name" />
            </div>
            <div>
              <label className={ds.label}>Position</label>
              <input type="text" name="position" value={formData.position} onChange={handleInputChange} className={ds.input} placeholder="Position/Role" />
            </div>
            <div>
              <label className={ds.label}>Sex</label>
              <div className="flex items-center gap-4 py-2.5">
                <label className="flex items-center gap-2 text-sm text-[#2A241C]">
                  <input type="checkbox" name="sex_female" checked={formData.sex_female} onChange={handleInputChange} className="h-4 w-4 accent-[#7C2E2E] rounded" />
                  Female
                </label>
                <label className="flex items-center gap-2 text-sm text-[#2A241C]">
                  <input type="checkbox" name="sex_male" checked={formData.sex_male} onChange={handleInputChange} className="h-4 w-4 accent-[#4A5F73] rounded" />
                  Male
                </label>
              </div>
            </div>
            <div>
              <label className={ds.label}>Contact Number</label>
              <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleInputChange} className={`${ds.input} ${ds.mono}`} placeholder="Phone number" />
            </div>
            <div className="md:col-span-2">
              <label className={ds.label}>Email Address</label>
              <input type="email" name="email_address" value={formData.email_address} onChange={handleInputChange} className={ds.input} placeholder="email@example.com" />
            </div>
          </FormSection>

          <FormSection index="3" title="Location & Scope">
            <div>
              <label className={ds.label}>No. of Members</label>
              <input type="text" name="no_of_members" value={formData.no_of_members} onChange={handleInputChange} className={ds.input} placeholder="e.g., 45; F:17; M:28" />
            </div>
            <div className="md:col-span-2">
              <label className={ds.label}>Address *</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className={ds.input} placeholder="Full address including province" />
            </div>
            <div>
              <label className={ds.label}>Province</label>
              <select name="province" value={formData.province} onChange={handleInputChange} className={`${ds.select} w-full`}>
                <option value="">Select Province</option>{MIMAROPA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={ds.label}>Region</label>
              <select name="region" value={formData.region} onChange={handleInputChange} className={`${ds.select} w-full`}>
                <option value="MIMAROPA">MIMAROPA</option><option value="Other">Other Region</option>
              </select>
            </div>
            <div>
              <label className={ds.label}>Scope</label>
              <select name="scope" value={formData.scope} onChange={handleInputChange} className={`${ds.select} w-full`}>
                <option value="Regional">Regional</option><option value="National">National</option><option value="Local">Local</option>
              </select>
            </div>
          </FormSection>

          <FormSection index="4" title="Accreditation Details">
            <div className="md:col-span-2">
              <label className={ds.label}>Nature of Services</label>
              <textarea name="nature_of_services" value={formData.nature_of_services} onChange={handleInputChange} rows="2" className={ds.input} placeholder="Describe the nature of services provided" />
            </div>
            <div>
              <label className={ds.label}>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className={`${ds.select} w-full`}>
                <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option><option value="Suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className={ds.label}>Accreditation No.</label>
              <input type="text" name="accreditation_no" value={formData.accreditation_no} onChange={handleInputChange} className={`${ds.input} ${ds.mono}`} placeholder="DA-MIMAROPA CSO ACRN No. XXXX-XXX" />
            </div>
            <div>
              <label className={ds.label}>Date of Issuance</label>
              <input type="date" name="date_of_issuance" value={formData.date_of_issuance} onChange={handleInputChange} className={`${ds.input} ${ds.mono}`} />
            </div>
            <div>
              <label className={ds.label}>Date of Expiration</label>
              <input type="date" name="date_of_expiration" value={formData.date_of_expiration} onChange={handleInputChange} className={`${ds.input} ${ds.mono}`} />
            </div>
            <div className="md:col-span-3">
              <label className={ds.label}>Certificate Link (Google Drive)</label>
              <input type="url" name="certificate_of_accreditation" value={formData.certificate_of_accreditation} onChange={handleInputChange} className={`${ds.input} ${ds.mono}`} placeholder="https://drive.google.com/file/d/..." />
              {formData.certificate_of_accreditation && (
                <a href={formData.certificate_of_accreditation} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-2 text-xs font-semibold text-[#4A5F73] hover:text-[#374757]">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />Test link
                </a>
              )}
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowAddModal(false); setFormData(initialFormState); setEditingId(null); }} className={ds.btnSecondary}>Cancel</button>
            <button type="submit" className={ds.btnPrimary}>{editingId ? 'Update Record' : 'Create Record'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="CSO Details" size="lg">
        {selectedCSO && (
          <div className="space-y-5">
            <div className={`${ds.cardBase} p-6 bg-[#F1EADA]/50`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className={`text-2xl font-bold text-[#2A241C] ${ds.display}`}>{selectedCSO.name_of_association}</h2>
                  <div className="flex flex-wrap items-center mt-3 gap-2">
                    <span className={`bg-white border border-[#DED2B4] px-2.5 py-1 rounded text-xs font-semibold ${ds.mono} text-[#5B5340]`}>No. {selectedCSO.no}</span>
                    <StatusStamp status={selectedCSO.status} />
                    <ScopeTag scope={selectedCSO.scope} />
                  </div>
                </div>
                {selectedCSO.certificate_of_accreditation && (
                  <a href={selectedCSO.certificate_of_accreditation} target="_blank" rel="noopener noreferrer" className={ds.btnSuccess + ' flex-shrink-0'}>
                    <ExternalLink className="h-4 w-4" />View Certificate
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${ds.cardBase} p-5`}>
                <h3 className={`font-semibold mb-3.5 flex items-center gap-2 text-[#2A241C] text-sm uppercase tracking-wide ${ds.mono}`}>
                  <User className="h-4 w-4 text-[#4A5F73]" />Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-[#8B7F63]">Contact Person:</span> <span className="text-[#2A241C]">{selectedCSO.contact_person || '—'}</span></p>
                  <p><span className="text-[#8B7F63]">Position:</span> <span className="text-[#2A241C]">{selectedCSO.position || '—'}</span></p>
                  <p><span className="text-[#8B7F63]">Sex:</span> <span className="text-[#2A241C]">{selectedCSO.sex_female ? 'Female' : selectedCSO.sex_male ? 'Male' : '—'}</span></p>
                  <p><span className="text-[#8B7F63]">Contact Number:</span> <span className={`text-[#2A241C] ${ds.mono}`}>{selectedCSO.contact_number || '—'}</span></p>
                  <p><span className="text-[#8B7F63]">Email:</span> <span className="text-[#2A241C]">{selectedCSO.email_address || '—'}</span></p>
                </div>
              </div>
              <div className={`${ds.cardBase} p-5`}>
                <h3 className={`font-semibold mb-3.5 flex items-center gap-2 text-[#2A241C] text-sm uppercase tracking-wide ${ds.mono}`}>
                  <MapPin className="h-4 w-4 text-[#3F6B4C]" />Location & Members
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-[#8B7F63]">Address:</span> <span className="text-[#2A241C]">{selectedCSO.address || '—'}</span></p>
                  <p><span className="text-[#8B7F63]">Province:</span> <span className="text-[#2A241C]">{selectedCSO.province || '—'}</span></p>
                  <p><span className="text-[#8B7F63]">Region:</span> <span className="text-[#2A241C]">{selectedCSO.region || 'MIMAROPA'}</span></p>
                  <p><span className="text-[#8B7F63]">No. of Members:</span> <span className={`text-[#2A241C] ${ds.mono}`}>{selectedCSO.no_of_members || '0'}</span></p>
                </div>
              </div>
              <div className={`md:col-span-2 ${ds.cardBase} p-5`}>
                <h3 className={`font-semibold mb-3.5 flex items-center gap-2 text-[#2A241C] text-sm uppercase tracking-wide ${ds.mono}`}>
                  <Shield className="h-4 w-4 text-[#9A6B1F]" />Accreditation Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><span className="text-[#8B7F63]">Accreditation No.:</span> <span className={`text-[#2A241C] ${ds.mono}`}>{selectedCSO.accreditation_no || '—'}</span></p>
                    <p><span className="text-[#8B7F63]">Date of Issuance:</span> <span className={`text-[#2A241C] ${ds.mono}`}>{selectedCSO.date_of_issuance ? new Date(selectedCSO.date_of_issuance).toLocaleDateString() : '—'}</span></p>
                    <p>
                      <span className="text-[#8B7F63]">Date of Expiration:</span>{' '}
                      <span className={`${ds.mono} ${isExpiringSoon(selectedCSO.date_of_expiration) ? 'text-[#9A6B1F] font-semibold' : 'text-[#2A241C]'}`}>
                        {selectedCSO.date_of_expiration ? new Date(selectedCSO.date_of_expiration).toLocaleDateString() : '—'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className={`md:col-span-2 ${ds.cardBase} p-5`}>
                <h3 className={`font-semibold mb-3 text-[#2A241C] text-sm uppercase tracking-wide ${ds.mono}`}>Nature of Services</h3>
                <div className="bg-[#F1EADA]/50 rounded-lg p-4 border border-[#EAE2CB]">
                  <p className="text-[#3D362A] whitespace-pre-line text-sm leading-relaxed">{selectedCSO.nature_of_services || 'No services specified'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-[#DED2B4]">
              <button onClick={() => { setShowViewModal(false); handleEdit(selectedCSO); }} className={ds.btnPrimary}><Edit className="h-4 w-4" />Edit</button>
              <button onClick={() => { setShowViewModal(false); openDeleteModal(selectedCSO); }} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C2E2E]/10 text-[#7C2E2E] border border-[#7C2E2E]/30 text-sm font-semibold rounded-md hover:bg-[#7C2E2E]/15 transition-colors duration-150"><Trash2 className="h-4 w-4" />Delete</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion" size="sm">
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-[#7C2E2E]/10 mb-4">
            <Trash2 className="h-7 w-7 text-[#7C2E2E]" />
          </div>
          <h3 className={`text-xl font-semibold text-[#2A241C] mb-2 ${ds.display}`}>Delete CSO Record</h3>
          <p className="text-[#6B6350] mb-6 text-sm">
            Are you sure you want to delete <span className="font-semibold text-[#2A241C]">{selectedCSO?.name_of_association}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setShowDeleteModal(false)} className={ds.btnSecondary}>Cancel</button>
            <button onClick={handleDelete} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7C2E2E] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-[#692525] transition-colors duration-150">Delete Record</button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import from Excel" size="md">
        <div className="space-y-5">
          <div className={`${ds.cardBase} p-5 bg-[#4A5F73]/[0.04]`}>
            <h4 className={`font-semibold text-[#2A241C] mb-3 text-sm uppercase tracking-wide ${ds.mono}`}>Import Instructions</h4>
            <ul className="space-y-2 text-sm text-[#3D362A]">
              <li className="flex items-start gap-2"><Check className="h-4 w-4 text-[#3F6B4C] mt-0.5 flex-shrink-0" />Use the Excel export template for correct formatting</li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 text-[#3F6B4C] mt-0.5 flex-shrink-0" />Required columns: No. and Name of Association</li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 text-[#3F6B4C] mt-0.5 flex-shrink-0" />Existing records with matching No. will be updated</li>
            </ul>
          </div>
          <div className="border-2 border-dashed border-[#D8CDAE] rounded-lg p-8 text-center bg-[#FBF8EF]">
            {importFile ? (
              <div className="space-y-4">
                <div>
                  <FileText className="h-10 w-10 text-[#4A5F73] mx-auto" strokeWidth={1.5} />
                  <p className="font-medium text-[#2A241C] mt-2">{importFile.name}</p>
                  <p className={`text-xs text-[#8B7F63] ${ds.mono}`}>{(importFile.size / 1024).toFixed(2)} KB</p>
                </div>
                {importProgress > 0 && (
                  <div>
                    <div className="w-full bg-[#E9E1CC] rounded-full h-2 overflow-hidden">
                      <div className="bg-[#3F6B4C] h-2 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                    </div>
                    <p className={`text-xs text-[#8B7F63] mt-2 ${ds.mono}`}>Importing… {importProgress}%</p>
                  </div>
                )}
                <div className="flex justify-center gap-3">
                  <button onClick={() => setImportFile(null)} className={ds.btnSecondary + ' !px-4 !py-2 text-xs'}>Remove File</button>
                  <button onClick={handleImport} disabled={importProgress > 0} className={ds.btnSuccess + ' !px-4 !py-2 text-xs'}>Start Import</button>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 text-[#AFA588] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#3D362A] mb-1 text-sm">Drag & drop your Excel file here</p>
                <p className="text-xs text-[#AFA588] mb-5">or</p>
                <label className={ds.btnPrimary + ' cursor-pointer'}>
                  <Upload className="h-4 w-4" />Browse Files
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { if (e.target.files && e.target.files[0]) setImportFile(e.target.files[0]); }} className="hidden" />
                </label>
                <p className="text-[11px] text-[#AFA588] mt-4">Supports .xlsx, .xls, .csv files</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Accredited;