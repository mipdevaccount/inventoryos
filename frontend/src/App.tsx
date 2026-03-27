import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ShopFloor />} />
            <Route path="/admin" element={<OfficeDashboard />} />
            <Route path="/products" element={<ProductCatalog />} />
            <Route path="/vendors" element={<VendorDirectory />} />
            <Route path="/vendors/:vendorId" element={<VendorProfile />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/:poNumber" element={<PODetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reorder-recommendations" element={<ReorderRecommendations />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

