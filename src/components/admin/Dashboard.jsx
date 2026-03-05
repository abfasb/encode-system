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
} from "react-icons/fi";
import { collection, getDocs, doc, setDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import * as XLSX from 'xlsx';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};

const MemoizedTableRow = React.memo(({ 
  item, 
  index, 
  openEditModal, 
  openDeleteModal, 
  isDifferentlyAbledEmpty, 
  isRegistrationEmpty 
}) => {
  const handleEditClick = useCallback(() => {
    openEditModal(item);
  }, [openEditModal, item]);

  const handleDeleteClick = useCallback(() => {
    openDeleteModal(item);
  }, [openDeleteModal, item]);

  return (
    <tr className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200">
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
        <div className="text-sm text-gray-900">
          {item.registration_type || "Not specified"}
        </div>
      </td>
      
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-40 truncate" title={item.president || ""}>
        {item.president || ""}
      </td>
      
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-32">
        {item.contact_number ? (
          <a 
            href={`tel:${item.contact_number}`}
            className="text-green-600 hover:text-green-800 font-medium"
          >
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
      
      {/* Young Farmer Column */}
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        <span className="font-semibold">{item.members?.young_farmer || ""}</span>
      </td>
      
      {/* IPs Column */}
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
        <span className="font-semibold">{item.members?.ips || ""}</span>
      </td>
      
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-32 truncate" title={item.commodity || ""}>
        {item.commodity || "Not specified"}
      </td>

      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-32 truncate" title={item.specificIntervention || ""}>
        {item.specificIntervention || "-"}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-24">
        {item.interventionAmount || "-"}
      </td>
      
      <td className="px-4 py-3 whitespace-nowrap text-center border-r border-gray-200">
        {item.status === "Active" ? (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <FiCheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        ) : (
          ""
        )}
      </td>
      
      <td className="px-4 py-3 whitespace-nowrap text-center">
        {item.status === "Inactive" ? (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 bg-red-100 border border-red-300 rounded-full flex items-center justify-center">
              <FiXCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
          </div>
        ) : (
          ""
        )}
      </td>
      
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={handleEditClick}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105"
            title="Edit Association"
          >
            <FiEdit2 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
            title="Delete Association"
          >
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
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }
    
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
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <FiChevronLeft className="w-4 h-4" />
          <FiChevronLeft className="w-4 h-4 -ml-3" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
        
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${
              currentPage === number 
                ? 'bg-green-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {number}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <FiChevronRight className="w-4 h-4" />
          <FiChevronRight className="w-4 h-4 -ml-3" />
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    dateRange: "all",
    actionType: "all",
    user: "",
    search: ""
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    province: "",
    municipality: "",
    status: "",
    registrationType: "",
    commodity: "",
    searchTerm: ""
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMunicipalityModalOpen, setIsMunicipalityModalOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  
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
      young_farmer: "", // Added Young Farmer
      ips: "" // Added IPs
    },
    commodity: "",
    status: { active: "P", inactive: null },
    // New intervention fields
    interventionReviewed: false,
    specificIntervention: "",
    interventionAmount: ""
  });
  
  // Location data states
  const [provincesData, setProvincesData] = useState([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  
  // Import states
  const [excelData, setExcelData] = useState([]);
  const [municipalityForImport, setMunicipalityForImport] = useState("");
  const [provinceForImport, setProvinceForImport] = useState("");
  const [importStatus, setImportStatus] = useState({
    loading: false,
    message: "",
    success: false,
    error: false
  });
  
  // Performance optimization states
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayedData, setDisplayedData] = useState([]);
  
  // Refs
  const tableRef = useRef(null);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData.length, itemsPerPage]);
  
  // Calculate displayed data for current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage, itemsPerPage]);
  
  // Memoized calculations for unique values
  const uniqueProvinces = useMemo(() => {
    return [...new Set(data.map(item => item.province).filter(Boolean))].sort();
  }, [data]);
  
  const uniqueMunicipalities = useMemo(() => {
    return [...new Set(data.map(item => item.municipality).filter(Boolean))].sort();
  }, [data]);
  
  const uniqueRegistrationTypes = useMemo(() => {
    return [...new Set(data.map(item => item.registration_type).filter(Boolean))].sort();
  }, [data]);
  
  const uniqueCommodities = useMemo(() => {
    return [...new Set(data.map(item => item.commodity).filter(Boolean))].sort();
  }, [data]);
  
  // Calculate analytics (updated to include new fields if needed)
  const analytics = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const parseNumber = (value) => { 
      if (value === "" || value === null || value === undefined) return 0; 
      return parseInt(value) || 0; 
    };
    
    const totalAssociations = filteredData.length;
    const totalMembers = filteredData.reduce(
      (sum, item) => sum + parseNumber(item.totalMembers),
      0
    );
    
    const activeAssociations = filteredData.filter(item => item.status === "Active").length;
    const provincesCount = new Set(filteredData.map(item => item.province)).size;
    const municipalitiesCount = new Set(filteredData.map(item => item.municipality)).size;
    
    const emptyDifferentlyAbled = filteredData.filter(item => {
      const value = item.members?.differently_abled;
      return (
        value === "" ||
        value === null ||
        value === undefined ||
        Number(value) === 0
      );
    }).length;
    
    const emptyRegistrations = filteredData.filter(item => {
      return !item.registration_type || item.registration_type === "";
    }).length;
    
    // Calculate total young farmers
    const totalYoungFarmers = filteredData.reduce(
      (sum, item) => sum + parseNumber(item.members?.young_farmer),
      0
    );
    
    // Calculate total IPs
    const totalIPs = filteredData.reduce(
      (sum, item) => sum + parseNumber(item.members?.ips),
      0
    );
    
    // Calculate total senior citizens
    const totalSeniorCitizens = filteredData.reduce(
      (sum, item) => sum + parseNumber(item.members?.senior_citizen),
      0
    );
    
    // Optional: counts for interventions
    const interventionsReviewed = filteredData.filter(item => item.interventionReviewed).length;
    
    return {
      totalAssociations,
      totalMembers,
      activeAssociations,
      provincesCount,
      municipalitiesCount,
      emptyDifferentlyAbled,
      emptyRegistrations,
      totalYoungFarmers,
      totalIPs,
      totalSeniorCitizens,
      interventionsReviewed // added
    };
  }, [filteredData]);

  const logAction = async (action, details = {}) => {
  try {
    await addDoc(collection(db, "audit-logs"), {
      user: "Admin",
      action,
      details,
      timestamp: new Date(),
      ipAddress: await getClientIP() 
    });
    
    fetchAuditLogs();
  } catch (error) {
    console.error("Error logging action:", error);
  }
};

const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return "Unknown";
  }
};

  
  // Initial data fetch
  useEffect(() => {
    fetchData();
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsImportModalOpen(false);
        setIsMunicipalityModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Fetch data from Firestore with performance optimizations
  const fetchData = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "da-encode"));
      const allData = [];
      const provincesList = [];
      let index = 1;
      
      // Process data in chunks to prevent UI freeze
      const chunkSize = 100;
      const docsArray = Array.from(querySnapshot.docs);
      
      for (let i = 0; i < docsArray.length; i += chunkSize) {
        const chunk = docsArray.slice(i, i + chunkSize);
        
        chunk.forEach((doc) => {
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
                      if (association.status.active === "P") {
                        status = "Active";
                      } else if (association.status.inactive === "P") {
                        status = "Inactive";
                      }
                    }
                    
                    const members = {
                      male: association.members?.male || "",
                      female: association.members?.female || "",
                      senior_citizen: association.members?.senior_citizen || "",
                      differently_abled: association.members?.differently_abled || "",
                      young_farmer: association.members?.young_farmer || "", // Added
                      ips: association.members?.ips || "" // Added
                    };
                    
                    const totalMembers = (
                      (parseInt(association.members?.male) || 0) +
                      (parseInt(association.members?.female) || 0) +
                      (parseInt(association.members?.senior_citizen) || 0) +
                      (parseInt(association.members?.differently_abled) || 0) +
                      (parseInt(association.members?.young_farmer) || 0) + // Added
                      (parseInt(association.members?.ips) || 0) // Added
                    );
                    
                    allData.push({
                      id: `${doc.id}_${municipality.municipality || municipality.name || "unknown"}_${assocIndex}_${Date.now()}`,
                      firestoreId: doc.id,
                      provinceDocId: doc.id,
                      municipalityIndex: docData.municipalities.findIndex(m => 
                        (m.municipality || m.name) === (municipality.municipality || municipality.name)
                      ),
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
                      // New intervention fields (fallback if not exist)
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
        
        // Yield to main thread every chunk to prevent UI freeze
        if (i % chunkSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
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
  
  // Update available municipalities when province filter changes
  useEffect(() => {
    if (filters.province) {
      const selectedProvince = provincesData.find(p => p.name === filters.province);
      if (selectedProvince) {
        const municipalities = selectedProvince.municipalities.map(m => 
          m.municipality || m.name || ""
        ).filter(Boolean);
        setAvailableMunicipalities([...new Set(municipalities)]);
        
        if (filters.municipality && !municipalities.includes(filters.municipality)) {
          handleFilterChange("municipality", "");
        }
      }
    } else {
      setAvailableMunicipalities([]);
      handleFilterChange("municipality", "");
    }
  }, [filters.province, provincesData]);
  
  // Filter data with performance optimizations
  useEffect(() => {
    if (!data.length) return;
    
    setIsFiltering(true);
    
    // Use requestAnimationFrame for smooth filtering
    requestAnimationFrame(() => {
      let result = [...data];
      
      // Province filter
      if (filters.province) {
        result = result.filter(item => 
          item.province.toLowerCase() === filters.province.toLowerCase()
        );
      }
      
      // Municipality filter
      if (filters.municipality) {
        result = result.filter(item => 
          item.municipality.toLowerCase() === filters.municipality.toLowerCase()
        );
      }
      
      // Status filter
      if (filters.status) {
        result = result.filter(item => 
          item.status.toLowerCase() === filters.status.toLowerCase()
        );
      }
      
      // Registration type filter
      if (filters.registrationType) {
        result = result.filter(item => 
          item.registration_type?.toLowerCase().includes(filters.registrationType.toLowerCase())
        );
      }
      
      // Commodity filter
      if (filters.commodity) {
        result = result.filter(item => 
          item.commodity?.toLowerCase().includes(filters.commodity.toLowerCase())
        );
      }
      
      // Search term filter (using debounced value)
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
      
      // Sorting
      if (sortConfig.key) {
        result.sort((a, b) => {
          let aValue, bValue;
          
          if (sortConfig.key.startsWith('members.')) {
            const memberKey = sortConfig.key.split('.')[1];
            aValue = a.members?.[memberKey] || 0;
            bValue = b.members?.[memberKey] || 0;
          } else {
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
          }
          
          if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
          } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }
          
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
      }
      
      setFilteredData(result);
      setCurrentPage(1); // Reset to first page when filters change
      setIsFiltering(false);
    });
  }, [filters, data, sortConfig, debouncedSearchTerm]);
  
  // ==================== HANDLERS ====================
  
  // Filter change handler
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      province: "",
      municipality: "",
      status: "",
      registrationType: "",
      commodity: "",
      searchTerm: ""
    });
    setSortConfig({ key: null, direction: 'ascending' });
    setCurrentPage(1);
  }, []);
  
  // Sorting handler
  const requestSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);
  
  // Get sort icon
  const getSortIcon = useCallback((key) => {
    if (sortConfig.key !== key) {
      return <FiChevronUp className="opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <FiChevronUp className="text-green-600" /> : 
      <FiChevronDown className="text-green-600" />;
  }, [sortConfig]);
  
  // Open add modal
  const openAddModal = useCallback(() => {
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
        young_farmer: "", // Added
        ips: "" // Added
      },
      commodity: "",
      status: { active: "P", inactive: null },
      // New intervention fields
      interventionReviewed: false,
      specificIntervention: "",
      interventionAmount: ""
    });
    setIsAddModalOpen(true);
  }, []);
  
  // Open edit modal
  const openEditModal = useCallback((association) => {
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
      status: association.status === "Active" 
        ? { active: "P", inactive: null }
        : { active: null, inactive: "P" },
      // New intervention fields
      interventionReviewed: association.interventionReviewed || false,
      specificIntervention: association.specificIntervention || "",
      interventionAmount: association.interventionAmount || ""
    });
    setIsEditModalOpen(true);
  }, []);
  
  const openDeleteModal = useCallback((association) => {
    setSelectedAssociation(association);
    setIsDeleteModalOpen(true);
  }, []);
  
  // Open import modal
  const openImportModal = useCallback(() => {
    setIsImportModalOpen(true);
    setImportStatus({
      loading: false,
      message: "",
      success: false,
      error: false
    });
  }, []);
  
  // Form input change handler (updated to handle new fields)
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('members.')) {
      const memberField = name.split('.')[1];
      setNewAssociation(prev => ({
        ...prev,
        members: {
          ...prev.members,
          [memberField]: value
        }
      }));
    } else if (name === 'status') {
      setNewAssociation(prev => ({
        ...prev,
        status: value === "Active" 
          ? { active: "P", inactive: null }
          : { active: null, inactive: "P" }
      }));
    } else if (type === 'checkbox') {
      setNewAssociation(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setNewAssociation(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);
  
  // Add new association (updated to include new fields)
  const handleAddAssociation = async () => {
    try {
      if (!newAssociation.name || !newAssociation.province || !newAssociation.municipality || 
          !newAssociation.address || !newAssociation.president) {
        alert("Please fill in all required fields (*)");
        return;
      }
      
      const provinceDoc = provincesData.find(p => p.name === newAssociation.province);
      
      if (!provinceDoc) {
        alert("Selected province not found in database");
        return;
      }
      
      const newAssoc = {
        name: newAssociation.name,
        address: newAssociation.address,
        registration_type: newAssociation.registration_type,
        president: newAssociation.president,
        contact_number: newAssociation.contact_number,
        members: {
          male: newAssociation.members.male || "", 
          female: newAssociation.members.female || "", 
          senior_citizen: newAssociation.members.senior_citizen || "",
          differently_abled: newAssociation.members.differently_abled || "",
          young_farmer: newAssociation.members.young_farmer || "", // Added
          ips: newAssociation.members.ips || "" // Added
        },
        commodity: newAssociation.commodity,
        status: newAssociation.status,
        // New intervention fields
        interventionReviewed: newAssociation.interventionReviewed,
        specificIntervention: newAssociation.specificIntervention,
        interventionAmount: newAssociation.interventionAmount
      };
      
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      
      provinceSnapshot.forEach((doc) => {
        if (doc.id === provinceDoc.id) {
          currentProvinceData = doc.data();
        }
      });
      
      if (!currentProvinceData) {
        alert("Province data not found");
        return;
      }
      
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      let municipalityIndex = updatedMunicipalities.findIndex(m => 
        (m.municipality || m.name) === newAssociation.municipality
      );
      
      if (municipalityIndex === -1) {
        updatedMunicipalities.push({
          municipality: newAssociation.municipality,
          associations: [newAssoc]
        });
      } else {
        updatedMunicipalities[municipalityIndex].associations = [
          ...(updatedMunicipalities[municipalityIndex].associations || []),
          newAssoc
        ];
      }
      
      await updateDoc(provinceRef, {
        municipalities: updatedMunicipalities,
        updatedAt: new Date()
      });
      
      await fetchData();
      await logAction("ADD_ASSOCIATION", {
      name: newAssociation.name,
      province: newAssociation.province,
      municipality: newAssociation.municipality,
      totalMembers: Object.values(newAssociation.members).reduce((a, b) => (+a || 0) + (+b || 0), 0)
    });
      setIsAddModalOpen(false);
      alert("Association added successfully!");
    } catch (error) {
      console.error("Error adding association:", error);
      alert("Error adding association. Please try again.");
    }
  };
  
  // Update association (updated to include new fields)
  const handleUpdateAssociation = async () => {
    try {
      if (!selectedAssociation) return;
      
      const provinceDoc = provincesData.find(p => p.name === selectedAssociation.province);
      
      if (!provinceDoc) {
        alert("Province document not found");
        return;
      }
      
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      
      provinceSnapshot.forEach((doc) => {
        if (doc.id === provinceDoc.id) {
          currentProvinceData = doc.data();
        }
      });
      
      if (!currentProvinceData) return;
      
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      
      if (selectedAssociation.municipalityIndex !== -1 && 
          selectedAssociation.associationIndex !== -1 &&
          updatedMunicipalities[selectedAssociation.municipalityIndex] &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations[selectedAssociation.associationIndex]) {
        
        updatedMunicipalities[selectedAssociation.municipalityIndex].associations[selectedAssociation.associationIndex] = {
          name: newAssociation.name,
          address: newAssociation.address,
          registration_type: newAssociation.registration_type,
          president: newAssociation.president,
          contact_number: newAssociation.contact_number,
          members: {
            male: newAssociation.members.male || "", 
            female: newAssociation.members.female || "", 
            senior_citizen: newAssociation.members.senior_citizen || "",
            differently_abled: newAssociation.members.differently_abled || "",
            young_farmer: newAssociation.members.young_farmer || "", 
            ips: newAssociation.members.ips || "" 
          },
          commodity: newAssociation.commodity,
          status: newAssociation.status,
          // New intervention fields
          interventionReviewed: newAssociation.interventionReviewed,
          specificIntervention: newAssociation.specificIntervention,
          interventionAmount: newAssociation.interventionAmount
        };
        
        await updateDoc(provinceRef, {
          municipalities: updatedMunicipalities,
          updatedAt: new Date()
        });

       await logAction("UPDATE_ASSOCIATION", {
        id: selectedAssociation.id,
        name: newAssociation.name,
        province: newAssociation.province,
        municipality: newAssociation.municipality,
        changes: "Association details updated"
      });
        
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
      
      if (!provinceDoc) {
        alert("Province document not found");
        return;
      }
      
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      
      provinceSnapshot.forEach((doc) => {
        if (doc.id === provinceDoc.id) {
          currentProvinceData = doc.data();
        }
      });
      
      if (!currentProvinceData) return;
      
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      
      if (selectedAssociation.municipalityIndex !== -1 && 
          selectedAssociation.associationIndex !== -1 &&
          updatedMunicipalities[selectedAssociation.municipalityIndex] &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations) {
        
        updatedMunicipalities[selectedAssociation.municipalityIndex].associations.splice(
          selectedAssociation.associationIndex, 
          1
        );
        
        if (updatedMunicipalities[selectedAssociation.municipalityIndex].associations.length === 0) {
          updatedMunicipalities.splice(selectedAssociation.municipalityIndex, 1);
        }
        
        await updateDoc(provinceRef, {
          municipalities: updatedMunicipalities,
          updatedAt: new Date()
        });
        await logAction("DELETE_ASSOCIATION", {
          name: selectedAssociation.name,
          province: selectedAssociation.province,
          municipality: selectedAssociation.municipality
        });
        
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
    
    setImportStatus({
      loading: false,
      message: "",
      success: false,
      error: false
    });
    
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      alert("Please upload an Excel file (.xlsx, .xls) or CSV file");
      return;
    }
    
    setImportStatus({
      loading: true,
      message: "Reading Excel file...",
      success: false,
      error: false
    });
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          raw: false,
          defval: ""
        });
        
        if (jsonData.length === 0) {
          alert("The Excel file is empty or contains no data");
          return;
        }
        
        // Process data in chunks
        const transformedData = [];
        const chunkSize = 500;
        
        for (let i = 0; i < jsonData.length; i += chunkSize) {
          const chunk = jsonData.slice(i, i + chunkSize);
          
          chunk.forEach((row) => {
            const getValue = (keys) => {
              for (const key of keys) {
                if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                  return row[key].toString().trim();
                }
              }
              return "";
            };
            
            // Helper to get boolean from string "Yes"/"No"
            const getBoolean = (keys, defaultValue = false) => {
              const val = getValue(keys).toLowerCase();
              if (val === 'yes' || val === 'true' || val === '1') return true;
              if (val === 'no' || val === 'false' || val === '0') return false;
              return defaultValue;
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
                young_farmer: getValue(["Young Farmer", "Youth", "YOUNG FARMER", "YOUTH FARMER"]), // Added
                ips: getValue(["IPs", "Indigenous People", "INDIGENOUS", "IPS"]) // Added
              },
              commodity: getValue(["Commodity", "Products", "CROPS", "PRODUCE"]),
              status: {
                active: getValue(["Active", "Status"])?.toLowerCase() === "active" ? "P" : null,
                inactive: getValue(["Inactive", "Status"])?.toLowerCase() === "inactive" ? "P" : null
              },
              // New intervention fields
              specificIntervention: getValue(["Specific Intervention", "SPECIFIC INTERVENTION", "Intervention"]),
              interventionAmount: getValue(["Amount", "AMOUNT", "Intervention Amount"])
            });
          });
          
          // Yield to main thread
          if (i % chunkSize === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        const filteredData = transformedData.filter(item => item.name);
        
        setExcelData(filteredData);
        setIsMunicipalityModalOpen(true);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setImportStatus({
          loading: false,
          message: "",
          success: false,
          error: false
        });
        
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please check the file format.");
        setImportStatus({
          loading: false,
          message: "",
          success: false,
          error: false
        });
      }
    };
    
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      setImportStatus({
        loading: false,
        message: "",
        success: false,
        error: false
      });
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Handle municipality selection for import
  const handleMunicipalitySubmit = () => {
    if (!municipalityForImport.trim()) {
      alert("Please enter a municipality name");
      return;
    }
    
    if (!provinceForImport.trim()) {
      alert("Please select a province");
      return;
    }
    
    setIsMunicipalityModalOpen(false);
    setIsImportModalOpen(true);
  };
  
  // Process import to Firebase (updated to include new fields)
  const processImportToFirebase = async () => {
    try {
      setImportStatus({
        loading: true,
        message: "Starting import process...",
        success: false,
        error: false
      });
      
      if (!excelData || excelData.length === 0) {
        throw new Error("No data to import");
      }
      
      if (!provinceForImport || !municipalityForImport) {
        throw new Error("Province and municipality are required");
      }
      
      // Find existing province document
      const provinceDoc = provincesData.find(p => p.name === provinceForImport);
      
      let provinceRef;
      let currentProvinceData;
      
      if (provinceDoc) {
        provinceRef = doc(db, "da-encode", provinceDoc.id);
        const provinceSnapshot = await getDocs(collection(db, "da-encode"));
        
        provinceSnapshot.forEach((doc) => {
          if (doc.id === provinceDoc.id) {
            currentProvinceData = doc.data();
          }
        });
      } else {
        provinceRef = doc(collection(db, "da-encode"));
        currentProvinceData = {
          province: provinceForImport,
          municipalities: [],
          createdAt: new Date()
        };
        
        await setDoc(provinceRef, currentProvinceData);
      }
      
      // Process in chunks
      const chunkSize = 100;
      let importedCount = 0;
      
      for (let i = 0; i < excelData.length; i += chunkSize) {
        const chunk = excelData.slice(i, i + chunkSize);
        
        setImportStatus({
          loading: true,
          message: `Importing ${Math.min(i + chunkSize, excelData.length)} of ${excelData.length} associations...`,
          success: false,
          error: false
        });
        
        // Update municipalities array
        const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
        let municipalityIndex = updatedMunicipalities.findIndex(m => 
          (m.municipality || m.name) === municipalityForImport
        );
        
        if (municipalityIndex === -1) {
          updatedMunicipalities.push({
            municipality: municipalityForImport,
            associations: chunk
          });
        } else {
          updatedMunicipalities[municipalityIndex].associations = [
            ...(updatedMunicipalities[municipalityIndex].associations || []),
            ...chunk
          ];
        }
        
        // Update Firestore
        await updateDoc(provinceRef, {
          municipalities: updatedMunicipalities,
          updatedAt: new Date()
        });
        await logAction("BULK_IMPORT", {
        count: importedCount,
        province: provinceForImport,
        municipality: municipalityForImport,
        source: "Excel"
      });
        
        importedCount += chunk.length;
        currentProvinceData.municipalities = updatedMunicipalities;
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await fetchData();
      
      setImportStatus({
        loading: false,
        message: `Successfully imported ${importedCount} associations to ${municipalityForImport}, ${provinceForImport}`,
        success: true,
        error: false
      });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setImportStatus({
          loading: false,
          message: "",
          success: false,
          error: false
        });
        setIsImportModalOpen(false);
        setExcelData([]);
        setMunicipalityForImport("");
        setProvinceForImport("");
      }, 3000);
      
    } catch (error) {
      console.error("Error importing data:", error);
      setImportStatus({
        loading: false,
        message: `Import failed: ${error.message}`,
        success: false,
        error: true
      });
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
        "Young Farmer": "10", // Added
        "IPs": "5", // Added
        "Commodity": "Rice, Vegetables",
        "Status": "Active",
        // New intervention columns
        "Specific Intervention": "Seeds Distribution",
        "Amount": "100 bags"
      },
      {
        "Name of Association": "Another Farmers Group",
        "Complete Address": "Another Address, Another Barangay",
        "Type of Registration (DOLE, CDA, SEC)": "CDA",
        "Name of President": "Maria Santos",
        "Contact No.": "09234567890",
        "Male": "40",
        "Female": "35",
        "Senior Citizen": "10",
        "Differently-abled Person": "1",
        "Young Farmer": "8", // Added
        "IPs": "3", // Added
        "Commodity": "Corn, Livestock",
        "Status": "Active",
        "Specific Intervention": "",
        "Amount": ""
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
    if (filters.province) {
      displayProvince = filters.province;
    } else {
      const uniqueProvincesInFiltered = [...new Set(filteredData.map(item => item.province))];
      if (uniqueProvincesInFiltered.length === 1) {
        displayProvince = uniqueProvincesInFiltered[0];
      } else {
        displayProvince = `${uniqueProvincesInFiltered.length} PROVINCES`;
      }
    }
    
    if (filters.municipality) {
      displayMunicipality = filters.municipality;
    } else {
      const uniqueMunicipalitiesInFiltered = [...new Set(filteredData.map(item => item.municipality))];
      if (uniqueMunicipalitiesInFiltered.length === 1) {
        displayMunicipality = uniqueMunicipalitiesInFiltered[0];
      } else {
        displayMunicipality = `ALL MUNICIPALITIES`;
      }
    }
  } else {
    displayProvince = "NO DATA";
    displayMunicipality = "NO DATA";
  }
  
  if (displayProvince === "" || !displayProvince) {
    displayProvince = "ALL PROVINCES";
  }
  
  if (displayMunicipality === "" || !displayMunicipality) {
    displayMunicipality = "ALL MUNICIPALITIES";
  }

  let tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
          font-family: Arial, sans-serif;
          font-size: 11px;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
          text-align: center;
          border: 2px solid #000000;
          padding: 8px;
          vertical-align: middle;
        }
        td {
          border: 1px solid #d1d5db;
          padding: 6px;
          vertical-align: top;
        }
        .no-data {
          background-color: #fef3c7;
        }
        .no-registration {
          background-color: #d1fae5;
        }
      </style>
    </head>
    <body>
     <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
    <tr>
      <td colspan="16" style="text-align:center; font-weight:bold; font-size:18px;">
        LIST OF REGISTERED ASSOCIATIONS
      </td>
    </tr>
    
    <!-- Empty row for spacing -->
    <tr style="height:15px;">
      <td colspan="16"></td>
      <td colspan="3" style="font-weight:bold;">
        LEGEND:
      </td>
    </tr>
    
    <tr>
      <td colspan="2"><strong>PROVINCE</strong></td>
      <td colspan="14">: ${displayProvince}</td>
      <td colspan="3" class="no-data" style="text-align:center;">NO DATA</td>
    </tr>
    
    <tr>
      <td colspan="2"><strong>MUNICIPALITY</strong></td>
      <td colspan="14">: ${displayMunicipality}</td>
      <td colspan="3" class="no-registration" style="text-align:center;">NO REGISTRATION</td>
    </tr>
  </table>

     <br/>
      <table>
        <thead>
         <tr>
          <th rowspan="2" style="width: 50px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">No.</th>
          <th rowspan="2" style="width: 200px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Name of Association</th>
          <th rowspan="2" style="width: 180px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Address</th>
          <th rowspan="2" style="width: 120px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Type of Registration<br/>(DOLE, CDA, SEC)</th>
          <th rowspan="2" style="width: 150px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Name of President</th>
          <th rowspan="2" style="width: 100px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Contact No.</th>
          <th colspan="6" style="color: black; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">No. of Members</th>
          <th rowspan="2" style="width: 120px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Commodity</th>
          <!-- New Intervention Columns: parent header spans 3 columns -->
          <th colspan="3" style="color: black; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Intervention Reviewed</th>
          <th colspan="2" style="color: black; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Status</th>
        </tr>
        <tr>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Male</th>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Female</th>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Senior Citizen</th>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Differently-abled Person</th>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Young Farmer</th>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">IPs</th>
          <!-- Under "Intervention Reviewed": first subheader empty, then two visible headers -->
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;"></th>
          <th style="color: white; color:black; width: 150px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Specific Intervention</th>
          <th style="color: white; color:black; width: 100px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Amount</th>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Active</th>
          <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Inactive</th>
        </tr>
        </thead>
        <tbody>
  `;

    filteredData.forEach((item, index) => {
     const isDiffAbledEmpty =
      item.members?.differently_abled === "" ||
      item.members?.differently_abled === null ||
      item.members?.differently_abled === undefined ||
      Number(item.members?.differently_abled) === 0;

      const isRegEmpty = !item.registration_type || item.registration_type === "";
      
      const displayMemberValue = (value) => {
        if (value === "" || value === "0" || value === 0 || value === null || value === undefined) {
          return "";
        }
        return value;
      };
      
      tableHTML += `
        <tr>
          <td style="text-align: center">${index + 1}</td>
          <td>${item.name || ""}</td>
          <td>${item.address || ""}</td>
          <td class="${isRegEmpty ? 'no-registration' : ''}">${item.registration_type || ""}</td>
          <td>${item.president || ""}</td>
          <td>${item.contact_number || ""}</td>
          <td style="text-align: center">${displayMemberValue(item.members?.male)}</td>
          <td style="text-align: center">${displayMemberValue(item.members?.female)}</td>
          <td style="text-align: center">${displayMemberValue(item.members?.senior_citizen)}</td>
          <td class="${isDiffAbledEmpty ? 'no-data' : ''}" style="text-align: center">${displayMemberValue(item.members?.differently_abled)}</td>
          <td style="text-align: center">${displayMemberValue(item.members?.young_farmer)}</td>
          <td style="text-align: center">${displayMemberValue(item.members?.ips)}</td>
          <td>${item.commodity || ""}</td>
          <!-- Intervention data: first column (boolean) under parent, then two detail columns -->
          <td>${item.specificIntervention || "-"}</td>
          <td>${item.interventionAmount || "-"}</td>
          <td style="text-align: center">${item.status === "Active" ? "✓" : ""}</td>
          <td style="text-align: center">${item.status === "Inactive" ? "✓" : ""}</td>
        </tr>
      `;
    });

  tableHTML += `
        </tbody>
      </table>
      <div style="margin-top: 20px; font-size: 10px; color: #666;">
        <p><strong>Legend:</strong></p>
        <p>✓ - Checkmark indicates status</p>
        <p style="background-color: #fef3c7; padding: 4px; display: inline-block;">Yellow background - Empty differently-abled field</p>
        <p style="background-color: #d1fae5; padding: 4px; display: inline-block; margin-left: 10px;">Green background - Missing registration type</p>
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
  
  // Print table (updated to include new columns)
  const printTable = () => {
    if (filteredData.length > 500) {
      if (!window.confirm(`Printing ${filteredData.length} rows. This may take a moment. Continue?`)) {
        return;
      }
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Agriculture Associations Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 9px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            @media print {
              body { margin: 0; padding: 10px; }
              @page { size: landscape; margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <h2>Agriculture Associations Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${filteredData.length}</p>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Association Name</th>
                <th>Address</th>
                <th>Registration Type</th>
                <th>President</th>
                <th>Contact No.</th>
                <th>Male</th>
                <th>Female</th>
                <th>Senior Citizen</th>
                <th>Differently-abled</th>
                <th>Young Farmer</th>
                <th>IPs</th>
                <th>Commodity</th>
                <th>Intervention Reviewed</th>
                <th>Specific Intervention</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name || ""}</td>
                  <td>${item.address || ""}</td>
                  <td>${item.registration_type || ""}</td>
                  <td>${item.president || ""}</td>
                  <td>${item.contact_number || ""}</td>
                  <td>${item.members?.male || ""}</td>
                  <td>${item.members?.female || ""}</td>
                  <td>${item.members?.senior_citizen || ""}</td>
                  <td>${item.members?.differently_abled || ""}</td>
                  <td>${item.members?.young_farmer || ""}</td>
                  <td>${item.members?.ips || ""}</td>
                  <td>${item.commodity || ""}</td>
                  <td>${item.interventionReviewed ? "Yes" : "No"}</td>
                  <td>${item.specificIntervention || "-"}</td>
                  <td>${item.interventionAmount || "-"}</td>
                  <td>${item.status || ""}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };
  
  // Helper functions
  const isDifferentlyAbledEmpty = useCallback((members) => {
    const value = members?.differently_abled;
    return (
      value === "" ||
      value === null ||
      value === undefined ||
      Number(value) === 0
    );
  }, []);
  
  const isRegistrationEmpty = useCallback((registrationType) => {
    return !registrationType || registrationType === "";
  }, []);
  
  // Handle page change
  const handlePageChange = useCallback((pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [totalPages]);
  
  // Handle items per page change
  const handleItemsPerPageChange = useCallback((value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);
  
  // ==================== RENDER ====================
  
  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading associations data...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the latest information</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent mb-2">
              Agriculture Associations Dashboard
            </h1>
            <p className="text-gray-600">Comprehensive management system for agricultural associations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5"
            >
              <FiUpload className="mr-2 text-lg" />
              Import Excel
            </button>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5"
            >
              <FiPlus className="mr-2 text-lg" />
              Add New Association
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5"
              title="Refresh Data"
            >
              <FiRefreshCw className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input for Excel upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleExcelUpload}
        className="hidden"
      />

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
            <button
              onClick={downloadSampleTemplate}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow"
            >
              <FiFileText className="mr-2" />
              Download Template
            </button>
            <button
              onClick={printTable}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow"
            >
              <FiPrinter className="mr-2" />
              Print Report
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
            >
              <FiDownload className="mr-2" />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white to-green-50 p-5 rounded-2xl shadow-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Associations</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.totalAssociations || 0}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <FiUsers className="text-xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl shadow-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Members</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.totalMembers?.toLocaleString() || 0}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <FiUsers className="text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl shadow-lg border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Active</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.activeAssociations || 0}</h3>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl">
              <FiCheckCircle className="text-xl text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl shadow-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Missing Data</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.emptyDifferentlyAbled || 0}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <FiAlertCircle className="text-xl text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50 p-5 rounded-2xl shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">No Registration</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.emptyRegistrations || 0}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <FiAlertCircle className="text-xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-pink-50 p-5 rounded-2xl shadow-lg border border-pink-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Young Farmers</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.totalYoungFarmers?.toLocaleString() || 0}</h3>
            </div>
            <div className="bg-pink-100 p-3 rounded-xl">
              <FiUser className="text-xl text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-indigo-50 p-5 rounded-2xl shadow-lg border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">IPs</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.totalIPs?.toLocaleString() || 0}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-xl">
              <FiUsers className="text-xl text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 p-5 rounded-2xl shadow-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Senior Citizens</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.totalSeniorCitizens?.toLocaleString() || 0}</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <FiUser className="text-xl text-orange-600" />
            </div>
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
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
            <select
              value={filters.province}
              onChange={(e) => handleFilterChange("province", e.target.value)}
              className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
            >
              <option value="">All Provinces</option>
              {uniqueProvinces.map((province, index) => (
                <option key={index} value={province}>{province}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Municipality</label>
            <select
              value={filters.municipality}
              onChange={(e) => handleFilterChange("municipality", e.target.value)}
              className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              disabled={!filters.province}
            >
              <option value="">All Municipalities</option>
              {filters.province ? (
                availableMunicipalities.map((municipality, index) => (
                  <option key={index} value={municipality}>{municipality}</option>
                ))
              ) : (
                uniqueMunicipalities.map((municipality, index) => (
                  <option key={index} value={municipality}>{municipality}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Type</label>
            <select
              value={filters.registrationType}
              onChange={(e) => handleFilterChange("registrationType", e.target.value)}
              className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
            >
              <option value="">All Types</option>
              {uniqueRegistrationTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commodity</label>
            <select
              value={filters.commodity}
              onChange={(e) => handleFilterChange("commodity", e.target.value)}
              className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
            >
              <option value="">All Commodities</option>
              {uniqueCommodities.map((commodity, index) => (
                <option key={index} value={commodity}>{commodity}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search associations by name, president, address, commodity, or municipality..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            className="w-full text-black pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 md:px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Associations Database</h3>
              <p className="text-sm text-gray-600">
                {isFiltering ? "Filtering..." : `${filteredData.length} association${filteredData.length !== 1 ? 's' : ''} found • Total: ${data.length} associations`}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table 
            ref={tableRef}
            className="min-w-full divide-y divide-gray-200 text-sm"
            style={{ minWidth: '2200px' }}  // Increased to accommodate new columns
          >
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-16">
                  No.
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-48">
                  Association Name
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-48">
                  Complete Address
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-40">
                  Registration Type
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-40">
                  President
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-32">
                  Contact No.
                </th>
                <th colSpan="6" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Members Breakdown
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-32">
                  Commodity
                </th>
                {/* New Intervention Columns: parent header spans 3 columns */}
                <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Intervention Reviewed
                </th>
                <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-28">
                  Actions
                </th>
              </tr>
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer transition-colors duration-150"
                  onClick={() => requestSort('members.male')}
                >
                  <div className="flex items-center justify-between">
                    <span>Male</span>
                    <span className="ml-1">{getSortIcon('members.male')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer transition-colors duration-150"
                  onClick={() => requestSort('members.female')}
                >
                  <div className="flex items-center justify-between">
                    <span>Female</span>
                    <span className="ml-1">{getSortIcon('members.female')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28 hover:bg-gray-200 cursor-pointer transition-colors duration-150"
                  onClick={() => requestSort('members.senior_citizen')}
                >
                  <div className="flex items-center justify-between">
                    <span>Senior Citizen</span>
                    <span className="ml-1">{getSortIcon('members.senior_citizen')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-32 hover:bg-gray-200 cursor-pointer transition-colors duration-150"
                  onClick={() => requestSort('members.differently_abled')}
                >
                  <div className="flex items-center justify-between">
                    <span>Differently-abled</span>
                    <span className="ml-1">{getSortIcon('members.differently_abled')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28 hover:bg-gray-200 cursor-pointer transition-colors duration-150"
                  onClick={() => requestSort('members.young_farmer')}
                >
                  <div className="flex items-center justify-between">
                    <span>Young Farmer</span>
                    <span className="ml-1">{getSortIcon('members.young_farmer')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24 hover:bg-gray-200 cursor-pointer transition-colors duration-150"
                  onClick={() => requestSort('members.ips')}
                >
                  <div className="flex items-center justify-between">
                    <span>IPs</span>
                    <span className="ml-1">{getSortIcon('members.ips')}</span>
                  </div>
                </th>
                {/* Under "Intervention Reviewed": first subheader empty, then two visible headers */}
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24"></th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-32">
                  Specific Intervention
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24">
                  Active
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  Inactive
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="22" className="px-6 py-12 text-center">
                    <div className="text-gray-500 py-8">
                      <FiSearch className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-700">No associations found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search term</p>
                      <button
                        onClick={clearFilters}
                        className="mt-4 px-4 py-2 text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedData.map((item, index) => (
                  <MemoizedTableRow
                    key={item.id}
                    item={item}
                    index={(currentPage - 1) * itemsPerPage + index + 1}
                    openEditModal={openEditModal}
                    openDeleteModal={openDeleteModal}
                    isDifferentlyAbledEmpty={isDifferentlyAbledEmpty}
                    isRegistrationEmpty={isRegistrationEmpty}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredData.length}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        <div className="px-5 md:px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-bold">{filteredData.length}</span> of{" "}
              <span className="font-bold">{data.length}</span> associations • 
              <span className="ml-2 text-green-600 font-medium">
                {((filteredData.length / data.length) * 100).toFixed(1)}% of total
              </span>
            </div>
            <div className="mt-2 sm:mt-0">
              <div className="text-xs text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Last updated: {new Date().toLocaleDateString("en-US", {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-xs font-medium text-gray-600 mb-2">Total Male Members</div>
          <div className="text-xl font-bold text-gray-800">
            {filteredData.reduce((sum, item) => sum + (parseInt(item.members?.male) || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-pink-50 p-4 rounded-2xl border border-pink-200 shadow-sm">
          <div className="text-xs font-medium text-gray-600 mb-2">Total Female Members</div>
          <div className="text-xl font-bold text-gray-800">
            {filteredData.reduce((sum, item) => sum + (parseInt(item.members?.female) || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-orange-50 p-4 rounded-2xl border border-orange-200 shadow-sm">
          <div className="text-xs font-medium text-gray-600 mb-2">Total Senior Citizens</div>
          <div className="text-xl font-bold text-gray-800">
            {filteredData.reduce((sum, item) => sum + (parseInt(item.members?.senior_citizen) || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-xs font-medium text-gray-600 mb-2">Total Diff.-abled</div>
          <div className="text-xl font-bold text-gray-800">
            {filteredData.reduce((sum, item) => sum + (parseInt(item.members?.differently_abled) || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-pink-50 p-4 rounded-2xl border border-pink-200 shadow-sm">
          <div className="text-xs font-medium text-gray-600 mb-2">Total Young Farmers</div>
          <div className="text-xl font-bold text-gray-800">
            {filteredData.reduce((sum, item) => sum + (parseInt(item.members?.young_farmer) || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-sm">
          <div className="text-xs font-medium text-gray-600 mb-2">Total IPs</div>
          <div className="text-xl font-bold text-gray-800">
            {filteredData.reduce((sum, item) => sum + (parseInt(item.members?.ips) || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Municipality Selection Modal */}
      {isMunicipalityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-fadeIn"
          >
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Specify Location</h3>
                  <p className="text-sm text-gray-600 mt-1">Where are these associations located?</p>
                </div>
                <button
                  onClick={() => setIsMunicipalityModalOpen(false)}
                  className="p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:rotate-90"
                >
                  <FiX className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-800">Excel Data Preview</h4>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {excelData.length} associations found
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-3 py-2 text-black text-left">Association Name</th>
                        <th className="px-3 py-2 text-black text-left">President</th>
                        <th className="px-3 py-2 text-black text-left">Members</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.slice(0, 5).map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="px-3 text-black py-2 truncate max-w-xs">{item.name || "No name"}</td>
                          <td className="px-3 text-black py-2">{item.president || "No president"}</td>
                          <td className="px-3 text-black py-2">
                            M: {item.members?.male || "0"} | F: {item.members?.female || "0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {excelData.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      + {excelData.length - 5} more associations...
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={provinceForImport}
                    onChange={(e) => setProvinceForImport(e.target.value)}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Select Province</option>
                    {uniqueProvinces.map((province, index) => (
                      <option key={index} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={municipalityForImport}
                    onChange={(e) => setMunicipalityForImport(e.target.value)}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter municipality name (e.g., POLA, CALAPAN CITY)"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter the municipality where these associations are located. This will group all imported data under this municipality.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end space-x-4">
              <button
                onClick={() => setIsMunicipalityModalOpen(false)}
                className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleMunicipalitySubmit}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:-translate-y-0.5"
              >
                <FiPackage className="mr-2 text-lg" />
                Continue to Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl animate-fadeIn"
          >
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Confirm Import</h3>
                  <p className="text-sm text-gray-600 mt-1">Review the data before importing to database</p>
                </div>
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportStatus({
                      loading: false,
                      message: "",
                      success: false,
                      error: false
                    });
                  }}
                  className="p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:rotate-90"
                >
                  <FiX className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              {importStatus.message && (
                <div className={`mb-6 p-4 rounded-xl ${importStatus.success ? 'bg-green-50 border border-green-200' : importStatus.error ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center">
                    {importStatus.loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    ) : importStatus.success ? (
                      <FiCheckCircle className="text-green-600 mr-3" />
                    ) : importStatus.error ? (
                      <FiAlertCircle className="text-red-600 mr-3" />
                    ) : null}
                    <p className={`font-medium ${importStatus.success ? 'text-green-800' : importStatus.error ? 'text-red-800' : 'text-blue-800'}`}>
                      {importStatus.message}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Import Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Associations:</span>
                      <span className="font-bold text-lg">{excelData.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Province:</span>
                      <span className="font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {provinceForImport}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Municipality:</span>
                      <span className="font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        {municipalityForImport}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Members:</span>
                      <span className="font-bold">
                        {excelData.reduce((sum, item) => {
                          const male = parseInt(item.members?.male) || 0;
                          const female = parseInt(item.members?.female) || 0;
                          const senior = parseInt(item.members?.senior_citizen) || 0;
                          const pwd = parseInt(item.members?.differently_abled) || 0;
                          const young = parseInt(item.members?.young_farmer) || 0;
                          const ips = parseInt(item.members?.ips) || 0;
                          return sum + male + female + senior + pwd + young + ips;
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Data Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sample Association:</span>
                      <span className="font-medium truncate max-w-xs">
                        {excelData[0]?.name || "No data"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sample President:</span>
                      <span className="font-medium">{excelData[0]?.president || "No data"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sample Commodity:</span>
                      <span className="font-medium">{excelData[0]?.commodity || "No data"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sample Status:</span>
                      <span className="font-medium">
                        {excelData[0]?.status?.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4">First 5 Associations</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-3 py-2 text-left">No.</th>
                        <th className="px-3 py-2 text-left">Association Name</th>
                        <th className="px-3 py-2 text-left">President</th>
                        <th className="px-3 py-2 text-left">Members</th>
                        <th className="px-3 py-2 text-left">Commodity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.slice(0, 5).map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{index + 1}</td>
                          <td className="px-3 py-2 truncate max-w-xs" title={item.name}>
                            {item.name || "No name"}
                          </td>
                          <td className="px-3 py-2">{item.president || "No president"}</td>
                          <td className="px-3 py-2">
                            M: {item.members?.male || "0"} | F: {item.members?.female || "0"}
                          </td>
                          <td className="px-3 py-2">{item.commodity || "Not specified"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-l-yellow-500 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-bold">⚠️ Important:</span> This will {provincesData.find(p => p.name === provinceForImport) ? 'update' : 'create'} the province document and {excelData.some(item => item.municipality === municipalityForImport) ? 'add to' : 'create'} the municipality with {excelData.length} associations.
                </p>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between">
              <button
                onClick={downloadSampleTemplate}
                className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400 flex items-center"
              >
                <FiFileText className="mr-2" />
                Download Template
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportStatus({
                      loading: false,
                      message: "",
                      success: false,
                      error: false
                    });
                  }}
                  className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={processImportToFirebase}
                  disabled={importStatus.loading}
                  className={`px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:-translate-y-0.5 ${importStatus.loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                >
                  {importStatus.loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-2 text-lg" />
                      Confirm Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn"
          >
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Add New Association</h3>
                <p className="text-sm text-gray-600 mt-1">Fill in the details below to register a new association</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:rotate-90"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Association Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newAssociation.name}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter association name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="province"
                    value={newAssociation.province}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                    required
                  >
                    <option value="">Select Province</option>
                    {uniqueProvinces.map((province, index) => (
                      <option key={index} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="municipality"
                    value={newAssociation.municipality}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter municipality name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newAssociation.address}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter complete address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Type
                  </label>
                  <select
                    name="registration_type"
                    value={newAssociation.registration_type}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="DOLE">DOLE</option>
                    <option value="CDA">CDA</option>
                    <option value="SEC">SEC</option>
                    <option value="none">None</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    President Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="president"
                    value={newAssociation.president}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter president's full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={newAssociation.contact_number}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter contact number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Commodity
                  </label>
                  <input
                    type="text"
                    name="commodity"
                    value={newAssociation.commodity}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter main commodity"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newAssociation.status.active === "P" ? "Active" : "Inactive"}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Members Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Male Members</label>
                    <input
                      type="number"
                      name="members.male"
                      value={newAssociation.members.male}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Female Members</label>
                    <input
                      type="number"
                      name="members.female"
                      value={newAssociation.members.female}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Senior Citizens</label>
                    <input
                      type="number"
                      name="members.senior_citizen"
                      value={newAssociation.members.senior_citizen}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Differently-abled</label>
                    <input
                      type="number"
                      name="members.differently_abled"
                      value={newAssociation.members.differently_abled}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Young Farmer</label>
                    <input
                      type="number"
                      name="members.young_farmer"
                      value={newAssociation.members.young_farmer}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">IPs</label>
                    <input
                      type="number"
                      name="members.ips"
                      value={newAssociation.members.ips}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* New Intervention Information Section */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Intervention Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Intervention Reviewed</label>
                    <div className="flex items-center h-12">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="interventionReviewed"
                          checked={newAssociation.interventionReviewed}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700">Yes</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specific Intervention</label>
                    <input
                      type="text"
                      name="specificIntervention"
                      value={newAssociation.specificIntervention}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="e.g., Seeds, Mech, Credit, Extn"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                    <input
                      type="text"
                      name="interventionAmount"
                      value={newAssociation.interventionAmount}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="e.g., 100 bags, ₱50,000"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end space-x-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAssociation}
                className="px-8 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:-translate-y-0.5"
              >
                <FiSave className="mr-2 text-lg" />
                Save Association
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAssociation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn"
          >
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Association</h3>
                <p className="text-sm text-gray-600 mt-1">Update the details of this association</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:rotate-90"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-l-yellow-500 rounded-r-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Note:</span> Province and Municipality cannot be changed. 
                  If you need to move this association to a different location, please delete and create a new one.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Association Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newAssociation.name}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Province
                  </label>
                  <input
                    type="text"
                    value={newAssociation.province}
                    disabled
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Municipality
                  </label>
                  <input
                    type="text"
                    value={newAssociation.municipality}
                    disabled
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newAssociation.address}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Type
                  </label>
                  <select
                    name="registration_type"
                    value={newAssociation.registration_type}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="DOLE">DOLE</option>
                    <option value="CDA">CDA</option>
                    <option value="SEC">SEC</option>
                    <option value="none">None</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    President Name
                  </label>
                  <input
                    type="text"
                    name="president"
                    value={newAssociation.president}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={newAssociation.contact_number}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Commodity
                  </label>
                  <input
                    type="text"
                    name="commodity"
                    value={newAssociation.commodity}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newAssociation.status.active === "P" ? "Active" : "Inactive"}
                    onChange={handleInputChange}
                    className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Members Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Male Members</label>
                    <input
                      type="number"
                      name="members.male"
                      value={newAssociation.members.male}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Female Members</label>
                    <input
                      type="number"
                      name="members.female"
                      value={newAssociation.members.female}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Senior Citizens</label>
                    <input
                      type="number"
                      name="members.senior_citizen"
                      value={newAssociation.members.senior_citizen}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Differently-abled</label>
                    <input
                      type="number"
                      name="members.differently_abled"
                      value={newAssociation.members.differently_abled}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Young Farmer</label>
                    <input
                      type="number"
                      name="members.young_farmer"
                      value={newAssociation.members.young_farmer}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">IPs</label>
                    <input
                      type="number"
                      name="members.ips"
                      value={newAssociation.members.ips}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* New Intervention Information Section in Edit Modal */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">Intervention Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Intervention Reviewed</label>
                    <div className="flex items-center h-12">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="interventionReviewed"
                          checked={newAssociation.interventionReviewed}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700">Yes</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specific Intervention</label>
                    <input
                      type="text"
                      name="specificIntervention"
                      value={newAssociation.specificIntervention}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="e.g., Seeds, Mech, Credit, Extn"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                    <input
                      type="text"
                      name="interventionAmount"
                      value={newAssociation.interventionAmount}
                      onChange={handleInputChange}
                      className="w-full text-black px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="e.g., 100 bags, ₱50,000"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end space-x-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAssociation}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:-translate-y-0.5"
              >
                <FiSave className="mr-2 text-lg" />
                Update Association
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedAssociation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn"
          >
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <h3 className="text-2xl font-bold text-gray-900">Confirm Deletion</h3>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                  <FiTrash2 className="w-8 h-8 text-red-600" />
                </div>
                
                <p className="text-center text-lg font-medium text-gray-800 mb-2">
                  Are you sure you want to delete this association?
                </p>
                
                <p className="text-center text-gray-600 mb-6">
                  This action cannot be undone.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 w-full mb-6">
                  <p className="font-bold text-lg text-red-800 mb-1">{selectedAssociation.name}</p>
                  <div className="flex flex-col space-y-1 text-sm text-red-600">
                    <p><span className="font-medium">Province:</span> {selectedAssociation.province}</p>
                    <p><span className="font-medium">Municipality:</span> {selectedAssociation.municipality}</p>
                    <p><span className="font-medium">President:</span> {selectedAssociation.president}</p>
                    <p><span className="font-medium">Total Members:</span> {selectedAssociation.totalMembers}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 w-full">
                  <p className="text-sm text-yellow-800">
                    <span className="font-bold">⚠️ Warning:</span> All data including member information will be permanently deleted from the system.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAssociation}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Delete Association
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}