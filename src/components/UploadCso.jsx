import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, deleteObject, getDownloadURL } from "firebase/storage";
import { db } from "../config/firebase";
import { uploadFileToFirebase, storage } from "../config/cloudStorage";

import {
  FiFolder,
  FiFile,
  FiImage,
  FiFilm,
  FiGrid,
  FiList,
  FiPlus,
  FiUpload,
  FiTrash2,
  FiEdit,
  FiDownload,
  FiChevronRight,
  FiHome,
  FiCheckSquare,
  FiSquare,
  FiHardDrive,
} from "react-icons/fi";

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

const UploadCso = () => {
  const [currentPath, setCurrentPath] = useState("");
  const [pathSegments, setPathSegments] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Multi‑select state
  const [selectedItems, setSelectedItems] = useState([]);

  // Storage stats
  const [totalUsedBytes, setTotalUsedBytes] = useState(0);
  const [loadingStorage, setLoadingStorage] = useState(true);

  // -------------------- Storage stats --------------------
  const fetchTotalUsedBytes = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const filesQuery = query(
        collection(db, "csoUploads"),
        where("type", "==", "file")
      );
      const snapshot = await getDocs(filesQuery);
      const total = snapshot.docs.reduce((sum, doc) => {
        const size = doc.data().size || 0;
        return sum + size;
      }, 0);
      setTotalUsedBytes(total);
    } catch (error) {
      console.error("Error fetching storage usage:", error);
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  // Update stats after any change that affects file sizes
  const refreshStorageStats = useCallback(() => {
    fetchTotalUsedBytes();
  }, [fetchTotalUsedBytes]);

  useEffect(() => {
    fetchTotalUsedBytes();
  }, [fetchTotalUsedBytes]);

  // -------------------- Helper: Delete file from Storage --------------------
  const deleteFile = async (storagePath) => {
    if (!storagePath || typeof storagePath !== "string") {
      console.warn("deleteFile called with invalid path:", storagePath);
      return { success: false, message: "Invalid file path" };
    }

    const fileRef = ref(storage, storagePath);

    try {
      await deleteObject(fileRef);
      console.log(`✅ File deleted: ${storagePath}`);
      return { success: true, message: "File deleted" };
    } catch (error) {
      switch (error.code) {
        case "storage/object-not-found":
          console.log(`⚠️ File not found, assuming already deleted: ${storagePath}`);
          return { success: true, message: "File already deleted" };
        case "storage/unauthorized":
          console.error(`🚫 Permission denied for: ${storagePath}`, error);
          return { success: false, message: "Permission denied" };
        case "storage/canceled":
          console.log("⏹️ Delete canceled");
          return { success: false, message: "Canceled" };
        default:
          console.error(`❌ Unexpected error deleting ${storagePath}:`, error);
          return { success: false, message: error.message || "Unknown error" };
      }
    }
  };

  // -------------------- Fetch items for current path --------------------
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "csoUploads"),
        where("parent", "==", currentPath),
        orderBy("type", "desc"),
        orderBy("name", "asc")
      );
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(fetched);
      setSelectedItems([]);
    } catch (error) {
      if (
        error.code === "failed-precondition" ||
        error.message.includes("requires an index")
      ) {
        console.warn("Index not ready – falling back to client-side sorting");
        try {
          const fallbackQuery = query(
            collection(db, "csoUploads"),
            where("parent", "==", currentPath)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          let fetched = fallbackSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          fetched.sort((a, b) => {
            if (a.type === b.type) {
              return a.name.localeCompare(b.name);
            }
            return a.type === "folder" ? -1 : 1;
          });
          setItems(fetched);
          setSelectedItems([]);
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          setItems([]);
        }
      } else {
        console.error("Fetch error:", error);
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchItems();
    setPathSegments(currentPath ? currentPath.split("/") : []);
  }, [currentPath, fetchItems]);

  // -------------------- Create folder --------------------
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Folder name cannot be empty");
      return;
    }

    const fullPath = currentPath
      ? `${currentPath}/${newFolderName.trim()}`
      : newFolderName.trim();

    const exists = items.some(
      (item) => item.name === newFolderName.trim() && item.type === "folder"
    );
    if (exists) {
      alert("A folder with this name already exists");
      return;
    }

    try {
      await addDoc(collection(db, "csoUploads"), {
        name: newFolderName.trim(),
        type: "folder",
        parent: currentPath,
        path: fullPath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewFolderName("");
      setShowNewFolderInput(false);
      fetchItems();
    } catch (error) {
      console.error("Create folder error:", error);
      alert("Failed to create folder");
    }
  };

  // -------------------- Upload file --------------------
  const uploadFile = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    // Check storage limit
    const remainingBytes = STORAGE_LIMIT_BYTES - totalUsedBytes;
    if (selectedFile.size > remainingBytes) {
      alert(
        `Not enough storage space. Available: ${formatFileSize(
          remainingBytes
        )}, Required: ${formatFileSize(selectedFile.size)}`
      );
      return;
    }

    setUploading(true);

    try {
      const filePath = currentPath
        ? `csoUploads/${currentPath}/${selectedFile.name}`
        : `csoUploads/${selectedFile.name}`;

      const downloadUrl = await uploadFileToFirebase(selectedFile, filePath);
      const fileSize = selectedFile.size;

      await addDoc(collection(db, "csoUploads"), {
        name: selectedFile.name,
        type: "file",
        parent: currentPath,
        path: currentPath
          ? `${currentPath}/${selectedFile.name}`
          : selectedFile.name,
        fileUrl: downloadUrl,
        fileType: selectedFile.type,
        size: fileSize,
        storagePath: filePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSelectedFile(null);
      document.getElementById("file-upload").value = "";
      fetchItems();
      refreshStorageStats(); // update total used space
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // -------------------- Recursive folder delete --------------------
  const deleteFolderRecursive = async (folderPath) => {
    const q = query(
      collection(db, "csoUploads"),
      where("parent", "==", folderPath)
    );
    const snapshot = await getDocs(q);
    for (const childDoc of snapshot.docs) {
      const child = childDoc.data();
      if (child.type === "folder") {
        await deleteFolderRecursive(child.path);
      } else if (child.type === "file" && child.storagePath) {
        await deleteFile(child.storagePath);
      }
      await deleteDoc(doc(db, "csoUploads", childDoc.id));
    }
  };

  // -------------------- Delete single item --------------------
  const deleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      if (item.type === "file") {
        const storageResult = await deleteFile(item.storagePath);
        if (!storageResult.success) {
          alert(`Storage delete failed: ${storageResult.message}`);
          return;
        }
        await deleteDoc(doc(db, "csoUploads", item.id));
      } else {
        await deleteFolderRecursive(item.path);
        await deleteDoc(doc(db, "csoUploads", item.id));

        if (item.path === currentPath) {
          const parentPath = currentPath.split("/").slice(0, -1).join("/");
          setCurrentPath(parentPath);
          return;
        }
      }
      fetchItems();
      refreshStorageStats();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    }
  };

  // -------------------- Selection functions --------------------
  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  // Delete all selected items
  const deleteSelected = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Delete ${selectedItems.length} selected item(s)?`))
      return;

    for (const itemId of selectedItems) {
      const item = items.find((i) => i.id === itemId);
      if (!item) continue;

      try {
        if (item.type === "file") {
          const storageResult = await deleteFile(item.storagePath);
          if (storageResult.success) {
            await deleteDoc(doc(db, "csoUploads", item.id));
          } else {
            console.warn(
              `Skipping Firestore delete for ${item.name} due to storage error:`,
              storageResult.message
            );
          }
        } else {
          await deleteFolderRecursive(item.path);
          await deleteDoc(doc(db, "csoUploads", item.id));
        }
      } catch (error) {
        console.error(`Error deleting ${item.name}:`, error);
      }
    }

    setSelectedItems([]);
    fetchItems();
    refreshStorageStats();
  };

  // -------------------- Rename helpers --------------------
  const updateDescendantPaths = async (oldBasePath, newBasePath) => {
    const q = query(
      collection(db, "csoUploads"),
      where("parent", "==", oldBasePath)
    );
    const snapshot = await getDocs(q);
    for (const childDoc of snapshot.docs) {
      const child = childDoc.data();
      const newChildPath = child.path.replace(oldBasePath, newBasePath);
      const newChildParent = child.parent.replace(oldBasePath, newBasePath);

      await updateDoc(doc(db, "csoUploads", childDoc.id), {
        parent: newChildParent,
        path: newChildPath,
        updatedAt: serverTimestamp(),
      });

      if (child.type === "folder") {
        await updateDescendantPaths(child.path, newChildPath);
      } else {
        if (child.storagePath) {
          const newStoragePath = child.storagePath.replace(
            oldBasePath,
            newBasePath
          );
          await updateDoc(doc(db, "csoUploads", childDoc.id), {
            storagePath: newStoragePath,
          });
        }
      }
    }
  };

  const renameItem = async (item) => {
    const newName = window.prompt("Enter new name:", item.name);
    if (!newName || newName === item.name) return;
    if (newName.includes("/")) {
      alert("Name cannot contain '/'");
      return;
    }

    try {
      const newPath = item.parent ? `${item.parent}/${newName}` : newName;

      if (item.type === "file") {
        if (item.storagePath) {
          const oldStorageRef = ref(storage, item.storagePath);
          const url = await getDownloadURL(oldStorageRef);
          const response = await fetch(url);
          const blob = await response.blob();
          const newStoragePath = item.parent
            ? `csoUploads/${item.parent}/${newName}`
            : `csoUploads/${newName}`;
          const newDownloadUrl = await uploadFileToFirebase(
            new File([blob], newName, { type: item.fileType }),
            newStoragePath
          );
          await deleteObject(oldStorageRef);

          await updateDoc(doc(db, "csoUploads", item.id), {
            name: newName,
            path: newPath,
            fileUrl: newDownloadUrl,
            storagePath: newStoragePath,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        await updateDoc(doc(db, "csoUploads", item.id), {
          name: newName,
          path: newPath,
          updatedAt: serverTimestamp(),
        });
        await updateDescendantPaths(item.path, newPath);

        if (item.path === currentPath) {
          setCurrentPath(newPath);
          return;
        }
      }
      fetchItems();
      // Rename doesn't affect used space, so no need to refresh stats
    } catch (error) {
      console.error("Rename error:", error);
      alert("Rename failed");
    }
  };

  // -------------------- Navigation --------------------
  const navigateToFolder = (folderPath) => setCurrentPath(folderPath);
  const navigateBreadcrumb = (index) => {
    const path = pathSegments.slice(0, index + 1).join("/");
    setCurrentPath(path);
  };

  // -------------------- File utilities --------------------
  const downloadFile = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  };

  const renderPreview = (item) => {
    if (item.type !== "file") return;
    if (
      item.fileType?.startsWith("image/") ||
      item.fileType === "application/pdf"
    ) {
      window.open(item.fileUrl, "_blank");
    } else {
      downloadFile(item.fileUrl, item.name);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/"))
      return <FiImage className="text-lime-400" />;
    if (fileType?.startsWith("video/"))
      return <FiFilm className="text-emerald-400" />;
    if (fileType === "application/pdf")
      return <FiFile className="text-amber-400" />;
    return <FiFile className="text-gray-400" />;
  };

  // Progress percentage
  const usagePercent = (totalUsedBytes / STORAGE_LIMIT_BYTES) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-green-500 p-6">
      <div className="max-w-7xl mx-auto bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 bg-black/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FiFolder className="text-lime-300" />
                Department of Agriculture – Cloud Drive
              </h1>
              <p className="text-lime-200/70 mt-1">
                Secure file storage for the DA Encoding
              </p>
            </div>

            {/* Storage Usage Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 w-full md:w-64">
              <div className="flex items-center gap-2 text-white/80 mb-1">
                <FiHardDrive />
                <span className="text-sm font-medium">Storage Usage</span>
              </div>
              <div className="text-white text-sm">
                {formatFileSize(totalUsedBytes)} / {formatFileSize(STORAGE_LIMIT_BYTES)}
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                <div
                  className="bg-lime-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                ></div>
              </div>
              {usagePercent > 90 && (
                <p className="text-red-300 text-xs mt-1">
                  ⚠️ Almost full!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-4 flex flex-wrap items-center justify-between gap-4 bg-black/30">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-white/80 bg-white/5 px-4 py-2 rounded-full overflow-x-auto">
            <button
              onClick={() => setCurrentPath("")}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <FiHome /> Root
            </button>
            {pathSegments.map((seg, idx) => (
              <React.Fragment key={idx}>
                <FiChevronRight className="mx-1 text-white/40 flex-shrink-0" />
                <button
                  onClick={() => navigateBreadcrumb(idx)}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {seg}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all shadow-lg hover:shadow-green-500/30"
            >
              <FiPlus /> New Folder
            </button>

            <label className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer">
              <FiUpload />
              <span>Upload</span>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </label>

            {/* View Toggle */}
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-green-600 text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "list"
                    ? "bg-green-600 text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Selection Toolbar (appears when items are selected) */}
        {selectedItems.length > 0 && (
          <div className="px-8 py-3 bg-indigo-900/40 border-t border-indigo-500/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white">
                <strong>{selectedItems.length}</strong> item(s) selected
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-white/80 hover:text-white text-sm underline"
              >
                {selectedItems.length === items.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all"
            >
              <FiTrash2 /> Delete Selected
            </button>
          </div>
        )}

        {/* New Folder Input */}
        {showNewFolderInput && (
          <div className="px-8 py-4 bg-white/5 border-t border-white/10">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
              />
              <button
                onClick={createFolder}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewFolderInput(false)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Selected File Info */}
        {selectedFile && (
          <div className="px-8 py-4 bg-emerald-600/20 border-t border-emerald-500/50 flex items-center justify-between">
            <span className="text-white truncate max-w-md">
              Ready to upload: <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
            </span>
            <div className="flex gap-3">
              <button
                onClick={uploadFile}
                disabled={uploading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Confirm Upload"}
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-white/50">
              <FiFolder className="text-6xl mx-auto mb-4 opacity-30" />
              <p className="text-xl">This folder is empty</p>
              <p className="mt-2">Create a new folder or upload files</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
                  : "flex flex-col gap-2"
              }
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`
                    group relative bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all
                    ${viewMode === "grid" ? "p-5 flex flex-col items-center text-center" : "p-4 flex items-center gap-4"}
                  `}
                >
                  {/* Selection Checkbox - visible only on hover or when selected */}
                  <div
                    className={`
                      transition-opacity duration-200
                      ${viewMode === "grid" 
                        ? "absolute top-2 left-2 z-10" 
                        : "flex-shrink-0"}
                      ${
                        selectedItems.includes(item.id)
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }
                    `}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                      className="text-white/70 hover:text-white focus:outline-none"
                    >
                      {selectedItems.includes(item.id) ? (
                        <FiCheckSquare size={viewMode === "grid" ? 20 : 18} />
                      ) : (
                        <FiSquare size={viewMode === "grid" ? 20 : 18} />
                      )}
                    </button>
                  </div>

                  {/* Icon */}
                  {item.type === "folder" ? (
                    <button
                      onClick={() => navigateToFolder(item.path)}
                      className={`flex-shrink-0 ${
                        viewMode === "grid" ? "text-6xl mb-3" : "text-3xl"
                      }`}
                    >
                      <FiFolder className="text-lime-400 hover:text-lime-300" />
                    </button>
                  ) : (
                    <button
                      onClick={() => renderPreview(item)}
                      className={`flex-shrink-0 ${
                        viewMode === "grid" ? "text-6xl mb-3" : "text-3xl"
                      }`}
                    >
                      {getFileIcon(item.fileType)}
                    </button>
                  )}

                  {/* Name & Details */}
                  <div className={`${viewMode === "grid" ? "w-full overflow-hidden px-1" : "flex-1 min-w-0"}`}>
                    <p className="text-white font-medium truncate" title={item.name}>
                      {item.name}
                    </p>
                    {item.type === "file" && (
                      <p className="text-white/50 text-sm mt-1 truncate">
                        {formatFileSize(item.size)}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div
                    className={`
                      flex gap-2
                      ${viewMode === "grid" 
                        ? "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition" 
                        : "ml-auto"}
                    `}
                  >
                    {item.type === "file" && (
                      <button
                        onClick={() => downloadFile(item.fileUrl, item.name)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
                        title="Download"
                      >
                        <FiDownload />
                      </button>
                    )}

                    <button
                      onClick={() => renameItem(item)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
                      title="Rename"
                    >
                      <FiEdit />
                    </button>

                    <button
                      onClick={() => deleteItem(item)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-300 hover:text-red-200"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadCso;