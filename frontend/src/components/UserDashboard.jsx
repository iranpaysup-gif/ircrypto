import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { walletData, tradingHistory, stakingOptions, userLevels } from '../mock/data';
import DepositModal from './DepositModal';
import KYCModal from './KYCModal';
import CardToCardPayment from './CardToCardPayment';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Shield, 
  Gift,
  BarChart3,
  CreditCard,
  History,
  Settings,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import { kycAPI, walletAPI, handleApiError } from '../services/api';
import { toast } from '../hooks/use-toast';

const UserDashboard = ({ user }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showCardToCardModal, setShowCardToCardModal] = useState(false);
  const [kycStatus, setKycStatus] = useState({ level: 0, status: 'pending' });
  const [walletBalance, setWalletBalance] = useState({ TMN: 0, USD: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const formatCurrency = (amount, currency = 'IRR') => {
    if (currency === 'IRR') {
      return `${formatNumber(amount)} ریال`;
    }
    return `$${formatNumber(amount)}`;
  };

  const getUserLevel = () => {
    return userLevels.find(level => level.level === user.level) || userLevels[0];
  };

  const getNextLevel = () => {
    const currentIndex = userLevels.findIndex(level => level.level === user.level);
    return currentIndex < userLevels.length - 1 ? userLevels[currentIndex + 1] : null;
  };

  useEffect(() => {
    fetchKYCStatus();
    fetchWalletBalance();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await kycAPI.getStatus();
      setKycStatus(response.data);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      setWalletBalance(response.data.balance || { TMN: 0, USD: 0 });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleKYCComplete = () => {
    setShowKYCModal(false);
    fetchKYCStatus();
    toast({
      title: 'احراز هویت تکمیل شد',
      description: 'اکنون می‌توانید از تمام امکانات استفاده کنید',
      variant: 'default'
    });
  };

  const handleDepositClick = () => {
    if (kycStatus.level === 0 || kycStatus.status === 'pending') {
      toast({
        title: 'احراز هویت لازم است',
        description: 'برای واریز ابتدا احراز هویت خود را تکمیل کنید',
        variant: 'destructive'
      });
      setShowKYCModal(true);
      return;
    }
    setShowCardToCardModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    fetchWalletBalance();
    toast({
      title: 'درخواست واریز ثبت شد',
      description: 'درخواست شما در انتظار تایید ادمین است',
      variant: 'default'
    });
  };

  const getKYCStatusBadge = () => {
    switch (kycStatus.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ml-1" />تایید شده</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 ml-1" />در انتظار بررسی</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 ml-1" />رد شده</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 ml-1" />تکمیل نشده</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">دشبورد کاربر</h1>
              <p className="text-gray-600">خوش آمدید {user.name}</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse mt-4 lg:mt-0">
              {getKYCStatusBadge()}
              <Badge variant="outline">
                سطح {kycStatus.level}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="overview">کلی</TabsTrigger>
            <TabsTrigger value="kyc">احراز هویت</TabsTrigger>
            <TabsTrigger value="wallet">کیف پول</TabsTrigger>
            <TabsTrigger value="trading">معاملات</TabsTrigger>
            <TabsTrigger value="staking">استیکینگ</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {kycStatus.status !== 'approved' && (
              <div className="mb-8">
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center ml-4">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-yellow-800">احراز هویت لازم است</h3>
                        <p className="text-yellow-700">
                          برای استفاده از تمام امکانات والکس، لطفاً احراز هویت خود را تکمیل کنید.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setShowKYCModal(true)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        تکمیل احراز هویت
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="h-5 w-5 ml-2" />
                    وضعیت احراز هویت
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>سطح فعلی:</span>
                      <Badge variant="outline">سطح {kycStatus.level}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>وضعیت:</span>
                      {getKYCStatusBadge()}
                    </div>
                    {kycStatus.status === 'approved' ? (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="h-5 w-5 ml-2" />
                          <span>احراز هویت شما تایید شده است</span>
                        </div>
                        <p className="text-sm text-green-700 mt-2">
                          شما می‌توانید از تمام امکانات والکس استفاده کنید.
                        </p>
                      </div>
                    ) : kycStatus.status === 'pending' ? (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center text-yellow-800">
                          <Clock className="h-5 w-5 ml-2" />
                          <span>مدارک شما در حال بررسی است</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-2">
                          لطفاً منتظر بررسی نهایی توسط تیم ما باشید.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center text-blue-800">
                          <Users className="h-5 w-5 ml-2" />
                          <span>احراز هویت خود را تکمیل کنید</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-2 mb-3">
                          برای دسترسی به تمام امکانات، احراز هویت لازم است.
                        </p>
                        <Button 
                          onClick={() => setShowKYCModal(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          شروع احراز هویت
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">مزایای احراز هویت</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span className="text-sm">امکان واریز و برداشت تومان</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span className="text-sm">افزایش حدود معاملاتی</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span className="text-sm">دسترسی به معاملات پیشرفته</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span className="text-sm">امنیت بالاتر حساب کاربری</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span className="text-sm">پشتیبانی اولویت‌دار</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Balance Overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Total Balance Card */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">موجودی کل</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBalance(!showBalance)}
                      >
                        {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {showBalance ? formatNumber(walletBalance.TMN) + ' تومان' : '••••••'}
                      </div>
                      <div className="text-lg text-green-600">
                        ≈ {showBalance ? '$' + formatNumber(walletBalance.USD) : '•••'}
                      </div>
                      {kycStatus.status !== 'approved' && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center justify-center text-yellow-800">
                            <AlertCircle className="h-4 w-4 ml-2" />
                            <span className="text-sm">برای واریز و برداشت، احراز هویت را تکمیل کنید</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-center space-x-4 space-x-reverse mt-6">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleDepositClick}
                        >
                          واریز
                        </Button>
                        <Button 
                          variant="outline"
                          disabled={kycStatus.status !== 'approved'}
                        >
                          برداشت
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="text-center p-4">
                    <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">+12.5%</div>
                    <div className="text-sm text-gray-600">سود ماهانه</div>
                  </Card>
                  <Card className="text-center p-4">
                    <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">24</div>
                    <div className="text-sm text-gray-600">معاملات</div>
                  </Card>
                  <Card className="text-center p-4">
                    <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="text-sm text-gray-600">استیک فعال</div>
                  </Card>
                  <Card className="text-center p-4">
                    <Shield className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{user.level}</div>
                    <div className="text-sm text-gray-600">سطح کاربر</div>
                  </Card>
                </div>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">آخرین معاملات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tradingHistory.slice(0, 5).map((trade) => (
                        <div key={trade.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              trade.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {trade.type === 'buy' ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {trade.type === 'buy' ? 'خرید' : 'فروش'} {trade.pair}
                              </div>
                              <div className="text-sm text-gray-600">{trade.date}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{formatNumber(trade.amount)}</div>
                            <div className="text-sm text-gray-600">${formatNumber(trade.price)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      مشاهده همه معاملات
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* User Level Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">سطح کاربر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div className="font-bold text-lg">سطح {user.level}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>حد روزانه:</span>
                        <span>{formatCurrency(getUserLevel().dailyLimit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>حد برداشت:</span>
                        <span>{formatCurrency(getUserLevel().withdrawLimit)}</span>
                      </div>
                    </div>
                    {getNextLevel() && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-center">
                          <div className="font-semibold text-blue-800">سطح بعدی: {getNextLevel().level}</div>
                          <div className="text-blue-600">KYC کامل برای ارتقا</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rewards */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">جوایز و پاداش</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 space-x-reverse p-3 bg-yellow-50 rounded-lg">
                        <Gift className="h-6 w-6 text-yellow-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">پاداش روزانه</div>
                          <div className="text-sm text-gray-600">۱۰۰۰ ریال</div>
                        </div>
                        <Button size="sm" variant="outline">
                          دریافت
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3 space-x-reverse p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">پاداش معاملات</div>
                          <div className="text-sm text-gray-600">۰.۱% کارمزد</div>
                        </div>
                        <Badge variant="secondary">فعال</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">دسترسی سریع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center"
                        onClick={handleDepositClick}
                      >
                        <CreditCard className="h-6 w-6 mb-1" />
                        <span className="text-sm">واریز</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                        <Wallet className="h-6 w-6 mb-1" />
                        <span className="text-sm">برداشت</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                        <BarChart3 className="h-6 w-6 mb-1" />
                        <span className="text-sm">معامله</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                        <Settings className="h-6 w-6 mb-1" />
                        <span className="text-sm">تنظیمات</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">دارایی‌ها</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {walletData.assets.map((asset, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {asset.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{asset.name}</div>
                              <div className="text-sm text-gray-600">{asset.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{formatNumber(asset.amount)}</div>
                            <div className="text-sm text-green-600">${formatNumber(asset.valueUSD)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">عملیات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleDepositClick}
                      >
                        واریز
                      </Button>
                      <Button variant="outline">
                        برداشت
                      </Button>
                      <Button variant="outline">
                        انتقال
                      </Button>
                      <Button variant="outline">
                        خرید
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تاریخچه معاملات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tradingHistory.map((trade) => (
                    <div key={trade.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          trade.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {trade.type === 'buy' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {trade.type === 'buy' ? 'خرید' : 'فروش'} {trade.pair}
                          </div>
                          <div className="text-sm text-gray-600">{trade.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatNumber(trade.amount)}</div>
                        <div className="text-sm text-gray-600">${formatNumber(trade.total)}</div>
                      </div>
                      <Badge 
                        variant={trade.status === 'completed' ? 'default' : 'secondary'}
                        className={trade.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {trade.status === 'completed' ? 'تکمیل شده' : trade.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staking Tab */}
          <TabsContent value="staking">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stakingOptions.map((option, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{option.name}</span>
                      <Badge variant="outline">{option.coin}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {option.apy}%
                        </div>
                        <div className="text-sm text-gray-600">نرخ بازدهی سالانه</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>حداقل مقدار:</span>
                          <span>{option.minAmount} {option.coin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مدت قفل:</span>
                          <span>{option.duration} روز</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white">
                        شروع استیکینگ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">اطلاعات حساب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>نام و نام خانوادگی:</span>
                      <span className="font-semibold">{user.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>شماره موبایل:</span>
                      <span className="font-semibold">{user.phone}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>ایمیل:</span>
                      <span className="font-semibold">{user.email}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>وضعیت تأیید:</span>
                      <Badge 
                        variant={user.verified ? "default" : "secondary"}
                        className={user.verified ? "bg-green-100 text-green-800" : ""}
                      >
                        {user.verified ? 'تأیید شده' : 'تأیید نشده'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">امنیت</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 ml-2" />
                      تغییر رمز عبور
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 ml-2" />
                      تنظیمات دو مرحله‌ای
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <History className="h-4 w-4 ml-2" />
                      تاریخچه ورود
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Deposit Modal */}
        <DepositModal 
          isOpen={showDepositModal} 
          onClose={() => setShowDepositModal(false)} 
        />
      </div>
    </div>
  );
};

export default UserDashboard;