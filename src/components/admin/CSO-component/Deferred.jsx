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

const Deferred = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
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
            documentary_requirements: assoc.documentary_requirements || {},
            process: assoc.process || {},
            for_deliberation: assoc.for_deliberation || false,
            remarks: assoc.remarks || ''
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
        // Extract number from no_of_members string
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

  // ---------- Delete a deferred application ----------
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
          await updateDoc(docRef, { associations });
          
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

  // ---------- View details ----------
  const handleView = (record) => {
    setSelectedApplication(record);
    setShowViewModal(true);
  };

  const openDeleteModal = (record) => {
    setSelectedApplication(record);
    setShowViewModal(false);
    setShowDeleteModal(true);
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
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowsPerPageChange = (rows) => {
    setPagination(prev => ({ ...prev, rowsPerPage: rows, currentPage: 1 }));
  };

  // ---------- Filtered & sorted data ----------
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

    // Sorting
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

  // ---------- Export to Excel – No background colors, only borders ----------
  const exportToExcel = async () => {
    try {
      // Group by province
      const groupedData = {};
      rawData.forEach(item => {
        const province = item.province || 'Unknown Province';
        if (!groupedData[province]) groupedData[province] = [];
        groupedData[province].push(item);
      });

      const sortedProvinces = Object.keys(groupedData).sort();

      const wb = XLSXStyle.utils.book_new();

      // Styles – NO BACKGROUND COLORS, only borders
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
        alignment: { horizontal: "left", vertical: "center" },
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
      wsData.push(['LIST OF DEFERRED CSO APPLICATIONS']);
      wsData.push([`as of ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`]);
      wsData.push([]);

      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 10 } });

      // Header row
      wsData.push([
        'NO.',
        'NAME OF ASSOCIATION',
        'CONTACT PERSON',
        'POSITION',
        'CONTACT NUMBER',
        'EMAIL',
        'NO. OF MEMBERS',
        'ADDRESS',
        'PROVINCE',
        'SCOPE',
        'NATURE OF SERVICES'
      ]);

      let currentRow = 4;

      sortedProvinces.forEach(province => {
        // Province header
        const pRow = Array(11).fill('');
        pRow[0] = province.toUpperCase();
        wsData.push(pRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 10 } });
        currentRow++;

        // Sort associations within province by 'no' numerically
        const sortedAssoc = [...groupedData[province]].sort((a, b) => {
          const numA = parseInt(a.no) || 0;
          const numB = parseInt(b.no) || 0;
          return numA - numB;
        });

        sortedAssoc.forEach(item => {
          wsData.push([
            item.no || '',
            item.name_of_association || '',
            item.contact_person || '',
            item.position || '',
            item.contact_number || '',
            item.email_address || '',
            item.no_of_members || '',
            item.address || '',
            item.province || '',
            item.scope || '',
            item.nature_of_services || ''
          ]);
          currentRow++;
        });

        // Empty row after province
        wsData.push(Array(11).fill(''));
        currentRow++;
      });

      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 8 },   // NO.
        { wch: 45 },  // NAME
        { wch: 25 },  // CONTACT PERSON
        { wch: 20 },  // POSITION
        { wch: 18 },  // CONTACT NUMBER
        { wch: 30 },  // EMAIL
        { wch: 20 },  // NO. OF MEMBERS
        { wch: 50 },  // ADDRESS
        { wch: 20 },  // PROVINCE
        { wch: 15 },  // SCOPE
        { wch: 40 }   // NATURE OF SERVICES
      ];

      ws['!rows'] = wsData.map((row, i) => {
        if (i === 0) return { hpt: 40 };
        if (i === 1) return { hpt: 35 };
        if (i === 3) return { hpt: 30 };
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
              // Center certain columns
              cell.s = ([0, 6, 8, 9].includes(C)) ? centerStyle : dataStyle;
            }
          }
        }
      }

      ws['!merges'] = merges;
      XLSXStyle.utils.book_append_sheet(wb, ws, 'Deferred CSOs');
      const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), `Deferred_CSO_Applications.xlsx`);
      setSuccess('Export Complete!');
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export Excel');
    }
  };

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
    const unique = [...new Set(rawData.map(item => item.province).filter(Boolean))];
    return unique.sort();
  }, [rawData]);

  // ---------- Render ----------
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
              onClick={exportToExcel}
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

      {/* Stats Cards */}
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

      {/* View Modal */}
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