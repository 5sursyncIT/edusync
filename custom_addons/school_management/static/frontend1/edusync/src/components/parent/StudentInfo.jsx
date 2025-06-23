import React, { useState, useEffect } from 'react';
import { parentAPI } from './ParentAPI';

// Composant Informations étudiant
const StudentInfo = ({ student }) => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentInfo();
  }, [student.id]);

  const loadStudentInfo = async () => {
    setLoading(true);
    try {
      const response = await parentAPI.getStudentInfo(student.id);
      if (response.status === 'success') {
        setStudentInfo(response.data.student);
      }
    } catch (error) {
      console.error('Erreur info étudiant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Impossible de charger les informations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="font-medium">{studentInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Numéro étudiant</p>
              <p className="font-medium">{studentInfo.gr_no || studentInfo.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de naissance</p>
              <p className="font-medium">
                {studentInfo.birth_date ? new Date(studentInfo.birth_date).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Genre</p>
              <p className="font-medium">
                {studentInfo.gender === 'm' ? 'Masculin' : studentInfo.gender === 'f' ? 'Féminin' : 'Autre'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{studentInfo.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium">{studentInfo.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nationalité</p>
              <p className="font-medium">{studentInfo.nationality || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Groupe sanguin</p>
              <p className="font-medium">{studentInfo.blood_group || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h3>
        <div className="space-y-2">
          <p>{studentInfo.street || 'Non renseignée'}</p>
          <p>{[studentInfo.city, studentInfo.zip].filter(Boolean).join(', ')}</p>
          <p>{studentInfo.country || ''}</p>
        </div>
      </div>

      {/* Historique des cours */}
      {studentInfo.courses && studentInfo.courses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des cours</h3>
          <div className="space-y-4">
            {studentInfo.courses.map((course, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.name}</h4>
                    {course.batch && (
                      <p className="text-sm text-gray-600">Promotion: {course.batch.name}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Code: {course.code} | État: {course.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.state === 'running' ? 'bg-green-100 text-green-800' :
                      course.state === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {course.state === 'running' ? 'En cours' :
                       course.state === 'completed' ? 'Terminé' : 
                       course.state}
                    </span>
                  </div>
                </div>
                {course.enrollment_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Inscrit le: {new Date(course.enrollment_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInfo; 