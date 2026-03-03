import { ref, deleteObject } from 'firebase/storage';
import { storage } from './cloudStorage';

/**
 * Deletes a file from Firebase Storage.
 * If the file doesn't exist (404), it's treated as success.
 * 
 * @param {string} filePath 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteFile = async (filePath) => {
  // Validate input
  if (!filePath || typeof filePath !== 'string') {
    console.warn('deleteFile called with invalid path:', filePath);
    return { success: false, message: 'Invalid file path' };
  }

  const fileRef = ref(storage, filePath);

  try {
    await deleteObject(fileRef);
    console.log(`✅ File deleted: ${filePath}`);
    return { success: true, message: 'File deleted' };
  } catch (error) {
    switch (error.code) {
      case 'storage/object-not-found':
        console.log(`⚠️ File not found, assuming already deleted: ${filePath}`);
        return { success: true, message: 'File already deleted' };
      case 'storage/unauthorized':
        console.error(`🚫 Permission denied for: ${filePath}`, error);
        return { success: false, message: 'Permission denied' };
      case 'storage/canceled':
        console.log('⏹️ Delete canceled');
        return { success: false, message: 'Canceled' };
      default:
        console.error(`❌ Unexpected error deleting ${filePath}:`, error);
        return { success: false, message: error.message || 'Unknown error' };
    }
  }
};