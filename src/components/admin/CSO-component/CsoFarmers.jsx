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
  XMarkIcon
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash'; 

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
            className="text-blue-600 hover:text-blue-900"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      button: true,
    }
  ];

  // Custom styles for DataTable (optional)
  const customStyles = {
    headCells: {
      style: {
        fontWeight: 'bold',
        fontSize: '0.875rem',
        backgroundColor: '#f9fafb',
      },
    },
    rows: {
      style: {
        minHeight: '48px',
      },
    },
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-['Times_New_Roman']">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 ">
          <p className="text-sm text-gray-600">Total Associations</p>
          <p className="text-2xl font-bold">{totalAssociations}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Members</p>
          <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Male Members</p>
          <p className="text-2xl font-bold">{totalMale.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Female Members</p>
          <p className="text-2xl font-bold">{totalFemale.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search..."
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={exportToExcel}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Data Table */}
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
        noDataComponent={<div className="p-4 text-center text-gray-500">No associations found.</div>}
      />

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Association</h3>
              <button onClick={() => setShowEditModal(false)}>
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Province</label>
                <input
                  type="text"
                  name="province"
                  value={editingItem.province || ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Municipality</label>
                <input
                  type="text"
                  name="municipality"
                  value={editingItem.municipality || ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editingItem.name || ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <input
                  type="text"
                  name="type"
                  value={editingItem.type || ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Male</label>
                <input
                  type="number"
                  name="male"
                  value={editingItem.male ?? ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Female</label>
                <input
                  type="number"
                  name="female"
                  value={editingItem.female ?? ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total</label>
                <input
                  type="number"
                  name="total"
                  value={editingItem.total ?? ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={editingItem.address || ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={editingItem.contactPerson || ''}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsoFarmers;