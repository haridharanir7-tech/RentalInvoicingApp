import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Members can connect this to their Supabase / JWT authentication
  return <Outlet />;
}
