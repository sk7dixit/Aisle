import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Future Routes: 
                <Route path="/item/:id" element={<ProductDetails />} />
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} /> 
            */}
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
