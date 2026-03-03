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
  AlertTriangle
} from 'lucide-react';
import { db } from '../../../config/firebase';

// ========== DataTable Component ==========
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

// ========== Modal Component ==========
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

// ========== Initial Form State ==========
const initialFormState = {
  province: '',
  no: '',
  basic_information: {
    name_of_association: '',
    contact_person: '',
    position: '',
    contact_number: '',
    email_address: '',
    no_of_members: '',
    address: ''
  },
  date_of_receipt: '',
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
  for_deliberation: false,
  remarks: ''
};

// ========== Main Component ==========
const CsoOnProcess = () => {
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
    for_deliberation: 'all',
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

  // ========== Helper: Check if all 18 documents are complete ==========
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

  // ========== Sync complete records to evaluation collection ==========
  const syncCompleteToEvaluation = useCallback(async () => {
    try {
      // Get all CSO-on-Process records
      const csoCollection = collection(db, 'cso-on-process');
      const csoSnapshot = await getDocs(csoCollection);
      const csoRecords = [];
      csoSnapshot.forEach(doc => csoRecords.push({ id: doc.id, ...doc.data() }));

      // Get all existing evaluation records (to check duplicates)
      const evalCollection = collection(db, 'cso-evaluation');
      const evalSnapshot = await getDocs(evalCollection);
      const evalRecords = new Map();
      evalSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.originalId) evalRecords.set(data.originalId, doc.id);
      });

      for (const record of csoRecords) {
        if (isDocumentComplete(record.documentary_requirements)) {
          // If not already in evaluation, copy it
          if (!evalRecords.has(record.id)) {
            const evaluationData = {
              ...record,
              originalId: record.id,
              movedToEvaluationAt: new Date().toISOString()
            };
            delete evaluationData.id;
            await addDoc(collection(db, 'cso-evaluation'), evaluationData);
            console.log(`Copied ${record.basic_information?.name_of_association} to evaluation.`);
          }
        }
      }
    } catch (err) {
      console.error('Error syncing to evaluation:', err);
    }
  }, []);

  // ========== Fetch CSO Data ==========
  const fetchCSOData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const csoCollection = collection(db, 'cso-on-process');
      const q = query(csoCollection, orderBy('no', 'asc'));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      setCsoData(data);

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

      // After fetching, sync complete records to evaluation
      await syncCompleteToEvaluation();
    } catch (err) {
      console.error('Error fetching CSO data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [syncCompleteToEvaluation]);

  useEffect(() => {
    fetchCSOData();
  }, [fetchCSOData]);

  // ========== Input Change Handler ==========
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

  // ========== Submit Handler ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.no || !formData.basic_information.name_of_association) {
        setError('No. and Name of Association are required fields');
        return;
      }

      if (editingId) {
        const docRef = doc(db, 'cso-on-process', editingId);
        await updateDoc(docRef, formData);
        setSuccess('CSO process record updated successfully!');
      } else {
        await addDoc(collection(db, 'cso-on-process'), formData);
        setSuccess('CSO process record added successfully!');
      }

      setFormData(initialFormState);
      setEditingId(null);
      setShowAddModal(false);
      await fetchCSOData(); // includes sync to evaluation

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving CSO data:', err);
      setError('Failed to save data. Please try again.');
    }
  };

  // ========== Edit Handler ==========
  const handleEdit = (cso) => {
    setFormData(cso);
    setEditingId(cso.id);
    setShowViewModal(false);
    setShowAddModal(true);
  };

  // ========== View Handler ==========
  const handleView = (cso) => {
    setSelectedCSO(cso);
    setShowAddModal(false);
    setShowViewModal(true);
  };

  // ========== Delete Handler ==========
  const handleDelete = async () => {
    if (!selectedCSO) return;

    try {
      await deleteDoc(doc(db, 'cso-on-process', selectedCSO.id));
      setSuccess(`${selectedCSO.basic_information.name_of_association} deleted successfully!`);
      setShowDeleteModal(false);
      await fetchCSOData(); // includes sync to evaluation
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting CSO:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  // ========== Open Delete Modal ==========
  const openDeleteModal = (cso) => {
    setSelectedCSO(cso);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ========== Export to Excel ==========
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
      csoData.forEach(item => {
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

      wsData.push(['CSO PROCESSING AND DOCUMENT CHECKLIST']);
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

          dataRow[1] = item.basic_information?.name_of_association || '';
          dataRow[2] = item.basic_information?.contact_person || '';
          dataRow[3] = item.basic_information?.position || '';
          dataRow[4] = item.basic_information?.contact_number || '';
          dataRow[5] = item.basic_information?.email_address || '';
          dataRow[6] = item.basic_information?.no_of_members || '';
          dataRow[7] = item.basic_information?.address || '';

          dataRow[8] = item.date_of_receipt || '';

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
      XLSXStyle.utils.book_append_sheet(wb, ws, 'CSO Processing Checklist');
      const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), `CSO_Processing_Checklist_${currentMonth}_${currentYear}.xlsx`);
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

            const csoRecord = {
              province: '',
              no: row[0]?.toString() || '',
              basic_information: {
                name_of_association: row[2] || '',
                contact_person: row[3] || '',
                position: row[4] || '',
                contact_number: row[5]?.toString() || '',
                email_address: row[6] || '',
                no_of_members: row[7]?.toString() || '',
                address: row[8] || ''
              },
              date_of_receipt: row[1] || '',
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
              for_deliberation: processCheckbox(row[35]),
              remarks: row[36] || ''
            };

            for (let j = i - 1; j >= 0; j--) {
              const prevRow = jsonData[j];
              if (prevRow && prevRow[0] && ['OCCIDENTAL MINDORO', 'ORIENTAL MINDORO', 'MARINDUQUE', 'PALAWAN', 'ROMBLON', 'UNKNOWN PROVINCE'].includes(prevRow[0].toUpperCase())) {
                csoRecord.province = prevRow[0];
                break;
              }
            }

            const existingQuery = query(collection(db, 'cso-on-process'), where('no', '==', csoRecord.no));
            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
              const docRef = doc(db, 'cso-on-process', existingSnapshot.docs[0].id);
              await updateDoc(docRef, csoRecord);
            } else {
              await addDoc(collection(db, 'cso-on-process'), csoRecord);
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
            fetchCSOData(); // includes sync to evaluation
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

  // ========== Filtered Data ==========
  const filteredData = useMemo(() => {
    let filtered = [...csoData];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.basic_information?.name_of_association?.toLowerCase().includes(searchLower) ||
        item.basic_information?.contact_person?.toLowerCase().includes(searchLower) ||
        item.basic_information?.address?.toLowerCase().includes(searchLower) ||
        item.province?.toLowerCase().includes(searchLower) ||
        item.remarks?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.for_deliberation !== 'all') {
      filtered = filtered.filter(item =>
        filters.for_deliberation === 'yes' ? item.for_deliberation : !item.for_deliberation
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

  // ========== Table Columns ==========
  const columns = [
    {
      key: 'association',
      header: 'Association',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.basic_information?.name_of_association}</div>
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
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.basic_information?.contact_person}</div>
          <div className="text-sm text-gray-500">{row.basic_information?.position}</div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (row) => (
        <div className="space-y-1">
          {row.basic_information?.contact_number && (
            <div className="flex items-center text-sm text-black">
              <Phone className="h-3 w-3 mr-2 text-gray-600" />
              {row.basic_information.contact_number}
            </div>
          )}
          {row.basic_information?.email_address && (
            <div className="flex items-center text-sm text-black">
              <Mail className="h-3 w-3 mr-2 text-gray-600" />
              {row.basic_information.email_address}
            </div>
          )}
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
            {row.date_of_receipt ? `Received: ${new Date(row.date_of_receipt).toLocaleDateString()}` : 'No receipt date'}
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
    const uniqueProvinces = [...new Set(csoData.map(item => item.province).filter(Boolean))];
    return uniqueProvinces.sort();
  }, [csoData]);

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">CSO Processing System</h1>
            <p className="text-gray-600 mt-2">Track Civil Society Organizations Under Processing in MIMAROPA Region</p>
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
              onClick={fetchCSOData}
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
              value={filters.for_deliberation}
              onChange={(e) => handleFilterChange('for_deliberation', e.target.value)}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="yes">For Deliberation</option>
              <option value="no">In Process</option>
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
              <span>MIMAROPA Region CSO Processing Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              <span>{csoData.length} Organizations in Process</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormState);
          setEditingId(null);
        }}
        title={editingId ? "Edit CSO Processing Record" : "Add New CSO Processing Record"}
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
                  <option value="OCCIDENTAL MINDORO">Occidental Mindoro</option>
                  <option value="ORIENTAL MINDORO">Oriental Mindoro</option>
                  <option value="MARINDUQUE">Marinduque</option>
                  <option value="PALAWAN">Palawan</option>
                  <option value="ROMBLON">Romblon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Receipt</label>
                <input
                  type="date"
                  name="date_of_receipt"
                  value={formData.date_of_receipt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-green-50 rounded-xl p-6">
            <h4 className="font-semibold text-green-800 mb-4 text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of Association *</label>
                <input
                  type="text"
                  name="basic_information.name_of_association"
                  value={formData.basic_information.name_of_association}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter association name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="basic_information.contact_person"
                  value={formData.basic_information.contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  name="basic_information.position"
                  value={formData.basic_information.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5  text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Position/Role"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="basic_information.contact_number"
                  value={formData.basic_information.contact_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="basic_information.email_address"
                  value={formData.basic_information.email_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. of Members</label>
                <input
                  type="text"
                  name="basic_information.no_of_members"
                  value={formData.basic_information.no_of_members}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 100 members M-91; F-9"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="basic_information.address"
                  value={formData.basic_information.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          {/* Documentary Requirements */}
          <div className="bg-amber-50 rounded-xl p-6">
            <h4 className="font-semibold text-amber-800 mb-4 text-lg flex items-center">
              <FileCheck className="h-5 w-5 mr-2" />
              Documentary Requirements
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter any remarks, follow-up dates, or additional notes"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: Follow up date: March 11, 2024, March 17, 2024, March 26, 2024...
                </p>
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

      {/* VIEW MODAL */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="CSO Processing Details"
        size="3xl"
      >
        {selectedCSO && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCSO.basic_information?.name_of_association}</h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      No. {selectedCSO.no}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedCSO.province}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCSO.for_deliberation ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedCSO.for_deliberation ? (
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
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium text-black mt-1">{selectedCSO.basic_information?.contact_person || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium text-black mt-1">{selectedCSO.basic_information?.position || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-medium text-black mt-1">{selectedCSO.basic_information?.contact_number || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-black mt-1">{selectedCSO.basic_information?.email_address || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No. of Members</p>
                  <p className="font-medium text-black mt-1">{selectedCSO.basic_information?.no_of_members || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Receipt</p>
                  <p className="font-medium text-black mt-1">
                    {selectedCSO.date_of_receipt ? new Date(selectedCSO.date_of_receipt).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-black mt-1">{selectedCSO.basic_information?.address || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Documentary Requirements */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                Documentary Requirements Status
              </h3>

              {selectedCSO.documentary_requirements && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(selectedCSO.documentary_requirements).map(([key, value]) => {
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

                  {selectedCSO.documentary_requirements.remarks && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Application Form Remarks</p>
                      <p className="text-sm text-yellow-700">{selectedCSO.documentary_requirements.remarks}</p>
                    </div>
                  )}

                  {selectedCSO.documentary_requirements.note_to_afs && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Note to AFS</p>
                      <p className="text-sm text-blue-700">{selectedCSO.documentary_requirements.note_to_afs}</p>
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

              {selectedCSO.process && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedCSO.process.advisory_posting ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Send className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Advisory Posting</p>
                      <p className={`text-xs mt-1 ${selectedCSO.process.advisory_posting ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedCSO.process.advisory_posting ? 'Completed' : 'Pending'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedCSO.process.evaluation_report ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileSearch className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Evaluation Report</p>
                      <p className={`text-xs mt-1 ${selectedCSO.process.evaluation_report ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedCSO.process.evaluation_report ? 'Completed' : 'Pending'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedCSO.process.validation_report ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Validation Report</p>
                      <p className={`text-xs mt-1 ${selectedCSO.process.validation_report ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedCSO.process.validation_report ? 'Completed' : 'Pending'}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                        selectedCSO.process.powerpoint_presentation ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">PowerPoint Presentation</p>
                      <p className={`text-xs mt-1 ${selectedCSO.process.powerpoint_presentation ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedCSO.process.powerpoint_presentation ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Evaluated By</p>
                      <p className="font-medium text-black">{selectedCSO.process.evaluated_by || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reviewed By</p>
                      <p className="font-medium text-black">{selectedCSO.process.reviewed_by || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            {selectedCSO.remarks && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks & Follow-up</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedCSO.remarks}</p>
                </div>
              </div>
            )}

            {/* Actions */}
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

      {/* DELETE MODAL */}
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
            Are you sure you want to delete <span className="font-semibold">{selectedCSO?.basic_information?.name_of_association}</span>? This action cannot be undone.
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

      {/* IMPORT MODAL */}
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

export default CsoOnProcess;