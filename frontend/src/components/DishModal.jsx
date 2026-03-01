import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const CATEGORIES = [
  'Indian Main Course', 'Breads', 'Rice', 'Starters',
  'Chinese', 'Sweets', 'Desserts', 'Beverages'
];

const EMPTY = { name: '', category: 'Starters', pricePerPlate: '', description: '', isVeg: true, isAvailable: true };

export default function DishModal({ dish, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (dish) {
      setForm({
        name: dish.name,
        category: dish.category,
        pricePerPlate: dish.pricePerPlate,
        description: dish.description || '',
        isVeg: dish.isVeg,
        isAvailable: dish.isAvailable,
      });
      setImagePreview(dish.image || '');
    }
  }, [dish]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Dish name is required');
    if (!form.pricePerPlate || Number(form.pricePerPlate) < 0) return toast.error('Enter a valid price');

    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('category', form.category);
      data.append('pricePerPlate', form.pricePerPlate);
      data.append('description', form.description);
      data.append('isVeg', form.isVeg);
      data.append('isAvailable', form.isAvailable);
      if (imageFile) data.append('image', imageFile);

      let res;
      if (dish) {
        res = await api.put(`/dishes/${dish._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/dishes', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      toast.success(res.data.message);
      onSaved(res.data.dish, !!dish);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save dish');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display font-bold text-xl">{dish ? 'Edit Dish' : 'Add New Dish'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dish Image</label>
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl h-32 flex items-center justify-center cursor-pointer hover:border-saffron-300 hover:bg-saffron-50 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload size={24} />
                  <span className="text-sm">Click to upload (max 5MB)</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-200"
              placeholder="e.g. Dal Makhani"
            />
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category" value={form.category} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-200"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price / Plate (₹) *</label>
              <input
                name="pricePerPlate" type="number" min="0" value={form.pricePerPlate} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-200"
                placeholder="150"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-200 resize-none"
              placeholder="Brief description of the dish..."
            />
          </div>

          {/* Veg + Available */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleChange} className="w-4 h-4 accent-leaf-500" />
              <span className="text-sm font-medium text-gray-700">Vegetarian</span>
            </label>
            {dish && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} className="w-4 h-4 accent-saffron-500" />
                <span className="text-sm font-medium text-gray-700">Available</span>
              </label>
            )}
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full bg-saffron-500 hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Saving...' : dish ? 'Update Dish' : 'Add Dish'}
          </button>
        </form>
      </div>
    </div>
  );
}
