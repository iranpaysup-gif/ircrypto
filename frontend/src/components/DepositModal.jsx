import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, CreditCard, Building, HelpCircle, Plus } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { walletAPI, handleApiError } from '../services/api';

const DepositModal = ({ isOpen, onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card-to-card');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // Predefined amounts in Toman
  const predefinedAmounts = [
    { value: 10000000, label: '10,000,000' },
    { value: 15000000, label: '15,000,000' },
    { value: 25000000, label: '25,000,000' }
  ];

  // Deposit methods
  const depositMethods = [
    {
      id: 'card-to-card',
      name: 'کارت به کارت',
      icon: CreditCard,
      recommended: true,
      processingTime: 'حداکثر ۱۰ دقیقه',
      description: 'انتقال آنی از کارت شما به کارت والکس'
    },
    {
      id: 'paya',
      name: 'پایا (شناسه دار)',
      icon: Building,
      recommended: false,
      processingTime: 'حداکثر ۱۰ دقیقه',
      description: 'انتقال از طریق سیستم پایا با شناسه'
    },
    {
      id: 'direct-deposit',
      name: 'سپرده به سپرده',
      icon: Building,
      recommended: false,
      processingTime: 'حداکثر ۳۰ دقیقه',
      description: 'انتقال مستقیم به حساب والکس'
    }
  ];

  // FAQ items
  const faqItems = [
    {
      id: 1,
      question: 'بهترین روش واریز در حال حاضر چیست؟',
      answer: 'کارت به کارت سریع‌ترین و آسان‌ترین روش واریز است که تا ۱۰ دقیقه زمان می‌برد.'
    },
    {
      id: 2,
      question: 'واریز با کارت به کارت چقدر زمان می‌برد؟',
      answer: 'معمولاً تا ۱۰ دقیقه زمان می‌برد. در موارد نادر ممکن است تا ۳۰ دقیقه طول بکشد.'
    },
    {
      id: 3,
      question: 'واریز با شناسه از طریق پایا چطور انجام می‌شود؟',
      answer: 'شماره شبا والکس را وارد کرده و شناسه کاربری خود را در قسمت توضیحات بنویسید.'
    },
    {
      id: 4,
      question: 'اگر از حساب شخص دیگری به والکس واریز کنم، چه اتفاقی می‌افتد؟',
      answer: 'فقط از حساب‌های به نام خودتان واریز کنید. واریزی از حساب دیگران برگشت داده می‌شود.'
    }
  ];

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toLocaleString());
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(value)) {
      setCustomAmount(Number(value).toLocaleString());
      setSelectedAmount(Number(value));
    }
  };

  const handleDeposit = async () => {
    if (!selectedAmount || selectedAmount < 100000) {
      toast({
        title: 'خطا',
        description: 'مبلغ واریز باید حداقل ۱۰۰,۰۰۰ تومان باشد',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const depositData = {
        amount: selectedAmount,
        method: selectedMethod,
        currency: 'TMN'
      };

      const response = await walletAPI.deposit(depositData);
      
      toast({
        title: 'درخواست واریز ثبت شد',
        description: 'درخواست واریز شما با موفقیت ثبت شد و در انتظار تأیید است.',
        variant: 'default'
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'خطا در ثبت درخواست',
        description: handleApiError(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">واریز تومان به کیف پول</h2>
            <p className="text-sm text-green-600 mt-1">پشتیبانی ۲۴ ساعته در ۷ روز هفته</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Deposit Tabs */}
            <div className="flex mb-6">
              <button className="px-6 py-3 bg-blue-500 text-white rounded-t-lg font-semibold">
                واریز تومان
              </button>
              <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-t-lg font-semibold mr-1">
                واریز کوین
              </button>
            </div>

            {/* Amount Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">مبلغ واریز</h3>
              
              {/* Custom Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مبلغ واریزی خود را وارد کنید
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="مبلغ را وارد کنید"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  />
                  <span className="absolute left-3 top-3 text-gray-500">تومان</span>
                </div>
              </div>

              {/* Predefined Amounts */}
              <div className="grid grid-cols-3 gap-3">
                {predefinedAmounts.map((amount) => (
                  <button
                    key={amount.value}
                    onClick={() => handleAmountSelect(amount.value)}
                    className={`px-4 py-3 border border-gray-300 rounded-lg text-center font-semibold transition-colors ${
                      selectedAmount === amount.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {amount.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deposit Methods */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">روش واریز</h3>
              
              <div className="space-y-3">
                {depositMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="depositMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center flex-1">
                        <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm mr-4">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-semibold text-gray-900">{method.name}</span>
                            {method.recommended && (
                              <Badge className="mr-2 bg-green-100 text-green-700">پیشنهادی والکس</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{method.processingTime}</p>
                          <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleDeposit}
              disabled={!selectedAmount || isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold"
            >
              {isLoading ? 'در حال پردازش...' : 'ادامه واریز'}
            </Button>
          </div>

          {/* FAQ Sidebar */}
          <div className="w-full lg:w-80 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-r border-gray-200">
            <div className="flex items-center mb-4">
              <HelpCircle className="h-5 w-5 text-gray-600 ml-2" />
              <h3 className="text-lg font-semibold text-gray-900">سوالات متداول</h3>
            </div>
            
            <div className="space-y-3">
              {faqItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg">
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="w-full p-4 text-right hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{item.question}</span>
                      <Plus 
                        className={`h-4 w-4 text-gray-500 transition-transform ${
                          expandedFAQ === item.id ? 'rotate-45' : ''
                        }`}
                      />
                    </div>
                  </button>
                  
                  {expandedFAQ === item.id && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">نکات مهم</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• حداقل مبلغ واریز ۱۰۰,۰۰۰ تومان است</li>
                <li>• فقط از حساب‌های به نام خودتان واریز کنید</li>
                <li>• کارمزد واریز رایگان است</li>
                <li>• پشتیبانی ۲۴ ساعته در خدمت شماست</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;