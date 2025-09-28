import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  UserCheck, 
  Wallet, 
  TrendingUp, 
  Settings, 
  LogOut,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Download,
  Bell,
  BarChart3
} from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { adminAPI, handleApiError } from '../services/api';
import AdminUserManagement from './AdminUserManagement';
import AdminKYCManagement from './AdminKYCManagement';
import AdminSettings from './AdminSettings';

const AdminDashboard = ({ adminInfo, onLogout }) => {
  const [dashboardData, setDashboardData] = useState({
    statistics: {
      total_users: 0,
      pending_kyc: 0,
      pending_deposits: 0,
      pending_withdrawals: 0
    },
    recent_activities: {
      recent_users: [],
      recent_kyc: []
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data);
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

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    onLogout();
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue", trend = null }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
            {trend && (
              <p className={`text-xs text-${trend > 0 ? 'green' : 'red'}-500 flex items-center mt-1`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
              </p>
            )}
          </div>
          <div className={`p-3 bg-${color}-100 rounded-full`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 ml-3" />
              <h1 className="text-xl font-bold text-gray-900">پنل مدیریت والکس</h1>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-gray-400 ml-2" />
                <span className="text-sm text-gray-600">خوش آمدید، {adminInfo.username}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 ml-1" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center">
              <BarChart3 className="h-4 w-4 ml-2" />
              داشبورد
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 ml-2" />
              کاربران
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center">
              <UserCheck className="h-4 w-4 ml-2" />
              احراز هویت
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 ml-2" />
              تنظیمات
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="تعداد کاربران"
                value={dashboardData.statistics.total_users.toLocaleString()}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="احراز هویت در انتظار"
                value={dashboardData.statistics.pending_kyc}
                icon={UserCheck}
                color="yellow"
              />
              <StatCard
                title="واریز در انتظار"
                value={dashboardData.statistics.pending_deposits}
                icon={Wallet}
                color="green"
              />
              <StatCard
                title="برداشت در انتظار"
                value={dashboardData.statistics.pending_withdrawals}
                icon={TrendingUp}
                color="purple"
              />
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 ml-2" />
                    کاربران اخیر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.recent_activities.recent_users.length > 0 ? (
                      dashboardData.recent_activities.recent_users.map((user, index) => (
                        <div key={user.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <Badge variant={user.verified ? "default" : "secondary"}>
                            {user.verified ? "تایید شده" : "تایید نشده"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">کاربر جدیدی وجود ندارد</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent KYC */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="h-5 w-5 ml-2" />
                    درخواست‌های احراز هویت اخیر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.recent_activities.recent_kyc.length > 0 ? (
                      dashboardData.recent_activities.recent_kyc.map((kyc, index) => (
                        <div key={kyc.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{kyc.full_name}</p>
                            <p className="text-sm text-gray-600">{kyc.national_id}</p>
                          </div>
                          <Badge 
                            variant={
                              kyc.status === 'approved' ? 'default' : 
                              kyc.status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {kyc.status === 'approved' ? 'تایید شده' :
                             kyc.status === 'rejected' ? 'رد شده' : 'در انتظار'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">درخواست جدیدی وجود ندارد</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>عملیات سریع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="h-8 w-8 mb-2" />
                    <span>مدیریت کاربران</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab('kyc')}
                  >
                    <UserCheck className="h-8 w-8 mb-2" />
                    <span>بررسی احراز هویت</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="h-8 w-8 mb-2" />
                    <span>تنظیمات سیستم</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <AdminKYCManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings adminInfo={adminInfo} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;