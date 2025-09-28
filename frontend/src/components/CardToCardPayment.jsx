import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Copy, Check, Clock, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { walletAPI, handleApiError } from '../services/api';

const CardToCardPayment = ({ isOpen, onClose, onPaymentSubmit }) => {
  const [step, setStep] = useState(1); // 1: Amount, 2: Card Details, 3: Transaction Info
  const [amount, setAmount] = useState('');
  const [wallex_card_number, setWallexCardNumber] = useState('6037-9911-1234-5678'); // Mock Wallex card
  const [copied, setCopied] = useState(false);
  const [transactionInfo, setTransactionInfo] = useState({
    senderCardNumber: '',
    transactionId: '',
    transactionDate: '',
    transactionTime: '',
    amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined amounts in Toman
  const predefinedAmounts = [
    { value: 1000000, label: '1,000,000 تومان' },
    { value: 5000000, label: '5,000,000 تومان' },
    { value: 10000000, label: '10,000,000 تومان' },
    { value: 20000000, label: '20,000,000 تومان' },
    { value: 50000000, label: '50,000,000 تومان' },
    { value: 100000000, label: '100,000,000 تومان' }
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount('');
      setTransactionInfo({
        senderCardNumber: '',
        transactionId: '',
        transactionDate: '',
        transactionTime: '',
        amount: ''
      });
    }
  }, [isOpen]);

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toLocaleString());
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(value)) {
      setAmount(Number(value).toLocaleString());
    }
  };

  const proceedToCardDetails = () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    
    if (numericAmount < 100000) {
      toast({
        title: 'خطا',
        description: 'حداقل مبلغ واریز ۱۰۰,۰۰۰ تومان است',
        variant: 'destructive'
      });
      return;
    }

    if (numericAmount > 500000000) {
      toast({
        title: 'خطا',
        description: 'حداکثر مبلغ واریز ۵۰۰,۰۰۰,۰۰۰ تومان است',
        variant: 'destructive'
      });
      return;
    }

    setTransactionInfo(prev => ({ ...prev, amount: amount }));
    setStep(2);
  };

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(wallex_card_number.replace(/-/g, ''));
      setCopied(true);
      toast({
        title: 'کپی شد',
        description: 'شماره کارت کپی شد',
        variant: 'default'
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'امکان کپی وجود ندارد',
        variant: 'destructive'
      });
    }
  };

  const proceedToTransactionInfo = () => {
    setStep(3);
  };

  const handleTransactionSubmit = async () => {
    if (!transactionInfo.senderCardNumber || !transactionInfo.transactionId) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای ضروری را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    if (transactionInfo.senderCardNumber.length !== 16) {
      toast({
        title: 'خطا',
        description: 'شماره کارت باید ۱۶ رقم باشد',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const paymentData = {
        amount: Number(amount.replace(/,/g, '')),
        payment_method: 'card_to_card',
        transaction_details: {
          sender_card: transactionInfo.senderCardNumber,
          receiver_card: wallex_card_number.replace(/-/g, ''),
          transaction_id: transactionInfo.transactionId,
          transaction_date: transactionInfo.transactionDate,
          transaction_time: transactionInfo.transactionTime
        }
      };

      const response = await walletAPI.deposit(paymentData);
      
      toast({
        title: 'درخواست ثبت شد',
        description: 'درخواست واریز شما ثبت شد و در انتظار تایید ادمین است',
        variant: 'default'
      });

      if (onPaymentSubmit) {
        onPaymentSubmit(response.data);
      }
      
      onClose();
    } catch (error) {
      toast({
        title: 'خطا در ثبت درخواست',
        description: handleApiError(error),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">مبلغ واریز به تومان</h3>
              
              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ دلخواه</label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="مبلغ را وارد کنید"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right text-lg"
                  />
                  <span className="absolute left-3 top-3 text-gray-500">تومان</span>
                </div>
              </div>

              {/* Predefined Amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">مبالغ پیشنهادی</label>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedAmounts.map((predefined) => (
                    <button
                      key={predefined.value}
                      onClick={() => handleAmountSelect(predefined.value)}
                      className={`p-3 border border-gray-300 rounded-lg text-center font-medium transition-colors hover:bg-gray-50 ${
                        amount === predefined.value.toLocaleString()
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {predefined.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-600 ml-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">نکات مهم:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• حداقل مبلغ واریز: ۱۰۰,۰۰۰ تومان</li>
                    <li>• حداکثر مبلغ واریز: ۵۰۰,۰۰۰,۰۰۰ تومان</li>
                    <li>• انتقال از کارت‌های بانک‌های ایرانی</li>
                    <li>• کارمزد انتقال رایگان است</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={proceedToCardDetails}
              disabled={!amount}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold"
            >
              ادامه
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">انتقال کارت به کارت</h3>
              <p className="text-gray-600">مبلغ {amount} تومان را به کارت زیر انتقال دهید</p>
            </div>

            {/* Wallex Card Details */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center ml-2">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="font-bold">WALLEX</span>
                </div>
                <Badge variant="secondary" className="bg-white bg-opacity-20 text-white">
                  بانک ملی
                </Badge>
              </div>
              
              <div className="mb-4">
                <p className="text-sm opacity-90 mb-1">شماره کارت</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold tracking-wider">
                    {wallex_card_number}
                  </span>
                  <button
                    onClick={copyCardNumber}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-300" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-90">مبلغ انتقال</p>
                  <p className="font-bold">{amount} تومان</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">نام دریافت کننده</p>
                  <p className="font-bold">صرافی والکس</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-600 ml-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">مراحل انتقال:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>وارد اپلیکیشن بانکی خود شوید</li>
                    <li>شماره کارت والکس را وارد کنید</li>
                    <li>مبلغ {amount} تومان را انتقال دهید</li>
                    <li>اطلاعات تراکنش را یادداشت کنید</li>
                    <li>در مرحله بعد اطلاعات را وارد کنید</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <Button 
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                بازگشت
              </Button>
              <Button 
                onClick={proceedToTransactionInfo}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                انتقال انجام شد
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">اطلاعات تراکنش</h3>
              <p className="text-gray-600">اطلاعات تراکنش انجام شده را وارد کنید</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شماره کارت مبدأ (کارت شما) *
                </label>
                <input
                  type="text"
                  value={transactionInfo.senderCardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 16) {
                      setTransactionInfo(prev => ({...prev, senderCardNumber: value}));
                    }
                  }}
                  placeholder="شماره کارت ۱۶ رقمی"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength="16"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شماره پیگیری تراکنش *
                </label>
                <input
                  type="text"
                  value={transactionInfo.transactionId}
                  onChange={(e) => setTransactionInfo(prev => ({...prev, transactionId: e.target.value}))}
                  placeholder="شماره پیگیری از اپلیکیشن بانک"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ تراکنش</label>
                  <input
                    type="date"
                    value={transactionInfo.transactionDate}
                    onChange={(e) => setTransactionInfo(prev => ({...prev, transactionDate: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ساعت تراکنش</label>
                  <input
                    type="time"
                    value={transactionInfo.transactionTime}
                    onChange={(e) => setTransactionInfo(prev => ({...prev, transactionTime: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">خلاصه درخواست</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">مبلغ:</span>
                  <span className="font-semibold">{amount} تومان</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">کارت مقصد:</span>
                  <span className="font-mono">{wallex_card_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">روش واریز:</span>
                  <span>کارت به کارت</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex">
                <Clock className="h-5 w-5 text-green-600 ml-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">پس از ثبت درخواست:</p>
                  <p className="mt-1">درخواست شما توسط تیم والکس بررسی و حداکثر تا ۳۰ دقیقه تایید خواهد شد.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <Button 
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1"
              >
                بازگشت
              </Button>
              <Button 
                onClick={handleTransactionSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'در حال ثبت...' : 'ثبت درخواست واریز'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">واریز کارت به کارت</h2>
              <div className="flex items-center mt-2">
                <div className="flex space-x-1 space-x-reverse">
                  {[1, 2, 3].map((stepNumber) => (
                    <div
                      key={stepNumber}
                      className={`w-8 h-1 rounded-full ${
                        step >= stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 mr-3">مرحله {step} از ۳</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="sr-only">بستن</span>
              ×
            </button>
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

export default CardToCardPayment;