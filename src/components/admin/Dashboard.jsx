import React, { useState, useEffect, useMemo } from "react";
import {
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
  FiPieChart,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ======================================================================
// DESIGN SYSTEM — "Civic Registry" (matches the Accredited CSO registry)
// Paper/vellum ground, oxblood + brass accents, Fraunces for structure,
// IBM Plex Mono for every piece of record data (numbers, codes, dates).
// ======================================================================

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,550;9..144,650;9..144,700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`;

const ds = {
  page: "bg-[#F5F1E6] text-[#2A241C]",
  cardBase: "bg-[#FFFDF7] border border-[#DED2B4] rounded-lg shadow-[0_1px_2px_rgba(42,36,28,0.05)]",
  eyebrow: "font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B7F63]",
  label: "block font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B7F63]",
  mono: "font-['IBM_Plex_Mono']",
  display: "font-['Fraunces']",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#D8CDAE] text-[#2A241C] text-sm font-semibold rounded-md hover:bg-[#F1EADA] active:bg-[#E9E1CC] transition-colors duration-150",
};

// Coordinated palette for province bars — muted, registry-appropriate hues
const PROVINCE_COLORS = [
  "#7C2E2E", // Oxblood
  "#9A6B1F", // Brass
  "#3F6B4C", // Forest
  "#4A5F73", // Slate
  "#6B4A73", // Plum
  "#78614A", // Umber
  "#2F6B66", // Teal
  "#8A5A3C", // Rust
  "#5B6B3F", // Olive
  "#4A5A8A", // Indigo
];

const regTypeColors = ["#3F6B4C", "#4A5F73", "#9A6B1F"]; // CDA, SEC, DOLE

const STATUS_COLORS = { Active: "#3F6B4C", Inactive: "#7C2E2E" };

const STAMP_STYLES = {
  Active: "text-[#3F6B4C] border-[#3F6B4C]/50 bg-[#3F6B4C]/[0.07]",
  Inactive: "text-[#7C2E2E] border-[#7C2E2E]/50 bg-[#7C2E2E]/[0.07]",
};

const StatusStamp = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-[3px] border-2 font-['IBM_Plex_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] -rotate-1 ${
      STAMP_STYLES[status] || "text-[#5B5340] border-[#5B5340]/50 bg-[#5B5340]/[0.07]"
    }`}
  >
    {status || "Unknown"}
  </span>
);

const REG_TYPE_STYLES = {
  CDA: "text-[#3F6B4C] border-[#3F6B4C]/30 bg-[#3F6B4C]/10",
  SEC: "text-[#4A5F73] border-[#4A5F73]/30 bg-[#4A5F73]/10",
  DOLE: "text-[#9A6B1F] border-[#9A6B1F]/30 bg-[#9A6B1F]/10",
};

const RegTypeTag = ({ type }) => {
  const key = type?.toUpperCase();
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded border font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-wider ${
        REG_TYPE_STYLES[key] || "text-[#5B5340] border-[#5B5340]/30 bg-[#5B5340]/10"
      }`}
    >
      {type || "—"}
    </span>
  );
};

// Stat card used across the top row — index tab styled like a ledger seal
const StatCard = ({ label, value, icon: Icon, tint }) => (
  <div className={`${ds.cardBase} p-4 relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full`} style={{ backgroundColor: `${tint}14` }} />
    <div className="flex items-start justify-between relative">
      <div className="min-w-0">
        <p className={`${ds.eyebrow} truncate`}>{label}</p>
        <p className={`text-xl md:text-2xl font-bold mt-1.5 text-[#2A241C] ${ds.mono}`}>{value}</p>
      </div>
      <Icon className="h-6 w-6 flex-shrink-0" style={{ color: `${tint}99` }} strokeWidth={1.75} />
    </div>
  </div>
);

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative">
      <div className="w-14 h-14 border-4 border-[#DED2B4] rounded-full"></div>
      <div className="absolute top-0 left-0 w-14 h-14 border-4 border-[#7C2E2E] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className={`mt-4 text-sm text-[#8B7F63] ${ds.mono}`}>{message}</p>
  </div>
);

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
  if (!isOpen) return null;
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-[#1C1710]/60 backdrop-blur-[2px] p-4">
      <div className={`relative bg-[#FFFDF7] rounded-lg shadow-2xl w-full ${sizeClasses[size]} border border-[#DED2B4]`}>
        <div className="sticky top-0 bg-[#FFFDF7] rounded-t-lg px-6 py-4 border-b border-[#DED2B4] z-10">
          <div className="flex items-center justify-between">
            <h3 className={`text-xl sm:text-2xl font-semibold text-[#2A241C] ${ds.display}`}>{title}</h3>
            <button onClick={onClose} className="text-[#8B7F63] hover:text-[#2A241C] hover:bg-[#F1EADA] transition-colors p-1.5 rounded-md">
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "da-encode"));
      const allData = [];
      const docsArray = Array.from(querySnapshot.docs);
      for (const doc of docsArray) {
        const docData = doc.data();
        const provinceName = docData.province || "";
        if (provinceName && docData.municipalities) {
          docData.municipalities.forEach((municipality) => {
            if (municipality.associations) {
              municipality.associations.forEach((association) => {
                let status = "Inactive";
                if (association.status) {
                  if (association.status.active === "P") status = "Active";
                  else if (association.status.inactive === "P") status = "Inactive";
                }
                const members = {
                  male: association.members?.male || 0,
                  female: association.members?.female || 0,
                  senior_citizen: association.members?.senior_citizen || 0,
                  differently_abled: association.members?.differently_abled || 0,
                  young_farmer: association.members?.young_farmer || 0,
                  ips: association.members?.ips || 0,
                };
                const groupCategories = association.groupCategories || {
                  womenLed: false,
                  menLed: false,
                  seniorCitizensGroup: false,
                  personsWithDisabilitiesGroup: false,
                  youngFarmersOrganization: false,
                  indigenousPeoplesAssociation: false,
                };
                const totalMembers = Object.values(members).reduce(
                  (a, b) => a + (parseInt(b) || 0),
                  0
                );
                allData.push({
                  ...association,
                  province: provinceName,
                  municipality: municipality.municipality || municipality.name,
                  status,
                  members,
                  groupCategories,
                  totalMembers,
                });
              });
            }
          });
        }
      }
      setData(allData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (data.length === 0) return null;
    const totalAssociations = data.length;
    const totalMembers = data.reduce((sum, item) => sum + (item.totalMembers || 0), 0);
    const activeAssociations = data.filter((item) => item.status === "Active").length;
    const provincesCount = new Set(data.map((item) => item.province)).size;
    const municipalitiesCount = new Set(data.map((item) => item.municipality)).size;
    const totalDifferentlyAbled = data.reduce(
      (sum, item) => sum + (parseInt(item.members?.differently_abled) || 0),
      0
    );
    const youngFarmersTotal = data.reduce(
      (sum, item) => sum + (parseInt(item.members?.young_farmer) || 0),
      0
    );
    const ipsTotal = data.reduce(
      (sum, item) => sum + (parseInt(item.members?.ips) || 0),
      0
    );
    const seniorCitizensTotal = data.reduce(
      (sum, item) => sum + (parseInt(item.members?.senior_citizen) || 0),
      0
    );
    return {
      totalAssociations,
      totalMembers,
      activeAssociations,
      provincesCount,
      municipalitiesCount,
      totalDifferentlyAbled,
      youngFarmersTotal,
      ipsTotal,
      seniorCitizensTotal,
    };
  }, [data]);

  // Group category counts for bar chart
  const groupCategoryCounts = useMemo(() => {
    const counts = {
      "Women-Led": data.filter((item) => item.groupCategories?.womenLed).length,
      "Men-Led": data.filter((item) => item.groupCategories?.menLed).length,
      "Senior Citizens": data.filter((item) => item.groupCategories?.seniorCitizensGroup).length,
      "PWD": data.filter((item) => item.groupCategories?.personsWithDisabilitiesGroup).length,
      "Young Farmers": data.filter((item) => item.groupCategories?.youngFarmersOrganization).length,
      "IP Association": data.filter((item) => item.groupCategories?.indigenousPeoplesAssociation).length,
    };
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Status pie data
  const statusData = useMemo(() => {
    const active = data.filter((item) => item.status === "Active").length;
    const inactive = data.filter((item) => item.status === "Inactive").length;
    return [
      { name: "Active", value: active },
      { name: "Inactive", value: inactive },
    ];
  }, [data]);

  const registrationTypeData = useMemo(() => {
    const allowedTypes = ["CDA", "SEC", "DOLE"];
    const counts = {};
    data.forEach((item) => {
      const type = item.registration_type;
      if (type && allowedTypes.includes(type.toUpperCase())) {
        const key = type.toUpperCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Province data for the third row (top 10 provinces with counts)
  const provinceData = useMemo(() => {
    const provinceCounts = data.reduce((acc, item) => {
      acc[item.province] = (acc[item.province] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(provinceCounts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  // Handle province bar click
  const handleProvinceClick = (provinceName) => {
    setSelectedProvince(provinceName);
    setModalOpen(true);
  };

  // Get associations for selected province
  const provinceAssociations = useMemo(() => {
    if (!selectedProvince) return [];
    return data.filter((item) => item.province === selectedProvince);
  }, [data, selectedProvince]);

  // Registration type breakdown for selected province
  const provinceRegTypeCounts = useMemo(() => {
    if (!selectedProvince) return [];
    const counts = {
      CDA: 0,
      SEC: 0,
      DOLE: 0,
    };
    provinceAssociations.forEach((assoc) => {
      const type = assoc.registration_type?.toUpperCase();
      if (type === "CDA") counts.CDA++;
      else if (type === "SEC") counts.SEC++;
      else if (type === "DOLE") counts.DOLE++;
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [provinceAssociations]);

  const provinceTotalAssociations = provinceAssociations.length;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`bg-[#FFFDF7] shadow-lg rounded-lg p-3 border border-[#DED2B4]`}>
          <p className={`font-semibold text-[#2A241C] ${ds.display}`}>{label}</p>
          <p className={`text-[#7C2E2E] text-sm ${ds.mono}`}>
            Associations: <span className="font-bold">{payload[0].value}</span>
          </p>
          <p className="text-[11px] text-[#8B7F63] mt-1">Click to view details</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`p-6 ${ds.page} flex-1 overflow-auto min-h-screen flex items-center justify-center`}>
        <style>{`${FONT_IMPORT}`}</style>
        <LoadingSpinner message="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 ${ds.page} flex-1 overflow-auto min-h-screen`}>
      <style>{`
        ${FONT_IMPORT}
        ::selection { background: rgba(124,46,46,0.18); }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b-2 border-[#2A241C]/10">
          <div>
            <p className={`${ds.eyebrow} mb-2`}>MIMAROPA Region · Department of Agriculture</p>
            <h1 className={`text-3xl md:text-[2.5rem] font-bold text-[#2A241C] ${ds.display} leading-tight`}>
              FCA Registration Analytics
            </h1>
            <p className="text-[#6B6350] mt-2 text-sm">Enterprise-level statistics and visualizations across the region</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={fetchData} className={ds.btnSecondary} title="Refresh Data">
              <FiRefreshCw className="text-base" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <StatCard label="Total Associations" value={analytics?.totalAssociations || 0} icon={FiUsers} tint="#7C2E2E" />
        <StatCard label="Total Members" value={(analytics?.totalMembers || 0).toLocaleString()} icon={FiUsers} tint="#4A5F73" />
        <StatCard label="Active" value={analytics?.activeAssociations || 0} icon={FiCheckCircle} tint="#3F6B4C" />
        <StatCard label="PWD Members" value={(analytics?.totalDifferentlyAbled || 0).toLocaleString()} icon={FiAlertCircle} tint="#6B4A73" />
        <StatCard label="Young Farmers" value={(analytics?.youngFarmersTotal || 0).toLocaleString()} icon={FiUser} tint="#8A5A3C" />
        <StatCard label="IPs" value={(analytics?.ipsTotal || 0).toLocaleString()} icon={FiUsers} tint="#4A5A8A" />
        <StatCard label="Senior Citizens" value={(analytics?.seniorCitizensTotal || 0).toLocaleString()} icon={FiUser} tint="#9A6B1F" />
        <StatCard label="Municipalities" value={analytics?.municipalitiesCount || 0} icon={FiBarChart2} tint="#2F6B66" />
      </div>

      {/* Row 1 & 2: Group Categories & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className={`${ds.cardBase} p-6`}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAE2CB]">
            <div>
              <h3 className={`text-base font-bold text-[#2A241C] ${ds.display}`}>Group Category Distribution</h3>
              <p className="text-xs text-[#8B7F63] mt-0.5">Number of associations by type</p>
            </div>
            <div className="bg-[#3F6B4C]/10 p-2 rounded-lg">
              <FiBarChart2 className="text-[#3F6B4C]" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupCategoryCounts} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE2CB" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: "#8B7F63", fontFamily: "IBM Plex Mono" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8B7F63", fontFamily: "IBM Plex Mono" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3F6B4C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${ds.cardBase} p-6`}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAE2CB]">
            <div>
              <h3 className={`text-base font-bold text-[#2A241C] ${ds.display}`}>Status Overview</h3>
              <p className="text-xs text-[#8B7F63] mt-0.5">Active vs Inactive associations</p>
            </div>
            <div className="bg-[#4A5F73]/10 p-2 rounded-lg">
              <FiPieChart className="text-[#4A5F73]" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#8B7F63"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#FFFDF7",
                  border: "1px solid #DED2B4",
                  borderRadius: "8px",
                  fontFamily: "IBM Plex Mono",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Registration Type */}
      <div className={`${ds.cardBase} p-6 mb-6`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAE2CB]">
          <div>
            <h3 className={`text-base font-bold text-[#2A241C] ${ds.display}`}>MIMAROPA Registration Type</h3>
            <p className="text-xs text-[#8B7F63] mt-0.5">Number of associations by registration type (CDA, SEC, DOLE)</p>
          </div>
          <div className="bg-[#9A6B1F]/10 p-2 rounded-lg">
            <FiFileText className="text-[#9A6B1F]" />
          </div>
        </div>
        {registrationTypeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={registrationTypeData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE2CB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8B7F63", fontFamily: "IBM Plex Mono" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8B7F63", fontFamily: "IBM Plex Mono" }} />
              <Tooltip
                contentStyle={{
                  background: "#FFFDF7",
                  border: "1px solid #DED2B4",
                  borderRadius: "8px",
                  fontFamily: "IBM Plex Mono",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "IBM Plex Mono" }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {registrationTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={regTypeColors[index % regTypeColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`text-center py-12 text-[#8B7F63] text-sm ${ds.mono}`}>No registration type data available</div>
        )}
      </div>

      {/* Third Row: FCAs by Province (clickable bars) */}
      <div className={`${ds.cardBase} p-6`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAE2CB]">
          <div>
            <h3 className={`text-base font-bold text-[#2A241C] ${ds.display}`}>FCAs by Province</h3>
            <p className="text-xs text-[#8B7F63] mt-0.5">Click on any bar to see detailed associations</p>
          </div>
          <div className="bg-[#6B4A73]/10 p-2 rounded-lg">
            <FiBarChart2 className="text-[#6B4A73]" />
          </div>
        </div>
        {provinceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={provinceData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE2CB" />
              <XAxis dataKey="province" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11, fill: "#8B7F63", fontFamily: "IBM Plex Mono" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8B7F63", fontFamily: "IBM Plex Mono" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                onClick={(data) => handleProvinceClick(data.province)}
                cursor="pointer"
                radius={[3, 3, 0, 0]}
              >
                {provinceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PROVINCE_COLORS[index % PROVINCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`text-center py-12 text-[#8B7F63] text-sm ${ds.mono}`}>No province data available</div>
        )}
      </div>

      {/* Modal for Province Details */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Associations in ${selectedProvince || ""}`}
        size="xl"
      >
        {selectedProvince && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`${ds.cardBase} p-4`}>
                <p className={ds.eyebrow}>Total FCAs</p>
                <p className={`text-2xl font-bold text-[#2A241C] mt-1.5 ${ds.mono}`}>{provinceTotalAssociations}</p>
              </div>
              <div className={`${ds.cardBase} p-4`}>
                <p className={ds.eyebrow}>Registration Types</p>
                <div className="flex flex-wrap gap-3 mt-2.5">
                  {provinceRegTypeCounts.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            item.name === "CDA" ? "#3F6B4C" : item.name === "SEC" ? "#4A5F73" : "#9A6B1F",
                        }}
                      ></span>
                      <span className={`text-xs font-medium text-[#3D362A] ${ds.mono}`}>
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                  {provinceRegTypeCounts.length === 0 && (
                    <span className="text-[#8B7F63] text-sm">No registration data</span>
                  )}
                </div>
              </div>
            </div>

            {/* Associations Table */}
            <div className={`${ds.cardBase} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#EFE7D2] border-b border-[#DED2B4]">
                    <tr>
                      <th className={`px-5 py-3 text-left ${ds.mono} text-[10px] font-semibold text-[#6B6350] uppercase tracking-[0.14em]`}>
                        Association Name
                      </th>
                      <th className={`px-5 py-3 text-left ${ds.mono} text-[10px] font-semibold text-[#6B6350] uppercase tracking-[0.14em]`}>
                        Municipality
                      </th>
                      <th className={`px-5 py-3 text-left ${ds.mono} text-[10px] font-semibold text-[#6B6350] uppercase tracking-[0.14em]`}>
                        Registration Type
                      </th>
                      <th className={`px-5 py-3 text-left ${ds.mono} text-[10px] font-semibold text-[#6B6350] uppercase tracking-[0.14em]`}>
                        Status
                      </th>
                      <th className={`px-5 py-3 text-left ${ds.mono} text-[10px] font-semibold text-[#6B6350] uppercase tracking-[0.14em]`}>
                        Total Members
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE2CB]">
                    {provinceAssociations.map((assoc, idx) => (
                      <tr key={idx} className={`hover:bg-[#F1EADA]/70 transition-colors ${idx % 2 === 1 ? "bg-[#FBF8EF]/60" : ""}`}>
                        <td className={`px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-[#2A241C] ${ds.display}`}>
                          {assoc.name || "—"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-[#5B5340]">
                          {assoc.municipality || "—"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                          <RegTypeTag type={assoc.registration_type} />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                          <StatusStamp status={assoc.status} />
                        </td>
                        <td className={`px-5 py-3.5 whitespace-nowrap text-sm text-[#2A241C] ${ds.mono}`}>
                          {assoc.totalMembers?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {provinceAssociations.length === 0 && (
                  <div className={`text-center py-10 text-[#8B7F63] text-sm ${ds.mono}`}>No associations found for this province.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}