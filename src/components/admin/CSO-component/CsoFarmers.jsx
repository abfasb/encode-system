import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import DataTable from 'react-data-table-component';
import {
  Eye,
  Edit,
  Trash2,
  Download,
  Search,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Users,
  MapPin,
  Building,
  User,
  FileText,
  Clock,
  UserCircle,
  Phone,
  Mail,
  Calendar
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

// ---------- Helper: Normalize province name ----------
const normalizeProvince = (prov) => {
  if (!prov) return '';
  return prov
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ---------- Modal Component (copied from Deferred) ----------
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

const CsoFarmers = () => {
  // ---------- State ----------
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ---------- CRUD States ----------
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ province: 'all' });

  // ---------- Fetch Data ----------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const querySnapshot = await getDocs(collection(db, 'cso-farmers'));
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
    } catch (error) {
      console.error('Error fetching data: ', error);
      setError('Failed to load records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- Analytics ----------
  const stats = useMemo(() => {
    const totalAssociations = data.length;
    const totalMale = data.reduce((acc, item) => acc + (item.male || 0), 0);
    const totalFemale = data.reduce((acc, item) => acc + (item.female || 0), 0);
    const totalMembers = data.reduce((acc, item) => acc + (item.total || 0), 0);
    const provinces = [...new Set(data.map(item => normalizeProvince(item.province)).filter(Boolean))].length;

    return {
      totalAssociations,
      totalMale,
      totalFemale,
      totalMembers,
      provinces
    };
  }, [data]);

  // ---------- Province dropdown options ----------
  const provinceOptions = useMemo(() => {
    const normSet = new Set();
    data.forEach(item => {
      if (item.province) {
        normSet.add(normalizeProvince(item.province));
      }
    });
    const mimaropaOrder = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Palawan', 'Romblon'];
    const sorted = Array.from(normSet).sort((a, b) => {
      const idxA = mimaropaOrder.indexOf(a);
      const idxB = mimaropaOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return sorted;
  }, [data]);

  // ---------- Filtered Data ----------
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.municipality?.toLowerCase().includes(searchLower) ||
          item.province?.toLowerCase().includes(searchLower) ||
          item.address?.toLowerCase().includes(searchLower) ||
          item.contactPerson?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.province !== 'all') {
      const selectedNorm = filters.province;
      filtered = filtered.filter(
        (item) => normalizeProvince(item.province) === selectedNorm
      );
    }

    return filtered;
  }, [data, searchTerm, filters]);

  // ---------- CRUD Handlers ----------
  const handleEdit = (row) => {
    setSelectedApplication(row);
    setEditForm(row);
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!selectedApplication) return;
    try {
      await deleteDoc(doc(db, 'cso-farmers', selectedApplication.id));
      setData(data.filter(item => item.id !== selectedApplication.id));
      setSuccess(`Application "${selectedApplication.name}" deleted successfully.`);
      setShowDeleteModal(false);
      setSelectedApplication(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Delete error: ', error);
      setError('Failed to delete record. Please try again.');
    }
  };

  const handleUpdate = async () => {
    try {
      const docRef = doc(db, 'cso-farmers', selectedApplication.id);
      await updateDoc(docRef, editForm);
      setData(data.map(item => (item.id === selectedApplication.id ? { ...item, ...editForm } : item)));
      setSuccess('Application updated successfully!');
      setShowEditModal(false);
      setSelectedApplication(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Update error: ', error);
      setError('Failed to update record. Please try again.');
    }
  };

  const openDeleteModal = (row) => {
    setSelectedApplication(row);
    setShowDeleteModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // ---------- Export to Excel (unchanged) ----------
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Farmers Cooperative');

    worksheet.columns = [
      { key: 'prov', width: 18 },
      { key: 'no', width: 6 },
      { key: 'name', width: 55 },
      { key: 'type', width: 22 },
      { key: 'male', width: 10 },
      { key: 'female', width: 10 },
      { key: 'total', width: 15 },
      { key: 'address', width: 35 },
      { key: 'contact', width: 25 },
    ];

    const titleRows = [
      ['LIST OF FARMERS COOPERATIVE/ASSOCIATION ACCREDITED UNDER RCEF'],
      ['REGION: MIMAROPA'],
      ['As of January 2026'],
      ['']
    ];

    titleRows.forEach((val, index) => {
      const rowNum = index + 1;
      worksheet.getRow(rowNum).values = val;
      worksheet.mergeCells(`A${rowNum}:I${rowNum}`);
      const cell = worksheet.getCell(`A${rowNum}`);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      cell.font = {
        name: 'Times New Roman',
        size: 11,
        bold: true,
        italic: rowNum === 3
      };

      if (rowNum === 2) {
        cell.value = {
          richText: [
            { font: { name: 'Times New Roman', bold: true }, text: 'REGION: ' },
            { font: { name: 'Times New Roman', color: { argb: 'FFFF0000' }, bold: true }, text: 'MIMAROPA' }
          ]
        };
      }
    });

    const headerColor = 'FFFFFF00';
    worksheet.getRow(6).values = ['PROV./CITIES/MUN.', 'No.', 'Name of Association', '*TYPE OF FCA', 'NO. OF MEMBERS', '', 'TOTAL NO. OF MEMBERS', 'ADDRESS', 'CONTACT PERSON'];
    worksheet.getRow(7).values = ['', '', '', '', 'MALE', 'FEMALE', '', '', ''];

    const merges = [
      'A6:A7', 'B6:B7', 'C6:C7', 'D6:D7',
      'E6:F6',
      'G6:G7', 'H6:H7', 'I6:I7'
    ];
    merges.forEach(m => worksheet.mergeCells(m));

    [6, 7].forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.height = 25;
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, size: 10, name: 'Times New Roman' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
    });

    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]);
      worksheet.mergeCells(`A${row.number}:I${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
        cell.font = { bold: true, italic: true, name: 'Times New Roman' };
        cell.border = { outline: true, bottom: { style: 'thin' } };
      });
    };

    const addMunicipalityRow = (name) => {
      const row = worksheet.addRow([name]);
      worksheet.mergeCells(`A${row.number}:I${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
        cell.font = { bold: true, name: 'Times New Roman' };
        cell.border = { outline: true, bottom: { style: 'thin' } };
      });
    };

    const grouped = data.reduce((acc, item) => {
      const province = item.province || 'Unknown Province';
      const municipality = item.municipality || 'Unknown Municipality';
      if (!acc[province]) acc[province] = {};
      if (!acc[province][municipality]) acc[province][municipality] = [];
      acc[province][municipality].push(item);
      return acc;
    }, {});

    const sortedProvinces = Object.keys(grouped).sort();
    for (const province of sortedProvinces) {
      addProvinceRow(province);

      const municipalities = grouped[province];
      const sortedMunicipalities = Object.keys(municipalities).sort();

      sortedMunicipalities.forEach((municipality, idx) => {
        addMunicipalityRow(`${idx + 1}. ${municipality}`);

        const items = municipalities[municipality].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        items.forEach((item, i) => {
          const row = worksheet.addRow([
            '',
            i + 1,
            item.name || '',
            item.type || '',
            item.male ?? '',
            item.female ?? '',
            item.total ?? '',
            item.address || '',
            item.contactPerson || ''
          ]);
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.font = { name: 'Times New Roman', size: 10 };
          });
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'List of Farmers Cooperative_Association Accredited in RCEF 2026.xlsx');
    setSuccess('Export Complete!');
  };

  // ---------- Table Columns ----------
  const columns = [
    {
      name: 'Association',
      selector: row => row.name,
      sortable: true,
      wrap: true,
      cell: row => (
        <div>
          <div className="font-semibold text-gray-900">{row.name || '—'}</div>
          <div className="text-xs text-gray-500">{normalizeProvince(row.province)} • {row.municipality}</div>
        </div>
      )
    },
    {
      name: 'Type',
      selector: row => row.type,
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.type || '—'}
        </span>
      )
    },
    {
      name: 'Members',
      sortable: true,
      cell: row => (
        <div className="flex items-center space-x-2">
          <div className="text-sm">
            <span className="font-medium">M:</span> {row.male || 0}
          </div>
          <div className="text-sm">
            <span className="font-medium">F:</span> {row.female || 0}
          </div>
          <div className="text-sm font-semibold text-gray-900">
            T: {row.total || 0}
          </div>
        </div>
      )
    },
    {
      name: 'Address',
      selector: row => row.address,
      wrap: true,
      grow: 2
    },
    {
      name: 'Contact',
      selector: row => row.contactPerson,
      wrap: true
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex items-center space-x-2">
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
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '100px',
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">CSO Farmers</h1>
            <p className="text-gray-600 mt-2">
              Farmers cooperatives and associations
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
              <p className="text-blue-100 text-sm font-medium">Total Associations</p>
              <p className="text-3xl font-bold mt-2">{stats.totalAssociations}</p>
            </div>
            <FileText className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">{stats.provinces} provinces</p>
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
            <p className="text-amber-100 text-sm">Across all associations</p>
          </div>
        </div>

        <div className="bg-purple-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Male Members</p>
              <p className="text-3xl font-bold mt-2">{stats.totalMale.toLocaleString()}</p>
            </div>
            <User className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">{((stats.totalMale / stats.totalMembers) * 100 || 0).toFixed(1)}% of total</p>
          </div>
        </div>

        <div className="bg-pink-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Female Members</p>
              <p className="text-3xl font-bold mt-2">{stats.totalFemale.toLocaleString()}</p>
            </div>
            <UserCircle className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-pink-400">
            <p className="text-pink-100 text-sm">{((stats.totalFemale / stats.totalMembers) * 100 || 0).toFixed(1)}% of total</p>
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
                placeholder="Search by name, municipality, province, address..."
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
              onChange={(e) => setFilters({ province: e.target.value })}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Provinces</option>
              {provinceOptions.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-gray-600">
            Showing <span className="font-semibold">{filteredData.length}</span> of <span className="font-semibold">{data.length}</span> records
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 50, 100]}
          highlightOnHover
          striped
          responsive
          noDataComponent={
            <div className="p-12 text-center">
              <div className="flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No records found</p>
              </div>
            </div>
          }
          customStyles={{
            headRow: {
              style: {
                backgroundColor: '#f9fafb',
                borderBottomWidth: '1px',
                borderBottomColor: '#e5e7eb',
              },
            },
            headCells: {
              style: {
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                paddingLeft: '1rem',
                paddingRight: '1rem',
              },
            },
            rows: {
              style: {
                fontSize: '0.875rem',
                color: '#374151',
                minHeight: '48px',
                '&:hover': {
                  backgroundColor: '#f9fafb',
                },
              },
            },
            pagination: {
              style: {
                borderTop: '1px solid #e5e7eb',
                padding: '0.75rem',
              },
            },
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span>CSO Farmers Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{data.length} Associations</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- EDIT MODAL ---------- */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Association"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <input
                type="text"
                name="province"
                value={editForm.province || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
              <input
                type="text"
                name="municipality"
                value={editForm.municipality || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name of Association</label>
              <input
                type="text"
                name="name"
                value={editForm.name || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                type="text"
                name="type"
                value={editForm.type || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Members</label>
              <input
                type="number"
                name="male"
                value={editForm.male ?? ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Members</label>
              <input
                type="number"
                name="female"
                value={editForm.female ?? ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Members</label>
              <input
                type="number"
                name="total"
                value={editForm.total ?? ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={editForm.address || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={editForm.contactPerson || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              Update Association
            </button>
          </div>
        </form>
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Association</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{selectedApplication?.name}</span>? This action cannot be undone.
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

export default CsoFarmers;