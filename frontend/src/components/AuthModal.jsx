import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from '../hooks/use-toast';
import { authAPI, smsAPI, handleApiError } from '../services/api';
import { Eye, EyeOff, Phone, Mail, User } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    verificationCode: ''
  });
  const [step, setStep] = useState('form'); // 'form' or 'verification'

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.password) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمامی فیلدها را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login({
        phone: formData.phone,
        password: formData.password
      });
      
      onSuccess(response.data);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.email || !formData.password || !formData.firstName) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمامی فیلدهای ضروری را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'خطا',
        description: 'رمز عبور و تکرار آن یکسان نیست',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'خطا',
        description: 'رمز عبور باید حداقل ۸ کاراکتر باشد',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      setStep('verification');
      toast({
        title: 'ثبت نام موفق',
        description: response.data.message,
      });
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

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      toast({
        title: 'خطا',
        description: 'لطفاً کد ۶ رقمی تأیید را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.verifyPhone({
        phone: formData.phone,
        code: formData.verificationCode
      });
      
      // Now log in the user
      const loginResponse = await authAPI.login({
        phone: formData.phone,
        password: formData.password
      });
      
      toast({
        title: 'تأیید موفق',
        description: 'حساب کاربری شما با موفقیت فعال شد',
      });
      
      onSuccess(loginResponse.data);
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

  const resetForm = () => {
    setFormData({
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      verificationCode: ''
    });
    setStep('form');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            {step === 'verification' ? 'تأیید شماره موبایل' : 'ورود به والکس'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="text-sm">ورود</TabsTrigger>
              <TabsTrigger value="register" className="text-sm">ثبت نام</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right block">شماره موبایل *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09123456789"
                      className="text-right pr-4 pl-10"
                      dir="rtl"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-right block">رمز عبور *</Label>
                  <div className="relative">
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="رمز عبور خود را وارد کنید"
                      className="text-right pr-4 pl-10"
                      dir="rtl"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'در حال ورود...' : 'ورود'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-right block">نام *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="نام"
                        className="text-right pr-4 pl-10"
                        dir="rtl"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-right block">نام خانوادگی</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="نام خانوادگی"
                      className="text-right pr-4"
                      dir="rtl"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right block">شماره موبایل *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09123456789"
                      className="text-right pr-4 pl-10"
                      dir="rtl"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right block">ایمیل *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className="text-right pr-4 pl-10"
                      dir="rtl"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-right block">رمز عبور *</Label>
                  <div className="relative">
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="حداقل ۸ کاراکتر"
                      className="text-right pr-4 pl-10"
                      dir="rtl"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-right block">تکرار رمز عبور *</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="تکرار رمز عبور"
                    className="text-right pr-4"
                    dir="rtl"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'در حال ثبت نام...' : 'ثبت نام'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleVerification} className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                کد تأیید به شماره {formData.phone} ارسال شد
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-right block">کد تأیید *</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="123456"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                value={formData.verificationCode}
                onChange={(e) => handleInputChange('verificationCode', e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div className="flex space-x-4 space-x-reverse">
              <Button 
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep('form')}
              >
                بازگشت
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'در حال تأیید...' : 'تأیید'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;