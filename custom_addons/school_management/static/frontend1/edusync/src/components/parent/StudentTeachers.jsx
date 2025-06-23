import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone } from 'lucide-react';
import { parentAPI } from './ParentAPI';

// Composant Enseignants
const StudentTeachers = ({ student }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, [student.id]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await parentAPI.getStudentTeachers(student.id);
      if (response.status === 'success') {
        setTeachers(response.data.teachers);
      }
    } catch (error) {
      console.error('Erreur enseignants:', error);
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

  return (
    <div className="space-y-6">
      {teachers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun enseignant trouvé
          </h3>
          <p className="text-gray-500">
            Les informations sur les enseignants ne sont pas encore disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start">
                <div className={`p-3 rounded-full ${
                  teacher.is_main_teacher ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Users className={`w-6 h-6 ${
                    teacher.is_main_teacher ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {teacher.name}
                    </h3>
                    {teacher.is_main_teacher && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{teacher.role}</p>
                  
                  {/* Informations de contact */}
                  <div className="space-y-2 mb-4">
                    {teacher.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <a href={`mailto:${teacher.email}`} className="hover:text-blue-600">
                          {teacher.email}
                        </a>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <a href={`tel:${teacher.phone}`} className="hover:text-blue-600">
                          {teacher.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Matières enseignées */}
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Matières :</p>
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects.map((subject, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTeachers; 