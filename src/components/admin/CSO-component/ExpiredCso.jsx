import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  setDoc,
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
  Archive,
  RotateCcw,
  Save,
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- Helper: Format date ----------
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ---------- Helper: Calculate days since expiration ----------
const daysSinceExpired = (expirationDateString) => {
  if (!expirationDateString) return 0;
  const expDate = new Date(expirationDateString);
  const today = new Date();
  const diffTime = today - expDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// ---------- Helper: Safely get archived date (prefer expiredAt, fallback to date_of_expiration) ----------
const getArchivedDate = (record) => {
  if (record.expiredAt) {
    return new Date(record.expiredAt.seconds * 1000);
  }
  if (record.date_of_expiration) {
    return new Date(record.date_of_expiration);
  }
  return new Date(0);
};

// ---------- Helper: Format archived date for display ----------
const formatArchivedDate = (record) => {
  const date = getArchivedDate(record);
  return date.getTime() === 0 ? 'N/A' : date.toLocaleDateString();
};

// ---------- Helper: Extract province and municipality from address ----------
const parseAddress = (address) => {
  if (!address) return { province: '', municipality: '' };
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    return {
      province: parts[parts.length - 1],
      municipality: parts[parts.length - 2],
    };
  } else if (parts.length === 2) {
    return {
      province: parts[1],
      municipality: parts[0],
    };
  } else {
    return { province: '', municipality: '' };
  }
};

// ---------- Determine specific type from name (matches fullcso‑farmers format) ----------
const getTypeFromName = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('cooperative')) return 'Cooperative';
  if (lower.includes('irrigators association') || lower.includes('irrigators'))
    return 'Irrigators Association';
  if (lower.includes('farmers association') || lower.includes('farmers'))
    return 'Farmers Association';
  return 'Association';
};

// ---------- Advanced parser for no_of_members (handles numbers) ----------
const parseMemberString = (memberStr) => {
  // Convert to string if it's a number
  const str = memberStr ? String(memberStr) : '';
  if (!str) return { total: 0, male: 0, female: 0 };

  let total = 0;
  let male = 0;
  let female = 0;

  const totalMatch = str.match(/(\d+[\d,]*)\s*(?:members?|total|:)/i);
  if (totalMatch) {
    total = parseInt(totalMatch[1].replace(/,/g, ''), 10);
  }

  const maleMatch = str.match(/[Mm][:\-\s]*(\d+)/);
  if (maleMatch) {
    male = parseInt(maleMatch[1], 10);
  }

  const femaleMatch = str.match(/[Ff][:\-\s]*(\d+)/);
  if (femaleMatch) {
    female = parseInt(femaleMatch[1], 10);
  }

  if (total === 0 && (male > 0 || female > 0)) {
    total = male + female;
  }

  if (total === 0) {
    const anyNumber = str.match(/^(\d+)/);
    if (anyNumber) {
      total = parseInt(anyNumber[1], 10);
    }
  }

  return { total, male, female };
};

// ---------- Map CSO record to fullcso‑farmers format ----------
const mapCsoToFarmers = (csoRecord) => {
  const { province: parsedProvince, municipality: parsedMunicipality } = parseAddress(
    csoRecord.address || ''
  );
  const { total, male, female } = parseMemberString(csoRecord.no_of_members || '');

  const interventions = {
    seeds: false,
    mech: false,
    credit: false,
    extn: false,
  };

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
    createdAt: serverTimestamp(),
  };
};

// ---------- Sync to fullcso‑farmers collection ----------
const syncToCsoFarmers = async (csoId, csoData) => {
  if (!csoId) return;
  const farmersData = mapCsoToFarmers(csoData);
  await setDoc(doc(db, 'fullcso-farmers', csoId), farmersData, { merge: true });
};

// ---------- DataTable Component (unchanged but with premium styling) ----------
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
  onRowsPerPageChange,
}) => {
  const handleRowClick = (row, e) => {
    if (
      e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'A' ||
      e.target.closest('button') ||
      e.target.closest('a')
    ) {
      return;
    }
    onRowClick(row);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-red-50 to-orange-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortField === column.key && (
                      <span className="ml-1 text-red-600">
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
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
                  </div>
                  <p className="mt-4 text-gray-500 font-medium">Loading expired records...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-red-50 rounded-full mb-4">
                      <Archive className="h-12 w-12 text-red-400" />
                    </div>
                    <p className="text-gray-700 text-lg font-semibold">
                      No expired records found
                    </p>
                    <p className="text-gray-400 mt-1">All CSOs are currently active</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50/30 transition-all cursor-pointer"
                  onClick={(e) => handleRowClick(row, e)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={pagination.rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="rounded-lg border border-gray-300 text-gray-700 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {[5, 10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">
              Showing <span className="font-semibold">{pagination.startIndex + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.endIndex, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> entries
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronsLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
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
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      pagination.currentPage === pageNum
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md'
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
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronsRight className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Premium Modal Component (glassmorphism, animated) ----------
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full mx-4 border border-white/50 ${sizeClasses[size]}`}
        >
          <div className="sticky top-0 bg-white/80 backdrop-blur-sm rounded-t-2xl px-6 py-5 border-b border-gray-200/80 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ---------- Main Component ----------
const ExpiredCso = () => {
  const [expiredData, setExpiredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpired, setSelectedExpired] = useState(null);
  const [formData, setFormData] = useState({
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
    province: '',
    region: 'MIMAROPA',
    scope: 'Regional',
    nature_of_services: '',
    accreditation_no: '',
    date_of_issuance: '',
    date_of_expiration: '',
    certificate_of_accreditation: '',
  });
  const [saving, setSaving] = useState(false);

  // State for restore date selection
  const [restoreIssuanceDate, setRestoreIssuanceDate] = useState('');
  const [restoreExpirationDate, setRestoreExpirationDate] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    scope: 'all',
    hasCertificate: 'all',
    province: 'all',
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'date_of_expiration',
    direction: 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    totalPages: 1,
  });
  const [stats, setStats] = useState({
    total: 0,
    byProvince: {},
    avgDaysExpired: 0,
    withCertificates: 0,
  });

  // ---------- Fetch expired records ----------
  const fetchExpiredData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const expiredCollection = collection(db, 'cso-expired');
      const q = query(expiredCollection);
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      data.sort((a, b) => {
        const dateA = getArchivedDate(a);
        const dateB = getArchivedDate(b);
        return dateB - dateA;
      });

      setExpiredData(data);

      const total = data.length;
      const withCertificates = data.filter(
        (item) => item.certificate_of_accreditation
      ).length;
      const byProvince = {};
      data.forEach((item) => {
        const province = item.province || 'Unknown';
        byProvince[province] = (byProvince[province] || 0) + 1;
      });
      let totalDays = 0;
      data.forEach((item) => {
        if (item.date_of_expiration) {
          totalDays += daysSinceExpired(item.date_of_expiration);
        }
      });
      const avgDaysExpired = total > 0 ? Math.round(totalDays / total) : 0;

      setStats({ total, byProvince, avgDaysExpired, withCertificates });
    } catch (err) {
      console.error('Error fetching expired CSO data:', err);
      setError('Failed to load expired records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpiredData();
  }, [fetchExpiredData]);

  // ---------- Reset form ----------
  const resetForm = () => {
    setFormData({
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
      province: '',
      region: 'MIMAROPA',
      scope: 'Regional',
      nature_of_services: '',
      accreditation_no: '',
      date_of_issuance: '',
      date_of_expiration: '',
      certificate_of_accreditation: '',
    });
  };

  // ---------- Open Add Modal ----------
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // ---------- Open Edit Modal ----------
  const openEditModal = (record) => {
    setSelectedExpired(record);
    setFormData({
      no: record.no || '',
      name_of_association: record.name_of_association || '',
      contact_person: record.contact_person || '',
      position: record.position || '',
      sex_female: record.sex_female || false,
      sex_male: record.sex_male || false,
      contact_number: record.contact_number || '',
      email_address: record.email_address || '',
      no_of_members: record.no_of_members || '',
      address: record.address || '',
      province: record.province || '',
      region: record.region || 'MIMAROPA',
      scope: record.scope || 'Regional',
      nature_of_services: record.nature_of_services || '',
      accreditation_no: record.accreditation_no || '',
      date_of_issuance: record.date_of_issuance || '',
      date_of_expiration: record.date_of_expiration || '',
      certificate_of_accreditation: record.certificate_of_accreditation || '',
    });
    setShowEditModal(true);
  };

  // ---------- Handle Save (Add / Update) ----------
  const handleSaveRecord = async () => {
    try {
      setSaving(true);
      setError('');

      const dataToSave = {
        ...formData,
        no: formData.no ? Number(formData.no) : null,
        no_of_members: formData.no_of_members ? Number(formData.no_of_members) : null,
        ...(showAddModal &&
          !formData.expiredAt && { expiredAt: serverTimestamp() }),
      };

      if (showAddModal) {
        await addDoc(collection(db, 'cso-expired'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        setSuccess('Expired record added successfully!');
      } else if (showEditModal && selectedExpired) {
        const { id, expiredAt, createdAt, ...updateData } = dataToSave;
        await updateDoc(doc(db, 'cso-expired', selectedExpired.id), updateData);
        setSuccess('Expired record updated successfully!');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchExpiredData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving expired record:', err);
      setError('Failed to save record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Open Restore Modal with default dates ----------
  const openRestoreModal = (record) => {
    setSelectedExpired(record);
    // Default issuance = today, expiration = 3 years from today
    const today = new Date();
    const defaultIssuance = today.toISOString().split('T')[0];
    const defaultExpiration = new Date(today);
    defaultExpiration.setFullYear(today.getFullYear() + 3);
    const defaultExpirationStr = defaultExpiration.toISOString().split('T')[0];
    setRestoreIssuanceDate(defaultIssuance);
    setRestoreExpirationDate(defaultExpirationStr);
    setShowViewModal(false);
    setShowRestoreModal(true);
  };

  // ---------- Restore record (UPDATED: user chooses dates & deletes from rcefexpired) ----------
  const handleRestore = async () => {
    if (!selectedExpired) return;
    if (!restoreExpirationDate) {
      setError('Please select a new expiration date.');
      return;
    }
    try {
      const { expiredAt, movedFrom, id, ...restoreData } = selectedExpired;

      const restoredRecord = {
        ...restoreData,
        date_of_issuance: restoreIssuanceDate,
        date_of_expiration: restoreExpirationDate,
        status: 'Active',
        restoredAt: serverTimestamp(),
      };

      // Add to active CSO collection
      const docRef = await addDoc(collection(db, 'cso'), restoredRecord);

      // Sync to fullcso‑farmers collection
      await syncToCsoFarmers(docRef.id, restoredRecord);

      // Attempt to remove from rcefexpired collection (if exists)
      try {
        await deleteDoc(doc(db, 'rcefexpired', selectedExpired.id));
        console.log(`Removed from rcefexpired: ${selectedExpired.id}`);
      } catch (rcefErr) {
        console.warn('Could not delete from rcefexpired, maybe it doesn’t exist:', rcefErr);
        // Do not block the restore if this fails
      }

      // Remove from expired collection
      await deleteDoc(doc(db, 'cso-expired', selectedExpired.id));

      setSuccess(`${selectedExpired.name_of_association} restored successfully!`);
      setShowRestoreModal(false);
      setSelectedExpired(null);
      fetchExpiredData(); // Refresh expired list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error restoring expired CSO:', err);
      setError('Failed to restore record. Please try again.');
    }
  };

  // ---------- Permanent Delete ----------
  const handlePermanentDelete = async () => {
    if (!selectedExpired) return;
    try {
      await deleteDoc(doc(db, 'cso-expired', selectedExpired.id));
      setSuccess(`${selectedExpired.name_of_association} permanently deleted.`);
      setShowDeleteModal(false);
      setSelectedExpired(null);
      fetchExpiredData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error permanently deleting expired CSO:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  const handleView = (record) => {
    setSelectedExpired(record);
    setShowViewModal(true);
  };

  const openDeleteModal = (record) => {
    setSelectedExpired(record);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ---------- Sort handler ----------
  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleRowsPerPageChange = (rows) => {
    setPagination((prev) => ({ ...prev, rowsPerPage: rows, currentPage: 1 }));
  };

  // ---------- Filtered and sorted data ----------
  const filteredData = useMemo(() => {
    let filtered = [...expiredData];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name_of_association?.toLowerCase().includes(searchLower) ||
          item.contact_person?.toLowerCase().includes(searchLower) ||
          item.accreditation_no?.toLowerCase().includes(searchLower) ||
          item.address?.toLowerCase().includes(searchLower) ||
          item.province?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.scope !== 'all') {
      filtered = filtered.filter((item) => item.scope === filters.scope);
    }

    if (filters.hasCertificate !== 'all') {
      filtered = filtered.filter((item) =>
        filters.hasCertificate === 'yes'
          ? item.certificate_of_accreditation
          : !item.certificate_of_accreditation
      );
    }

    if (filters.province !== 'all') {
      filtered = filtered.filter((item) => item.province === filters.province);
    }

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      if (sortConfig.field === 'no') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortConfig.field === 'expiredAt') {
        aValue = getArchivedDate(a).getTime();
        bValue = getArchivedDate(b).getTime();
      } else if (
        sortConfig.field === 'date_of_expiration' ||
        sortConfig.field === 'date_of_issuance'
      ) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [expiredData, searchTerm, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const endIndex = startIndex + pagination.rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalPages: Math.ceil(filteredData.length / prev.rowsPerPage),
    }));
  }, [filteredData.length, pagination.rowsPerPage]);

  // ---------- Export to Excel (unchanged) ----------
  const exportToExcel = async () => {
    try {
      const mimaropaProvinces = [
        'Occidental Mindoro',
        'Oriental Mindoro',
        'Marinduque',
        'Palawan',
        'Romblon',
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

      const processedData = expiredData.map((item) => {
        const province =
          item.province === 'Regional'
            ? extractProvinceFromAddress(item.address)
            : item.province || extractProvinceFromAddress(item.address);
        return {
          ...item,
          extractedProvince: province,
          numericNo: parseInt(item.no) || 0,
          expiredDate: formatArchivedDate(item),
          daysExpired: daysSinceExpired(item.date_of_expiration),
        };
      });

      const groupedData = {};
      processedData.forEach((item) => {
        const province = item.extractedProvince || 'Unknown Province';
        if (!groupedData[province]) groupedData[province] = [];
        groupedData[province].push(item);
      });

      Object.keys(groupedData).forEach((province) => {
        groupedData[province].sort((a, b) => a.numericNo - b.numericNo);
      });

      const provinceOrder = [
        'Occidental Mindoro',
        'Oriental Mindoro',
        'Marinduque',
        'Palawan',
        'Romblon',
        'Unknown',
      ];
      const sortedProvinces = Object.keys(groupedData).sort((a, b) => {
        const indexA = provinceOrder.indexOf(a);
        const indexB = provinceOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });

      const now = new Date();
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      const wb = XLSXStyle.utils.book_new();

      const titleStyle = {
        font: { name: 'Arial', sz: 16, bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'FEE2E2' }, patternType: 'solid' },
      };
      const subtitleStyle = {
        font: { name: 'Arial', sz: 14, italic: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'FECACA' }, patternType: 'solid' },
      };
      const headerStyle = {
        font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        fill: { fgColor: { rgb: 'B91C1C' }, patternType: 'solid' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        },
      };
      const provinceHeaderStyle = {
        font: { name: 'Arial', sz: 14, bold: true },
        fill: { fgColor: { rgb: 'FCA5A5' }, patternType: 'solid' },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' },
        },
      };
      const dataStyle = {
        font: { name: 'Arial', sz: 11 },
        alignment: { vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        },
      };
      const linkStyle = {
        ...dataStyle,
        font: { name: 'Arial', sz: 11, color: { rgb: '0563C1' }, underline: true },
      };
      const centerStyle = {
        ...dataStyle,
        alignment: { horizontal: 'center', vertical: 'center' },
      };

      const wsData = [];
      const merges = [];

      wsData.push(['LIST OF EXPIRED CIVIL SOCIETY ORGANIZATIONS']);
      wsData.push([`as of ${currentMonth} ${currentYear}`]);
      wsData.push([]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 17 } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 17 } });

      wsData.push([
        'NO.',
        'NAME OF THE ASSOCIATION',
        'CONTACT PERSON',
        'POSITION',
        'SEX',
        '',
        'CONTACT NUMBER',
        'EMAIL ADDRESS',
        'NO. OF MEMBERS',
        'ADDRESS',
        'SCOPE',
        'NATURE OF SERVICES',
        'ACCREDITATION NO.',
        'DATE OF ISSUANCE',
        'DATE OF EXPIRATION',
        'CERTIFICATE OF ACCREDITATION',
        'ARCHIVED ON',
        'DAYS EXPIRED',
      ]);
      wsData.push([
        '',
        '',
        '',
        '',
        'F',
        'M',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);

      merges.push({ s: { r: 3, c: 4 }, e: { r: 3, c: 5 } });
      [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].forEach((col) => {
        merges.push({ s: { r: 3, c: col }, e: { r: 4, c: col } });
      });

      let currentRow = 5;

      sortedProvinces.forEach((province) => {
        const pRow = Array(18).fill('');
        pRow[0] = province.toUpperCase();
        wsData.push(pRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 17 } });
        currentRow++;

        groupedData[province].forEach((item) => {
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
            item.certificate_of_accreditation || '',
            item.expiredDate,
            item.daysExpired.toString(),
          ]);
          currentRow++;
        });
        wsData.push(Array(18).fill(''));
        currentRow++;
      });

      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 8 },
        { wch: 40 },
        { wch: 25 },
        { wch: 20 },
        { wch: 6 },
        { wch: 6 },
        { wch: 18 },
        { wch: 30 },
        { wch: 15 },
        { wch: 45 },
        { wch: 15 },
        { wch: 35 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 45 },
        { wch: 18 },
        { wch: 15 },
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
            const isProvince = sortedProvinces.some(
              (p) => wsData[R] && wsData[R][0] === p.toUpperCase()
            );
            if (isProvince) cell.s = provinceHeaderStyle;
            else if (wsData[R] && wsData[R][0] !== '') {
              if (C === 15 && cell.v && cell.v.toString().startsWith('http')) {
                cell.l = { Target: cell.v, Tooltip: 'Click to view Certificate' };
                cell.s = linkStyle;
              } else {
                cell.s = [0, 4, 5, 8, 17].includes(C) ? centerStyle : dataStyle;
              }
            }
          }
        }
      }

      ws['!merges'] = merges;
      XLSXStyle.utils.book_append_sheet(wb, ws, 'Expired CSOs');
      const excelBuffer = XLSXStyle.write(wb, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true,
      });
      saveAs(new Blob([excelBuffer]), `Expired_CSO_Organizations.xlsx`);
      setSuccess('Export Complete!');
    } catch (err) {
      console.error(err);
      setError('Failed to export Excel');
    }
  };

  // ---------- Table Columns (with Edit action) ----------
  const columns = [
    {
      key: 'no',
      header: 'No.',
      sortable: true,
      render: (row) => <div className="font-mono font-bold text-gray-900">{row.no}</div>,
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
      ),
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
      ),
    },
    {
      key: 'expiration',
      header: 'Expiration',
      render: (row) => (
        <div className="space-y-1">
          <div className="text-sm text-red-600 font-medium">
            {formatDate(row.date_of_expiration)}
          </div>
          <div className="text-xs text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {daysSinceExpired(row.date_of_expiration)} days expired
          </div>
        </div>
      ),
    },
    {
      key: 'expiredAt',
      header: 'Archived On',
      sortable: true,
      render: (row) => <div className="text-sm text-gray-700">{formatArchivedDate(row)}</div>,
    },
    {
      key: 'scope',
      header: 'Scope',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.scope === 'Regional'
              ? 'bg-blue-100 text-blue-800'
              : row.scope === 'National'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.scope}
        </span>
      ),
    },
    {
      key: 'accreditation',
      header: 'Accreditation',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-mono text-xs text-gray-900">{row.accreditation_no || 'N/A'}</div>
          {row.certificate_of_accreditation && (
            <a
              href={row.certificate_of_accreditation}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Certificate
            </a>
          )}
        </div>
      ),
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
            onClick={() => openEditModal(row)}
            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Record"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => openRestoreModal(row)}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Restore to Active"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Permanently Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const provinces = useMemo(() => {
    const uniqueProvinces = [
      ...new Set(expiredData.map((item) => item.province).filter(Boolean)),
    ];
    return uniqueProvinces.sort();
  }, [expiredData]);

  // ---------- Form Input Component (premium) ----------
  const FormInput = ({ label, id, type = 'text', value, onChange, required = false, className = '', ...props }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-black ${className}`}
        {...props}
      />
    </div>
  );

  const FormSelect = ({ label, id, value, onChange, options, required = false }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const FormCheckbox = ({ label, id, checked, onChange }) => (
    <div className="flex items-center space-x-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
      />
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
    </div>
  );

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-orange-50/30 p-4 md:p-6">
      {/* Header with Add Button */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent">
              Expired CSO Records
            </h1>
            <p className="text-gray-600 mt-2 flex items-center">
              <Archive className="h-5 w-5 mr-2 text-red-500" />
              Archived Civil Society Organizations with expired accreditation
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddModal}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Expired Record
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToExcel}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:from-red-700 hover:to-red-600 transition-all"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Excel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchExpiredData}
              className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 font-semibold rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Expired</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <Archive className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-red-400">
            <p className="text-red-100 text-sm">
              {stats.total > 0 ? `${Object.keys(stats.byProvince).length} provinces` : 'No records'}
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Avg. Days Expired</p>
              <p className="text-3xl font-bold mt-2">{stats.avgDaysExpired}</p>
            </div>
            <Clock className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-orange-400">
            <p className="text-orange-100 text-sm">Since expiration</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl shadow-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">With Certificates</p>
              <p className="text-3xl font-bold mt-2">{stats.withCertificates}</p>
            </div>
            <FileText className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-amber-400">
            <p className="text-amber-100 text-sm">
              {stats.total > 0 ? `${Math.round((stats.withCertificates / stats.total) * 100)}%` : '0%'}
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Top Province</p>
              <p className="text-xl font-bold mt-2 truncate max-w-[150px]">
                {Object.entries(stats.byProvince).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </p>
            </div>
            <MapPin className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">
              {Object.entries(stats.byProvince).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} records
            </p>
          </div>
        </motion.div>
      </div>

      {/* Error & Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <div className="text-red-700 font-medium flex-1">{error}</div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg"
          >
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <div className="text-green-700 font-medium flex-1">{success}</div>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expired records by name, contact, accreditation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            >
              <option value="all">All Scopes</option>
              <option value="Regional">Regional</option>
              <option value="National">National</option>
              <option value="Local">Local</option>
            </select>

            <select
              value={filters.hasCertificate}
              onChange={(e) => handleFilterChange('hasCertificate', e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            >
              <option value="all">All Certificates</option>
              <option value="yes">With Certificate</option>
              <option value="no">Without Certificate</option>
            </select>

            <select
              value={filters.province}
              onChange={(e) => handleFilterChange('province', e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            >
              <option value="all">All Provinces</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-gray-600">
            Showing <span className="font-semibold text-red-600">{filteredData.length}</span> of{' '}
            <span className="font-semibold">{expiredData.length}</span> expired records
            {searchTerm && (
              <span className="ml-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">
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
          endIndex: Math.min(
            pagination.currentPage * pagination.rowsPerPage,
            filteredData.length
          ),
        }}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Archive className="h-4 w-4 mr-2 text-red-500" />
              <span>Expired CSO Archive</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              <span>{expiredData.length} Expired Organizations</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- ADD / EDIT MODAL (Premium Form) ---------- */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={showAddModal ? 'Add Expired Record' : 'Edit Expired Record'}
        size="xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveRecord(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <FormInput
                label="No."
                id="no"
                type="number"
                value={formData.no}
                onChange={(e) => setFormData({ ...formData, no: e.target.value })}
              />
              <FormInput
                label="Name of Association"
                id="name_of_association"
                value={formData.name_of_association}
                onChange={(e) => setFormData({ ...formData, name_of_association: e.target.value })}
                required
              />
              <FormInput
                label="Contact Person"
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
              <FormInput
                label="Position"
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              <div className="flex space-x-6">
                <FormCheckbox
                  label="Female"
                  id="sex_female"
                  checked={formData.sex_female}
                  onChange={(e) => setFormData({ ...formData, sex_female: e.target.checked })}
                />
                <FormCheckbox
                  label="Male"
                  id="sex_male"
                  checked={formData.sex_male}
                  onChange={(e) => setFormData({ ...formData, sex_male: e.target.checked })}
                />
              </div>
              <FormInput
                label="Contact Number"
                id="contact_number"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              />
              <FormInput
                label="Email Address"
                id="email_address"
                type="email"
                value={formData.email_address}
                onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
              />
              <FormInput
                label="Number of Members"
                id="no_of_members"
                type="number"
                value={formData.no_of_members}
                onChange={(e) => setFormData({ ...formData, no_of_members: e.target.value })}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <FormInput
                label="Address"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <FormInput
                label="Province"
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              />
              <FormInput
                label="Region"
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
              <FormSelect
                label="Scope"
                id="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                options={[
                  { value: 'Regional', label: 'Regional' },
                  { value: 'National', label: 'National' },
                  { value: 'Local', label: 'Local' },
                ]}
              />
              <FormInput
                label="Nature of Services"
                id="nature_of_services"
                value={formData.nature_of_services}
                onChange={(e) => setFormData({ ...formData, nature_of_services: e.target.value })}
              />
              <FormInput
                label="Accreditation No."
                id="accreditation_no"
                value={formData.accreditation_no}
                onChange={(e) => setFormData({ ...formData, accreditation_no: e.target.value })}
              />
              <FormInput
                label="Date of Issuance"
                id="date_of_issuance"
                type="date"
                value={formData.date_of_issuance}
                onChange={(e) => setFormData({ ...formData, date_of_issuance: e.target.value })}
              />
              <FormInput
                label="Date of Expiration"
                id="date_of_expiration"
                type="date"
                value={formData.date_of_expiration}
                onChange={(e) => setFormData({ ...formData, date_of_expiration: e.target.value })}
              />
              <FormInput
                label="Certificate URL"
                id="certificate_of_accreditation"
                type="url"
                value={formData.certificate_of_accreditation}
                onChange={(e) =>
                  setFormData({ ...formData, certificate_of_accreditation: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-xl hover:from-red-700 hover:to-red-600 transition disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {showAddModal ? 'Add Record' : 'Update Record'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- VIEW MODAL (unchanged but premium) ---------- */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Expired CSO Details"
        size="lg"
      >
        {selectedExpired && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedExpired.name_of_association}</h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      No. {selectedExpired.no}
                    </span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      Expired
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedExpired.scope}
                    </span>
                  </div>
                </div>
                {selectedExpired.certificate_of_accreditation && (
                  <a
                    href={selectedExpired.certificate_of_accreditation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Certificate
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium text-black">{selectedExpired.contact_person || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium text-black">{selectedExpired.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sex</p>
                    <p className="font-medium text-black">
                      {selectedExpired.sex_female ? 'Female' : selectedExpired.sex_male ? 'Male' : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium text-black">{selectedExpired.contact_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-black">{selectedExpired.email_address || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              {/* Location & Members */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Location & Members
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-black">{selectedExpired.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Province</p>
                    <p className="font-medium text-black">{selectedExpired.province || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="font-medium text-black">{selectedExpired.region || 'MIMAROPA'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Number of Members</p>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      <p className="font-medium text-black">{selectedExpired.no_of_members || '0'} members</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Accreditation Details */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-amber-600" />
                  Accreditation Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Accreditation Number</p>
                    <p className="font-medium font-mono text-black">{selectedExpired.accreditation_no || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Issuance</p>
                    <p className="font-medium text-black">
                      {selectedExpired.date_of_issuance ? formatDate(selectedExpired.date_of_issuance) : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Expiration</p>
                    <p className="font-medium text-red-600">
                      {selectedExpired.date_of_expiration ? formatDate(selectedExpired.date_of_expiration) : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
              {/* Expiration Details */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-red-600" />
                  Expiration Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Archived On</p>
                    <p className="font-medium text-black">{formatArchivedDate(selectedExpired)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Days Since Expiration</p>
                    <p className="font-medium text-red-600">{daysSinceExpired(selectedExpired.date_of_expiration)} days</p>
                  </div>
                </div>
              </div>
              {/* Nature of Services */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nature of Services</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedExpired.nature_of_services || 'No services specified'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedExpired);
                }}
                className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openRestoreModal(selectedExpired);
                }}
                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
              >
                <RotateCcw className="h-4 w-4 inline mr-2" />
                Restore
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteModal(selectedExpired);
                }}
                className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition"
              >
                <Trash2 className="h-4 w-4 inline mr-2" />
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Restore Confirmation Modal with Date Pickers */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Expired Record"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-gray-700">
            You are about to restore{' '}
            <span className="font-semibold">{selectedExpired?.name_of_association}</span>.
            This will move it back to the active CSO list. Please set the new accreditation dates:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Date of Issuance (Optional)
              </label>
              <input
                type="date"
                value={restoreIssuanceDate}
                onChange={(e) => setRestoreIssuanceDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Defaults to today if left empty.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Date of Expiration *
              </label>
              <input
                type="date"
                value={restoreExpirationDate}
                onChange={(e) => setRestoreExpirationDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowRestoreModal(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRestore}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition"
            >
              Restore Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Permanent Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Permanently Delete"
        size="sm"
      >
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Permanently Delete</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold">{selectedExpired?.name_of_association}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePermanentDelete}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-600 transition"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExpiredCso;