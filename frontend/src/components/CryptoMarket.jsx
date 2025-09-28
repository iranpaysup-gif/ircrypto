import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cryptoAPI, handleApiError } from '../services/api';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const CryptoMarket = ({ onCoinSelect }) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [cryptoData, setCryptoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCryptoData();
    // Set up auto refresh every 30 seconds
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoData = async () => {
    try {
      const response = await cryptoAPI.getPrices();
      setCryptoData(response.data);
    } catch (error) {
      toast({
        title: 'خطا',
        description: handleApiError(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'همه', count: cryptoData.length },
    { id: 'favorites', label: 'علاقه‌مندی‌ها', count: favorites.size },
    { id: 'gainers', label: 'صعودی', count: cryptoData.filter(c => c.change_24h > 0).length },
    { id: 'losers', label: 'نزولی', count: cryptoData.filter(c => c.change_24h < 0).length }
  ];

  const toggleFavorite = (coinId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(coinId)) {
      newFavorites.delete(coinId);
    } else {
      newFavorites.add(coinId);
    }
    setFavorites(newFavorites);
  };

  const getFilteredData = () => {
    let filtered = [...cryptoData];
    
    switch (selectedTab) {
      case 'favorites':
        filtered = filtered.filter(coin => favorites.has(coin.id));
        break;
      case 'gainers':
        filtered = filtered.filter(coin => coin.change_24h > 0);
        break;
      case 'losers':
        filtered = filtered.filter(coin => coin.change_24h < 0);
        break;
      default:
        break;
    }

    // Sort data
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    return filtered;
  };

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price) => {
    if (price >= 1000) return price.toLocaleString();
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-8 h-8 bg-white transform rotate-45"></div>
            </div>
            <p className="text-gray-600">در حال بارگذاری اطلاعات بازار...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            امکانات والکس
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            دسترسی به بیش از ۱۳۰ ارز دیجیتال با بهترین قیمت‌ها و کمترین کارمزد
          </p>
        </div>

        {/* Market Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap gap-2 p-6">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedTab === tab.id ? "default" : "ghost"}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                    selectedTab === tab.id 
                      ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedTab(tab.id)}
                >
                  {tab.label}
                  <Badge variant="secondary" className="mr-2 bg-gray-200 text-gray-700">
                    {tab.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Market Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">ارز</th>
                  <th 
                    className="px-6 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort('price')}
                  >
                    قیمت (USDT)
                    {sortBy === 'price' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">قیمت (تومان)</th>
                  <th 
                    className="px-6 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort('change24h')}
                  >
                    تغییر ۲۴ ساعت
                    {sortBy === 'change24h' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort('volume24h')}
                  >
                    حجم ۲۴ ساعت
                    {sortBy === 'volume24h' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getFilteredData().slice(0, 10).map((coin) => (
                  <tr 
                    key={coin.id} 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => onCoinSelect && onCoinSelect(coin)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(coin.id);
                          }}
                          className={`p-1 rounded-full transition-colors ${
                            favorites.has(coin.id) 
                              ? 'text-yellow-500 hover:text-yellow-600' 
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${favorites.has(coin.id) ? 'fill-current' : ''}`} />
                        </button>
                        <img 
                          src={coin.logo_url} 
                          alt={coin.symbol} 
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/32x32/e5e7eb/9ca3af?text=${coin.symbol}`;
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{coin.name_persian}</div>
                          <div className="text-sm text-gray-500">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${formatPrice(coin.price)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {coin.price_irr.toLocaleString()} ریال
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center space-x-1 space-x-reverse ${
                        coin.change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {coin.change_24h >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-semibold">
                          {Math.abs(coin.change_24h).toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      ${formatNumber(coin.volume_24h)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2 space-x-reverse">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1"
                        >
                          خرید
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 px-4 py-1"
                        >
                          فروش
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          <div className="p-6 text-center border-t border-gray-200">
            <Button variant="outline" className="px-8 py-2">
              مشاهده بیشتر
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {[
            {
              icon: '📊',
              title: 'API پیشرفته',
              description: 'بهره‌مندی از تمام امکانات والکس با استفاده از API'
            },
            {
              icon: '⚡',
              title: 'اعتبار معاملاتی',
              description: 'دریافت اعتبار معاملاتی و خرید فروش برای همه بازار'
            },
            {
              icon: '💰',
              title: 'خرید و فروش آنی',
              description: 'خرید و فروش آنی و آسان، امکان ۱۰۰۰ تومان پیشرفته'
            },
            {
              icon: '📈',
              title: 'بازارهای معاملاتی پیشرفته',
              description: 'بیش از ۱۳۰ نوع معاملاتی در بازارهای والت نقدی'
            }
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CryptoMarket;