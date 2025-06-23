import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSessions } from '../../hooks/useAttendance';
import odooApi from '../../services/odooApi.jsx';

const SessionsTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Hook useSessions
  const { data: sessionsData, loading: sessionsLoading, error: sessionsError } = useSessions({}, 1, 10);
  const sessionsList = sessionsData?.sessions || [];

  // Test API directe
  const testDirectAPI = async () => {
    setLoading(true);
    try {
      console.log('🧪 Test API directe...');
      const response = await fetch('http://172.16.209.128:8069/api/sessions?limit=5');
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        directAPI: {
          success: true,
          data: data,
          sessionsCount: data?.data?.sessions?.length || 0,
          firstSession: data?.data?.sessions?.[0] || null
        }
      }));
      
      console.log('✅ API directe réussie:', data);
    } catch (error) {
      console.error('❌ Erreur API directe:', error);
      setTestResults(prev => ({
        ...prev,
        directAPI: {
          success: false,
          error: error.message
        }
      }));
    }
    setLoading(false);
  };

  // Test service odooApi
  const testOdooApiService = async () => {
    setLoading(true);
    try {
      console.log('🧪 Test service odooApi...');
      const result = await odooApi.getSessions(1, 5, '', {});
      
      setTestResults(prev => ({
        ...prev,
        odooApiService: {
          success: true,
          data: result,
          sessionsCount: result?.data?.sessions?.length || result?.sessions?.length || 0,
          firstSession: result?.data?.sessions?.[0] || result?.sessions?.[0] || null
        }
      }));
      
      console.log('✅ Service odooApi réussi:', result);
    } catch (error) {
      console.error('❌ Erreur service odooApi:', error);
      setTestResults(prev => ({
        ...prev,
        odooApiService: {
          success: false,
          error: error.message
        }
      }));
    }
    setLoading(false);
  };

  // Test formatage des sessions
  const testSessionFormatting = () => {
    console.log('🧪 Test formatage des sessions...');
    
    if (sessionsList.length > 0) {
      sessionsList.forEach((session, index) => {
        console.log(`🔍 Session ${index} brute:`, session);
        
        // Test de formatage
        const sessionName = session.name || `Session ${session.id}`;
        const subjectName = session.subject?.name || 'Matière inconnue';
        const facultyName = session.faculty?.name || 'Enseignant inconnu';
        const batchName = session.batch?.name || 'Promotion inconnue';
        const dateTime = session.start_datetime ? 
          odooApi.formatAttendanceDate(session.start_datetime, true) : 
          'Date inconnue';
        
        const formattedText = `${sessionName} - ${subjectName} (${facultyName}) - ${batchName} - ${dateTime}`;
        
        console.log(`🔍 Session ${index} formatée:`, {
          sessionName,
          subjectName,
          facultyName,
          batchName,
          dateTime,
          formattedText
        });
      });
      
      alert(`Test formatage terminé pour ${sessionsList.length} sessions - Vérifiez la console`);
    } else {
      alert('Aucune session disponible pour le test de formatage');
    }
  };

  // Test authentification
  const testAuth = async () => {
    setLoading(true);
    try {
      console.log('🧪 Test authentification...');
      const isAuth = await odooApi.isAuthenticated();
      const userInfo = await odooApi.getUserInfo();
      
      setTestResults(prev => ({
        ...prev,
        auth: {
          success: true,
          isAuthenticated: isAuth,
          userInfo: userInfo,
          contextUser: user
        }
      }));
      
      console.log('✅ Test auth réussi:', { isAuth, userInfo, contextUser: user });
    } catch (error) {
      console.error('❌ Erreur test auth:', error);
      setTestResults(prev => ({
        ...prev,
        auth: {
          success: false,
          error: error.message
        }
      }));
    }
    setLoading(false);
  };

  // Effet pour logger l'état du hook
  useEffect(() => {
    console.log('🔍 État du hook useSessions:', {
      sessionsData,
      sessionsList,
      sessionsLoading,
      sessionsError,
      sessionsCount: sessionsList.length
    });
    
    if (sessionsList.length > 0) {
      console.log('🔍 Première session du hook:', sessionsList[0]);
    }
  }, [sessionsData, sessionsList, sessionsLoading, sessionsError]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de Diagnostic des Sessions</h1>
      
      {/* Informations utilisateur */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Informations Utilisateur</h2>
        <p><strong>Utilisateur connecté:</strong> {user ? `${user.name} (ID: ${user.id})` : 'Non connecté'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
      </div>

      {/* État du hook */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">État du Hook useSessions</h2>
        <p><strong>Chargement:</strong> {sessionsLoading ? 'Oui' : 'Non'}</p>
        <p><strong>Erreur:</strong> {sessionsError || 'Aucune'}</p>
        <p><strong>Nombre de sessions:</strong> {sessionsList.length}</p>
        {sessionsList.length > 0 && (
          <div className="mt-2">
            <p><strong>Première session:</strong></p>
            <pre className="bg-white p-2 rounded text-sm overflow-auto">
              {JSON.stringify(sessionsList[0], null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Boutons de test */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Authentification
        </button>
        <button
          onClick={testDirectAPI}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test API Directe
        </button>
        <button
          onClick={testOdooApiService}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Service odooApi
        </button>
        <button
          onClick={testSessionFormatting}
          disabled={loading}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          Test Formatage des Sessions
        </button>
      </div>

      {/* Résultats des tests */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Résultats des Tests</h2>
          
          {testResults.auth && (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-blue-600">Test Authentification</h3>
              {testResults.auth.success ? (
                <div>
                  <p className="text-green-600">✅ Succès</p>
                  <p><strong>Authentifié:</strong> {testResults.auth.isAuthenticated ? 'Oui' : 'Non'}</p>
                  <p><strong>Utilisateur API:</strong> {testResults.auth.userInfo?.name || 'N/A'}</p>
                  <p><strong>Utilisateur Context:</strong> {testResults.auth.contextUser?.name || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-red-600">❌ Erreur: {testResults.auth.error}</p>
              )}
            </div>
          )}

          {testResults.directAPI && (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-green-600">Test API Directe</h3>
              {testResults.directAPI.success ? (
                <div>
                  <p className="text-green-600">✅ Succès</p>
                  <p><strong>Nombre de sessions:</strong> {testResults.directAPI.sessionsCount}</p>
                  {testResults.directAPI.firstSession && (
                    <div>
                      <p><strong>Première session:</strong></p>
                      <p>- ID: {testResults.directAPI.firstSession.id}</p>
                      <p>- Nom: {testResults.directAPI.firstSession.name}</p>
                      <p>- Matière: {testResults.directAPI.firstSession.subject?.name}</p>
                      <p>- Enseignant: {testResults.directAPI.firstSession.faculty?.name}</p>
                      <p>- Promotion: {testResults.directAPI.firstSession.batch?.name}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-600">❌ Erreur: {testResults.directAPI.error}</p>
              )}
            </div>
          )}

          {testResults.odooApiService && (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-purple-600">Test Service odooApi</h3>
              {testResults.odooApiService.success ? (
                <div>
                  <p className="text-green-600">✅ Succès</p>
                  <p><strong>Nombre de sessions:</strong> {testResults.odooApiService.sessionsCount}</p>
                  {testResults.odooApiService.firstSession && (
                    <div>
                      <p><strong>Première session:</strong></p>
                      <p>- ID: {testResults.odooApiService.firstSession.id}</p>
                      <p>- Nom: {testResults.odooApiService.firstSession.name}</p>
                      <p>- Matière: {testResults.odooApiService.firstSession.subject?.name}</p>
                      <p>- Enseignant: {testResults.odooApiService.firstSession.faculty?.name}</p>
                      <p>- Promotion: {testResults.odooApiService.firstSession.batch?.name}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-600">❌ Erreur: {testResults.odooApiService.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionsTest; 