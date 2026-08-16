import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { PWAUpdateProvider } from './context/PWAUpdateContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PWAUpdateProvider>
      <App />
    </PWAUpdateProvider>
  </React.StrictMode>
);
