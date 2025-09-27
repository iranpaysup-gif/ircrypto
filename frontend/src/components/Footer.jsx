import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Footer = () => {
  const footerSections = [
    {
      title: 'والکس',
      links: [
        { name: 'درباره ما', href: '#about' },
        { name: 'تماس با ما', href: '#contact' },
        { name: 'فرصت‌های شغلی', href: '#careers' },
        { name: 'اخبار', href: '#news' }
      ]
    },
    {
      title: 'خدمات',
      links: [
        { name: 'صرافی', href: '#exchange' },
        { name: 'کیف پول', href: '#wallet' },
        { name: 'API', href: '#api' },
        { name: 'اپلیکیشن موبایل', href: '#mobile' }
      ]
    },
    {
      title: 'پشتیبانی',
      links: [
        { name: 'مرکز راهنمایی', href: '#help' },
        { name: 'سوالات متداول', href: '#faq' },
        { name: 'تیکت پشتیبانی', href: '#support' },
        { name: 'وضعیت سیستم', href: '#status' }
      ]
    },
    {
      title: 'قانونی',
      links: [
        { name: 'شرایط استفاده', href: '#terms' },
        { name: 'حریم خصوصی', href: '#privacy' },
        { name: 'مجوزها', href: '#licenses' },
        { name: 'قوانین AML', href: '#aml' }
      ]
    }
  ];

  return (
    <footer className="bg-[#0A0E27] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">چرا والکس؟</h3>
            <p className="text-gray-400 mb-8">
              با عضویت در خبرنامه والکس، از آخرین اخبار و به‌روزرسانی‌های بازار ارزهای دیجیتال مطلع شوید
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="آدرس ایمیل خود را وارد کنید"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400 text-right"
                dir="rtl"
              />
              <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8">
                عضویت
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 space-x-reverse mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-white transform rotate-45"></div>
              </div>
              <span className="text-white font-bold text-2xl">WALLEX</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              والکس، اولین و معتبرترین صرافی ارز دیجیتال ایران با مجوز رسمی از بانک مرکزی
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                <span className="font-semibold">تلفن پشتیبانی:</span>
                <span className="mr-2 direction-ltr">021-1234567</span>
              </p>
              <p className="text-sm text-gray-400">
                <span className="font-semibold">ایمیل:</span>
                <span className="mr-2">support@wallex.ir</span>
              </p>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media and Apps */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            {/* Social Media */}
            <div className="flex items-center space-x-6 space-x-reverse">
              <span className="text-sm text-gray-400">دنبال کنید:</span>
              <div className="flex space-x-4 space-x-reverse">
                {[
                  { name: 'Telegram', icon: '📱' },
                  { name: 'Instagram', icon: '📷' },
                  { name: 'Twitter', icon: '🐦' },
                  { name: 'LinkedIn', icon: '💼' }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={`#${social.name.toLowerCase()}`}
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200"
                    title={social.name}
                  >
                    <span className="text-lg">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Mobile Apps */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-400">دانلود اپلیکیشن:</span>
              <div className="flex space-x-3 space-x-reverse">
                <a
                  href="#android"
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors duration-200"
                >
                  <span className="text-lg">📱</span>
                  <span className="text-sm">اندروید</span>
                </a>
                <a
                  href="#ios"
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors duration-200"
                >
                  <span className="text-lg">📱</span>
                  <span className="text-sm">iOS</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="text-center lg:text-right">
              <p className="text-sm text-gray-400">
                © ۱۴۰۳ والکس. تمامی حقوق محفوظ است.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                مجوز فعالیت شماره ۱۲۳۴۵۶ از بانک مرکزی جمهوری اسلامی ایران
              </p>
            </div>
            <div className="flex items-center space-x-6 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">وضعیت سیستم: فعال</span>
              </div>
              <div className="text-sm text-gray-400">
                آخرین به‌روزرسانی: ۱۴۰۳/۰۱/۲۵
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;