import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/auth/Login';
import Unauthorized from '@/pages/auth/Unauthorized';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Client Pages
import ClientDashboard from '@/pages/client/Dashboard';
import ClientOrderHistory from '@/pages/client/OrderHistory';
import ClientOrderDetails from '@/pages/client/OrderDetails';

// Office Pages
import OfficeDashboard from '@/pages/office/Dashboard';
import ClientRegister from '@/pages/office/ClientRegister';
import OrderCreate from '@/pages/office/OrderCreate';
import OfficeOrderList from '@/pages/office/OrderList';
import OfficeOrderDetails from '@/pages/office/OrderDetails';
import OfficeClientList from '@/pages/office/ClientList';

// Technician Pages
import TechDashboard from '@/pages/tech/Dashboard';
import TechOrderDiagnosis from '@/pages/tech/OrderDiagnosis';

// Warehouse Pages
import WarehouseInventory from '@/pages/warehouse/Inventory';
import WarehouseDelivery from '@/pages/warehouse/WarehouseDelivery';

// Manager Pages
import ManagerDashboard from '@/pages/manager/Dashboard';
import ManagerEmployees from '@/pages/manager/Employees';
import ManagerReports from '@/pages/manager/Reports';
import ManagerOrders from '@/pages/manager/Orders';
import ManagerServices from '@/pages/manager/Services';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && 'role' in user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function RoleBasedRedirect() {
    const { user, isEmployee } = useAuth();
    
    if (!isEmployee || !user || !('role' in user)) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case 'OFFICE':
            return <Navigate to="/office/dashboard" replace />;
        case 'TECHNICIAN':
            return <Navigate to="/tech/tasks" replace />;
        case 'WAREHOUSE':
            return <Navigate to="/warehouse/inventory" replace />;
        case 'MANAGER':
            return <Navigate to="/manager/dashboard" replace />;
        default:
            return <Navigate to="/unauthorized" replace />;
    }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Redirect root to login for now */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Employee Dashboard Redirect */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
           <RoleBasedRedirect />
        </ProtectedRoute>
      } />
      
      {/* Client Routes */}
      <Route path="/client/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ClientDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/client/orders" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ClientOrderHistory />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/client/orders/:id" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ClientOrderDetails />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Office Routes */}
      <Route path="/office/dashboard" element={
        <ProtectedRoute allowedRoles={['OFFICE', 'MANAGER']}>
          <DashboardLayout>
            <OfficeDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/office/register-client" element={
        <ProtectedRoute allowedRoles={['OFFICE', 'MANAGER']}>
          <DashboardLayout>
            <ClientRegister />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/office/clients" element={
        <ProtectedRoute allowedRoles={['OFFICE', 'MANAGER']}>
          <DashboardLayout>
            <OfficeClientList />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/office/new-order" element={
        <ProtectedRoute allowedRoles={['OFFICE', 'MANAGER']}>
          <DashboardLayout>
            <OrderCreate />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/office/orders" element={
        <ProtectedRoute allowedRoles={['OFFICE', 'MANAGER']}>
          <DashboardLayout>
            <OfficeOrderList />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/office/orders/:id" element={
        <ProtectedRoute allowedRoles={['OFFICE', 'MANAGER']}>
          <DashboardLayout>
            <OfficeOrderDetails />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Technician Routes */}
      <Route path="/tech/tasks" element={
        <ProtectedRoute allowedRoles={['TECHNICIAN', 'MANAGER']}>
          <DashboardLayout>
            <TechDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/tech/tasks/:id" element={
        <ProtectedRoute allowedRoles={['TECHNICIAN', 'MANAGER']}>
          <DashboardLayout>
            <TechOrderDiagnosis />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Warehouse Routes */}
      <Route path="/warehouse/inventory" element={
        <ProtectedRoute allowedRoles={['WAREHOUSE', 'MANAGER', 'TECHNICIAN']}>
          <DashboardLayout>
            <WarehouseInventory />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/warehouse/delivery" element={
        <ProtectedRoute allowedRoles={['WAREHOUSE', 'MANAGER']}>
          <DashboardLayout>
            <WarehouseDelivery />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Manager Routes */}
      <Route path="/manager/dashboard" element={
        <ProtectedRoute allowedRoles={['MANAGER']}>
          <DashboardLayout>
            <ManagerDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/manager/employees" element={
        <ProtectedRoute allowedRoles={['MANAGER']}>
          <DashboardLayout>
            <ManagerEmployees />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/manager/reports" element={
        <ProtectedRoute allowedRoles={['MANAGER']}>
          <DashboardLayout>
            <ManagerReports />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/manager/orders" element={
        <ProtectedRoute allowedRoles={['MANAGER']}>
          <DashboardLayout>
            <ManagerOrders />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/manager/services" element={
        <ProtectedRoute allowedRoles={['MANAGER']}>
          <DashboardLayout>
            <ManagerServices />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
