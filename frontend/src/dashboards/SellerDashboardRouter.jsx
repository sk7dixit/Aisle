import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import SellerLayout from '../components/seller/SellerLayout';
import ServiceLayout from '../components/seller/ServiceLayout';
import HomeBusinessLayout from './homeBusiness/HomeBusinessLayout';

// Dashboards
import SellerHome from '../pages/seller/SellerHome'; // Default/Backup
import GroceryDashboard from './grocery/GroceryDashboard';
import ElectronicsDashboard from './electronics/ElectronicsDashboard';
import HomeBusinessDashboard from './homeBusiness/HomeBusinessDashboard';
import GrowthPage from './homeBusiness/GrowthPage';
import SellerInsights from '../pages/seller/SellerInsights';

// Mobile-first components
import MobileSellerLayout from '../components/seller/mobile/MobileSellerLayout';
import MobileSellerHome from '../components/seller/mobile/MobileSellerHome';
import MobileSellerProducts from '../components/seller/mobile/MobileSellerProducts';
import MobileSellerOrders from '../components/seller/mobile/MobileSellerOrders';
import MobileSellerInventory from '../components/seller/mobile/MobileSellerInventory';
import MobileSellerMessages from '../components/seller/mobile/MobileSellerMessages';
import MobileCatalogRequests from '../components/seller/mobile/MobileCatalogRequests';
import MobileSellerInsights from '../components/seller/mobile/MobileSellerInsights';
import MobileSellerProfile from '../components/seller/mobile/MobileSellerProfile';
import MobileSellerSettings from '../components/seller/mobile/MobileSellerSettings';
import MobileSellerSubscription from '../components/seller/mobile/MobileSellerSubscription';
import MobileSellerCustomerVisits from '../components/seller/mobile/MobileSellerCustomerVisits';
import MobileSellerFeedback from '../components/seller/mobile/MobileSellerFeedback';

// Other Common Seller Pages
import SellerProducts from '../pages/seller/SellerProducts';
import SellerInventory from '../pages/seller/SellerInventory';
import SellerCustomerVisits from '../pages/seller/SellerCustomerVisits';
import CatalogRequestsPage from '../pages/seller/CatalogRequestsPage';
import SellerProfile from '../pages/seller/SellerProfile';
import SellerSettings from '../pages/seller/SellerSettings';
import SellerMessages from '../pages/seller/SellerMessages';
import SellerAddProductManual from '../pages/seller/SellerAddProductManual';
import VoiceProductAdd from '../pages/seller/product-add/VoiceProductAdd';
import VisionProductAdd from '../pages/seller/product-add/VisionProductAdd';
import BulkProductAdd from '../pages/seller/product-add/BulkProductAdd';
import BulkMappingPage from '../pages/seller/product-add/BulkMappingPage';
import BulkPreviewPage from '../pages/seller/product-add/BulkPreviewPage';
import CatalogProductAdd from '../pages/seller/product-add/CatalogProductAdd';
import CatalogReviewPage from '../pages/seller/product-add/CatalogReviewPage';
import AssistedProductAdd from '../pages/seller/product-add/AssistedProductAdd';
import ImageListingPage from '../pages/seller/ImageListingPage';
import SellerHistory from '../pages/seller/SellerHistory';
import SellerOffers from '../pages/seller/SellerOffers';
import SellerFeedback from '../pages/seller/SellerFeedback';
import SellerSubscription from '../pages/seller/SellerSubscription';

// Service Dashboard Components
import ServiceHome from '../pages/seller/ServiceHome';
import ServiceRequests from '../pages/seller/ServiceRequests';
import ServiceProfile from '../pages/seller/ServiceProfile';
import { ServiceEarnings, ServiceReviews } from '../pages/seller/ServiceModules';
import BookingsPage from '../pages/seller/bookings/BookingsPage';

const SellerDashboardRouter = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shopCategory = user?.shopDetails?.shopCategory || user?.shopDetails?.category || '';

  if (isMobile) {
    return (
      <Routes>
        <Route element={<MobileSellerLayout />}>
          <Route path="home" element={<MobileSellerHome />} />
          <Route path="products" element={<MobileSellerProducts />} />
          <Route path="inventory" element={<MobileSellerInventory />} />
          <Route path="orders" element={<MobileSellerOrders />} />
          <Route path="customer-visits" element={<MobileSellerCustomerVisits />} />
          <Route path="messages" element={<MobileSellerMessages />} />
          <Route path="catalog-requests" element={<MobileCatalogRequests />} />
          <Route path="feedback" element={<MobileSellerFeedback />} />
          <Route path="insights" element={<MobileSellerInsights />} />
          <Route path="profile" element={<MobileSellerProfile />} />
          <Route path="settings" element={<MobileSellerSettings />} />
          <Route path="subscription" element={<MobileSellerSubscription />} />
          
          <Route path="add-product/*" element={<Navigate to="/seller/products" replace />} />
          <Route path="*" element={<Navigate to="/seller/home" replace />} />
          <Route index element={<Navigate to="/seller/home" replace />} />
        </Route>
      </Routes>
    );
  }

  // 1. Service Dashboard Router
  if (shopCategory === 'Services') {
    return (
      <Routes>
        <Route element={<ServiceLayout />}>
          <Route path="home" element={<ServiceHome />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="requests" element={<ServiceRequests />} />
          <Route path="earnings" element={<ServiceEarnings />} />
          <Route path="reviews" element={<ServiceReviews />} />
          <Route path="profile" element={<ServiceProfile />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route path="messages" element={<SellerMessages />} />
          <Route path="insights" element={<SellerInsights />} />
          <Route index element={<Navigate to="/seller/home" replace />} />
          <Route path="*" element={<Navigate to="/seller/home" replace />} />
        </Route>
      </Routes>
    );
  }

  // 2. Home Businesses Dashboard Router
  if (shopCategory === 'Home Businesses') {
    return (
      <Routes>
        <Route element={<HomeBusinessLayout />}>
          <Route path="home" element={<HomeBusinessDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="customer-visits" element={<SellerCustomerVisits />} />
          <Route path="catalog-requests" element={<CatalogRequestsPage />} />
          <Route path="growth" element={<SellerInsights />} />
          <Route path="insights" element={<SellerInsights />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="messages" element={<SellerMessages />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route path="add-product/manual" element={<SellerAddProductManual />} />
          <Route path="add-product/voice" element={<VoiceProductAdd />} />
          <Route path="add-product/vision" element={<VisionProductAdd />} />
          <Route path="add-product/bulk" element={<BulkProductAdd />} />
          <Route path="add-product/bulk/mapping" element={<BulkMappingPage />} />
          <Route path="add-product/bulk/preview" element={<BulkPreviewPage />} />
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
  }

  // 3. Grocery / Kirana Dashboard Router
  if (shopCategory === 'Grocery / Kirana') {
    return (
      <Routes>
        <Route element={<SellerLayout />}>
          <Route path="home" element={<GroceryDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="inventory" element={<SellerInventory />} />
          <Route path="customer-visits" element={<SellerCustomerVisits />} />
          <Route path="catalog-requests" element={<CatalogRequestsPage />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="messages" element={<SellerMessages />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route path="insights" element={<SellerInsights />} />
          <Route path="add-product/manual" element={<SellerAddProductManual />} />
          <Route path="add-product/voice" element={<VoiceProductAdd />} />
          <Route path="add-product/vision" element={<VisionProductAdd />} />
          <Route path="add-product/bulk" element={<BulkProductAdd />} />
          <Route path="add-product/bulk/mapping" element={<BulkMappingPage />} />
          <Route path="add-product/bulk/preview" element={<BulkPreviewPage />} />
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
  }

  // 4. Default / Retail Dashboard Router (Electronics, Tech, etc.)
  return (
    <Routes>
      <Route element={<SellerLayout />}>
        <Route path="home" element={<SellerHome />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="inventory" element={<SellerInventory />} />
        <Route path="customer-visits" element={<SellerCustomerVisits />} />
        <Route path="catalog-requests" element={<CatalogRequestsPage />} />
        <Route path="profile" element={<SellerProfile />} />
        <Route path="messages" element={<SellerMessages />} />
        <Route path="settings" element={<SellerSettings />} />
        <Route path="insights" element={<SellerInsights />} />
        <Route path="add-product/manual" element={<SellerAddProductManual />} />
        <Route path="add-product/voice" element={<VoiceProductAdd />} />
        <Route path="add-product/vision" element={<VisionProductAdd />} />
        <Route path="add-product/bulk" element={<BulkProductAdd />} />
        <Route path="add-product/bulk/mapping" element={<BulkMappingPage />} />
        <Route path="add-product/bulk/preview" element={<BulkPreviewPage />} />
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

export default SellerDashboardRouter;
