import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { deleteFile } from './deleteFile';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'uploads'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fileData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFiles(fileData);
      setLoading(false);
    }, (error) => {
      console.error('Firestore subscription error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (fileId, filePath) => {
    // Show loading state for this item
    setDeleteStatus(prev => ({ ...prev, [fileId]: 'deleting' }));

    try {
      // 1. Delete from Storage (handles already‑missing files)
      const storageResult = await deleteFile(filePath);

      // 2. If storage deletion succeeded (or file was missing), delete Firestore doc
      if (storageResult.success) {
        await deleteDoc(doc(db, 'uploads', fileId));
        console.log(`🔥 Firestore document ${fileId} deleted`);
        setDeleteStatus(prev => ({ ...prev, [fileId]: 'success' }));
      } else {
        // Storage deletion failed – show error, don't delete Firestore doc
        setDeleteStatus(prev => ({ ...prev, [fileId]: 'error' }));
        alert(`Storage delete failed: ${storageResult.message}`);
      }
    } catch (error) {
      console.error('Delete operation crashed:', error);
      setDeleteStatus(prev => ({ ...prev, [fileId]: 'error' }));
      alert('An unexpected error occurred during deletion.');
    }
  };

  if (loading) return <div>Loading files...</div>;

  return (
    <div>
      <h2>Uploaded Files</h2>
      {files.length === 0 && <p>No files found.</p>}
      <ul>
        {files.map(file => (
          <li key={file.id} style={{ marginBottom: '10px' }}>
            <span>
              {file.name || file.fileName || 'Unnamed'} 
              {file.path && <small style={{ color: '#666' }}> ({file.path})</small>}
            </span>
            <button
              onClick={() => handleDelete(file.id, file.path)}
              disabled={deleteStatus[file.id] === 'deleting'}
              style={{ marginLeft: '15px' }}
            >
              {deleteStatus[file.id] === 'deleting' ? 'Deleting...' : 'Delete'}
            </button>
            {deleteStatus[file.id] === 'success' && (
              <span style={{ color: 'green', marginLeft: '10px' }}>✓ Deleted</span>
            )}
            {deleteStatus[file.id] === 'error' && (
              <span style={{ color: 'red', marginLeft: '10px' }}>✗ Failed</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList;