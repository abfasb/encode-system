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
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { db } from '../../../config/firebase';

// ---------- Constants ----------
const MIMAROPA_PROVINCES = [
  'Occidental Mindoro',
  'Oriental Mindoro',
  'Marinduque',
  'Palawan',
  'Romblon'
];

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

// ---------- Helper: Extract year from date string ----------
const getYearFromDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.getFullYear();
};

// ---------- Helper: Normalize string (trim, title case) ----------
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ---------- Helper: Normalize province name to title case ----------
const normalizeProvince = (prov) => normalizeString(prov);

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

// ---------- Main Component ----------
const RcefAccredited = () => {
  // ---------- State ----------
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // CRUD States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState({
    province: MIMAROPA_PROVINCES[0],
    municipality: '',
    name: '',
    date_accredited: '',
    date_expiration: '',
    date_application_received: '',
    type_fca: '',
    male_members: '',
    female_members: '',
    total_members: '',
    area_covered: '',
    address: '',
    contact_person: '',
    contact_no: '',
    remarks: '',
    certificate_of_accreditation: '',
    submitted_documents: '',
    interventions: {
      seeds: false,
      mech: false,
      credit: false,
      extn: false
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    province: 'all',
    accreditedYear: 'all',
    expirationYear: 'all'
  });

  // ---------- Data Fetching ----------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const querySnapshot = await getDocs(collection(db, 'rcef'));
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

  // ---------- Grouping Logic (with normalization) ----------
  const groupedData = useMemo(() => {
    // First, apply filters to original data
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

    if (filters.accreditedYear !== 'all') {
      filtered = filtered.filter(item => {
        const year = getYearFromDate(item.date_accredited);
        return year === parseInt(filters.accreditedYear, 10);
      });
    }

    if (filters.expirationYear !== 'all') {
      filtered = filtered.filter(item => {
        const year = getYearFromDate(item.date_expiration);
        return year === parseInt(filters.expirationYear, 10);
      });
    }

    // Group by normalized name + province + municipality
    const groups = new Map();
    filtered.forEach(item => {
      const normalizedName = normalizeString(item.name);
      const normalizedProv = normalizeProvince(item.province);
      const normalizedMun = normalizeString(item.municipality);
      const key = `${normalizedName}|${normalizedProv}|${normalizedMun}`;
      if (!groups.has(key)) {
        groups.set(key, {
          id: key, // composite key
          name: normalizedName,
          province: normalizedProv,
          municipality: normalizedMun,
          // Aggregated fields
          contact_person: null,
          contact_no: null,
          male_members: 0,
          female_members: 0,
          total_members: 0,
          area_covered: 0,
          type_fca: new Set(),
          interventions: { seeds: false, mech: false, credit: false, extn: false },
          certificates: new Set(),
          documents: new Set(),
          remarks: new Set(),
          records: [] // store original records
        });
      }
      const group = groups.get(key);
      group.records.push(item);

      // Sum numeric fields
      group.male_members += item.male_members || 0;
      group.female_members += item.female_members || 0;
      group.total_members += item.total_members || 0;
      group.area_covered += parseFloat(item.area_covered) || 0;

      // Type
      if (item.type_fca) group.type_fca.add(item.type_fca);

      // Interventions (OR)
      if (item.interventions) {
        group.interventions.seeds = group.interventions.seeds || item.interventions.seeds;
        group.interventions.mech = group.interventions.mech || item.interventions.mech;
        group.interventions.credit = group.interventions.credit || item.interventions.credit;
        group.interventions.extn = group.interventions.extn || item.interventions.extn;
      }

      // Contact info – take the latest (by date_accredited)
      if (item.contact_person) group.contact_person = item.contact_person;
      if (item.contact_no) group.contact_no = item.contact_no;

      // Certificates, documents, remarks
      if (item.certificate_of_accreditation) group.certificates.add(item.certificate_of_accreditation);
      if (item.submitted_documents) group.documents.add(item.submitted_documents);
      if (item.remarks) group.remarks.add(item.remarks);
    });

    // Convert sets to strings for display
    const result = Array.from(groups.values()).map(group => {
      // Sort records by date_accredited descending (most recent first)
      const sortedRecords = [...group.records].sort((a, b) => {
        const dateA = a.date_accredited ? new Date(a.date_accredited) : new Date(0);
        const dateB = b.date_accredited ? new Date(b.date_accredited) : new Date(0);
        return dateB - dateA;
      });
      return {
        ...group,
        records: sortedRecords,
        type_fca: Array.from(group.type_fca).join(', ') || '—',
        certificates: Array.from(group.certificates).join(', ') || '—',
        documents: Array.from(group.documents).join(', ') || '—',
        remarks: Array.from(group.remarks).join(', ') || '—',
      };
    });

    // Sort groups by name
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [data, searchTerm, filters]);

  // ---------- Stats (based on original data) ----------
  const stats = useMemo(() => {
    const totalAssociations = data.length;
    const totalMale = data.reduce((acc, item) => acc + (item.male_members || 0), 0);
    const totalFemale = data.reduce((acc, item) => acc + (item.female_members || 0), 0);
    const totalMembers = data.reduce((acc, item) => acc + (item.total_members || 0), 0);
    const totalArea = data.reduce((acc, item) => acc + (parseFloat(item.area_covered) || 0), 0).toFixed(2);
    const provinces = [...new Set(data.map(item => normalizeProvince(item.province)).filter(Boolean))].length;
    const withSeeds = data.filter(item => item.interventions?.seeds).length;
    const withMech = data.filter(item => item.interventions?.mech).length;

    return {
      totalAssociations,
      totalMale,
      totalFemale,
      totalMembers,
      totalArea,
      provinces,
      withSeeds,
      withMech
    };
  }, [data]);

  // ---------- Filter options (from original data) ----------
  const provinceOptions = useMemo(() => {
    const normSet = new Set();
    data.forEach(item => {
      if (item.province) {
        normSet.add(normalizeProvince(item.province));
      }
    });
    const mimaropaOrder = [...MIMAROPA_PROVINCES];
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

  const accreditedYearOptions = useMemo(() => {
    const years = data
      .map(item => getYearFromDate(item.date_accredited))
      .filter(year => year !== null)
      .sort((a, b) => b - a);
    return [...new Set(years)];
  }, [data]);

  const expirationYearOptions = useMemo(() => {
    const years = data
      .map(item => getYearFromDate(item.date_expiration))
      .filter(year => year !== null)
      .sort((a, b) => b - a);
    return [...new Set(years)];
  }, [data]);

  // ---------- Auto‑increment number ----------
  const getNextSequenceNumber = async (province, municipality) => {
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
      console.error('Error getting next sequence number:', error);
      return '1';
    }
  };

  // ---------- CRUD Helpers ----------
  const findFullCsoByRcefId = async (rcefId) => {
    const q = query(collection(db, 'fullcso-farmers'), where('rcefId', '==', rcefId), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  };

  // Edit a single record (opens modal)
  const handleEdit = (record) => {
    setSelectedApplication(record);
    setEditForm(record);
    setShowEditModal(true);
  };

  // Delete a single record
  const handleDelete = async (id, name) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'rcef', id));

      const fullCsoDoc = await findFullCsoByRcefId(id);
      if (fullCsoDoc) {
        await deleteDoc(doc(db, 'fullcso-farmers', fullCsoDoc.id));
      }

      setData(data.filter(item => item.id !== id));
      setSuccess(`Application "${name}" deleted successfully.`);
      setShowDeleteModal(false);
      setSelectedApplication(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Delete error: ', error);
      setError('Failed to delete record. Please try again.');
    }
  };

  // Delete entire group (all records with same name/province/municipality)
  const handleDeleteGroup = async (group) => {
    if (!group.records || group.records.length === 0) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ALL ${group.records.length} accreditation records for "${group.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      // Delete each record in the group
      for (const record of group.records) {
        await deleteDoc(doc(db, 'rcef', record.id));
        const fullCsoDoc = await findFullCsoByRcefId(record.id);
        if (fullCsoDoc) {
          await deleteDoc(doc(db, 'fullcso-farmers', fullCsoDoc.id));
        }
      }
      setData(data.filter(item => !group.records.some(r => r.id === item.id)));
      setSuccess(`All records for "${group.name}" deleted successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Group delete error: ', error);
      setError('Failed to delete group. Please try again.');
    }
  };

  const handleUpdate = async () => {
    try {
      const rcefRef = doc(db, 'rcef', selectedApplication.id);
      await updateDoc(rcefRef, editForm);

      const fullCsoDoc = await findFullCsoByRcefId(selectedApplication.id);
      if (fullCsoDoc) {
        const fullCsoRef = doc(db, 'fullcso-farmers', fullCsoDoc.id);
        const { id, rcefId, source, ...updateData } = editForm;
        await updateDoc(fullCsoRef, updateData);
      }

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

  const handleCreate = async () => {
    try {
      if (!createForm.name) {
        setError('Association name is required.');
        return;
      }
      if (!createForm.province || !createForm.municipality) {
        setError('Province and municipality are required.');
        return;
      }

      const nextNo = await getNextSequenceNumber(createForm.province, createForm.municipality);

      const newRecord = {
        ...createForm,
        no: nextNo,
        male_members: Number(createForm.male_members) || 0,
        female_members: Number(createForm.female_members) || 0,
        total_members: Number(createForm.total_members) || 0,
        area_covered: createForm.area_covered || '',
      };

      const rcefDocRef = await addDoc(collection(db, 'rcef'), newRecord);
      const rcefId = rcefDocRef.id;

      const fullCsoRecord = {
        ...newRecord,
        source: 'rcef',
        rcefId: rcefId,
      };
      await addDoc(collection(db, 'fullcso-farmers'), fullCsoRecord);

      setData([...data, { id: rcefId, ...newRecord }]);
      setSuccess(`Application "${createForm.name}" created successfully.`);
      setShowCreateModal(false);
      setCreateForm({
        province: MIMAROPA_PROVINCES[0],
        municipality: '',
        name: '',
        date_accredited: '',
        date_expiration: '',
        date_application_received: '',
        type_fca: '',
        male_members: '',
        female_members: '',
        total_members: '',
        area_covered: '',
        address: '',
        contact_person: '',
        contact_no: '',
        remarks: '',
        certificate_of_accreditation: '',
        submitted_documents: '',
        interventions: { seeds: false, mech: false, credit: false, extn: false }
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Create error: ', error);
      setError('Failed to create record. Please try again.');
    }
  };

  const openDeleteModal = (record) => {
    setSelectedApplication(record);
    setShowDeleteModal(true);
  };

  const handleView = (row) => {
    setSelectedApplication(row);
    setShowViewModal(true);
  };

  // ---------- Expandable Row Component ----------
  const ExpandedComponent = ({ data: group }) => {
    const records = group.records;
    return (
      <div className="p-4 bg-gray-50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Accreditation Period</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interventions</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
                    <div>Acc: {formatDate(record.date_accredited)}</div>
                    <div>Exp: {formatDate(record.date_expiration)}</div>
                  </td>
                  <td className="px-4 py-2 text-sm">{record.type_fca || '—'}</td>
                  <td className="px-4 py-2 text-sm">
                    M: {record.male_members || 0} | F: {record.female_members || 0} | T: {record.total_members || 0}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex space-x-1">
                      {record.interventions?.seeds && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">S</span>}
                      {record.interventions?.mech && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">M</span>}
                      {record.interventions?.credit && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">C</span>}
                      {record.interventions?.extn && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">E</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApplication(record);
                          setEditForm(record);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Edit this accreditation"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(record)}
                        className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete this accreditation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------- Table Columns (for grouped rows) ----------
  const columns = [
    {
      name: 'Association',
      selector: row => row.name,
      sortable: true,
      wrap: true,
      cell: row => (
        <div>
          <div className="font-semibold text-gray-900">{row.name || '—'}</div>
          <div className="text-xs text-gray-500">{row.province} • {row.municipality}</div>
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
          {row.total_members}
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
      name: 'Type',
      selector: row => row.type_fca,
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.type_fca || '—'}
        </span>
      )
    },
    {
      name: 'Interventions',
      cell: row => (
        <div className="flex space-x-1">
          {row.interventions.seeds && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">S</span>}
          {row.interventions.mech && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">M</span>}
          {row.interventions.credit && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">C</span>}
          {row.interventions.extn && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">E</span>}
        </div>
      )
    },
    {
      name: 'Accreditation Periods',
      cell: row => (
        <div className="text-xs space-y-1">
          {row.records.map(record => (
            <div key={record.id}>
              {formatDate(record.date_accredited)} → {formatDate(record.date_expiration)}
            </div>
          ))}
        </div>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Edit the most recent record in the group
              const latestRecord = row.records[0];
              setSelectedApplication(latestRecord);
              setEditForm(latestRecord);
              setShowEditModal(true);
            }}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit latest accreditation"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteGroup(row);
            }}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete all records for this association"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
            }}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px',
    },
  ];

  // ---------- Export to Excel (unchanged) ----------
  const exportToExcel = async () => {
    // (same as before, unchanged)
    try {
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
        ['As of March 2026'],
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

      // Group original data for export (not grouped)
      const grouped = {};
      data.forEach(item => {
        const prov = normalizeProvince(item.province) || 'Unknown';
        const mun = normalizeString(item.municipality) || 'Unknown';
        if (!grouped[prov]) {
          grouped[prov] = {
            originalName: prov,
            municipalities: {}
          };
        }
        if (!grouped[prov].municipalities[mun]) {
          grouped[prov].municipalities[mun] = [];
        }
        grouped[prov].municipalities[mun].push(item);
      });

      const sortedProvinces = Object.keys(grouped).sort((a, b) => {
        const order = [...MIMAROPA_PROVINCES];
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
          addMunicipalityRow(mun);

          const sortedItems = [...munObj[mun]].sort((a, b) => {
            const numA = parseInt(a.no, 10) || 0;
            const numB = parseInt(b.no, 10) || 0;
            return numA - numB;
          });

          let seqNo = 1;

          sortedItems.forEach(item => {
            const row = worksheet.addRow([
              '',
              seqNo++,
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

            [2, 4, 5, 6, 8, 9, 10, 11, 15, 16, 17, 18].forEach(col => {
              const cell = row.getCell(col);
              if (cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });
          });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'Accredited_RCEF_MIMAROPA.xlsx');
      setSuccess('Export Complete!');
    } catch (err) {
      console.error(err);
      setError('Error exporting to Excel');
    }
  };

  // ---------- Form handlers ----------
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('interventions.')) {
      const intervention = name.split('.')[1];
      setEditForm(prev => ({
        ...prev,
        interventions: {
          ...(prev.interventions || {}),
          [intervention]: checked
        }
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('interventions.')) {
      const intervention = name.split('.')[1];
      setCreateForm(prev => ({
        ...prev,
        interventions: {
          ...(prev.interventions || {}),
          [intervention]: checked
        }
      }));
    } else {
      setCreateForm(prev => ({ ...prev, [name]: value }));
    }
  };

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

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">RCEF Accredited CSO Farmers</h1>
            <p className="text-gray-600 mt-2">
              Farmers cooperatives and associations accredited under RCEF
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New
            </button>

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
            <p className="text-amber-100 text-sm">Male: {stats.totalMale} | Female: {stats.totalFemale}</p>
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
              <p className="text-green-100 text-sm font-medium">Interventions</p>
              <p className="text-xl font-bold mt-2">Seeds: {stats.withSeeds}</p>
              <p className="text-xl font-bold">Mech: {stats.withMech}</p>
            </div>
            <Building className="h-12 w-12 opacity-80" />
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <p className="text-green-100 text-sm">Associations with support</p>
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

            <select
              value={filters.accreditedYear}
              onChange={(e) => setFilters(prev => ({ ...prev, accreditedYear: e.target.value }))}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accredited Years</option>
              {accreditedYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={filters.expirationYear}
              onChange={(e) => setFilters(prev => ({ ...prev, expirationYear: e.target.value }))}
              className="px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Expiration Years</option>
              {expirationYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-gray-600">
            Showing <span className="font-semibold">{groupedData.length}</span> associations (from <span className="font-semibold">{data.length}</span> total accreditation records)
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

      {/* Data Table with Expandable Rows */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={groupedData}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 50, 100]}
          highlightOnHover
          striped
          responsive
          expandableRows
          expandableRowsComponent={ExpandedComponent}
          expandableRowExpanded={row => row.expanded || false}
          onRowClicked={handleView}
          noDataComponent={
            <div className="p-12 text-center">
              <div className="flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No accredited records found</p>
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
              <span>RCEF Accredited Database</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{data.length} Accredited Applications</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- CREATE MODAL (unchanged) ---------- */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Accredited Application"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Province dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
              <select
                name="province"
                value={createForm.province}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {MIMAROPA_PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality *</label>
              <input
                type="text"
                name="municipality"
                value={createForm.municipality}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name of Association *</label>
              <input
                type="text"
                name="name"
                value={createForm.name}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Accredited</label>
              <input
                type="date"
                name="date_accredited"
                value={createForm.date_accredited}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Expiration</label>
              <input
                type="date"
                name="date_expiration"
                value={createForm.date_expiration}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Application Received</label>
              <input
                type="date"
                name="date_application_received"
                value={createForm.date_application_received}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of FCA</label>
              <input
                type="text"
                name="type_fca"
                value={createForm.type_fca}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Members</label>
              <input
                type="number"
                name="male_members"
                value={createForm.male_members}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Members</label>
              <input
                type="number"
                name="female_members"
                value={createForm.female_members}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Members</label>
              <input
                type="number"
                name="total_members"
                value={createForm.total_members}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Covered (ha)</label>
              <input
                type="text"
                name="area_covered"
                value={createForm.area_covered}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={createForm.address}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="contact_person"
                value={createForm.contact_person}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
              <input
                type="text"
                name="contact_no"
                value={createForm.contact_no}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                name="remarks"
                value={createForm.remarks}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate</label>
              <input
                type="text"
                name="certificate_of_accreditation"
                value={createForm.certificate_of_accreditation}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Documents</label>
              <input
                type="text"
                name="submitted_documents"
                value={createForm.submitted_documents}
                onChange={handleCreateChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 text-lg flex items-center">
              <Building className="h-5 w-5 mr-2 text-green-600" />
              Interventions
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <CheckboxField
                name="interventions.seeds"
                label="Seeds"
                checked={createForm.interventions.seeds}
                onChange={handleCreateChange}
              />
              <CheckboxField
                name="interventions.mech"
                label="Mechanization"
                checked={createForm.interventions.mech}
                onChange={handleCreateChange}
              />
              <CheckboxField
                name="interventions.credit"
                label="Credit"
                checked={createForm.interventions.credit}
                onChange={handleCreateChange}
              />
              <CheckboxField
                name="interventions.extn"
                label="Extension"
                checked={createForm.interventions.extn}
                onChange={handleCreateChange}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:bg-green-700 transition-colors"
            >
              Create Application
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- EDIT MODAL ---------- */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Accredited Application"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <select
                name="province"
                value={editForm.province || MIMAROPA_PROVINCES[0]}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MIMAROPA_PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Accredited</label>
              <input
                type="date"
                name="date_accredited"
                value={editForm.date_accredited || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Expiration</label>
              <input
                type="date"
                name="date_expiration"
                value={editForm.date_expiration || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Application Received</label>
              <input
                type="date"
                name="date_application_received"
                value={editForm.date_application_received || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of FCA</label>
              <input
                type="text"
                name="type_fca"
                value={editForm.type_fca || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Members</label>
              <input
                type="number"
                name="male_members"
                value={editForm.male_members || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Members</label>
              <input
                type="number"
                name="female_members"
                value={editForm.female_members || ''}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                name="remarks"
                value={editForm.remarks || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate</label>
              <input
                type="text"
                name="certificate_of_accreditation"
                value={editForm.certificate_of_accreditation || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Documents</label>
              <input
                type="text"
                name="submitted_documents"
                value={editForm.submitted_documents || ''}
                onChange={handleEditChange}
                className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 text-lg flex items-center">
              <Building className="h-5 w-5 mr-2 text-green-600" />
              Interventions
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <CheckboxField
                name="interventions.seeds"
                label="Seeds"
                checked={editForm.interventions?.seeds || false}
                onChange={handleEditChange}
              />
              <CheckboxField
                name="interventions.mech"
                label="Mechanization"
                checked={editForm.interventions?.mech || false}
                onChange={handleEditChange}
              />
              <CheckboxField
                name="interventions.credit"
                label="Credit"
                checked={editForm.interventions?.credit || false}
                onChange={handleEditChange}
              />
              <CheckboxField
                name="interventions.extn"
                label="Extension"
                checked={editForm.interventions?.extn || false}
                onChange={handleEditChange}
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
              Update Application
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- VIEW MODAL (shows group details) ---------- */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Accredited Application Details"
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div className="bg-amber-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApplication.name || 'Unnamed Association'}
                  </h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedApplication.province}
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedApplication.type_fca || '—'}
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
                    <p className="font-medium text-black">{selectedApplication.province} • {selectedApplication.municipality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Members (Total aggregated)</p>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      <p className="font-medium text-black">
                        Male: {selectedApplication.male_members || 0} | Female: {selectedApplication.female_members || 0} | Total: {selectedApplication.total_members || 0}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Area Covered (aggregated)</p>
                    <p className="font-medium text-black">{selectedApplication.area_covered || 0} ha</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Accreditation History</h3>
                <div className="space-y-2">
                  {selectedApplication.records?.map(record => (
                    <div key={record.id} className="border-b border-gray-100 pb-2">
                      <div className="flex justify-between text-sm">
                        <span>Accredited: {formatDate(record.date_accredited)}</span>
                        <span>Expires: {formatDate(record.date_expiration)}</span>
                      </div>
                      {record.type_fca && <div className="text-xs text-gray-500">Type: {record.type_fca}</div>}
                    </div>
                  ))}
                  {(!selectedApplication.records || selectedApplication.records.length === 0) && (
                    <p className="text-gray-500">No accreditation periods found.</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interventions</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.interventions?.seeds && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Seeds</span>
                  )}
                  {selectedApplication.interventions?.mech && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Mechanization</span>
                  )}
                  {selectedApplication.interventions?.credit && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Credit</span>
                  )}
                  {selectedApplication.interventions?.extn && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">Extension</span>
                  )}
                  {!selectedApplication.interventions?.seeds && !selectedApplication.interventions?.mech &&
                   !selectedApplication.interventions?.credit && !selectedApplication.interventions?.extn && (
                    <p className="text-gray-500">None</p>
                  )}
                </div>
              </div>

              {selectedApplication.remarks && selectedApplication.remarks !== '—' && (
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-line">{selectedApplication.remarks}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              {/* Actions left empty as they are handled elsewhere */}
            </div>
          </div>
        )}
      </Modal>

      {/* ---------- DELETE MODAL (for individual records) ---------- */}
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Accreditation Record</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the accreditation for{' '}
            <span className="font-semibold">{selectedApplication?.name}</span> with date {selectedApplication?.date_accredited ? formatDate(selectedApplication.date_accredited) : ''}? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(selectedApplication.id, selectedApplication.name)}
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

export default RcefAccredited;