import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
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
  RefreshCw,
  Clock
} from 'lucide-react';
import { db } from '../../../config/firebase';

// ---------- Helper: Format date ----------
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ---------- DataTable Component (unchanged) ----------
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
                    <p className="text-gray-500 text-lg font-medium">No deferred records found</p>
                    <p className="text-gray-400 mt-1">All applications are either accredited or on‑process</p>
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

// ---------- Modal Component (unchanged) ----------
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

// ---------- INITIAL FORM STATE for Deferred Applications ----------
const initialFormState = {
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
  scope: '',
  nature_of_services: '',
  date_of_receipt: '',
  for_deliberation: false,
  remarks: '',
  // Keep these for compatibility, but they are not used in deferred
  documentary_requirements: {},
  process: {}
};

const Deferred = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // ---------- CRUD States ----------
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);          
  const [editingIndex, setEditingIndex] = useState(null);    
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    province: 'all'
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
  const [stats, setStats] = useState({
    total: 0,
    byProvince: {},
    totalMembers: 0
  });

  // ---------- FETCH DATA from 'cso-deferred' ----------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const collectionRef = collection(db, 'cso-deferred');
      const q = query(collectionRef);
      const querySnapshot = await getDocs(q);

      const flattened = [];

      querySnapshot.forEach((docSnap) => {
        const provinceDoc = docSnap.data();
        const province = provinceDoc.province || 'Unknown Province';
        const associations = provinceDoc.associations || [];

        associations.forEach((assoc, index) => {
          const uniqueId = `${docSnap.id}_${index}`;
          const basic = assoc.basic_information || {};

          flattened.push({
            id: uniqueId,
            docId: docSnap.id,
            assocIndex: index,
            province,
            no: assoc.no || '',
            name_of_association: basic.name_of_association || '',
            contact_person: basic.contact_person || '',
            position: basic.position || '',
            contact_number: basic.contact_number || '',
            email_address: basic.email_address || '',
            no_of_members: basic.no_of_members || '',
            address: basic.address || '',
            scope: assoc.scope || '',
            nature_of_services: assoc.nature_of_services || '',
            date_of_receipt: assoc.date_of_receipt || '',
            for_deliberation: assoc.for_deliberation || false,
            remarks: assoc.remarks || '',
            documentary_requirements: assoc.documentary_requirements || {},
            process: assoc.process || {}
          });
        });
      });

      // Default sort: province then numeric no
      flattened.sort((a, b) => {
        if (a.province !== b.province) return a.province.localeCompare(b.province);
        const numA = parseInt(a.no) || 0;
        const numB = parseInt(b.no) || 0;
        return numA - numB;
      });

      setRawData(flattened);

      // Statistics
      const total = flattened.length;
      const byProvince = {};
      let totalMembers = 0;
      flattened.forEach(item => {
        const prov = item.province;
        byProvince[prov] = (byProvince[prov] || 0) + 1;
        const membersMatch = item.no_of_members?.match(/\d+/);
        if (membersMatch) {
          totalMembers += parseInt(membersMatch[0], 10);
        }
      });

      setStats({ total, byProvince, totalMembers });
    } catch (err) {
      console.error('Error fetching deferred CSO data:', err);
      setError('Failed to load deferred records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- HANDLE INPUT CHANGE (supports nested paths) ----------
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
      }
    }
  };

  // ---------- SUBMIT – Add or Edit a deferred application ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.basic_information.name_of_association) {
        setError('Name of Association is required');
        return;
      }

      // Prepare the association object
      const association = {
        no: formData.no || '',
        basic_information: {
          name_of_association: formData.basic_information.name_of_association,
          contact_person: formData.basic_information.contact_person || '',
          position: formData.basic_information.position || '',
          contact_number: formData.basic_information.contact_number || '',
          email_address: formData.basic_information.email_address || '',
          no_of_members: formData.basic_information.no_of_members || '',
          address: formData.basic_information.address || ''
        },
        scope: formData.scope || '',
        nature_of_services: formData.nature_of_services || '',
        date_of_receipt: formData.date_of_receipt || '',
        for_deliberation: formData.for_deliberation || false,
        remarks: formData.remarks || '',
        documentary_requirements: {},
        process: {}
      };

      if (editingId) {
        // ---------- EDIT MODE ----------
        const docRef = doc(db, 'cso-deferred', editingId);
        const docSnap = await getDocs(query(collection(db, 'cso-deferred'), where('__name__', '==', editingId)));
        if (!docSnap.empty) {
          const provinceDoc = docSnap.docs[0].data();
          const associations = [...(provinceDoc.associations || [])];
          associations[editingIndex] = association; // replace at index
          await updateDoc(docRef, { associations });
          setSuccess('Deferred application updated successfully!');
        }
      } else {
        // ---------- ADD MODE – find or create province document ----------
        const province = formData.province;
        if (!province) {
          setError('Please select a province');
          return;
        }

        const provinceQuery = query(collection(db, 'cso-deferred'), where('province', '==', province));
        const provinceSnapshot = await getDocs(provinceQuery);

        if (provinceSnapshot.empty) {
          // Create new province document with this association
          await addDoc(collection(db, 'cso-deferred'), {
            province,
            associations: [association]
          });
        } else {
          // Append to existing province document
          const docRef = provinceSnapshot.docs[0].ref;
          const existingAssociations = provinceSnapshot.docs[0].data().associations || [];
          await updateDoc(docRef, {
            associations: [...existingAssociations, association]
          });
        }
        setSuccess('Deferred application added successfully!');
      }

      // Reset form and close modal
      setFormData(initialFormState);
      setEditingId(null);
      setEditingIndex(null);
      setShowAddModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving deferred application:', err);
      setError('Failed to save data. Please try again.');
    }
  };

  // ---------- EDIT – populate form with existing data ----------
  const handleEdit = (record) => {
    setFormData({
      no: record.no || '',
      province: record.province,
      basic_information: {
        name_of_association: record.name_of_association || '',
        contact_person: record.contact_person || '',
        position: record.position || '',
        contact_number: record.contact_number || '',
        email_address: record.email_address || '',
        no_of_members: record.no_of_members || '',
        address: record.address || ''
      },
      scope: record.scope || '',
      nature_of_services: record.nature_of_services || '',
      date_of_receipt: record.date_of_receipt || '',
      for_deliberation: record.for_deliberation || false,
      remarks: record.remarks || '',
      documentary_requirements: {},
      process: {}
    });
    setEditingId(record.docId);
    setEditingIndex(record.assocIndex);
    setShowViewModal(false);
    setShowAddModal(true);
  };

  // ---------- VIEW ----------
  const handleView = (record) => {
    setSelectedApplication(record);
    setShowAddModal(false);
    setShowViewModal(true);
  };

  // ---------- DELETE ----------
  const handleDelete = async () => {
    if (!selectedApplication) return;

    try {
      const docRef = doc(db, 'cso-deferred', selectedApplication.docId);
      const docSnap = await getDocs(query(collection(db, 'cso-deferred'), where('__name__', '==', selectedApplication.docId)));
      
      if (!docSnap.empty) {
        const provinceDoc = docSnap.docs[0].data();
        const associations = [...(provinceDoc.associations || [])];
        
        if (selectedApplication.assocIndex < associations.length) {
          associations.splice(selectedApplication.assocIndex, 1);
          
          if (associations.length === 0) {
            // If no associations left, delete the entire province document
            await deleteDoc(docRef);
          } else {
            await updateDoc(docRef, { associations });
          }
          
          setSuccess(`Application "${selectedApplication.name_of_association}" deleted successfully.`);
          setShowDeleteModal(false);
          setSelectedApplication(null);
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      console.error('Error deleting deferred application:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  const openDeleteModal = (record) => {
    setSelectedApplication(record);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ---------- SORT, FILTER, PAGINATION (unchanged) ----------
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
    let filtered = [...rawData];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name_of_association?.toLowerCase().includes(searchLower) ||
        item.contact_person?.toLowerCase().includes(searchLower) ||
        item.province?.toLowerCase().includes(searchLower) ||
        item.address?.toLowerCase().includes(searchLower) ||
        item.nature_of_services?.toLowerCase().includes(searchLower)
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
      if (sortConfig.field === 'no_of_members') {
        aValue = parseInt(a.no_of_members) || 0;
        bValue = parseInt(b.no_of_members) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rawData, searchTerm, filters, sortConfig]);

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

  // ---------- EXPORT TO EXCEL (10 columns, no date/remarks) ----------
  const exportToExcelWithBeautifulFormatting = async () => {
    try {
      const now = new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      const wb = XLSXStyle.utils.book_new();

      // ----- STYLES -----
      const titleStyle = {
        font: { name: 'Arial', sz: 16, bold: true },
        alignment: { horizontal: "center", vertical: "center" }
      };
      const subtitleStyle = {
        font: { name: 'Arial', sz: 14, italic: true },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "B7E1CD" }, patternType: "solid" }
      };
      const headerStyle = {
        font: { name: 'Arial', sz: 11, bold: true, color: { rgb: "FFFFFF" } },
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
        font: { name: 'Arial', sz: 9 },
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };

      // ----- GROUP BY PROVINCE -----
      const groupedData = {};
      rawData.forEach(item => {
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

      // ----- WORKSHEET – 10 COLUMNS (no Date of Receipt, no Remarks) -----
      const wsData = [];
      const merges = [];
      const TOTAL_COLS = 10;

      wsData.push(['DEFERRED CSO APPLICATIONS']);
      wsData.push([`as of ${currentMonth} ${currentYear}`]);
      wsData.push([]);

      const headerRow = new Array(TOTAL_COLS).fill('');
      headerRow[0] = 'NO.';
      headerRow[1] = 'NAME OF ASSOCIATION';
      headerRow[2] = 'CONTACT PERSON';
      headerRow[3] = 'POSITION';
      headerRow[4] = 'CONTACT NUMBER';
      headerRow[5] = 'EMAIL ADDRESS';
      headerRow[6] = 'NO. OF MEMBERS';
      headerRow[7] = 'ADDRESS';
      headerRow[8] = 'SCOPE';
      headerRow[9] = 'NATURE OF SERVICES';
      wsData.push(headerRow);

      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

      let currentRow = 4;

      sortedProvinces.forEach(province => {
        const provinceRow = new Array(TOTAL_COLS).fill('');
        provinceRow[0] = province.toUpperCase();
        wsData.push(provinceRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: TOTAL_COLS - 1 } });
        currentRow++;

        groupedData[province].forEach(item => {
          const dataRow = new Array(TOTAL_COLS).fill('');

          dataRow[0] = item.no || '';
          dataRow[1] = item.name_of_association || '';
          dataRow[2] = item.contact_person || '';
          dataRow[3] = item.position || '';
          dataRow[4] = item.contact_number || '';
          dataRow[5] = item.email_address || '';
          dataRow[6] = item.no_of_members || '';
          dataRow[7] = item.address || '';
          dataRow[8] = item.scope || '';
          dataRow[9] = item.nature_of_services || '';

          wsData.push(dataRow);
          currentRow++;
        });

        wsData.push(new Array(TOTAL_COLS).fill(''));
        currentRow++;
      });

      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 5 },   // NO.
        { wch: 35 },  // NAME OF ASSOCIATION
        { wch: 20 },  // CONTACT PERSON
        { wch: 15 },  // POSITION
        { wch: 15 },  // CONTACT NUMBER
        { wch: 25 },  // EMAIL ADDRESS
        { wch: 15 },  // NO. OF MEMBERS
        { wch: 40 },  // ADDRESS
        { wch: 12 },  // SCOPE
        { wch: 30 }   // NATURE OF SERVICES
      ];

      ws['!rows'] = wsData.map((row, i) => {
        if (i === 0) return { hpt: 40 };
        if (i === 1) return { hpt: 35 };
        if (i === 3) return { hpt: 30 };
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

          if (R === 0) cell.s = titleStyle;
          else if (R === 1) cell.s = subtitleStyle;
          else if (R === 3) cell.s = headerStyle;
          else {
            const isProvince = sortedProvinces.some(p => wsData[R] && wsData[R][0] === p.toUpperCase());
            if (isProvince) cell.s = provinceHeaderStyle;
            else {
              const rowData = wsData[R];
              if (rowData && rowData.some(cell => cell && cell.toString().trim() !== '')) {
                cell.s = dataStyle;
              }
            }
          }
        }
      }

      ws['!merges'] = merges;
      XLSXStyle.utils.book_append_sheet(wb, ws, 'Deferred CSO');
      const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), `Deferred_CSO_${currentMonth}_${currentYear}.xlsx`);
      setSuccess('Export Complete!');
    } catch (err) {
      console.error(err);
      setError('Error exporting to Excel');
    }
  };

  // ---------- Table Columns (with Edit button) ----------
  const columns = [
    {
      key: 'name_of_association',
      header: 'Association Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name_of_association || '—'}</div>
          <div className="text-xs text-gray-500">{row.province}</div>
        </div>
      )
    },
    {
      key: 'contact_person',
      header: 'Contact Person',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.contact_person || '—'}</div>
          <div className="text-xs text-gray-500">{row.position || '—'}</div>
        </div>
      )
    },
    {
      key: 'contact_number',
      header: 'Contact No.',
      render: (row) => (
        <div className="text-sm text-gray-700">{row.contact_number || '—'}</div>
      )
    },
    {
      key: 'email_address',
      header: 'Email',
      render: (row) => (
        <div className="text-sm text-gray-700 truncate max-w-[200px]">{row.email_address || '—'}</div>
      )
    },
    {
      key: 'no_of_members',
      header: 'Members',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-700 flex items-center">
          <Users className="h-3 w-3 mr-1 text-gray-500" />
          {row.no_of_members ? row.no_of_members.split(' ')[0] : '0'}
        </div>
      )
    },
    {
      key: 'scope',
      header: 'Scope',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.scope || '—'}
        </span>
      )
    },
    {
      key: 'nature_of_services',
      header: 'Nature of Services',
      render: (row) => (
        <div className="text-sm text-gray-700 truncate max-w-[250px]">
          {row.nature_of_services || '—'}
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
        </div>
      )
    }
  ];

  const provinces = useMemo(() => {
    const unique = [...new Set(rawData.map(item => item.province).filter(Boolean))];
    return unique.sort();
  }, [rawData]);

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Deferred CSO Applications</h1>
            <p className="text-gray-600 mt-2">
              Applications placed on hold or deferred for further review
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setFormData(initialFormState);
                setEditingId(null);
                setEditingIndex(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Deferred
            </button>

            <button
              onClick={exportToExcelWithBeautifulFormatting}
              className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Excel
            </button>

            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards (unchanged) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Deferred</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <FileText className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">
              {stats.total > 0 ? `${Object.keys(stats.byProvince).length} provinces` : 'No records'}
            </p>
          </div>
        </div>

        <div className="bg-amber-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold mt-2">{stats.totalMembers.toLocaleString()}</p>
            </div>
            <Users className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-amber-400">
            <p className="text-amber-100 text-sm">Across all deferred orgs</p>
          </div>
        </div>

        <div className="bg-purple-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Top Province</p>
              <p className="text-xl font-bold mt-2 truncate max-w-[150px]">
                {Object.entries(stats.byProvince).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </p>
            </div>
            <MapPin className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">
              {Object.entries(stats.byProvince).sort((a,b) => b[1] - a[1])[0]?.[1] || 0} applications
            </p>
          </div>
        </div>

        <div className="bg-green-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Regional Scope</p>
              <p className="text-3xl font-bold mt-2">
                {rawData.filter(item => item.scope === 'Regional').length}
              </p>
            </div>
            <Building className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-green-100 text-sm">
              {stats.total > 0 ? `${Math.round((rawData.filter(item => item.scope === 'Regional').length / stats.total) * 100)}%` : '0%'}
            </p>
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
                placeholder="Search by name, contact, province, services..."
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
            Showing <span className="font-semibold">{filteredData.length}</span> of <span className="font-semibold">{rawData.length}</span> records
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
              <FileText className="h-4 w-4 mr-2" />
              <span>Deferred CSO Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{rawData.length} Deferred Applications</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- ADD / EDIT MODAL ---------- */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormState);
          setEditingId(null);
          setEditingIndex(null);
        }}
        title={editingId ? "Edit Deferred Application" : "Add New Deferred Application"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Province Selection (only for Add) */}
          {!editingId && (
            <div className="bg-blue-50 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
              <select
                name="province"
                value={formData.province || ''}
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
          )}

          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 text-lg flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
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
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 50 members"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="basic_information.address"
                  value={formData.basic_information.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              Application Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. (optional)</label>
                <input
                  type="text"
                  name="no"
                  value={formData.no}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Scope</option>
                  <option value="Regional">Regional</option>
                  <option value="Provincial">Provincial</option>
                  <option value="Municipal">Municipal</option>
                  <option value="Barangay">Barangay</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Services</label>
                <textarea
                  name="nature_of_services"
                  value={formData.nature_of_services}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the services provided"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Receipt</label>
                <input
                  type="date"
                  name="date_of_receipt"
                  value={formData.date_of_receipt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">For Deliberation</label>
                <CheckboxField
                  name="for_deliberation"
                  label="Ready for deliberation"
                  checked={formData.for_deliberation}
                  onChange={handleInputChange}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any remarks or follow-up notes"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setFormData(initialFormState);
                setEditingId(null);
                setEditingIndex(null);
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Update Application' : 'Add Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- VIEW MODAL ---------- */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Deferred Application Details"
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div className="bg-amber-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApplication.name_of_association || 'Unnamed Association'}
                  </h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      No. {selectedApplication.no || '—'}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedApplication.province}
                    </span>
                    {selectedApplication.scope && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {selectedApplication.scope}
                      </span>
                    )}
                  </div>
                </div>
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
                    <p className="font-medium text-black">{selectedApplication.contact_person || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium text-black">{selectedApplication.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium text-black">{selectedApplication.contact_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-black">{selectedApplication.email_address || 'Not specified'}</p>
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
                    <p className="font-medium text-black">{selectedApplication.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Province</p>
                    <p className="font-medium text-black">{selectedApplication.province}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Number of Members</p>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      <p className="font-medium text-black">{selectedApplication.no_of_members || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nature of Services</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedApplication.nature_of_services || 'Not specified'}
                  </p>
                </div>
              </div>

              {selectedApplication.remarks && (
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-line">{selectedApplication.remarks}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedApplication);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit Application
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteModal(selectedApplication);
                }}
                className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline mr-2" />
                Delete Application
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---------- DELETE MODAL ---------- */}
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Deferred Application</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the application for{' '}
            <span className="font-semibold">{selectedApplication?.name_of_association}</span>? This action cannot be undone.
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
    </div>
  );
};

export default Deferred;