import { useState } from 'react';
import { X, ShoppingCart, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

export default function EnquiryPanel({ caterer, selectedItems, onRemoveItem }) {
  const [plates, setPlates] = useState(50);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', eventDate: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const menuPricePerPlate = selectedItems.reduce((sum, d) => sum + d.pricePerPlate, 0);
  const totalPrice = menuPricePerPlate * plates;

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return toast.error('Select at least one item from the menu');
    if (!form.customerName.trim()) return toast.error('Enter your name');
    if (!form.customerPhone.trim()) return toast.error('Enter your phone number');
    if (!form.eventDate) return toast.error('Select an event date');
    if (plates < 1) return toast.error('Minimum 1 plate required');

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
        notes: form.notes.trim()
      });
      toast.success('Enquiry submitted! The caterer will contact you soon.');
      setForm({ customerName: '', customerPhone: '', eventDate: '', notes: '' });
      setPlates(50);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit enquiry');
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
                <button
                  onClick={() => onRemoveItem(d._id)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price Calculator */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={15} className="text-gray-500" />
          <h3 className="font-semibold text-sm text-gray-700">Price Calculator</h3>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-600 shrink-0">No. of Plates</label>
          <input
            type="number" min="1" value={plates}
            onChange={e => setPlates(Math.max(1, Number(e.target.value)))}
            className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:border-saffron-400"
          />
        </div>

        {selectedItems.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-3 text-xs text-gray-500">
            {selectedItems.map(d => (
              <div key={d._id} className="flex justify-between">
                <span>{d.name} × {plates}</span>
                <span className="font-medium text-gray-700">₹{(d.pricePerPlate * plates).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-semibold text-gray-600 text-xs">
              <span>Rate/plate</span>
              <span>₹{menuPricePerPlate}/plate</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between bg-saffron-500 text-white rounded-xl px-4 py-3">
          <span className="font-semibold text-sm">Total</span>
          <span className="font-display font-bold text-xl">
            ₹{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Enquiry Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h3 className="font-display font-bold text-base text-gray-900">Submit Enquiry</h3>

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
            type="date" min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>
        <textarea
          name="notes" value={form.notes} onChange={handleChange}
          placeholder="Special notes (optional)" rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 resize-none"
        />

        <button
          type="submit" disabled={submitting || selectedItems.length === 0}
          className="w-full bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {submitting ? 'Submitting...' : 'Send Enquiry'}
        </button>
      </form>
    </div>
  );
}
