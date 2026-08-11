import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWA deferred prompt listener
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPWAEvt = e;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
