import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { db } from '../../../config/firebase';
import DataTable from 'react-data-table-component';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const CsoFarmers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingSearch, setPendingSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cso-farmers'));
        const farmers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(farmers);
      } catch (error) {
        console.error('Error fetching data: ', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(pendingSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [pendingSearch]);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      item.name?.toLowerCase().includes(term) ||
      item.municipality?.toLowerCase().includes(term) ||
      item.province?.toLowerCase().includes(term) ||
      item.address?.toLowerCase().includes(term) ||
      item.contactPerson?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this association?')) {
      try {
        await deleteDoc(doc(db, 'cso-farmers', id));
        setData(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Delete error: ', error);
      }
    }
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      const docRef = doc(db, 'cso-farmers', editingItem.id);
      const { id, ...updateData } = editingItem;
      await updateDoc(docRef, updateData);
      setData(prev =>
        prev.map(item => (item.id === editingItem.id ? editingItem : item))
      );
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Update error: ', error);
    }
  };

  const totalAssociations = data.length;
  const totalMembers = data.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalMale = data.reduce((sum, item) => sum + (item.male || 0), 0);
  const totalFemale = data.reduce((sum, item) => sum + (item.female || 0), 0);

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
        italic: rowNum === 3   // only "As of ..." is italic
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

    // 3. MAIN YELLOW HEADER (Rows 6 & 7)
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

    // 4. Helper functions for section rows
    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]);
      worksheet.mergeCells(`A${row.number}:I${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // green
        cell.font = { bold: true, italic: true, name: 'Times New Roman' };
        cell.border = { outline: true, bottom: { style: 'thin' } };
      });
    };

    const addMunicipalityRow = (name) => {
      const row = worksheet.addRow([name]);
      worksheet.mergeCells(`A${row.number}:I${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } }; // orange
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
            '',                          // province column (empty)
            i + 1,                       // sequential number inside municipality
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
  };

  const columns = [
    { name: 'Province', selector: row => row.province, sortable: true, wrap: true },
    { name: 'Municipality', selector: row => row.municipality, sortable: true, wrap: true },
    { name: 'Name', selector: row => row.name, sortable: true, wrap: true, grow: 2 },
    { name: 'Type', selector: row => row.type, sortable: true, wrap: true },
    { name: 'Male', selector: row => row.male ?? '-', right: true, sortable: true },
    { name: 'Female', selector: row => row.female ?? '-', right: true, sortable: true },
    { name: 'Total', selector: row => row.total ?? '-', right: true, sortable: true },
    { name: 'Address', selector: row => row.address, wrap: true, grow: 2 },
    { name: 'Contact', selector: row => row.contactPerson, wrap: true },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-900 transition-colors duration-200"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      button: true,
    }
  ];

  // Enhanced custom styles for DataTable
  const customStyles = {
    headCells: {
      style: {
        fontWeight: '700',
        fontSize: '0.875rem',
        backgroundColor: '#f3f4f6',
        color: '#1f2937',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        borderBottom: '2px solid #e5e7eb',
      },
    },
    rows: {
      style: {
        minHeight: '48px',
        '&:hover': {
          backgroundColor: '#f9fafb',
          transition: 'background-color 0.2s ease',
        },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e5e7eb',
        padding: '0.75rem',
      },
    },
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/50 rounded-2xl w-1/3 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/70 rounded-2xl h-32 shadow-lg"></div>
            ))}
          </div>
          <div className="bg-white/70 rounded-2xl h-96 shadow-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 lg:p-8 font-sans">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-900 flex items-center justify-center lg:justify-start gap-3">
          CSO Farmers Management
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Manage and monitor farmers cooperatives and associations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center space-x-4 hover:shadow-2xl transition-shadow duration-300 border border-gray-100">
          <div className="p-3 bg-blue-100 rounded-xl">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Total Associations</p>
            <p className="text-3xl font-bold text-gray-800">{totalAssociations}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center space-x-4 hover:shadow-2xl transition-shadow duration-300 border border-gray-100">
          <div className="p-3 bg-green-100 rounded-xl">
            <UsersIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Total Members</p>
            <p className="text-3xl font-bold text-gray-800">{totalMembers.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center space-x-4 hover:shadow-2xl transition-shadow duration-300 border border-gray-100">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <ChartBarIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Male Members</p>
            <p className="text-3xl font-bold text-gray-800">{totalMale.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center space-x-4 hover:shadow-2xl transition-shadow duration-300 border border-gray-100">
          <div className="p-3 bg-pink-100 rounded-xl">
            <ChartBarIcon className="h-8 w-8 text-pink-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Female Members</p>
            <p className="text-3xl font-bold text-gray-800">{totalFemale.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search associations..."
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-200 transition-all duration-200 outline-none shadow-sm"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={exportToExcel}
          className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <ArrowDownTrayIcon className="h-5 w-5 group-hover:animate-bounce" />
          Export to Excel
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          highlightOnHover
          striped
          responsive
          customStyles={customStyles}
          noDataComponent={
            <div className="p-8 text-center text-gray-500 text-lg">
              No associations found.
            </div>
          }
        />
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all animate-fadeIn">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Edit Association</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <input
                    type="text"
                    name="province"
                    value={editingItem.province || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                  <input
                    type="text"
                    name="municipality"
                    value={editingItem.municipality || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editingItem.name || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    name="type"
                    value={editingItem.type || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Male</label>
                  <input
                    type="number"
                    name="male"
                    value={editingItem.male ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Female</label>
                  <input
                    type="number"
                    name="female"
                    value={editingItem.female ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <input
                    type="number"
                    name="total"
                    value={editingItem.total ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editingItem.address || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={editingItem.contactPerson || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add a simple fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CsoFarmers;