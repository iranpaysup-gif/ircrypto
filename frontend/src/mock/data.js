// Mock data for Wallex.ir clone

// Cryptocurrency prices and market data
export const cryptoData = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'بیت کوین',
    nameEn: 'Bitcoin',
    price: 67850,
    priceIRR: 2847500000,
    change24h: 2.45,
    volume24h: 28500000000,
    marketCap: 1335000000000,
    high24h: 68200,
    low24h: 66800,
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'اتریوم',
    nameEn: 'Ethereum',
    price: 3850,
    priceIRR: 161350000,
    change24h: -1.23,
    volume24h: 15200000000,
    marketCap: 463000000000,
    high24h: 3920,
    low24h: 3810,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'تتر',
    nameEn: 'Tether',
    price: 1.00,
    priceIRR: 42000,
    change24h: 0.05,
    volume24h: 45000000000,
    marketCap: 118000000000,
    high24h: 1.002,
    low24h: 0.998,
    logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'بایننس کوین',
    nameEn: 'BNB',
    price: 625,
    priceIRR: 26250000,
    change24h: 3.67,
    volume24h: 1850000000,
    marketCap: 89500000000,
    high24h: 635,
    low24h: 610,
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png'
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'کاردانو',
    nameEn: 'Cardano',
    price: 0.95,
    priceIRR: 39900,
    change24h: -2.15,
    volume24h: 750000000,
    marketCap: 33500000000,
    high24h: 0.98,
    low24h: 0.92,
    logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png'
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'سولانا',
    nameEn: 'Solana',
    price: 145,
    priceIRR: 6090000,
    change24h: 5.23,
    volume24h: 2800000000,
    marketCap: 68500000000,
    high24h: 148,
    low24h: 138,
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png'
  }
];

// Trading pairs
export const tradingPairs = [
  { pair: 'BTC/USDT', price: 67850, change: 2.45 },
  { pair: 'ETH/USDT', price: 3850, change: -1.23 },
  { pair: 'BNB/USDT', price: 625, change: 3.67 },
  { pair: 'ADA/USDT', price: 0.95, change: -2.15 },
  { pair: 'SOL/USDT', price: 145, change: 5.23 },
  { pair: 'DOT/USDT', price: 28.5, change: 1.85 },
  { pair: 'LINK/USDT', price: 14.2, change: -0.92 },
  { pair: 'UNI/USDT', price: 8.45, change: 2.76 }
];

// User wallet data
export const walletData = {
  totalBalance: 125000000, // IRR
  totalBalanceUSD: 2975,
  assets: [
    {
      symbol: 'BTC',
      name: 'بیت کوین',
      amount: 0.05,
      value: 142375000,
      valueUSD: 3392.5
    },
    {
      symbol: 'ETH',
      name: 'اتریوم',
      amount: 1.2,
      value: 193620000,
      valueUSD: 4620
    },
    {
      symbol: 'USDT',
      name: 'تتر',
      amount: 500,
      value: 21000000,
      valueUSD: 500
    }
  ]
};

// Trading history
export const tradingHistory = [
  {
    id: 1,
    pair: 'BTC/USDT',
    type: 'buy',
    amount: 0.01,
    price: 67200,
    total: 672,
    date: '2024-01-15 14:30:25',
    status: 'completed'
  },
  {
    id: 2,
    pair: 'ETH/USDT',
    type: 'sell',
    amount: 0.5,
    price: 3900,
    total: 1950,
    date: '2024-01-15 12:15:10',
    status: 'completed'
  },
  {
    id: 3,
    pair: 'BNB/USDT',
    type: 'buy',
    amount: 2,
    price: 620,
    total: 1240,
    date: '2024-01-14 16:45:33',
    status: 'completed'
  }
];

// Features data
export const features = [
  {
    id: 1,
    title: 'پشتیبانی ۲۴/۷',
    description: 'پشتیبانی تمام وقت برای کاربران',
    icon: 'headphones'
  },
  {
    id: 2,
    title: 'برداشت آنی',
    description: 'دریافت اعتبار معاملاتی و خرید فروش آنی',
    icon: 'zap'
  },
  {
    id: 3,
    title: 'والت پیشرفته',
    description: 'خرید و فروش آپ و دان، امکان ۱۰۰۰ تومان',
    icon: 'wallet'
  },
  {
    id: 4,
    title: 'بازارهای معاملاتی پیشرفته',
    description: 'بیش از ۱۳۰ نوع رمزار معاملاتی در بازار والت نقدی',
    icon: 'trending-up'
  }
];

// News and announcements
export const news = [
  {
    id: 1,
    title: 'بیت کوین به قیمت جدید رسید',
    summary: 'قیمت بیت کوین در بازار جهانی به بالاترین حد خود در سال جاری رسید',
    date: '1403/01/25',
    category: 'market'
  },
  {
    id: 2,
    title: 'اضافه شدن ارز جدید به والکس',
    summary: 'ارز دیجیتال جدید SOL به لیست ارزهای قابل معامله در والکس اضافه شد',
    date: '1403/01/23',
    category: 'announcement'
  },
  {
    id: 3,
    title: 'کاهش کارمزد معاملات',
    summary: 'کارمزد معاملات در والکس برای کاربران VIP کاهش یافت',
    date: '1403/01/20',
    category: 'update'
  }
];

// Chart data for trading view
export const chartData = {
  'BTC/USDT': [
    { time: '09:00', price: 66800, volume: 125000 },
    { time: '10:00', price: 67200, volume: 135000 },
    { time: '11:00', price: 67500, volume: 128000 },
    { time: '12:00', price: 67300, volume: 142000 },
    { time: '13:00', price: 67850, volume: 158000 },
    { time: '14:00', price: 68000, volume: 145000 },
    { time: '15:00', price: 67920, volume: 132000 }
  ],
  'ETH/USDT': [
    { time: '09:00', price: 3810, volume: 85000 },
    { time: '10:00', price: 3890, volume: 92000 },
    { time: '11:00', price: 3920, volume: 88000 },
    { time: '12:00', price: 3880, volume: 95000 },
    { time: '13:00', price: 3850, volume: 102000 },
    { time: '14:00', price: 3870, volume: 89000 },
    { time: '15:00', price: 3860, volume: 91000 }
  ]
};

// User account levels
export const userLevels = [
  { level: 'Bronze', dailyLimit: 50000000, withdrawLimit: 10000000 },
  { level: 'Silver', dailyLimit: 200000000, withdrawLimit: 50000000 },
  { level: 'Gold', dailyLimit: 1000000000, withdrawLimit: 200000000 },
  { level: 'Platinum', dailyLimit: 5000000000, withdrawLimit: 1000000000 }
];

// Staking options
export const stakingOptions = [
  {
    coin: 'BTC',
    name: 'بیت کوین',
    apy: 5.2,
    minAmount: 0.001,
    duration: 30
  },
  {
    coin: 'ETH',
    name: 'اتریوم',
    apy: 6.8,
    minAmount: 0.1,
    duration: 60
  },
  {
    coin: 'ADA',
    name: 'کاردانو',
    apy: 8.5,
    minAmount: 100,
    duration: 90
  }
];

// Support FAQ
export const faqData = [
  {
    id: 1,
    question: 'چگونه می‌توانم حساب کاربری ایجاد کنم؟',
    answer: 'برای ایجاد حساب کاربری، روی دکمه ثبت نام کلیک کنید و اطلاعات مورد نیاز را وارد نمایید.'
  },
  {
    id: 2,
    question: 'آیا والکس مجوز فعالیت دارد؟',
    answer: 'بله، والکس دارای مجوز رسمی از بانک مرکزی جمهوری اسلامی ایران می‌باشد.'
  },
  {
    id: 3,
    question: 'چه ارزهایی قابل معامله هستند؟',
    answer: 'بیش از ۱۳۰ نوع ارز دیجیتال شامل بیت کوین، اتریوم، تتر و سایر ارزهای معتبر.'
  }
];