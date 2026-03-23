import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FiUsers,
  FiMapPin,
  FiFilter,
  FiSearch,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiPrinter,
  FiEdit2,
  FiHome,
  FiTrash2,
  FiUploadCloud,
  FiPlus,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiSave,
  FiGlobe,
  FiUpload,
  FiFileText,
  FiPackage,
  FiArrowLeft,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiActivity,
  FiUser,
  FiClock,
  FiEye,
  FiLogIn,
  FiEdit,
  FiTrash,
  FiDatabase,
  FiUsers as FiMembers,
  FiTag,
  FiBook,
  FiBriefcase,
} from "react-icons/fi";
import { collection, getDocs, doc, setDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import * as XLSX from 'xlsx';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-gray-600">{message}</p>
  </div>
);

const MemoizedTableRow = React.memo(({
  item,
  index,
  openEditModal,
  openDeleteModal,
  openViewModal,
  isDifferentlyAbledEmpty,
  isRegistrationEmpty
}) => {
  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    openEditModal(item);
  }, [openEditModal, item]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    openDeleteModal(item);
  }, [openDeleteModal, item]);

  const handleViewClick = useCallback((e) => {
    e.stopPropagation();
    openViewModal(item);
  }, [openViewModal, item]);

  const renderCheck = (value) => value ? "✓" : "";

  return (
    <tr
      onClick={() => openViewModal(item)}
      className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer"
    >
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 border-r border-gray-200">
        {index}
      </td>
      <td className="px-4 py-3 border-r border-gray-200 min-w-48">
        <div className="text-sm font-semibold text-gray-900 truncate" title={item.name || ""}>
          {item.name || ""}
        </div>
      </td>
      <td className="px-4 py-3 border-r border-gray-200 min-w-48">
        <div className="text-sm text-gray-900 truncate" title={item.address || ""}>
          {item.address || ""}
        </div>
      </td>
      <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 min-w-40 ${isRegistrationEmpty(item.registration_type) ? 'bg-yellow-100' : ''}`}>
        <div className="text-sm text-gray-900">{item.registration_type || "Not specified"}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-40 truncate" title={item.president || ""}>
        {item.president || ""}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-32">
        {item.contact_number ? (
          <a href={`tel:${item.contact_number}`} className="text-green-600 hover:text-green-800 font-medium">
            {item.contact_number}
          </a>
        ) : (
          <span className="text-gray-400">Not provided</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        <span className="font-semibold">{item.members?.male || ""}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        <span className="font-semibold">{item.members?.female || ""}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        <span className="font-semibold">{item.members?.senior_citizen || ""}</span>
      </td>
      <td className={`px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200 ${isDifferentlyAbledEmpty(item.members) ? 'bg-yellow-100' : ''}`}>
        <span className="font-semibold">
          {Number(item.members?.differently_abled) === 0 ? "" : item.members?.differently_abled}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        <span className="font-semibold">{item.members?.young_farmer || ""}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        <span className="font-semibold">{item.members?.ips || ""}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-32 truncate" title={item.commodity || ""}>
        {item.commodity || "Not specified"}
      </td>

      {/* Group Categories checkmarks */}
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        {renderCheck(item.groupCategories?.womenLed)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        {renderCheck(item.groupCategories?.menLed)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        {renderCheck(item.groupCategories?.seniorCitizensGroup)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        {renderCheck(item.groupCategories?.personsWithDisabilitiesGroup)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        {renderCheck(item.groupCategories?.youngFarmersOrganization)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        {renderCheck(item.groupCategories?.indigenousPeoplesAssociation)}
      </td>

      {/* Intervention columns */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-32 truncate" title={item.specificIntervention || ""}>
        {item.specificIntervention || "-"}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-24">
        {item.interventionAmount || "-"}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center border-r border-gray-200">
        {item.status === "Active" && (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <FiCheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center border-r border-gray-200">
        {item.status === "Inactive" && (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 bg-red-100 border border-red-300 rounded-full flex items-center justify-center">
              <FiXCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <div className="flex items-center justify-center space-x-2">
          <button onClick={handleViewClick} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105" title="View Details">
            <FiEye className="w-4.5 h-4.5" />
          </button>
          <button onClick={handleEditClick} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105" title="Edit Association">
            <FiEdit2 className="w-4.5 h-4.5" />
          </button>
          <button onClick={handleDeleteClick} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105" title="Delete Association">
            <FiTrash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange
}) => {
  const maxVisiblePages = 5;
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);
    if (end - start + 1 < maxVisiblePages) start = Math.max(end - maxVisiblePages + 1, 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            className="text-sm border text-black border-gray-300 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
        <span className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </span>
      </div>
      <div className="flex items-center space-x-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
          <FiChevronLeft className="w-4 h-4" /><FiChevronLeft className="w-4 h-4 -ml-3" />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
          <FiChevronLeft className="w-4 h-4" />
        </button>
        {pageNumbers.map(number => (
          <button key={number} onClick={() => onPageChange(number)} className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${currentPage === number ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            {number}
          </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
          <FiChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
          <FiChevronRight className="w-4 h-4" /><FiChevronRight className="w-4 h-4 -ml-3" />
        </button>
      </div>
    </div>
  );
};

export default function FullCoopAssociations() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    province: "",
    municipality: "",
    status: "",
    registrationType: "",
    commodity: "",
    searchTerm: "",
    womenLed: false,
    menLed: false,
    seniorCitizensGroup: false,
    personsWithDisabilitiesGroup: false,
    youngFarmersOrganization: false,
    indigenousPeoplesAssociation: false,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMunicipalityModalOpen, setIsMunicipalityModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [selectedViewAssociation, setSelectedViewAssociation] = useState(null);
  const [newAssociation, setNewAssociation] = useState({
    name: "",
    province: "",
    municipality: "",
    address: "",
    registration_type: "",
    president: "",
    contact_number: "",
    members: {
      male: "",
      female: "",
      senior_citizen: "",
      differently_abled: "",
      young_farmer: "",
      ips: ""
    },
    commodity: "",
    status: { active: "P", inactive: null },
    groupCategories: {
      womenLed: false,
      menLed: false,
      seniorCitizensGroup: false,
      personsWithDisabilitiesGroup: false,
      youngFarmersOrganization: false,
      indigenousPeoplesAssociation: false,
    },
    interventionReviewed: false,
    specificIntervention: "",
    interventionAmount: ""
  });
  const [provincesData, setProvincesData] = useState([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [municipalityForImport, setMunicipalityForImport] = useState("");
  const [provinceForImport, setProvinceForImport] = useState("");
  const [importStatus, setImportStatus] = useState({ loading: false, message: "", success: false, error: false });
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayedData, setDisplayedData] = useState([]);
  const tableRef = useRef(null);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const totalPages = useMemo(() => Math.ceil(filteredData.length / itemsPerPage), [filteredData.length, itemsPerPage]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    setDisplayedData(filteredData.slice(startIndex, startIndex + itemsPerPage));
  }, [filteredData, currentPage, itemsPerPage]);

  const uniqueProvinces = useMemo(() => [...new Set(data.map(item => item.province).filter(Boolean))].sort(), [data]);
  const uniqueMunicipalities = useMemo(() => [...new Set(data.map(item => item.municipality).filter(Boolean))].sort(), [data]);
  const uniqueRegistrationTypes = useMemo(() => [...new Set(data.map(item => item.registration_type).filter(Boolean))].sort(), [data]);
  const uniqueCommodities = useMemo(() => [...new Set(data.map(item => item.commodity).filter(Boolean))].sort(), [data]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (filters.province) {
      const selectedProvince = provincesData.find(p => p.name === filters.province);
      if (selectedProvince) {
        const municipalities = selectedProvince.municipalities.map(m => m.municipality || m.name || "").filter(Boolean);
        setAvailableMunicipalities([...new Set(municipalities)]);
        if (filters.municipality && !municipalities.includes(filters.municipality)) handleFilterChange("municipality", "");
      }
    } else {
      setAvailableMunicipalities([]);
      handleFilterChange("municipality", "");
    }
  }, [filters.province, provincesData]);

  useEffect(() => {
    if (!data.length) return;
    setIsFiltering(true);
    requestAnimationFrame(() => {
      let result = [...data];
      if (filters.province) result = result.filter(item => item.province.toLowerCase() === filters.province.toLowerCase());
      if (filters.municipality) result = result.filter(item => item.municipality.toLowerCase() === filters.municipality.toLowerCase());
      if (filters.status) result = result.filter(item => item.status.toLowerCase() === filters.status.toLowerCase());
      if (filters.registrationType) result = result.filter(item => item.registration_type?.toLowerCase().includes(filters.registrationType.toLowerCase()));
      if (filters.commodity) result = result.filter(item => item.commodity?.toLowerCase().includes(filters.commodity.toLowerCase()));
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase();
        result = result.filter(item =>
          item.name?.toLowerCase().includes(term) ||
          item.president?.toLowerCase().includes(term) ||
          item.address?.toLowerCase().includes(term) ||
          item.commodity?.toLowerCase().includes(term) ||
          item.municipality?.toLowerCase().includes(term)
        );
      }
      if (filters.womenLed) result = result.filter(item => item.groupCategories?.womenLed === true);
      if (filters.menLed) result = result.filter(item => item.groupCategories?.menLed === true);
      if (filters.seniorCitizensGroup) result = result.filter(item => item.groupCategories?.seniorCitizensGroup === true);
      if (filters.personsWithDisabilitiesGroup) result = result.filter(item => item.groupCategories?.personsWithDisabilitiesGroup === true);
      if (filters.youngFarmersOrganization) result = result.filter(item => item.groupCategories?.youngFarmersOrganization === true);
      if (filters.indigenousPeoplesAssociation) result = result.filter(item => item.groupCategories?.indigenousPeoplesAssociation === true);

      if (sortConfig.key) {
        result.sort((a, b) => {
          let aVal, bVal;
          if (sortConfig.key.startsWith('members.')) {
            const key = sortConfig.key.split('.')[1];
            aVal = a.members?.[key] || 0;
            bVal = b.members?.[key] || 0;
          } else if (sortConfig.key.startsWith('groupCategories.')) {
            const key = sortConfig.key.split('.')[1];
            aVal = a.groupCategories?.[key] ? 1 : 0;
            bVal = b.groupCategories?.[key] ? 1 : 0;
          } else {
            aVal = a[sortConfig.key];
            bVal = b[sortConfig.key];
          }
          if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
          } else if (typeof aVal === 'string' && typeof bVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        });
      }
      setFilteredData(result);
      setCurrentPage(1);
      setIsFiltering(false);
    });
  }, [filters, data, sortConfig, debouncedSearchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "da-encode"));
      const allData = [];
      const provincesList = [];
      let index = 1;
      const chunkSize = 100;
      const docsArray = Array.from(querySnapshot.docs);
      for (let i = 0; i < docsArray.length; i += chunkSize) {
        const chunk = docsArray.slice(i, i + chunkSize);
        chunk.forEach(doc => {
          const docData = doc.data();
          const provinceName = docData.province || "";
          if (provinceName) {
            provincesList.push({
              id: doc.id,
              name: provinceName,
              municipalities: docData.municipalities || []
            });
            if (docData.municipalities && Array.isArray(docData.municipalities)) {
              docData.municipalities.forEach(municipality => {
                if (municipality.associations && Array.isArray(municipality.associations)) {
                  municipality.associations.forEach((association, assocIndex) => {
                    let status = "Inactive";
                    if (association.status) {
                      if (association.status.active === "P") status = "Active";
                      else if (association.status.inactive === "P") status = "Inactive";
                    }
                    const members = {
                      male: association.members?.male || "",
                      female: association.members?.female || "",
                      senior_citizen: association.members?.senior_citizen || "",
                      differently_abled: association.members?.differently_abled || "",
                      young_farmer: association.members?.young_farmer || "",
                      ips: association.members?.ips || ""
                    };
                    const totalMembers = (
                      (parseInt(association.members?.male) || 0) +
                      (parseInt(association.members?.female) || 0) +
                      (parseInt(association.members?.senior_citizen) || 0) +
                      (parseInt(association.members?.differently_abled) || 0) +
                      (parseInt(association.members?.young_farmer) || 0) +
                      (parseInt(association.members?.ips) || 0)
                    );
                    allData.push({
                      id: `${doc.id}_${municipality.municipality || municipality.name || "unknown"}_${assocIndex}_${Date.now()}`,
                      firestoreId: doc.id,
                      provinceDocId: doc.id,
                      municipalityIndex: docData.municipalities.findIndex(m => (m.municipality || m.name) === (municipality.municipality || municipality.name)),
                      associationIndex: assocIndex,
                      no: index++,
                      province: provinceName,
                      municipality: municipality.municipality || municipality.name || "",
                      ...association,
                      members: members,
                      totalMembers: totalMembers,
                      status: status,
                      registration_type: association.registration_type || "",
                      createdAt: docData.createdAt?.toDate?.() || new Date(),
                      groupCategories: association.groupCategories || {
                        womenLed: false,
                        menLed: false,
                        seniorCitizensGroup: false,
                        personsWithDisabilitiesGroup: false,
                        youngFarmersOrganization: false,
                        indigenousPeoplesAssociation: false,
                      },
                      interventionReviewed: association.interventionReviewed || false,
                      specificIntervention: association.specificIntervention || "",
                      interventionAmount: association.interventionAmount || ""
                    });
                  });
                }
              });
            }
          }
        });
        if (i % chunkSize === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }
      setProvincesData(provincesList);
      setData(allData);
      setFilteredData(allData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      province: "",
      municipality: "",
      status: "",
      registrationType: "",
      commodity: "",
      searchTerm: "",
      womenLed: false,
      menLed: false,
      seniorCitizensGroup: false,
      personsWithDisabilitiesGroup: false,
      youngFarmersOrganization: false,
      indigenousPeoplesAssociation: false,
    });
    setSortConfig({ key: null, direction: 'ascending' });
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FiChevronUp className="opacity-30" />;
    return sortConfig.direction === 'ascending' ? <FiChevronUp className="text-green-600" /> : <FiChevronDown className="text-green-600" />;
  };

  const openAddModal = () => {
    setNewAssociation({
      name: "",
      province: "",
      municipality: "",
      address: "",
      registration_type: "",
      president: "",
      contact_number: "",
      members: {
        male: "",
        female: "",
        senior_citizen: "",
        differently_abled: "",
        young_farmer: "",
        ips: ""
      },
      commodity: "",
      status: { active: "P", inactive: null },
      groupCategories: {
        womenLed: false,
        menLed: false,
        seniorCitizensGroup: false,
        personsWithDisabilitiesGroup: false,
        youngFarmersOrganization: false,
        indigenousPeoplesAssociation: false,
      },
      interventionReviewed: false,
      specificIntervention: "",
      interventionAmount: ""
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (association) => {
    setSelectedAssociation(association);
    setNewAssociation({
      name: association.name || "",
      province: association.province || "",
      municipality: association.municipality || "",
      address: association.address || "",
      registration_type: association.registration_type || "",
      president: association.president || "",
      contact_number: association.contact_number || "",
      members: {
        male: association.members?.male || "",
        female: association.members?.female || "",
        senior_citizen: association.members?.senior_citizen || "",
        differently_abled: association.members?.differently_abled || "",
        young_farmer: association.members?.young_farmer || "",
        ips: association.members?.ips || ""
      },
      commodity: association.commodity || "",
      status: association.status === "Active" ? { active: "P", inactive: null } : { active: null, inactive: "P" },
      groupCategories: association.groupCategories || {
        womenLed: false,
        menLed: false,
        seniorCitizensGroup: false,
        personsWithDisabilitiesGroup: false,
        youngFarmersOrganization: false,
        indigenousPeoplesAssociation: false,
      },
      interventionReviewed: association.interventionReviewed || false,
      specificIntervention: association.specificIntervention || "",
      interventionAmount: association.interventionAmount || ""
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (association) => {
    setSelectedAssociation(association);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (association) => {
    setSelectedViewAssociation(association);
    setIsViewModalOpen(true);
  };

  const handleEditFromView = () => {
    setIsViewModalOpen(false);
    openEditModal(selectedViewAssociation);
  };

  const handleDeleteFromView = () => {
    setIsViewModalOpen(false);
    openDeleteModal(selectedViewAssociation);
  };

  const openImportModal = () => {
    setIsImportModalOpen(true);
    setImportStatus({ loading: false, message: "", success: false, error: false });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('members.')) {
      const field = name.split('.')[1];
      setNewAssociation(prev => ({ ...prev, members: { ...prev.members, [field]: value } }));
    } else if (name.startsWith('groupCategories.')) {
      const field = name.split('.')[1];
      setNewAssociation(prev => ({ ...prev, groupCategories: { ...prev.groupCategories, [field]: checked } }));
    } else if (name === 'status') {
      setNewAssociation(prev => ({
        ...prev,
        status: value === "Active" ? { active: "P", inactive: null } : { active: null, inactive: "P" }
      }));
    } else if (type === 'checkbox') {
      setNewAssociation(prev => ({ ...prev, [name]: checked }));
    } else {
      setNewAssociation(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAssociation = async () => {
    try {
      if (!newAssociation.name || !newAssociation.province || !newAssociation.municipality || !newAssociation.address || !newAssociation.president) {
        alert("Please fill in all required fields (*)");
        return;
      }
      const provinceDoc = provincesData.find(p => p.name === newAssociation.province);
      if (!provinceDoc) { alert("Selected province not found in database"); return; }
      const newAssoc = {
        name: newAssociation.name,
        address: newAssociation.address,
        registration_type: newAssociation.registration_type,
        president: newAssociation.president,
        contact_number: newAssociation.contact_number,
        members: { ...newAssociation.members },
        commodity: newAssociation.commodity,
        status: newAssociation.status,
        groupCategories: newAssociation.groupCategories,
        interventionReviewed: newAssociation.interventionReviewed,
        specificIntervention: newAssociation.specificIntervention,
        interventionAmount: newAssociation.interventionAmount
      };
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      if (!currentProvinceData) { alert("Province data not found"); return; }
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      let municipalityIndex = updatedMunicipalities.findIndex(m => (m.municipality || m.name) === newAssociation.municipality);
      if (municipalityIndex === -1) {
        updatedMunicipalities.push({ municipality: newAssociation.municipality, associations: [newAssoc] });
      } else {
        updatedMunicipalities[municipalityIndex].associations = [...(updatedMunicipalities[municipalityIndex].associations || []), newAssoc];
      }
      await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
      await fetchData();
      setIsAddModalOpen(false);
      alert("Association added successfully!");
    } catch (error) {
      console.error("Error adding association:", error);
      alert("Error adding association. Please try again.");
    }
  };

  const handleUpdateAssociation = async () => {
    try {
      if (!selectedAssociation) return;
      const provinceDoc = provincesData.find(p => p.name === selectedAssociation.province);
      if (!provinceDoc) { alert("Province document not found"); return; }
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      if (!currentProvinceData) return;
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      if (selectedAssociation.municipalityIndex !== -1 && selectedAssociation.associationIndex !== -1 &&
          updatedMunicipalities[selectedAssociation.municipalityIndex] &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations[selectedAssociation.associationIndex]) {
        updatedMunicipalities[selectedAssociation.municipalityIndex].associations[selectedAssociation.associationIndex] = {
          name: newAssociation.name,
          address: newAssociation.address,
          registration_type: newAssociation.registration_type,
          president: newAssociation.president,
          contact_number: newAssociation.contact_number,
          members: { ...newAssociation.members },
          commodity: newAssociation.commodity,
          status: newAssociation.status,
          groupCategories: newAssociation.groupCategories,
          interventionReviewed: newAssociation.interventionReviewed,
          specificIntervention: newAssociation.specificIntervention,
          interventionAmount: newAssociation.interventionAmount
        };
        await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
        await fetchData();
        setIsEditModalOpen(false);
        alert("Association updated successfully!");
      } else {
        alert("Association not found in the database. It may have been deleted.");
      }
    } catch (error) {
      console.error("Error updating association:", error);
      alert("Error updating association. Please try again.");
    }
  };

  const handleDeleteAssociation = async () => {
    try {
      if (!selectedAssociation) return;
      const provinceDoc = provincesData.find(p => p.name === selectedAssociation.province);
      if (!provinceDoc) { alert("Province document not found"); return; }
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      if (!currentProvinceData) return;
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      if (selectedAssociation.municipalityIndex !== -1 && selectedAssociation.associationIndex !== -1 &&
          updatedMunicipalities[selectedAssociation.municipalityIndex] &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations) {
        updatedMunicipalities[selectedAssociation.municipalityIndex].associations.splice(selectedAssociation.associationIndex, 1);
        if (updatedMunicipalities[selectedAssociation.municipalityIndex].associations.length === 0) {
          updatedMunicipalities.splice(selectedAssociation.municipalityIndex, 1);
        }
        await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
        await fetchData();
        setIsDeleteModalOpen(false);
        alert("Association deleted successfully!");
      } else {
        alert("Association not found in the database. It may have been deleted.");
      }
    } catch (error) {
      console.error("Error deleting association:", error);
      alert("Error deleting association. Please try again.");
    }
  };

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImportStatus({ loading: false, message: "", success: false, error: false });
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) { alert("Please upload an Excel file (.xlsx, .xls) or CSV file"); return; }
    setImportStatus({ loading: true, message: "Reading Excel file...", success: false, error: false });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false, cellText: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false, defval: "" });
        if (jsonData.length === 0) { alert("The Excel file is empty or contains no data"); return; }
        const transformedData = [];
        const chunkSize = 500;
        for (let i = 0; i < jsonData.length; i += chunkSize) {
          const chunk = jsonData.slice(i, i + chunkSize);
          chunk.forEach((row) => {
            const getValue = (keys) => {
              for (const key of keys) if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key].toString().trim();
              return "";
            };
            const getBool = (keys) => {
              const val = getValue(keys).toLowerCase();
              if (val === 'yes' || val === 'true' || val === '1') return true;
              if (val === 'no' || val === 'false' || val === '0') return false;
              return false;
            };
            transformedData.push({
              name: getValue(["Name of Association", "Association Name", "Name", "ASSOCIATION NAME", "ASSOCIATION"]),
              address: getValue(["Address", "Complete Address", "ADDRESS", "LOCATION"]),
              registration_type: getValue(["Type of Registration", "Registration Type", "REGISTRATION TYPE", "Registration", "TYPE"]),
              president: getValue(["Name of President", "President", "PRESIDENT", "CONTACT PERSON"]),
              contact_number: getValue(["Contact No.", "Contact Number", "CONTACT", "PHONE", "MOBILE"]),
              members: {
                male: getValue(["Male", "Male Members", "MALE", "MALE COUNT"]),
                female: getValue(["Female", "Female Members", "FEMALE", "FEMALE COUNT"]),
                senior_citizen: getValue(["Senior Citizen", "Senior", "SENIOR", "ELDERLY"]),
                differently_abled: getValue(["Differently-abled Person", "PWD", "DIFFERENTLY ABLED", "SPECIAL"]),
                young_farmer: getValue(["Young Farmer", "Youth", "YOUNG FARMER", "YOUTH FARMER"]),
                ips: getValue(["IPs", "Indigenous People", "INDIGENOUS", "IPS"])
              },
              commodity: getValue(["Commodity", "Products", "CROPS", "PRODUCE"]),
              status: {
                active: getValue(["Active", "Status"])?.toLowerCase() === "active" ? "P" : null,
                inactive: getValue(["Inactive", "Status"])?.toLowerCase() === "inactive" ? "P" : null
              },
              groupCategories: {
                womenLed: getBool(["Women-Led Group", "Women Led"]),
                menLed: getBool(["Men-Led Group", "Men Led"]),
                seniorCitizensGroup: getBool(["Senior Citizens Group", "Senior Citizens"]),
                personsWithDisabilitiesGroup: getBool(["Persons with Disabilities Group", "PWD Group"]),
                youngFarmersOrganization: getBool(["Young Farmers Organization", "Youth Farmers"]),
                indigenousPeoplesAssociation: getBool(["Indigenous Peoples Association", "IP Association"])
              },
              specificIntervention: getValue(["Specific Intervention", "SPECIFIC INTERVENTION", "Intervention"]),
              interventionAmount: getValue(["Amount", "AMOUNT", "Intervention Amount"])
            });
          });
          if (i % chunkSize === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        const filteredData = transformedData.filter(item => item.name);
        setExcelData(filteredData);
        setIsMunicipalityModalOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImportStatus({ loading: false, message: "", success: false, error: false });
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please check the file format.");
        setImportStatus({ loading: false, message: "", success: false, error: false });
      }
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      setImportStatus({ loading: false, message: "", success: false, error: false });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMunicipalitySubmit = () => {
    if (!municipalityForImport.trim()) { alert("Please enter a municipality name"); return; }
    if (!provinceForImport.trim()) { alert("Please select a province"); return; }
    setIsMunicipalityModalOpen(false);
    setIsImportModalOpen(true);
  };

  const processImportToFirebase = async () => {
    try {
      setImportStatus({ loading: true, message: "Starting import process...", success: false, error: false });
      if (!excelData || excelData.length === 0) throw new Error("No data to import");
      if (!provinceForImport || !municipalityForImport) throw new Error("Province and municipality are required");
      const provinceDoc = provincesData.find(p => p.name === provinceForImport);
      let provinceRef;
      let currentProvinceData;
      if (provinceDoc) {
        provinceRef = doc(db, "da-encode", provinceDoc.id);
        const provinceSnapshot = await getDocs(collection(db, "da-encode"));
        provinceSnapshot.forEach(doc => { if (doc.id === provinceDoc.id) currentProvinceData = doc.data(); });
      } else {
        provinceRef = doc(collection(db, "da-encode"));
        currentProvinceData = { province: provinceForImport, municipalities: [], createdAt: new Date() };
        await setDoc(provinceRef, currentProvinceData);
      }
      const chunkSize = 100;
      let importedCount = 0;
      for (let i = 0; i < excelData.length; i += chunkSize) {
        const chunk = excelData.slice(i, i + chunkSize);
        setImportStatus({ loading: true, message: `Importing ${Math.min(i + chunkSize, excelData.length)} of ${excelData.length} associations...`, success: false, error: false });
        const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
        let municipalityIndex = updatedMunicipalities.findIndex(m => (m.municipality || m.name) === municipalityForImport);
        if (municipalityIndex === -1) {
          updatedMunicipalities.push({ municipality: municipalityForImport, associations: chunk });
        } else {
          updatedMunicipalities[municipalityIndex].associations = [...(updatedMunicipalities[municipalityIndex].associations || []), ...chunk];
        }
        await updateDoc(provinceRef, { municipalities: updatedMunicipalities, updatedAt: new Date() });
        importedCount += chunk.length;
        currentProvinceData.municipalities = updatedMunicipalities;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await fetchData();
      setImportStatus({ loading: false, message: `Successfully imported ${importedCount} associations to ${municipalityForImport}, ${provinceForImport}`, success: true, error: false });
      setTimeout(() => {
        setImportStatus({ loading: false, message: "", success: false, error: false });
        setIsImportModalOpen(false);
        setExcelData([]);
        setMunicipalityForImport("");
        setProvinceForImport("");
      }, 3000);
    } catch (error) {
      console.error("Error importing data:", error);
      setImportStatus({ loading: false, message: `Import failed: ${error.message}`, success: false, error: true });
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        "Name of Association": "Sample Farmers Association",
        "Complete Address": "Sample Address, Sample Barangay",
        "Type of Registration (DOLE, CDA, SEC)": "DOLE",
        "Name of President": "Juan Dela Cruz",
        "Contact No.": "09123456789",
        "Male": "50",
        "Female": "30",
        "Senior Citizen": "15",
        "Differently-abled Person": "2",
        "Young Farmer": "10",
        "IPs": "5",
        "Commodity": "Rice, Vegetables",
        "Status": "Active",
        "Women-Led Group": "Yes",
        "Men-Led Group": "No",
        "Senior Citizens Group": "Yes",
        "Persons with Disabilities Group": "No",
        "Young Farmers Organization": "Yes",
        "Indigenous Peoples Association": "No",
        "Specific Intervention": "Seeds Distribution",
        "Amount": "100 bags"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Associations");
    XLSX.writeFile(wb, "Association_Template.xlsx");
  };

  const exportToExcel = () => {
    let displayProvince = "";
    let displayMunicipality = "";
    if (filteredData.length > 0) {
      if (filters.province) displayProvince = filters.province;
      else {
        const uniqueProvinces = [...new Set(filteredData.map(item => item.province))];
        displayProvince = uniqueProvinces.length === 1 ? uniqueProvinces[0] : `${uniqueProvinces.length} PROVINCES`;
      }
      if (filters.municipality) displayMunicipality = filters.municipality;
      else {
        const uniqueMunicipalities = [...new Set(filteredData.map(item => item.municipality))];
        displayMunicipality = uniqueMunicipalities.length === 1 ? uniqueMunicipalities[0] : `ALL MUNICIPALITIES`;
      }
    } else {
      displayProvince = "NO DATA";
      displayMunicipality = "NO DATA";
    }
    if (!displayProvince) displayProvince = "ALL PROVINCES";
    if (!displayMunicipality) displayMunicipality = "ALL MUNICIPALITIES";

    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
        th { background-color: #f3f4f6; font-weight: bold; text-align: center; border: 2px solid #000000; padding: 8px; vertical-align: middle; }
        td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; }
        .no-data { background-color: #fef3c7; }
        .no-registration { background-color: #d1fae5; }
      </style></head>
      <body>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
           <tr><td colspan="16" style="text-align:center; font-weight:bold; font-size:18px;">LIST OF REGISTERED ASSOCIATIONS</td></tr>
          <tr style="height:15px;"><td colspan="16"></td><td colspan="6" style="font-weight:bold;">LEGEND:</td></tr>
          <tr><td colspan="2"><strong>PROVINCE</strong></td><td colspan="14">: ${displayProvince}</td><td colspan="6" class="no-data" style="text-align:center;">NO DATA</td></tr>
          <tr><td colspan="2"><strong>MUNICIPALITY</strong></td><td colspan="14">: ${displayMunicipality}</td><td colspan="6" class="no-registration" style="text-align:center;">NO REGISTRATION</td></tr>
        </table>
        <br/>
        <table>
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2">Name of Association</th>
              <th rowspan="2">Address</th>
              <th rowspan="2">Type of Registration</th>
              <th rowspan="2">Name of President</th>
              <th rowspan="2">Contact No.</th>
              <th colspan="6">No. of Members</th>
              <th rowspan="2">Commodity</th>
              <th colspan="6">Group Categories</th>
              <th colspan="2">Intervention Reviewed</th>
              <th colspan="2">Status</th>
            </tr>
            <tr>
              <th>Male</th><th>Female</th><th>Senior Citizen</th><th>Differently-abled</th><th>Young Farmer</th><th>IPs</th>
              <th>Women-Led</th><th>Men-Led</th><th>Senior Citizens</th><th>PWD</th><th>Young Farmers</th><th>IP Association</th>
              <th>Specific Intervention</th><th>Amount</th><th>Active</th><th>Inactive</th>
            </tr>
          </thead>
          <tbody>
    `;
    filteredData.forEach((item, index) => {
      const isDiffAbledEmpty = !item.members?.differently_abled || Number(item.members?.differently_abled) === 0;
      const isRegEmpty = !item.registration_type;
      const displayMemberValue = (val) => (val === "" || val === "0" || val === 0 || !val) ? "" : val;
      const check = (val) => val ? "✓" : "";
      tableHTML += `
        <tr>
          <td style="text-align:center">${index + 1}</td>
          <td>${item.name || ""}</td>
          <td>${item.address || ""}</td>
          <td class="${isRegEmpty ? 'no-registration' : ''}">${item.registration_type || ""}</td>
          <td>${item.president || ""}</td>
          <td>${item.contact_number || ""}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.male)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.female)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.senior_citizen)}</td>
          <td class="${isDiffAbledEmpty ? 'no-data' : ''}" style="text-align:center">${displayMemberValue(item.members?.differently_abled)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.young_farmer)}</td>
          <td style="text-align:center">${displayMemberValue(item.members?.ips)}</td>
          <td>${item.commodity || ""}</td>
          <td style="text-align:center">${check(item.groupCategories?.womenLed)}</td>
          <td style="text-align:center">${check(item.groupCategories?.menLed)}</td>
          <td style="text-align:center">${check(item.groupCategories?.seniorCitizensGroup)}</td>
          <td style="text-align:center">${check(item.groupCategories?.personsWithDisabilitiesGroup)}</td>
          <td style="text-align:center">${check(item.groupCategories?.youngFarmersOrganization)}</td>
          <td style="text-align:center">${check(item.groupCategories?.indigenousPeoplesAssociation)}</td>
          <td>${item.specificIntervention || "-"}</td>
          <td>${item.interventionAmount || "-"}</td>
          <td style="text-align:center">${item.status === "Active" ? "✓" : ""}</td>
          <td style="text-align:center">${item.status === "Inactive" ? "✓" : ""}</td>
        </tr>
      `;
    });
    tableHTML += `
          </tbody>
        </table>
        <div style="margin-top:20px; font-size:10px; color:#666;">
          <p><strong>Legend:</strong></p>
          <p>✓ - Checkmark indicates status or membership</p>
          <p style="background-color:#fef3c7; padding:4px; display:inline-block;">Yellow background - Empty differently-abled field</p>
          <p style="background-color:#d1fae5; padding:4px; display:inline-block; margin-left:10px;">Green background - Missing registration type</p>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agriculture_Associations_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const printTable = () => {
    if (filteredData.length > 500 && !window.confirm(`Printing ${filteredData.length} rows. This may take a moment. Continue?`)) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Agriculture Associations Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin:20px; }
        table { width:100%; border-collapse:collapse; margin:20px 0; font-size:9px; }
        th, td { border:1px solid #ddd; padding:4px; text-align:left; }
        th { background-color:#f4f4f4; }
        @media print { body { margin:0; padding:10px; } @page { size:landscape; margin:0.5cm; } }
      </style></head>
      <body>
        <h2>Agriculture Associations Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${filteredData.length}</p>
        <table>
          <thead>
            <tr>
              <th>No.</th><th>Association Name</th><th>Address</th><th>Registration Type</th><th>President</th><th>Contact No.</th>
              <th>Male</th><th>Female</th><th>Senior Citizen</th><th>Differently-abled</th><th>Young Farmer</th><th>IPs</th><th>Commodity</th>
              <th>Women-Led</th><th>Men-Led</th><th>Senior Citizens</th><th>PWD</th><th>Young Farmers</th><th>IP Association</th>
              <th>Specific Intervention</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item, idx) => `
              <tr>
                <td>${idx+1}</td><td>${item.name||""}</td><td>${item.address||""}</td><td>${item.registration_type||""}</td><td>${item.president||""}</td><td>${item.contact_number||""}</td>
                <td>${item.members?.male||""}</td><td>${item.members?.female||""}</td><td>${item.members?.senior_citizen||""}</td><td>${item.members?.differently_abled||""}</td><td>${item.members?.young_farmer||""}</td><td>${item.members?.ips||""}</td><td>${item.commodity||""}</td>
                <td>${item.groupCategories?.womenLed ? "Yes" : ""}</td><td>${item.groupCategories?.menLed ? "Yes" : ""}</td><td>${item.groupCategories?.seniorCitizensGroup ? "Yes" : ""}</td><td>${item.groupCategories?.personsWithDisabilitiesGroup ? "Yes" : ""}</td><td>${item.groupCategories?.youngFarmersOrganization ? "Yes" : ""}</td><td>${item.groupCategories?.indigenousPeoplesAssociation ? "Yes" : ""}</td>
                <td>${item.specificIntervention||"-"}</td><td>${item.interventionAmount||"-"}</td><td>${item.status||""}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const isDifferentlyAbledEmpty = (members) => {
    const val = members?.differently_abled;
    return val === "" || val === null || val === undefined || Number(val) === 0;
  };
  const isRegistrationEmpty = (reg) => !reg || reg === "";

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (tableRef.current) tableRef.current.scrollIntoView({ behavior: 'smooth' });
  };
  const handleItemsPerPageChange = (value) => { setItemsPerPage(value); setCurrentPage(1); };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading associations data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent mb-2">
              Farmers Cooperative & Associations (FCAs)
            </h1>
            <p className="text-gray-600">Complete list of all agricultural associations with advanced filtering</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5">
              <FiUpload className="mr-2 text-lg" /> Import Excel
            </button>
            <button onClick={openAddModal} className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5">
              <FiPlus className="mr-2 text-lg" /> Add New Association
            </button>
            <button onClick={fetchData} className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5" title="Refresh Data">
              <FiRefreshCw className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />

      {/* Action Bar */}
      <div className="mb-6 bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
              <FiFilter className="mr-2 text-green-600" />
              Data Controls & Export
            </h3>
            <p className="text-sm text-gray-600">Filter, search, import, and export your association data</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={downloadSampleTemplate} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow">
              <FiFileText className="mr-2" /> Download Template
            </button>
            <button onClick={printTable} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow">
              <FiPrinter className="mr-2" /> Print Report
            </button>
            <button onClick={exportToExcel} className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl">
              <FiDownload className="mr-2" /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Advanced Filters</h3>
            <p className="text-sm text-gray-600">Refine results using multiple criteria</p>
          </div>
          <div className="flex space-x-2 mt-3 md:mt-0">
            <button onClick={clearFilters} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200">
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
            <select value={filters.province} onChange={(e) => handleFilterChange("province", e.target.value)} className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white">
              <option value="">All Provinces</option>
              {uniqueProvinces.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Municipality</label>
            <select value={filters.municipality} onChange={(e) => handleFilterChange("municipality", e.target.value)} className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white" disabled={!filters.province}>
              <option value="">All Municipalities</option>
              {filters.province ? availableMunicipalities.map((m, i) => <option key={i} value={m}>{m}</option>) : uniqueMunicipalities.map((m, i) => <option key={i} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Type</label>
            <select value={filters.registrationType} onChange={(e) => handleFilterChange("registrationType", e.target.value)} className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white">
              <option value="">All Types</option>
              {uniqueRegistrationTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commodity</label>
            <select value={filters.commodity} onChange={(e) => handleFilterChange("commodity", e.target.value)} className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white">
              <option value="">All Commodities</option>
              {uniqueCommodities.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Group Category Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={filters.womenLed} onChange={(e) => handleFilterChange("womenLed", e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
            <span>Women-Led</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={filters.menLed} onChange={(e) => handleFilterChange("menLed", e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
            <span>Men-Led</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={filters.seniorCitizensGroup} onChange={(e) => handleFilterChange("seniorCitizensGroup", e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
            <span>Senior Citizens Group</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={filters.personsWithDisabilitiesGroup} onChange={(e) => handleFilterChange("personsWithDisabilitiesGroup", e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
            <span>PWD Group</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={filters.youngFarmersOrganization} onChange={(e) => handleFilterChange("youngFarmersOrganization", e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
            <span>Young Farmers Organization</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={filters.indigenousPeoplesAssociation} onChange={(e) => handleFilterChange("indigenousPeoplesAssociation", e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
            <span>IP Association</span>
          </label>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input type="text" placeholder="Search associations by name, president, address, commodity, or municipality..." value={filters.searchTerm} onChange={(e) => handleFilterChange("searchTerm", e.target.value)} className="w-full text-black pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 md:px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Associations Database</h3>
              <p className="text-sm text-gray-600">{isFiltering ? "Filtering..." : `${filteredData.length} association${filteredData.length !== 1 ? 's' : ''} found • Total: ${data.length} associations`}</p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200 text-sm" style={{ minWidth: '2800px' }}>
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-16">No.</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-48">Association Name</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-48">Complete Address</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-40">Registration Type</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-40">President</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-32">Contact No.</th>
                <th colSpan="6" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Members Breakdown</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-32">Commodity</th>
                <th colSpan="6" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Group Categories</th>
                <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">Intervention Reviewed</th>
                <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-28">Actions</th>
              </tr>
              <tr>
                <th onClick={() => requestSort('members.male')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Male{getSortIcon('members.male')}</div></th>
                <th onClick={() => requestSort('members.female')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Female{getSortIcon('members.female')}</div></th>
                <th onClick={() => requestSort('members.senior_citizen')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Senior Citizen{getSortIcon('members.senior_citizen')}</div></th>
                <th onClick={() => requestSort('members.differently_abled')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-32 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Differently-abled{getSortIcon('members.differently_abled')}</div></th>
                <th onClick={() => requestSort('members.young_farmer')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Young Farmer{getSortIcon('members.young_farmer')}</div></th>
                <th onClick={() => requestSort('members.ips')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">IPs{getSortIcon('members.ips')}</div></th>
                <th onClick={() => requestSort('groupCategories.womenLed')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Women-Led{getSortIcon('groupCategories.womenLed')}</div></th>
                <th onClick={() => requestSort('groupCategories.menLed')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Men-Led{getSortIcon('groupCategories.menLed')}</div></th>
                <th onClick={() => requestSort('groupCategories.seniorCitizensGroup')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Senior Citizens{getSortIcon('groupCategories.seniorCitizensGroup')}</div></th>
                <th onClick={() => requestSort('groupCategories.personsWithDisabilitiesGroup')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">PWD{getSortIcon('groupCategories.personsWithDisabilitiesGroup')}</div></th>
                <th onClick={() => requestSort('groupCategories.youngFarmersOrganization')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">Young Farmers{getSortIcon('groupCategories.youngFarmersOrganization')}</div></th>
                <th onClick={() => requestSort('groupCategories.indigenousPeoplesAssociation')} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer"><div className="flex items-center justify-between">IP Assoc{getSortIcon('groupCategories.indigenousPeoplesAssociation')}</div></th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-32">Specific Intervention</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24">Active</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Inactive</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="28" className="px-6 py-12 text-center">
                  <div className="text-gray-500 py-8"><FiSearch className="h-16 w-16 mx-auto mb-4 text-gray-300" /><p className="text-lg font-medium text-gray-700">No associations found</p><p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search term</p><button onClick={clearFilters} className="mt-4 px-4 py-2 text-sm text-green-600 hover:text-green-800 font-medium">Clear all filters</button></div>
                </td></tr>
              ) : (
                displayedData.map((item, idx) => (
                  <MemoizedTableRow
                    key={item.id}
                    item={item}
                    index={(currentPage - 1) * itemsPerPage + idx + 1}
                    openEditModal={openEditModal}
                    openDeleteModal={openDeleteModal}
                    openViewModal={openViewModal}
                    isDifferentlyAbledEmpty={isDifferentlyAbledEmpty}
                    isRegistrationEmpty={isRegistrationEmpty}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} totalItems={filteredData.length} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} />
        )}

        <div className="px-5 md:px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="text-sm text-gray-700">Showing <span className="font-bold">{filteredData.length}</span> of <span className="font-bold">{data.length}</span> associations • <span className="ml-2 text-green-600 font-medium">{((filteredData.length / data.length) * 100).toFixed(1)}% of total</span></div>
            <div className="mt-2 sm:mt-0"><div className="text-xs text-gray-500 flex items-center"><span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>Last updated: {new Date().toLocaleDateString("en-US", { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div></div>
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}
      {/* Municipality Selection Modal */}
      {isMunicipalityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div ref={modalRef} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-fadeIn">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div><h3 className="text-2xl font-bold text-gray-900">Specify Location</h3><p className="text-sm text-gray-600 mt-1">Where are these associations located?</p></div>
              <button onClick={() => setIsMunicipalityModalOpen(false)} className="p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:rotate-90"><FiX className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-8">
              <div className="mb-8"><div className="flex items-center justify-between mb-4"><h4 className="text-lg font-bold text-gray-800">Excel Data Preview</h4><span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{excelData.length} associations found</span></div>
                <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-200"><th className="px-3 py-2 text-left">Association Name</th><th className="px-3 py-2 text-left">President</th><th className="px-3 py-2 text-left">Members</th></tr></thead><tbody>{excelData.slice(0,5).map((item,i)=>(
                  <tr key={i} className="border-b border-gray-200"><td className="px-3 py-2 truncate max-w-xs">{item.name||"No name"}</td><td className="px-3 py-2">{item.president||"No president"}</td><td className="px-3 py-2">M: {item.members?.male||"0"} | F: {item.members?.female||"0"}</td></tr>
                ))}</tbody></table>{excelData.length>5 && <p className="text-sm text-gray-500 mt-2 text-center">+ {excelData.length-5} more associations...</p>}</div></div>
              <div className="space-y-6">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Province <span className="text-red-500">*</span></label><select value={provinceForImport} onChange={(e)=>setProvinceForImport(e.target.value)} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Select Province</option>{uniqueProvinces.map((p,i)=><option key={i} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Municipality <span className="text-red-500">*</span></label><input type="text" value={municipalityForImport} onChange={(e)=>setMunicipalityForImport(e.target.value)} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter municipality name (e.g., POLA, CALAPAN CITY)" /><p className="text-sm text-gray-500 mt-2">Enter the municipality where these associations are located. This will group all imported data under this municipality.</p></div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end space-x-4">
              <button onClick={()=>setIsMunicipalityModalOpen(false)} className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleMunicipalitySubmit} className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg flex items-center"><FiPackage className="mr-2 text-lg" />Continue to Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div ref={modalRef} className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl animate-fadeIn">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div><h3 className="text-2xl font-bold text-gray-900">Confirm Import</h3><p className="text-sm text-gray-600 mt-1">Review the data before importing to database</p></div>
              <button onClick={()=>{setIsImportModalOpen(false);setImportStatus({loading:false,message:"",success:false,error:false});}} className="p-2.5 hover:bg-white rounded-xl"><FiX className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-8">
              {importStatus.message && (
                <div className={`mb-6 p-4 rounded-xl ${importStatus.success?'bg-green-50 border border-green-200':importStatus.error?'bg-red-50 border border-red-200':'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center">{importStatus.loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>}{importStatus.success && <FiCheckCircle className="text-green-600 mr-3"/>}{importStatus.error && <FiAlertCircle className="text-red-600 mr-3"/>}<p className={`font-medium ${importStatus.success?'text-green-800':importStatus.error?'text-red-800':'text-blue-800'}`}>{importStatus.message}</p></div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-5"><h4 className="text-lg font-bold text-gray-800 mb-3">Import Summary</h4><div className="space-y-3"><div className="flex justify-between"><span>Total Associations:</span><span className="font-bold text-lg">{excelData.length}</span></div><div className="flex justify-between"><span>Province:</span><span className="font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{provinceForImport}</span></div><div className="flex justify-between"><span>Municipality:</span><span className="font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">{municipalityForImport}</span></div><div className="flex justify-between"><span>Total Members:</span><span className="font-bold">{excelData.reduce((sum,item)=>sum+(parseInt(item.members?.male)||0)+(parseInt(item.members?.female)||0)+(parseInt(item.members?.senior_citizen)||0)+(parseInt(item.members?.differently_abled)||0)+(parseInt(item.members?.young_farmer)||0)+(parseInt(item.members?.ips)||0),0).toLocaleString()}</span></div></div></div>
                <div className="bg-gray-50 rounded-xl p-5"><h4 className="text-lg font-bold text-gray-800 mb-3">Data Preview</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Sample Association:</span><span className="font-medium truncate max-w-xs">{excelData[0]?.name||"No data"}</span></div><div className="flex justify-between"><span>Sample President:</span><span className="font-medium">{excelData[0]?.president||"No data"}</span></div><div className="flex justify-between"><span>Sample Commodity:</span><span className="font-medium">{excelData[0]?.commodity||"No data"}</span></div><div className="flex justify-between"><span>Sample Status:</span><span className="font-medium">{excelData[0]?.status?.active?"Active":"Inactive"}</span></div></div></div>
              </div>
              <div className="mb-8"><h4 className="text-lg font-bold text-gray-800 mb-4">First 5 Associations</h4><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-200"><th>No.</th><th>Association Name</th><th>President</th><th>Members</th><th>Commodity</th></tr></thead><tbody>{excelData.slice(0,5).map((item,i)=>(<tr key={i} className="border-b border-gray-200"><td className="px-3 py-2">{i+1}</td><td className="px-3 py-2 truncate max-w-xs" title={item.name}>{item.name||"No name"}</td><td className="px-3 py-2">{item.president||"No president"}</td><td className="px-3 py-2">M: {item.members?.male||"0"} | F: {item.members?.female||"0"}</td><td className="px-3 py-2">{item.commodity||"Not specified"}</td></tr>))}</tbody></table></div></div>
              <div className="bg-yellow-50 border-l-4 border-l-yellow-500 p-4 rounded-r-lg"><p className="text-sm text-yellow-800"><span className="font-bold">⚠️ Important:</span> This will {provincesData.find(p=>p.name===provinceForImport)?'update':'create'} the province document and {excelData.some(item=>item.municipality===municipalityForImport)?'add to':'create'} the municipality with {excelData.length} associations.</p></div>
            </div>
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between">
              <button onClick={downloadSampleTemplate} className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center"><FiFileText className="mr-2" />Download Template</button>
              <div className="flex space-x-4">
                <button onClick={()=>{setIsImportModalOpen(false);setImportStatus({loading:false,message:"",success:false,error:false});}} className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={processImportToFirebase} disabled={importStatus.loading} className={`px-8 py-3.5 rounded-xl font-semibold shadow-lg flex items-center ${importStatus.loading?'bg-blue-400 cursor-not-allowed':'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>{importStatus.loading?<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>Importing...</>:<><FiUpload className="mr-2 text-lg" />Confirm Import</>}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between rounded-t-3xl sticky top-0 bg-white z-10">
              <div><h3 className="text-2xl font-bold text-gray-900">Add New Association</h3><p className="text-sm text-gray-600 mt-1">Fill in the details below to register a new association</p></div>
              <button onClick={()=>setIsAddModalOpen(false)} className="p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:rotate-90"><FiX className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Association Name <span className="text-red-500">*</span></label><input type="text" name="name" value={newAssociation.name} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Enter association name" required/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Province <span className="text-red-500">*</span></label><select name="province" value={newAssociation.province} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"><option value="">Select Province</option>{uniqueProvinces.map((p,i)=><option key={i} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Municipality <span className="text-red-500">*</span></label><input type="text" name="municipality" value={newAssociation.municipality} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Enter municipality name" required/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Complete Address <span className="text-red-500">*</span></label><input type="text" name="address" value={newAssociation.address} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Enter complete address" required/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Registration Type</label><select name="registration_type" value={newAssociation.registration_type} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"><option value="">Select Type</option><option value="DOLE">DOLE</option><option value="CDA">CDA</option><option value="SEC">SEC</option><option value="none">None</option></select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">President Name <span className="text-red-500">*</span></label><input type="text" name="president" value={newAssociation.president} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Enter president's full name" required/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label><input type="text" name="contact_number" value={newAssociation.contact_number} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Enter contact number"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Commodity</label><input type="text" name="commodity" value={newAssociation.commodity} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="Enter main commodity"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Status</label><select name="status" value={newAssociation.status.active==="P"?"Active":"Inactive"} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              </div>
              <div className="mb-8"><h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Members Information</h4><div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Male Members</label><input type="number" name="members.male" value={newAssociation.members.male} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Female Members</label><input type="number" name="members.female" value={newAssociation.members.female} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Senior Citizens</label><input type="number" name="members.senior_citizen" value={newAssociation.members.senior_citizen} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Differently-abled</label><input type="number" name="members.differently_abled" value={newAssociation.members.differently_abled} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Young Farmer</label><input type="number" name="members.young_farmer" value={newAssociation.members.young_farmer} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">IPs</label><input type="number" name="members.ips" value={newAssociation.members.ips} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
              </div></div>
              <div className="mb-8"><h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Group Categories</h4><div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.womenLed" checked={newAssociation.groupCategories.womenLed} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Women-Led Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.menLed" checked={newAssociation.groupCategories.menLed} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Men-Led Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.seniorCitizensGroup" checked={newAssociation.groupCategories.seniorCitizensGroup} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Senior Citizens Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.personsWithDisabilitiesGroup" checked={newAssociation.groupCategories.personsWithDisabilitiesGroup} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Persons with Disabilities Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.youngFarmersOrganization" checked={newAssociation.groupCategories.youngFarmersOrganization} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Young Farmers Organization</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.indigenousPeoplesAssociation" checked={newAssociation.groupCategories.indigenousPeoplesAssociation} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Indigenous Peoples Association</span></label>
              </div></div>
              <div className="mb-8"><h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Intervention Information</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Intervention Reviewed</label><div className="flex items-center h-12"><label className="flex items-center"><input type="checkbox" name="interventionReviewed" checked={newAssociation.interventionReviewed} onChange={handleInputChange} className="h-5 w-5 text-indigo-600 rounded" /><span className="ml-2">Yes</span></label></div></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Specific Intervention</label><input type="text" name="specificIntervention" value={newAssociation.specificIntervention} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" placeholder="e.g., Seeds, Mech, Credit, Extn"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label><input type="text" name="interventionAmount" value={newAssociation.interventionAmount} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" placeholder="e.g., 100 bags, ₱50,000"/></div>
              </div></div>
            </div>
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl sticky bottom-0 bg-white">
              <div className="flex justify-end space-x-4">
                <button onClick={()=>setIsAddModalOpen(false)} className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddAssociation} className="px-8 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-lg flex items-center"><FiSave className="mr-2 text-lg" />Save Association</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAssociation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between rounded-t-3xl sticky top-0 bg-white z-10">
              <div><h3 className="text-2xl font-bold text-gray-900">Edit Association</h3><p className="text-sm text-gray-600 mt-1">Update the details of this association</p></div>
              <button onClick={()=>setIsEditModalOpen(false)} className="p-2.5 hover:bg-white rounded-xl"><FiX className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-l-yellow-500 rounded-r-lg"><p className="text-sm text-gray-700"><span className="font-semibold">Note:</span> Province and Municipality cannot be changed. If you need to move this association to a different location, please delete and create a new one.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Association Name</label><input type="text" name="name" value={newAssociation.name} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Province</label><input type="text" value={newAssociation.province} disabled className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-500"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Municipality</label><input type="text" value={newAssociation.municipality} disabled className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-500"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Complete Address</label><input type="text" name="address" value={newAssociation.address} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Registration Type</label><select name="registration_type" value={newAssociation.registration_type} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"><option value="">Select Type</option><option value="DOLE">DOLE</option><option value="CDA">CDA</option><option value="SEC">SEC</option><option value="none">None</option></select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">President Name</label><input type="text" name="president" value={newAssociation.president} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label><input type="text" name="contact_number" value={newAssociation.contact_number} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Commodity</label><input type="text" name="commodity" value={newAssociation.commodity} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"/></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Status</label><select name="status" value={newAssociation.status.active==="P"?"Active":"Inactive"} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              </div>
              <div className="mb-8"><h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Members Information</h4><div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                <div><label>Male Members</label><input type="number" name="members.male" value={newAssociation.members.male} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label>Female Members</label><input type="number" name="members.female" value={newAssociation.members.female} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label>Senior Citizens</label><input type="number" name="members.senior_citizen" value={newAssociation.members.senior_citizen} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label>Differently-abled</label><input type="number" name="members.differently_abled" value={newAssociation.members.differently_abled} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label>Young Farmer</label><input type="number" name="members.young_farmer" value={newAssociation.members.young_farmer} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
                <div><label>IPs</label><input type="number" name="members.ips" value={newAssociation.members.ips} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl" min="0"/></div>
              </div></div>
              <div className="mb-8"><h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Group Categories</h4><div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.womenLed" checked={newAssociation.groupCategories.womenLed} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Women-Led Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.menLed" checked={newAssociation.groupCategories.menLed} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Men-Led Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.seniorCitizensGroup" checked={newAssociation.groupCategories.seniorCitizensGroup} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Senior Citizens Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.personsWithDisabilitiesGroup" checked={newAssociation.groupCategories.personsWithDisabilitiesGroup} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Persons with Disabilities Group</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.youngFarmersOrganization" checked={newAssociation.groupCategories.youngFarmersOrganization} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Young Farmers Organization</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" name="groupCategories.indigenousPeoplesAssociation" checked={newAssociation.groupCategories.indigenousPeoplesAssociation} onChange={handleInputChange} className="rounded text-indigo-600" /><span>Indigenous Peoples Association</span></label>
              </div></div>
              <div className="mb-8"><h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Intervention Information</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label>Intervention Reviewed</label><div className="flex items-center h-12"><label className="flex items-center"><input type="checkbox" name="interventionReviewed" checked={newAssociation.interventionReviewed} onChange={handleInputChange} className="h-5 w-5 text-indigo-600 rounded" /><span className="ml-2">Yes</span></label></div></div>
                <div><label>Specific Intervention</label><input type="text" name="specificIntervention" value={newAssociation.specificIntervention} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"/></div>
                <div><label>Amount</label><input type="text" name="interventionAmount" value={newAssociation.interventionAmount} onChange={handleInputChange} className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl"/></div>
              </div></div>
            </div>
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl sticky bottom-0 bg-white">
              <div className="flex justify-end space-x-4">
                <button onClick={()=>setIsEditModalOpen(false)} className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpdateAssociation} className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 shadow-lg flex items-center"><FiSave className="mr-2 text-lg" />Update Association</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedAssociation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50"><h3 className="text-2xl font-bold text-gray-900">Confirm Deletion</h3></div>
            <div className="p-8"><div className="flex flex-col items-center justify-center mb-6"><div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-4"><FiTrash2 className="w-8 h-8 text-red-600" /></div><p className="text-center text-lg font-medium text-gray-800 mb-2">Are you sure you want to delete this association?</p><p className="text-center text-gray-600 mb-6">This action cannot be undone.</p><div className="bg-red-50 border border-red-200 rounded-2xl p-5 w-full mb-6"><p className="font-bold text-lg text-red-800 mb-1">{selectedAssociation.name}</p><div className="flex flex-col space-y-1 text-sm text-red-600"><p><span className="font-medium">Province:</span> {selectedAssociation.province}</p><p><span className="font-medium">Municipality:</span> {selectedAssociation.municipality}</p><p><span className="font-medium">President:</span> {selectedAssociation.president}</p><p><span className="font-medium">Total Members:</span> {selectedAssociation.totalMembers}</p></div></div><div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 w-full"><p className="text-sm text-yellow-800"><span className="font-bold">⚠️ Warning:</span> All data including member information will be permanently deleted from the system.</p></div></div></div>
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end space-x-4">
              <button onClick={()=>setIsDeleteModalOpen(false)} className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteAssociation} className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 shadow-lg">Delete Association</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedViewAssociation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between rounded-t-3xl sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Association Details</h3>
                <p className="text-sm text-gray-600 mt-1">Full information of the selected association</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:rotate-90">
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Association Name</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.name || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Province</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.province || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Municipality</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.municipality || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Complete Address</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.address || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Registration Type</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.registration_type || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">President</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.president || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.contact_number || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Commodity</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.commodity || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <p className="text-gray-900 font-medium">{selectedViewAssociation.status || "—"}</p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Members Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><label className="text-sm text-gray-600">Male Members:</label><p className="font-medium">{selectedViewAssociation.members?.male || "0"}</p></div>
                  <div><label className="text-sm text-gray-600">Female Members:</label><p className="font-medium">{selectedViewAssociation.members?.female || "0"}</p></div>
                  <div><label className="text-sm text-gray-600">Senior Citizens:</label><p className="font-medium">{selectedViewAssociation.members?.senior_citizen || "0"}</p></div>
                  <div><label className="text-sm text-gray-600">Differently-abled:</label><p className="font-medium">{selectedViewAssociation.members?.differently_abled || "0"}</p></div>
                  <div><label className="text-sm text-gray-600">Young Farmers:</label><p className="font-medium">{selectedViewAssociation.members?.young_farmer || "0"}</p></div>
                  <div><label className="text-sm text-gray-600">IPs:</label><p className="font-medium">{selectedViewAssociation.members?.ips || "0"}</p></div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Group Categories</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><label className="text-sm text-gray-600">Women-Led Group:</label><p className="font-medium">{selectedViewAssociation.groupCategories?.womenLed ? "Yes" : "No"}</p></div>
                  <div><label className="text-sm text-gray-600">Men-Led Group:</label><p className="font-medium">{selectedViewAssociation.groupCategories?.menLed ? "Yes" : "No"}</p></div>
                  <div><label className="text-sm text-gray-600">Senior Citizens Group:</label><p className="font-medium">{selectedViewAssociation.groupCategories?.seniorCitizensGroup ? "Yes" : "No"}</p></div>
                  <div><label className="text-sm text-gray-600">Persons with Disabilities Group:</label><p className="font-medium">{selectedViewAssociation.groupCategories?.personsWithDisabilitiesGroup ? "Yes" : "No"}</p></div>
                  <div><label className="text-sm text-gray-600">Young Farmers Organization:</label><p className="font-medium">{selectedViewAssociation.groupCategories?.youngFarmersOrganization ? "Yes" : "No"}</p></div>
                  <div><label className="text-sm text-gray-600">Indigenous Peoples Association:</label><p className="font-medium">{selectedViewAssociation.groupCategories?.indigenousPeoplesAssociation ? "Yes" : "No"}</p></div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Intervention Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-sm text-gray-600">Intervention Reviewed:</label><p className="font-medium">{selectedViewAssociation.interventionReviewed ? "Yes" : "No"}</p></div>
                  <div><label className="text-sm text-gray-600">Specific Intervention:</label><p className="font-medium">{selectedViewAssociation.specificIntervention || "—"}</p></div>
                  <div><label className="text-sm text-gray-600">Amount:</label><p className="font-medium">{selectedViewAssociation.interventionAmount || "—"}</p></div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl sticky bottom-0 bg-white">
              <div className="flex justify-end space-x-4">
                <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400">
                  Close
                </button>
                <button onClick={handleEditFromView} className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center">
                  <FiEdit2 className="mr-2 text-lg" /> Edit
                </button>
                <button onClick={handleDeleteFromView} className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center">
                  <FiTrash2 className="mr-2 text-lg" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}