import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  query,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  FileCheck,
  Square,
  CheckSquare,
  AlertCircle,
  X,
  Check,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search
} from 'lucide-react';

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

const Evaluation = () => {
  const [evaluationData, setEvaluationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'no', direction: 'asc' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    totalPages: 1
  });
  const [selectedForDeliberation, setSelectedForDeliberation] = useState({}); 

  const getActiveCharacter = () => {
    try {
      const stored = localStorage.getItem('activeCharacter');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing activeCharacter', e);
    }
    return null;
  };

  const fetchEvaluationData = useCallback(async () => {
    try {
      setLoading(true);
      const evalCollection = collection(db, 'cso-evaluation');
      const q = query(evalCollection, orderBy('no', 'asc'));
      const snapshot = await getDocs(q);
      const data = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setEvaluationData(data);
    } catch (err) {
      console.error('Error fetching evaluation data:', err);
      setError('Failed to load evaluation data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluationData();
  }, [fetchEvaluationData]);

  // ========== Move a single record to Deliberation ==========
  const moveToDeliberation = async (record) => {
    const activeCharacter = getActiveCharacter();
    if (!activeCharacter) {
      setError('No active character found. Please select a character first.');
      return;
    }

    try {
      // Create a copy in cso-deliberation collection with evaluator info
      const deliberationData = {
        ...record,
        originalId: record.originalId || record.id,
        movedToDeliberationAt: new Date().toISOString(),
        for_deliberation: true,
        // Add evaluator information
        evaluatedBy: activeCharacter.name,
        evaluatedById: activeCharacter.id,
        evaluatedByRole: activeCharacter.role,
        evaluatedAt: new Date().toISOString(),
        // Set deliberation status to Approved (automatic)
        deliberation_status: 'Approved'
      };
      delete deliberationData.id;
      delete deliberationData.movedToEvaluationAt; // optional cleanup

      // Add to deliberation collection
      await addDoc(collection(db, 'cso-deliberation'), deliberationData);

      // Delete from evaluation
      await deleteDoc(doc(db, 'cso-evaluation', record.id));

      // Optionally update the original cso-on-process record to set for_deliberation = true
      if (record.originalId) {
        const originalRef = doc(db, 'cso-on-process', record.originalId);
        await updateDoc(originalRef, { for_deliberation: true });
      }

      setSuccess(`${record.basic_information?.name_of_association} moved to Deliberation.`);
      fetchEvaluationData(); // refresh list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error moving to deliberation:', err);
      setError('Failed to move record.');
    }
  };

  // ========== Checkbox handling ==========
  const handleCheckboxChange = (docId, checked) => {
    setSelectedForDeliberation(prev => ({ ...prev, [docId]: checked }));
  };

  // ========== Bulk move ==========
  const handleBulkMove = async () => {
    const activeCharacter = getActiveCharacter();
    if (!activeCharacter) {
      setError('No active character found. Please select a character first.');
      return;
    }

    const selectedIds = Object.keys(selectedForDeliberation).filter(id => selectedForDeliberation[id]);
    if (selectedIds.length === 0) {
      setError('Please select at least one record.');
      return;
    }
    for (const id of selectedIds) {
      const record = evaluationData.find(r => r.id === id);
      if (record) await moveToDeliberation(record);
    }
    setSelectedForDeliberation({});
  };

  // ========== Columns ==========
  const columns = [
    {
      key: 'select',
      header: 'Select',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedForDeliberation[row.id] || false}
          onChange={(e) => handleCheckboxChange(row.id, e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
      )
    },
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
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Documents Complete
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => {
            if (window.confirm(`Move ${row.basic_information?.name_of_association} to Deliberation?`)) {
              moveToDeliberation(row);
            }
          }}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send className="h-4 w-4 mr-1" />
          Move to Deliberation
        </button>
      )
    }
  ];

  // ========== Filtering and Pagination ==========
  const filteredData = useMemo(() => {
    let filtered = [...evaluationData];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.basic_information?.name_of_association?.toLowerCase().includes(lower) ||
        item.basic_information?.contact_person?.toLowerCase().includes(lower) ||
        item.province?.toLowerCase().includes(lower)
      );
    }
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];
      if (sortConfig.field === 'no') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [evaluationData, searchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    return filteredData.slice(start, start + pagination.rowsPerPage);
  }, [filteredData, pagination]);

  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(filteredData.length / prev.rowsPerPage)
    }));
  }, [filteredData.length, pagination.rowsPerPage]);

  // ========== Render ==========
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">CSO Evaluation</h1>
            <p className="text-gray-600 mt-2">Records with complete documentary requirements are listed here</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchEvaluationData}
              className="inline-flex items-center px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>

            <button
              onClick={handleBulkMove}
              className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              <Send className="h-5 w-5 mr-2" />
              Move Selected to Deliberation
            </button>
          </div>
        </div>
      </div>

      {/* Error / Success messages */}
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

      {/* Search */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by association name, contact person, province..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-black pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="mt-4 text-gray-600">
          Showing {filteredData.length} records ready for evaluation
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        onRowClick={() => {}} // optional: view details (can be implemented later)
        isLoading={loading}
        onSort={(field) => setSortConfig(prev => ({
          field,
          direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }))}
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
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
        onRowsPerPageChange={(rows) => setPagination({ currentPage: 1, rowsPerPage: rows, totalPages: 1 })}
      />
    </div>
  );
};

export default Evaluation;