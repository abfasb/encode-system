import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, UserPlus } from 'lucide-react';

const ProfileSelectionModal = () => {
  const { userDoc, addProfile, selectProfile, setShowProfileModal } = useAuth();
  const [newProfileName, setNewProfileName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const profiles = userDoc?.profiles || [];

  const handleAddProfile = async (e) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      const newProfile = await addProfile(newProfileName.trim());
      selectProfile(newProfile);
      setNewProfileName('');
      setIsAdding(false);
    }
  };

  const getRandomColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden transform transition-all animate-slideUp">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span role="img" aria-label="game">🎮</span>
            Choose Your Character
          </h2>
          <button
            onClick={() => setShowProfileModal(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Select a profile to continue. Each person should have their own character.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => selectProfile(profile)}
                className="group relative bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full ${getRandomColor(profile.name)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-center font-medium text-gray-800 group-hover:text-green-600">
                  {profile.name}
                </p>
              </button>
            ))}

            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <UserPlus className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-center font-medium text-gray-600">Add New</p>
              </button>
            ) : (
              <div className="border-2 border-green-500 rounded-xl p-4 bg-green-50 col-span-2 sm:col-span-1">
                <form onSubmit={handleAddProfile} className="flex flex-col h-full">
                  <label className="text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g., John"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-auto">
                    <button
                      type="submit"
                      disabled={!newProfileName.trim()}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 text-center">
            Your selected character will be used to track your reviews and actions.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionModal;