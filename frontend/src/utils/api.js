import axios from 'axios';

// Mock data for testing when backend is not available
const mockDishes = [
  {
    _id: '1',
    name: 'Paneer Butter Masala',
    category: 'Indian Main Course',
    pricePerPlate: 120,
    description: 'Rich and creamy paneer curry',
    isVeg: true,
    isAvailable: true,
    catererId: {
      _id: 'c1',
      businessName: 'Delicious Caterers',
      city: 'Mumbai',
      phone: '+91 9876543210'
    }
  },
  {
    _id: '2',
    name: 'Chicken Biryani',
    category: 'Rice',
    pricePerPlate: 150,
    description: 'Fragrant basmati rice with chicken',
    isVeg: false,
    isAvailable: true,
    catererId: {
      _id: 'c1',
      businessName: 'Delicious Caterers',
      city: 'Mumbai',
      phone: '+91 9876543210'
    }
  },
  {
    _id: '3',
    name: 'Veg Manchurian',
    category: 'Chinese',
    pricePerPlate: 100,
    description: 'Spicy vegetable balls in sauce',
    isVeg: true,
    isAvailable: true,
    catererId: {
      _id: 'c2',
      businessName: 'Tasty Treats',
      city: 'Pune',
      phone: '+91 8765432109'
    }
  },
  {
    _id: '4',
    name: 'Butter Naan',
    category: 'Breads',
    pricePerPlate: 20,
    description: 'Butter brushed naan bread',
    isVeg: true,
    isAvailable: true,
    catererId: {
      _id: 'c1',
      businessName: 'Delicious Caterers',
      city: 'Mumbai',
      phone: '+91 9876543210'
    }
  },
  {
    _id: '5',
    name: 'Gulab Jamun',
    category: 'Desserts',
    pricePerPlate: 30,
    description: 'Sweet milk balls in sugar syrup',
    isVeg: true,
    isAvailable: true,
    catererId: {
      _id: 'c2',
      businessName: 'Tasty Treats',
      city: 'Pune',
      phone: '+91 8765432109'
    }
  }
];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Override get method to use mock data if backend fails
const originalGet = api.get;
api.get = async function(url, config) {
  try {
    return await originalGet.call(this, url, config);
  } catch (error) {
    // If backend is not available, use mock data for /dishes/all
    if (url === '/dishes/all') {
      console.log('Using mock data for dishes');
      return {
        data: {
          dishes: mockDishes
        }
      };
    }
    throw error;
  }
};

export default api;
