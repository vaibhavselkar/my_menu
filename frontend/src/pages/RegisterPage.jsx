import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry','J&K','Ladakh'
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    businessName: '', ownerName: '', email: '', password: '',
    phone: '', address: '', city: '', state: '', description: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['businessName', 'ownerName', 'email', 'password', 'phone', 'city', 'state'];
    for (const f of required) {
      if (!form[f].trim()) return toast.error(`${f.replace(/([A-Z])/g, ' $1')} is required`);
    }
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.caterer);
      toast.success(res.data.message);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name} type={type} value={form[name]} onChange={handleChange}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-saffron-500 text-white p-3 rounded-xl mb-3">
            <UtensilsCrossed size={28} />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Register your business</h1>
          <p className="text-gray-500 text-sm mt-1">Join CaterConnect India</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('businessName', 'Business Name *', 'text', 'e.g. Sharma Caterers')}
            {field('ownerName', 'Owner Name *', 'text', 'Your full name')}
          </div>

          {field('email', 'Email *', 'email', 'you@example.com')}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input
                name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                placeholder="Minimum 6 characters"
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {field('phone', 'Phone *', 'tel', '9876543210')}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('city', 'City *', 'text', 'Mumbai')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select
                name="state" value={form.state} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
              >
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {field('address', 'Address', 'text', 'Street, Area (optional)')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange} rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 resize-none"
              placeholder="Tell clients about your catering services..."
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-saffron-500 hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-saffron-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
