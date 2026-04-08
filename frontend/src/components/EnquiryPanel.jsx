import { useState, useEffect } from 'react';
import { X, ShoppingCart, Calculator, ClipboardList, ShoppingBag } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

export default function EnquiryPanel({ caterer, selectedItems, onRemoveItem, blockedDates = [] }) {
  const location = useLocation();
  const [plates, setPlates] = useState(50);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', eventDate: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // Read plates from URL — this is the number the user chose (from homepage or chatbot)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const platesParam = params.get('plates');
    if (platesParam) setPlates(Math.max(1, Number(platesParam)));
  }, [location.search]);

  const menuPricePerPlate = selectedItems.reduce((sum, d) => sum + d.pricePerPlate, 0);
  const totalPrice = menuPricePerPlate * plates;

  // Build a Set of blocked date strings for fast lookup
  const blockedSet = new Set(blockedDates);
  const today = new Date().toISOString().split('T')[0];

  const isDateBlocked = (dateStr) => blockedSet.has(dateStr);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (selectedItems.length === 0) { toast.error('Select at least one item from the menu'); return false; }
    if (!form.customerName.trim()) { toast.error('Enter your name'); return false; }
    if (!form.customerPhone.trim()) { toast.error('Enter your phone number'); return false; }
    if (!form.eventDate) { toast.error('Select an event date'); return false; }
    if (isDateBlocked(form.eventDate)) { toast.error('This date is not available. Please choose another date.'); return false; }
    return true;
  };

  const submit = async (type) => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/enquiries', {
        catererId: caterer._id,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        eventDate: form.eventDate,
        numberOfPlates: plates,
        selectedItems: selectedItems.map(d => ({
          dishId: d._id,
          dishName: d.name,
          category: d.category,
          pricePerPlate: d.pricePerPlate
        })),
        notes: form.notes.trim(),
        type, // 'enquiry' or 'order'
      });

      const msg = type === 'order'
        ? 'Order placed! The caterer will confirm shortly.'
        : 'Enquiry sent! The caterer will contact you soon.';
      toast.success(msg);
      setForm({ customerName: '', customerPhone: '', eventDate: '', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-5">

      {/* Selected Items */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart size={16} className="text-saffron-500" />
          <h3 className="font-display font-bold text-base text-gray-900">Selected Items</h3>
          <span className="ml-auto text-xs bg-saffron-100 text-saffron-700 px-2 py-0.5 rounded-full font-semibold">
            {selectedItems.length}
          </span>
        </div>

        {selectedItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
            Tick items from the menu to add them here
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {selectedItems.map(d => (
              <li key={d._id} className="flex items-center justify-between text-sm bg-saffron-50 px-3 py-2 rounded-lg">
                <span className="text-gray-800 font-medium truncate flex-1">{d.name}</span>
                <span className="text-saffron-600 font-bold ml-2 shrink-0">₹{d.pricePerPlate}</span>
                <button onClick={() => onRemoveItem(d._id)} className="ml-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price Summary — plates is read-only, set from URL */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={15} className="text-gray-500" />
          <h3 className="font-semibold text-sm text-gray-700">Price Summary</h3>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">No. of Plates</span>
          <span className="font-bold text-gray-800 text-sm">{plates} plates</span>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-3 text-xs text-gray-500">
            {selectedItems.map(d => (
              <div key={d._id} className="flex justify-between">
                <span>{d.name} × {plates}</span>
                <span className="font-medium text-gray-700">₹{(d.pricePerPlate * plates).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-semibold text-gray-600">
              <span>Rate/plate</span>
              <span>₹{menuPricePerPlate}/plate</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between bg-saffron-500 text-white rounded-xl px-4 py-3">
          <span className="font-semibold text-sm">Total</span>
          <span className="font-display font-bold text-xl">₹{totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display font-bold text-base text-gray-900">Your Details</h3>

        <input
          name="customerName" value={form.customerName} onChange={handleChange}
          placeholder="Your Name *"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
        />
        <input
          name="customerPhone" value={form.customerPhone} onChange={handleChange}
          placeholder="Phone Number *" type="tel"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
        />

        <div>
          <label className="block text-xs text-gray-500 mb-1 ml-1">Event Date *</label>
          <input
            name="eventDate" value={form.eventDate} onChange={handleChange}
            type="date" min={today}
            onKeyDown={e => e.preventDefault()}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
              form.eventDate && isDateBlocked(form.eventDate)
                ? 'border-red-400 bg-red-50 text-red-600 focus:border-red-400 focus:ring-red-100'
                : 'border-gray-200 focus:border-saffron-400 focus:ring-saffron-100'
            }`}
          />
          {form.eventDate && isDateBlocked(form.eventDate) && (
            <p className="text-xs text-red-500 mt-1 ml-1">⚠️ Caterer is not available on this date. Please choose another.</p>
          )}
        </div>

        <textarea
          name="notes" value={form.notes} onChange={handleChange}
          placeholder="Special notes (optional)" rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 resize-none"
        />

        {/* Two action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => submit('order')}
            disabled={submitting || selectedItems.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            <ShoppingBag size={15} />
            {submitting ? 'Placing...' : 'Place Order'}
          </button>
          <button
            onClick={() => submit('enquiry')}
            disabled={submitting || selectedItems.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 border-2 border-saffron-400 text-saffron-600 hover:bg-saffron-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            <ClipboardList size={15} />
            {submitting ? 'Sending...' : 'Enquiry'}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center">
          <strong>Place Order</strong> — ready to book &nbsp;|&nbsp; <strong>Enquiry</strong> — want to discuss first
        </p>
      </div>
    </div>
  );
}
