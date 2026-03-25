import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where
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
  MessageSquare,
  CheckCircle,
  XCircle,
  FileCheck,
  ClipboardList,
  FileSpreadsheet,
  FileBarChart,
  UserCheck,
  FileSignature,
  FileClock,
  FileSearch,
  FilePieChart,
  File,
  CheckSquare,
  Square,
  FolderOpen,
  Layers,
  Send,
  AlertTriangle,
  Award
} from 'lucide-react';
import { db } from '../../../config/firebase';

// ========== DataTable Component (unchanged) ==========
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
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={(e) => handleRowClick(row, e)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm"
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

// ========== Modal Component (unchanged) ==========
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '3xl': 'max-w-7xl'
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

// ========== Initial Form State (includes all fields from RcefAccredited) ==========
const initialFormState = {
  no: '',
  province: '',
  municipality: '',
  name: '',
  date_accredited: '',
  date_expiration: '',
  date_application_received: '',
  type_fca: '',
  male_members: '',
  female_members: '',
  total_members: '',
  area_covered: '',
  address: '',
  contact_person: '',
  contact_no: '',
  remarks: '',
  certificate_of_accreditation: '',
  submitted_documents: '',
  interventions: {
    seeds: false,
    mech: false,
    credit: false,
    extn: false
  },
  // Processing fields
  documentary_requirements: {
    accomplished_and_notarized_application_form: false,
    remarks: '',
    organizational_set_up: false,
    brief_history: false,
    list_of_projects_received_2022_2024: false,
    accomplishment_report_2022_2024: false,
    biodata_of_the_chairperson: false,
    ffedis_registration: false,
    mayors_permit: false,
    bir_registration: false,
    certificate_of_registration_dole_cda_sec: false,
    cert_of_good_standing_from_mayor: false,
    certificate_of_compliance_from_cda_for_coops_only: false,
    notarized_omnibus_sworn_statement: false,
    notarized_secretarys_certificate: false,
    articles_of_incorporation_cooperation_by_laws_and_amendments_if_any: false,
    "2_year_financial_statements": false,
    note_to_afs: '',
    certificate_of_good_standing_from_various_government_agencies: false,
    certification_of_no_projects_received_from_gas: false
  },
  process: {
    advisory_posting: false,
    evaluation_report: false,
    validation_report: false,
    powerpoint_presentation: false,
    evaluated_by: '',
    reviewed_by: ''
  },
  for_deliberation: false
};

// ========== Main Component ==========
const RcefOnProcess = () => {
  const [rcefData, setRcefData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'for_deliberation', 'in_process'
  const [filters, setFilters] = useState({
    province: 'all',
    status: 'all'
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
    for_deliberation: 0,
    completed_documents: 0,
    pending_review: 0
  });

  // ========== Helper: Check if all documentary requirements are completed ==========
  const isDocumentComplete = (docReqs) => {
    if (!docReqs) return false;
    const booleanFields = [
      'accomplished_and_notarized_application_form',
      'organizational_set_up',
      'brief_history',
      'list_of_projects_received_2022_2024',
      'accomplishment_report_2022_2024',
      'biodata_of_the_chairperson',
      'ffedis_registration',
      'mayors_permit',
      'bir_registration',
      'certificate_of_registration_dole_cda_sec',
      'cert_of_good_standing_from_mayor',
      'certificate_of_compliance_from_cda_for_coops_only',
      'notarized_omnibus_sworn_statement',
      'notarized_secretarys_certificate',
      'articles_of_incorporation_cooperation_by_laws_and_amendments_if_any',
      '2_year_financial_statements',
      'certificate_of_good_standing_from_various_government_agencies',
      'certification_of_no_projects_received_from_gas'
    ];
    return booleanFields.every(field => docReqs[field] === true);
  };

  // ========== Fetch RCEF On‑Process Data ==========
  const fetchRcefData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const rcefCollection = collection(db, 'rcef-on-process');
      const q = query(rcefCollection, orderBy('no', 'asc'));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      setRcefData(data);

      const total = data.length;
      const for_deliberation = data.filter(item => item.for_deliberation === true).length;
      const completed_documents = data.filter(item =>
        isDocumentComplete(item.documentary_requirements)
      ).length;
      const pending_review = data.filter(item => {
        const proc = item.process || {};
        return !(
          proc.advisory_posting ||
          proc.evaluation_report ||
          proc.validation_report ||
          proc.powerpoint_presentation
        );
      }).length;

      setStats({ total, for_deliberation, completed_documents, pending_review });
    } catch (err) {
      console.error('Error fetching RCEF data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRcefData();
  }, [fetchRcefData]);

  // ========== Input Change Handler (supports nested fields) ==========
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      const path = name.split('.');
      if (path.length === 1) {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else if (path.length === 2) {
        setFormData(prev => ({
          ...prev,
          [path[0]]: { ...prev[path[0]], [path[1]]: checked }
        }));
      } else if (path.length === 3) {
        setFormData(prev => ({
          ...prev,
          [path[0]]: {
            ...prev[path[0]],
            [path[1]]: { ...prev[path[0]][path[1]], [path[2]]: checked }
          }
        }));
      }
    } else {
      const path = name.split('.');
      if (path.length === 1) {
        setFormData(prev => ({ ...prev, [name]: value }));
      } else if (path.length === 2) {
        setFormData(prev => ({
          ...prev,
          [path[0]]: { ...prev[path[0]], [path[1]]: value }
        }));
      } else if (path.length === 3) {
        setFormData(prev => ({
          ...prev,
          [path[0]]: {
            ...prev[path[0]],
            [path[1]]: { ...prev[path[0]][path[1]], [path[2]]: value }
          }
        }));
      }
    }
  };

  // ========== Submit Handler (Add / Edit) ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.no || !formData.name) {
        setError('No. and Name of Association are required fields');
        return;
      }

      if (editingId) {
        const docRef = doc(db, 'rcef-on-process', editingId);
        await updateDoc(docRef, formData);
        setSuccess('RCEF process record updated successfully!');
      } else {
        await addDoc(collection(db, 'rcef-on-process'), formData);
        setSuccess('RCEF process record added successfully!');
      }

      setFormData(initialFormState);
      setEditingId(null);
      setShowAddModal(false);
      await fetchRcefData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving RCEF data:', err);
      setError('Failed to save data. Please try again.');
    }
  };

  // ========== Edit Handler ==========
  const handleEdit = (record) => {
    setFormData(record);
    setEditingId(record.id);
    setShowViewModal(false);
    setShowAddModal(true);
  };

  // ========== View Handler ==========
  const handleView = (record) => {
    setSelectedRecord(record);
    setShowAddModal(false);
    setShowViewModal(true);
  };

  // ========== Delete Handler ==========
  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      await deleteDoc(doc(db, 'rcef-on-process', selectedRecord.id));
      setSuccess(`${selectedRecord.name} deleted successfully!`);
      setShowDeleteModal(false);
      await fetchRcefData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  // ========== Open Delete Modal ==========
  const openDeleteModal = (record) => {
    setSelectedRecord(record);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ========== Mark Record for Deliberation ==========
  const handleMarkForDeliberation = async () => {
    if (!selectedRecord) return;

    try {
      const updatedRecord = { ...selectedRecord, for_deliberation: true };
      const docRef = doc(db, 'rcef-on-process', selectedRecord.id);
      await updateDoc(docRef, { for_deliberation: true });
      setSuccess(`${selectedRecord.name} has been marked for deliberation.`);
      setShowViewModal(false);
      setSelectedRecord(null);
      await fetchRcefData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking for deliberation:', err);
      setError('Failed to mark record for deliberation. Please try again.');
    }
  };

  // ========== Get Next Sequence Number for Accreditation ==========
  const getNextSequenceNumber = async (province, municipality) => {
    if (!province || !municipality) return '1';
    try {
      const q = query(
        collection(db, 'rcef'),
        where('province', '==', province),
        where('municipality', '==', municipality),
        orderBy('no', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return '1';
      }
      const lastNo = querySnapshot.docs[0].data().no;
      const lastNum = parseInt(lastNo, 10);
      return isNaN(lastNum) ? '1' : (lastNum + 1).toString();
    } catch (error) {
      console.error('Error getting next sequence number:', error);
      return '1';
    }
  };

  // ========== Accredit a Record (move to rcef collection) ==========
  const handleAccredit = async () => {
    if (!selectedRecord) return;

    try {
      // 1. Validate required fields for accreditation
      if (!selectedRecord.name || !selectedRecord.province || !selectedRecord.municipality) {
        setError('Missing required fields for accreditation (name, province, municipality).');
        return;
      }

      // 2. Get next sequence number for the target province/municipality
      const nextNo = await getNextSequenceNumber(selectedRecord.province, selectedRecord.municipality);

      // 3. Prepare the accredited record (copy all accreditation fields)
      const accreditedRecord = {
        no: nextNo,
        province: selectedRecord.province,
        municipality: selectedRecord.municipality,
        name: selectedRecord.name,
        date_accredited: new Date().toISOString(),
        date_expiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        date_application_received: selectedRecord.date_application_received || '',
        type_fca: selectedRecord.type_fca || '',
        male_members: Number(selectedRecord.male_members) || 0,
        female_members: Number(selectedRecord.female_members) || 0,
        total_members: Number(selectedRecord.total_members) || 0,
        area_covered: selectedRecord.area_covered || '',
        address: selectedRecord.address || '',
        contact_person: selectedRecord.contact_person || '',
        contact_no: selectedRecord.contact_no || '',
        remarks: selectedRecord.remarks || '',
        certificate_of_accreditation: selectedRecord.certificate_of_accreditation || '',
        submitted_documents: selectedRecord.submitted_documents || '',
        interventions: selectedRecord.interventions || { seeds: false, mech: false, credit: false, extn: false }
      };

      // 4. Add to rcef collection
      const rcefDocRef = await addDoc(collection(db, 'rcef'), accreditedRecord);
      const rcefId = rcefDocRef.id;

      // 5. Add to fullcso-farmers collection
      const fullCsoRecord = {
        ...accreditedRecord,
        source: 'rcef',
        rcefId: rcefId,
      };
      await addDoc(collection(db, 'fullcso-farmers'), fullCsoRecord);

      // 6. Delete from rcef-on-process
      await deleteDoc(doc(db, 'rcef-on-process', selectedRecord.id));

      setSuccess(`${selectedRecord.name} has been successfully accredited and moved to the RCEF Accredited list.`);
      setShowViewModal(false);
      setSelectedRecord(null);
      await fetchRcefData(); // Refresh the on-process list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error during accreditation:', err);
      setError('Failed to accredit record. Please try again.');
    }
  };

  // ========== Export to Excel (Processing Checklist) ==========
  // (This function remains unchanged – it uses the existing export logic)
  const exportToExcelWithBeautifulFormatting = async () => {
    try {
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
        font: { name: 'Arial', sz: 11, bold: true },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { fgColor: { rgb: "93C47D" }, patternType: "solid" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };
      const subHeaderStyle = {
        font: { name: 'Arial', sz: 10, bold: true },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { fgColor: { rgb: "B6D7A8" }, patternType: "solid" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };
      const docHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "B6D7A8" }, patternType: "solid" } };
      const basicInfoHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "B6D7A8" }, patternType: "solid" } };
      const processHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "B6D7A8" }, patternType: "solid" } };
      
      const dateReceiptHeaderStyle = {
        ...headerStyle,
        fill: { fgColor: { rgb: "8B444A" }, patternType: "solid" },
        font: { ...headerStyle.font, color: { rgb: "000000" } }
      };

      const provinceHeaderStyle = {
        font: { name: 'Arial', sz: 14, bold: true },
        fill: { fgColor: { rgb: "FCD34D" }, patternType: "solid" },
        alignment: { horizontal: "left", vertical: "center" },
        border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } }
      };
      const dataStyle = {
        font: { name: 'Arial', sz: 9 },
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };
      
      const checkboxStyle = {
        font: { name: 'Arial', sz: 14, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };

      const groupedData = {};
      rcefData.forEach(item => {
        const province = item.province || 'Unknown Province';
        if (!groupedData[province]) groupedData[province] = [];
        groupedData[province].push(item);
      });
      Object.keys(groupedData).forEach(province => {
        groupedData[province].sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0));
      });

      const provinceOrder = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Palawan', 'Romblon', 'Unknown Province'];
      const sortedProvinces = Object.keys(groupedData).sort((a, b) => {
        const indexA = provinceOrder.indexOf(a);
        const indexB = provinceOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });

      const wsData = [];
      const merges = [];
      const TOTAL_COLS = 37;

      wsData.push(['RCEF PROCESSING AND DOCUMENT CHECKLIST']);
      wsData.push([`as of ${currentMonth} ${currentYear}`]);
      wsData.push([]);

      const row3 = new Array(TOTAL_COLS).fill('');
      row3[0] = 'NO.';
      row3[1] = 'BASIC INFORMATION';
      row3[8] = 'DATE OF RECEIPT';
      row3[9] = 'DOCUMENTARY REQUIREMENTS';
      row3[29] = 'PROCESS';
      row3[35] = 'FOR DELIBERATION';
      row3[36] = 'REMARKS';
      wsData.push(row3);

      const row4 = new Array(TOTAL_COLS).fill('');
      row4[1] = 'NAME OF THE ASSOCIATION';
      row4[2] = 'CONTACT PERSON';
      row4[3] = 'POSITION';
      row4[4] = 'CONTACT NUMBER';
      row4[5] = 'EMAIL ADDRESS';
      row4[6] = 'NO. OF MEMBERS';
      row4[7] = 'ADDRESS';

      row4[9] = 'Accomplished and Notarized Application Form';
      row4[10] = 'Remarks';
      row4[11] = 'Organizational Set-Up';
      row4[12] = 'Brief History';
      row4[13] = 'List of Projects Received (2022-2024)';
      row4[14] = 'Accomplishment Report (2022-2024)';
      row4[15] = 'Biodata of the Chairperson';
      row4[16] = 'FFEDIS Registration';
      row4[17] = 'Mayor\'s Permit';
      row4[18] = 'BIR Registration';
      row4[19] = 'Certificate of Registration (DOLE/CDA/SEC)';
      row4[20] = 'Cert of Good Standing From Mayor';
      row4[21] = 'Certificate of Compliance from CDA (for Coops only)';
      row4[22] = 'Notarized Omnibus Sworn Statement';
      row4[23] = 'Notarized Secretary\'s Certificate';
      row4[24] = 'Articles of Incorporation/ Cooperation/ By Laws (and amendments if there is any)';
      row4[25] = '2 Year Financial Statements';
      row4[26] = 'Note to AFS';

      row4[29] = 'ADVISORY POSTING';
      row4[30] = 'EVALUATION REPORT';
      row4[31] = 'VALIDATION REPORT';
      row4[32] = 'POWERPOINT PRESENTATION';
      row4[33] = 'EVALUATED BY:';
      row4[34] = 'REVIEWED BY:';

      row4[27] = 'Government Certificates';
      wsData.push(row4);

      const row5 = new Array(TOTAL_COLS).fill('');
      row5[27] = 'Certificate of Good Standing from Various Government Agencies';
      row5[28] = 'Certification of no projects received from GAs';
      wsData.push(row5);

      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

      merges.push({ s: { r: 3, c: 0 }, e: { r: 5, c: 0 } });
      merges.push({ s: { r: 3, c: 8 }, e: { r: 5, c: 8 } });
      merges.push({ s: { r: 3, c: 35 }, e: { r: 5, c: 35 } });
      merges.push({ s: { r: 3, c: 36 }, e: { r: 5, c: 36 } });

      merges.push({ s: { r: 3, c: 1 }, e: { r: 3, c: 7 } });
      merges.push({ s: { r: 3, c: 9 }, e: { r: 3, c: 28 } });
      merges.push({ s: { r: 3, c: 29 }, e: { r: 3, c: 34 } });

      for (let c = 1; c <= 7; c++) {
        merges.push({ s: { r: 4, c: c }, e: { r: 5, c: c } });
      }
      for (let c = 9; c <= 26; c++) {
        merges.push({ s: { r: 4, c: c }, e: { r: 5, c: c } });
      }
      for (let c = 29; c <= 34; c++) {
        merges.push({ s: { r: 4, c: c }, e: { r: 5, c: c } });
      }

      merges.push({ s: { r: 4, c: 27 }, e: { r: 4, c: 28 } });

      let currentRow = 6;

      sortedProvinces.forEach(province => {
        const provinceRow = new Array(TOTAL_COLS).fill('');
        provinceRow[0] = province.toUpperCase();
        wsData.push(provinceRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: TOTAL_COLS - 1 } });
        currentRow++;

        groupedData[province].forEach(item => {
          const dataRow = new Array(TOTAL_COLS).fill('');

          dataRow[0] = item.no || '';

          dataRow[1] = item.name || '';
          dataRow[2] = item.contact_person || '';
          dataRow[3] = ''; // position (not used in processing checklist)
          dataRow[4] = item.contact_no || '';
          dataRow[5] = ''; // email (not used)
          dataRow[6] = item.total_members || '';
          dataRow[7] = item.address || '';

          dataRow[8] = item.date_application_received || '';

          dataRow[9] = item.documentary_requirements?.accomplished_and_notarized_application_form ? '☑' : '☐';
          dataRow[10] = item.documentary_requirements?.remarks || '';
          dataRow[11] = item.documentary_requirements?.organizational_set_up ? '☑' : '☐';
          dataRow[12] = item.documentary_requirements?.brief_history ? '☑' : '☐';
          dataRow[13] = item.documentary_requirements?.list_of_projects_received_2022_2024 ? '☑' : '☐';
          dataRow[14] = item.documentary_requirements?.accomplishment_report_2022_2024 ? '☑' : '☐';
          dataRow[15] = item.documentary_requirements?.biodata_of_the_chairperson ? '☑' : '☐';
          dataRow[16] = item.documentary_requirements?.ffedis_registration ? '☑' : '☐';
          dataRow[17] = item.documentary_requirements?.mayors_permit ? '☑' : '☐';
          dataRow[18] = item.documentary_requirements?.bir_registration ? '☑' : '☐';
          dataRow[19] = item.documentary_requirements?.certificate_of_registration_dole_cda_sec ? '☑' : '☐';
          dataRow[20] = item.documentary_requirements?.cert_of_good_standing_from_mayor ? '☑' : '☐';
          dataRow[21] = item.documentary_requirements?.certificate_of_compliance_from_cda_for_coops_only ? '☑' : '☐';
          dataRow[22] = item.documentary_requirements?.notarized_omnibus_sworn_statement ? '☑' : '☐';
          dataRow[23] = item.documentary_requirements?.notarized_secretarys_certificate ? '☑' : '☐';
          dataRow[24] = item.documentary_requirements?.articles_of_incorporation_cooperation_by_laws_and_amendments_if_any ? '☑' : '☐';
          dataRow[25] = item.documentary_requirements?.["2_year_financial_statements"] ? '☑' : '☐';
          dataRow[26] = item.documentary_requirements?.note_to_afs || '';
          dataRow[27] = item.documentary_requirements?.certificate_of_good_standing_from_various_government_agencies ? '☑' : '☐';
          dataRow[28] = item.documentary_requirements?.certification_of_no_projects_received_from_gas ? '☑' : '☐';

          dataRow[29] = item.process?.advisory_posting ? '☑' : '☐';
          dataRow[30] = item.process?.evaluation_report ? '☑' : '☐';
          dataRow[31] = item.process?.validation_report ? '☑' : '☐';
          dataRow[32] = item.process?.powerpoint_presentation ? '☑' : '☐';
          dataRow[33] = item.process?.evaluated_by || '';
          dataRow[34] = item.process?.reviewed_by || '';

          dataRow[35] = item.for_deliberation ? '☑' : '☐';

          dataRow[36] = item.remarks || '';

          wsData.push(dataRow);
          currentRow++;
        });

        wsData.push(new Array(TOTAL_COLS).fill(''));
        currentRow++;
      });

      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 5 },   // 0  NO.
        { wch: 30 },  // 1  NAME OF THE ASSOCIATION
        { wch: 20 },  // 2  CONTACT PERSON
        { wch: 15 },  // 3  POSITION
        { wch: 15 },  // 4  CONTACT NUMBER
        { wch: 25 },  // 5  EMAIL ADDRESS
        { wch: 15 },  // 6  NO. OF MEMBERS
        { wch: 35 },  // 7  ADDRESS
        { wch: 12 },  // 8  DATE OF RECEIPT
        { wch: 15 },  // 9  Accomplished and Notarized Application Form
        { wch: 15 },  // 10 Remarks
        { wch: 15 },  // 11 Organizational Set-Up
        { wch: 12 },  // 12 Brief History
        { wch: 25 },  // 13 List of Projects Received
        { wch: 20 },  // 14 Accomplishment Report
        { wch: 20 },  // 15 Biodata of the Chairperson
        { wch: 15 },  // 16 FFEDIS Registration
        { wch: 12 },  // 17 Mayor's Permit
        { wch: 12 },  // 18 BIR Registration
        { wch: 25 },  // 19 Certificate of Registration
        { wch: 20 },  // 20 Cert of Good Standing From Mayor
        { wch: 25 },  // 21 Certificate of Compliance from CDA
        { wch: 25 },  // 22 Notarized Omnibus Sworn Statement
        { wch: 20 },  // 23 Notarized Secretary's Certificate
        { wch: 30 },  // 24 Articles of Incorporation
        { wch: 20 },  // 25 2 Year Financial Statements
        { wch: 15 },  // 26 Note to AFS
        { wch: 30 },  // 27 Certificate of Good Standing from Various Government Agencies
        { wch: 30 },  // 28 Certification of no projects received from GAs
        { wch: 15 },  // 29 ADVISORY POSTING
        { wch: 15 },  // 30 EVALUATION REPORT
        { wch: 15 },  // 31 VALIDATION REPORT
        { wch: 20 },  // 32 POWERPOINT PRESENTATION
        { wch: 20 },  // 33 EVALUATED BY:
        { wch: 20 },  // 34 REVIEWED BY:
        { wch: 15 },  // 35 FOR DELIBERATION
        { wch: 30 }   // 36 REMARKS
      ];

      ws['!rows'] = wsData.map((row, i) => {
        if (i === 0) return { hpt: 40 };
        if (i === 1) return { hpt: 35 };
        if (i === 3 || i === 4 || i === 5) return { hpt: 30 };
        if (row && row[0] && !sortedProvinces.includes(row[0].toLowerCase?.()) &&
            sortedProvinces.some(p => row[0] === p.toUpperCase())) {
          return { hpt: 30 };
        }
        return { hpt: 25 };
      });

      const range = XLSXStyle.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSXStyle.utils.encode_cell({ r: R, c: C });
          const cell = ws[address];
          if (!cell) continue;

          if (R === 0) {
            cell.s = titleStyle;
          }
          else if (R === 1) {
            cell.s = subtitleStyle;
          }
          else if (R === 3) {
            if (C === 0 || C === 35 || C === 36) {
              cell.s = headerStyle;
            } else if (C === 8) {
              cell.s = dateReceiptHeaderStyle;
            } else if (C >= 1 && C <= 7) {
              cell.s = basicInfoHeaderStyle;
            } else if (C >= 9 && C <= 28) {
              cell.s = docHeaderStyle;
            } else if (C >= 29 && C <= 34) {
              cell.s = processHeaderStyle;
            }
          }
          else if (R === 4 || R === 5) {
            if (
              (C >= 1 && C <= 7) ||
              (C >= 9 && C <= 28) ||
              (C >= 29 && C <= 34)
            ) {
              cell.s = subHeaderStyle;
            }
          }
          else {
            const isProvince = sortedProvinces.some(p => wsData[R] && wsData[R][0] === p.toUpperCase());
            if (isProvince) {
              cell.s = provinceHeaderStyle;
            }
            else if (wsData[R] && wsData[R][0] !== '') {
              if (C === 35 || 
                  (C >= 9 && C <= 32 && C !== 10 && C !== 26 && C !== 33 && C !== 34)) {
                cell.s = checkboxStyle;
              }
              else if (C === 10 || C === 26 || C === 36) {
                cell.s = dataStyle;
              }
              else if (C === 33 || C === 34) {
                cell.s = { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } };
              }
              else {
                cell.s = dataStyle;
              }
            }
          }
        }
      }

      ws['!merges'] = merges;
      XLSXStyle.utils.book_append_sheet(wb, ws, 'RCEF Processing Checklist');
      const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), `RCEF_Processing_Checklist_${currentMonth}_${currentYear}.xlsx`);
      setSuccess('Export Complete!');
    } catch (err) {
      console.error(err);
      setError('Error exporting to Excel');
    }
  };

  // ========== Import Handler ==========
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const headerRowIndex = 5;
          const headers = jsonData[headerRowIndex];

          setImportProgress(50);
          let imported = 0;
          const total = jsonData.slice(6).filter(row => row[0] && !row[0].toString().includes('PROVINCE') && row[0] !== '').length;

          for (let i = 6; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0] || typeof row[0] === 'string' && row[0].trim() === '' ||
                (row[0] && ['OCCIDENTAL MINDORO', 'ORIENTAL MINDORO', 'MARINDUQUE', 'PALAWAN', 'ROMBLON', 'UNKNOWN PROVINCE'].includes(row[0].toUpperCase()))) continue;

            const processCheckbox = (val) => val === '✓' || val === true || val === 'TRUE';

            const rcefRecord = {
              province: '',
              no: row[0]?.toString() || '',
              name: row[2] || '',
              contact_person: row[3] || '',
              contact_no: row[5]?.toString() || '',
              address: row[8] || '',
              date_application_received: row[1] || '',
              total_members: row[7]?.toString() || '',
              remarks: row[36] || '',
              documentary_requirements: {
                accomplished_and_notarized_application_form: processCheckbox(row[9]),
                remarks: row[10] || '',
                organizational_set_up: processCheckbox(row[11]),
                brief_history: processCheckbox(row[12]),
                list_of_projects_received_2022_2024: processCheckbox(row[13]),
                accomplishment_report_2022_2024: processCheckbox(row[14]),
                biodata_of_the_chairperson: processCheckbox(row[15]),
                ffedis_registration: processCheckbox(row[16]),
                mayors_permit: processCheckbox(row[17]),
                bir_registration: processCheckbox(row[18]),
                certificate_of_registration_dole_cda_sec: processCheckbox(row[19]),
                cert_of_good_standing_from_mayor: processCheckbox(row[20]),
                certificate_of_compliance_from_cda_for_coops_only: processCheckbox(row[21]),
                notarized_omnibus_sworn_statement: processCheckbox(row[22]),
                notarized_secretarys_certificate: processCheckbox(row[23]),
                articles_of_incorporation_cooperation_by_laws_and_amendments_if_any: processCheckbox(row[24]),
                "2_year_financial_statements": processCheckbox(row[25]),
                note_to_afs: row[26] || '',
                certificate_of_good_standing_from_various_government_agencies: processCheckbox(row[27]),
                certification_of_no_projects_received_from_gas: processCheckbox(row[28])
              },
              process: {
                advisory_posting: processCheckbox(row[29]),
                evaluation_report: processCheckbox(row[30]),
                validation_report: processCheckbox(row[31]),
                powerpoint_presentation: processCheckbox(row[32]),
                evaluated_by: row[33] || '',
                reviewed_by: row[34] || ''
              },
              for_deliberation: processCheckbox(row[35])
            };

            // Find province from previous row
            for (let j = i - 1; j >= 0; j--) {
              const prevRow = jsonData[j];
              if (prevRow && prevRow[0] && ['OCCIDENTAL MINDORO', 'ORIENTAL MINDORO', 'MARINDUQUE', 'PALAWAN', 'ROMBLON', 'UNKNOWN PROVINCE'].includes(prevRow[0].toUpperCase())) {
                rcefRecord.province = prevRow[0];
                break;
              }
            }

            const existingQuery = query(collection(db, 'rcef-on-process'), where('no', '==', rcefRecord.no));
            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
              const docRef = doc(db, 'rcef-on-process', existingSnapshot.docs[0].id);
              await updateDoc(docRef, rcefRecord);
            } else {
              await addDoc(collection(db, 'rcef-on-process'), rcefRecord);
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
            fetchRcefData();
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

  // ========== Sort Handler ==========
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // ========== Filter Handlers ==========
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowsPerPageChange = (rows) => {
    setPagination(prev => ({ ...prev, rowsPerPage: rows, currentPage: 1 }));
  };

  // ========== Filtered Data (with tab selection) ==========
  const filteredData = useMemo(() => {
    let filtered = [...rcefData];

    // Apply tab filter
    if (activeTab === 'for_deliberation') {
      filtered = filtered.filter(item => item.for_deliberation === true);
    } else if (activeTab === 'in_process') {
      filtered = filtered.filter(item => item.for_deliberation !== true);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.contact_person?.toLowerCase().includes(searchLower) ||
        item.address?.toLowerCase().includes(searchLower) ||
        item.province?.toLowerCase().includes(searchLower) ||
        item.remarks?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.province !== 'all') {
      filtered = filtered.filter(item => item.province === filters.province);
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
  }, [rcefData, searchTerm, filters, sortConfig, activeTab]);

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

  // ========== Table Columns ==========
  const columns = [
    {
      key: 'association',
      header: 'Association',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {row.province || 'No province'} • {row.municipality || ''}
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.contact_person || '—'}</div>
          <div className="text-sm text-gray-500">{row.contact_no || '—'}</div>
        </div>
      )
    },
    {
      key: 'members',
      header: 'Members',
      render: (row) => (
        <div className="flex items-center">
          <Users className="h-3 w-3 mr-1 text-gray-500" />
          {row.total_members || 0}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="space-y-2">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.for_deliberation ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {row.for_deliberation ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {row.for_deliberation ? 'For Deliberation' : 'In Process'}
          </div>
          <div className="text-xs text-gray-500">
            {row.date_application_received ? `Received: ${new Date(row.date_application_received).toLocaleDateString()}` : 'No receipt date'}
          </div>
        </div>
      )
    },
    {
      key: 'documents',
      header: 'Documents',
      render: (row) => {
        const docReqs = row.documentary_requirements || {};
        const completed = Object.values(docReqs).filter(v => v === true).length;
        const total = Object.keys(docReqs).filter(k => typeof docReqs[k] === 'boolean').length;

        return (
          <div className="space-y-1">
            <div className="flex items-center">
              <FileText className="h-3 w-3 mr-1 text-blue-600" />
              <span className="text-xs text-black font-medium">
                {completed}/{total} documents
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-600 h-1.5 rounded-full"
                style={{ width: `${(completed / total) * 100}%` }}
              ></div>
            </div>
          </div>
        );
      }
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
        </div>
      )
    }
  ];

  const provinces = useMemo(() => {
    const uniqueProvinces = [...new Set(rcefData.map(item => item.province).filter(Boolean))];
    return uniqueProvinces.sort();
  }, [rcefData]);

  const CheckboxField = ({ name, label, checked, onChange }) => (
    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  // ========== Render ==========
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">RCEF Processing System</h1>
            <p className="text-gray-600 mt-2">Track RCEF Organizations Under Processing in MIMAROPA Region</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Record
            </button>

            <button
              onClick={exportToExcelWithBeautifulFormatting}
              className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Excel
            </button>

            <button
              onClick={fetchRcefData}
              className="inline-flex items-center px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total in Process</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <ClipboardList className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">Across all provinces</p>
          </div>
        </div>

        <div className="bg-yellow-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">For Deliberation</p>
              <p className="text-3xl font-bold mt-2">{stats.for_deliberation}</p>
            </div>
            <Send className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-400">
            <p className="text-yellow-100 text-sm">{Math.round((stats.for_deliberation / stats.total) * 100) || 0}% ready</p>
          </div>
        </div>

        <div className="bg-green-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed Documents</p>
              <p className="text-3xl font-bold mt-2">{stats.completed_documents}</p>
            </div>
            <FileCheck className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-green-100 text-sm">All requirements met</p>
          </div>
        </div>

        <div className="bg-red-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Pending Review</p>
              <p className="text-3xl font-bold mt-2">{stats.pending_review}</p>
            </div>
            <AlertTriangle className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-red-400">
            <p className="text-red-100 text-sm">Requires attention</p>
          </div>
        </div>
      </div>

      {/* Error / Success Messages */}
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Records
          </button>
          <button
            onClick={() => setActiveTab('for_deliberation')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'for_deliberation'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            For Deliberation
          </button>
          <button
            onClick={() => setActiveTab('in_process')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'in_process'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            In Process
          </button>
        </nav>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by association name, contact person, address, province, or remarks..."
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
              value={filters.province}
              onChange={(e) => handleFilterChange('province', e.target.value)}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Provinces</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-gray-600">
            Showing <span className="font-semibold">{filteredData.length}</span> of <span className="font-semibold">{rcefData.length}</span> records
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
              <span>MIMAROPA Region RCEF Processing Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              <span>{rcefData.length} Organizations in Process</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL (unchanged) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormState);
          setEditingId(null);
        }}
        title={editingId ? "Edit RCEF Processing Record" : "Add New RCEF Processing Record"}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Level Information */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h4 className="font-semibold text-blue-800 mb-4 text-lg flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Basic Record Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Province</option>
                  <option value="Occidental Mindoro">Occidental Mindoro</option>
                  <option value="Oriental Mindoro">Oriental Mindoro</option>
                  <option value="Marinduque">Marinduque</option>
                  <option value="Palawan">Palawan</option>
                  <option value="Romblon">Romblon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of Association *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter association name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Application Received</label>
                <input
                  type="date"
                  name="date_application_received"
                  value={formData.date_application_received}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Basic Information (Accreditation fields) */}
          <div className="bg-green-50 rounded-xl p-6">
            <h4 className="font-semibold text-green-800 mb-4 text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Association Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of FCA</label>
                <input
                  type="text"
                  name="type_fca"
                  value={formData.type_fca}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Cooperative, Association"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  name="contact_no"
                  value={formData.contact_no}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Male Members</label>
                <input
                  type="number"
                  name="male_members"
                  value={formData.male_members}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Female Members</label>
                <input
                  type="number"
                  name="female_members"
                  value={formData.female_members}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Members</label>
                <input
                  type="number"
                  name="total_members"
                  value={formData.total_members}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Covered (ha)</label>
                <input
                  type="text"
                  name="area_covered"
                  value={formData.area_covered}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 150.5"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate of Accreditation (if any)</label>
                <input
                  type="text"
                  name="certificate_of_accreditation"
                  value={formData.certificate_of_accreditation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="File reference or remarks"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Documents</label>
                <input
                  type="text"
                  name="submitted_documents"
                  value={formData.submitted_documents}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="List of documents submitted"
                />
              </div>
            </div>
          </div>

          {/* Interventions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 text-lg flex items-center">
              <Building className="h-5 w-5 mr-2 text-green-600" />
              Interventions
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <CheckboxField
                name="interventions.seeds"
                label="Seeds"
                checked={formData.interventions.seeds}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="interventions.mech"
                label="Mechanization"
                checked={formData.interventions.mech}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="interventions.credit"
                label="Credit"
                checked={formData.interventions.credit}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="interventions.extn"
                label="Extension"
                checked={formData.interventions.extn}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Documentary Requirements (Processing) */}
          <div className="bg-amber-50 rounded-xl p-6">
            <h4 className="font-semibold text-amber-800 mb-4 text-lg flex items-center">
              <FileCheck className="h-5 w-5 mr-2" />
              Documentary Requirements (Processing Checklist)
            </h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Accomplished and Notarized Application Form</label>
              <div className="flex items-center space-x-4">
                <CheckboxField
                  name="documentary_requirements.accomplished_and_notarized_application_form"
                  label="Completed"
                  checked={formData.documentary_requirements.accomplished_and_notarized_application_form}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="documentary_requirements.remarks"
                  value={formData.documentary_requirements.remarks}
                  onChange={handleInputChange}
                  placeholder="Remarks"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxField
                name="documentary_requirements.organizational_set_up"
                label="Organizational Set-Up"
                checked={formData.documentary_requirements.organizational_set_up}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.brief_history"
                label="Brief History"
                checked={formData.documentary_requirements.brief_history}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.list_of_projects_received_2022_2024"
                label="List of Projects Received (2022-2024)"
                checked={formData.documentary_requirements.list_of_projects_received_2022_2024}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.accomplishment_report_2022_2024"
                label="Accomplishment Report (2022-2024)"
                checked={formData.documentary_requirements.accomplishment_report_2022_2024}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.biodata_of_the_chairperson"
                label="Biodata of the Chairperson"
                checked={formData.documentary_requirements.biodata_of_the_chairperson}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.ffedis_registration"
                label="FFEDIS Registration"
                checked={formData.documentary_requirements.ffedis_registration}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.mayors_permit"
                label="Mayor's Permit"
                checked={formData.documentary_requirements.mayors_permit}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.bir_registration"
                label="BIR Registration"
                checked={formData.documentary_requirements.bir_registration}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.certificate_of_registration_dole_cda_sec"
                label="Certificate of Registration (DOLE/CDA/SEC)"
                checked={formData.documentary_requirements.certificate_of_registration_dole_cda_sec}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.cert_of_good_standing_from_mayor"
                label="Cert of Good Standing From Mayor"
                checked={formData.documentary_requirements.cert_of_good_standing_from_mayor}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.certificate_of_compliance_from_cda_for_coops_only"
                label="Certificate of Compliance from CDA (for Coops only)"
                checked={formData.documentary_requirements.certificate_of_compliance_from_cda_for_coops_only}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.notarized_omnibus_sworn_statement"
                label="Notarized Omnibus Sworn Statement"
                checked={formData.documentary_requirements.notarized_omnibus_sworn_statement}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.notarized_secretarys_certificate"
                label="Notarized Secretary's Certificate"
                checked={formData.documentary_requirements.notarized_secretarys_certificate}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.articles_of_incorporation_cooperation_by_laws_and_amendments_if_any"
                label="Articles of Incorporation/ Cooperation/ By Laws (and amendments if any)"
                checked={formData.documentary_requirements.articles_of_incorporation_cooperation_by_laws_and_amendments_if_any}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.2_year_financial_statements"
                label="2 Year Financial Statements"
                checked={formData.documentary_requirements["2_year_financial_statements"]}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.certificate_of_good_standing_from_various_government_agencies"
                label="Certificate of Good Standing from Various Government Agencies"
                checked={formData.documentary_requirements.certificate_of_good_standing_from_various_government_agencies}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.certification_of_no_projects_received_from_gas"
                label="Certification of no projects received from GAs"
                checked={formData.documentary_requirements.certification_of_no_projects_received_from_gas}
                onChange={handleInputChange}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note to AFS</label>
              <textarea
                name="documentary_requirements.note_to_afs"
                value={formData.documentary_requirements.note_to_afs}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Any notes for the AFS"
              />
            </div>
          </div>

          {/* Process */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h4 className="font-semibold text-purple-800 mb-4 text-lg flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Process
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <CheckboxField
                name="process.advisory_posting"
                label="ADVISORY POSTING"
                checked={formData.process.advisory_posting}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="process.evaluation_report"
                label="EVALUATION REPORT"
                checked={formData.process.evaluation_report}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="process.validation_report"
                label="VALIDATION REPORT"
                checked={formData.process.validation_report}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="process.powerpoint_presentation"
                label="POWERPOINT PRESENTATION"
                checked={formData.process.powerpoint_presentation}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EVALUATED BY:</label>
                <input
                  type="text"
                  name="process.evaluated_by"
                  value={formData.process.evaluated_by}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Name of evaluator"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">REVIEWED BY:</label>
                <input
                  type="text"
                  name="process.reviewed_by"
                  value={formData.process.reviewed_by}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Name of reviewer"
                />
              </div>
            </div>
          </div>

          {/* Final Section */}
          <div className="bg-red-50 rounded-xl p-6">
            <h4 className="font-semibold text-red-800 mb-4 text-lg flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Final Status
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">For Deliberation</label>
                <div className="flex items-center space-x-4">
                  <CheckboxField
                    name="for_deliberation"
                    label="Ready for Deliberation"
                    checked={formData.for_deliberation}
                    onChange={handleInputChange}
                  />
                  {formData.for_deliberation && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ This record is ready for deliberation
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (General)</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter any remarks, follow-up dates, or additional notes"
                />
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

      {/* VIEW MODAL (enhanced with Mark for Deliberation button) */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="RCEF Processing Details"
        size="3xl"
      >
        {selectedRecord && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRecord.name}</h2>
                  <div className="flex items-center mt-2 space-x-3 flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      No. {selectedRecord.no}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedRecord.province} • {selectedRecord.municipality || '—'}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRecord.for_deliberation ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedRecord.for_deliberation ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ready for Deliberation
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-1" />
                          In Process
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Association Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium text-black mt-1">{selectedRecord.contact_person || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-medium text-black mt-1">{selectedRecord.contact_no || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type of FCA</p>
                  <p className="font-medium text-black mt-1">{selectedRecord.type_fca || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Receipt</p>
                  <p className="font-medium text-black mt-1">
                    {selectedRecord.date_application_received ? new Date(selectedRecord.date_application_received).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-black mt-1">{selectedRecord.address || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="font-medium text-black mt-1">
                    Male: {selectedRecord.male_members || 0} | Female: {selectedRecord.female_members || 0} | Total: {selectedRecord.total_members || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Area Covered</p>
                  <p className="font-medium text-black mt-1">{selectedRecord.area_covered || 0} ha</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Certificate of Accreditation</p>
                  <p className="font-medium text-black mt-1">{selectedRecord.certificate_of_accreditation || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Submitted Documents</p>
                  <p className="font-medium text-black mt-1">{selectedRecord.submitted_documents || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Interventions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interventions</h3>
              <div className="flex flex-wrap gap-2">
                {selectedRecord.interventions?.seeds && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Seeds</span>
                )}
                {selectedRecord.interventions?.mech && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Mechanization</span>
                )}
                {selectedRecord.interventions?.credit && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Credit</span>
                )}
                {selectedRecord.interventions?.extn && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">Extension</span>
                )}
                {!selectedRecord.interventions?.seeds && !selectedRecord.interventions?.mech &&
                 !selectedRecord.interventions?.credit && !selectedRecord.interventions?.extn && (
                  <p className="text-gray-500">None</p>
                )}
              </div>
            </div>

            {/* Documentary Requirements */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                Documentary Requirements Status
              </h3>

              {selectedRecord.documentary_requirements && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(selectedRecord.documentary_requirements).map(([key, value]) => {
                      if (typeof value === 'boolean') {
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return (
                          <div key={key} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            {value ? (
                              <CheckSquare className="h-4 w-4 text-green-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-700">{label}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {selectedRecord.documentary_requirements.remarks && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Application Form Remarks</p>
                      <p className="text-sm text-yellow-700">{selectedRecord.documentary_requirements.remarks}</p>
                    </div>
                  )}

                  {selectedRecord.documentary_requirements.note_to_afs && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Note to AFS</p>
                      <p className="text-sm text-blue-700">{selectedRecord.documentary_requirements.note_to_afs}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Process Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-purple-600" />
                Process Status
              </h3>

              {selectedRecord.process && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedRecord.process.advisory_posting ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Send className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Advisory Posting</p>
                      <p className={`text-xs mt-1 ${selectedRecord.process.advisory_posting ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedRecord.process.advisory_posting ? 'Completed' : 'Pending'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedRecord.process.evaluation_report ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileSearch className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Evaluation Report</p>
                      <p className={`text-xs mt-1 ${selectedRecord.process.evaluation_report ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedRecord.process.evaluation_report ? 'Completed' : 'Pending'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedRecord.process.validation_report ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Validation Report</p>
                      <p className={`text-xs mt-1 ${selectedRecord.process.validation_report ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedRecord.process.validation_report ? 'Completed' : 'Pending'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedRecord.process.powerpoint_presentation ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">PowerPoint Presentation</p>
                      <p className={`text-xs mt-1 ${selectedRecord.process.powerpoint_presentation ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedRecord.process.powerpoint_presentation ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Evaluated By</p>
                      <p className="font-medium text-black">{selectedRecord.process.evaluated_by || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reviewed By</p>
                      <p className="font-medium text-black">{selectedRecord.process.reviewed_by || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            {selectedRecord.remarks && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks & Follow-up</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedRecord.remarks}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedRecord);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit Record
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteModal(selectedRecord);
                }}
                className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline mr-2" />
                Delete Record
              </button>
              {!selectedRecord.for_deliberation && (
                <button
                  onClick={handleMarkForDeliberation}
                  className="px-5 py-2.5 bg-yellow-600 text-white font-medium rounded-xl hover:bg-yellow-700 transition-colors"
                >
                  <Send className="h-4 w-4 inline mr-2" />
                  Mark for Deliberation
                </button>
              )}
              <button
                onClick={handleAccredit}
                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                <Award className="h-4 w-4 inline mr-2" />
                Accredit Record
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL (unchanged) */}
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Processing Record</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-semibold">{selectedRecord?.name}</span>? This action cannot be undone.
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

      {/* IMPORT MODAL (unchanged) */}
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

export default RcefOnProcess;