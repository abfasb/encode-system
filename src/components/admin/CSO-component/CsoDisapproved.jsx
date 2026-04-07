import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
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
  MapPin,
  User,
  RefreshCw,
  ThumbsDown,
  Save
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- Helper: Format date ----------
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper: Convert Firestore Timestamp to YYYY-MM-DD string for input
const timestampToDateString = (timestamp) => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split('T')[0];
  }
  if (typeof timestamp === 'string') return timestamp;
  return '';
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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortField === column.key && (
                      <span className="ml-1 text-amber-600">
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
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-200 border-t-amber-600"></div>
                  </div>
                  <p className="mt-4 text-gray-500 font-medium">Loading disapproved records...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-amber-50 rounded-full mb-4">
                      <ThumbsDown className="h-12 w-12 text-amber-400" />
                    </div>
                    <p className="text-gray-700 text-lg font-semibold">No disapproved records found</p>
                    <p className="text-gray-400 mt-1">All applications are either approved or pending</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <motion.tr
                  key={row.flattenedId || row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-amber-50/30 transition-all cursor-pointer"
                  onClick={(e) => handleRowClick(row, e)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={pagination.rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="rounded-lg border border-gray-300 text-gray-700 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {[5, 10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            <span className="text-sm text-gray-700">
              Showing <span className="font-semibold">{pagination.startIndex + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.endIndex, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> entries
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronsLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
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
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      pagination.currentPage === pageNum
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
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
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronsRight className="h-4 w-4 text-gray-700" />
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full mx-4 border border-white/50 ${sizeClasses[size]}`}
        >
          <div className="sticky top-0 bg-white/80 backdrop-blur-sm rounded-t-2xl px-6 py-5 border-b border-gray-200/80 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ---------- Disapproved Form Component (manages its own state to prevent focus loss) ----------
const DisapprovedForm = ({ initialData, onSave, onCancel, isSaving, isEdit }) => {
  const [formData, setFormData] = useState(() => ({
    no: initialData?.no || '',
    name_of_association: initialData?.name_of_association || '',
    contact_person: initialData?.contact_person || '',
    position: initialData?.position || '',
    contact_number: initialData?.contact_number || '',
    email_address: initialData?.email_address || '',
    no_of_members: initialData?.no_of_members || '',
    address: initialData?.address || '',
    province: initialData?.province || '',
    scope: initialData?.scope || 'Regional',
    nature_of_services: initialData?.nature_of_services || '',
    reason_for_disapproval: initialData?.reason_for_disapproval || '',
    date_of_receipt: initialData?.date_of_receipt || '',
    remarks: initialData?.remarks || '',
    for_deliberation: initialData?.for_deliberation || false,
    documentary_requirements: initialData?.documentary_requirements || {},
    process: initialData?.process || {}
  }));

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="form_no" className="block text-sm font-medium text-gray-700">No.</label>
            <input
              id="form_no"
              type="number"
              value={formData.no}
              onChange={handleChange('no')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_name" className="block text-sm font-medium text-gray-700">Name of Association <span className="text-red-500">*</span></label>
            <input
              id="form_name"
              type="text"
              value={formData.name_of_association}
              onChange={handleChange('name_of_association')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_contact_person" className="block text-sm font-medium text-gray-700">Contact Person</label>
            <input
              id="form_contact_person"
              type="text"
              value={formData.contact_person}
              onChange={handleChange('contact_person')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_position" className="block text-sm font-medium text-gray-700">Position</label>
            <input
              id="form_position"
              type="text"
              value={formData.position}
              onChange={handleChange('position')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_contact_number" className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              id="form_contact_number"
              type="text"
              value={formData.contact_number}
              onChange={handleChange('contact_number')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              id="form_email"
              type="email"
              value={formData.email_address}
              onChange={handleChange('email_address')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_members" className="block text-sm font-medium text-gray-700">Number of Members</label>
            <input
              id="form_members"
              type="text"
              value={formData.no_of_members}
              onChange={handleChange('no_of_members')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="form_address" className="block text-sm font-medium text-gray-700">Address</label>
            <input
              id="form_address"
              type="text"
              value={formData.address}
              onChange={handleChange('address')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_province" className="block text-sm font-medium text-gray-700">Province <span className="text-red-500">*</span></label>
            <input
              id="form_province"
              type="text"
              value={formData.province}
              onChange={handleChange('province')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_scope" className="block text-sm font-medium text-gray-700">Scope</label>
            <select
              id="form_scope"
              value={formData.scope}
              onChange={handleChange('scope')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            >
              <option value="Regional">Regional</option>
              <option value="National">National</option>
              <option value="Local">Local</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_services" className="block text-sm font-medium text-gray-700">Nature of Services</label>
            <textarea
              id="form_services"
              rows={2}
              value={formData.nature_of_services}
              onChange={handleChange('nature_of_services')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_reason" className="block text-sm font-medium text-gray-700">Reason for Disapproval</label>
            <textarea
              id="form_reason"
              rows={3}
              value={formData.reason_for_disapproval}
              onChange={handleChange('reason_for_disapproval')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_date" className="block text-sm font-medium text-gray-700">Date of Receipt</label>
            <input
              id="form_date"
              type="date"
              value={formData.date_of_receipt}
              onChange={handleChange('date_of_receipt')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="form_remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
            <input
              id="form_remarks"
              type="text"
              value={formData.remarks}
              onChange={handleChange('remarks')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-xl hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50 flex items-center"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Update Record' : 'Add Record'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ---------- Main Component ----------
const CsoDisapproved = () => {
  const [disapprovedData, setDisapprovedData] = useState([]);
  const [provinceDocs, setProvinceDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ scope: 'all', province: 'all' });
  const [sortConfig, setSortConfig] = useState({ field: 'no', direction: 'asc' });
  const [pagination, setPagination] = useState({ currentPage: 1, rowsPerPage: 10, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, byProvince: {}, topReason: '' });

  // Helper: Build clean association object from formData
  const buildAssociationObject = useCallback((formData) => ({
    no: formData.no ? String(formData.no) : '',
    basic_information: {
      name_of_association: formData.name_of_association || '',
      contact_person: formData.contact_person || '',
      position: formData.position || '',
      contact_number: formData.contact_number || '',
      email_address: formData.email_address || '',
      no_of_members: formData.no_of_members || '',
      address: formData.address || ''
    },
    nature_of_services: formData.nature_of_services || '',
    reason_for_disapproval: formData.reason_for_disapproval || '',
    scope: formData.scope || 'Regional',
    date_of_receipt: formData.date_of_receipt || '',
    remarks: formData.remarks || '',
    for_deliberation: formData.for_deliberation || false,
    documentary_requirements: formData.documentary_requirements || {},
    process: formData.process || {}
  }), []);

  // Fetch disapproved records
  const fetchDisapprovedData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const disapprovedCollection = collection(db, 'cso-disapproved');
      const querySnapshot = await getDocs(disapprovedCollection);
      const provinceDocsArray = [];
      const flattened = [];

      querySnapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        provinceDocsArray.push({ id: docSnap.id, ...docData });
        if (docData.associations && Array.isArray(docData.associations)) {
          const provinceName = docData.province || 'Unknown';
          docData.associations.forEach((assoc, index) => {
            const basic = assoc.basic_information || {};
            flattened.push({
              flattenedId: `${docSnap.id}_${index}`,
              provinceDocId: docSnap.id,
              associationIndex: index,
              province: provinceName,
              no: assoc.no,
              name_of_association: basic.name_of_association,
              contact_person: basic.contact_person,
              position: basic.position,
              contact_number: basic.contact_number,
              email_address: basic.email_address,
              no_of_members: basic.no_of_members,
              address: basic.address,
              scope: assoc.scope,
              nature_of_services: assoc.nature_of_services,
              reason_for_disapproval: assoc.reason_for_disapproval,
              date_of_receipt: timestampToDateString(assoc.date_of_receipt),
              remarks: assoc.remarks,
              for_deliberation: assoc.for_deliberation,
              documentary_requirements: assoc.documentary_requirements,
              process: assoc.process
            });
          });
        } else {
          flattened.push({
            flattenedId: docSnap.id,
            provinceDocId: docSnap.id,
            associationIndex: null,
            ...docData,
            date_of_receipt: timestampToDateString(docData.date_of_receipt)
          });
        }
      });

      flattened.sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0));
      setDisapprovedData(flattened);
      setProvinceDocs(provinceDocsArray);

      const total = flattened.length;
      const byProvince = {};
      flattened.forEach(item => { byProvince[item.province || 'Unknown'] = (byProvince[item.province || 'Unknown'] || 0) + 1; });
      const reasonCounts = {};
      flattened.forEach(item => {
        if (item.reason_for_disapproval) {
          const short = item.reason_for_disapproval.substring(0, 30) + '...';
          reasonCounts[short] = (reasonCounts[short] || 0) + 1;
        }
      });
      const topReason = Object.entries(reasonCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
      setStats({ total, byProvince, topReason });
    } catch (err) {
      console.error('Error fetching disapproved CSO data:', err);
      setError('Failed to load disapproved records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisapprovedData(); }, [fetchDisapprovedData]);

  // Handle Add
  const handleAddRecord = async (formData) => {
    try {
      setSaving(true);
      setError('');
      const province = formData.province;
      if (!province) throw new Error('Province is required');
      const newAssociation = buildAssociationObject(formData);
      const existingProvinceDoc = provinceDocs.find(doc => doc.province === province);
      if (existingProvinceDoc) {
        const provinceDocRef = doc(db, 'cso-disapproved', existingProvinceDoc.id);
        const docSnap = await getDoc(provinceDocRef);
        const currentAssociations = docSnap.exists() ? (docSnap.data().associations || []) : [];
        await updateDoc(provinceDocRef, { associations: [...currentAssociations, newAssociation], updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'cso-disapproved'), { province, associations: [newAssociation], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      setSuccess('Disapproved record added successfully!');
      setShowAddModal(false);
      await fetchDisapprovedData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding disapproved record:', err);
      setError('Failed to add record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Update
  const handleUpdateRecord = async (formData) => {
    if (!selectedRecord) return;
    try {
      setSaving(true);
      setError('');
      const { provinceDocId, associationIndex } = selectedRecord;
      const updatedAssociation = buildAssociationObject(formData);
      if (!provinceDocId || associationIndex === null) {
        const cleanData = { ...updatedAssociation };
        delete cleanData.province;
        await updateDoc(doc(db, 'cso-disapproved', provinceDocId), cleanData);
      } else {
        const provinceDocRef = doc(db, 'cso-disapproved', provinceDocId);
        const docSnap = await getDoc(provinceDocRef);
        if (!docSnap.exists()) throw new Error('Province document not found');
        const currentAssociations = docSnap.data().associations || [];
        if (!currentAssociations[associationIndex]) throw new Error('Association not found');
        const updatedAssociations = [...currentAssociations];
        updatedAssociations[associationIndex] = updatedAssociation;
        await updateDoc(provinceDocRef, { associations: updatedAssociations, updatedAt: serverTimestamp() });
      }
      setSuccess('Disapproved record updated successfully!');
      setShowEditModal(false);
      setSelectedRecord(null);
      await fetchDisapprovedData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating disapproved record:', err);
      setError('Failed to update record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handlePermanentDelete = async () => {
    if (!selectedRecord) return;
    try {
      setSaving(true);
      const { provinceDocId, associationIndex } = selectedRecord;
      if (!provinceDocId || associationIndex === null) {
        await deleteDoc(doc(db, 'cso-disapproved', provinceDocId));
      } else {
        const provinceDocRef = doc(db, 'cso-disapproved', provinceDocId);
        const docSnap = await getDoc(provinceDocRef);
        if (docSnap.exists()) {
          const currentAssociations = docSnap.data().associations || [];
          const updatedAssociations = currentAssociations.filter((_, idx) => idx !== associationIndex);
          await updateDoc(provinceDocRef, { associations: updatedAssociations, updatedAt: serverTimestamp() });
        }
      }
      setSuccess(`${selectedRecord.name_of_association || 'Record'} permanently deleted.`);
      setShowDeleteModal(false);
      setSelectedRecord(null);
      await fetchDisapprovedData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error permanently deleting disapproved record:', err);
      setError('Failed to delete record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Restore
  const handleRestore = async () => {
    if (!selectedRecord) return;
    try {
      setSaving(true);
      const { provinceDocId, associationIndex } = selectedRecord;
      const restoredData = {
        no: selectedRecord.no,
        name_of_association: selectedRecord.name_of_association,
        contact_person: selectedRecord.contact_person,
        position: selectedRecord.position,
        contact_number: selectedRecord.contact_number,
        email_address: selectedRecord.email_address,
        no_of_members: selectedRecord.no_of_members,
        address: selectedRecord.address,
        province: selectedRecord.province,
        scope: selectedRecord.scope,
        nature_of_services: selectedRecord.nature_of_services,
        for_deliberation: true,
        restoredFromDisapproved: true,
        restoredAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'cso'), restoredData);
      if (!provinceDocId || associationIndex === null) {
        await deleteDoc(doc(db, 'cso-disapproved', provinceDocId));
      } else {
        const provinceDocRef = doc(db, 'cso-disapproved', provinceDocId);
        const docSnap = await getDoc(provinceDocRef);
        if (docSnap.exists()) {
          const currentAssociations = docSnap.data().associations || [];
          const updatedAssociations = currentAssociations.filter((_, idx) => idx !== associationIndex);
          await updateDoc(provinceDocRef, { associations: updatedAssociations, updatedAt: serverTimestamp() });
        }
      }
      setSuccess(`${selectedRecord.name_of_association} moved back to deliberation.`);
      setShowRestoreModal(false);
      setSelectedRecord(null);
      await fetchDisapprovedData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error restoring disapproved record:', err);
      setError('Failed to restore record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleView = (record) => { setSelectedRecord(record); setShowViewModal(true); };
  const openEditModal = (record) => { setSelectedRecord(record); setShowEditModal(true); };
  const openRestoreModal = (record) => { setSelectedRecord(record); setShowViewModal(false); setShowRestoreModal(true); };
  const openDeleteModal = (record) => { setSelectedRecord(record); setShowViewModal(false); setShowDeleteModal(true); };
  const handleSort = (field) => setSortConfig(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const handleFilterChange = (filterName, value) => { setFilters(prev => ({ ...prev, [filterName]: value })); setPagination(prev => ({ ...prev, currentPage: 1 })); };
  const handlePageChange = (page) => setPagination(prev => ({ ...prev, currentPage: page }));
  const handleRowsPerPageChange = (rows) => setPagination(prev => ({ ...prev, rowsPerPage: rows, currentPage: 1 }));

  const filteredData = useMemo(() => {
    let filtered = [...disapprovedData];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name_of_association?.toLowerCase().includes(searchLower) ||
        item.contact_person?.toLowerCase().includes(searchLower) ||
        item.address?.toLowerCase().includes(searchLower) ||
        item.province?.toLowerCase().includes(searchLower)
      );
    }
    if (filters.scope !== 'all') filtered = filtered.filter(item => item.scope === filters.scope);
    if (filters.province !== 'all') filtered = filtered.filter(item => item.province === filters.province);
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];
      if (sortConfig.field === 'no') { aValue = parseInt(aValue) || 0; bValue = parseInt(bValue) || 0; }
      else if (sortConfig.field === 'date_of_receipt') { aValue = aValue ? new Date(aValue).getTime() : 0; bValue = bValue ? new Date(bValue).getTime() : 0; }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [disapprovedData, searchTerm, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.rowsPerPage;
    return filteredData.slice(startIndex, startIndex + pagination.rowsPerPage);
  }, [filteredData, pagination.currentPage, pagination.rowsPerPage]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, totalPages: Math.ceil(filteredData.length / prev.rowsPerPage) || 1 }));
  }, [filteredData.length, pagination.rowsPerPage]);

  const provinces = useMemo(() => [...new Set(disapprovedData.map(item => item.province).filter(Boolean))].sort(), [disapprovedData]);

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const processedData = disapprovedData.map(item => ({ ...item, numericNo: parseInt(item.no) || 0 }));
      const groupedData = {};
      processedData.forEach(item => {
        const province = item.province || 'Unknown Province';
        if (!groupedData[province]) groupedData[province] = [];
        groupedData[province].push(item);
      });
      Object.keys(groupedData).forEach(province => { groupedData[province].sort((a, b) => a.numericNo - b.numericNo); });
      const provinceOrder = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Palawan', 'Romblon', 'Unknown'];
      const sortedProvinces = Object.keys(groupedData).sort((a, b) => {
        const indexA = provinceOrder.indexOf(a);
        const indexB = provinceOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
      const now = new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();
      const wb = XLSXStyle.utils.book_new();
      const wsData = [['LIST OF DISAPPROVED CIVIL SOCIETY ORGANIZATIONS'], [`as of ${currentMonth} ${currentYear}`], []];
      const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }];
      wsData.push(['NO.', 'NAME OF ASSOCIATION', 'CONTACT PERSON', 'CONTACT NO.', 'EMAIL', 'PROVINCE', 'SCOPE', 'NATURE OF SERVICES', 'REASON FOR DISAPPROVAL', 'DATE OF RECEIPT', 'REMARKS']);
      let currentRow = 4;
      sortedProvinces.forEach(province => {
        wsData.push([province.toUpperCase(), ...Array(10).fill('')]);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 10 } });
        currentRow++;
        groupedData[province].forEach(item => {
          wsData.push([item.no || '', item.name_of_association || '', item.contact_person || '', item.contact_number || '', item.email_address || '', item.province || '', item.scope || '', item.nature_of_services || '', item.reason_for_disapproval || '', item.date_of_receipt || '', item.remarks || '']);
          currentRow++;
        });
        wsData.push(Array(11).fill(''));
        currentRow++;
      });
      const ws = XLSXStyle.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 60 }, { wch: 18 }, { wch: 30 }];
      ws['!merges'] = merges;
      XLSXStyle.utils.book_append_sheet(wb, ws, 'Disapproved CSOs');
      const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), `Disapproved_CSO_Organizations.xlsx`);
      setSuccess('Export Complete!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { console.error(err); setError('Failed to export Excel'); }
  };

  const columns = [
    { key: 'no', header: 'No.', sortable: true, render: (row) => <div className="font-mono font-bold text-gray-900">{row.no}</div> },
    { key: 'name_of_association', header: 'Association Name', sortable: true, render: (row) => (<div><div className="font-semibold text-gray-900">{row.name_of_association || '—'}</div><div className="text-sm text-gray-500 flex items-center mt-1"><MapPin className="h-3 w-3 mr-1" />{row.province || 'No province'}</div></div>) },
    { key: 'contact_person', header: 'Contact Person', sortable: true, render: (row) => (<div><div className="font-medium text-gray-900">{row.contact_person || '—'}</div><div className="text-sm text-gray-500">{row.position}</div></div>) },
    { key: 'scope', header: 'Scope', render: (row) => (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.scope === 'Regional' ? 'bg-blue-100 text-blue-800' : row.scope === 'National' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{row.scope}</span>) },
    { key: 'reason_for_disapproval', header: 'Reason', render: (row) => (<div className="max-w-xs"><p className="text-sm text-gray-700 truncate" title={row.reason_for_disapproval}>{row.reason_for_disapproval || '—'}</p></div>) },
    { key: 'actions', header: 'Actions', render: (row) => (<div className="flex items-center space-x-2"><button onClick={() => handleView(row)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></button><button onClick={() => openEditModal(row)} className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="h-4 w-4" /></button><button onClick={() => openRestoreModal(row)} className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"><RefreshCw className="h-4 w-4" /></button><button onClick={() => openDeleteModal(row)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button></div>) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">Disapproved CSO Records</h1>
            <p className="text-gray-600 mt-2 flex items-center"><ThumbsDown className="h-5 w-5 mr-2 text-amber-500" />Civil Society Organizations whose accreditation was disapproved</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddModal(true)} className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-700 hover:to-green-700 transition"><Plus className="h-5 w-5 mr-2" />Add Disapproved Record</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportToExcel} className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:from-amber-700 hover:to-orange-700 transition"><Download className="h-5 w-5 mr-2" />Export Excel</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchDisapprovedData} className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 font-semibold rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition"><RefreshCw className="h-5 w-5 mr-2" />Refresh</motion.button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white"><div className="flex items-center justify-between"><div><p className="text-amber-100 text-sm font-medium">Total Disapproved</p><p className="text-3xl font-bold mt-2">{stats.total}</p></div><ThumbsDown className="h-12 w-12 opacity-80" /></div><div className="mt-4 pt-4 border-t border-amber-400"><p className="text-amber-100 text-sm">{stats.total > 0 ? `${Object.keys(stats.byProvince).length} provinces` : 'No records'}</p></div></motion.div>
        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white"><div className="flex items-center justify-between"><div><p className="text-blue-100 text-sm font-medium">Top Province</p><p className="text-xl font-bold mt-2 truncate max-w-[150px]">{Object.entries(stats.byProvince).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'}</p></div><MapPin className="h-12 w-12 opacity-80" /></div><div className="mt-4 pt-4 border-t border-blue-400"><p className="text-blue-100 text-sm">{Object.entries(stats.byProvince).sort((a,b) => b[1] - a[1])[0]?.[1] || 0} records</p></div></motion.div>
        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white"><div className="flex items-center justify-between"><div><p className="text-purple-100 text-sm font-medium">Most Common Reason</p><p className="text-sm font-bold mt-2 truncate max-w-[200px]">{stats.topReason}</p></div><FileText className="h-12 w-12 opacity-80" /></div><div className="mt-4 pt-4 border-t border-purple-400"><p className="text-purple-100 text-sm">Based on disapproval notes</p></div></motion.div>
      </div>

      {/* Error & Success Messages */}
      <AnimatePresence>
        {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"><div className="flex items-center"><AlertCircle className="h-5 w-5 text-red-500 mr-3" /><div className="text-red-700 font-medium flex-1">{error}</div><button onClick={() => setError('')}><X className="h-5 w-5 text-red-500" /></button></div></motion.div>)}
        {success && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg"><div className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><div className="text-green-700 font-medium flex-1">{success}</div><button onClick={() => setSuccess('')}><X className="h-5 w-5 text-green-500" /></button></div></motion.div>)}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="text" placeholder="Search by name, contact, province..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black" />{searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>}</div>
          <div className="flex flex-wrap gap-3"><select value={filters.scope} onChange={(e) => handleFilterChange('scope', e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"><option value="all">All Scopes</option><option value="Regional">Regional</option><option value="National">National</option><option value="Local">Local</option></select><select value={filters.province} onChange={(e) => handleFilterChange('province', e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"><option value="all">All Provinces</option>{provinces.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
        </div>
        <div className="mt-4 flex items-center justify-between"><div className="text-gray-600">Showing <span className="font-semibold text-amber-600">{filteredData.length}</span> of <span className="font-semibold">{disapprovedData.length}</span> disapproved records{searchTerm && <span className="ml-2 text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Searching: "{searchTerm}"</span>}</div><div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div></div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={paginatedData} onRowClick={handleView} isLoading={loading} onSort={handleSort} sortField={sortConfig.field} sortDirection={sortConfig.direction} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, rowsPerPage: pagination.rowsPerPage, total: filteredData.length, startIndex: (pagination.currentPage - 1) * pagination.rowsPerPage, endIndex: Math.min(pagination.currentPage * pagination.rowsPerPage, filteredData.length) }} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} />

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200"><div className="flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm"><div className="flex items-center space-x-4"><div className="flex items-center"><ThumbsDown className="h-4 w-4 mr-2 text-amber-500" /><span>Disapproved CSO Archive</span></div><div className="hidden md:block">•</div><div className="flex items-center"><Users className="h-4 w-4 mr-2 text-blue-500" /><span>{disapprovedData.length} Disapproved Organizations</span></div></div></div></div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); }} title="Add Disapproved Record" size="xl">
        <DisapprovedForm onSave={handleAddRecord} onCancel={() => setShowAddModal(false)} isSaving={saving} isEdit={false} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedRecord(null); }} title="Edit Disapproved Record" size="xl">
        <DisapprovedForm initialData={selectedRecord} onSave={handleUpdateRecord} onCancel={() => { setShowEditModal(false); setSelectedRecord(null); }} isSaving={saving} isEdit={true} />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Disapproved CSO Details" size="lg">
        {selectedRecord && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6"><div><h2 className="text-2xl font-bold text-gray-900">{selectedRecord.name_of_association || 'Unnamed'}</h2><div className="flex items-center mt-2 space-x-3"><span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">No. {selectedRecord.no || '—'}</span><span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">Disapproved</span><span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">{selectedRecord.scope || '—'}</span></div></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5"><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><User className="h-5 w-5 mr-2 text-blue-600" />Contact Information</h3><div className="space-y-3"><div><p className="text-sm text-gray-500">Contact Person</p><p className="font-medium text-black">{selectedRecord.contact_person || 'Not specified'}</p></div><div><p className="text-sm text-gray-500">Position</p><p className="font-medium text-black">{selectedRecord.position || 'Not specified'}</p></div><div><p className="text-sm text-gray-500">Contact Number</p><p className="font-medium text-black">{selectedRecord.contact_number || 'Not specified'}</p></div><div><p className="text-sm text-gray-500">Email Address</p><p className="font-medium text-black">{selectedRecord.email_address || 'Not specified'}</p></div></div></div>
              <div className="bg-white border border-gray-200 rounded-xl p-5"><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><MapPin className="h-5 w-5 mr-2 text-green-600" />Location & Members</h3><div className="space-y-3"><div><p className="text-sm text-gray-500">Address</p><p className="font-medium text-black">{selectedRecord.address || 'Not specified'}</p></div><div><p className="text-sm text-gray-500">Province</p><p className="font-medium text-black">{selectedRecord.province || 'Not specified'}</p></div><div><p className="text-sm text-gray-500">Number of Members</p><div className="flex items-center"><Users className="h-4 w-4 mr-2 text-purple-600" /><p className="font-medium text-black">{selectedRecord.no_of_members || '0'} members</p></div></div></div></div>
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5"><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ThumbsDown className="h-5 w-5 mr-2 text-red-600" />Disapproval Information</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><p className="text-sm text-gray-500">Date of Receipt</p><p className="font-medium text-black">{selectedRecord.date_of_receipt ? formatDate(selectedRecord.date_of_receipt) : 'Not specified'}</p></div><div><p className="text-sm text-gray-500">Scope</p><p className="font-medium text-black">{selectedRecord.scope || 'Not specified'}</p></div></div><div className="mt-4"><p className="text-sm text-gray-500 mb-2">Reason for Disapproval</p><div className="bg-red-50 rounded-lg p-4 border border-red-100"><p className="text-gray-800 whitespace-pre-line">{selectedRecord.reason_for_disapproval || 'No reason provided'}</p></div></div></div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white border border-gray-200 rounded-xl p-5"><h3 className="text-lg font-semibold text-gray-900 mb-4">Nature of Services</h3><div className="bg-gray-50 rounded-lg p-4"><p className="text-gray-700 whitespace-pre-line">{selectedRecord.nature_of_services || 'No services specified'}</p></div></div><div className="bg-white border border-gray-200 rounded-xl p-5"><h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h3><div className="bg-gray-50 rounded-lg p-4"><p className="text-gray-700 whitespace-pre-line">{selectedRecord.remarks || 'No remarks'}</p></div></div></div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200"><button onClick={() => { setShowViewModal(false); openEditModal(selectedRecord); }} className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition"><Edit className="h-4 w-4 inline mr-2" />Edit</button><button onClick={() => { setShowViewModal(false); openRestoreModal(selectedRecord); }} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"><RefreshCw className="h-4 w-4 inline mr-2" />Restore to Deliberation</button><button onClick={() => { setShowViewModal(false); openDeleteModal(selectedRecord); }} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition"><Trash2 className="h-4 w-4 inline mr-2" />Delete</button></div>
          </div>
        )}
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Restore to Deliberation" size="sm">
        <div className="text-center py-6"><div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"><RefreshCw className="h-8 w-8 text-green-600" /></div><h3 className="text-xl font-semibold text-gray-900 mb-2">Restore to Deliberation</h3><p className="text-gray-600 mb-6">Are you sure you want to restore <span className="font-semibold">{selectedRecord?.name_of_association}</span>? This will move it back to the active deliberation queue.</p><div className="flex justify-center space-x-3"><button onClick={() => setShowRestoreModal(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">Cancel</button><button onClick={handleRestore} className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition">Restore Record</button></div></div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Permanently Delete" size="sm">
        <div className="text-center py-6"><div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4"><Trash2 className="h-8 w-8 text-red-600" /></div><h3 className="text-xl font-semibold text-gray-900 mb-2">Permanently Delete</h3><p className="text-gray-600 mb-6">Are you sure you want to permanently delete <span className="font-semibold">{selectedRecord?.name_of_association}</span>? This action cannot be undone.</p><div className="flex justify-center space-x-3"><button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">Cancel</button><button onClick={handlePermanentDelete} className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-600 transition">Delete Permanently</button></div></div>
      </Modal>
    </div>
  );
};

export default CsoDisapproved;