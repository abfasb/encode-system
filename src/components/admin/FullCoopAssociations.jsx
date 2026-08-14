import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FiUsers,
  FiMapPin,
  FiFilter,
  FiSearch,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiPrinter,
  FiEdit2,
  FiHome,
  FiTrash2,
  FiUploadCloud,
  FiPlus,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiSave,
  FiGlobe,
  FiUpload,
  FiFileText,
  FiPackage,
  FiArrowLeft,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiActivity,
  FiUser,
  FiClock,
  FiEye,
  FiLogIn,
  FiEdit,
  FiTrash,
  FiDatabase,
  FiUsers as FiMembers,
  FiTag,
  FiBook,
  FiBriefcase,
  FiDollarSign,
  FiSliders,
  FiLayers,
} from "react-icons/fi";
import { collection, getDocs, doc, setDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import * as XLSX from 'xlsx';

/* =========================================================================
   DESIGN SYSTEM
   Centralized tokens & style helpers used throughout this file so every
   surface (cards, inputs, buttons, badges, tables, modals) stays visually
   consistent. Nothing here changes data/behavior — presentation only.
   ========================================================================= */

const ds = {
  page: "min-h-screen bg-slate-50",
  card: "bg-white rounded-2xl border border-slate-200 shadow-sm",
  cardHeader: "px-6 py-5 border-b border-slate-100",
  sectionTitle: "text-[15px] font-semibold text-slate-900 tracking-tight",
  sectionSubtitle: "text-sm text-slate-500 mt-0.5",
  label: "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5",
  input:
    "w-full text-slate-900 placeholder-slate-400 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400",
  select:
    "w-full text-slate-900 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 appearance-none",
  checkbox: "h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/40 cursor-pointer",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm transition-all duration-150 disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-sm transition-all duration-150",
  btnGhost:
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all duration-150",
  btnIcon:
    "p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all duration-150",
  modalOverlay:
    "fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fadeIn",
  modalShell: "bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full animate-slideUp",
  modalHeader: "px-7 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-2xl bg-white sticky top-0 z-10",
  modalFooter: "px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl sticky bottom-0",
};

const Badge = ({ tone = "neutral", children, icon: Icon }) => {
  const tones = {
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-rose-50 text-rose-600 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${tones[tone]}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

const SectionLegend = ({ children }) => (
  <h4 className="text-sm font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
    {children}
  </h4>
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
    {children} {required && <span className="text-rose-500 normal-case font-medium">*</span>}
  </label>
);

const ViewField = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm text-slate-900 font-medium">{value || "—"}</p>
  </div>
);

// ---------- Helper: Normalize string (trim, title case) ----------
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ---------- Helper: Normalize province name ----------
const normalizeProvince = (prov) => normalizeString(prov);

// ---------- Helper: Format date ----------
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ---------- Helper: Parse intervention amount string to number ----------
const parseAmount = (amountStr) => {
  if (!amountStr || amountStr === "-") return 0;
  const cleaned = amountStr.toString().replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// ---------- Helper: Parse total members from no_of_members string (CSO format) ----------
const parseTotalMembersFromString = (memberStr) => {
  if (!memberStr) return 0;
  const str = memberStr.toString();
  const totalMatch = str.match(/(\d+[\d,]*)\s*(?:members?|total|:)/i);
  if (totalMatch) return parseInt(totalMatch[1].replace(/,/g, ''), 10);
  const justNumber = str.match(/^(\d+)/);
  if (justNumber) return parseInt(justNumber[1], 10);
  return 0;
};

// ---------- Helper: Parse address to extract municipality and province ----------
const parseAddressToLocation = (address) => {
  if (!address) return { municipality: '', province: '' };
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return {
      municipality: parts[parts.length - 2],
      province: parts[parts.length - 1]
    };
  } else if (parts.length === 1) {
    return { municipality: '', province: parts[0] };
  }
  return { municipality: '', province: '' };
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

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-sm text-slate-500 font-medium">{message}</p>
  </div>
);

// Memoized Table Row Component
const MemoizedTableRow = React.memo(({
  item,
  index,
  openEditModal,
  openDeleteModal,
  openViewModal,
  isDifferentlyAbledEmpty,
  isRegistrationEmpty,
  isReadOnly
}) => {
  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    if (isReadOnly) {
      alert(`${item.source === 'rcef' ? 'RCEF' : 'CSO'} records cannot be edited here. Please use the respective module.`);
      return;
    }
    openEditModal(item);
  }, [openEditModal, item, isReadOnly]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    if (isReadOnly) {
      alert(`${item.source === 'rcef' ? 'RCEF' : 'CSO'} records cannot be deleted here. Please use the respective module.`);
      return;
    }
    openDeleteModal(item);
  }, [openDeleteModal, item, isReadOnly]);

  const handleViewClick = useCallback((e) => {
    e.stopPropagation();
    openViewModal(item);
  }, [openViewModal, item]);

  const renderCheck = (value) =>
    value ? (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600">
        <FiCheckCircle className="w-3.5 h-3.5" />
      </span>
    ) : (
      <span className="text-slate-300">—</span>
    );

  const renderAccreditationPeriods = () => {
    if (item.accreditationPeriods && item.accreditationPeriods.length > 0) {
      return (
        <div className="text-xs space-y-1">
          {item.accreditationPeriods.map((period, idx) => (
            <div key={idx} className="text-slate-600 whitespace-nowrap">
              {formatDate(period.date_accredited)} <span className="text-slate-300">→</span> {formatDate(period.date_expiration)}
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-slate-300">—</span>;
  };

  return (
    <tr
      onClick={handleViewClick}
      className="group hover:bg-emerald-50/40 transition-colors duration-150 cursor-pointer"
    >
      <td className="px-4 py-3.5 whitespace-nowrap text-center text-xs font-semibold text-slate-400 border-r border-slate-100">
        {index}
      </td>
      <td className="px-4 py-3.5 border-r border-slate-100 min-w-48">
        <div className="text-sm font-semibold text-slate-900 truncate" title={item.name || ""}>
          {item.name || ""}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <FiMapPin className="w-3 h-3" />
          {item.province} • {item.municipality}
        </div>
      </td>
      <td className="px-4 py-3.5 border-r border-slate-100 min-w-48">
        <div className="text-sm text-slate-600 truncate" title={item.address || ""}>
          {item.address || ""}
        </div>
      </td>
      <td className={`px-4 py-3.5 whitespace-nowrap border-r border-slate-100 min-w-40 ${isRegistrationEmpty(item.registration_type) ? 'bg-amber-50/60' : ''}`}>
        <div className="text-sm text-slate-700">{item.registration_type || <span className="text-amber-600 text-xs font-medium">Not specified</span>}</div>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-700 border-r border-slate-100 min-w-40 truncate" title={item.president || ""}>
        {item.president || ""}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-sm border-r border-slate-100 min-w-32">
        {item.contact_number ? (
          <a href={`tel:${item.contact_number}`} onClick={(e) => e.stopPropagation()} className="text-emerald-600 hover:text-emerald-800 font-medium">
            {item.contact_number}
          </a>
        ) : (
          <span className="text-slate-300">Not provided</span>
        )}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm text-slate-700 border-r border-slate-100">
        <span className="font-semibold">{item.members?.male || ""}</span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm text-slate-700 border-r border-slate-100">
        <span className="font-semibold">{item.members?.female || ""}</span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm text-slate-700 border-r border-slate-100">
        <span className="font-semibold">{item.members?.senior_citizen || ""}</span>
      </td>
      <td className={`px-4 py-3.5 whitespace-nowrap text-center text-sm text-slate-700 border-r border-slate-100 ${isDifferentlyAbledEmpty(item.members) ? 'bg-amber-50/60' : ''}`}>
        <span className="font-semibold">
          {Number(item.members?.differently_abled) === 0 ? "" : item.members?.differently_abled}
        </span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm text-slate-700 border-r border-slate-100">
        <span className="font-semibold">{item.members?.young_farmer || ""}</span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm text-slate-700 border-r border-slate-100">
        <span className="font-semibold">{item.members?.ips || ""}</span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-700 border-r border-slate-100 min-w-32 truncate" title={item.commodity || ""}>
        {item.commodity || <span className="text-slate-300">Not specified</span>}
      </td>

      {/* Group Categories checkmarks */}
      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {renderCheck(item.groupCategories?.womenLed)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {renderCheck(item.groupCategories?.menLed)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {renderCheck(item.groupCategories?.seniorCitizensGroup)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {renderCheck(item.groupCategories?.personsWithDisabilitiesGroup)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {renderCheck(item.groupCategories?.youngFarmersOrganization)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {renderCheck(item.groupCategories?.indigenousPeoplesAssociation)}
      </td>

      {/* Intervention columns */}
      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-700 border-r border-slate-100 min-w-32 truncate" title={item.specificIntervention || ""}>
        {item.specificIntervention || <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-700 border-r border-slate-100 min-w-24">
        {item.interventionAmount || <span className="text-slate-300">—</span>}
      </td>

      {/* Accreditation Periods column */}
      <td className="px-4 py-3.5 text-sm text-slate-700 border-r border-slate-100 min-w-48">
        {renderAccreditationPeriods()}
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {item.status === "Active" && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">
              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-100">
        {item.status === "Inactive" && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-rose-100 rounded-full">
              <FiXCircle className="w-3.5 h-3.5 text-rose-500" />
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-150">
          <button onClick={handleViewClick} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-150" title="View Details">
            <FiEye className="w-4 h-4" />
          </button>
          <button onClick={handleEditClick} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-150" title="Edit Association">
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button onClick={handleDeleteClick} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-150" title="Delete Association">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

// Pagination Component
const Pagination = ({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange }) => {
  const maxVisiblePages = 5;
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);
    if (end - start + 1 < maxVisiblePages) start = Math.max(end - maxVisiblePages + 1, 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 md:px-6 py-4 bg-white border-t border-slate-100">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Rows per page</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            className="text-sm text-slate-700 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
        <span className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> entries
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={`p-2 rounded-lg transition-colors duration-150 ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FiChevronLeft className="w-4 h-4" /><FiChevronLeft className="w-4 h-4 -ml-3" />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-2 rounded-lg transition-colors duration-150 ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FiChevronLeft className="w-4 h-4" />
        </button>
        {pageNumbers.map(number => (
          <button key={number} onClick={() => onPageChange(number)} className={`min-w-[2.25rem] h-9 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-150 ${currentPage === number ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {number}
          </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-colors duration-150 ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FiChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-colors duration-150 ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FiChevronRight className="w-4 h-4" /><FiChevronRight className="w-4 h-4 -ml-3" />
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function FullCoopAssociations() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    province: "",
    municipality: "",
    status: "",
    registrationType: "",
    commodity: "",
    searchTerm: "",
    womenLed: false,
    menLed: false,
    seniorCitizensGroup: false,
    personsWithDisabilitiesGroup: false,
    youngFarmersOrganization: false,
    indigenousPeoplesAssociation: false,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMunicipalityModalOpen, setIsMunicipalityModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [selectedViewAssociation, setSelectedViewAssociation] = useState(null);
  const [newAssociation, setNewAssociation] = useState({
    name: "",
    province: "",
    municipality: "",
    address: "",
    registration_type: "",
    president: "",
    contact_number: "",
    members: {
      male: "",
      female: "",
      senior_citizen: "",
      differently_abled: "",
      young_farmer: "",
      ips: ""
    },
    commodity: "",
    status: { active: "P", inactive: null },
    groupCategories: {
      womenLed: false,
      menLed: false,
      seniorCitizensGroup: false,
      personsWithDisabilitiesGroup: false,
      youngFarmersOrganization: false,
      indigenousPeoplesAssociation: false,
    },
    interventionReviewed: false,
    specificIntervention: "",
    interventionAmount: ""
  });
  const [provincesData, setProvincesData] = useState([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [municipalityForImport, setMunicipalityForImport] = useState("");
  const [provinceForImport, setProvinceForImport] = useState("");
  const [importStatus, setImportStatus] = useState({ loading: false, message: "", success: false, error: false });
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayedData, setDisplayedData] = useState([]);
  const tableRef = useRef(null);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const totalInterventionAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + parseAmount(item.interventionAmount), 0);
  }, [filteredData]);

  const totalPages = useMemo(() => Math.ceil(filteredData.length / itemsPerPage), [filteredData.length, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filters, debouncedSearchTerm, sortConfig]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    setDisplayedData(filteredData.slice(startIndex, startIndex + itemsPerPage));
  }, [filteredData, currentPage, itemsPerPage]);

  const uniqueProvinces = useMemo(() => [...new Set(data.map(item => item.province).filter(Boolean))].sort(), [data]);
  const uniqueMunicipalities = useMemo(() => [...new Set(data.map(item => item.municipality).filter(Boolean))].sort(), [data]);
  const uniqueRegistrationTypes = useMemo(() => [...new Set(data.map(item => item.registration_type).filter(Boolean))].sort(), [data]);
  const uniqueCommodities = useMemo(() => [...new Set(data.map(item => item.commodity).filter(Boolean))].sort(), [data]);

  // ---------------------------
  // DATA FETCHING & DEDUPLICATION (by name only)
  // ---------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const daSnapshot = await getDocs(collection(db, "da-encode"));
      const rcefSnapshot = await getDocs(collection(db, "rcef"));
      const csoSnapshot = await getDocs(collection(db, "cso"));

      const allRecords = [];

      // Process da-encode records
      for (const doc of daSnapshot.docs) {
        const docData = doc.data();
        const provinceName = docData.province || "";
        if (provinceName && docData.municipalities && Array.isArray(docData.municipalities)) {
          docData.municipalities.forEach(municipality => {
            if (municipality.associations && Array.isArray(municipality.associations)) {
              municipality.associations.forEach((association, assocIndex) => {
                let status = "Inactive";
                if (association.status) {
                  if (association.status.active === "P") status = "Active";
                  else if (association.status.inactive === "P") status = "Inactive";
                }
                const members = {
                  male: association.members?.male || "",
                  female: association.members?.female || "",
                  senior_citizen: association.members?.senior_citizen || "",
                  differently_abled: association.members?.differently_abled || "",
                  young_farmer: association.members?.young_farmer || "",
                  ips: association.members?.ips || ""
                };
                allRecords.push({
                  id: `${doc.id}_${municipality.municipality || municipality.name || "unknown"}_${assocIndex}_${Date.now()}`,
                  firestoreId: doc.id,
                  provinceDocId: doc.id,
                  municipalityIndex: docData.municipalities.findIndex(m => (m.municipality || m.name) === (municipality.municipality || municipality.name)),
                  associationIndex: assocIndex,
                  source: "da-encode",
                  province: provinceName,
                  municipality: municipality.municipality || municipality.name || "",
                  name: association.name || "",
                  address: association.address || "",
                  registration_type: association.registration_type || "",
                  president: association.president || "",
                  contact_number: association.contact_number || "",
                  members: members,
                  commodity: association.commodity || "",
                  status: status,
                  groupCategories: association.groupCategories || {
                    womenLed: false,
                    menLed: false,
                    seniorCitizensGroup: false,
                    personsWithDisabilitiesGroup: false,
                    youngFarmersOrganization: false,
                    indigenousPeoplesAssociation: false,
                  },
                  interventionReviewed: association.interventionReviewed || false,
                  specificIntervention: association.specificIntervention || "",
                  interventionAmount: association.interventionAmount || "",
                  accreditationPeriods: [],
                  interventions: { seeds: false, mech: false, credit: false, extn: false }
                });
              });
            }
          });
        }
      }

      // Process rcef records
      rcefSnapshot.forEach(doc => {
        const record = doc.data();
        allRecords.push({
          id: doc.id,
          source: "rcef",
          province: record.province || "",
          municipality: record.municipality || "",
          name: record.name || "",
          address: record.address || "",
          registration_type: record.type_fca || "",
          president: record.contact_person || "",
          contact_number: record.contact_no || "",
          members: {
            male: record.male_members || "",
            female: record.female_members || "",
            senior_citizen: "",
            differently_abled: "",
            young_farmer: "",
            ips: ""
          },
          commodity: "",
          status: "Active",
          groupCategories: {
            womenLed: false,
            menLed: false,
            seniorCitizensGroup: false,
            personsWithDisabilitiesGroup: false,
            youngFarmersOrganization: false,
            indigenousPeoplesAssociation: false,
          },
          interventionReviewed: false,
          specificIntervention: "",
          interventionAmount: "",
          accreditationPeriods: [{
            date_accredited: record.date_accredited,
            date_expiration: record.date_expiration
          }],
          interventions: record.interventions || { seeds: false, mech: false, credit: false, extn: false }
        });
      });

      // Process cso records
      csoSnapshot.forEach(doc => {
        const record = doc.data();
        const { municipality, province } = parseAddressToLocation(record.address || '');
        const finalProvince = record.province || province;
        const finalMunicipality = record.municipality || municipality;
        const totalMembers = parseTotalMembersFromString(record.no_of_members);
        allRecords.push({
          id: doc.id,
          source: "cso",
          province: finalProvince,
          municipality: finalMunicipality,
          name: record.name_of_association || "",
          address: record.address || "",
          registration_type: "CSO Accredited",
          president: record.contact_person || "",
          contact_number: record.contact_number || "",
          members: {
            male: "",
            female: "",
            senior_citizen: "",
            differently_abled: "",
            young_farmer: "",
            ips: "",
            cso_total_members: totalMembers
          },
          commodity: "",
          status: record.status === "Active" ? "Active" : "Inactive",
          groupCategories: {
            womenLed: false,
            menLed: false,
            seniorCitizensGroup: false,
            personsWithDisabilitiesGroup: false,
            youngFarmersOrganization: false,
            indigenousPeoplesAssociation: false,
          },
          interventionReviewed: false,
          specificIntervention: "",
          interventionAmount: "",
          accreditationPeriods: [{
            date_accredited: record.date_of_issuance,
            date_expiration: record.date_of_expiration
          }],
          interventions: { seeds: false, mech: false, credit: false, extn: false }
        });
      });

      // ---------- DEDUPLICATION: Group by normalized name only ----------
      const nameGroups = new Map(); // key: normalized name, value: array of records

      allRecords.forEach(record => {
        const normalizedName = normalizeString(record.name);
        if (!normalizedName) return; // skip nameless
        if (!nameGroups.has(normalizedName)) {
          nameGroups.set(normalizedName, []);
        }
        nameGroups.get(normalizedName).push(record);
      });

      const mergedGroups = [];

      for (const [normalizedName, records] of nameGroups.entries()) {
        // Determine best province and municipality (most frequent non-empty)
        const provinceCounts = new Map();
        const municipalityCounts = new Map();
        let bestProvince = '';
        let bestMunicipality = '';

        records.forEach(rec => {
          if (rec.province) {
            const normProv = normalizeProvince(rec.province);
            provinceCounts.set(normProv, (provinceCounts.get(normProv) || 0) + 1);
          }
          if (rec.municipality) {
            const normMun = normalizeString(rec.municipality);
            municipalityCounts.set(normMun, (municipalityCounts.get(normMun) || 0) + 1);
          }
        });

        if (provinceCounts.size > 0) {
          bestProvince = [...provinceCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];
        }
        if (municipalityCounts.size > 0) {
          bestMunicipality = [...municipalityCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];
        }

        // Merge all records under this name
        const merged = {
          id: normalizedName,
          name: normalizedName,
          province: bestProvince,
          municipality: bestMunicipality,
          address: '',
          registration_type: '',
          president: '',
          contact_number: '',
          members: { male: 0, female: 0, senior_citizen: 0, differently_abled: 0, young_farmer: 0, ips: 0, cso_total_members: 0 },
          totalMembers: 0,
          commodity: '',
          status: 'Active',
          groupCategories: { womenLed: false, menLed: false, seniorCitizensGroup: false, personsWithDisabilitiesGroup: false, youngFarmersOrganization: false, indigenousPeoplesAssociation: false },
          interventionReviewed: false,
          specificIntervention: '',
          interventionAmount: '',
          accreditationPeriods: [],
          interventions: { seeds: false, mech: false, credit: false, extn: false },
          sourceRecords: records,
          source: records[0].source // primary source for display
        };

        // Aggregate members and categories
        records.forEach(rec => {
          merged.members.male += parseInt(rec.members?.male) || 0;
          merged.members.female += parseInt(rec.members?.female) || 0;
          merged.members.senior_citizen += parseInt(rec.members?.senior_citizen) || 0;
          merged.members.differently_abled += parseInt(rec.members?.differently_abled) || 0;
          merged.members.young_farmer += parseInt(rec.members?.young_farmer) || 0;
          merged.members.ips += parseInt(rec.members?.ips) || 0;
          if (rec.members?.cso_total_members) {
            merged.members.cso_total_members += rec.members.cso_total_members;
          }

          if (rec.groupCategories) {
            merged.groupCategories.womenLed = merged.groupCategories.womenLed || rec.groupCategories.womenLed;
            merged.groupCategories.menLed = merged.groupCategories.menLed || rec.groupCategories.menLed;
            merged.groupCategories.seniorCitizensGroup = merged.groupCategories.seniorCitizensGroup || rec.groupCategories.seniorCitizensGroup;
            merged.groupCategories.personsWithDisabilitiesGroup = merged.groupCategories.personsWithDisabilitiesGroup || rec.groupCategories.personsWithDisabilitiesGroup;
            merged.groupCategories.youngFarmersOrganization = merged.groupCategories.youngFarmersOrganization || rec.groupCategories.youngFarmersOrganization;
            merged.groupCategories.indigenousPeoplesAssociation = merged.groupCategories.indigenousPeoplesAssociation || rec.groupCategories.indigenousPeoplesAssociation;
          }

          if (rec.interventions) {
            merged.interventions.seeds = merged.interventions.seeds || rec.interventions.seeds;
            merged.interventions.mech = merged.interventions.mech || rec.interventions.mech;
            merged.interventions.credit = merged.interventions.credit || rec.interventions.credit;
            merged.interventions.extn = merged.interventions.extn || rec.interventions.extn;
          }

          if (rec.accreditationPeriods && rec.accreditationPeriods.length) {
            merged.accreditationPeriods.push(...rec.accreditationPeriods);
          }

          // Take first non-empty for text fields
          if (!merged.address && rec.address) merged.address = rec.address;
          if (!merged.registration_type && rec.registration_type) merged.registration_type = rec.registration_type;
          if (!merged.president && rec.president) merged.president = rec.president;
          if (!merged.contact_number && rec.contact_number) merged.contact_number = rec.contact_number;
          if (!merged.commodity && rec.commodity) merged.commodity = rec.commodity;
        });

        merged.totalMembers = merged.members.male + merged.members.female + merged.members.senior_citizen + merged.members.differently_abled + merged.members.young_farmer + merged.members.ips + merged.members.cso_total_members;
        merged.specificIntervention = Object.entries(merged.interventions).filter(([k,v]) => v).map(([k]) => k).join(', ');
        merged.status = records.some(r => r.status === "Active") ? "Active" : "Inactive";

        mergedGroups.push(merged);
      }

      mergedGroups.sort((a, b) => a.name.localeCompare(b.name));
      setData(mergedGroups);
      setFilteredData(mergedGroups);
      setCurrentPage(1);

      // Build provincesData for municipality dropdown (from da-encode only, for editing)
      const provincesList = [];
      for (const doc of daSnapshot.docs) {
        const docData = doc.data();
        const provinceName = docData.province || "";
        if (provinceName) {
          provincesList.push({
            id: doc.id,
            name: provinceName,
            municipalities: docData.municipalities || []
          });
        }
      }
      setProvincesData(provincesList);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ---------- Filtering & Sorting ----------
  useEffect(() => {
    if (!data.length) return;
    setIsFiltering(true);
    requestAnimationFrame(() => {
      let result = [...data];
      if (filters.province) result = result.filter(item => item.province.toLowerCase() === filters.province.toLowerCase());
      if (filters.municipality) result = result.filter(item => item.municipality.toLowerCase() === filters.municipality.toLowerCase());
      if (filters.status) result = result.filter(item => item.status.toLowerCase() === filters.status.toLowerCase());
      if (filters.registrationType) result = result.filter(item => item.registration_type?.toLowerCase().includes(filters.registrationType.toLowerCase()));
      if (filters.commodity) result = result.filter(item => item.commodity?.toLowerCase().includes(filters.commodity.toLowerCase()));
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase();
        result = result.filter(item =>
          item.name?.toLowerCase().includes(term) ||
          item.president?.toLowerCase().includes(term) ||
          item.address?.toLowerCase().includes(term) ||
          item.commodity?.toLowerCase().includes(term) ||
          item.municipality?.toLowerCase().includes(term)
        );
      }
      if (filters.womenLed) result = result.filter(item => item.groupCategories?.womenLed === true);
      if (filters.menLed) result = result.filter(item => item.groupCategories?.menLed === true);
      if (filters.seniorCitizensGroup) result = result.filter(item => item.groupCategories?.seniorCitizensGroup === true);
      if (filters.personsWithDisabilitiesGroup) result = result.filter(item => item.groupCategories?.personsWithDisabilitiesGroup === true);
      if (filters.youngFarmersOrganization) result = result.filter(item => item.groupCategories?.youngFarmersOrganization === true);
      if (filters.indigenousPeoplesAssociation) result = result.filter(item => item.groupCategories?.indigenousPeoplesAssociation === true);

      if (sortConfig.key) {
        result.sort((a, b) => {
          let aVal, bVal;
          if (sortConfig.key.startsWith('members.')) {
            const key = sortConfig.key.split('.')[1];
            aVal = a.members?.[key] || 0;
            bVal = b.members?.[key] || 0;
          } else if (sortConfig.key.startsWith('groupCategories.')) {
            const key = sortConfig.key.split('.')[1];
            aVal = a.groupCategories?.[key] ? 1 : 0;
            bVal = b.groupCategories?.[key] ? 1 : 0;
          } else {
            aVal = a[sortConfig.key];
            bVal = b[sortConfig.key];
          }
          if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
          } else if (typeof aVal === 'string' && typeof bVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        });
      }
      setFilteredData(result);
      setIsFiltering(false);
    });
  }, [filters, data, sortConfig, debouncedSearchTerm]);

  // ---------- Helper functions for actions (only for da-encode records) ----------
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      province: "",
      municipality: "",
      status: "",
      registrationType: "",
      commodity: "",
      searchTerm: "",
      womenLed: false,
      menLed: false,
      seniorCitizensGroup: false,
      personsWithDisabilitiesGroup: false,
      youngFarmersOrganization: false,
      indigenousPeoplesAssociation: false,
    });
    setSortConfig({ key: null, direction: 'ascending' });
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FiChevronUp className="opacity-20 w-3.5 h-3.5" />;
    return sortConfig.direction === 'ascending' ? <FiChevronUp className="text-emerald-600 w-3.5 h-3.5" /> : <FiChevronDown className="text-emerald-600 w-3.5 h-3.5" />;
  };

  const getOriginalDaEncodeRecord = (groupedItem) => {
    return groupedItem.sourceRecords?.find(r => r.source === "da-encode");
  };

  const isReadOnlyRecord = (groupedItem) => {
    return groupedItem.sourceRecords?.some(r => r.source === "rcef" || r.source === "cso");
  };

  const openEditModal = (groupedItem) => {
    if (isReadOnlyRecord(groupedItem)) {
      alert("This record is from RCEF or CSO and cannot be edited here. Please use the respective module.");
      return;
    }
    const original = getOriginalDaEncodeRecord(groupedItem);
    if (!original) {
      alert("Original DA-Encode record not found.");
      return;
    }
    setSelectedAssociation(original);
    setNewAssociation({
      name: original.name || "",
      province: original.province || "",
      municipality: original.municipality || "",
      address: original.address || "",
      registration_type: original.registration_type || "",
      president: original.president || "",
      contact_number: original.contact_number || "",
      members: {
        male: original.members?.male || "",
        female: original.members?.female || "",
        senior_citizen: original.members?.senior_citizen || "",
        differently_abled: original.members?.differently_abled || "",
        young_farmer: original.members?.young_farmer || "",
        ips: original.members?.ips || ""
      },
      commodity: original.commodity || "",
      status: original.status === "Active" ? { active: "P", inactive: null } : { active: null, inactive: "P" },
      groupCategories: original.groupCategories || {
        womenLed: false,
        menLed: false,
        seniorCitizensGroup: false,
        personsWithDisabilitiesGroup: false,
        youngFarmersOrganization: false,
        indigenousPeoplesAssociation: false,
      },
      interventionReviewed: original.interventionReviewed || false,
      specificIntervention: original.specificIntervention || "",
      interventionAmount: original.interventionAmount || ""
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (groupedItem) => {
    if (isReadOnlyRecord(groupedItem)) {
      alert("This record is from RCEF or CSO and cannot be deleted here. Please use the respective module.");
      return;
    }
    const original = getOriginalDaEncodeRecord(groupedItem);
    if (!original) {
      alert("Original DA-Encode record not found.");
      return;
    }
    setSelectedAssociation(original);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (groupedItem) => {
    setSelectedViewAssociation(groupedItem);
    setIsViewModalOpen(true);
  };

  const handleEditFromView = () => {
    if (selectedViewAssociation) {
      if (isReadOnlyRecord(selectedViewAssociation)) {
        alert("This record is from RCEF or CSO and cannot be edited here.");
        return;
      }
      setIsViewModalOpen(false);
      openEditModal(selectedViewAssociation);
    }
  };

  const handleDeleteFromView = () => {
    if (selectedViewAssociation) {
      if (isReadOnlyRecord(selectedViewAssociation)) {
        alert("This record is from RCEF or CSO and cannot be deleted here.");
        return;
      }
      setIsViewModalOpen(false);
      openDeleteModal(selectedViewAssociation);
    }
  };

  // ---------- Import / Export / CRUD (unchanged for da-encode) ----------
  const openAddModal = () => {
    setNewAssociation({
      name: "",
      province: "",
      municipality: "",
      address: "",
      registration_type: "",
      president: "",
      contact_number: "",
      members: {
        male: "",
        female: "",
        senior_citizen: "",
        differently_abled: "",
        young_farmer: "",
        ips: ""
      },
      commodity: "",
      status: { active: "P", inactive: null },
      groupCategories: {
        womenLed: false,
        menLed: false,
        seniorCitizensGroup: false,
        personsWithDisabilitiesGroup: false,
        youngFarmersOrganization: false,
        indigenousPeoplesAssociation: false,
      },
      interventionReviewed: false,
      specificIntervention: "",
      interventionAmount: ""
    });
    setIsAddModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('members.')) {
      const field = name.split('.')[1];
      setNewAssociation(prev => ({ ...prev, members: { ...prev.members, [field]: value } }));
    } else if (name.startsWith('groupCategories.')) {
      const field = name.split('.')[1];
      setNewAssociation(prev => ({ ...prev, groupCategories: { ...prev.groupCategories, [field]: checked } }));
    } else if (name === 'status') {
      setNewAssociation(prev => ({
        ...prev,
        status: value === "Active" ? { active: "P", inactive: null } : { active: null, inactive: "P" }
      }));
    } else if (type === 'checkbox') {
      setNewAssociation(prev => ({ ...prev, [name]: checked }));
    } else {
      setNewAssociation(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAssociation = async () => {
    try {
      if (!newAssociation.name || !newAssociation.province || !newAssociation.municipality || !newAssociation.address || !newAssociation.president) {
        alert("Please fill in all required fields (*)");
        return;
      }
      const provinceDoc = provincesData.find(p => p.name === newAssociation.province);
      if (!provinceDoc) { alert("Selected province not found in database"); return; }
      const newAssoc = {
        name: newAssociation.name,
        address: newAssociation.address,
        registration_type: newAssociation.registration_type,
        president: newAssociation.president,
        contact_number: newAssociation.contact_number,
        members: { ...newAssociation.members },
        commodity: newAssociation.commodity,
        status: newAssociation.status,
        groupCategories: newAssociation.groupCategories,
        interventionReviewed: newAssociation.interventionReviewed,
        specificIntervention: newAssociation.specificIntervention,
        interventionAmount: newAssociation.interventionAmount
      };
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      if (!currentProvinceData) { alert("Province data not found"); return; }
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      let municipalityIndex = updatedMunicipalities.findIndex(m => (m.municipality || m.name) === newAssociation.municipality);
      if (municipalityIndex === -1) {
        updatedMunicipalities.push({ municipality: newAssociation.municipality, associations: [newAssoc] });
      } else {
        updatedMunicipalities[municipalityIndex].associations = [...(updatedMunicipalities[municipalityIndex].associations || []), newAssoc];
      }
      await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
      await fetchData();
      setIsAddModalOpen(false);
      alert("Association added successfully!");
    } catch (error) {
      console.error("Error adding association:", error);
      alert("Error adding association. Please try again.");
    }
  };

  const handleUpdateAssociation = async () => {
    try {
      if (!selectedAssociation) return;
      const provinceDoc = provincesData.find(p => p.name === selectedAssociation.province);
      if (!provinceDoc) { alert("Province document not found"); return; }
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      if (!currentProvinceData) return;
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      if (selectedAssociation.municipalityIndex !== -1 && selectedAssociation.associationIndex !== -1 &&
          updatedMunicipalities[selectedAssociation.municipalityIndex] &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations[selectedAssociation.associationIndex]) {
        updatedMunicipalities[selectedAssociation.municipalityIndex].associations[selectedAssociation.associationIndex] = {
          name: newAssociation.name,
          address: newAssociation.address,
          registration_type: newAssociation.registration_type,
          president: newAssociation.president,
          contact_number: newAssociation.contact_number,
          members: { ...newAssociation.members },
          commodity: newAssociation.commodity,
          status: newAssociation.status,
          groupCategories: newAssociation.groupCategories,
          interventionReviewed: newAssociation.interventionReviewed,
          specificIntervention: newAssociation.specificIntervention,
          interventionAmount: newAssociation.interventionAmount
        };
        await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
        await fetchData();
        setIsEditModalOpen(false);
        alert("Association updated successfully!");
      } else {
        alert("Association not found in the database. It may have been deleted.");
      }
    } catch (error) {
      console.error("Error updating association:", error);
      alert("Error updating association. Please try again.");
    }
  };

  const handleDeleteAssociation = async () => {
    try {
      if (!selectedAssociation) return;
      const provinceDoc = provincesData.find(p => p.name === selectedAssociation.province);
      if (!provinceDoc) { alert("Province document not found"); return; }
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      if (!currentProvinceData) return;
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      if (selectedAssociation.municipalityIndex !== -1 && selectedAssociation.associationIndex !== -1 &&
          updatedMunicipalities[selectedAssociation.municipalityIndex] &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations) {
        updatedMunicipalities[selectedAssociation.municipalityIndex].associations.splice(selectedAssociation.associationIndex, 1);
        if (updatedMunicipalities[selectedAssociation.municipalityIndex].associations.length === 0) {
          updatedMunicipalities.splice(selectedAssociation.municipalityIndex, 1);
        }
        await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
        await fetchData();
        setIsDeleteModalOpen(false);
        alert("Association deleted successfully!");
      } else {
        alert("Association not found in the database. It may have been deleted.");
      }
    } catch (error) {
      console.error("Error deleting association:", error);
      alert("Error deleting association. Please try again.");
    }
  };

  // ---------- Import / Export functions ----------
  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImportStatus({ loading: false, message: "", success: false, error: false });
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) { alert("Please upload an Excel file (.xlsx, .xls) or CSV file"); return; }
    setImportStatus({ loading: true, message: "Reading Excel file...", success: false, error: false });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false, cellText: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false, defval: "" });
        if (jsonData.length === 0) { alert("The Excel file is empty or contains no data"); return; }
        const transformedData = [];
        const chunkSize = 500;
        for (let i = 0; i < jsonData.length; i += chunkSize) {
          const chunk = jsonData.slice(i, i + chunkSize);
          chunk.forEach((row) => {
            const getValue = (keys) => {
              for (const key of keys) if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key].toString().trim();
              return "";
            };
            const getBool = (keys) => {
              const val = getValue(keys).toLowerCase();
              if (val === 'yes' || val === 'true' || val === '1') return true;
              if (val === 'no' || val === 'false' || val === '0') return false;
              return false;
            };
            transformedData.push({
              name: getValue(["Name of Association", "Association Name", "Name", "ASSOCIATION NAME", "ASSOCIATION"]),
              address: getValue(["Address", "Complete Address", "ADDRESS", "LOCATION"]),
              registration_type: getValue(["Type of Registration", "Registration Type", "REGISTRATION TYPE", "Registration", "TYPE"]),
              president: getValue(["Name of President", "President", "PRESIDENT", "CONTACT PERSON"]),
              contact_number: getValue(["Contact No.", "Contact Number", "CONTACT", "PHONE", "MOBILE"]),
              members: {
                male: getValue(["Male", "Male Members", "MALE", "MALE COUNT"]),
                female: getValue(["Female", "Female Members", "FEMALE", "FEMALE COUNT"]),
                senior_citizen: getValue(["Senior Citizen", "Senior", "SENIOR", "ELDERLY"]),
                differently_abled: getValue(["Differently-abled Person", "PWD", "DIFFERENTLY ABLED", "SPECIAL"]),
                young_farmer: getValue(["Young Farmer", "Youth", "YOUNG FARMER", "YOUTH FARMER"]),
                ips: getValue(["IPs", "Indigenous People", "INDIGENOUS", "IPS"])
              },
              commodity: getValue(["Commodity", "Products", "CROPS", "PRODUCE"]),
              status: {
                active: getValue(["Active", "Status"])?.toLowerCase() === "active" ? "P" : null,
                inactive: getValue(["Inactive", "Status"])?.toLowerCase() === "inactive" ? "P" : null
              },
              groupCategories: {
                womenLed: getBool(["Women-Led Group", "Women Led"]),
                menLed: getBool(["Men-Led Group", "Men Led"]),
                seniorCitizensGroup: getBool(["Senior Citizens Group", "Senior Citizens"]),
                personsWithDisabilitiesGroup: getBool(["Persons with Disabilities Group", "PWD Group"]),
                youngFarmersOrganization: getBool(["Young Farmers Organization", "Youth Farmers"]),
                indigenousPeoplesAssociation: getBool(["Indigenous Peoples Association", "IP Association"])
              },
              specificIntervention: getValue(["Specific Intervention", "SPECIFIC INTERVENTION", "Intervention"]),
              interventionAmount: getValue(["Amount", "AMOUNT", "Intervention Amount"])
            });
          });
          if (i % chunkSize === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        const filteredData = transformedData.filter(item => item.name);
        setExcelData(filteredData);
        setIsMunicipalityModalOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImportStatus({ loading: false, message: "", success: false, error: false });
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please check the file format.");
        setImportStatus({ loading: false, message: "", success: false, error: false });
      }
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      setImportStatus({ loading: false, message: "", success: false, error: false });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMunicipalitySubmit = () => {
    if (!municipalityForImport.trim()) { alert("Please enter a municipality name"); return; }
    if (!provinceForImport.trim()) { alert("Please select a province"); return; }
    setIsMunicipalityModalOpen(false);
    setIsImportModalOpen(true);
  };

  const processImportToFirebase = async () => {
    try {
      setImportStatus({ loading: true, message: "Starting import process...", success: false, error: false });
      if (!excelData || excelData.length === 0) throw new Error("No data to import");
      if (!provinceForImport || !municipalityForImport) throw new Error("Province and municipality are required");
      const provinceDoc = provincesData.find(p => p.name === provinceForImport);
      let provinceRef;
      let currentProvinceData;
      if (provinceDoc) {
        provinceRef = doc(db, "da-encode", provinceDoc.id);
        const provinceSnapshot = await getDocs(collection(db, "da-encode"));
        provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      } else {
        provinceRef = doc(collection(db, "da-encode"));
        currentProvinceData = { province: provinceForImport, municipalities: [], createdAt: new Date() };
        await setDoc(provinceRef, currentProvinceData);
      }
      const chunkSize = 100;
      let importedCount = 0;
      for (let i = 0; i < excelData.length; i += chunkSize) {
        const chunk = excelData.slice(i, i + chunkSize);
        setImportStatus({ loading: true, message: `Importing ${Math.min(i + chunkSize, excelData.length)} of ${excelData.length} associations...`, success: false, error: false });
        const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
        let municipalityIndex = updatedMunicipalities.findIndex(m => (m.municipality || m.name) === municipalityForImport);
        if (municipalityIndex === -1) {
          updatedMunicipalities.push({ municipality: municipalityForImport, associations: chunk });
        } else {
          updatedMunicipalities[municipalityIndex].associations = [...(updatedMunicipalities[municipalityIndex].associations || []), ...chunk];
        }
        await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
        importedCount += chunk.length;
        currentProvinceData.municipalities = updatedMunicipalities;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await fetchData();
      setImportStatus({ loading: false, message: `Successfully imported ${importedCount} associations to ${municipalityForImport}, ${provinceForImport}`, success: true, error: false });
      setTimeout(() => {
        setImportStatus({ loading: false, message: "", success: false, error: false });
        setIsImportModalOpen(false);
        setExcelData([]);
        setMunicipalityForImport("");
        setProvinceForImport("");
      }, 3000);
    } catch (error) {
      console.error("Error importing data:", error);
      setImportStatus({ loading: false, message: `Import failed: ${error.message}`, success: false, error: true });
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        "Name of Association": "Sample Farmers Association",
        "Complete Address": "Sample Address, Sample Barangay",
        "Type of Registration (DOLE, CDA, SEC)": "DOLE",
        "Name of President": "Juan Dela Cruz",
        "Contact No.": "09123456789",
        "Male": "50",
        "Female": "30",
        "Senior Citizen": "15",
        "Differently-abled Person": "2",
        "Young Farmer": "10",
        "IPs": "5",
        "Commodity": "Rice, Vegetables",
        "Status": "Active",
        "Women-Led Group": "Yes",
        "Men-Led Group": "No",
        "Senior Citizens Group": "Yes",
        "Persons with Disabilities Group": "No",
        "Young Farmers Organization": "Yes",
        "Indigenous Peoples Association": "No",
        "Specific Intervention": "Seeds Distribution",
        "Amount": "100 bags"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Associations");
    XLSX.writeFile(wb, "Association_Template.xlsx");
  };

  const exportToExcel = () => {
    let displayProvince = "";
    let displayMunicipality = "";
    if (filteredData.length > 0) {
      if (filters.province) displayProvince = filters.province;
      else {
        const uniqueProvinces = [...new Set(filteredData.map(item => item.province))];
        displayProvince = uniqueProvinces.length === 1 ? uniqueProvinces[0] : `${uniqueProvinces.length} PROVINCES`;
      }
      if (filters.municipality) displayMunicipality = filters.municipality;
      else {
        const uniqueMunicipalities = [...new Set(filteredData.map(item => item.municipality))];
        displayMunicipality = uniqueMunicipalities.length === 1 ? uniqueMunicipalities[0] : `ALL MUNICIPALITIES`;
      }
    } else {
      displayProvince = "NO DATA";
      displayMunicipality = "NO DATA";
    }
    if (!displayProvince) displayProvince = "ALL PROVINCES";
    if (!displayMunicipality) displayMunicipality = "ALL MUNICIPALITIES";

    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
        th { background-color: #f3f4f6; font-weight: bold; text-align: center; border: 2px solid #000000; padding: 8px; vertical-align: middle; }
        td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; }
        .no-data { background-color: #fef3c7; }
        .no-registration { background-color: #d1fae5; }
      </style></head>
      <body>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr><td colspan="17" style="text-align:center; font-weight:bold; font-size:18px;">LIST OF REGISTERED ASSOCIATIONS</td></tr>
          <tr style="height:15px;"><td colspan="17"></td><td colspan="6" style="font-weight:bold;">LEGEND:</td></tr>
          <tr><td colspan="2"><strong>PROVINCE</strong></td><td colspan="15">: ${displayProvince}</td><td colspan="6" class="no-data" style="text-align:center;">NO DATA</td></tr>
          <tr><td colspan="2"><strong>MUNICIPALITY</strong></td><td colspan="15">: ${displayMunicipality}</td><td colspan="6" class="no-registration" style="text-align:center;">NO REGISTRATION</td></tr>
        </table>
        <br/>
        <table>
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2">Name of Association</th>
              <th rowspan="2">Address</th>
              <th rowspan="2">Type of Registration</th>
              <th rowspan="2">Name of President</th>
              <th rowspan="2">Contact No.</th>
              <th colspan="6">No. of Members</th>
              <th rowspan="2">Commodity</th>
              <th colspan="6">Group Categories</th>
              <th colspan="2">Year</th>
              <th rowspan="2">Accreditation Periods</th>
              <th colspan="2">Status</th>
            </tr>
            <tr>
              <th>Male</th><th>Female</th><th>Senior Citizen</th><th>Differently-abled</th><th>Young Farmer</th><th>IPs</th>
              <th>Women-Led</th><th>Men-Led</th><th>Senior Citizens</th><th>PWD</th><th>Young Farmers</th><th>IP Association</th>
              <th>Specific Intervention</th><th>Amount</th>
              <th>Active</th><th>Inactive</th>
            </tr>
          </thead>
          <tbody>
    `;
    filteredData.forEach((item, index) => {
      const isDiffAbledEmpty = !item.members?.differently_abled || Number(item.members?.differently_abled) === 0;
      const isRegEmpty = !item.registration_type;
      const displayMemberValue = (val) => (val === "" || val === "0" || val === 0 || !val) ? "" : val;
      const check = (val) => val ? "✓" : "";
      const accreditationPeriodsHtml = item.accreditationPeriods && item.accreditationPeriods.length > 0
        ? item.accreditationPeriods.map(p => `${formatDate(p.date_accredited)} → ${formatDate(p.date_expiration)}`).join('<br/>')
        : "—";
      tableHTML += `
        <tr>
          <td style="text-align:center">${index + 1}</td>
          <td>${item.name || ""}</td>
          <td>${item.address || ""}</td>
          <td class="${isRegEmpty ? 'no-registration' : ''}">${item.registration_type || ""}</td>
          <td>${item.president || ""}</td>
          <td>${item.contact_number || ""}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.male)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.female)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.senior_citizen)}</td>
          <td class="${isDiffAbledEmpty ? 'no-data' : ''}" style="text-align:center">${displayMemberValue(item.members?.differently_abled)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.young_farmer)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.ips)}</td>
          <td>${item.commodity || ""}</td>
          <td style="text-align:center">${check(item.groupCategories?.womenLed)}</td>
          <td style="text-align:center">${check(item.groupCategories?.menLed)}</td>
          <td style="text-align:center">${check(item.groupCategories?.seniorCitizensGroup)}</td>
          <td style="text-align:center">${check(item.groupCategories?.personsWithDisabilitiesGroup)}</td>
          <td style="text-align:center">${check(item.groupCategories?.youngFarmersOrganization)}</td>
          <td style="text-align:center">${check(item.groupCategories?.indigenousPeoplesAssociation)}</td>
          <td>${item.specificIntervention || "-"}</td>
          <td>${item.interventionAmount || "-"}</td>
          <td>${accreditationPeriodsHtml}</td>
          <td style="text-align:center">${item.status === "Active" ? "✓" : ""}</td>
          <td style="text-align:center">${item.status === "Inactive" ? "✓" : ""}</td>
        </tr>
      `;
    });
    tableHTML += `
          </tbody>
        </table>
        <div style="margin-top:20px; font-size:10px; color:#666;">
          <p><strong>Legend:</strong></p>
          <p>✓ - Checkmark indicates status or membership</p>
          <p style="background-color:#fef3c7; padding:4px; display:inline-block;">Yellow background - Empty differently-abled field</p>
          <p style="background-color:#d1fae5; padding:4px; display:inline-block; margin-left:10px;">Green background - Missing registration type</p>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agriculture_Associations_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const printTable = () => {
    if (filteredData.length > 500 && !window.confirm(`Printing ${filteredData.length} rows. This may take a moment. Continue?`)) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Agriculture Associations Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin:20px; }
        table { width:100%; border-collapse:collapse; margin:20px 0; font-size:9px; }
        th, td { border:1px solid #ddd; padding:4px; text-align:left; }
        th { background-color:#f4f4f4; }
        @media print { body { margin:0; padding:10px; } @page { size:landscape; margin:0.5cm; } }
      </style></head>
      <body>
        <h2>Agriculture Associations Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${filteredData.length}</p>
        <table>
          <thead>
            <tr>
              <th>No.</th><th>Association Name</th><th>Address</th><th>Registration Type</th><th>President</th><th>Contact No.</th>
              <th>Male</th><th>Female</th><th>Senior Citizen</th><th>Differently-abled</th><th>Young Farmer</th><th>IPs</th><th>Commodity</th>
              <th>Women-Led</th><th>Men-Led</th><th>Senior Citizens</th><th>PWD</th><th>Young Farmers</th><th>IP Association</th>
              <th>Specific Intervention</th><th>Amount</th><th>Accreditation Periods</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item, idx) => {
              const periods = item.accreditationPeriods && item.accreditationPeriods.length > 0
                ? item.accreditationPeriods.map(p => `${formatDate(p.date_accredited)}→${formatDate(p.date_expiration)}`).join(', ')
                : "—";
              return `
              <tr>
                <td>${idx+1}</td><td>${item.name||""}</td><td>${item.address||""}</td><td>${item.registration_type||""}</td>
                <td>${item.president||""}</td><td>${item.contact_number||""}</td>
                <td>${item.members?.male||""}</td><td>${item.members?.female||""}</td><td>${item.members?.senior_citizen||""}</td>
                <td>${item.members?.differently_abled||""}</td><td>${item.members?.young_farmer||""}</td><td>${item.members?.ips||""}</td>
                <td>${item.commodity||""}</td>
                <td>${item.groupCategories?.womenLed ? "Yes" : ""}</td><td>${item.groupCategories?.menLed ? "Yes" : ""}</td>
                <td>${item.groupCategories?.seniorCitizensGroup ? "Yes" : ""}</td><td>${item.groupCategories?.personsWithDisabilitiesGroup ? "Yes" : ""}</td>
                <td>${item.groupCategories?.youngFarmersOrganization ? "Yes" : ""}</td><td>${item.groupCategories?.indigenousPeoplesAssociation ? "Yes" : ""}</td>
                <td>${item.specificIntervention||"-"}</td><td>${item.interventionAmount||"-"}</td>
                <td>${periods}</td><td>${item.status||""}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const isDifferentlyAbledEmpty = (members) => {
    const val = members?.differently_abled;
    return val === "" || val === null || val === undefined || Number(val) === 0;
  };
  const isRegistrationEmpty = (reg) => !reg || reg === "";

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (tableRef.current) tableRef.current.scrollIntoView({ behavior: 'smooth' });
  };
  const handleItemsPerPageChange = (value) => { setItemsPerPage(value); setCurrentPage(1); };

  if (loading) {
    return (
      <div className={`p-6 ${ds.page} flex-1 overflow-auto flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium text-sm">Loading associations data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 ${ds.page} flex-1 overflow-auto`}>
      {/* Header */}
      <div className="mb-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white">
                <FiLayers className="w-4 h-4" />
              </span>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">FCA Registry</p>
            </div>
            <h1 className="text-2xl md:text-[28px] font-bold text-slate-900 tracking-tight mb-1.5">
              Farmers' Cooperative &amp; Associations
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">Complete registry of agricultural associations — including RCEF and CSO accredited groups — with advanced filtering and reporting.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => fileInputRef.current?.click()} className={ds.btnSecondary}>
              <FiUpload className="text-base" /> Import Excel
            </button>
            <button onClick={openAddModal} className={ds.btnPrimary}>
              <FiPlus className="text-base" /> Add Association
            </button>
            <button onClick={fetchData} className={`${ds.btnSecondary} px-3`} title="Refresh Data">
              <FiRefreshCw className="text-base" />
            </button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />

      {/* Action Bar with Total Intervention Amount */}
      <div className={`mb-5 ${ds.card} p-5 md:p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className={ds.sectionTitle}>Data controls &amp; export</h3>
            <p className={ds.sectionSubtitle}>Filter, search, import, and export your association data.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 border border-amber-200 bg-amber-50/60">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700">
                <FiDollarSign className="text-base" />
              </span>
              <div>
                <span className="text-[11px] text-amber-700/80 font-medium block leading-none mb-1">Total intervention amount</span>
                <span className="font-bold text-amber-800 text-sm leading-none">
                  {totalInterventionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <button onClick={downloadSampleTemplate} className={ds.btnSecondary}>
              <FiFileText className="text-base" /> Template
            </button>
            <button onClick={printTable} className={ds.btnSecondary}>
              <FiPrinter className="text-base" /> Print
            </button>
            <button onClick={exportToExcel} className={ds.btnPrimary}>
              <FiDownload className="text-base" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className={`${ds.card} p-5 md:p-6 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500">
              <FiSliders className="w-4 h-4" />
            </span>
            <div>
              <h3 className={ds.sectionTitle}>Advanced filters</h3>
              <p className={ds.sectionSubtitle}>Refine results using multiple criteria.</p>
            </div>
          </div>
          <button onClick={clearFilters} className={ds.btnGhost}>
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          <div>
            <FieldLabel>Province</FieldLabel>
            <select value={filters.province} onChange={(e) => handleFilterChange("province", e.target.value)} className={ds.select}>
              <option value="">All Provinces</option>
              {uniqueProvinces.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Municipality</FieldLabel>
            <select value={filters.municipality} onChange={(e) => handleFilterChange("municipality", e.target.value)} className={ds.select} disabled={!filters.province}>
              <option value="">All Municipalities</option>
              {filters.province ? availableMunicipalities.map((m, i) => <option key={i} value={m}>{m}</option>) : uniqueMunicipalities.map((m, i) => <option key={i} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} className={ds.select}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <FieldLabel>Registration Type</FieldLabel>
            <select value={filters.registrationType} onChange={(e) => handleFilterChange("registrationType", e.target.value)} className={ds.select}>
              <option value="">All Types</option>
              {uniqueRegistrationTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Commodity</FieldLabel>
            <select value={filters.commodity} onChange={(e) => handleFilterChange("commodity", e.target.value)} className={ds.select}>
              <option value="">All Commodities</option>
              {uniqueCommodities.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Group Category Filters */}
        <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-slate-100">
          {[
            ["womenLed", "Women-Led"],
            ["menLed", "Men-Led"],
            ["seniorCitizensGroup", "Senior Citizens Group"],
            ["personsWithDisabilitiesGroup", "PWD Group"],
            ["youngFarmersOrganization", "Young Farmers Organization"],
            ["indigenousPeoplesAssociation", "IP Association"],
          ].map(([key, label]) => (
            <label key={key} className={`inline-flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg border cursor-pointer transition-colors duration-150 ${filters[key] ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <input type="checkbox" checked={filters[key]} onChange={(e) => handleFilterChange(key, e.target.checked)} className={ds.checkbox} />
              <span className="font-medium">{label}</span>
            </label>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-slate-400" />
          </div>
          <input type="text" placeholder="Search associations by name, president, address, commodity, or municipality…" value={filters.searchTerm} onChange={(e) => handleFilterChange("searchTerm", e.target.value)} className={`${ds.input} pl-11`} />
        </div>
      </div>

      {/* Data Table */}
      <div className={`${ds.card} overflow-hidden mb-8`}>
        <div className="px-5 md:px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={ds.sectionTitle}>Associations database</h3>
            <p className={ds.sectionSubtitle}>{isFiltering ? "Filtering…" : `${filteredData.length} association${filteredData.length !== 1 ? 's' : ''} found · Total ${data.length} associations`}</p>
          </div>
          <Badge tone="neutral">Page {currentPage} of {totalPages || 1}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full divide-y divide-slate-100 text-sm" style={{ minWidth: '2900px' }}>
            <thead className="bg-slate-50/80">
              <tr>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-16">No.</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 min-w-48">Association Name</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 min-w-48">Complete Address</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 min-w-40">Registration Type</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 min-w-40">President</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 min-w-32">Contact No.</th>
                <th colSpan="6" className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100">Members Breakdown</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 min-w-32">Commodity</th>
                <th colSpan="6" className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100">Group Categories</th>
                <th colSpan="2" className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100">Year</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 min-w-40">Accreditation Periods</th>
                <th colSpan="2" className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th rowSpan="2" className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide min-w-28">Actions</th>
              </tr>
              <tr>
                <th onClick={() => requestSort('members.male')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Male{getSortIcon('members.male')}</div></th>
                <th onClick={() => requestSort('members.female')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Female{getSortIcon('members.female')}</div></th>
                <th onClick={() => requestSort('members.senior_citizen')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-28 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Senior Citizen{getSortIcon('members.senior_citizen')}</div></th>
                <th onClick={() => requestSort('members.differently_abled')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-32 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Differently-abled{getSortIcon('members.differently_abled')}</div></th>
                <th onClick={() => requestSort('members.young_farmer')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-28 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Young Farmer{getSortIcon('members.young_farmer')}</div></th>
                <th onClick={() => requestSort('members.ips')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">IPs{getSortIcon('members.ips')}</div></th>
                <th onClick={() => requestSort('groupCategories.womenLed')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Women-Led{getSortIcon('groupCategories.womenLed')}</div></th>
                <th onClick={() => requestSort('groupCategories.menLed')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Men-Led{getSortIcon('groupCategories.menLed')}</div></th>
                <th onClick={() => requestSort('groupCategories.seniorCitizensGroup')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-28 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Senior Citizens{getSortIcon('groupCategories.seniorCitizensGroup')}</div></th>
                <th onClick={() => requestSort('groupCategories.personsWithDisabilitiesGroup')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">PWD{getSortIcon('groupCategories.personsWithDisabilitiesGroup')}</div></th>
                <th onClick={() => requestSort('groupCategories.youngFarmersOrganization')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-28 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">Young Farmers{getSortIcon('groupCategories.youngFarmersOrganization')}</div></th>
                <th onClick={() => requestSort('groupCategories.indigenousPeoplesAssociation')} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24 hover:bg-slate-100 cursor-pointer transition-colors"><div className="flex items-center justify-between">IP Assoc{getSortIcon('groupCategories.indigenousPeoplesAssociation')}</div></th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-32">Specific Intervention</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24">Amount</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 w-24">Active</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">Inactive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr><td colSpan="29" className="px-6 py-16 text-center">
                  <div className="text-slate-500 py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 mb-4">
                      <FiSearch className="h-7 w-7 text-slate-300" />
                    </div>
                    <p className="text-base font-semibold text-slate-700">No associations found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term.</p>
                    <button onClick={clearFilters} className="mt-4 text-sm text-emerald-600 hover:text-emerald-800 font-semibold">Clear all filters</button>
                  </div>
                </td></tr>
              ) : (
                displayedData.map((item, idx) => {
                  const isReadOnly = isReadOnlyRecord(item);
                  return (
                    <MemoizedTableRow
                      key={item.id}
                      item={item}
                      index={(currentPage - 1) * itemsPerPage + idx + 1}
                      openEditModal={openEditModal}
                      openDeleteModal={openDeleteModal}
                      openViewModal={openViewModal}
                      isDifferentlyAbledEmpty={isDifferentlyAbledEmpty}
                      isRegistrationEmpty={isRegistrationEmpty}
                      isReadOnly={isReadOnly}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} totalItems={filteredData.length} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} />
        )}

        <div className="px-5 md:px-6 py-4 border-t border-slate-100 bg-slate-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filteredData.length}</span> of <span className="font-semibold text-slate-700">{data.length}</span> associations
              <span className="ml-2 text-emerald-600 font-semibold">{data.length ? ((filteredData.length / data.length) * 100).toFixed(1) : "0.0"}% of total</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
              Last updated: {new Date().toLocaleDateString("en-US", { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Municipality Modal (Import) */}
      {isMunicipalityModalOpen && (
        <div className={ds.modalOverlay}>
          <div ref={modalRef} className={`${ds.modalShell} max-w-2xl`}>
            <div className={`${ds.modalHeader} bg-white`}>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Specify Location</h3>
                <p className="text-sm text-slate-500 mt-0.5">Where are these associations located?</p>
              </div>
              <button onClick={() => setIsMunicipalityModalOpen(false)} className={ds.btnIcon}><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-7">
              <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900">Excel Data Preview</h4>
                  <Badge tone="info">{excelData.length} associations found</Badge>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 max-h-60 overflow-y-auto border border-slate-100">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide"><th className="px-3 py-2">Association Name</th><th className="px-3 py-2">President</th><th className="px-3 py-2">Members</th></tr></thead>
                    <tbody>{excelData.slice(0,5).map((item,i)=>(
                      <tr key={i} className="border-t border-slate-100"><td className="px-3 py-2 truncate max-w-xs text-slate-700">{item.name||"No name"}</td><td className="px-3 py-2 text-slate-700">{item.president||"No president"}</td><td className="px-3 py-2 text-slate-500">M: {item.members?.male||"0"} | F: {item.members?.female||"0"}</td></tr>
                    ))}</tbody>
                  </table>
                  {excelData.length>5 && <p className="text-xs text-slate-400 mt-2 text-center">+ {excelData.length-5} more associations…</p>}
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <FieldLabel required>Province</FieldLabel>
                  <select value={provinceForImport} onChange={(e)=>setProvinceForImport(e.target.value)} className={ds.select}>
                    <option value="">Select Province</option>{uniqueProvinces.map((p,i)=><option key={i} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel required>Municipality</FieldLabel>
                  <input type="text" value={municipalityForImport} onChange={(e)=>setMunicipalityForImport(e.target.value)} className={ds.input} placeholder="Enter municipality name (e.g., POLA, CALAPAN CITY)" />
                  <p className="text-xs text-slate-400 mt-2">Enter the municipality where these associations are located. This will group all imported data under this municipality.</p>
                </div>
              </div>
            </div>
            <div className={`${ds.modalFooter} flex justify-end gap-3`}>
              <button onClick={()=>setIsMunicipalityModalOpen(false)} className={ds.btnSecondary}>Cancel</button>
              <button onClick={handleMunicipalitySubmit} className={ds.btnPrimary}><FiPackage className="text-base" />Continue to Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {isImportModalOpen && (
        <div className={ds.modalOverlay}>
          <div ref={modalRef} className={`${ds.modalShell} max-w-3xl`}>
            <div className={`${ds.modalHeader} bg-white`}>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Import</h3>
                <p className="text-sm text-slate-500 mt-0.5">Review the data before importing to database</p>
              </div>
              <button onClick={()=>{setIsImportModalOpen(false);setImportStatus({loading:false,message:"",success:false,error:false});}} className={ds.btnIcon}><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-7">
              {importStatus.message && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${importStatus.success?'bg-emerald-50 border-emerald-200':importStatus.error?'bg-rose-50 border-rose-200':'bg-blue-50 border-blue-200'}`}>
                  {importStatus.loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent flex-shrink-0"></div>}
                  {importStatus.success && <FiCheckCircle className="text-emerald-600 flex-shrink-0"/>}
                  {importStatus.error && <FiAlertCircle className="text-rose-600 flex-shrink-0"/>}
                  <p className={`text-sm font-medium ${importStatus.success?'text-emerald-800':importStatus.error?'text-rose-800':'text-blue-800'}`}>{importStatus.message}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Import Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center"><span className="text-slate-500">Total Associations</span><span className="font-bold text-slate-900 text-base">{excelData.length}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500">Province</span><Badge tone="info">{provinceForImport}</Badge></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500">Municipality</span><Badge tone="success">{municipalityForImport}</Badge></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500">Total Members</span><span className="font-bold text-slate-900">{excelData.reduce((sum,item)=>sum+(parseInt(item.members?.male)||0)+(parseInt(item.members?.female)||0)+(parseInt(item.members?.senior_citizen)||0)+(parseInt(item.members?.differently_abled)||0)+(parseInt(item.members?.young_farmer)||0)+(parseInt(item.members?.ips)||0),0).toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Data Preview</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Sample Association</span><span className="font-medium text-slate-800 truncate max-w-[10rem]">{excelData[0]?.name||"No data"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sample President</span><span className="font-medium text-slate-800">{excelData[0]?.president||"No data"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sample Commodity</span><span className="font-medium text-slate-800">{excelData[0]?.commodity||"No data"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sample Status</span><span className="font-medium text-slate-800">{excelData[0]?.status?.active?"Active":"Inactive"}</span></div>
                  </div>
                </div>
              </div>
              <div className="mb-7">
                <h4 className="text-sm font-bold text-slate-900 mb-4">First 5 Associations</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide"><th className="px-3 py-2.5">No.</th><th className="px-3 py-2.5">Association Name</th><th className="px-3 py-2.5">President</th><th className="px-3 py-2.5">Members</th><th className="px-3 py-2.5">Commodity</th></tr></thead>
                    <tbody>{excelData.slice(0,5).map((item,i)=>(<tr key={i} className="border-t border-slate-100"><td className="px-3 py-2.5 text-slate-500">{i+1}</td><td className="px-3 py-2.5 truncate max-w-xs text-slate-800 font-medium" title={item.name}>{item.name||"No name"}</td><td className="px-3 py-2.5 text-slate-700">{item.president||"No president"}</td><td className="px-3 py-2.5 text-slate-500">M: {item.members?.male||"0"} | F: {item.members?.female||"0"}</td><td className="px-3 py-2.5 text-slate-700">{item.commodity||"Not specified"}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800"><span className="font-semibold">Important:</span> This will {provincesData.find(p=>p.name===provinceForImport)?'update':'create'} the province document and {excelData.some(item=>item.municipality===municipalityForImport)?'add to':'create'} the municipality with {excelData.length} associations.</p>
              </div>
            </div>
            <div className={`${ds.modalFooter} flex flex-col sm:flex-row justify-between gap-3`}>
              <button onClick={downloadSampleTemplate} className={ds.btnSecondary}><FiFileText className="text-base" />Download Template</button>
              <div className="flex gap-3">
                <button onClick={()=>{setIsImportModalOpen(false);setImportStatus({loading:false,message:"",success:false,error:false});}} className={ds.btnSecondary}>Cancel</button>
                <button onClick={processImportToFirebase} disabled={importStatus.loading} className={ds.btnPrimary}>{importStatus.loading?<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Importing…</>:<><FiUpload className="text-base" />Confirm Import</>}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className={ds.modalOverlay}>
          <div className={`${ds.modalShell} max-w-4xl flex flex-col max-h-[90vh]`}>
            <div className={ds.modalHeader}>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add New Association</h3>
                <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to register a new association</p>
              </div>
              <button onClick={()=>setIsAddModalOpen(false)} className={ds.btnIcon}><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-7 overflow-y-auto flex-1">
              <SectionLegend><FiHome className="w-4 h-4 text-slate-400"/>Basic Information</SectionLegend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div><FieldLabel required>Association Name</FieldLabel><input type="text" name="name" value={newAssociation.name} onChange={handleInputChange} className={ds.input} placeholder="Enter association name" required/></div>
                <div><FieldLabel required>Province</FieldLabel><select name="province" value={newAssociation.province} onChange={handleInputChange} className={ds.select}><option value="">Select Province</option>{uniqueProvinces.map((p,i)=><option key={i} value={p}>{p}</option>)}</select></div>
                <div><FieldLabel required>Municipality</FieldLabel><input type="text" name="municipality" value={newAssociation.municipality} onChange={handleInputChange} className={ds.input} placeholder="Enter municipality name" required/></div>
                <div><FieldLabel required>Complete Address</FieldLabel><input type="text" name="address" value={newAssociation.address} onChange={handleInputChange} className={ds.input} placeholder="Enter complete address" required/></div>
                <div><FieldLabel>Registration Type</FieldLabel><select name="registration_type" value={newAssociation.registration_type} onChange={handleInputChange} className={ds.select}><option value="">Select Type</option><option value="DOLE">DOLE</option><option value="CDA">CDA</option><option value="SEC">SEC</option><option value="none">None</option></select></div>
                <div><FieldLabel required>President Name</FieldLabel><input type="text" name="president" value={newAssociation.president} onChange={handleInputChange} className={ds.input} placeholder="Enter president's full name" required/></div>
                <div><FieldLabel>Contact Number</FieldLabel><input type="text" name="contact_number" value={newAssociation.contact_number} onChange={handleInputChange} className={ds.input} placeholder="Enter contact number"/></div>
                <div><FieldLabel>Commodity</FieldLabel><input type="text" name="commodity" value={newAssociation.commodity} onChange={handleInputChange} className={ds.input} placeholder="Enter main commodity"/></div>
                <div><FieldLabel>Status</FieldLabel><select name="status" value={newAssociation.status.active==="P"?"Active":"Inactive"} onChange={handleInputChange} className={ds.select}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              </div>

              <SectionLegend><FiUsers className="w-4 h-4 text-slate-400"/>Members Information</SectionLegend>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-5 mb-8">
                <div><FieldLabel>Male</FieldLabel><input type="number" name="members.male" value={newAssociation.members.male} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Female</FieldLabel><input type="number" name="members.female" value={newAssociation.members.female} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Senior Citizens</FieldLabel><input type="number" name="members.senior_citizen" value={newAssociation.members.senior_citizen} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Differently-abled</FieldLabel><input type="number" name="members.differently_abled" value={newAssociation.members.differently_abled} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Young Farmer</FieldLabel><input type="number" name="members.young_farmer" value={newAssociation.members.young_farmer} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>IPs</FieldLabel><input type="number" name="members.ips" value={newAssociation.members.ips} onChange={handleInputChange} className={ds.input} min="0"/></div>
              </div>

              <SectionLegend><FiTag className="w-4 h-4 text-slate-400"/>Group Categories</SectionLegend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {[
                  ["groupCategories.womenLed", newAssociation.groupCategories.womenLed, "Women-Led Group"],
                  ["groupCategories.menLed", newAssociation.groupCategories.menLed, "Men-Led Group"],
                  ["groupCategories.seniorCitizensGroup", newAssociation.groupCategories.seniorCitizensGroup, "Senior Citizens Group"],
                  ["groupCategories.personsWithDisabilitiesGroup", newAssociation.groupCategories.personsWithDisabilitiesGroup, "Persons with Disabilities Group"],
                  ["groupCategories.youngFarmersOrganization", newAssociation.groupCategories.youngFarmersOrganization, "Young Farmers Organization"],
                  ["groupCategories.indigenousPeoplesAssociation", newAssociation.groupCategories.indigenousPeoplesAssociation, "Indigenous Peoples Association"],
                ].map(([name, checked, label]) => (
                  <label key={name} className="flex items-center gap-2.5 text-sm text-slate-700 px-3.5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" name={name} checked={checked} onChange={handleInputChange} className={ds.checkbox} />
                    <span className="font-medium">{label}</span>
                  </label>
                ))}
              </div>

              <SectionLegend><FiBriefcase className="w-4 h-4 text-slate-400"/>Intervention Information</SectionLegend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FieldLabel>Year</FieldLabel>
                  <label className="flex items-center gap-2.5 h-11 px-3.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" name="interventionReviewed" checked={newAssociation.interventionReviewed} onChange={handleInputChange} className={ds.checkbox} />
                    <span className="text-sm font-medium text-slate-700">Yes</span>
                  </label>
                </div>
                <div><FieldLabel>Specific Intervention</FieldLabel><input type="text" name="specificIntervention" value={newAssociation.specificIntervention} onChange={handleInputChange} className={ds.input} placeholder="e.g., Seeds, Mech, Credit, Extn"/></div>
                <div><FieldLabel>Amount</FieldLabel><input type="text" name="interventionAmount" value={newAssociation.interventionAmount} onChange={handleInputChange} className={ds.input} placeholder="e.g., 100 bags, ₱50,000"/></div>
              </div>
            </div>
            <div className={ds.modalFooter}>
              <div className="flex justify-end gap-3">
                <button onClick={()=>setIsAddModalOpen(false)} className={ds.btnSecondary}>Cancel</button>
                <button onClick={handleAddAssociation} className={ds.btnPrimary}><FiSave className="text-base" />Save Association</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAssociation && (
        <div className={ds.modalOverlay}>
          <div className={`${ds.modalShell} max-w-4xl flex flex-col max-h-[90vh]`}>
            <div className={ds.modalHeader}>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Edit Association</h3>
                <p className="text-sm text-slate-500 mt-0.5">Update the details of this association</p>
              </div>
              <button onClick={()=>setIsEditModalOpen(false)} className={ds.btnIcon}><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-7 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <FiInfo className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800"><span className="font-semibold">Note:</span> Province and Municipality cannot be changed. If you need to move this association to a different location, please delete and create a new one.</p>
              </div>

              <SectionLegend><FiHome className="w-4 h-4 text-slate-400"/>Basic Information</SectionLegend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div><FieldLabel>Association Name</FieldLabel><input type="text" name="name" value={newAssociation.name} onChange={handleInputChange} className={ds.input}/></div>
                <div><FieldLabel>Province</FieldLabel><input type="text" value={newAssociation.province} disabled className={ds.input}/></div>
                <div><FieldLabel>Municipality</FieldLabel><input type="text" value={newAssociation.municipality} disabled className={ds.input}/></div>
                <div><FieldLabel>Complete Address</FieldLabel><input type="text" name="address" value={newAssociation.address} onChange={handleInputChange} className={ds.input}/></div>
                <div><FieldLabel>Registration Type</FieldLabel><select name="registration_type" value={newAssociation.registration_type} onChange={handleInputChange} className={ds.select}><option value="">Select Type</option><option value="DOLE">DOLE</option><option value="CDA">CDA</option><option value="SEC">SEC</option><option value="none">None</option></select></div>
                <div><FieldLabel>President Name</FieldLabel><input type="text" name="president" value={newAssociation.president} onChange={handleInputChange} className={ds.input}/></div>
                <div><FieldLabel>Contact Number</FieldLabel><input type="text" name="contact_number" value={newAssociation.contact_number} onChange={handleInputChange} className={ds.input}/></div>
                <div><FieldLabel>Commodity</FieldLabel><input type="text" name="commodity" value={newAssociation.commodity} onChange={handleInputChange} className={ds.input}/></div>
                <div><FieldLabel>Status</FieldLabel><select name="status" value={newAssociation.status.active==="P"?"Active":"Inactive"} onChange={handleInputChange} className={ds.select}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              </div>

              <SectionLegend><FiUsers className="w-4 h-4 text-slate-400"/>Members Information</SectionLegend>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-5 mb-8">
                <div><FieldLabel>Male</FieldLabel><input type="number" name="members.male" value={newAssociation.members.male} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Female</FieldLabel><input type="number" name="members.female" value={newAssociation.members.female} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Senior Citizens</FieldLabel><input type="number" name="members.senior_citizen" value={newAssociation.members.senior_citizen} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Differently-abled</FieldLabel><input type="number" name="members.differently_abled" value={newAssociation.members.differently_abled} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>Young Farmer</FieldLabel><input type="number" name="members.young_farmer" value={newAssociation.members.young_farmer} onChange={handleInputChange} className={ds.input} min="0"/></div>
                <div><FieldLabel>IPs</FieldLabel><input type="number" name="members.ips" value={newAssociation.members.ips} onChange={handleInputChange} className={ds.input} min="0"/></div>
              </div>

              <SectionLegend><FiTag className="w-4 h-4 text-slate-400"/>Group Categories</SectionLegend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {[
                  ["groupCategories.womenLed", newAssociation.groupCategories.womenLed, "Women-Led Group"],
                  ["groupCategories.menLed", newAssociation.groupCategories.menLed, "Men-Led Group"],
                  ["groupCategories.seniorCitizensGroup", newAssociation.groupCategories.seniorCitizensGroup, "Senior Citizens Group"],
                  ["groupCategories.personsWithDisabilitiesGroup", newAssociation.groupCategories.personsWithDisabilitiesGroup, "Persons with Disabilities Group"],
                  ["groupCategories.youngFarmersOrganization", newAssociation.groupCategories.youngFarmersOrganization, "Young Farmers Organization"],
                  ["groupCategories.indigenousPeoplesAssociation", newAssociation.groupCategories.indigenousPeoplesAssociation, "Indigenous Peoples Association"],
                ].map(([name, checked, label]) => (
                  <label key={name} className="flex items-center gap-2.5 text-sm text-slate-700 px-3.5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" name={name} checked={checked} onChange={handleInputChange} className={ds.checkbox} />
                    <span className="font-medium">{label}</span>
                  </label>
                ))}
              </div>

              <SectionLegend><FiBriefcase className="w-4 h-4 text-slate-400"/>Intervention Information</SectionLegend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FieldLabel>Year</FieldLabel>
                  <label className="flex items-center gap-2.5 h-11 px-3.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" name="interventionReviewed" checked={newAssociation.interventionReviewed} onChange={handleInputChange} className={ds.checkbox} />
                    <span className="text-sm font-medium text-slate-700">Yes</span>
                  </label>
                </div>
                <div><FieldLabel>Specific Intervention</FieldLabel><input type="text" name="specificIntervention" value={newAssociation.specificIntervention} onChange={handleInputChange} className={ds.input}/></div>
                <div><FieldLabel>Amount</FieldLabel><input type="text" name="interventionAmount" value={newAssociation.interventionAmount} onChange={handleInputChange} className={ds.input}/></div>
              </div>
            </div>
            <div className={ds.modalFooter}>
              <div className="flex justify-end gap-3">
                <button onClick={()=>setIsEditModalOpen(false)} className={ds.btnSecondary}>Cancel</button>
                <button onClick={handleUpdateAssociation} className={ds.btnPrimary}><FiSave className="text-base" />Update Association</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedAssociation && (
        <div className={ds.modalOverlay}>
          <div className={`${ds.modalShell} max-w-md overflow-hidden`}>
            <div className="px-7 py-5 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Confirm Deletion</h3>
            </div>
            <div className="p-7">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                  <FiTrash2 className="w-6 h-6 text-rose-600" />
                </div>
                <p className="text-center text-base font-semibold text-slate-900 mb-1">Are you sure you want to delete this association?</p>
                <p className="text-center text-sm text-slate-500 mb-6">This action cannot be undone.</p>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 w-full mb-5">
                  <p className="font-bold text-base text-rose-800 mb-2">{selectedAssociation.name}</p>
                  <div className="flex flex-col space-y-1 text-sm text-rose-700/90">
                    <p><span className="font-medium">Province:</span> {selectedAssociation.province}</p>
                    <p><span className="font-medium">Municipality:</span> {selectedAssociation.municipality}</p>
                    <p><span className="font-medium">President:</span> {selectedAssociation.president}</p>
                    <p><span className="font-medium">Total Members:</span> {selectedAssociation.totalMembers}</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 w-full flex gap-2.5">
                  <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5 w-4 h-4" />
                  <p className="text-sm text-amber-800"><span className="font-semibold">Warning:</span> All data including member information will be permanently deleted from the system.</p>
                </div>
              </div>
            </div>
            <div className={`${ds.modalFooter} flex justify-end gap-3`}>
              <button onClick={() => setIsDeleteModalOpen(false)} className={ds.btnSecondary}>
                Cancel
              </button>
              <button onClick={handleDeleteAssociation} className={ds.btnDanger}>
                Delete Association
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedViewAssociation && (
        <div className={ds.modalOverlay}>
          <div className={`${ds.modalShell} max-w-4xl flex flex-col max-h-[90vh]`}>
            <div className={ds.modalHeader}>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Association Details</h3>
                <p className="text-sm text-slate-500 mt-0.5">Full information of the selected association</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className={ds.btnIcon}>
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-7 overflow-y-auto flex-1">
              <div className="flex items-center gap-2 mb-6">
                <Badge tone={selectedViewAssociation.status === "Active" ? "success" : "danger"} icon={selectedViewAssociation.status === "Active" ? FiCheckCircle : FiXCircle}>
                  {selectedViewAssociation.status || "—"}
                </Badge>
                {isReadOnlyRecord(selectedViewAssociation) && <Badge tone="neutral">Read-only source</Badge>}
              </div>

              <SectionLegend><FiHome className="w-4 h-4 text-slate-400"/>Basic Information</SectionLegend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <ViewField label="Association Name" value={selectedViewAssociation.name} />
                <ViewField label="Province" value={selectedViewAssociation.province} />
                <ViewField label="Municipality" value={selectedViewAssociation.municipality} />
                <ViewField label="Complete Address" value={selectedViewAssociation.address} />
                <ViewField label="Registration Type" value={selectedViewAssociation.registration_type} />
                <ViewField label="President" value={selectedViewAssociation.president} />
                <ViewField label="Contact Number" value={selectedViewAssociation.contact_number} />
                <ViewField label="Commodity" value={selectedViewAssociation.commodity} />
              </div>

              <SectionLegend><FiUsers className="w-4 h-4 text-slate-400"/>Members Breakdown</SectionLegend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
                <ViewField label="Male Members" value={selectedViewAssociation.members?.male || "0"} />
                <ViewField label="Female Members" value={selectedViewAssociation.members?.female || "0"} />
                <ViewField label="Senior Citizens" value={selectedViewAssociation.members?.senior_citizen || "0"} />
                <ViewField label="Differently-abled" value={selectedViewAssociation.members?.differently_abled || "0"} />
                <ViewField label="Young Farmers" value={selectedViewAssociation.members?.young_farmer || "0"} />
                <ViewField label="IPs" value={selectedViewAssociation.members?.ips || "0"} />
              </div>

              <SectionLegend><FiTag className="w-4 h-4 text-slate-400"/>Group Categories</SectionLegend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
                <ViewField label="Women-Led Group" value={selectedViewAssociation.groupCategories?.womenLed ? "Yes" : "No"} />
                <ViewField label="Men-Led Group" value={selectedViewAssociation.groupCategories?.menLed ? "Yes" : "No"} />
                <ViewField label="Senior Citizens Group" value={selectedViewAssociation.groupCategories?.seniorCitizensGroup ? "Yes" : "No"} />
                <ViewField label="Persons with Disabilities Group" value={selectedViewAssociation.groupCategories?.personsWithDisabilitiesGroup ? "Yes" : "No"} />
                <ViewField label="Young Farmers Organization" value={selectedViewAssociation.groupCategories?.youngFarmersOrganization ? "Yes" : "No"} />
                <ViewField label="Indigenous Peoples Association" value={selectedViewAssociation.groupCategories?.indigenousPeoplesAssociation ? "Yes" : "No"} />
              </div>

              <SectionLegend><FiBriefcase className="w-4 h-4 text-slate-400"/>Intervention Information</SectionLegend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ViewField label="Year" value={selectedViewAssociation.interventionReviewed ? "Yes" : "No"} />
                <ViewField label="Specific Intervention" value={selectedViewAssociation.specificIntervention} />
                <ViewField label="Amount" value={selectedViewAssociation.interventionAmount} />
              </div>
            </div>

            <div className={ds.modalFooter}>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsViewModalOpen(false)} className={ds.btnSecondary}>
                  Close
                </button>
                {!isReadOnlyRecord(selectedViewAssociation) && (
                  <>
                    <button onClick={handleEditFromView} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all duration-150">
                      <FiEdit2 className="text-base" /> Edit
                    </button>
                    <button onClick={handleDeleteFromView} className={ds.btnDanger}>
                      <FiTrash2 className="text-base" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
        .animate-slideUp { animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}