import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, LayoutDashboard, User, ExternalLink, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import DishCard from '../components/DishCard.jsx';
import DishModal from '../components/DishModal.jsx';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry','J&K','Ladakh'
];

export default function DashboardPage() {
  const { caterer, updateCaterer } = useAuth();
  const [tab, setTab] = useState('dishes');
  const [dishes, setDishes] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDish, setEditDish] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Profile form
  const [profile, setProfile] = useState({
    businessName: caterer?.businessName || '',
    ownerName: caterer?.ownerName || '',
    phone: caterer?.phone || '',
    address: caterer?.address || '',
    city: caterer?.city || '',
    state: caterer?.state || '',
    description: caterer?.description || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Enquiries state
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  useEffect(() => {
    api.get('/dishes/my')
      .then(res => setDishes(res.data.dishes))
      .catch(() => toast.error('Failed to load dishes'))
      .finally(() => setLoadingDishes(false));
  }, []);

  useEffect(() => {
    if (tab !== 'enquiries') return;
    setLoadingEnquiries(true);
    api.get('/enquiries/my')
      .then(res => setEnquiries(res.data.enquiries))
      .catch(() => toast.error('Failed to load enquiries'))
      .finally(() => setLoadingEnquiries(false));
  }, [tab]);

  const handleStatusUpdate = async (enquiryId, status) => {
    try {
      const res = await api.put(`/enquiries/${enquiryId}/status`, { status });
      setEnquiries(prev => prev.map(e => e._id === enquiryId ? res.data.enquiry : e));
      toast.success(`Enquiry ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDishSaved = (dish, isEdit) => {
    if (isEdit) {
      setDishes(prev => prev.map(d => d._id === dish._id ? dish : d));
    } else {
      setDishes(prev => [dish, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/dishes/${id}`);
      setDishes(prev => prev.filter(d => d._id !== id));
      toast.success('Dish deleted');
    } catch {
      toast.error('Failed to delete dish');
    } finally {
      setDeleteId(null);
    }
  };

  const handleProfileChange = e => setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profile);
      updateCaterer(res.data.caterer);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900">{caterer?.businessName}</h1>
          <p className="text-gray-500 text-sm mt-1">{caterer?.city}, {caterer?.state}</p>
        </div>
        <Link
          to={`/caterer/${caterer?.id || caterer?._id}`}
          className="inline-flex items-center gap-1.5 text-sm text-saffron-600 hover:text-saffron-700 font-medium"
        >
          <ExternalLink size={15} /> View public page
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setTab('dishes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'dishes' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutDashboard size={15} /> My Dishes
        </button>
        <button
          onClick={() => setTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'enquiries' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={15} /> Enquiries
          {enquiries.filter(e => e.status === 'pending').length > 0 && (
            <span className="bg-gold-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {enquiries.filter(e => e.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'profile' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={15} /> Profile
        </button>
      </div>

      {/* Dishes Tab */}
      {tab === 'dishes' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-gray-800">
              Dishes <span className="text-gray-400 font-normal text-base">({dishes.length})</span>
            </h2>
            <button
              onClick={() => { setEditDish(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <PlusCircle size={17} /> Add Dish
            </button>
          </div>

          {loadingDishes ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : dishes.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 mb-3">No dishes added yet</p>
              <button
                onClick={() => { setEditDish(null); setShowModal(true); }}
                className="text-saffron-600 font-semibold text-sm hover:underline"
              >
                + Add your first dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dishes.map(dish => (
                <DishCard
                  key={dish._id}
                  dish={dish}
                  actions={
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditDish(dish); setShowModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:border-saffron-300 hover:text-saffron-600 transition-colors"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(dish._id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enquiries Tab */}
      {tab === 'enquiries' && (
        <div>
          <h2 className="font-display font-bold text-xl text-gray-800 mb-6">
            Customer Enquiries <span className="text-gray-400 font-normal text-base">({enquiries.length})</span>
          </h2>

          {loadingEnquiries ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : enquiries.length === 0 ? (
            <div className="flex flex-col items-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
              <ClipboardList size={36} className="mb-3 text-gray-300" />
              <p>No enquiries yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {enquiries.map(enq => {
                const statusStyle = {
                  pending:   'bg-gold-100 text-gold-700',
                  confirmed: 'bg-leaf-100 text-leaf-700',
                  rejected:  'bg-red-100 text-red-600'
                }[enq.status];
                const StatusIcon = { pending: Clock, confirmed: CheckCircle, rejected: XCircle }[enq.status];

                return (
                  <div key={enq._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{enq.customerName}</h3>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle}`}>
                            <StatusIcon size={11} />
                            {enq.status.charAt(0).toUpperCase() + enq.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{enq.customerPhone}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-bold text-xl text-saffron-600">₹{enq.totalPrice?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{enq.numberOfPlates} plates × ₹{enq.menuPricePerPlate}/plate</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span><span className="font-medium text-gray-700">Event:</span> {new Date(enq.eventDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                      <span><span className="font-medium text-gray-700">Submitted:</span> {new Date(enq.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Selected Items:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {enq.selectedItems.map((item, i) => (
                          <span key={i} className="text-xs bg-saffron-50 text-saffron-700 px-2 py-1 rounded-lg font-medium">
                            {item.dishName} (₹{item.pricePerPlate})
                          </span>
                        ))}
                      </div>
                    </div>

                    {enq.notes && (
                      <p className="text-sm text-gray-500 italic mb-3">"{enq.notes}"</p>
                    )}

                    {enq.status === 'pending' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleStatusUpdate(enq._id, 'confirmed')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-leaf-500 hover:bg-leaf-600 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <CheckCircle size={14} /> Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(enq._id, 'rejected')}
                          className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="font-display font-bold text-xl text-gray-800 mb-6">Edit Profile</h2>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input name="businessName" value={profile.businessName} onChange={handleProfileChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input name="ownerName" value={profile.ownerName} onChange={handleProfileChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={profile.phone} onChange={handleProfileChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input name="city" value={profile.city} onChange={handleProfileChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select name="state" value={profile.state} onChange={handleProfileChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100">
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" value={profile.address} onChange={handleProfileChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                placeholder="Street, area (optional)" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={profile.description} onChange={handleProfileChange} rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 resize-none"
                placeholder="Tell clients about your services..." />
            </div>

            <button type="submit" disabled={savingProfile}
              className="bg-saffron-500 hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Dish Modal */}
      {showModal && (
        <DishModal
          dish={editDish}
          onClose={() => { setShowModal(false); setEditDish(null); }}
          onSaved={handleDishSaved}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">Delete Dish?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
