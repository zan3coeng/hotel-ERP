import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import PurchaseRequests from './pages/PurchaseRequests';
import PurchaseOrders from './pages/PurchaseOrders';
import Items from './pages/Items';
import Approvals from './pages/Approvals';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="purchase-requests" element={<PurchaseRequests />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="items" element={<Items />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="payments" element={<Payments />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
