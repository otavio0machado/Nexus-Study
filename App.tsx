
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Flashcards } from './pages/Flashcards';
import { Notes } from './pages/Notes';
import { PDFStudy } from './pages/PDFStudy';
import { Tracker } from './pages/Tracker';
import { StorageProvider } from './contexts/StorageContext';

export default function App() {
  return (
    <StorageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="flashcards" element={<Flashcards />} />
            <Route path="notes" element={<Notes />} />
            <Route path="pdf" element={<PDFStudy />} />
            <Route path="tracker" element={<Tracker />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StorageProvider>
  );
}
