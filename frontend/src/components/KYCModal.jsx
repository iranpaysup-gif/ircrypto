import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Upload, Check, AlertCircle, FileText, Camera, CreditCard } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { kycAPI, handleApiError } from '../services/api';

const KYCModal = ({ isOpen, onClose, currentUser, onKYCUpdate }) => {
  const [kycStatus, setKycStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState({});

  // KYC Steps based on Wallex.ir analysis
  const kycSteps = [
    {
      id: 1,
      title: 'اطلاعات شخصی',
      description: 'ثبت اطلاعات شناسایی اولیه',
      icon: FileText,
      completed: false
    },
    {
      id: 2,
      title: 'تایید هویت',
      description: 'آپلود تصویر کارت ملی',
      icon: CreditCard,
      completed: false
    },
    {
      id: 3,
      title: 'سلفی با کارت ملی',
      description: 'تصویر شما در کنار کارت ملی',
      icon: Camera,
      completed: false
    },
    {
      id: 4,
      title: 'بررسی نهایی',
      description: 'انتظار تایید توسط ادمین',
      icon: Check,
      completed: false
    }
  ];

  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    nationalCode: '',
    birthDate: '',
    address: '',
    postalCode: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchKYCStatus();
    }
  }, [isOpen]);

  const fetchKYCStatus = async () => {
    try {
      setIsLoading(true);
      const response = await kycAPI.getStatus();
      setKycStatus(response.data);
      
      // Set current step based on status
      if (response.data.level === 0) {
        setCurrentStep(1);
      } else if (response.data.level === 1) {
        setCurrentStep(2);
      } else if (response.data.level === 2) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoSubmit = async () => {
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.nationalCode) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای ضروری را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      await kycAPI.submit({
        type: 'personal_info',
        data: personalInfo
      });
      
      setCurrentStep(2);
      toast({
        title: 'موفقیت',
        description: 'اطلاعات شخصی با موفقیت ثبت شد',
        variant: 'default'
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

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'خطا',
        description: 'فقط فایل‌های JPEG و PNG مجاز هستند',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: 'خطا',
        description: 'حجم فایل باید کمتر از ۵ مگابایت باشد',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await kycAPI.uploadDocument(documentType, file);
      
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: true
      }));

      toast({
        title: 'موفقیت',
        description: 'فایل با موفقیت آپلود شد',
        variant: 'default'
      });

      // Auto-advance to next step when all required documents are uploaded
      if (documentType === 'national_id' && currentStep === 2) {
        setCurrentStep(3);
      } else if (documentType === 'selfie_with_id' && currentStep === 3) {
        setCurrentStep(4);
      }
    } catch (error) {
      toast({
        title: 'خطا در آپلود',
        description: handleApiError(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">اطلاعات شخصی</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام *</label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo(prev => ({...prev, firstName: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="نام خود را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام خانوادگی *</label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo(prev => ({...prev, lastName: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="نام خانوادگی خود را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">کد ملی *</label>
                <input
                  type="text"
                  value={personalInfo.nationalCode}
                  onChange={(e) => setPersonalInfo(prev => ({...prev, nationalCode: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="کد ملی ۱۰ رقمی"
                  maxLength="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ تولد</label>
                <input
                  type="date"
                  value={personalInfo.birthDate}
                  onChange={(e) => setPersonalInfo(prev => ({...prev, birthDate: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">آدرس</label>
              <textarea
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo(prev => ({...prev, address: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="آدرس کامل خود را وارد کنید"
              />
            </div>
            <Button 
              onClick={handlePersonalInfoSubmit}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'در حال ثبت...' : 'ثبت اطلاعات'}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">آپلود تصویر کارت ملی</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">تصویر واضح از روی کارت ملی خود آپلود کنید</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('national_id', e.target.files[0])}
                className="hidden"
                id="national-id-upload"
              />
              <label
                htmlFor="national-id-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 ml-2" />
                انتخاب فایل
              </label>
              {uploadedDocuments.national_id && (
                <div className="mt-4 flex items-center justify-center text-green-600">
                  <Check className="h-5 w-5 ml-2" />
                  <span>فایل آپلود شد</span>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 ml-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">نکات مهم:</p>
                  <ul className="mt-2 list-disc list-inside">
                    <li>تصویر باید واضح و خوانا باشد</li>
                    <li>کیفیت تصویر مناسب باشد</li>
                    <li>تمام قسمت‌های کارت ملی نمایان باشد</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">سلفی با کارت ملی</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">تصویری از خود در کنار کارت ملی آپلود کنید</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('selfie_with_id', e.target.files[0])}
                className="hidden"
                id="selfie-upload"
              />
              <label
                htmlFor="selfie-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 ml-2" />
                انتخاب فایل
              </label>
              {uploadedDocuments.selfie_with_id && (
                <div className="mt-4 flex items-center justify-center text-green-600">
                  <Check className="h-5 w-5 ml-2" />
                  <span>فایل آپلود شد</span>
                </div>
              )}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 ml-2" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">راهنمای عکس سلفی:</p>
                  <ul className="mt-2 list-disc list-inside">
                    <li>کارت ملی را در کنار صورت خود نگه دارید</li>
                    <li>صورت و کارت ملی به وضوح نمایان باشد</li>
                    <li>نور مناسب و تصویر بدون سایه باشد</li>
                    <li>اطلاعات کارت ملی خوانا باشد</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">در انتظار بررسی</h3>
            <p className="text-gray-600">
              مدارک شما با موفقیت ارسال شد. تیم بررسی والکس حداکثر تا ۲۴ ساعت آینده، مدارک شما را بررسی خواهد کرد.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ اطلاعات شخصی ثبت شد<br/>
                ✅ تصویر کارت ملی آپلود شد<br/>
                ✅ سلفی با کارت ملی آپلود شد<br/>
                ⏳ در انتظار تایید ادمین
              </p>
            </div>
            <p className="text-sm text-gray-500">
              پس از تایید، می‌توانید از تمام امکانات والکس استفاده کنید.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">احراز هویت</h2>
            <p className="text-sm text-gray-600 mt-1">برای استفاده از تمام امکانات، احراز هویت را تکمیل کنید</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            {kycSteps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted ? 'bg-green-500 border-green-500' :
                    isActive ? 'bg-blue-500 border-blue-500' : 
                    'bg-gray-100 border-gray-300'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <IconComponent className={`h-5 w-5 ${
                        isActive ? 'text-white' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  {index < kycSteps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <h3 className="font-semibold text-gray-900">{kycSteps[currentStep - 1]?.title}</h3>
            <p className="text-sm text-gray-600">{kycSteps[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default KYCModal;