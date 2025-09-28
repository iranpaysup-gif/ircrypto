import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { walletData, tradingHistory, stakingOptions, userLevels } from '../mock/data';
import DepositModal from './DepositModal';
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
  EyeOff
} from 'lucide-react';

const UserDashboard = ({ user }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);

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
              <Badge 
                variant={user.verified ? "default" : "secondary"}
                className={user.verified ? "bg-green-100 text-green-800" : ""}
              >
                {user.verified ? 'تأیید شده' : 'تأیید نشده'}
              </Badge>
              <Badge variant="outline">
                سطح {user.level}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview">کلی</TabsTrigger>
            <TabsTrigger value="wallet">کیف پول</TabsTrigger>
            <TabsTrigger value="trading">معاملات</TabsTrigger>
            <TabsTrigger value="staking">استیکینگ</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
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
                        {showBalance ? formatCurrency(user.balance.IRR) : '••••••'}
                      </div>
                      <div className="text-lg text-green-600">
                        ≈ {showBalance ? formatCurrency(user.balance.USD, 'USD') : '•••'}
                      </div>
                      <div className="flex justify-center space-x-4 space-x-reverse mt-6">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setShowDepositModal(true)}
                        >
                          واریز
                        </Button>
                        <Button variant="outline">
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
                        onClick={() => setShowDepositModal(true)}
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
                        onClick={() => setShowDepositModal(true)}
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