import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

const SessionHelper = ({ error, onRetry }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);

  const checkSession = async () => {
    setIsChecking(true);
    try {
      const sessionId = localStorage.getItem('session_id');
      const response = await fetch('http://172.16.209.128:8069/web/session/get_session_info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'X-Openerp-Session-Id': sessionId }),
        },
      });
      
      const data = await response.json();
      
      if (response.ok && !data.error) {
        setSessionStatus('valid');
      } else {
        setSessionStatus('invalid');
      }
    } catch (err) {
      setSessionStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  const openOdooLogin = () => {
    window.open('http://172.16.209.128:8069/web/login', '_blank');
  };

  const clearSessionAndRetry = () => {
    localStorage.removeItem('session_id');
    setSessionStatus(null);
    if (onRetry) onRetry();
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start">
        <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Problème d'authentification
          </h3>
          
          <p className="text-yellow-700 mb-4">
            {error || 'La session Odoo semble avoir expiré ou être invalide.'}
          </p>

          <div className="space-y-3">
            {/* Session status */}
            <div className="flex items-center space-x-3">
              <button
                onClick={checkSession}
                disabled={isChecking}
                className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Vérifier la session</span>
              </button>
              
              {sessionStatus === 'valid' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Session valide</span>
                </div>
              )}
              
              {sessionStatus === 'invalid' && (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Session expirée</span>
                </div>
              )}
              
              {sessionStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Erreur de connexion</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openOdooLogin}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir Odoo</span>
              </button>
              
              <button
                onClick={clearSessionAndRetry}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer</span>
              </button>
              
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 border border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  Recharger les données
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-100 rounded-lg p-3 mt-4">
              <h4 className="font-medium text-yellow-800 mb-2">Instructions :</h4>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Cliquez sur "Ouvrir Odoo" pour vous connecter</li>
                <li>Connectez-vous avec vos identifiants</li>
                <li>Revenez à cette page et cliquez sur "Réessayer"</li>
              </ol>
            </div>

            {/* Debug info */}
            <details className="mt-4">
              <summary className="text-sm text-yellow-700 cursor-pointer hover:text-yellow-800">
                Informations de débogage
              </summary>
              <div className="mt-2 p-3 bg-yellow-100 rounded text-xs text-yellow-800 font-mono">
                <p><strong>Session ID:</strong> {localStorage.getItem('session_id') || 'Non défini'}</p>
                <p><strong>URL API:</strong> http://172.16.209.128:8069/api/library/</p>
                <p><strong>Erreur:</strong> {error}</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionHelper; 