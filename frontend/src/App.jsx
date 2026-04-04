
// HMR Trigger
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';
import { SavedProvider } from './context/SavedContext'; // NEW
import Layout from './components/Layout';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import ForShops from './pages/ForShops';
import Explore from './pages/Explore';
import Demo from './pages/Demo';
import Guide from './pages/Guide';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import { Terms, Privacy, Cookie } from './pages/Legal';
import SellerSuccess from './pages/SellerSuccess';
import SellerGuide from './pages/SellerGuide';
// Unused: import SellerRegistration from './pages/SellerRegistration';
import VerificationPending from './pages/VerificationPending';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ModeratorDashboard from './pages/admin/ModeratorDashboard';

// Seller Onboarding (Moved from pages/seller/onboarding)
import SellerOnboardingLayout from './pages/onboarding/SellerOnboardingLayout';
import SellerIntro from './pages/onboarding/SellerIntro';
import ShopBasics from './pages/onboarding/ShopBasics';
import CreateAccount from './pages/onboarding/CreateAccount';
import SellerRegistrationV2 from './pages/onboarding/SellerRegistrationV2';

import SellerVerification from './pages/admin/SellerVerification';
import Shops from './pages/admin/Shops';
import Users from './pages/admin/Users';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import Products from './pages/admin/Products';
import Reports from './pages/admin/Reports';
import ActivityLogs from './pages/admin/ActivityLogs';
import Announcements from './pages/admin/Announcements';
import NotificationCenter from './pages/admin/NotificationCenter';
import AdminProfile from './pages/admin/AdminProfile';
import FaceRequests from './pages/admin/FaceRequests';
import AdminAssistedListings from './pages/admin/AdminAssistedListings';
import LocationVerification from './pages/admin/LocationVerification';
import LocationHealth from './pages/admin/LocationHealth';
// Seller Dashboard (New Modular Structure)
import SellerLayout from './components/seller/SellerLayout';
import SellerHome from './pages/seller/SellerHome';
import SellerProducts from './pages/seller/SellerProducts';
import SellerCustomerVisits from './pages/seller/SellerCustomerVisits'; // NEW Step 2
// import SellerRequests from './pages/seller/SellerRequests'; // DEPRECATED
// import SellerVisits from './pages/seller/SellerVisits'; // DEPRECATED
import SellerProfile from './pages/seller/SellerProfile';
import SellerInventory from './pages/seller/SellerInventory';
import SellerSettings from './pages/seller/SellerSettings';
import SellerAddProductManual from './pages/seller/SellerAddProductManual';
import SellerHistory from './pages/seller/SellerHistory';
import SellerOffers from './pages/seller/SellerOffers';
import SellerFeedback from './pages/seller/SellerFeedback';
import SellerSubscription from './pages/seller/SellerSubscription';
import VoiceProductAdd from './pages/seller/product-add/VoiceProductAdd';
import VisionProductAdd from './pages/seller/product-add/VisionProductAdd';
import BulkProductAdd from './pages/seller/product-add/BulkProductAdd';
import BulkMappingPage from './pages/seller/product-add/BulkMappingPage'; // Step 2
import BulkPreviewPage from './pages/seller/product-add/BulkPreviewPage'; // NEW Step 3
import CatalogProductAdd from './pages/seller/product-add/CatalogProductAdd';
import CatalogReviewPage from './pages/seller/product-add/CatalogReviewPage'; // NEW Step 2

import AssistedProductAdd from './pages/seller/product-add/AssistedProductAdd';
import ImageListingPage from './pages/seller/ImageListingPage';
// Service Dashboard Components
import ServiceLayout from './components/seller/ServiceLayout';
import ServiceHome from './pages/seller/ServiceHome';
import ServiceRequests from './pages/seller/ServiceRequests';
import ServiceProfile from './pages/seller/ServiceProfile';
import { ServiceEarnings, ServiceReviews } from './pages/seller/ServiceModules';

import AdminShopDetail from './pages/admin/AdminShopDetail'; // NEW
import AdminUserActivity from './pages/admin/AdminUserActivity'; // NEW Forensic Timeline
import AdminProductActivity from './pages/admin/AdminProductActivity'; // NEW Forensic Timeline
import AdminFeedbackInbox from './pages/admin/AdminFeedbackInbox'; // NEW Feedback Inbox

// Customer Pages
import CustomerLayout from './components/customer/CustomerLayout';
// ... [rest of customer imports maintained]

// ...

import { SidebarProvider } from './context/SidebarStateContext';
import CustomerHome from './pages/customer/CustomerHome';
import CustomerShops from './pages/customer/CustomerShops';
import CustomerServices from './pages/customer/CustomerServices';
import CustomerHomeMade from './pages/customer/CustomerHomeMade';
import CustomerInterested from './pages/customer/CustomerInterested';
import CustomerCheckout from './pages/customer/CustomerCheckout';
import CustomerActivity from './pages/customer/CustomerActivity';
import CustomerNotifications from './pages/customer/CustomerNotifications';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerSettings from './pages/customer/CustomerSettings';
import ShopProfile from './pages/customer/ShopProfile';
import VisitsOrdersPage from './pages/customer/VisitsOrdersPage';
import { InterestedProvider } from './context/InterestedContext';
import { ActivityProvider } from './context/ActivityContext';
import Checkout from './pages/customer/Checkout';

import CustomerSearchResults from './pages/customer/CustomerSearchResults';
import CustomerItemDetail from './pages/customer/CustomerItemDetail';
import CustomerShopView from './pages/customer/CustomerShopView';
import CustomerDisplayCategory from './pages/customer/CustomerCategoryResults'; // Was CustomerCategoryResults
import CustomerCategories from './pages/customer/CustomerCategories'; // NEW Categories Landing
import CategoryProducts from './pages/customer/CategoryProducts'; // NEW Global Category Page
import CustomerDiscover from './pages/customer/CustomerDiscover';
import Bookings from './pages/customer/Bookings';
import AddAddressPage from './pages/customer/AddAddressPage'; // NEW Step 2
import ProjectPoster from './pages/ProjectPoster';

// Admin Auth
import AdminLogin from './pages/admin/AdminLogin';

// Global Offline Indicator
import { FaWifi } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

// 6. Dynamic Seller Router
const SellerDashboardRouter = () => {
  const { user } = useAuth();

  // Logic: Decide which dashboard to show based on shopType
  if (user?.shopDetails?.category === 'Services' || user?.shopDetails?.shopCategory === 'Services') {
    return (
      <Routes>
        <Route element={<ServiceLayout />}>
          <Route path="home" element={<ServiceHome />} />
          <Route path="requests" element={<ServiceRequests />} />
          <Route path="earnings" element={<ServiceEarnings />} />
          <Route path="reviews" element={<ServiceReviews />} />
          <Route path="profile" element={<ServiceProfile />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route index element={<Navigate to="/seller/home" replace />} />
          {/* Catch-all for service sellers - redirect to home if they try to access retail paths */}
          <Route path="*" element={<Navigate to="/seller/home" replace />} />
        </Route>
      </Routes>
    );
  }

  // Default: Retail Dashboard
  return (
    <Routes>
      <Route element={<SellerLayout />}>
        <Route path="home" element={<SellerHome />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="inventory" element={<SellerInventory />} />
        <Route path="customer-visits" element={<SellerCustomerVisits />} /> {/* One Source of Truth */}
        <Route path="profile" element={<SellerProfile />} />
        <Route path="settings" element={<SellerSettings />} />
        <Route path="add-product/manual" element={<SellerAddProductManual />} />
        <Route path="add-product/voice" element={<VoiceProductAdd />} />
        <Route path="add-product/vision" element={<VisionProductAdd />} />
        <Route path="add-product/bulk" element={<BulkProductAdd />} />
        <Route path="add-product/bulk/mapping" element={<BulkMappingPage />} /> {/* Step 2 */}
        <Route path="add-product/bulk/preview" element={<BulkPreviewPage />} /> {/* NEW Step 3 */}
        <Route path="product-add/catalog" element={<CatalogProductAdd />} />
        <Route path="product-add/catalog-review" element={<CatalogReviewPage />} />
        <Route path="add-product/assisted" element={<AssistedProductAdd />} />
        <Route path="image-listing" element={<ImageListingPage />} />
        <Route path="history" element={<SellerHistory />} />
        <Route path="offers" element={<SellerOffers />} />
        <Route path="feedback" element={<SellerFeedback />} />
        <Route path="subscription" element={<SellerSubscription />} />
        <Route index element={<Navigate to="/seller/home" replace />} />
        <Route path="*" element={<Navigate to="/seller/home" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3000 }}
        containerStyle={{ zIndex: 99999 }}
      />
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white text-xs font-bold py-2 text-center z-[100] animate-slide-up flex items-center justify-center gap-2">
          <FaWifi className="opacity-50" /> You are currently offline. Some features may be unavailable.
        </div>
      )}
      <AuthProvider>
        <ThemeProvider>
          <LocationProvider>
            <Routes>
              {/* 1. Root & Admin Isolated Login */}
              <Route path="/" element={<Home />} />
              <Route path="/market" element={<Navigate to="/home" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* 2. Admin Panel */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="moderator" element={<ModeratorDashboard />} />
                <Route path="verifications" element={<SellerVerification />} />
                <Route path="location-verification" element={<LocationVerification />} />
                <Route path="location-health" element={<LocationHealth />} />
                <Route path="shops" element={<Shops />} />
                <Route path="shops/:id" element={<AdminShopDetail />} /> {/* NEW Command Center */}
                <Route path="users" element={<Users />} />
                <Route path="users/:id/activity" element={<AdminUserActivity />} /> {/* NEW User Activity */}
                <Route path="face-requests" element={<FaceRequests />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id/activity" element={<AdminProductActivity />} /> {/* NEW Product Activity */}
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<Reports />} />
                <Route path="assisted-listing" element={<AdminAssistedListings />} />
                <Route path="feedback" element={<AdminFeedbackInbox />} /> {/* NEW Feedback Inbox */}
                <Route path="activity-logs" element={<ActivityLogs />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="notifications" element={<NotificationCenter />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>
              {/* 3. Public Pages */}
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/for-shops" element={<ForShops />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/terms-of-service" element={<Terms />} />
              <Route path="/privacy-policy" element={<Privacy />} />
              <Route path="/cookie" element={<Cookie />} />
              <Route path="/poster" element={<ProjectPoster />} />

              <Route path="/seller/success" element={<SellerSuccess />} />
              <Route path="/seller/guide" element={<SellerGuide />} />


              {/* 4. Seller Onboarding Flow */}
              <Route path="/seller/register" element={<SellerRegistrationV2 />} />

              <Route path="/seller/onboarding" element={<SellerOnboardingLayout />}>
                <Route index element={<SellerIntro />} />
                <Route path="basics" element={<ShopBasics />} />
                <Route path="account" element={<CreateAccount />} />
              </Route>
              <Route path="/verification-pending" element={<VerificationPending />} />
              {/* 5. Protected User Routes (Shared State Layer) */}
              <Route element={
                <ProtectedRoute>
                  <NotificationProvider>
                    <SidebarProvider>
                      <InterestedProvider>
                        <SavedProvider>
                          <ActivityProvider>
                            <Outlet />
                          </ActivityProvider>
                        </SavedProvider>
                      </InterestedProvider>
                    </SidebarProvider>
                  </NotificationProvider>
                </ProtectedRoute>
              }>
                {/* Customer Section */}
                <Route element={<CustomerLayout />}>
                  <Route path="/home" element={<CustomerHome />} />
                  <Route path="/address/add" element={<AddAddressPage />} />
                  <Route path="/shops" element={<CustomerShops />} />
                  <Route path="/shop/:shopId" element={<ShopProfile />} />
                  <Route path="/shops/:id" element={<CustomerShopView />} />
                  <Route path="/services" element={<CustomerServices />} />
                  <Route path="/services/:type" element={<CustomerServices />} />
                  <Route path="/homemade" element={<CustomerHomeMade />} />
                  <Route path="/interested" element={<CustomerInterested />} />
                  <Route path="/checkout/:shopId" element={<Checkout />} />
                  <Route path="/checkout" element={<CustomerCheckout />} />
                  <Route path="/activity" element={<VisitsOrdersPage />} />
                  <Route path="/notifications" element={<CustomerNotifications />} />
                  <Route path="/profile" element={<CustomerProfile />} />
                  <Route path="/settings" element={<CustomerSettings />} />

                  <Route path="/search" element={<CustomerSearchResults />} />
                  <Route path="/bookings" element={<Bookings />} /> {/* NEW Step 2 */}
                  <Route path="/categories" element={<CustomerCategories />} />
                  <Route path="/category/:slug" element={<CategoryProducts />} />
                  <Route path="/discover" element={<CustomerDiscover />} />
                  <Route path="/product/:id" element={<CustomerItemDetail />} />
                </Route> {/* End Customer Layout */}

                {/* Seller Section (Dynamic Router) */}
                <Route path="/seller/*" element={<SellerDashboardRouter />} />

              </Route> {/* End Protected Route */}

            </Routes>
          </LocationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
