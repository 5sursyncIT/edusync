// Configuration API centralisée
const apiConfig = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069',
  
  // ... existing code ...
  
  CORS: {
    ALLOWED_ORIGINS: [
      'http://172.16.209.128:3000', 
      'http://172.16.209.128:8069',
      'http://localhost:3000', 
      'http://localhost:8069'
    ],
    // ... existing code ...
  },
  
  // ... existing code ...
} 