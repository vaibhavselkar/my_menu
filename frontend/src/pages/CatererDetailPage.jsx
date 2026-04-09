import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { MapPin, Phone, ChefHat, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import api from '../utils/api.js';
import EnquiryPanel from '../components/EnquiryPanel.jsx';

export default function CatererDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [caterer, setCaterer] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [alternativeSuggestions, setAlternativeSuggestions] = useState([]);
  const [urlParams, setUrlParams] = useState({ plates: 50, city: '', veg: '' });

  useEffect(() => {
    api.get(`/caterers/${id}`)
      .then(res => {
        setCaterer(res.data.caterer);
        setDishes(res.data.dishes);
        
        // Process URL parameters after data is loaded
        processUrlParameters(res.data.dishes);
      })
      .catch(() => setError('Caterer not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Process URL parameters and set initial state
  const processUrlParameters = (catererDishes) => {
    const params = new URLSearchParams(location.search);
    const selectedParam = params.get('selected');
    const platesParam = params.get('plates');
    const cityParam = params.get('city');
    const vegParam = params.get('veg');

    // Store URL parameters in state for use throughout the component
    setUrlParams({
      plates: platesParam ? parseInt(platesParam) : 50,
      city: cityParam || '',
      veg: vegParam || ''
    });

    if (selectedParam) {
      try {
        const selectedNames = JSON.parse(decodeURIComponent(selectedParam));
        const selectedDishes = [];
        const unavailableItems = [];

        // Find available items from the selected list
        selectedNames.forEach(name => {
          const foundDish = catererDishes.find(d => d.name === name);
          if (foundDish) {
            selectedDishes.push(foundDish);
          } else {
            unavailableItems.push(name);
          }
        });

        setSelectedItems(selectedDishes);

        // Get alternatives for unavailable items from this caterer's menu
        if (unavailableItems.length > 0) {
          getAlternativeSuggestions(unavailableItems, catererDishes, vegParam);
        }
      } catch (err) {
        console.error('Error parsing URL parameters:', err);
      }
    }
  };

  // Get alternative suggestions for unavailable items — from the same caterer only
  const getAlternativeSuggestions = (unavailableItems, catererDishes, vegFilter) => {
    const suggestions = [];

    unavailableItems.forEach(item => {
      // Try to guess a category from the item name using common patterns
      const categoryPatterns = {
        'Starters': ['Tikka', 'Kabab', 'Roll', 'Puri', 'Bhaji', 'Samosa', 'Lollipop', 'Fry', 'Ball'],
        'Indian Main Course': ['Curry', 'Masala', 'Paneer', 'Dal', 'Chicken', 'Mutton', 'Fish', 'Egg', 'Kofta', 'Korma', 'Biryani'],
        'Breads': ['Naan', 'Roti', 'Paratha', 'Poori'],
        'Rice': ['Rice', 'Biryani', 'Pulao'],
        'Chinese': ['Noodles', 'Manchurian', 'Chilli', 'Soup', 'Schezwan'],
        'Sweets': ['Jamun', 'Jalebi', 'Rasgulla', 'Halwa', 'Kheer', 'Ladoo', 'Barfi'],
        'Desserts': ['Ice Cream', 'Custard', 'Brownie', 'Tukda', 'Rabri', 'Phirni'],
        'Beverages': ['Chai', 'Lassi', 'Pani', 'Juice', 'Coffee', 'Water', 'Drinks', 'Sharbat'],
      };

      let guessedCategory = null;
      for (const [cat, keywords] of Object.entries(categoryPatterns)) {
        if (keywords.some(kw => item.toLowerCase().includes(kw.toLowerCase()))) {
          guessedCategory = cat;
          break;
        }
      }

      // Find dishes from this caterer in the same category (excluding the missing item itself)
      const alternatives = catererDishes.filter(dish => {
        if (dish.name === item) return false;
        if (vegFilter === 'true' && !dish.isVeg) return false;
        if (vegFilter === 'false' && dish.isVeg) return false;
        return dish.category === guessedCategory;
      }).slice(0, 4);

      if (alternatives.length > 0) {
        suggestions.push({ originalItem: item, alternatives });
      }
    });

    setAlternativeSuggestions(suggestions);
  };

  const toggleItem = (dish) => {
    setSelectedItems(prev =>
      prev.find(d => d._id === dish._id)
        ? prev.filter(d => d._id !== dish._id)
        : [...prev, dish]
    );
  };

  const removeItem = (dishId) => setSelectedItems(prev => prev.filter(d => d._id !== dishId));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500 text-lg">{error}</p>
        <Link to="/" className="text-saffron-600 font-medium hover:underline">Back to Home</Link>
      </div>
    );
  }

  const grouped = dishes.reduce((acc, dish) => {
    if (!acc[dish.category]) acc[dish.category] = [];
    acc[dish.category].push(dish);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to caterers
      </Link>

      {/* Caterer Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 flex flex-col sm:flex-row gap-5">
        <div className="w-20 h-20 bg-saffron-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
          {caterer.profileImage ? (
            <img src={caterer.profileImage} alt={caterer.businessName} className="w-full h-full object-cover" />
          ) : (
            <ChefHat size={36} className="text-saffron-400" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-display font-bold text-3xl text-gray-900 mb-1">{caterer.businessName}</h1>
          <p className="text-gray-500 text-sm mb-3">Owner: {caterer.ownerName}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-saffron-400" />
              {caterer.address ? `${caterer.address}, ` : ''}{caterer.city}, {caterer.state}
            </div>
            {caterer.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={14} className="text-gray-400" />
                {caterer.phone}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Mail size={14} className="text-gray-400" />
              {caterer.email}
            </div>
          </div>
          {caterer.description && (
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">{caterer.description}</p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Left — Menu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-gray-900">Menu</h2>
            <p className="text-sm text-gray-400">Tick items to add to your enquiry</p>
          </div>

          {dishes.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              <ChefHat size={40} className="mb-3 text-gray-300" />
              <p>No dishes listed yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(grouped).map(([category, categoryDishes]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-display font-bold text-lg text-gray-800">{category}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{categoryDishes.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {categoryDishes.map(dish => {
                      const isSelected = !!selectedItems.find(d => d._id === dish._id);
                      return (
                        <label
                          key={dish._id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-saffron-400 bg-saffron-50'
                              : 'border-gray-100 bg-white hover:border-saffron-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(dish)}
                            className="w-4 h-4 accent-saffron-500 shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-sm">{dish.name}</span>
                              {/* Veg / Non-veg dot */}
                              <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0
                                ${dish.isVeg ? 'border-leaf-500' : 'border-spice-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-leaf-500' : 'bg-spice-500'}`} />
                              </span>
                            </div>
                            {dish.description && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{dish.description}</p>
                            )}
                          </div>

                          <span className="font-bold text-saffron-600 shrink-0">₹{dish.pricePerPlate}/plate</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alternative Suggestions */}
          {alternativeSuggestions.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw size={20} className="text-saffron-500" />
                <h3 className="font-display font-bold text-xl text-gray-900">We suggest instead</h3>
                <span className="text-sm text-gray-400">from this caterer's menu</span>
              </div>

              {alternativeSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-500">"{suggestion.originalItem}" is not available — try:</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {suggestion.alternatives.map(dish => {
                      const isSelected = !!selectedItems.find(d => d._id === dish._id);
                      return (
                        <label
                          key={dish._id}
                          className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-saffron-400 bg-saffron-50'
                              : 'border-gray-100 bg-gray-50 hover:border-saffron-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(dish)}
                            className="w-4 h-4 accent-saffron-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-sm">{dish.name}</span>
                              <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center shrink-0
                                ${dish.isVeg ? 'border-leaf-500' : 'border-spice-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-leaf-500' : 'bg-spice-500'}`} />
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{dish.category}</p>
                          </div>
                          <span className="font-bold text-saffron-600 shrink-0 text-sm">₹{dish.pricePerPlate}/plate</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Enquiry Panel (sticky) */}
        <div className="w-full lg:w-96 lg:sticky lg:top-20">
          <EnquiryPanel
            caterer={caterer}
            selectedItems={selectedItems}
            onRemoveItem={removeItem}
            blockedDates={caterer.blockedDates || []}
          />
        </div>
      </div>
    </div>
  );
}
