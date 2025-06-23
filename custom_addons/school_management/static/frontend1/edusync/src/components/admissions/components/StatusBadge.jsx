import React from 'react';

// Composant badge de statut
const StatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
    submit: { label: 'Soumise', color: 'bg-blue-100 text-blue-800' },
    confirm: { label: 'Confirmée', color: 'bg-green-100 text-green-800' },
    reject: { label: 'Rejetée', color: 'bg-red-100 text-red-800' },
    cancel: { label: 'Annulée', color: 'bg-gray-100 text-gray-800' }
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge; 