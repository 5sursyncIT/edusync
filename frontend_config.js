// Configuration pour l'application React
const config = {
  API_URL: 'http://localhost:5000',  // Utiliser notre proxy CORS sur le port 5000
  ODOO_URL: 'http://localhost:5000', // Rediriger les requêtes Odoo via le proxy
  DB_NAME: 'odoo_ecole'
};

console.log('Configuration API chargée:', config);

// Exporter la configuration
export default config; 