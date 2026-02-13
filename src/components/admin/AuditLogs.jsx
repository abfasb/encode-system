import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiActivity,
  FiUser,
  FiClock,
  FiEye,
  FiTrash2,
  FiLogIn,
  FiFilter,
  FiSearch,
  FiDownload,
  FiX,
  FiRefreshCw,
  FiDatabase,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiPlus,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiUserPlus,
  FiUserMinus,
  FiUploadCloud,
  FiEyeOff,
  FiKey,
  FiLock,
  FiUnlock,
  FiShield,
  FiGlobe,
  FiHome,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiTrendingUp,
  FiPieChart
} from "react-icons/fi";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

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

const ActionIcon = ({ actionType }) => {
  const iconMap = {
    "ADD_ASSOCIATION": <FiPlus className="text-green-600" />,
    "UPDATE_ASSOCIATION": <FiEdit className="text-blue-600" />,
    "DELETE_ASSOCIATION": <FiTrash2 className="text-red-600" />,
    "BULK_IMPORT": <FiUploadCloud className="text-purple-600" />,
    "LOGIN": <FiLogIn className="text-indigo-600" />,
    "LOGOUT": <FiLogIn className="text-gray-600 rotate-180" />,
    "VIEW_REPORT": <FiEye className="text-amber-600" />,
    "EXPORT_DATA": <FiDownload className="text-teal-600" />,
    "USER_CREATED": <FiUserPlus className="text-emerald-600" />,
    "USER_DELETED": <FiUserMinus className="text-rose-600" />,
    "PERMISSION_CHANGED": <FiLock className="text-orange-600" />,
    "LOGIN_FAILED": <FiAlertCircle className="text-red-500" />,
    "PASSWORD_CHANGED": <FiKey className="text-cyan-600" />,
    "SYSTEM_BACKUP": <FiDatabase className="text-violet-600" />
  };

  return iconMap[actionType] || <FiActivity className="text-gray-600" />;
};

const ActionBadge = ({ actionType }) => {
  const colorMap = {
    "ADD_ASSOCIATION": "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200",
    "UPDATE_ASSOCIATION": "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200",
    "DELETE_ASSOCIATION": "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200",
    "BULK_IMPORT": "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-200",
    "LOGIN": "bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border-indigo-200",
    "LOGOUT": "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200",
    "VIEW_REPORT": "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-200"
  };

  const actionLabels = {
    "ADD_ASSOCIATION": "Added Association",
    "UPDATE_ASSOCIATION": "Updated Association",
    "DELETE_ASSOCIATION": "Deleted Association",
    "BULK_IMPORT": "Bulk Import",
    "LOGIN": "User Login",
    "LOGOUT": "User Logout",
    "VIEW_REPORT": "Viewed Report",
    "EXPORT_DATA": "Exported Data",
    "USER_CREATED": "Created User",
    "USER_DELETED": "Deleted User",
    "PERMISSION_CHANGED": "Changed Permissions",
    "LOGIN_FAILED": "Failed Login",
    "PASSWORD_CHANGED": "Changed Password",
    "SYSTEM_BACKUP": "System Backup"
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorMap[actionType] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
      {actionLabels[actionType] || actionType}
    </span>
  );
};

const RiskLevelBadge = ({ riskLevel }) => {
  const config = {
    "HIGH": {
      color: "bg-gradient-to-r from-red-500 to-rose-500",
      text: "text-red-100",
      label: "High Risk"
    },
    "MEDIUM": {
      color: "bg-gradient-to-r from-amber-500 to-yellow-500",
      text: "text-amber-100",
      label: "Medium Risk"
    },
    "LOW": {
      color: "bg-gradient-to-r from-emerald-500 to-green-500",
      text: "text-emerald-100",
      label: "Low Risk"
    },
    "INFO": {
      color: "bg-gradient-to-r from-blue-500 to-cyan-500",
      text: "text-blue-100",
      label: "Informational"
    }
  };

  const level = config[riskLevel] || config.INFO;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${level.color} ${level.text}`}>
      {level.label}
    </span>
  );
};

const UserAvatar = ({ user, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg"
  };

  const colorVariants = [
    "bg-gradient-to-br from-blue-400 to-cyan-500",
    "bg-gradient-to-br from-green-400 to-emerald-500",
    "bg-gradient-to-br from-purple-400 to-violet-500",
    "bg-gradient-to-br from-amber-400 to-orange-500",
    "bg-gradient-to-br from-rose-400 to-pink-500",
    "bg-gradient-to-br from-indigo-400 to-blue-500"
  ];

  const getColor = (name) => {
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colorVariants[hash % colorVariants.length];
  };

  return (
    <div className={`${sizeClasses[size]} ${getColor(user)} rounded-full flex items-center justify-center text-white font-semibold shadow-lg`}>
      {user.charAt(0).toUpperCase()}
    </div>
  );
};

const TimeAgo = ({ timestamp }) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const diff = now - then;
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        setTimeAgo(`${days}d ago`);
      } else if (hours > 0) {
        setTimeAgo(`${hours}h ago`);
      } else if (minutes > 0) {
        setTimeAgo(`${minutes}m ago`);
      } else {
        setTimeAgo("Just now");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span className="font-medium">{timeAgo}</span>;
};

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActions: 0,
    uniqueUsers: 0,
    todayActions: 0,
    highRiskActions: 0
  });

  const [filters, setFilters] = useState({
    dateRange: "all",
    actionType: "all",
    user: "",
    search: "",
    riskLevel: "all"
  });

  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc"
  });

  const [expandedLog, setExpandedLog] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const debouncedSearch = useDebounce(filters.search, 300);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, "audit-logs");
      let q = query(logsRef, orderBy("timestamp", "desc"));
      
      const querySnapshot = await getDocs(q);
      const logsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp || new Date(),
          riskLevel: determineRiskLevel(data.action, data.details)
        });
      });

      setAuditLogs(logsData);
      setFilteredLogs(logsData);
      calculateStats(logsData);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setAuditLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Determine risk level
  const determineRiskLevel = (action, details) => {
    const highRiskActions = ["DELETE_ASSOCIATION", "USER_DELETED", "LOGIN_FAILED", "PASSWORD_CHANGED"];
    const mediumRiskActions = ["UPDATE_ASSOCIATION", "PERMISSION_CHANGED", "BULK_IMPORT"];
    
    if (highRiskActions.includes(action)) return "HIGH";
    if (mediumRiskActions.includes(action)) return "MEDIUM";
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "LOW";
    return "INFO";
  };

  // Calculate statistics
  const calculateStats = useCallback((logs) => {
    const uniqueUsers = new Set(logs.map(log => log.user));
    const today = new Date().toDateString();
    const todayActions = logs.filter(log => {
      const logDate = log.timestamp.toDate ? log.timestamp.toDate().toDateString() : new Date(log.timestamp).toDateString();
      return logDate === today;
    }).length;

    const highRiskActions = logs.filter(log => log.riskLevel === "HIGH").length;

    setStats({
      totalActions: logs.length,
      uniqueUsers: uniqueUsers.size,
      todayActions,
      highRiskActions
    });
  }, []);

  // Filter logs
  useEffect(() => {
    if (!auditLogs.length) return;

    let result = [...auditLogs];

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "yesterday":
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          const yesterdayEnd = new Date(startDate);
          yesterdayEnd.setHours(23, 59, 59, 999);
          result = result.filter(log => {
            const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
            return logDate >= startDate && logDate <= yesterdayEnd;
          });
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "custom":
          if (dateRange.startDate && dateRange.endDate) {
            const customStart = new Date(dateRange.startDate);
            const customEnd = new Date(dateRange.endDate);
            customEnd.setHours(23, 59, 59, 999);
            result = result.filter(log => {
              const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
              return logDate >= customStart && logDate <= customEnd;
            });
          }
          break;
      }

      if (filters.dateRange !== "custom" && filters.dateRange !== "yesterday") {
        result = result.filter(log => {
          const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
          return logDate >= startDate;
        });
      }
    }

    // Action type filter
    if (filters.actionType !== "all") {
      result = result.filter(log => log.action === filters.actionType);
    }

    // User filter
    if (filters.user) {
      result = result.filter(log => 
        log.user.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    // Risk level filter
    if (filters.riskLevel !== "all") {
      result = result.filter(log => log.riskLevel === filters.riskLevel);
    }

    // Search filter
    if (debouncedSearch) {
      const searchTerm = debouncedSearch.toLowerCase();
      result = result.filter(log =>
        log.user.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "timestamp") {
        aValue = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        bValue = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredLogs(result);
    setPage(1);
  }, [filters, debouncedSearch, sortConfig, auditLogs, dateRange]);

  // Get unique action types
  const uniqueActionTypes = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.action))].sort();
  }, [auditLogs]);

  // Get unique users
  const uniqueUsers = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.user))].sort();
  }, [auditLogs]);

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateRange: "all",
      actionType: "all",
      user: "",
      search: "",
      riskLevel: "all"
    });
    setDateRange({
      startDate: "",
      endDate: ""
    });
  };

  // Toggle sort
  const toggleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  // Toggle log details
  const toggleLogDetails = (logId) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Initial fetch
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAuditLogs]);

  if (loading && auditLogs.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-800 to-emerald-600 bg-clip-text text-transparent mb-3">
              Audit Trail Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Monitor all system activities and user actions in real-time</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAuditLogs}
              className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center transform hover:-translate-y-0.5"
            >
              <FiRefreshCw className="mr-2" />
              Refresh Data
            </button>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <span className="font-semibold text-green-600">{stats.totalActions}</span> total actions
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-2xl shadow-lg border border-green-200 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Actions</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalActions}</h3>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl shadow-lg">
              <FiActivity className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-100">
            <div className="flex items-center text-sm text-green-600">
              <FiTrendingUp className="mr-2" />
              <span>All system activities</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg border border-blue-200 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Active Users</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.uniqueUsers}</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg">
              <FiUsers className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="flex items-center text-sm text-blue-600">
              <FiUser className="mr-2" />
              <span>Unique users</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50 p-6 rounded-2xl shadow-lg border border-amber-200 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Today's Actions</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.todayActions}</h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-xl shadow-lg">
              <FiClock className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-100">
            <div className="flex items-center text-sm text-amber-600">
              <FiBarChart2 className="mr-2" />
              <span>Today's activities</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-2xl shadow-lg border border-red-200 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">High Risk Actions</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.highRiskActions}</h3>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-500 p-4 rounded-xl shadow-lg">
              <FiShield className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-100">
            <div className="flex items-center text-sm text-red-600">
              <FiAlertCircle className="mr-2" />
              <span>Requires attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
              <FiFilter className="mr-3 text-green-600" />
              Advanced Filters
            </h3>
            <p className="text-gray-600">Filter audit logs by different criteria</p>
          </div>
          <button
            onClick={clearFilters}
            className="mt-4 lg:mt-0 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Action Type</label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange("actionType", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
            >
              <option value="all">All Actions</option>
              {uniqueActionTypes.map((action, index) => (
                <option key={index} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
            >
              <option value="all">All Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
              <option value="INFO">Informational</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User</label>
            <select
              value={filters.user}
              onChange={(e) => handleFilterChange("user", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((user, index) => (
                <option key={index} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>

        {filters.dateRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              />
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search actions, users, IP addresses, or details..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Activity Logs</h3>
              <p className="text-gray-600">
                {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortConfig.key}
                  onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  <option value="timestamp">Timestamp</option>
                  <option value="user">User</option>
                  <option value="action">Action</option>
                </select>
                <button
                  onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === "desc" ? "asc" : "desc" }))}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {sortConfig.direction === "desc" ? <FiChevronDown /> : <FiChevronUp />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500 py-8">
                      <FiSearch className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-700">No audit logs found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-gray-50 transition-all duration-200 cursor-pointer ${expandedLog === log.id ? 'bg-green-50' : ''}`}
                      onClick={() => toggleLogDetails(log.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 rounded-full font-bold text-sm">
                          {startIndex + index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <UserAvatar user={log.user} size="sm" />
                          <div>
                            <p className="font-semibold text-gray-800">{log.user}</p>
                            <p className="text-xs text-gray-500">User</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <ActionIcon actionType={log.action} />
                          </div>
                          <div>
                            <ActionBadge actionType={log.action} />
                            <p className="text-xs text-gray-500 mt-1">{log.action}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RiskLevelBadge riskLevel={log.riskLevel} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{formatTimestamp(log.timestamp)}</span>
                          <span className="text-xs text-gray-500">
                            <TimeAgo timestamp={log.timestamp} />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {log.ipAddress || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                          <FiChevronDown className={`transform transition-transform duration-200 ${expandedLog === log.id ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {expandedLog === log.id && (
                      <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
                        <td colSpan="7" className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                                <FiInfo className="mr-2 text-green-600" />
                                Action Details
                              </h4>
                              <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                            
                            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                                <FiGlobe className="mr-2 text-blue-600" />
                                Technical Information
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500">Document ID</p>
                                  <p className="text-sm font-mono text-gray-700 truncate">{log.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Full Timestamp</p>
                                  <p className="text-sm text-gray-700">{log.timestamp.toString()}</p>
                                </div>
                                {log.ipAddress && (
                                  <div>
                                    <p className="text-xs text-gray-500">IP Location</p>
                                    <p className="text-sm text-gray-700">From: {log.ipAddress}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-sm">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                                <FiShield className="mr-2 text-purple-600" />
                                Security Analysis
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <RiskLevelBadge riskLevel={log.riskLevel} />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {log.riskLevel === "HIGH" 
                                      ? "This action requires immediate attention and review." 
                                      : log.riskLevel === "MEDIUM" 
                                      ? "Monitor this type of action regularly."
                                      : "This is a routine system activity."}
                                  </p>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500">Recommendation</p>
                                  <p className="text-sm text-gray-700">
                                    {log.riskLevel === "HIGH" 
                                      ? "Review this action immediately and verify user permissions." 
                                      : log.riskLevel === "MEDIUM" 
                                      ? "Schedule a review of similar actions this week."
                                      : "No action required. This is normal system activity."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Showing <span className="font-bold">{startIndex + 1}</span> to{" "}
                <span className="font-bold">{Math.min(endIndex, filteredLogs.length)}</span> of{" "}
                <span className="font-bold">{filteredLogs.length}</span> logs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className={`p-2 rounded-lg ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${
                          page === pageNum 
                            ? 'bg-green-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`p-2 rounded-lg ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <FiPieChart className="mr-3 text-green-600" />
            Actions by Type
          </h3>
          <div className="space-y-4">
            {(() => {
              const actionCounts = {};
              filteredLogs.forEach(log => {
                actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
              });

              const totalActions = filteredLogs.length;
              return Object.entries(actionCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([action, count]) => {
                  const percentage = ((count / totalActions) * 100).toFixed(1);
                  return (
                    <div key={action} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 truncate">{action}</span>
                        <span className="font-semibold text-green-600">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{count} actions</span>
                        <span>{percentage}% of total</span>
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <FiUsers className="mr-3 text-blue-600" />
            Top Users by Activity
          </h3>
          <div className="space-y-4">
            {(() => {
              const userCounts = {};
              filteredLogs.forEach(log => {
                userCounts[log.user] = (userCounts[log.user] || 0) + 1;
              });

              return Object.entries(userCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([user, count], index) => (
                  <div key={user} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user}</p>
                        <p className="text-xs text-gray-500">{count} actions</p>
                      </div>
                    </div>
                    <UserAvatar user={user} size="sm" />
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>

      {/* Real-time Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
          <span className="text-sm font-medium">Live Audit Trail Active</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default AuditLogs;