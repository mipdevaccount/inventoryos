import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ShopFloor from './pages/ShopFloor';
import OfficeDashboard from './pages/OfficeDashboard';
import ProductCatalog from './pages/ProductCatalog';
import VendorDirectory from './pages/VendorDirectory';
import VendorProfile from './pages/VendorProfile';
import PurchaseOrders from './pages/PurchaseOrders';
import PODetail from './pages/PODetail';
import Reports from './pages/Reports';
import ReorderRecommendations from './pages/ReorderRecommendations';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';


const queryClient = new QueryClient();

// Wrap Layout around Outlet to persist layout for nested routes
const LayoutWrapper = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<LayoutWrapper />}>
                <Route path="/" element={<ShopFloor />} />
                <Route path="/admin" element={<OfficeDashboard />} />
                <Route path="/products" element={<ProductCatalog />} />
                <Route path="/vendors" element={<VendorDirectory />} />
                <Route path="/vendors/:vendorId" element={<VendorProfile />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/purchase-orders/:poNumber" element={<PODetail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reorder-recommendations" element={<ReorderRecommendations />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<LayoutWrapper />}>
                <Route path="/users" element={<UserManagement />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
