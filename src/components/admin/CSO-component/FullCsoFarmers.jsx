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
  const [selectedRow, setSelectedRow] = useState(null); // for editing
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  // ---------- Fetch Data from Firestore ----------
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
    { name: 'Certificate', selector: row => row.certificate_of_accreditation, omit: true }, // hide from table, used in export
    { name: 'Documents', selector: row => row.submitted_documents, omit: true },
    {
      name: 'Actions',
      cell: row => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleEdit(row)} style={styles.actionButton}>Edit</button>
          <button onClick={() => handleDelete(row)} style={{ ...styles.actionButton, backgroundColor: '#dc3545' }}>Delete</button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px',
    },
  ];

  // ---------- Excel Export (exact format as provided) ----------
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Farmers Cooperative');

    // Define 21 columns (A to U)
    worksheet.columns = [
      { key: 'prov', width: 18 },         // A
      { key: 'no', width: 6 },            // B
      { key: 'name', width: 45 },         // C
      { key: 'dateApp', width: 15 },      // D
      { key: 'dateAcc', width: 15 },      // E
      { key: 'dateExp', width: 15 },      // F
      { key: 'type', width: 22 },         // G
      { key: 'male', width: 8 },          // H
      { key: 'female', width: 8 },        // I
      { key: 'total', width: 12 },        // J
      { key: 'area', width: 12 },         // K
      { key: 'address', width: 25 },      // L
      { key: 'contactPerson', width: 20 },// M
      { key: 'contactNo', width: 15 },    // N
      { key: 'seeds', width: 8 },         // O
      { key: 'mech', width: 8 },          // P
      { key: 'credit', width: 8 },        // Q
      { key: 'extn', width: 8 },          // R
      { key: 'remarks', width: 15 },      // S
      { key: 'cert', width: 45 },         // T
      { key: 'docs', width: 35 },         // U
    ];

    // Title rows
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

    // Table headers (rows 6 & 7)
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

    // Merge header cells
    const merges = [
      'A6:A7', 'B6:B7', 'C6:C7', 'D6:D7', 'E6:E7', 'F6:F7', 'G6:G7',
      'H6:I6', 'J6:J7', 'K6:K7', 'L6:L7', 'M6:M7', 'N6:N7',
      'O6:R6', 'S6:S7', 'T6:T7', 'U6:U7'
    ];
    merges.forEach(m => worksheet.mergeCells(m));

    // Style header rows
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

    // Helper to add province row
    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]);
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

    // Group data by province, then by municipality
    const grouped = data.reduce((acc, item) => {
      const prov = item.province || 'Unknown';
      const mun = item.municipality || 'Unknown';
      if (!acc[prov]) acc[prov] = {};
      if (!acc[prov][mun]) acc[prov][mun] = [];
      acc[prov][mun].push(item);
      return acc;
    }, {});

    // Build rows in order
    const sortedProvinces = Object.keys(grouped).sort();
    sortedProvinces.forEach(prov => {
      addProvinceRow(prov);
      const municipalities = Object.keys(grouped[prov]).sort();
      municipalities.forEach(mun => {
        addMunicipalityRow(mun);
        grouped[prov][mun].forEach(item => {
          const row = worksheet.addRow([
            '', // province column will be blank in detail rows
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
          // Center specific columns
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
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h3>Edit Association</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          <div style={modalStyles.grid}>
            <label>Province:</label>
            <input value={editForm.province || ''} onChange={e => setEditForm({...editForm, province: e.target.value})} />
            <label>Municipality:</label>
            <input value={editForm.municipality || ''} onChange={e => setEditForm({...editForm, municipality: e.target.value})} />
            <label>No.:</label>
            <input value={editForm.no || ''} onChange={e => setEditForm({...editForm, no: e.target.value})} />
            <label>Name:</label>
            <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            <label>Date Accredited:</label>
            <input value={editForm.date_accredited || ''} onChange={e => setEditForm({...editForm, date_accredited: e.target.value})} />
            <label>Date Expiration:</label>
            <input value={editForm.date_expiration || ''} onChange={e => setEditForm({...editForm, date_expiration: e.target.value})} />
            <label>Type:</label>
            <input value={editForm.type_fca || ''} onChange={e => setEditForm({...editForm, type_fca: e.target.value})} />
            <label>Male Members:</label>
            <input type="number" value={editForm.male_members || ''} onChange={e => setEditForm({...editForm, male_members: parseInt(e.target.value) || 0})} />
            <label>Female Members:</label>
            <input type="number" value={editForm.female_members || ''} onChange={e => setEditForm({...editForm, female_members: parseInt(e.target.value) || 0})} />
            <label>Total Members:</label>
            <input type="number" value={editForm.total_members || ''} onChange={e => setEditForm({...editForm, total_members: parseInt(e.target.value) || 0})} />
            <label>Area Covered:</label>
            <input value={editForm.area_covered || ''} onChange={e => setEditForm({...editForm, area_covered: e.target.value})} />
            <label>Address:</label>
            <input value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} />
            <label>Contact Person:</label>
            <input value={editForm.contact_person || ''} onChange={e => setEditForm({...editForm, contact_person: e.target.value})} />
            <label>Contact No.:</label>
            <input value={editForm.contact_no || ''} onChange={e => setEditForm({...editForm, contact_no: e.target.value})} />
            <label>Seeds:</label>
            <input type="checkbox" checked={editForm.interventions?.seeds || false} onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, seeds: e.target.checked}})} />
            <label>Mech:</label>
            <input type="checkbox" checked={editForm.interventions?.mech || false} onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, mech: e.target.checked}})} />
            <label>Credit:</label>
            <input type="checkbox" checked={editForm.interventions?.credit || false} onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, credit: e.target.checked}})} />
            <label>Extn:</label>
            <input type="checkbox" checked={editForm.interventions?.extn || false} onChange={e => setEditForm({...editForm, interventions: {...editForm.interventions, extn: e.target.checked}})} />
            <label>Remarks:</label>
            <input value={editForm.remarks || ''} onChange={e => setEditForm({...editForm, remarks: e.target.value})} />
          </div>
          <div style={modalStyles.buttons}>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1>Full CSO Farmers</h1>

      {/* Analytics Cards */}
      <div style={styles.analytics}>
        <div style={styles.card}>
          <h3>Total Associations</h3>
          <p>{totalAssociations}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Members</h3>
          <p>{totalMembers}</p>
        </div>
        <div style={styles.card}>
          <h3>Male Members</h3>
          <p>{totalMale}</p>
        </div>
        <div style={styles.card}>
          <h3>Female Members</h3>
          <p>{totalFemale}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Area (ha)</h3>
          <p>{totalArea}</p>
        </div>
      </div>

      {/* Export Button */}
      <button onClick={exportToExcel} style={styles.exportBtn}>
        Export to Excel
      </button>

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
        noDataComponent={<div style={{ padding: '24px' }}>No records found</div>}
      />

      {modalOpen && <EditModal />}
    </div>
  );
};

// ---------- Styles ----------
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  analytics: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  card: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '16px',
    minWidth: '150px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  exportBtn: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '20px',
    fontSize: '16px'
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '20px'
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  }
};

export default FullCsoFarmers;