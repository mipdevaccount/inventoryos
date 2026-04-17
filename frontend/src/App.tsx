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
import OrderingRules from './pages/OrderingRules';
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
                {/* Standard / Read Only (and everyone else) */}
                <Route path="/" element={<ShopFloor />} />
                
                {/* Shop Floor & above */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'office', 'shop_floor']} />}>
                  <Route path="/products" element={<ProductCatalog />} />
                </Route>

                {/* Office & above */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'office']} />}>
                  <Route path="/admin" element={<OfficeDashboard />} />
                  <Route path="/vendors" element={<VendorDirectory />} />
                  <Route path="/vendors/:vendorId" element={<VendorProfile />} />
                  <Route path="/purchase-orders" element={<PurchaseOrders />} />
                  <Route path="/purchase-orders/:poNumber" element={<PODetail />} />
                  <Route path="/reorder-recommendations" element={<ReorderRecommendations />} />
                </Route>

                {/* Admin only */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/ordering-rules" element={<OrderingRules />} />
                  <Route path="/users" element={<UserManagement />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
