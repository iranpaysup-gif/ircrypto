import React, { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Header = ({ isAuthenticated, onLogin, onLogout, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { title: 'صرافی', href: '#exchange' },
    { title: 'اعتبار', href: '#credit' },
    { title: 'استیکینگ طلا', href: '#staking' },
    { title: 'فیچت لرن اَند ارن', href: '#learn' },
    { title: 'خرید ارز دیجیتال', href: '#buy' },
    { title: 'مقاله', href: '#articles' },
  ];

  return (
    <header className="bg-[#0A0E27] border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white transform rotate-45"></div>
              </div>
              <span className="text-white font-bold text-xl">WALLEX</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 space-x-reverse">
            {navigationItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
              >
                {item.title}
              </a>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  فارسی
                  <ChevronDown className="h-4 w-4 mr-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                <DropdownMenuItem className="text-white hover:bg-gray-800">
                  فارسی
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-800">
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropgroundMenu>

            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            </Button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-gray-800">
                    <User className="h-4 w-4 ml-2" />
                    {currentUser?.name || 'کاربر'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                  <DropdownMenuItem className="text-white hover:bg-gray-800">
                    پروفایل
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-gray-800">
                    کیف پول
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-gray-800">
                    تنظیمات
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-400 hover:bg-gray-800"
                    onClick={onLogout}
                  >
                    خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropgroundMenu>
            ) : (
              <Button 
                onClick={onLogin}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-2"
              >
                ورود یا ثبت نام
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0A0E27] border-gray-800">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.title}
                    </a>
                  ))}
                  {!isAuthenticated && (
                    <Button 
                      onClick={onLogin}
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white mt-4"
                    >
                      ورود یا ثبت نام
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;