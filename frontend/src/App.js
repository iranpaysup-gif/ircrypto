import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import Header from './components/Header';
import Hero from './components/Hero';
import CryptoMarket from './components/CryptoMarket';
import TradingInterface from './components/TradingInterface';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import Footer from './components/Footer';
import { toast } from './hooks/use-toast';
import { authAPI, handleApiError, isTokenValid } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('wallex_token');
    const savedUser = localStorage.getItem('wallex_user');
    
    if (token && savedUser && isTokenValid()) {
      try {
        // Verify token with backend
        const response = await authAPI.getMe();
        setCurrentUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('wallex_token');
        localStorage.removeItem('wallex_user');
      }
    }
    
    setIsLoading(false);
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('wallex_token');
    localStorage.removeItem('wallex_user');
    
    toast({
      title: 'خروج موفق',
      description: 'با موفقیت از حساب کاربری خود خارج شدید',
    });
  };

  const handleAuthSuccess = (tokenResponse) => {
    const { access_token, user } = tokenResponse;
    
    // Store token and user data
    localStorage.setItem('wallex_token', access_token);
    localStorage.setItem('wallex_user', JSON.stringify(user));
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    
    toast({
      title: 'ورود موفق',
      description: `خوش آمدید ${user.name}!`,
    });
  };

  const handlePhoneSubmit = async (phoneNumber) => {
    try {
      // This will trigger SMS sending in register flow
      toast({
        title: 'کد تأیید ارسال شد',
        description: 'کد تأیید به شماره موبایل شما ارسال شد',
      });
      return { success: true };
    } catch (error) {
      toast({
        title: 'خطا',
        description: handleApiError(error),
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white transform rotate-45"></div>
          </div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <Header 
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        
        <Routes>
          <Route path="/" element={
            <>
              <Hero onPhoneSubmit={handlePhoneSubmit} />
              <CryptoMarket onCoinSelect={handleCoinSelect} />
            </>
          } />
          <Route path="/trading" element={
            <TradingInterface 
              selectedCoin={selectedCoin}
              isAuthenticated={isAuthenticated}
              onLogin={handleLogin}
            />
          } />
          <Route path="/dashboard" element={
            isAuthenticated ? (
              <UserDashboard user={currentUser} />
            ) : (
              <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">برای دسترسی به دشبورد وارد شوید</h2>
                <button 
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
                >
                  ورود به حساب
                </button>
              </div>
            )
          } />
        </Routes>

        <Footer />
        
        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
        
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
