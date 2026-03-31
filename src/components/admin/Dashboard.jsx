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

// Predefined color palette for province bars (enterprise colors)
const PROVINCE_COLORS = [
  "#1E3A8A", // Dark Blue
  "#0D9488", // Teal
  "#059669", // Emerald
  "#D97706", // Amber
  "#DC2626", // Red
  "#7C3AED", // Purple
  "#EC489A", // Pink
  "#14B8A6", // Turquoise
  "#F97316", // Orange
  "#6366F1", // Indigo
];

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-gray-600">{message}</p>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Group category counts for bar chart (based on association counts)
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

  const regTypeColors = ["#10B981", "#3B82F6", "#F59E0B"];

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

  // Custom tooltip formatter for the province chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-green-600">
            Associations: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent mb-2">
              Agriculture Associations Dashboard
            </h1>
            <p className="text-gray-600">Enterprise‑level analytics and visualizations</p>
          </div>
          <div className="flex gap-3">
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

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4 mb-8">
        <div className="group bg-gradient-to-br from-white to-green-50 p-5 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Associations</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.totalAssociations || 0}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
              <FiUsers className="text-xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Members</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.totalMembers?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors">
              <FiUsers className="text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl shadow-lg border border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Active</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.activeAssociations || 0}
              </h3>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-200 transition-colors">
              <FiCheckCircle className="text-xl text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white to-purple-50 p-5 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">PWD Members</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.totalDifferentlyAbled?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-200 transition-colors">
              <FiAlertCircle className="text-xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white to-pink-50 p-5 rounded-2xl shadow-lg border border-pink-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Young Farmers</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.youngFarmersTotal?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="bg-pink-100 p-3 rounded-xl group-hover:bg-pink-200 transition-colors">
              <FiUser className="text-xl text-pink-600" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white to-indigo-50 p-5 rounded-2xl shadow-lg border border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">IPs</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.ipsTotal?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-xl group-hover:bg-indigo-200 transition-colors">
              <FiUsers className="text-xl text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white to-orange-50 p-5 rounded-2xl shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Senior Citizens</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.seniorCitizensTotal?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl group-hover:bg-orange-200 transition-colors">
              <FiUser className="text-xl text-orange-600" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white to-cyan-50 p-5 rounded-2xl shadow-lg border border-cyan-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Municipalities</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analytics?.municipalitiesCount || 0}
              </h3>
            </div>
            <div className="bg-cyan-100 p-3 rounded-xl group-hover:bg-cyan-200 transition-colors">
              <FiBarChart2 className="text-xl text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 1 & 2: Group Categories & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Group Category Distribution</h3>
              <p className="text-sm text-gray-500">Number of associations by type</p>
            </div>
            <div className="bg-green-100 p-2 rounded-xl">
              <FiBarChart2 className="text-green-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupCategoryCounts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Status Overview</h3>
              <p className="text-sm text-gray-500">Active vs Inactive associations</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-xl">
              <FiPieChart className="text-blue-600" />
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
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === "Active" ? "#10B981" : "#EF4444"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Registration Type */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">MIMAROPA Registration Type</h3>
            <p className="text-sm text-gray-500">Number of associations by registration type (CDA, SEC, DOLE)</p>
          </div>
          <div className="bg-indigo-100 p-2 rounded-xl">
            <FiFileText className="text-indigo-600" />
          </div>
        </div>
        {registrationTypeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={registrationTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6">
                {registrationTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={regTypeColors[index % regTypeColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">No registration type data available</div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">FCAs by Province</h3>
            <p className="text-sm text-gray-500">Top 10 provinces with most associations</p>
          </div>
          <div className="bg-purple-100 p-2 rounded-xl">
            <FiBarChart2 className="text-purple-600" />
          </div>
        </div>
        {provinceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={provinceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="province" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count">
                {provinceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PROVINCE_COLORS[index % PROVINCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">No province data available</div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}