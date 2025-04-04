import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { PromptProvider } from './context/PromptContext.tsx';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <PromptProvider>
        <App />
      </PromptProvider>
    </AuthProvider>
  </React.StrictMode>
);
