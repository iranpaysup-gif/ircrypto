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
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('wallex_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('wallex_user');
      }
    }
  }, []);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('wallex_user');
    toast({
      title: 'خروج موفق',
      description: 'با موفقیت از حساب کاربری خود خارج شدید',
    });
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('wallex_user', JSON.stringify(user));
    toast({
      title: 'ورود موفق',
      description: `خوش آمدید ${user.name}!`,
    });
  };

  const handlePhoneSubmit = async (phoneNumber) => {
    // Mock phone verification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  };

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
  };

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
