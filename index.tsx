
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

import { db } from './db';
import Dexie from 'dexie';

// Expose DB for E2E Testing
(window as any).db = db;
(window as any).Dexie = Dexie;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
