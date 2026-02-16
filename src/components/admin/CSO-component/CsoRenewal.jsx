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
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  RefreshCw,
  Clock,
  CheckCircle,
  FileCheck,
  ClipboardList,
  CheckSquare,
  Square,
  FolderOpen,
  Layers,
  Send,
  AlertTriangle,
  FileSearch
} from 'lucide-react';
import { db } from '../../../config/firebase';

// ---------- DataTable (identical to your original) ----------
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

// ---------- Modal (identical) ----------
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

// ---------- INITIAL FORM STATE for CSO RENEWAL ----------
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
    accomplished_and_notarized_renewal_form: false,
    remarks: '',
    photocopy_of_certificate_of_cso_accreditation_issued_by_da: false,
    omnibus_sworn_statement_including_having_submitted_all_material_changes_updates_on_accreditation_documents: false,
    new_certificate_of_good_standing_from_government_agencies: false,
    audited_financial_statement_2022_2024: false,
    updated_certificate_of_compliance_from_cda_for_coops_only: false
  },
  process: {
    evaluation_report: false,
    validation_report: false,
    powerpoint_presentation: false,
    evaluated_by: '',
    reviewed_by: ''
  },
  for_deliberation: false,
  remarks: ''
};

const CsoRenewal = () => {
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

  // ---------- FETCH DATA from 'cso-renewal' ----------
  const fetchCSOData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const csoCollection = collection(db, 'cso-renewal');
      const q = query(csoCollection, orderBy('no', 'asc'));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      setCsoData(data);

      const total = data.length;
      const for_deliberation = data.filter(item => item.for_deliberation === true).length;

      const completed_documents = data.filter(item => {
        const docReqs = item.documentary_requirements || {};
        return (
          docReqs.accomplished_and_notarized_renewal_form &&
          docReqs.photocopy_of_certificate_of_cso_accreditation_issued_by_da &&
          docReqs.omnibus_sworn_statement_including_having_submitted_all_material_changes_updates_on_accreditation_documents &&
          docReqs.new_certificate_of_good_standing_from_government_agencies &&
          docReqs.audited_financial_statement_2022_2024 &&
          docReqs.updated_certificate_of_compliance_from_cda_for_coops_only
        );
      }).length;

      const pending_review = data.filter(item => {
        const proc = item.process || {};
        return !(
          proc.evaluation_report ||
          proc.validation_report ||
          proc.powerpoint_presentation
        );
      }).length;

      setStats({ total, for_deliberation, completed_documents, pending_review });
    } catch (err) {
      console.error('Error fetching CSO renewal data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCSOData();
  }, [fetchCSOData]);

  // ---------- HANDLE INPUT CHANGE (handles nested paths) ----------
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

  // ---------- SUBMIT (add / edit) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.no || !formData.basic_information.name_of_association) {
        setError('No. and Name of Association are required fields');
        return;
      }

      if (editingId) {
        const docRef = doc(db, 'cso-renewal', editingId);
        await updateDoc(docRef, formData);
        setSuccess('CSO renewal record updated successfully!');
      } else {
        await addDoc(collection(db, 'cso-renewal'), formData);
        setSuccess('CSO renewal record added successfully!');
      }

      setFormData(initialFormState);
      setEditingId(null);
      setShowAddModal(false);
      fetchCSOData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving CSO renewal data:', err);
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

  const handleDelete = async () => {
    if (!selectedCSO) return;

    try {
      await deleteDoc(doc(db, 'cso-renewal', selectedCSO.id));
      setSuccess(`${selectedCSO.basic_information.name_of_association} deleted successfully!`);
      setShowDeleteModal(false);
      fetchCSOData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting CSO renewal:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  const openDeleteModal = (cso) => {
    setSelectedCSO(cso);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ---------- EXCEL EXPORT – RENEWAL FORMAT ----------
const exportToExcelWithBeautifulFormatting = async () => {
  try {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    const wb = XLSXStyle.utils.book_new();

    // ----- STYLES (identical to your original) -----
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
    const basicInfoHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "F9CB9C" }, patternType: "solid" } };
    const processHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "B6D7A8" }, patternType: "solid" } };

    const dateReceiptHeaderStyle = {
      ...headerStyle,
      fill: { fgColor: { rgb: "8B444A" }, patternType: "solid" },
      font: { ...headerStyle.font, color: { rgb: "FFFFFF" } }
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

    // ----- GROUP DATA BY PROVINCE -----
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

    // ----- BUILD WORKSHEET – RENEWAL LAYOUT, 23 COLUMNS (0–22) -----
    const wsData = [];
    const merges = [];
    const TOTAL_COLS = 23; // ✅ FIXED: no extra columns

    wsData.push(['CSO RENEWAL AND DOCUMENT CHECKLIST']);
    wsData.push([`as of ${currentMonth} ${currentYear}`]);
    wsData.push([]);

    // ROW 3: MAIN SECTION HEADERS
    const row3 = new Array(TOTAL_COLS).fill('');
    row3[0] = 'NO.';
    row3[1] = 'BASIC INFORMATION';       // merge 1-7
    row3[8] = 'DATE OF RECEIPT';         // column 8
    row3[9] = 'DOCUMENTARY REQUIREMENTS'; // merge 9-15 (7 cols)
    row3[16] = 'PROCESS';               // merge 16-20 (5 cols)
    row3[21] = 'FOR DELIBERATION';      // column 21
    row3[22] = 'REMARKS';              // column 22
    wsData.push(row3);

    // ROW 4: SUB-HEADERS
    const row4 = new Array(TOTAL_COLS).fill('');
    // BASIC INFORMATION (col1-7)
    row4[1] = 'NAME OF THE ASSOCIATION';
    row4[2] = 'CONTACT PERSON';
    row4[3] = 'POSITION';
    row4[4] = 'CONTACT NUMBER';
    row4[5] = 'EMAIL ADDRESS';
    row4[6] = 'NO. OF MEMBERS';
    row4[7] = 'ADDRESS';

    // DOCUMENTARY REQUIREMENTS (col9-15)
    row4[9] = 'Accomplished and Notarized Renewal Form';
    row4[10] = 'Remarks';
    row4[11] = 'Photocopy of Certificate of CSO Accreditation issued by DA';
    row4[12] = 'Omnibus Sworn Statement including having submitted all material changes/updates on accreditation documents';
    row4[13] = 'New Certificate of Good Standing from Government Agencies';
    row4[14] = 'Audited Financial Statement (2022-2024)';
    row4[15] = 'Updated Certificate of Compliance from CDA (for Coops only)';

    // PROCESS (col16-20)
    row4[16] = 'EVALUATION REPORT';
    row4[17] = 'VALIDATION REPORT';
    row4[18] = 'POWERPOINT PRESENTATION';
    row4[19] = 'EVALUATED BY:';
    row4[20] = 'REVIEWED BY:';

    // FOR DELIBERATION and REMARKS are single columns – no sub‑header needed
    wsData.push(row4);

    // ----- MERGES -----
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

    // Vertical merges for NO., DATE OF RECEIPT, FOR DELIBERATION, REMARKS (span rows 3-4)
    merges.push({ s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }); // NO.
    merges.push({ s: { r: 3, c: 8 }, e: { r: 4, c: 8 } }); // DATE OF RECEIPT
    merges.push({ s: { r: 3, c: 21 }, e: { r: 4, c: 21 } }); // FOR DELIBERATION
    merges.push({ s: { r: 3, c: 22 }, e: { r: 4, c: 22 } }); // REMARKS

    // Horizontal merges on row3
    merges.push({ s: { r: 3, c: 1 }, e: { r: 3, c: 7 } }); // BASIC INFO
    merges.push({ s: { r: 3, c: 9 }, e: { r: 3, c: 15 } }); // DOC REQS
    merges.push({ s: { r: 3, c: 16 }, e: { r: 3, c: 20 } }); // PROCESS

    // ----- DATA ROWS -----
    let currentRow = 5; // after row3 and row4

    sortedProvinces.forEach(province => {
      const provinceRow = new Array(TOTAL_COLS).fill('');
      provinceRow[0] = province.toUpperCase();
      wsData.push(provinceRow);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: TOTAL_COLS - 1 } });
      currentRow++;

      groupedData[province].forEach(item => {
        const dataRow = new Array(TOTAL_COLS).fill('');

        dataRow[0] = item.no || '';

        // BASIC INFO
        dataRow[1] = item.basic_information?.name_of_association || '';
        dataRow[2] = item.basic_information?.contact_person || '';
        dataRow[3] = item.basic_information?.position || '';
        dataRow[4] = item.basic_information?.contact_number || '';
        dataRow[5] = item.basic_information?.email_address || '';
        dataRow[6] = item.basic_information?.no_of_members || '';
        dataRow[7] = item.basic_information?.address || '';

        // DATE OF RECEIPT
        dataRow[8] = item.date_of_receipt || '';

        // DOCUMENTARY REQUIREMENTS
        dataRow[9] = item.documentary_requirements?.accomplished_and_notarized_renewal_form ? '☑' : '☐';
        dataRow[10] = item.documentary_requirements?.remarks || '';
        dataRow[11] = item.documentary_requirements?.photocopy_of_certificate_of_cso_accreditation_issued_by_da ? '☑' : '☐';
        dataRow[12] = item.documentary_requirements?.omnibus_sworn_statement_including_having_submitted_all_material_changes_updates_on_accreditation_documents ? '☑' : '☐';
        dataRow[13] = item.documentary_requirements?.new_certificate_of_good_standing_from_government_agencies ? '☑' : '☐';
        dataRow[14] = item.documentary_requirements?.audited_financial_statement_2022_2024 ? '☑' : '☐';
        dataRow[15] = item.documentary_requirements?.updated_certificate_of_compliance_from_cda_for_coops_only ? '☑' : '☐';

        // PROCESS
        dataRow[16] = item.process?.evaluation_report ? '☑' : '☐';
        dataRow[17] = item.process?.validation_report ? '☑' : '☐';
        dataRow[18] = item.process?.powerpoint_presentation ? '☑' : '☐';
        dataRow[19] = item.process?.evaluated_by || '';
        dataRow[20] = item.process?.reviewed_by || '';

        // FOR DELIBERATION
        dataRow[21] = item.for_deliberation ? '☑' : '☐';

        // REMARKS
        dataRow[22] = item.remarks || '';

        wsData.push(dataRow);
        currentRow++;
      });

      // Empty separator row between provinces
      wsData.push(new Array(TOTAL_COLS).fill(''));
      currentRow++;
    });

    const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

    // ----- COLUMN WIDTHS (23 columns, indices 0–22) -----
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
      { wch: 20 },  // 9  Accomplished and Notarized Renewal Form
      { wch: 15 },  // 10 Remarks
      { wch: 30 },  // 11 Photocopy of Certificate of CSO Accreditation issued by DA
      { wch: 40 },  // 12 Omnibus Sworn Statement...
      { wch: 30 },  // 13 New Certificate of Good Standing...
      { wch: 25 },  // 14 Audited Financial Statement (2022-2024)
      { wch: 30 },  // 15 Updated Certificate of Compliance from CDA (for Coops only)
      { wch: 15 },  // 16 EVALUATION REPORT
      { wch: 15 },  // 17 VALIDATION REPORT
      { wch: 20 },  // 18 POWERPOINT PRESENTATION
      { wch: 20 },  // 19 EVALUATED BY:
      { wch: 20 },  // 20 REVIEWED BY:
      { wch: 15 },  // 21 FOR DELIBERATION
      { wch: 30 }   // 22 REMARKS
    ];

    // ----- ROW HEIGHTS -----
    ws['!rows'] = wsData.map((row, i) => {
      if (i === 0) return { hpt: 40 };
      if (i === 1) return { hpt: 35 };
      if (i === 3 || i === 4) return { hpt: 30 };
      if (row && row[0] && !sortedProvinces.includes(row[0].toLowerCase?.()) &&
          sortedProvinces.some(p => row[0] === p.toUpperCase())) {
        return { hpt: 30 };
      }
      return { hpt: 25 };
    });

    // ----- APPLY STYLES -----
    const range = XLSXStyle.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSXStyle.utils.encode_cell({ r: R, c: C });
        const cell = ws[address];
        if (!cell) continue;

        if (R === 0) {
          cell.s = titleStyle;
        } else if (R === 1) {
          cell.s = subtitleStyle;
        } else if (R === 3) {
          if (C === 0 || C === 21 || C === 22) {
            cell.s = headerStyle;
          } else if (C === 8) {
            cell.s = dateReceiptHeaderStyle;
          } else if (C >= 1 && C <= 7) {
            cell.s = basicInfoHeaderStyle;
          } else if (C >= 9 && C <= 15) {
            cell.s = docHeaderStyle;
          } else if (C >= 16 && C <= 20) {
            cell.s = processHeaderStyle;
          }
        } else if (R === 4) {
          if (
            (C >= 1 && C <= 7) ||
            (C >= 9 && C <= 15) ||
            (C >= 16 && C <= 20)
          ) {
            cell.s = subHeaderStyle;
          }
        } else {
          const isProvince = sortedProvinces.some(p => wsData[R] && wsData[R][0] === p.toUpperCase());
          if (isProvince) {
            cell.s = provinceHeaderStyle;
          } else {
            const rowData = wsData[R];
            if (rowData && rowData.some(cell => cell && cell.toString().trim() !== '')) {
              // Checkbox columns
              if (C === 21 ||
                  (C >= 9 && C <= 18 && C !== 10 && C !== 19 && C !== 20)) {
                cell.s = checkboxStyle;
              }
              // Remarks / note fields
              else if (C === 10 || C === 22) {
                cell.s = dataStyle;
              }
              // Evaluated By / Reviewed By – centered text
              else if (C === 19 || C === 20) {
                cell.s = { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } };
              }
              // All other data cells
              else {
                cell.s = dataStyle;
              }
            }
          }
        }
      }
    }

    ws['!merges'] = merges;
    XLSXStyle.utils.book_append_sheet(wb, ws, 'CSO Renewal Checklist');
    const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    saveAs(new Blob([excelBuffer]), `CSO_Renewal_Checklist_${currentMonth}_${currentYear}.xlsx`);
    setSuccess('Export Complete!');
  } catch (err) {
    console.error(err);
    setError('Error exporting to Excel');
  }
};

  // ---------- IMPORT – RENEWAL FORMAT ----------
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

          // Header row is row4 (index 3) in our export (0‑based)
          const headerRowIndex = 3;
          const headers = jsonData[headerRowIndex];

          setImportProgress(50);
          let imported = 0;
          const total = jsonData.slice(5).filter(row => row[0] && !row[0].toString().includes('PROVINCE') && row[0] !== '').length;

          for (let i = 5; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0] || typeof row[0] === 'string' && row[0].trim() === '' ||
                (row[0] && ['OCCIDENTAL MINDORO', 'ORIENTAL MINDORO', 'MARINDUQUE', 'PALAWAN', 'ROMBLON', 'UNKNOWN PROVINCE'].includes(row[0].toUpperCase()))) continue;

            const processCheckbox = (val) => val === '☑' || val === true || val === 'TRUE' || val === '✓';

            const csoRecord = {
              province: '',
              no: row[0]?.toString() || '',
              basic_information: {
                name_of_association: row[1] || '',
                contact_person: row[2] || '',
                position: row[3] || '',
                contact_number: row[4]?.toString() || '',
                email_address: row[5] || '',
                no_of_members: row[6]?.toString() || '',
                address: row[7] || ''
              },
              date_of_receipt: row[8] || '',
              documentary_requirements: {
                accomplished_and_notarized_renewal_form: processCheckbox(row[9]),
                remarks: row[10] || '',
                photocopy_of_certificate_of_cso_accreditation_issued_by_da: processCheckbox(row[11]),
                omnibus_sworn_statement_including_having_submitted_all_material_changes_updates_on_accreditation_documents: processCheckbox(row[12]),
                new_certificate_of_good_standing_from_government_agencies: processCheckbox(row[13]),
                audited_financial_statement_2022_2024: processCheckbox(row[14]),
                updated_certificate_of_compliance_from_cda_for_coops_only: processCheckbox(row[15])
              },
              process: {
                evaluation_report: processCheckbox(row[16]),
                validation_report: processCheckbox(row[17]),
                powerpoint_presentation: processCheckbox(row[18]),
                evaluated_by: row[19] || '',
                reviewed_by: row[20] || ''
              },
              for_deliberation: processCheckbox(row[21]),
              remarks: row[22] || ''
            };

            // Infer province from the previous province header row
            for (let j = i - 1; j >= 0; j--) {
              const prevRow = jsonData[j];
              if (prevRow && prevRow[0] && ['OCCIDENTAL MINDORO', 'ORIENTAL MINDORO', 'MARINDUQUE', 'PALAWAN', 'ROMBLON', 'UNKNOWN PROVINCE'].includes(prevRow[0].toUpperCase())) {
                csoRecord.province = prevRow[0];
                break;
              }
            }

            const existingQuery = query(collection(db, 'cso-renewal'), where('no', '==', csoRecord.no));
            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
              const docRef = doc(db, 'cso-renewal', existingSnapshot.docs[0].id);
              await updateDoc(docRef, csoRecord);
            } else {
              await addDoc(collection(db, 'cso-renewal'), csoRecord);
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

  // ---------- SORT, FILTER, PAGINATION ----------
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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

  // ---------- TABLE COLUMNS (adapted for renewal) ----------
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
        const total = Object.keys(docReqs).filter(k => typeof docReqs[k] === 'boolean' && k !== 'remarks').length;

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* ----- HEADER ----- */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">CSO Renewal System</h1>
            <p className="text-gray-600 mt-2">Track Civil Society Organization Renewals in MIMAROPA Region</p>
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

      {/* ----- STATISTICS CARDS ----- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Renewals</p>
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

      {/* ----- ERROR / SUCCESS MESSAGES ----- */}
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

      {/* ----- SEARCH & FILTER ----- */}
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

      {/* ----- DATA TABLE ----- */}
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

      {/* ----- FOOTER ----- */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <span>MIMAROPA Region CSO Renewal Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              <span>{csoData.length} Renewal Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* ----- ADD / EDIT MODAL ----- */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormState);
          setEditingId(null);
        }}
        title={editingId ? "Edit CSO Renewal Record" : "Add New CSO Renewal Record"}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Record Information */}
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
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              Documentary Requirements (Renewal)
            </h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Accomplished and Notarized Renewal Form</label>
              <div className="flex items-center space-x-4">
                <CheckboxField
                  name="documentary_requirements.accomplished_and_notarized_renewal_form"
                  label="Completed"
                  checked={formData.documentary_requirements.accomplished_and_notarized_renewal_form}
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
                name="documentary_requirements.photocopy_of_certificate_of_cso_accreditation_issued_by_da"
                label="Photocopy of Certificate of CSO Accreditation issued by DA"
                checked={formData.documentary_requirements.photocopy_of_certificate_of_cso_accreditation_issued_by_da}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.omnibus_sworn_statement_including_having_submitted_all_material_changes_updates_on_accreditation_documents"
                label="Omnibus Sworn Statement (including all material changes/updates)"
                checked={formData.documentary_requirements.omnibus_sworn_statement_including_having_submitted_all_material_changes_updates_on_accreditation_documents}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.new_certificate_of_good_standing_from_government_agencies"
                label="New Certificate of Good Standing from Government Agencies"
                checked={formData.documentary_requirements.new_certificate_of_good_standing_from_government_agencies}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.audited_financial_statement_2022_2024"
                label="Audited Financial Statement (2022-2024)"
                checked={formData.documentary_requirements.audited_financial_statement_2022_2024}
                onChange={handleInputChange}
              />
              <CheckboxField
                name="documentary_requirements.updated_certificate_of_compliance_from_cda_for_coops_only"
                label="Updated Certificate of Compliance from CDA (for Coops only)"
                checked={formData.documentary_requirements.updated_certificate_of_compliance_from_cda_for_coops_only}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Process */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h4 className="font-semibold text-purple-800 mb-4 text-lg flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Process
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

          {/* Final Status */}
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
                  Example: Follow up date: March 11, 2024, March 17, 2024...
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

      {/* ----- VIEW MODAL ----- */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="CSO Renewal Details"
        size="3xl"
      >
        {selectedCSO && (
          <div className="space-y-8">
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
                        const label = key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())
                          .replace('Cso', 'CSO')
                          .replace('Da', 'DA')
                          .replace('Cda', 'CDA');
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
                      <p className="text-sm font-medium text-yellow-800 mb-1">Renewal Form Remarks</p>
                      <p className="text-sm text-yellow-700">{selectedCSO.documentary_requirements.remarks}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-purple-600" />
                Process Status
              </h3>
              {selectedCSO.process && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {selectedCSO.remarks && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks & Follow-up</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedCSO.remarks}</p>
                </div>
              </div>
            )}

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

      {/* ----- DELETE MODAL ----- */}
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Renewal Record</h3>
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

      {/* ----- IMPORT MODAL ----- */}
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

export default CsoRenewal;