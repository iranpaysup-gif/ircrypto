import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cryptoData, tradingPairs } from '../mock/data';
import { TrendingUp, TrendingDown, BarChart3, Activity, Wallet } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const TradingInterface = ({ selectedCoin, isAuthenticated, onLogin }) => {
  const [activeTab, setActiveTab] = useState('spot');
  const [orderType, setOrderType] = useState('market');
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderForm, setOrderForm] = useState({
    side: 'buy',
    amount: '',
    price: '',
    total: ''
  });
  const [openOrders, setOpenOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(67850);

  useEffect(() => {
    if (selectedCoin) {
      const pair = `${selectedCoin.symbol}/USDT`;
      setSelectedPair(pair);
      setCurrentPrice(selectedCoin.price);
    }
  }, [selectedCoin]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: 'ورود لازم',
        description: 'برای معامله ابتدا وارد حساب کاربری خود شوید',
        variant: 'destructive'
      });
      onLogin();
      return;
    }

    if (!orderForm.amount || (orderType === 'limit' && !orderForm.price)) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمامی فیلدهای ضروری را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Mock order submission
      const order = {
        id: Date.now(),
        pair: selectedPair,
        side: orderForm.side,
        type: orderType,
        amount: parseFloat(orderForm.amount),
        price: orderType === 'market' ? currentPrice : parseFloat(orderForm.price),
        status: orderType === 'market' ? 'filled' : 'open',
        timestamp: new Date().toISOString()
      };

      if (orderType === 'market') {
        setOrderHistory(prev => [order, ...prev]);
        toast({
          title: 'معامله موفق',
          description: `${order.side === 'buy' ? 'خرید' : 'فروش'} ${order.amount} ${selectedPair.split('/')[0]} با موفقیت انجام شد`,
        });
      } else {
        setOpenOrders(prev => [order, ...prev]);
        toast({
          title: 'سفارش ثبت شد',
          description: `سفارش ${order.side === 'buy' ? 'خرید' : 'فروش'} با موفقیت ثبت شد`,
        });
      }

      // Reset form
      setOrderForm({
        side: orderForm.side,
        amount: '',
        price: '',
        total: ''
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ثبت سفارش',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field, value) => {
    const newForm = { ...orderForm, [field]: value };
    
    // Auto-calculate total
    if (field === 'amount' || field === 'price') {
      const amount = parseFloat(newForm.amount) || 0;
      const price = orderType === 'market' ? currentPrice : (parseFloat(newForm.price) || 0);
      newForm.total = (amount * price).toFixed(2);
    }
    
    setOrderForm(newForm);
  };

  const cancelOrder = (orderId) => {
    setOpenOrders(prev => prev.filter(order => order.id !== orderId));
    toast({
      title: 'سفارش لغو شد',
      description: 'سفارش با موفقیت لغو شد',
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fa-IR');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">معاملات پیشرفته</h1>
              <p className="text-gray-600">معامله ارزهای دیجیتال با بهترین قیمت‌ها</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse mt-4 lg:mt-0">
              <Badge variant="outline" className="text-green-600 border-green-200">
                فعال
              </Badge>
              <span className="text-sm text-gray-500">آخرین به‌روزرسانی: همین الان</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel - Market Data */}
          <div className="lg:col-span-3">
            {/* Pair Selector */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">جفت ارز</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tradingPairs.slice(0, 8).map((pair, index) => {
                    const isSelected = selectedPair === pair.pair;
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => {
                          setSelectedPair(pair.pair);
                          setCurrentPrice(pair.price);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{pair.pair}</div>
                            <div className="text-sm text-gray-500">${formatNumber(pair.price)}</div>
                          </div>
                          <div className={`text-sm font-semibold ${
                            pair.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Market Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">آمار بازار</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">قیمت فعلی:</span>
                    <span className="font-semibold">${formatNumber(currentPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">بالاترین ۲۴س:</span>
                    <span className="text-green-600">${formatNumber(currentPrice * 1.02)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">پایین‌ترین ۲۴س:</span>
                    <span className="text-red-600">${formatNumber(currentPrice * 0.98)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">حجم ۲۴س:</span>
                    <span>1,234.56 BTC</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Chart and Trading */}
          <div className="lg:col-span-6">
            {/* Price Chart */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">نمودار قیمت {selectedPair}</CardTitle>
                  <div className="flex space-x-2 space-x-reverse">
                    {['1س', '5د', '1م', '1سال'].map((timeframe) => (
                      <Button key={timeframe} variant="outline" size="sm">
                        {timeframe}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Mock Chart */}
                <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">نمودار قیمت {selectedPair}</p>
                    <p className="text-sm text-gray-400 mt-2">قیمت فعلی: ${formatNumber(currentPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">فرم معامله</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="spot">معامله نقدی</TabsTrigger>
                    <TabsTrigger value="margin">معامله با اهرم</TabsTrigger>
                  </TabsList>

                  <TabsContent value="spot">
                    <form onSubmit={handleOrderSubmit} className="space-y-6">
                      {/* Order Type */}
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          type="button"
                          variant={orderType === 'market' ? 'default' : 'outline'}
                          onClick={() => setOrderType('market')}
                          className="flex-1"
                        >
                          بازاری
                        </Button>
                        <Button
                          type="button"
                          variant={orderType === 'limit' ? 'default' : 'outline'}
                          onClick={() => setOrderType('limit')}
                          className="flex-1"
                        >
                          محدود
                        </Button>
                      </div>

                      {/* Buy/Sell Tabs */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${
                          orderForm.side === 'buy' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-green-300'
                        } cursor-pointer transition-colors`}
                        onClick={() => setOrderForm(prev => ({ ...prev, side: 'buy' }))}
                        >
                          <div className="text-center">
                            <div className="text-green-600 font-semibold mb-2">خرید</div>
                            <div className="text-sm text-gray-600">${formatNumber(currentPrice)}</div>
                          </div>
                        </div>
                        <div className={`p-4 rounded-lg border-2 ${
                          orderForm.side === 'sell' 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 bg-white hover:border-red-300'
                        } cursor-pointer transition-colors`}
                        onClick={() => setOrderForm(prev => ({ ...prev, side: 'sell' }))}
                        >
                          <div className="text-center">
                            <div className="text-red-600 font-semibold mb-2">فروش</div>
                            <div className="text-sm text-gray-600">${formatNumber(currentPrice)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Order Form Fields */}
                      {orderType === 'limit' && (
                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-right block">قیمت (USDT)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            placeholder="قیمت مورد نظر"
                            className="text-right"
                            dir="rtl"
                            value={orderForm.price}
                            onChange={(e) => handleInputChange('price', e.target.value)}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-right block">مقدار ({selectedPair.split('/')[0]})</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.00000001"
                          placeholder="مقدار مورد نظر"
                          className="text-right"
                          dir="rtl"
                          value={orderForm.amount}
                          onChange={(e) => handleInputChange('amount', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="total" className="text-right block">کل (USDT)</Label>
                        <Input
                          id="total"
                          type="number"
                          placeholder="کل مبلغ"
                          className="text-right bg-gray-50"
                          dir="rtl"
                          value={orderForm.total}
                          readOnly
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className={`w-full py-3 font-semibold ${
                          orderForm.side === 'buy'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {orderForm.side === 'buy' ? 'خرید' : 'فروش'} {selectedPair.split('/')[0]}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="margin">
                    <div className="text-center py-8">
                      <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">معامله با اهرم به زودی فعال خواهد شد</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Orders */}
          <div className="lg:col-span-3">
            {/* Open Orders */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">سفارشات باز</CardTitle>
              </CardHeader>
              <CardContent>
                {openOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">سفارش بازی وجود ندارد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {openOrders.map((order) => (
                      <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm">
                            <span className={`font-semibold ${
                              order.side === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {order.side === 'buy' ? 'خرید' : 'فروش'}
                            </span>
                            <span className="mr-2">{order.pair}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => cancelOrder(order.id)}
                            className="text-xs"
                          >
                            لغو
                          </Button>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>مقدار: {formatNumber(order.amount)}</div>
                          <div>قیمت: ${formatNumber(order.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تاریخچه معاملات</CardTitle>
              </CardHeader>
              <CardContent>
                {orderHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">معامله‌ای انجام نشده</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm">
                            <span className={`font-semibold ${
                              order.side === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {order.side === 'buy' ? 'خرید' : 'فروش'}
                            </span>
                            <span className="mr-2">{order.pair}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {order.status === 'filled' ? 'انجام شده' : order.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>مقدار: {formatNumber(order.amount)}</div>
                          <div>قیمت: ${formatNumber(order.price)}</div>
                          <div>زمان: {formatDate(order.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;