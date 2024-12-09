import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './init/Router.tsx';
import { initApp } from './init/init.ts';
import './index.css';

initApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>
  );
});