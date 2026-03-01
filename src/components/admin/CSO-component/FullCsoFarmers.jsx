import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const FullCsoFarmers = () => {
  // ---------- State ----------
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  // ---------- Fetch Data ----------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'fullcso-farmers'));
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setData(items);
      } catch (error) {
        console.error('Error fetching data: ', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------- Analytics ----------
  const totalAssociations = data.length;
  const totalMale = data.reduce((acc, item) => acc + (item.male_members || 0), 0);
  const totalFemale = data.reduce((acc, item) => acc + (item.female_members || 0), 0);
  const totalMembers = data.reduce((acc, item) => acc + (item.total_members || 0), 0);
  const totalArea = data.reduce((acc, item) => acc + (parseFloat(item.area_covered) || 0), 0).toFixed(2);

  // ---------- Edit / Delete Handlers ----------
  const handleEdit = (row) => {
    setSelectedRow(row);
    setEditForm(row);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Are you sure you want to delete "${row.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'fullcso-farmers', row.id));
        setData(data.filter(item => item.id !== row.id));
      } catch (error) {
        console.error('Delete error: ', error);
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const docRef = doc(db, 'fullcso-farmers', selectedRow.id);
      await updateDoc(docRef, editForm);
      setData(data.map(item => (item.id === selectedRow.id ? { ...item, ...editForm } : item)));
      setModalOpen(false);
      setSelectedRow(null);
    } catch (error) {
      console.error('Update error: ', error);
    }
  };

  // ---------- Table Columns ----------
  const columns = [
    { name: 'Province', selector: row => row.province, sortable: true, wrap: true },
    { name: 'Municipality', selector: row => row.municipality, sortable: true, wrap: true },
    { name: 'No.', selector: row => row.no, sortable: true, width: '70px' },
    { name: 'Name', selector: row => row.name, sortable: true, wrap: true, grow: 2 },
    { name: 'Date Accredited', selector: row => row.date_accredited, sortable: true },
    { name: 'Date Expiration', selector: row => row.date_expiration, sortable: true },
    { name: 'Type', selector: row => row.type_fca, sortable: true, wrap: true },
    { name: 'Male', selector: row => row.male_members, sortable: true, right: true },
    { name: 'Female', selector: row => row.female_members, sortable: true, right: true },
    { name: 'Total Members', selector: row => row.total_members, sortable: true, right: true },
    { name: 'Area (ha)', selector: row => row.area_covered, sortable: true, right: true },
    { name: 'Address', selector: row => row.address, wrap: true },
    { name: 'Contact Person', selector: row => row.contact_person },
    { name: 'Contact No.', selector: row => row.contact_no },
    { name: 'Seeds', selector: row => row.interventions?.seeds ? 'Yes' : 'No', center: true },
    { name: 'Mech', selector: row => row.interventions?.mech ? 'Yes' : 'No', center: true },
    { name: 'Credit', selector: row => row.interventions?.credit ? 'Yes' : 'No', center: true },
    { name: 'Extn', selector: row => row.interventions?.extn ? 'Yes' : 'No', center: true },
    { name: 'Remarks', selector: row => row.remarks },
    { name: 'Certificate', selector: row => row.certificate_of_accreditation, omit: true },
    { name: 'Documents', selector: row => row.submitted_documents, omit: true },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px',
    },
  ];

  // ---------- Excel Export ----------
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Farmers Cooperative');

    worksheet.columns = [
      { key: 'prov', width: 18 }, { key: 'no', width: 6 }, { key: 'name', width: 45 },
      { key: 'dateApp', width: 15 }, { key: 'dateAcc', width: 15 }, { key: 'dateExp', width: 15 },
      { key: 'type', width: 22 }, { key: 'male', width: 8 }, { key: 'female', width: 8 },
      { key: 'total', width: 12 }, { key: 'area', width: 12 }, { key: 'address', width: 25 },
      { key: 'contactPerson', width: 20 }, { key: 'contactNo', width: 15 }, { key: 'seeds', width: 8 },
      { key: 'mech', width: 8 }, { key: 'credit', width: 8 }, { key: 'extn', width: 8 },
      { key: 'remarks', width: 15 }, { key: 'cert', width: 45 }, { key: 'docs', width: 35 },
    ];

    const titleRows = [
      ['LIST OF FARMERS COOPERATIVE/ASSOCIATION ACCREDITED UNDER RCEF'],
      ['REGION: MIMAROPA'],
      ['As of January 2026'],
      [''],
    ];
    titleRows.forEach((val, index) => {
      const rowNum = index + 1;
      worksheet.getRow(rowNum).values = val;
      worksheet.mergeCells(`A${rowNum}:U${rowNum}`);
      const cell = worksheet.getCell(`A${rowNum}`);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { name: 'Times New Roman', size: 11, bold: true, italic: rowNum === 3 };
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
    worksheet.getRow(6).values = [
      'PROV./CITIES/MUN.', 'No.', 'Name', 'DATE OF APPLICATION RECEIVED', 'DATE ACCREDITED',
      'DATE OF EXPIRATION', '*TYPE OF FCA', 'NO. OF MEMBERS', '', 'TOTAL NO. OF MEMBERS',
      'AREA (ha) COVERED', 'ADDRESS', 'CONTACT PERSON', 'CONTACT NO.', 'TYPE OF INTERVENTION',
      '', '', '', 'REMARKS', 'CERTIFICATE OF ACCREDITATION', 'Submitted Documents'
    ];
    worksheet.getRow(7).values = [
      '', '', '', '', '', '', '', 'MALE', 'FEMALE', '', '', '', '', '',
      'SEEDS', 'MECH', 'CREDIT', 'EXTN.', '', '', ''
    ];

    const merges = [
      'A6:A7', 'B6:B7', 'C6:C7', 'D6:D7', 'E6:E7', 'F6:F7', 'G6:G7',
      'H6:I6', 'J6:J7', 'K6:K7', 'L6:L7', 'M6:M7', 'N6:N7',
      'O6:R6', 'S6:S7', 'T6:T7', 'U6:U7'
    ];
    merges.forEach(m => worksheet.mergeCells(m));

    [6, 7].forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.height = 30;
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, size: 9, name: 'Times New Roman' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]); // always uppercase
      worksheet.mergeCells(`A${row.number}:U${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
        cell.font = { bold: true, italic: true, name: 'Times New Roman' };
        cell.border = { outline: true, bottom: { style: 'thin' }, top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
    };

    const addMunicipalityRow = (name) => {
      const row = worksheet.addRow([name]);
      worksheet.mergeCells(`A${row.number}:U${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
        cell.font = { bold: true, name: 'Times New Roman' };
        cell.border = { outline: true, bottom: { style: 'thin' }, top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
    };

    // Step 1: Normalize province to uppercase for grouping, but keep original for display?
    const grouped = {};
    data.forEach(item => {
      const prov = item.province || 'Unknown';
      const provUpper = prov.toUpperCase(); // normalize for grouping
      const mun = item.municipality || 'Unknown';

      if (!grouped[provUpper]) {
        grouped[provUpper] = {
          originalName: prov, // keep one original case (first encountered)
          municipalities: {}
        };
      }
      if (!grouped[provUpper].municipalities[mun]) {
        grouped[provUpper].municipalities[mun] = [];
      }
      grouped[provUpper].municipalities[mun].push(item);
    });

    // Step 2: Sort provinces alphabetically (by normalized name)
    const sortedProvinces = Object.keys(grouped).sort();

    sortedProvinces.forEach(provUpper => {
      // Use the original case or just uppercase? We'll use uppercase for the row.
      addProvinceRow(provUpper); // already uppercase

      const munObj = grouped[provUpper].municipalities;
      const sortedMunicipalities = Object.keys(munObj).sort();

      sortedMunicipalities.forEach(mun => {
        addMunicipalityRow(mun);

        // Step 3: Sort items within municipality by the numeric value of 'no'
        const sortedItems = [...munObj[mun]].sort((a, b) => {
          const numA = parseInt(a.no, 10) || 0;
          const numB = parseInt(b.no, 10) || 0;
          return numA - numB;
        });

        sortedItems.forEach(item => {
          const row = worksheet.addRow([
            '', // province column blank in detail rows
            item.no || '',
            item.name || '',
            item.date_application_received || '',
            item.date_accredited || '',
            item.date_expiration || '',
            item.type_fca || '',
            item.male_members || '',
            item.female_members || '',
            item.total_members || '',
            item.area_covered || '',
            item.address || '',
            item.contact_person || '',
            item.contact_no || '',
            item.interventions?.seeds ? 'TRUE' : 'FALSE',
            item.interventions?.mech ? 'TRUE' : 'FALSE',
            item.interventions?.credit ? 'TRUE' : 'FALSE',
            item.interventions?.extn ? 'TRUE' : 'FALSE',
            item.remarks || '',
            item.certificate_of_accreditation || '',
            item.submitted_documents || ''
          ]);

          row.eachCell(cell => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.font = { name: 'Times New Roman', size: 10 };
            cell.alignment = { vertical: 'middle', wrapText: true };
          });

          // Center specific columns (by column index 1‑based)
          [2, 4, 5, 6, 8, 9, 10, 11, 15, 16, 17, 18].forEach(col => {
            const cell = row.getCell(col);
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          });
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Accredited_FCA_MIMAROPA.xlsx');
  };

  // ---------- Edit Modal ----------
  const EditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold mb-4">Edit Association</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <input
                value={editForm.province || ''}
                onChange={e => setEditForm({...editForm, province: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
              <input
                value={editForm.municipality || ''}
                onChange={e => setEditForm({...editForm, municipality: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No.</label>
              <input
                value={editForm.no || ''}
                onChange={e => setEditForm({...editForm, no: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={editForm.name || ''}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Accredited</label>
              <input
                value={editForm.date_accredited || ''}
                onChange={e => setEditForm({...editForm, date_accredited: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Expiration</label>
              <input
                value={editForm.date_expiration || ''}
                onChange={e => setEditForm({...editForm, date_expiration: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                value={editForm.type_fca || ''}
                onChange={e => setEditForm({...editForm, type_fca: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Members</label>
              <input
                type="number"
                value={editForm.male_members || ''}
                onChange={e => setEditForm({...editForm, male_members: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Members</label>
              <input
                type="number"
                value={editForm.female_members || ''}
                onChange={e => setEditForm({...editForm, female_members: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Members</label>
              <input
                type="number"
                value={editForm.total_members || ''}
                onChange={e => setEditForm({...editForm, total_members: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Covered</label>
              <input
                value={editForm.area_covered || ''}
                onChange={e => setEditForm({...editForm, area_covered: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                value={editForm.address || ''}
                onChange={e => setEditForm({...editForm, address: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                value={editForm.contact_person || ''}
                onChange={e => setEditForm({...editForm, contact_person: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
              <input
                value={editForm.contact_no || ''}
                onChange={e => setEditForm({...editForm, contact_no: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="seeds"
                checked={editForm.interventions?.seeds || false}
                onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, seeds: e.target.checked}})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="seeds" className="text-sm font-medium text-gray-700">Seeds</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mech"
                checked={editForm.interventions?.mech || false}
                onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, mech: e.target.checked}})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="mech" className="text-sm font-medium text-gray-700">Mech</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="credit"
                checked={editForm.interventions?.credit || false}
                onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, credit: e.target.checked}})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="credit" className="text-sm font-medium text-gray-700">Credit</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="extn"
                checked={editForm.interventions?.extn || false}
                onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, extn: e.target.checked}})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="extn" className="text-sm font-medium text-gray-700">Extn</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input
                value={editForm.remarks || ''}
                onChange={e => setEditForm({...editForm, remarks: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Full CSO Farmers</h1>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Associations</h3>
          <p className="text-2xl font-bold text-gray-800">{totalAssociations}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Members</h3>
          <p className="text-2xl font-bold text-gray-800">{totalMembers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Male Members</h3>
          <p className="text-2xl font-bold text-gray-800">{totalMale}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Female Members</h3>
          <p className="text-2xl font-bold text-gray-800">{totalFemale}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Area (ha)</h3>
          <p className="text-2xl font-bold text-gray-800">{totalArea}</p>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={exportToExcel}
        className="mb-6 px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition shadow-sm"
      >
        Export to Excel
      </button>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          progressPending={loading}
          pagination
          paginationPerPage={20}
          paginationRowsPerPageOptions={[20, 50, 100]}
          highlightOnHover
          striped
          responsive
          defaultSortFieldId={1}
          noDataComponent={<div className="p-6 text-center text-gray-500">No records found</div>}
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
              },
            },
            rows: {
              style: {
                fontSize: '0.875rem',
                color: '#374151',
              },
            },
          }}
        />
      </div>

      {modalOpen && <EditModal />}
    </div>
  );
};

export default FullCsoFarmers;