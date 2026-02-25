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
  RefreshCw
} from 'lucide-react';
import { db } from '../../../config/firebase';

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

// ---------- Helper: Determine type from name ----------
const determineType = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('cooperative')) return 'Cooperative';
  if (lower.includes('association')) return 'Association';
  return 'Accredited CSO';
};

// ---------- Advanced parser for no_of_members ----------
const parseMemberString = (memberStr) => {
  if (!memberStr) return { total: 0, male: 0, female: 0 };

  let total = 0;
  let male = 0;
  let female = 0;

  // First, try to extract total if it's explicitly given (e.g., "538 members", "45;", "139:")
  const totalMatch = memberStr.match(/(\d+[\d,]*)\s*(?:members?|total|:)/i);
  if (totalMatch) {
    total = parseInt(totalMatch[1].replace(/,/g, ''), 10);
  }

  // Extract male count (case‑insensitive)
  const maleMatch = memberStr.match(/[Mm][:\-\s]*(\d+)/);
  if (maleMatch) {
    male = parseInt(maleMatch[1], 10);
  }

  // Extract female count
  const femaleMatch = memberStr.match(/[Ff][:\-\s]*(\d+)/);
  if (femaleMatch) {
    female = parseInt(femaleMatch[1], 10);
  }

  // If no explicit total but male+female sum > 0, use that sum as total
  if (total === 0 && (male > 0 || female > 0)) {
    total = male + female;
  }

  // If still no total, try to extract any leading number (e.g., "32 members")
  if (total === 0) {
    const anyNumber = memberStr.match(/^(\d+)/);
    if (anyNumber) {
      total = parseInt(anyNumber[1], 10);
    }
  }

  return { total, male, female };
};

// ---------- Map CSO record to cso-farmers format ----------
const mapCsoToFarmers = (csoRecord) => {
  const { province: parsedProvince, municipality: parsedMunicipality } = parseAddress(csoRecord.address || '');
  const { total, male, female } = parseMemberString(csoRecord.no_of_members || '');

  return {
    province: csoRecord.province || parsedProvince,
    municipality: parsedMunicipality,
    name: csoRecord.name_of_association || '',
    type: determineType(csoRecord.name_of_association),
    male: male,
    female: female,
    total: total,
    address: csoRecord.address || '',
    contactPerson: csoRecord.contact_person || '',
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
    if (e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'A' ||
        e.target.closest('button') ||
        e.target.closest('a')) {
      return;
    }
    onRowClick(row);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortField === column.key && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="mt-2 text-gray-500">Loading data...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No records found</p>
                    <p className="text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                      onClick={(e) => {
                        if (column.key !== 'actions') {
                          handleRowClick(row, e);
                        }
                      }}
                      style={{
                        cursor: column.key !== 'actions' ? 'pointer' : 'default'
                      }}
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
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={pagination.rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 text-black bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">
              Showing {pagination.startIndex + 1} to {Math.min(pagination.endIndex, pagination.total)} of {pagination.total} entries
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded-md border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronsLeft className="h-4 w-4 text-black" />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded-md border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 text-black" />
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-md text-sm font-medium ${
                      pagination.currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded-md border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4 text-black" />
            </button>
            <button
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded-md border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronsRight className="h-4 w-4 text-black" />
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-50">
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full mx-4 ${sizeClasses[size]}`}>
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 py-4 border-b border-gray-200 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {children}
        </div>
      </div>
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
  const [sortConfig, setSortConfig] = useState({
    field: 'no',
    direction: 'asc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    totalPages: 1
  });
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    withCertificates: 0
  });

  // ---------- Move a single expired record to cso-expired ----------
  const moveExpiredRecord = async (docId, recordData) => {
    try {
      await setDoc(doc(db, 'cso-expired', docId), {
        ...recordData,
        expiredAt: serverTimestamp(),
        movedFrom: 'cso'
      });
      await deleteDoc(doc(db, 'cso', docId));
      return true;
    } catch (error) {
      console.error('Error moving expired record:', error);
      throw error;
    }
  };

  // ---------- Check all records and move expired ones ----------
  const checkAndMoveExpiredRecords = useCallback(async (records) => {
    let movedCount = 0;
    for (const record of records) {
      if (isExpired(record.date_of_expiration)) {
        try {
          await moveExpiredRecord(record.id, record);
          movedCount++;
        } catch (error) {
          console.error(`Failed to move expired record ${record.id}:`, error);
        }
      }
    }
    return movedCount;
  }, []);

  // ---------- Fetch data and automatically archive expired records ----------
  const fetchCSOData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const csoCollection = collection(db, 'cso');
      const q = query(csoCollection, orderBy('no', 'asc'));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      const movedCount = await checkAndMoveExpiredRecords(data);
      let finalData = data;

      if (movedCount > 0) {
        const newSnapshot = await getDocs(q);
        const updatedData = [];
        newSnapshot.forEach((doc) => {
          updatedData.push({ id: doc.id, ...doc.data() });
        });
        finalData = updatedData;
        setSuccess(`${movedCount} expired record(s) moved to archive.`);
        setTimeout(() => setSuccess(''), 3000);
      }

      setCsoData(finalData);

      const total = finalData.length;
      const active = finalData.filter(item => item.status === 'Active').length;
      const withCertificates = finalData.filter(item => item.certificate_of_accreditation).length;
      const expiringSoon = finalData.filter(item => isExpiringSoon(item.date_of_expiration)).length;

      setStats({ total, active, expiringSoon, withCertificates });
    } catch (err) {
      console.error('Error fetching CSO data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [checkAndMoveExpiredRecords]);

  // ---------- Periodic check: run every hour ----------
  useEffect(() => {
    fetchCSOData();
    const interval = setInterval(() => {
      fetchCSOData();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [fetchCSOData]);

  const syncToCsoFarmers = async (csoId, csoData) => {
    if (!csoId) return;
    const farmersData = mapCsoToFarmers(csoData);
    await setDoc(doc(db, 'cso-farmers', csoId), farmersData, { merge: true });
  };

  // ---------- Remove from cso-farmers (by same document ID) ----------
  const removeFromCsoFarmers = async (csoId) => {
    if (!csoId) return;
    try {
      await deleteDoc(doc(db, 'cso-farmers', csoId));
    } catch (error) {
      console.error('Error removing from cso-farmers:', error);
    }
  };

  // ---------- Form input handler ----------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'sex_female' || name === 'sex_male') {
        setFormData(prev => ({
          ...prev,
          sex_female: name === 'sex_female' ? checked : false,
          sex_male: name === 'sex_male' ? checked : false
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // ---------- Submit form (Add / Edit) with sync to cso-farmers ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.no || !formData.name_of_association) {
      setError('No. and Name of Association are required fields');
      return;
    }

    if (formData.date_of_expiration && isExpired(formData.date_of_expiration)) {
      const confirmAdd = window.confirm(
        'This record appears to be expired. It will be automatically moved to the archive. Do you still want to proceed?'
      );
      if (!confirmAdd) return;
    }

    try {
      let docRef;
      if (editingId) {
        // Update existing CSO
        docRef = doc(db, 'cso', editingId);
        await updateDoc(docRef, formData);
        setSuccess('CSO record updated successfully!');
        // Sync to cso-farmers
        await syncToCsoFarmers(editingId, formData);
      } else {
        // Add new CSO
        docRef = await addDoc(collection(db, 'cso'), formData);
        setSuccess('CSO record added successfully!');
        // Sync to cso-farmers
        await syncToCsoFarmers(docRef.id, formData);
      }

      setFormData(initialFormState);
      setEditingId(null);
      setShowAddModal(false);
      fetchCSOData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving CSO data:', err);
      setError('Failed to save data. Please try again.');
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
    setShowAddModal(false);
    setShowViewModal(true);
  };

  // ---------- Delete with removal from cso-farmers ----------
  const handleDelete = async () => {
    if (!selectedCSO) return;

    try {
      // Delete from cso-farmers first (by same ID)
      await removeFromCsoFarmers(selectedCSO.id);
      // Then delete from cso
      await deleteDoc(doc(db, 'cso', selectedCSO.id));
      setSuccess(`${selectedCSO.name_of_association} deleted successfully!`);
      setShowDeleteModal(false);
      fetchCSOData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting CSO:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  const openDeleteModal = (cso) => {
    setSelectedCSO(cso);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ---------- Export to Excel (unchanged) ----------
  const exportToExcelWithBeautifulFormatting = async () => {
    try {
      const mimaropaProvinces = [
        'Occidental Mindoro',
        'Oriental Mindoro',
        'Marinduque',
        'Palawan',
        'Romblon'
      ];

      const extractProvinceFromAddress = (address) => {
        if (!address) return 'Unknown';
        for (const province of mimaropaProvinces) {
          if (address.toLowerCase().includes(province.toLowerCase())) {
            return province;
          }
        }
        if (address.toLowerCase().includes('mindoro occ')) return 'Occidental Mindoro';
        if (address.toLowerCase().includes('mindoro or')) return 'Oriental Mindoro';
        return 'Unknown';
      };

      const processedData = csoData.map(item => {
        const province = item.province === 'Regional'
          ? extractProvinceFromAddress(item.address)
          : (item.province || extractProvinceFromAddress(item.address));
        return {
          ...item,
          extractedProvince: province,
          numericNo: parseInt(item.no) || 0
        };
      });

      const groupedData = {};
      processedData.forEach(item => {
        const province = item.extractedProvince || 'Unknown Province';
        if (!groupedData[province]) groupedData[province] = [];
        groupedData[province].push(item);
      });

      Object.keys(groupedData).forEach(province => {
        groupedData[province].sort((a, b) => a.numericNo - b.numericNo);
      });

      const provinceOrder = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Palawan', 'Romblon', 'Unknown'];
      const sortedProvinces = Object.keys(groupedData).sort((a, b) => {
        const indexA = provinceOrder.indexOf(a);
        const indexB = provinceOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });

      const now = new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      const wb = XLSXStyle.utils.book_new();

      const titleStyle = {
        font: { name: 'Arial', sz: 16, bold: true },
        alignment: { horizontal: "center", vertical: "center" }
      };

      const subtitleStyle = {
        font: { name: 'Arial', sz: 14, italic: true },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "B7E1CD" }, patternType: "solid" },
      };

      const headerStyle = {
        font: { name: 'Arial', sz: 12, bold: true },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { fgColor: { rgb: "93C47D" }, patternType: "solid" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };

      const provinceHeaderStyle = {
        font: { name: 'Arial', sz: 14, bold: true },
        fill: { fgColor: { rgb: "FCD34D" }, patternType: "solid" },
        alignment: { horizontal: "left", vertical: "center" },
        border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } }
      };

      const dataStyle = {
        font: { name: 'Arial', sz: 11 },
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };

      const linkStyle = {
        ...dataStyle,
        font: { name: 'Arial', sz: 11, color: { rgb: "0563C1" }, underline: true }
      };

      const centerStyle = { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } };

      const wsData = [];
      const merges = [];

      wsData.push(['LIST OF ACCREDITED CIVIL SOCIETY ORGANIZATIONS']);
      wsData.push([`as of ${currentMonth} ${currentYear}`]);
      wsData.push([]);

      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 15 } });

      wsData.push([
        'NO.', 'NAME OF THE ASSOCIATION', 'CONTACT PERSON', 'POSITION',
        'SEX', '',
        'CONTACT NUMBER', 'EMAIL ADDRESS', 'NO. OF MEMBERS', 'ADDRESS',
        'SCOPE', 'NATURE OF SERVICES', 'ACCREDITATION NO.',
        'DATE OF ISSUANCE', 'DATE OF EXPIRATION', 'CERTIFICATE OF ACCREDITATION'
      ]);

      wsData.push(['', '', '', '', 'F', 'M', '', '', '', '', '', '', '', '', '', '']);

      merges.push({ s: { r: 3, c: 4 }, e: { r: 3, c: 5 } });
      [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(col => {
        merges.push({ s: { r: 3, c: col }, e: { r: 4, c: col } });
      });

      let currentRow = 5;

      sortedProvinces.forEach(province => {
        const pRow = Array(16).fill('');
        pRow[0] = province.toUpperCase();
        wsData.push(pRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 15 } });
        currentRow++;

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
        wsData.push(Array(16).fill(''));
        currentRow++;
      });

      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 8 }, { wch: 40 }, { wch: 25 }, { wch: 20 },
        { wch: 6 }, { wch: 6 },
        { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 45 },
        { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 18 },
        { wch: 18 }, { wch: 45 }
      ];

      ws['!rows'] = wsData.map((row, i) => {
        if (i === 0) return { hpt: 40 };
        if (i === 1) return { hpt: 35 };
        if (i === 3 || i === 4) return { hpt: 30 };
        if (row && row[0] && !sortedProvinces.includes(row[0])) return { hpt: 35 };
        return { hpt: 25 };
      });

      const range = XLSXStyle.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSXStyle.utils.encode_cell({ r: R, c: C });
          const cell = ws[address];
          if (!cell) continue;

          if (R === 0) cell.s = titleStyle;
          else if (R === 1) cell.s = subtitleStyle;
          else if (R === 3 || R === 4) cell.s = headerStyle;
          else {
            const isProvince = sortedProvinces.some(p => wsData[R] && wsData[R][0] === p.toUpperCase());
            if (isProvince) cell.s = provinceHeaderStyle;
            else if (wsData[R] && wsData[R][0] !== '') {
              if (C === 15 && cell.v && cell.v.toString().startsWith('http')) {
                cell.l = { Target: cell.v, Tooltip: "Click to view Certificate" };
                cell.s = linkStyle;
              } else {
                cell.s = ([0, 4, 5, 8].includes(C)) ? centerStyle : dataStyle;
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
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    try {
      setImportProgress(10);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          setImportProgress(30);
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setImportProgress(50);
          let imported = 0;
          const total = jsonData.length;

          for (let i = 0; i < jsonData.length; i++) {
            const item = jsonData[i];

            let province = item['PROVINCE'] || '';
            if (province === 'Regional' && item['ADDRESS']) {
              const address = item['ADDRESS'];
              const mimaropaProvinces = [
                'Occidental Mindoro',
                'Oriental Mindoro',
                'Marinduque',
                'Palawan',
                'Romblon'
              ];

              for (const p of mimaropaProvinces) {
                if (address.toLowerCase().includes(p.toLowerCase())) {
                  province = p;
                  break;
                }
              }
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
            const progress = Math.round((imported / total) * 100);
            setImportProgress(50 + Math.round(progress / 2));
          }

          setImportProgress(100);
          setTimeout(() => {
            setImportFile(null);
            setImportProgress(0);
            setShowImportModal(false);
            setSuccess(`${imported} records imported successfully!`);
            fetchCSOData();
            setTimeout(() => setSuccess(''), 3000);
          }, 500);
        } catch (err) {
          console.error('Error processing import:', err);
          setError('Error processing file. Please check the format.');
          setImportProgress(0);
        }
      };

      reader.readAsArrayBuffer(importFile);
    } catch (err) {
      console.error('Error importing data:', err);
      setError('Failed to import data. Please try again.');
      setImportProgress(0);
    }
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowsPerPageChange = (rows) => {
    setPagination(prev => ({ ...prev, rowsPerPage: rows, currentPage: 1 }));
  };

  // ---------- Filtered and sorted data ----------
  const filteredData = useMemo(() => {
    let filtered = [...csoData];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name_of_association?.toLowerCase().includes(searchLower) ||
        item.contact_person?.toLowerCase().includes(searchLower) ||
        item.accreditation_no?.toLowerCase().includes(searchLower) ||
        item.address?.toLowerCase().includes(searchLower) ||
        item.province?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.scope !== 'all') {
      filtered = filtered.filter(item => item.scope === filters.scope);
    }

    if (filters.hasCertificate !== 'all') {
      filtered = filtered.filter(item =>
        filters.hasCertificate === 'yes' ? item.certificate_of_accreditation : !item.certificate_of_accreditation
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.province !== 'all') {
      filtered = filtered.filter(item => recordMatchesProvince(item, filters.province));
    }

    if (filters.expirationStatus !== 'all') {
      if (filters.expirationStatus === 'expiringSoon') {
        filtered = filtered.filter(item => isExpiringSoon(item.date_of_expiration));
      } else if (filters.expirationStatus === 'valid') {
        filtered = filtered.filter(item => !isExpiringSoon(item.date_of_expiration));
      }
    }

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      if (sortConfig.field === 'no') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [csoData, searchTerm, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const endIndex = startIndex + pagination.rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination]);

  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(filteredData.length / prev.rowsPerPage)
    }));
  }, [filteredData.length, pagination.rowsPerPage]);

  // ---------- Table Columns ----------
  const columns = [
    {
      key: 'no',
      header: 'No.',
      sortable: true,
      render: (row) => (
        <div className="font-mono font-bold text-gray-900">{row.no}</div>
      )
    },
    {
      key: 'name_of_association',
      header: 'Association Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name_of_association}</div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {row.province || 'No province'}
          </div>
        </div>
      )
    },
    {
      key: 'contact_person',
      header: 'Contact Person',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.contact_person}</div>
          <div className="text-sm text-gray-500">{row.position}</div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (row) => (
        <div className="space-y-1">
          {row.contact_number && (
            <div className="flex items-center text-sm text-black">
              <Phone className="h-3 w-3 mr-2 text-gray-600" />
              {row.contact_number}
            </div>
          )}
          {row.email_address && (
            <div className="flex items-center text-sm text-black">
              <Mail className="h-3 w-3 mr-2 text-gray-600" />
              {row.email_address}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'scope',
      header: 'Scope & Members',
      render: (row) => (
        <div className="space-y-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.scope === 'Regional' ? 'bg-blue-100 text-blue-800' :
            row.scope === 'National' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {row.scope}
          </span>
          {row.no_of_members && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-3 w-3 mr-1" />
              {row.no_of_members} members
            </div>
          )}
        </div>
      )
    },
    {
      key: 'accreditation',
      header: 'Accreditation',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-mono text-sm text-black">{row.accreditation_no}</div>
          {row.date_of_expiration && (
            <div className={`text-xs ${isExpiringSoon(row.date_of_expiration) ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
              Expires: {new Date(row.date_of_expiration).toLocaleDateString()}
              {isExpiringSoon(row.date_of_expiration) && ' (soon)'}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {row.certificate_of_accreditation && (
            <a
              href={row.certificate_of_accreditation}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="View Certificate"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )
    }
  ];

  // ---------- Build list of provinces for dropdown ----------
  const provinces = useMemo(() => {
    const fromData = [...new Set(csoData.map(item => item.province).filter(Boolean))];
    const allProvinces = new Set([...fromData, ...MIMAROPA_PROVINCES]);
    return Array.from(allProvinces).sort();
  }, [csoData]);

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">CSO Management System</h1>
            <p className="text-gray-600 mt-2">Manage Civil Society Organizations in MIMAROPA Region</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New CSO
            </button>

            <button
              onClick={exportToExcelWithBeautifulFormatting}
              className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Excel
            </button>

            <button
              onClick={fetchCSOData}
              className="inline-flex items-center px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total CSOs</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <Building className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">Active: {stats.active}</p>
          </div>
        </div>

        <div className="bg-green-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">With Certificates</p>
              <p className="text-3xl font-bold mt-2">{stats.withCertificates}</p>
            </div>
            <FileText className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-green-100 text-sm">{Math.round((stats.withCertificates / stats.total) * 100) || 0}% of total</p>
          </div>
        </div>

        <div className="bg-amber-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Expiring Soon</p>
              <p className="text-3xl font-bold mt-2">{stats.expiringSoon}</p>
            </div>
            <Calendar className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-amber-400">
            <p className="text-amber-100 text-sm">Within next 90 days</p>
          </div>
        </div>

        <div className="bg-purple-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold mt-2">
                {csoData.reduce((sum, item) => sum + (parseInt(item.no_of_members) || 0), 0).toLocaleString()}
              </p>
            </div>
            <Users className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">Across all organizations</p>
          </div>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div className="text-red-700 font-medium">{error}</div>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-3" />
            <div className="text-green-700 font-medium">{success}</div>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, contact, accreditation, address, or province..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-black pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filters.scope}
              onChange={(e) => handleFilterChange('scope', e.target.value)}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Scopes</option>
              <option value="Regional">Regional</option>
              <option value="National">National</option>
              <option value="Local">Local</option>
            </select>

            <select
              value={filters.hasCertificate}
              onChange={(e) => handleFilterChange('hasCertificate', e.target.value)}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Certificates</option>
              <option value="yes">With Certificate</option>
              <option value="no">Without Certificate</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={filters.province}
              onChange={(e) => handleFilterChange('province', e.target.value)}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Provinces</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>

            <select
              value={filters.expirationStatus}
              onChange={(e) => handleFilterChange('expirationStatus', e.target.value)}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Expiration</option>
              <option value="valid">Valid (not expiring soon)</option>
              <option value="expiringSoon">Expiring Soon (≤90 days)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-gray-600">
            Showing <span className="font-semibold">{filteredData.length}</span> of <span className="font-semibold">{csoData.length}</span> records
            {searchTerm && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Searching: "{searchTerm}"
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        onRowClick={handleView}
        isLoading={loading}
        onSort={handleSort}
        sortField={sortConfig.field}
        sortDirection={sortConfig.direction}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          rowsPerPage: pagination.rowsPerPage,
          total: filteredData.length,
          startIndex: (pagination.currentPage - 1) * pagination.rowsPerPage,
          endIndex: Math.min(pagination.currentPage * pagination.rowsPerPage, filteredData.length)
        }}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <span>MIMAROPA Region CSO Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>{csoData.length} Organizations Registered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormState);
          setEditingId(null);
        }}
        title={editingId ? "Edit CSO Record" : "Add New CSO Record"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. *</label>
                <input
                  type="text"
                  name="no"
                  value={formData.no}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="001"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Association Name *</label>
                <input
                  type="text"
                  name="name_of_association"
                  value={formData.name_of_association}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter association name"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <h4 className="font-semibold text-green-800 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Position/Role"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="sex_female"
                      checked={formData.sex_female}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Female</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="sex_male"
                      checked={formData.sex_male}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Male</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email_address"
                  value={formData.email_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-semibold text-purple-800 mb-4">Location & Scope</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. of Members</label>
                <input
                  type="text"
                  name="no_of_members"
                  value={formData.no_of_members}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 45; F:17; M:28"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Full address including province (e.g., San Agustin St., Brgy. 2, Paluan, Occidental Mindoro)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Province</option>
                  <option value="Occidental Mindoro">Occidental Mindoro</option>
                  <option value="Oriental Mindoro">Oriental Mindoro</option>
                  <option value="Palawan">Palawan</option>
                  <option value="Romblon">Romblon</option>
                  <option value="Marinduque">Marinduque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="MIMAROPA">MIMAROPA</option>
                  <option value="Other">Other Region</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Regional">Regional</option>
                  <option value="National">National</option>
                  <option value="Local">Local</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4">
            <h4 className="font-semibold text-amber-800 mb-4">Accreditation Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Services</label>
                <textarea
                  name="nature_of_services"
                  value={formData.nature_of_services}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Describe the nature of services provided"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full text-black px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accreditation No.</label>
                <input
                  type="text"
                  name="accreditation_no"
                  value={formData.accreditation_no}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="DA-MIMAROPA CSO ACRN No. XXXX-XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Issuance</label>
                <input
                  type="date"
                  name="date_of_issuance"
                  value={formData.date_of_issuance}
                  onChange={handleInputChange}
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Expiration</label>
                <input
                  type="date"
                  name="date_of_expiration"
                  value={formData.date_of_expiration}
                  onChange={handleInputChange}
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Link (Google Drive)</label>
                <input
                  type="url"
                  name="certificate_of_accreditation"
                  value={formData.certificate_of_accreditation}
                  onChange={handleInputChange}
                  className="w-full text-black px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="https://drive.google.com/file/d/..."
                />
                {formData.certificate_of_accreditation && (
                  <a
                    href={formData.certificate_of_accreditation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Test link to certificate
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setFormData(initialFormState);
                setEditingId(null);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="CSO Details"
        size="lg"
      >
        {selectedCSO && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCSO.name_of_association}</h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      No. {selectedCSO.no}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCSO.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedCSO.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedCSO.status}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedCSO.scope}
                    </span>
                  </div>
                </div>
                {selectedCSO.certificate_of_accreditation && (
                  <a
                    href={selectedCSO.certificate_of_accreditation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Certificate
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium text-black">{selectedCSO.contact_person || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium text-black">{selectedCSO.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sex</p>
                    <p className="font-medium text-black">
                      {selectedCSO.sex_female ? 'Female' : selectedCSO.sex_male ? 'Male' : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium text-black">{selectedCSO.contact_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-black">{selectedCSO.email_address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Location & Members
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-black">{selectedCSO.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Province</p>
                    <p className="font-medium text-black">{selectedCSO.province || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="font-medium text-black">{selectedCSO.region || 'MIMAROPA'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Number of Members</p>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      <p className="font-medium text-black">{selectedCSO.no_of_members || '0'} members</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-amber-600" />
                  Accreditation Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Accreditation Number</p>
                    <p className="font-medium font-mono text-black">{selectedCSO.accreditation_no || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Issuance</p>
                    <p className="font-medium text-black">
                      {selectedCSO.date_of_issuance ? new Date(selectedCSO.date_of_issuance).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Expiration</p>
                    <p className={`font-medium text-black ${
                      isExpiringSoon(selectedCSO.date_of_expiration) ? 'text-amber-600' : ''
                    }`}>
                      {selectedCSO.date_of_expiration
                        ? new Date(selectedCSO.date_of_expiration).toLocaleDateString()
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nature of Services</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedCSO.nature_of_services || 'No services specified'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedCSO);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit Record
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteModal(selectedCSO);
                }}
                className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline mr-2" />
                Delete Record
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete CSO Record</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-semibold">{selectedCSO?.name_of_association}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import from Excel"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-xl p-5">
            <h4 className="font-semibold text-blue-800 mb-3">Import Instructions</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Use the Excel export template for correct formatting</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Required columns: No. and Name of Association</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Existing records with matching No. will be updated</span>
              </li>
            </ul>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
            {importFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileText className="h-12 w-12 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{importFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {importProgress > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Importing... {importProgress}%
                    </p>
                  </div>
                )}
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setImportFile(null)}
                    className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Remove File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importProgress > 0}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importProgress > 0 ? 'Importing...' : 'Start Import'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag & drop your Excel file here</p>
                <p className="text-sm text-gray-500 mb-6">or</p>
                <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Upload className="h-5 w-5 mr-2" />
                  Browse Files
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-4">Supports .xlsx, .xls, .csv files</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Accredited;