import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Phone, MapPin, ChefHat, ExternalLink } from 'lucide-react';
import api from '../utils/api.js';

const CATEGORY_ORDER = [
  'Starters', 'Indian Main Course', 'Chinese', 'Rice', 'Breads',
  'Sweets', 'Desserts', 'Beverages'
];

export default function HomePage() {
  const [allDishes, setAllDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNames, setSelectedNames] = useState(new Set());
  const [plates, setPlates] = useState(50);
  const [cityFilter, setCityFilter] = useState('');
  const [vegFilter, setVegFilter] = useState(''); // '' for all, 'true' for veg, 'false' for non-veg

  useEffect(() => {
    api.get('/dishes/all')
      .then(res => setAllDishes(res.data.dishes))
      .catch(() => setAllDishes([]))
      .finally(() => setLoading(false));
  }, []);

  // Group all dishes by category (unique dish names per category)
  const groupedDishes = useMemo(() => {
    const map = {};
    allDishes.forEach(dish => {
      if (!map[dish.category]) map[dish.category] = [];
      // Only add unique names to the picker
      if (!map[dish.category].find(d => d.name === dish.name)) {
        map[dish.category].push(dish);
      }
    });
    return map;
  }, [allDishes]);

  const toggleItem = (name) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Build caterer match results
  const catererResults = useMemo(() => {
    if (selectedNames.size === 0) return [];

    // Group all dishes by caterer
    const byCaterer = {};
    allDishes.forEach(dish => {
      const cId = dish.catererId._id;
      if (!byCaterer[cId]) byCaterer[cId] = { caterer: dish.catererId, dishes: [] };
      byCaterer[cId].dishes.push(dish);
    });

    let results = Object.values(byCaterer)
      .map(({ caterer, dishes }) => {
        const matched = dishes.filter(d => selectedNames.has(d.name));
        const menuPricePerPlate = matched.reduce((s, d) => s + d.pricePerPlate, 0);
        return { caterer, matched, menuPricePerPlate, totalPrice: menuPricePerPlate * plates };
      })
      .filter(r => r.matched.length > 0);

    // Apply city filter if provided
    if (cityFilter.trim()) {
      const cityLower = cityFilter.toLowerCase().trim();
      results = results.filter(r => 
        r.caterer.city.toLowerCase().includes(cityLower)
      );
    }

    // Apply veg/non-veg filter if provided
    if (vegFilter !== '') {
      const isVeg = vegFilter === 'true';
      results = results.filter(r => {
        // Check if all matched dishes match the selected type
        return r.matched.every(d => d.isVeg === isVeg);
      });
    }

    return results.sort((a, b) => b.matched.length - a.matched.length);
  }, [allDishes, selectedNames, plates, cityFilter, vegFilter]);

  const orderedCategories = CATEGORY_ORDER.filter(c => groupedDishes[c]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-saffron-500 to-spice-600 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <MapPin size={14} /> Wardha, Maharashtra
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3 leading-tight">
            Build Your Menu,<br />Find the Right Caterer
          </h1>
          <p className="text-saffron-100 text-lg">
            Pick the dishes you want — we'll show you who can serve them and at what price
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Section A: Menu Builder ── */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-gray-900">Select Your Items</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Click the dishes you want in your menu</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {selectedNames.size > 0 && (
                    <span className="text-sm bg-saffron-50 text-saffron-700 font-semibold px-3 py-1.5 rounded-xl">
                      {selectedNames.size} item{selectedNames.size > 1 ? 's' : ''} selected
                    </span>
                  )}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
                    <span className="text-sm text-gray-500 shrink-0">City:</span>
                    <input
                      type="text"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-24 text-sm font-semibold outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
                    <span className="text-sm text-gray-500 shrink-0">Plates:</span>
                    <input
                      type="number" min="1" value={plates}
                      onChange={e => setPlates(Math.max(1, Number(e.target.value)))}
                      className="w-16 text-sm font-semibold text-center outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
                    <span className="text-sm text-gray-500 shrink-0">Type:</span>
                    <select
                      value={vegFilter}
                      onChange={(e) => setVegFilter(e.target.value)}
                      className="text-sm font-semibold outline-none bg-transparent"
                    >
                      <option value="">All</option>
                      <option value="true">Veg</option>
                      <option value="false">Non-Veg</option>
                    </select>
                  </div>
                  {selectedNames.size > 0 && (
                    <button
                      onClick={() => setSelectedNames(new Set())}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {orderedCategories.map(category => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {groupedDishes[category].map(dish => {
                      const isSelected = selectedNames.has(dish.name);
                      return (
                        <button
                          key={dish.name}
                          onClick={() => toggleItem(dish.name)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-saffron-400 bg-saffron-50 text-saffron-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-saffron-200 hover:bg-saffron-50/50'
                          }`}
                        >
                          {/* Veg/Non-veg indicator */}
                          <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center shrink-0
                            ${dish.isVeg ? 'border-leaf-500' : 'border-spice-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-leaf-500' : 'bg-spice-500'}`} />
                          </span>
                          {dish.name}
                          {isSelected && <span className="text-saffron-500 text-base leading-none">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Section B: Matching Caterers ── */}
            {selectedNames.size === 0 ? (
              <div className="flex flex-col items-center py-16 text-center text-gray-400">
                <UtensilsCrossed size={44} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Select items above to see matching caterers</p>
                <p className="text-sm mt-1">We'll show who can serve your chosen menu and at what price</p>
              </div>
            ) : catererResults.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center text-gray-400">
                <ChefHat size={44} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">No caterers found for this selection</p>
                <p className="text-sm mt-1">Try selecting different items</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-2xl text-gray-900">
                    Matching Caterers
                    <span className="text-gray-400 font-normal text-base ml-2">({catererResults.length})</span>
                  </h2>
                  <span className="text-sm text-gray-400">Sorted by best match</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {catererResults.map(({ caterer, matched, menuPricePerPlate, totalPrice }) => (
                    <div key={caterer._id} className="bg-white rounded-2xl border border-gray-200 hover:border-saffron-300 hover:shadow-md transition-all p-5 flex flex-col gap-4">
                      {/* Caterer info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-saffron-50 rounded-xl flex items-center justify-center shrink-0">
                          <ChefHat size={20} className="text-saffron-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-gray-900 text-base leading-tight">{caterer.businessName}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><MapPin size={11} />{caterer.city}</span>
                            {caterer.phone && <span className="flex items-center gap-1"><Phone size={11} />{caterer.phone}</span>}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs bg-saffron-100 text-saffron-700 font-bold px-2 py-1 rounded-lg">
                          {matched.length}/{selectedNames.size} items
                        </span>
                      </div>

                      {/* Matched items breakdown */}
                      <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
                        {matched.map(d => (
                          <div key={d._id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-gray-700">
                              <span className={`w-2.5 h-2.5 rounded-sm border-2 flex items-center justify-center
                                ${d.isVeg ? 'border-leaf-500' : 'border-spice-500'}`}>
                                <span className={`w-1 h-1 rounded-full ${d.isVeg ? 'bg-leaf-500' : 'bg-spice-500'}`} />
                              </span>
                              {d.name}
                            </span>
                            <span className="font-medium text-gray-600 shrink-0">₹{d.pricePerPlate}/plate</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between text-xs text-gray-500">
                          <span>Menu rate/plate</span>
                          <span className="font-semibold">₹{menuPricePerPlate}</span>
                        </div>
                      </div>

                      {/* Total price */}
                      <div className="flex items-center justify-between bg-saffron-500 text-white rounded-xl px-4 py-2.5">
                        <span className="text-sm font-medium">Total for {plates} plates</span>
                        <span className="font-display font-bold text-xl">₹{totalPrice.toLocaleString()}</span>
                      </div>

                      {/* Actions */}
                      <Link
                        to={`/caterer/${caterer._id}`}
                        className="flex items-center justify-center gap-1.5 border-2 border-saffron-200 text-saffron-600 hover:bg-saffron-50 font-semibold py-2 rounded-xl transition-colors text-sm"
                      >
                        <ExternalLink size={14} /> View Full Menu & Enquire
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
