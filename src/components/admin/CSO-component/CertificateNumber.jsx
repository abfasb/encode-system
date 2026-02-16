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

// ---------- Helper: Format date ----------
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ---------- DataTable Component (reused) ----------
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
                    <p className="text-gray-500 text-lg font-medium">No certificate records found</p>
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

// ---------- Modal Component (reused) ----------
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
  certificate_number: '',
  name_of_cso: '',
  municipality: '',
  province: '',
  date_issued: '',
  date_expiry: '',
  status: 'Active',
  remarks: ''
};

const CertificateNumber = () => {
  const [certData, setCertData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    province: 'all',
    status: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'certificate_number',
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
    byProvince: {},
    active: 0,
    expired: 0
  });

  // ---------- Fetch certificate data from Firestore ----------
  const fetchCertData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const certCollection = collection(db, 'cso-certificate');
      const q = query(certCollection, orderBy('certificate_number', 'asc'));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      setCertData(data);

      // Calculate statistics
      const total = data.length;
      const active = data.filter(item => item.status === 'Active').length;
      const expired = data.filter(item => {
        if (!item.date_expiry) return false;
        return new Date(item.date_expiry) < new Date();
      }).length;

      const byProvince = {};
      data.forEach(item => {
        const province = item.province || 'Unknown';
        byProvince[province] = (byProvince[province] || 0) + 1;
      });

      setStats({ total, byProvince, active, expired });
    } catch (err) {
      console.error('Error fetching certificate data:', err);
      setError('Failed to load certificate data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertData();
  }, [fetchCertData]);

  // ---------- Form input handler ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ---------- Submit form (Add / Edit) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.certificate_number || !formData.name_of_cso) {
      setError('Certificate Number and Name of CSO are required fields');
      return;
    }

    try {
      if (editingId) {
        const docRef = doc(db, 'cso-certificate', editingId);
        await updateDoc(docRef, formData);
        setSuccess('Certificate record updated successfully!');
      } else {
        await addDoc(collection(db, 'cso-certificate'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        setSuccess('Certificate record added successfully!');
      }

      setFormData(initialFormState);
      setEditingId(null);
      setShowAddModal(false);
      fetchCertData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving certificate data:', err);
      setError('Failed to save data. Please try again.');
    }
  };

  const handleEdit = (cert) => {
    setFormData(cert);
    setEditingId(cert.id);
    setShowViewModal(false);
    setShowAddModal(true);
  };

  const handleView = (cert) => {
    setSelectedCert(cert);
    setShowAddModal(false);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedCert) return;

    try {
      await deleteDoc(doc(db, 'cso-certificate', selectedCert.id));
      setSuccess(`${selectedCert.certificate_number} deleted successfully!`);
      setShowDeleteModal(false);
      fetchCertData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting certificate:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  const openDeleteModal = (cert) => {
    setSelectedCert(cert);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  // ---------- Export to Excel with no header background, only bold borders ----------
  const exportToExcel = async () => {
    try {
      // Group by province
      const groupedData = {};
      certData.forEach(item => {
        const province = item.province || 'Unknown Province';
        if (!groupedData[province]) groupedData[province] = [];
        groupedData[province].push(item);
      });

      // Sort groups by province name
      const sortedProvinces = Object.keys(groupedData).sort();

      const wb = XLSXStyle.utils.book_new();

      // Styles: no background colors, only borders
      const titleStyle = {
        font: { name: 'Arial', sz: 16, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thick" },
          bottom: { style: "thick" },
          left: { style: "thick" },
          right: { style: "thick" }
        }
      };

      const subtitleStyle = {
        font: { name: 'Arial', sz: 14, italic: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thick" },
          bottom: { style: "thick" },
          left: { style: "thick" },
          right: { style: "thick" }
        }
      };

      const headerStyle = {
        font: { name: 'Arial', sz: 12, bold: true },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" }
        }
      };

      const provinceHeaderStyle = {
        font: { name: 'Arial', sz: 14, bold: true },
        alignment: { horizontal: "left", vertical: "left" },
        border: {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" }
        }
      };

      const dataStyle = {
        font: { name: 'Arial', sz: 11 },
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };

      const centerStyle = {
        ...dataStyle,
        alignment: { horizontal: "center", vertical: "center" }
      };

      const wsData = [];
      const merges = [];

      // Title rows
      wsData.push(['LIST OF CERTIFICATE NUMBERS ISSUED TO CSOs']);
      wsData.push([`as of ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`]);
      wsData.push([]);

      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });

      // Header row
      wsData.push([
        'CERTIFICATE NO.',
        'NAME OF CSO',
        'MUNICIPALITY',
        'PROVINCE',
      ]);

      let currentRow = 4;

      sortedProvinces.forEach(province => {
        // Province header row
        const pRow = Array(4).fill('');
        pRow[0] = province.toUpperCase();
        wsData.push(pRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 3 } });
        currentRow++;

        // Data rows for this province
        groupedData[province].forEach(item => {
          wsData.push([
            item.certificate_number || '',
            item.name_of_cso || '',
            item.municipality || '',
            item.province || '',
          ]);
          currentRow++;
        });

        // Empty row after each province
        wsData.push(Array(7).fill(''));
        currentRow++;
      });

      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 25 }, // Certificate No.
        { wch: 50 }, // Name of CSO
        { wch: 25 }, // Municipality
        { wch: 20 }, // Province
      ];

      ws['!rows'] = wsData.map((row, i) => {
        if (i === 0) return { hpt: 40 };
        if (i === 1) return { hpt: 35 };
        if (i === 3) return { hpt: 30 }; // header row
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
          else if (R === 3) cell.s = headerStyle;
          else {
            const isProvince = sortedProvinces.includes(wsData[R]?.[0]);
            if (isProvince) cell.s = provinceHeaderStyle;
            else if (wsData[R] && wsData[R][0] !== '') {
              // Data rows
              cell.s = (C === 0 || C === 3 || C === 6) ? centerStyle : dataStyle;
            }
          }
        }
      }

      ws['!merges'] = merges;
      XLSXStyle.utils.book_append_sheet(wb, ws, 'Certificate Numbers');
      const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), `Certificate_Numbers_List.xlsx`);
      setSuccess('Export Complete!');
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export Excel');
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

            const certRecord = {
              certificate_number: item['CERTIFICATE NO.']?.toString() || '',
              name_of_cso: item['NAME OF CSO'] || '',
              municipality: item['MUNICIPALITY'] || '',
              province: item['PROVINCE'] || '',
              date_issued: item['DATE ISSUED'] ? new Date(item['DATE ISSUED']).toISOString().split('T')[0] : '',
              date_expiry: item['DATE EXPIRY'] ? new Date(item['DATE EXPIRY']).toISOString().split('T')[0] : '',
              status: item['STATUS'] || 'Active',
              remarks: item['REMARKS'] || ''
            };

            // Check if certificate number already exists
            const existingQuery = query(
              collection(db, 'cso-certificate'),
              where('certificate_number', '==', certRecord.certificate_number)
            );
            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
              const docRef = doc(db, 'cso-certificate', existingSnapshot.docs[0].id);
              await updateDoc(docRef, certRecord);
            } else {
              await addDoc(collection(db, 'cso-certificate'), {
                ...certRecord,
                createdAt: serverTimestamp()
              });
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
            fetchCertData();
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

  // ---------- Sort handler ----------
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // ---------- Filter handlers ----------
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
    let filtered = [...certData];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.certificate_number?.toLowerCase().includes(searchLower) ||
        item.name_of_cso?.toLowerCase().includes(searchLower) ||
        item.municipality?.toLowerCase().includes(searchLower) ||
        item.province?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.province !== 'all') {
      filtered = filtered.filter(item => item.province === filters.province);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      if (sortConfig.field === 'date_issued' || sortConfig.field === 'date_expiry') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [certData, searchTerm, filters, sortConfig]);

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
      key: 'certificate_number',
      header: 'Certificate No.',
      sortable: true,
      render: (row) => (
        <div className="font-mono font-bold text-gray-900">{row.certificate_number}</div>
      )
    },
    {
      key: 'name_of_cso',
      header: 'Name of CSO',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name_of_cso}</div>
          <div className="text-xs text-gray-500">{row.municipality}</div>
        </div>
      )
    },
    {
      key: 'province',
      header: 'Province',
      sortable: true,
      render: (row) => (
        <div className="flex items-center">
          <MapPin className="h-3 w-3 mr-1 text-gray-500" />
          <span className="text-gray-900">{row.province || 'N/A'}</span>
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

  // ---------- Unique provinces for filter ----------
  const provinces = useMemo(() => {
    const uniqueProvinces = [...new Set(certData.map(item => item.province).filter(Boolean))];
    return uniqueProvinces.sort();
  }, [certData]);

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Certificate Number Management</h1>
            <p className="text-gray-600 mt-2">
              Manage Certificate Numbers issued to CSOs in MIMAROPA Region
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Certificate
            </button>

            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Excel
            </button>

            <button
              onClick={fetchCertData}
              className="inline-flex items-center px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Certificates</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <FileText className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">Active: {stats.active}</p>
          </div>
        </div>

        <div className="bg-purple-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Provinces</p>
              <p className="text-3xl font-bold mt-2">{Object.keys(stats.byProvince).length}</p>
            </div>
            <MapPin className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">Across MIMAROPA</p>
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

      <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by certificate no., CSO name, municipality, province..."
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
            Showing <span className="font-semibold">{filteredData.length}</span> of <span className="font-semibold">{certData.length}</span> records
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
              <span>Certificate Numbers Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              <span>{certData.length} Certificates Issued</span>
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
        title={editingId ? "Edit Certificate Record" : "Add New Certificate Record"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 mb-4">Certificate Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number *</label>
                <input
                  type="text"
                  name="certificate_number"
                  value={formData.certificate_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="DA-CSO ACRN No. 2021-243"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of CSO *</label>
                <input
                  type="text"
                  name="name_of_cso"
                  value={formData.name_of_cso}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Federation of Fisherfolk Association of Rizal (FEFAR)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rizal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Province</option>
                  <option value="Occidental Mindoro">Occidental Mindoro</option>
                  <option value="Oriental Mindoro">Oriental Mindoro</option>
                  <option value="Palawan">Palawan</option>
                  <option value="Romblon">Romblon</option>
                  <option value="Marinduque">Marinduque</option>
                </select>
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

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Certificate Details"
        size="lg"
      >
        {selectedCert && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCert.name_of_cso}</h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedCert.certificate_number}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCert.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedCert.status === 'Expired' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedCert.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Certificate Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Certificate Number</p>
                    <p className="font-medium text-black">{selectedCert.certificate_number}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Municipality</p>
                    <p className="font-medium text-black">{selectedCert.municipality || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Province</p>
                    <p className="font-medium text-black">{selectedCert.province || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedCert.remarks || 'No remarks'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedCert);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit Record
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteModal(selectedCert);
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Certificate Record</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{selectedCert?.certificate_number}</span>? This action cannot be undone.
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
                <span>Required columns: Certificate No. and Name of CSO</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Existing records with matching Certificate No. will be updated</span>
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

export default CertificateNumber;