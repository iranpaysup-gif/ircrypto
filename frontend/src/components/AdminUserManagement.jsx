import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Search, 
  Filter, 
  Eye, 
  Ban, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { adminAPI, handleApiError } from '../services/api';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getUsers({
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.total_pages);
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

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'نامشخص';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getUserStatusBadge = (user) => {
    if (user.verified) {
      return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>;
    }
    return <Badge variant="secondary">تایید نشده</Badge>;
  };

  const UserDetailModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">جزئیات کاربر</h3>
              <Button variant="ghost" onClick={onClose}>×</Button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ایمیل</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شماره تلفن</label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سطح کاربر</label>
                <Badge variant="outline">سطح {user.level || 0}</Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت تایید</label>
                {getUserStatusBadge(user)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ ثبت نام</label>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </div>

            {user.balance && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">موجودی کیف پول</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">تومان</p>
                    <p className="text-lg font-semibold text-green-800">
                      {(user.balance.TMN || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">دلار</p>
                    <p className="text-lg font-semibold text-blue-800">
                      ${(user.balance.USD || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-6 w-6 ml-2" />
            مدیریت کاربران
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="جستجو بر اساس نام، ایمیل یا شماره تلفن..."
                value={searchTerm}
                onChange={handleSearch}
                className="pr-10 text-right"
                dir="rtl"
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ml-1" />
                فیلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    کاربر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    اطلاعات تماس
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تاریخ ثبت نام
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.name ? user.name.charAt(0) : 'N'}
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">سطح {user.level || 0}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Mail className="h-3 w-3 text-gray-400 ml-1" />
                            {user.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 text-gray-400 ml-1" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUserStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-gray-400 ml-1" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-3 w-3 ml-1" />
                            مشاهده
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      کاربری یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                صفحه {currentPage} از {totalPages}
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  بعدی
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default AdminUserManagement;