import React from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock 
} from 'lucide-react';

// Composant statistiques
const StatisticsPanel = ({ statistics, loading = false }) => {
  // Données par défaut si statistics est null/undefined
  const defaultStats = {
    total_admissions: 0,
    recent_admissions: 0,
    conversion_rate: 0,
    status_distribution: { submit: 0 }
  };

  // Utiliser les statistiques reçues ou les valeurs par défaut
  const stats = statistics || defaultStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 truncate">Total Admissions</p>
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-semibold text-gray-900">{stats.total_admissions}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 truncate">Récentes (30j)</p>
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-semibold text-gray-900">{stats.recent_admissions}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 truncate">Taux Conversion</p>
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-semibold text-gray-900">{stats.conversion_rate}%</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 truncate">En Attente</p>
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-semibold text-gray-900">{stats.status_distribution?.submit || 0}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel; 