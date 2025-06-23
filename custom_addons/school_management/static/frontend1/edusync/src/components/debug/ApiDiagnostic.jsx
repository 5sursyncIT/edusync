import React, { useState, useEffect } from 'react';

const ApiDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({
    basicConnection: null,
    cors: null,
    auth: null,
    withSession: null
  });
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069';

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  // Test 1: Connexion de base
  const testBasicConnection = async () => {
    addLog('📡 Test 1: Connexion de base', 'info');
    try {
      const response = await fetch(`${BASE_URL}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      addLog(`✅ Réponse reçue: Status ${response.status}`, 'success');
      const data = await response.json();
      addLog(`📄 Données: ${JSON.stringify(data)}`, 'success');
      setDiagnostics(prev => ({ ...prev, basicConnection: true }));
      return true;
    } catch (error) {
      addLog(`❌ Erreur connexion de base: ${error.message}`, 'error');
      setDiagnostics(prev => ({ ...prev, basicConnection: false }));
      return false;
    }
  };

  // Test 2: Test CORS
  const testCORS = async () => {
    addLog('🌐 Test 2: Configuration CORS', 'info');
    try {
      const response = await fetch(`${BASE_URL}/api/test`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://172.16.209.128:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeaders = {
        origin: response.headers.get('Access-Control-Allow-Origin'),
        methods: response.headers.get('Access-Control-Allow-Methods'),
        headers: response.headers.get('Access-Control-Allow-Headers')
      };
      
      addLog(`✅ CORS Headers: ${JSON.stringify(corsHeaders)}`, 'success');
      setDiagnostics(prev => ({ ...prev, cors: true }));
      return true;
    } catch (error) {
      addLog(`❌ Erreur test CORS: ${error.message}`, 'error');
      setDiagnostics(prev => ({ ...prev, cors: false }));
      return false;
    }
  };

  // Test 3: Authentification
  const testAuth = async () => {
    addLog('🔐 Test 3: Test d\'authentification', 'info');
    try {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin',
          db: 'odoo_ecole'
        }),
        mode: 'cors'
      });
      
      const data = await response.json();
      
      if (data.session_id) {
        addLog(`✅ Session ID reçu: ${data.session_id}`, 'success');
        setDiagnostics(prev => ({ ...prev, auth: true }));
        return data.session_id;
      } else {
        addLog(`❌ Pas de session ID dans la réponse: ${JSON.stringify(data)}`, 'error');
        setDiagnostics(prev => ({ ...prev, auth: false }));
        return null;
      }
    } catch (error) {
      addLog(`❌ Erreur test auth: ${error.message}`, 'error');
      setDiagnostics(prev => ({ ...prev, auth: false }));
      return null;
    }
  };

  // Test 4: Test avec session
  const testWithSession = async (sessionId) => {
    if (!sessionId) {
      addLog('⚠️ Test 4: Pas de session ID disponible', 'warning');
      setDiagnostics(prev => ({ ...prev, withSession: false }));
      return;
    }
    
    addLog('🔑 Test 4: Test avec session', 'info');
    try {
      const response = await fetch(`${BASE_URL}/api/dashboard/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Openerp-Session-Id': sessionId
        },
        mode: 'cors'
      });
      
      const data = await response.json();
      addLog(`📊 Statistiques dashboard: ${JSON.stringify(data)}`, 'success');
      setDiagnostics(prev => ({ ...prev, withSession: true }));
      return true;
    } catch (error) {
      addLog(`❌ Erreur test avec session: ${error.message}`, 'error');
      setDiagnostics(prev => ({ ...prev, withSession: false }));
      return false;
    }
  };

  // Exécution de tous les tests
  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    setDiagnostics({
      basicConnection: null,
      cors: null,
      auth: null,
      withSession: null
    });

    addLog('🚀 Démarrage des tests de diagnostic...', 'info');
    
    const basicOk = await testBasicConnection();
    if (!basicOk) {
      addLog('❌ DIAGNOSTIC: Problème de connexion de base', 'error');
      addLog('Solutions possibles:', 'warning');
      addLog('- Vérifiez que le serveur Odoo est démarré', 'warning');
      addLog('- Vérifiez l\'URL dans la configuration', 'warning');
      addLog('- Vérifiez la connectivité réseau', 'warning');
      setIsRunning(false);
      return;
    }
    
    await testCORS();
    const sessionId = await testAuth();
    await testWithSession(sessionId);
    
    addLog('✅ Tests terminés. Vérifiez les résultats ci-dessus.', 'success');
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    if (status === null) return '⏳';
    return status ? '✅' : '❌';
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">🔍 Diagnostic API Odoo</h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            <strong>URL de base:</strong> {BASE_URL}
          </p>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className={`px-4 py-2 rounded font-medium ${
              isRunning 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isRunning ? '🔄 Tests en cours...' : '🚀 Lancer les tests'}
          </button>
        </div>

        {/* Résultats des tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">
              {getStatusIcon(diagnostics.basicConnection)} Connexion de base
            </h3>
            <p className="text-sm text-gray-600">Test de connexion à /api/test</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">
              {getStatusIcon(diagnostics.cors)} Configuration CORS
            </h3>
            <p className="text-sm text-gray-600">Vérification des headers CORS</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">
              {getStatusIcon(diagnostics.auth)} Authentification
            </h3>
            <p className="text-sm text-gray-600">Test de login et session ID</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">
              {getStatusIcon(diagnostics.withSession)} API avec session
            </h3>
            <p className="text-sm text-gray-600">Test d'appel API authentifié</p>
          </div>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-300">📝 Logs des tests</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-gray-400 font-mono">{log.timestamp}</span>
                  <span className={getLogColor(log.type)}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDiagnostic; 