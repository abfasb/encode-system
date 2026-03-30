import React, { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
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
  ArrowRightCircle
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

// ---------- Helper: Extract year from date_received ----------
const extractYear = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.getFullYear();
};

// ---------- Helper: Normalize province name to title case ----------
const normalizeProvince = (prov) => {
  if (!prov) return '';
  return prov
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

const RcefWithLackings = () => {
  // ---------- State ----------
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ---------- CRUD States ----------
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [restoreDates, setRestoreDates] = useState({
    date_accredited: '',
    date_expiration: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ province: 'all', year: 'all' });

  // ---------- Fetch Data from 'rcef-lackings' collection ----------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const querySnapshot = await getDocs(collection(db, 'rcef-lackings'));
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
    const totalMembers = data.reduce((acc, item) => acc + (item.total_members || 0), 0);
    const totalArea = data.reduce((acc, item) => acc + (parseFloat(item.area_covered) || 0), 0).toFixed(2);
    const provinces = [...new Set(data.map(item => normalizeProvince(item.province)).filter(Boolean))].length;
    const seedCount = data.filter(item => item.program?.toLowerCase().includes('seed')).length;
    const mechCount = data.filter(item => item.program?.toLowerCase().includes('machineries')).length;

    return {
      totalAssociations,
      totalMembers,
      totalArea,
      provinces,
      seedCount,
      mechCount
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

  // ---------- Year dropdown options (from date_received) ----------
  const yearOptions = useMemo(() => {
    const years = new Set();
    data.forEach(item => {
      const year = extractYear(item.date_received);
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // descending, most recent first
  }, [data]);

  // ---------- Helper: Get next sequence number for 'rcef' collection ----------
  const getNextAccreditedSequenceNumber = async (province, municipality) => {
    if (!province || !municipality) return '1';
    try {
      const q = query(
        collection(db, 'rcef'),
        where('province', '==', province),
        where('municipality', '==', municipality),
        orderBy('no', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return '1';
      }
      const lastNo = querySnapshot.docs[0].data().no;
      const lastNum = parseInt(lastNo, 10);
      return isNaN(lastNum) ? '1' : (lastNum + 1).toString();
    } catch (error) {
      console.error('Error getting next sequence number for rcef:', error);
      return '1';
    }
  };

  // ---------- Helper: Find corresponding fullcso document by lackingsId ----------
  const findFullCsoByLackingsId = async (lackingsId) => {
    const q = query(
      collection(db, 'fullcso-farmers'),
      where('rcefLackingsId', '==', lackingsId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  };

  // ---------- Edit / Delete Handlers ----------
  const handleEdit = (row) => {
    setSelectedApplication(row);
    setEditForm(row);
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!selectedApplication) return;
    try {
      // Delete from rcef-lackings
      await deleteDoc(doc(db, 'rcef-lackings', selectedApplication.id));

      // Optionally delete from fullcso-farmers if it exists
      const fullCsoDoc = await findFullCsoByLackingsId(selectedApplication.id);
      if (fullCsoDoc) {
        await deleteDoc(doc(db, 'fullcso-farmers', fullCsoDoc.id));
      }

      setData(data.filter(item => item.id !== selectedApplication.id));
      setSuccess(`Record "${selectedApplication.name}" deleted successfully.`);
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
      const docRef = doc(db, 'rcef-lackings', selectedApplication.id);
      await updateDoc(docRef, editForm);

      // Update corresponding fullcso document if exists
      const fullCsoDoc = await findFullCsoByLackingsId(selectedApplication.id);
      if (fullCsoDoc) {
        const fullCsoRef = doc(db, 'fullcso-farmers', fullCsoDoc.id);
        const { id, rcefLackingsId, source, ...updateData } = editForm;
        await updateDoc(fullCsoRef, updateData);
      }

      setData(data.map(item => (item.id === selectedApplication.id ? { ...item, ...editForm } : item)));
      setSuccess('Record updated successfully!');
      setShowEditModal(false);
      setSelectedApplication(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Update error: ', error);
      setError('Failed to update record. Please try again.');
    }
  };

  // ---------- Restore to Accredited ----------
  const handleRestore = async () => {
    if (!selectedApplication) return;
    try {
      const { date_accredited, date_expiration } = restoreDates;
      if (!date_accredited || !date_expiration) {
        setError('Please provide both accreditation and expiration dates.');
        return;
      }

      // Get next sequence number for the target province/municipality in rcef collection
      const nextNo = await getNextAccreditedSequenceNumber(
        selectedApplication.province,
        selectedApplication.municipality
      );

      // Prepare data for accredited record (copy all fields except id and lackings specific)
      const accreditedData = {
        ...selectedApplication,
        no: nextNo,
        date_accredited,
        date_expiration,
        // Ensure we don't copy the lackings-specific id
      };
      delete accreditedData.id;

      // Add to rcef collection
      const accreditedDocRef = await addDoc(collection(db, 'rcef'), accreditedData);
      const accreditedId = accreditedDocRef.id;

      // Handle fullcso-farmers record
      const fullCsoDoc = await findFullCsoByLackingsId(selectedApplication.id);
      if (fullCsoDoc) {
        // Update existing fullcso record to point to the new accredited record
        const fullCsoRef = doc(db, 'fullcso-farmers', fullCsoDoc.id);
        await updateDoc(fullCsoRef, {
          source: 'rcef',
          rcefId: accreditedId,
          rcefLackingsId: null, // clear link to lackings
          date_accredited,
          date_expiration,
        });
      } else {
        // Create new fullcso record
        const fullCsoRecord = {
          ...accreditedData,
          source: 'rcef',
          rcefId: accreditedId,
        };
        await addDoc(collection(db, 'fullcso-farmers'), fullCsoRecord);
      }

      // Delete the original lackings record
      await deleteDoc(doc(db, 'rcef-lackings', selectedApplication.id));

      // Update local state
      setData(data.filter(item => item.id !== selectedApplication.id));
      setSuccess(`Record "${selectedApplication.name}" has been restored to accredited.`);
      setShowRestoreModal(false);
      setSelectedApplication(null);
      setRestoreDates({ date_accredited: '', date_expiration: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Restore error: ', error);
      setError('Failed to restore record. Please try again.');
    }
  };

  const openDeleteModal = (row) => {
    setSelectedApplication(row);
    setShowDeleteModal(true);
  };

  const openRestoreModal = (row) => {
    setSelectedApplication(row);
    setShowRestoreModal(true);
  };

  const handleView = (row) => {
    setSelectedApplication(row);
    setShowViewModal(true);
  };

  // ---------- Filter & Search ----------
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.contact_person?.toLowerCase().includes(searchLower) ||
          item.province?.toLowerCase().includes(searchLower) ||
          item.municipality?.toLowerCase().includes(searchLower) ||
          item.address?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.province !== 'all') {
      const selectedNorm = filters.province;
      filtered = filtered.filter(
        (item) => normalizeProvince(item.province) === selectedNorm
      );
    }

    if (filters.year !== 'all') {
      const selectedYear = parseInt(filters.year, 10);
      filtered = filtered.filter((item) => {
        const year = extractYear(item.date_received);
        return year === selectedYear;
      });
    }

    return filtered;
  }, [data, searchTerm, filters]);

  // ---------- Table Columns (with Restore button) ----------
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
      name: 'Contact',
      selector: row => row.contact_person,
      sortable: true,
      cell: row => (
        <div>
          <div className="font-medium text-gray-900">{row.contact_person || '—'}</div>
          <div className="text-xs text-gray-500">{row.contact_no || '—'}</div>
        </div>
      )
    },
    {
      name: 'Members',
      selector: row => row.total_members,
      sortable: true,
      right: true,
      cell: row => (
        <div className="flex items-center">
          <Users className="h-3 w-3 mr-1 text-gray-500" />
          {row.total_members || 0}
        </div>
      )
    },
    {
      name: 'Area (ha)',
      selector: row => row.area_covered,
      sortable: true,
      right: true,
    },
    {
      name: 'Program',
      selector: row => row.program,
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.program || '—'}
        </span>
      )
    },
    {
      name: 'Partner Agency',
      selector: row => row.partner_agency,
      sortable: true,
    },
    {
      name: 'Date Received',
      selector: row => row.date_received,
      sortable: true,
      cell: row => formatDate(row.date_received)
    },
    {
      name: 'Actions',
      cell: row => (
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
            onClick={() => openRestoreModal(row)}
            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Restore to Accredited"
          >
            <ArrowRightCircle className="h-4 w-4" />
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
      width: '160px',
    },
  ];

  // ---------- Excel Export (unchanged) ----------
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('RCEF With Lackings');

      // 1. DEFINE ALL 13 COLUMNS (A through M)
      worksheet.columns = [
        { key: 'mun', width: 18 },          // A: MUN.
        { key: 'no', width: 6 },            // B: No.
        { key: 'name', width: 55 },         // C: NAME OF FCA
        { key: 'total', width: 12 },        // D: TOTAL NO. OF MEMBERS
        { key: 'area', width: 12 },         // E: Area (ha)
        { key: 'address', width: 25 },      // F: ADDRESS
        { key: 'head', width: 25 },         // G: HEAD OF ORGANIZATION
        { key: 'contactNo', width: 15 },    // H: CONTACT NO.
        { key: 'dateRec', width: 15 },      // I: DATE RECEIVED
        { key: 'program', width: 15 },      // J: RCEF PROGRAM
        { key: 'intervention', width: 22 }, // K: TYPE OF INTERVENTION
        { key: 'status', width: 15 },       // L: STATUS
        { key: 'remarks', width: 20 },      // M: REMARKS
      ];

      // 2. TOP TITLE ROWS WITH LEGEND
      const titleRows = [
        ['LIST OF FARMERS COOPERATIVE/ASSOCIATION WITH LACKING DOCUMENTS'],
        ['REGION: MIMAROPA'],
        ['Legend: Note: * No Letter of Intent, ** No Endorsement Letter, *** No OSS, **** No copy of reg. ***** Farmers Profile (Area)'],
        ['']
      ];

      titleRows.forEach((val, index) => {
        const rowNum = index + 1;
        worksheet.getRow(rowNum).values = val;
        worksheet.mergeCells(`A${rowNum}:M${rowNum}`);
        const cell = worksheet.getCell(`A${rowNum}`);
        
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Times New Roman', size: 11, bold: true };
        
        if (rowNum === 2) {
          cell.value = {
            richText: [
              { font: { name: 'Times New Roman', bold: true }, text: 'REGION: ' },
              { font: { name: 'Times New Roman', color: { argb: 'FFFF0000' }, bold: true }, text: 'MIMAROPA' }
            ]
          };
        }

        if (rowNum === 3) {
           cell.alignment = { horizontal: 'left', vertical: 'middle' };
           cell.font = { name: 'Times New Roman', size: 10, italic: true };
           cell.value = {
              richText: [
                { font: { name: 'Times New Roman', size: 10, bold: true, italic: true }, text: 'Legend: ' },
                { font: { name: 'Times New Roman', size: 10, italic: true }, text: 'Note: * No Letter of Intent, ** No Endorsement Letter, *** No OSS, **** No copy of reg. ***** Farmers Profile (Area)' }
              ]
           };
        }
      });

      // 3. TABLE HEADERS (ROW 5)
      const headerRow = worksheet.getRow(5);
      headerRow.values = [
        'MUN.', 'No.', 'NAME OF FCA', 'TOTAL NO.\nOF\nMEMBERS', 'Area (ha)', 'ADDRESS', 
        'HEAD OF ORGANIZATION', 'CONTACT NO.', 'DATE\nRECEIVED', 'RCEF\nPROGRAM', 
        'TYPE OF\nINTERVENTION', 'STATUS', 'REMARKS'
      ];
      
      headerRow.height = 45;

      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, size: 9, name: 'Times New Roman' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      // 4. HELPER FUNCTION FOR PROVINCE ROW
      const addProvinceRow = (name) => {
        const row = worksheet.addRow([name.toUpperCase()]);
        worksheet.mergeCells(`A${row.number}:M${row.number}`);
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
          cell.font = { bold: true, name: 'Times New Roman' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      };

      // 5. DATA ROWS: Group by province then municipality
      const grouped = {};
      data.forEach(item => {
        const prov = normalizeProvince(item.province) || 'Unknown';
        const mun = item.municipality || 'Unknown';

        if (!grouped[prov]) {
          grouped[prov] = { municipalities: {} };
        }
        if (!grouped[prov].municipalities[mun]) {
          grouped[prov].municipalities[mun] = [];
        }
        grouped[prov].municipalities[mun].push(item);
      });

      const sortedProvinces = Object.keys(grouped).sort((a, b) => {
        const order = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Palawan', 'Romblon'];
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      sortedProvinces.forEach(prov => {
        addProvinceRow(prov);

        const munObj = grouped[prov].municipalities;
        const sortedMunicipalities = Object.keys(munObj).sort();

        sortedMunicipalities.forEach(mun => {
          // Add municipality as bold italic row (like in screenshot)
          const munRow = worksheet.addRow([mun]);
          worksheet.mergeCells(`A${munRow.number}:M${munRow.number}`);
          munRow.eachCell(cell => {
            cell.font = { name: 'Times New Roman', size: 10, bold: true, italic: true };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });

          const sortedItems = [...munObj[mun]].sort((a, b) => {
            const numA = parseInt(a.no, 10) || 0;
            const numB = parseInt(b.no, 10) || 0;
            return numA - numB;
          });

          let seqNo = 1;

          sortedItems.forEach(item => {
            // Determine status based on remarks (e.g., if name contains *, **, etc.)
            let status = '';
            if (item.name?.includes('*****')) status = '*****';
            else if (item.name?.includes('****')) status = '****';
            else if (item.name?.includes('***')) status = '***';
            else if (item.name?.includes('**')) status = '**';
            else if (item.name?.includes('*')) status = '*';
            
            const row = worksheet.addRow([
              '',
              seqNo++,
              item.name || '',
              item.total_members || '',
              item.area_covered || '',
              item.address || '',
              item.contact_person || '',
              item.contact_no || '',
              item.date_received || '',
              item.program || '',
              item.partner_agency || '',
              status,
              item.remarks || ''
            ]);

            row.eachCell((cell, colNumber) => {
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
              cell.font = { name: 'Times New Roman', size: 10 };
              cell.alignment = { vertical: 'middle', wrapText: true };
            });

            [2, 4, 5, 8, 9, 10, 11, 12, 13].forEach(col => {
              const cell = row.getCell(col);
              if (cell) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            });
          });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'RCEF_With_Lackings.xlsx');
      setSuccess('Export Complete!');
    } catch (err) {
      console.error(err);
      setError('Error exporting to Excel');
    }
  };

  // ---------- Input Change Handler ----------
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">RCEF Records with Lacking Documents</h1>
            <p className="text-gray-600 mt-2">
              Farmers cooperatives and associations with incomplete requirements
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-4 py-2.5 bg-yellow-500 text-black font-semibold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors"
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
        <div className="bg-amber-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Records</p>
              <p className="text-3xl font-bold mt-2">{stats.totalAssociations}</p>
            </div>
            <FileText className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-amber-400">
            <p className="text-amber-100 text-sm">{stats.provinces} provinces</p>
          </div>
        </div>

        <div className="bg-blue-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold mt-2">{stats.totalMembers.toLocaleString()}</p>
            </div>
            <Users className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-blue-100 text-sm">Across all records</p>
          </div>
        </div>

        <div className="bg-purple-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Area Covered</p>
              <p className="text-3xl font-bold mt-2">{stats.totalArea} ha</p>
            </div>
            <MapPin className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-purple-100 text-sm">Total agricultural area</p>
          </div>
        </div>

        <div className="bg-green-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Programs</p>
              <p className="text-xl font-bold mt-2">Seeds: {stats.seedCount}</p>
              <p className="text-xl font-bold">Mech: {stats.mechCount}</p>
            </div>
            <Building className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-green-100 text-sm">By intervention type</p>
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
                placeholder="Search by name, contact, province, municipality..."
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
              onChange={(e) => setFilters(prev => ({ ...prev, province: e.target.value }))}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Provinces</option>
              {provinceOptions.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>

            {/* Year filter dropdown */}
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
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
          onRowClicked={handleView}
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
              },
            },
            rows: {
              style: {
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer',
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
              <span>RCEF Lacking Documents Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{data.length} Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- EDIT MODAL ---------- */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Record"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No.</label>
              <input
                type="text"
                name="no"
                value={editForm.no || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Members</label>
              <input
                type="number"
                name="total_members"
                value={editForm.total_members || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Covered (ha)</label>
              <input
                type="text"
                name="area_covered"
                value={editForm.area_covered || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={editForm.address || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="contact_person"
                value={editForm.contact_person || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
              <input
                type="text"
                name="contact_no"
                value={editForm.contact_no || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
              <input
                type="text"
                name="date_received"
                value={editForm.date_received || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <input
                type="text"
                name="program"
                value={editForm.program || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner Agency</label>
              <input
                type="text"
                name="partner_agency"
                value={editForm.partner_agency || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                name="remarks"
                value={editForm.remarks || ''}
                onChange={handleEditChange}
                rows="3"
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
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- VIEW MODAL ---------- */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Record Details"
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApplication.name || 'Unnamed Association'}
                  </h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      No. {selectedApplication.no || '—'}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {normalizeProvince(selectedApplication.province)}
                    </span>
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
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium text-black">{selectedApplication.contact_no || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-black">{selectedApplication.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Location & Membership
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Province / Municipality</p>
                    <p className="font-medium text-black">{normalizeProvince(selectedApplication.province)} • {selectedApplication.municipality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Members</p>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      <p className="font-medium text-black">Total: {selectedApplication.total_members || 0}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Area Covered</p>
                    <p className="font-medium text-black">{selectedApplication.area_covered || 0} ha</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Date Received</p>
                    <p className="font-medium text-black">{formatDate(selectedApplication.date_received)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Program</p>
                    <p className="font-medium text-black">{selectedApplication.program || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Partner Agency</p>
                    <p className="font-medium text-black">{selectedApplication.partner_agency || '—'}</p>
                  </div>
                </div>
              </div>

              {selectedApplication.remarks && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 md:col-span-2">
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
                Edit
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openRestoreModal(selectedApplication);
                }}
                className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors"
              >
                <ArrowRightCircle className="h-4 w-4 inline mr-2" />
                Restore to Accredited
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteModal(selectedApplication);
                }}
                className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline mr-2" />
                Delete
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Record</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the record for{' '}
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

      {/* ---------- RESTORE MODAL ---------- */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore to Accredited"
        size="sm"
      >
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Move this application to the accredited list. Please provide the accreditation and
            expiration dates.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Accredited *
              </label>
              <input
                type="date"
                value={restoreDates.date_accredited}
                onChange={(e) =>
                  setRestoreDates({ ...restoreDates, date_accredited: e.target.value })
                }
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Expiration *
              </label>
              <input
                type="date"
                value={restoreDates.date_expiration}
                onChange={(e) =>
                  setRestoreDates({ ...restoreDates, date_expiration: e.target.value })
                }
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowRestoreModal(false);
                setRestoreDates({ date_accredited: '', date_expiration: '' });
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRestore}
              className="px-6 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Restore to Accredited
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RcefWithLackings;