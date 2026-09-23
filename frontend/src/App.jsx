import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
          <Navbar />
          <main className="content-area">
            <Routes>
              <Route path="/" element={<h2>Welcome to Rental Invoicing App</h2>} />
              <Route element={<ProtectedRoute />}>
                {/* Team members will register their module routes here */}
              </Route>
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
