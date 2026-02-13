import React, { useState, useEffect, useRef } from "react";
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
  FiPlus,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiSave,
  FiGlobe,
} from "react-icons/fi";
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
      differently_abled: ""
    },
    commodity: "",
    status: { active: "P", inactive: null }
  });
  
  const [provincesData, setProvincesData] = useState([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  
  const tableRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
  try {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "da-encode"));
    const allData = [];
    const provincesList = [];
    let index = 1;

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      const provinceName = docData.province || "";
      
      if (provinceName) {
        // Store province data
        provincesList.push({
          id: doc.id,
          name: provinceName,
          municipalities: docData.municipalities || []
        });
        
        // Process municipalities and associations
        if (docData.municipalities && Array.isArray(docData.municipalities)) {
          docData.municipalities.forEach(municipality => {
            if (municipality.associations && Array.isArray(municipality.associations)) {
              municipality.associations.forEach((association, assocIndex) => {
                // Handle status logic
                let status = "Inactive";
                if (association.status) {
                  if (association.status.active === "P") {
                    status = "Active";
                  } else if (association.status.inactive === "P") {
                    status = "Inactive";
                  }
                }
                
                // Get member values - keep them empty if they're empty in the database
                const members = {
                  male: association.members?.male || "",
                  female: association.members?.female || "",
                  senior_citizen: association.members?.senior_citizen || "",
                  differently_abled: association.members?.differently_abled || ""
                };
                
                // Calculate total members (only count valid numbers)
                const totalMembers = (
                  (parseInt(association.members?.male) || 0) +
                  (parseInt(association.members?.female) || 0) +
                  (parseInt(association.members?.senior_citizen) || 0) +
                  (parseInt(association.members?.differently_abled) || 0)
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
                  createdAt: docData.createdAt?.toDate?.() || new Date()
                });
              });
            }
          });
        }
      }
    });

    setProvincesData(provincesList);
    setData(allData);
    setFilteredData(allData);
  } catch (error) {
    console.error("Error fetching data:", error);
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
        
        // Reset municipality filter if it's not in the new list
        if (filters.municipality && !municipalities.includes(filters.municipality)) {
          handleFilterChange("municipality", "");
        }
      }
    } else {
      setAvailableMunicipalities([]);
      handleFilterChange("municipality", "");
    }
  }, [filters.province, provincesData]);

  useEffect(() => {
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

    if (filters.registrationType) {
      result = result.filter(item => 
        item.registration_type?.toLowerCase().includes(filters.registrationType.toLowerCase())
      );
    }

    if (filters.commodity) {
      result = result.filter(item => 
        item.commodity?.toLowerCase().includes(filters.commodity.toLowerCase())
      );
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.president?.toLowerCase().includes(term) ||
        item.address?.toLowerCase().includes(term) ||
        item.commodity?.toLowerCase().includes(term) ||
        item.municipality?.toLowerCase().includes(term)
      );
    }

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
  }, [filters, data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FiChevronUp className="opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <FiChevronUp className="text-green-600" /> : 
      <FiChevronDown className="text-green-600" />;
  };

  const uniqueProvinces = [...new Set(data.map(item => item.province).filter(Boolean))].sort();
  const uniqueMunicipalities = [...new Set(data.map(item => item.municipality).filter(Boolean))].sort();
  const uniqueCommodities = [...new Set(data.map(item => item.commodity).filter(Boolean))].sort();
  const uniqueRegistrationTypes = [...new Set(data.map(item => item.registration_type).filter(Boolean))].sort();

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      province: "",
      municipality: "",
      status: "",
      registrationType: "",
      commodity: "",
      searchTerm: ""
    });
    setSortConfig({ key: null, direction: 'ascending' });
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
        differently_abled: ""
      },
      commodity: "",
      status: { active: "P", inactive: null }
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
        differently_abled: association.members?.differently_abled || ""
      },
      commodity: association.commodity || "",
      status: association.status === "Active" 
        ? { active: "P", inactive: null }
        : { active: null, inactive: "P" }
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (association) => {
    setSelectedAssociation(association);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
    } else {
      setNewAssociation(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddAssociation = async () => {
    try {
      if (!newAssociation.name || !newAssociation.province || !newAssociation.municipality || 
          !newAssociation.address || !newAssociation.president) {
        alert("Please fill in all required fields (*)");
        return;
      }

      // Find province document
      const provinceDoc = provincesData.find(p => p.name === newAssociation.province);
      
      if (!provinceDoc) {
        alert("Selected province not found in database");
        return;
      }

      // Create new association object
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
          differently_abled: newAssociation.members.differently_abled || ""
        },
        commodity: newAssociation.commodity,
        status: newAssociation.status
      };

      // Get current province document
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
        // Create new municipality
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
        municipalities: updatedMunicipalities
      });

      // Refresh data
      await fetchData();
      setIsAddModalOpen(false);
      alert("Association added successfully!");
    } catch (error) {
      console.error("Error adding association:", error);
      alert("Error adding association. Please try again.");
    }
  };

  // Update association
  const handleUpdateAssociation = async () => {
    try {
      if (!selectedAssociation) return;

      // Find province document
      const provinceDoc = provincesData.find(p => p.name === selectedAssociation.province);
      
      if (!provinceDoc) {
        alert("Province document not found");
        return;
      }

      // Get current province document
      const provinceRef = doc(db, "da-encode", provinceDoc.id);
      const provinceSnapshot = await getDocs(collection(db, "da-encode"));
      let currentProvinceData = null;
      
      provinceSnapshot.forEach((doc) => {
        if (doc.id === provinceDoc.id) {
          currentProvinceData = doc.data();
        }
      });

      if (!currentProvinceData) return;

      // Update the association in municipalities array
      const updatedMunicipalities = [...(currentProvinceData.municipalities || [])];
      
      if (selectedAssociation.municipalityIndex !== -1 && 
          selectedAssociation.associationIndex !== -1 &&
          updatedMunicipalities[selectedAssociation.municipalityIndex] &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations &&
          updatedMunicipalities[selectedAssociation.municipalityIndex].associations[selectedAssociation.associationIndex]) {
        
        // Update the specific association
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
          differently_abled: newAssociation.members.differently_abled || ""
        },
          commodity: newAssociation.commodity,
          status: newAssociation.status
        };

        await updateDoc(provinceRef, {
          municipalities: updatedMunicipalities
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
          municipalities: updatedMunicipalities
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

  const exportToExcel = () => {
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
        <td colspan="10" style="text-align:center; font-weight:bold; font-size:18px;">
          LIST OF REGISTERED ASSOCIATIONS
        </td>
      </tr>
      
      <!-- Empty row for spacing -->
      <tr style="height:15px;">
        <td colspan="10"></td>
        <td colspan="3" style="font-weight:bold;">
          LEGEND:
        </td>
      </tr>
      
      <tr>
        <td colspan="2"><strong>PROVINCE</strong></td>
        <td colspan="8">: MARINDUQUE</td>
        <td colspan="3" class="no-data" style="text-align:center;">NO DATA</td>
      </tr>
      
      <tr>
        <td colspan="2"><strong>MUNICIPALITY</strong></td>
        <td colspan="8">: TORRIJOS</td>
        <td colspan="3" class="no-registration" style="text-align:center;">NO REGISTRATION</td>
      </tr>
    </table>

       <br/>
        <table>
          <thead>
           <tr>
            <th rowspan="2" style="width: 50px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">No.</th>
            <th rowspan="2" style="width: 200px; border: 3px solid #000;  font-weight: bold; text-align: center; vertical-align: middle;">Name of Association</th>
            <th rowspan="2" style="width: 180px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Address</th>
            <th rowspan="2" style="width: 120px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Type of Registration<br/>(DOLE, CDA, SEC)</th>
            <th rowspan="2" style="width: 150px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Name of President</th>
            <th rowspan="2" style="width: 100px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Contact No.</th>
            <th colspan="4" style="color: black; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">No. of Members</th>
            <th rowspan="2" style="width: 120px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Commodity</th>
            <th colspan="2" style="color: black; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Status</th>
          </tr>
          <tr>
            <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Male</th>
            <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Female</th>
            <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Senior Citizen</th>
            <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Differently-abled Person</th>
            <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Active</th>
            <th style="color: white; color:black; width: 80px; border: 3px solid #000; font-weight: bold; text-align: center; vertical-align: middle;">Inactive</th>
          </tr>
          </thead>
          <tbody>
    `;

      filteredData.forEach((item) => {
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
            <td style="text-align: center">${item.no}</td>
            <td>${item.name || ""}</  td>
            <td>${item.address || ""}</td>
            <td class="${isRegEmpty ? 'no-registration' : ''}">${item.registration_type || ""}</td>
            <td>${item.president || ""}</td>
            <td>${item.contact_number || ""}</td>
            <td style="text-align: center">${displayMemberValue(item.members?.male)}</td>
            <td style="text-align: center">${displayMemberValue(item.members?.female)}</td>
            <td style="text-align: center">${displayMemberValue(item.members?.senior_citizen)}</td>
            <td class="${isDiffAbledEmpty ? 'no-data' : ''}" style="text-align: center">${displayMemberValue(item.members?.differently_abled)}</td>
            <td>${item.commodity || ""}</td>
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

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Agriculture Associations Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            .no-data { background-color: #fffacd; }
            .no-registration { background-color: #e0ffe0; }
            @media print {
              body { margin: 0; padding: 10px; }
              table { font-size: 9px; }
              @page { size: landscape; margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <h2>Agriculture Associations Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${filteredData.length}</p>
          <table>
            ${tableRef.current?.innerHTML || ''}
          </table>
          <div style="margin-top: 20px; font-size: 10px;">
            <p><strong>Note:</strong> This is a system-generated report.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const isDifferentlyAbledEmpty = (members) => {
    const value = members?.differently_abled;

    return (
      value === "" ||
      value === null ||
      value === undefined ||
      Number(value) === 0
    );
  };


  const isRegistrationEmpty = (registrationType) => {
    return !registrationType || registrationType === "";
  };

  const calculateAnalytics = () => {
    if (filteredData.length === 0) return null;

    const parseNumber = (value) => { if (value === "" || value === null || value === undefined) return 0; return parseInt(value) || 0; };

    const totalAssociations = filteredData.length;
    const totalMembers = filteredData.reduce(
      (sum, item) => sum + parseNumber(item.totalMembers),
      0
    );

    const activeAssociations = filteredData.filter(item => item.status === "Active").length;
    const provincesCount = new Set(filteredData.map(item => item.province)).size;
    const municipalitiesCount = new Set(filteredData.map(item => item.municipality)).size;
    
    const emptyDifferentlyAbled = filteredData.filter(item => 
      isDifferentlyAbledEmpty(item.members)
    ).length;
    
    const emptyRegistrations = filteredData.filter(item => 
      isRegistrationEmpty(item.registration_type)
    ).length;

    return {
      totalAssociations,
      totalMembers,
      activeAssociations,
      provincesCount,
      municipalitiesCount,
      emptyDifferentlyAbled,
      emptyRegistrations
    };
  };

  const analytics = calculateAnalytics();

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
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2 text-lg" />
            Add New Association
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
              <FiFilter className="mr-2 text-green-600" />
              Data Controls & Export
            </h3>
            <p className="text-sm text-gray-600">Filter, search, and export your association data</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
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

        <div className="bg-gradient-to-br from-white to-orange-50 p-5 rounded-2xl shadow-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Provinces</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.provincesCount || 0}</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <FiGlobe className="text-xl text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-pink-50 p-5 rounded-2xl shadow-lg border border-pink-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Municipalities</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.municipalitiesCount || 0}</h3>
            </div>
            <div className="bg-pink-100 p-3 rounded-xl">
              <FiHome className="text-xl text-pink-600" />
            </div>
          </div>
        </div>
      </div>

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
                {filteredData.length} association{filteredData.length !== 1 ? 's' : ''} found • Total: {data.length} associations
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Scroll horizontally →
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table 
            ref={tableRef}
            className="min-w-full divide-y divide-gray-200 text-sm"
            style={{ minWidth: '1600px' }}
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
                <th colSpan="4" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Members Breakdown
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-32">
                  Commodity
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
                  <td colSpan="17" className="px-6 py-12 text-center">
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
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200">
                    {/* No. */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 border-r border-gray-200">
                      {item.no}
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
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 min-w-32 truncate" title={item.commodity || ""}>
                      {item.commodity || "Not specified"}
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
                    
                    {/* Inactive Status */}
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
                          onClick={() => openEditModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105"
                          title="Edit Association"
                        >
                          <FiEdit2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                          title="Delete Association"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

      {/* Delete Confirmation Modal */}
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
      `}</style>
    </div>
  );
}