// =====================================
// FLUX - Application Entry Point
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ThemeProvider from './providers/ThemeProvider';
import './globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
// 21:11:22 Dec 06, 2025
