import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from '../hooks/use-toast';

const Hero = ({ onPhoneSubmit }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً شماره موبایل خود را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await onPhoneSubmit(phoneNumber);
      toast({
        title: 'موفق',
        description: 'کد تأیید برای شما ارسال شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ارسال کد تأیید',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-[#0A0E27] via-[#1A1F3A] to-[#0A0E27] min-h-screen flex items-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-32 left-40 w-3 h-3 bg-cyan-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-20 right-20 w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse opacity-60"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-right space-y-8">
            {/* 3D Logo Animation */}
            <div className="flex justify-center lg:justify-end mb-8">
              <div className="relative">
                {/* Main triangular logo with orbital animation */}
                <div className="relative w-80 h-80">
                  {/* Central triangle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-cyan-500 transform rotate-0 hover:rotate-12 transition-transform duration-500">
                      <div className="w-full h-full bg-gradient-to-br from-green-300 to-blue-400 clip-triangle relative">
                        <div className="absolute inset-2 bg-gradient-to-tr from-green-200 to-cyan-300 clip-triangle"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Orbital rings */}
                  <div className="absolute inset-0 animate-spin-slow">
                    <div className="w-full h-full border-2 border-gradient-to-r from-green-400/30 to-transparent rounded-full">
                      {/* Orbital elements */}
                      <div className="absolute top-4 left-1/2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-1/2 right-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-4 left-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-8 animate-spin-reverse-slow">
                    <div className="w-full h-full border border-gradient-to-l from-blue-400/20 to-transparent rounded-full">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                صرافی ارز دیجیتال
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">
                  والکس
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                تا ۱۰۰ هزار تومان برای همه در 
                <span className="text-green-400 font-semibold">پامپ ۳</span>
              </p>
            </div>

            {/* Phone Input Form */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto lg:mx-0 lg:mr-auto">
              <div className="flex gap-3">
                <Input
                  type="tel"
                  placeholder="شماره موبایل را وارد کنید"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400 text-right"
                  dir="rtl"
                />
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {isLoading ? 'در حال ارسال...' : 'ثبت نام'}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="grid grid-cols-2 gap-6">
            {/* Feature Card 1 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">پشتیبانی ۲۴/۷</h3>
              <p className="text-gray-400 text-sm">پشتیبانی تمام وقت برای کاربران</p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">برداشت آنی</h3>
              <p className="text-gray-400 text-sm">دریافت اعتبار معاملاتی و خرید فروش</p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">والت پیشرفته</h3>
              <p className="text-gray-400 text-sm">خرید و فروش، امکان ۱۰۰۰ تومان</p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-green-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">بازارهای معاملاتی پیشرفته</h3>
              <p className="text-gray-400 text-sm">بیش از ۱۳۰ نوع رمزارز معاملاتی</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;