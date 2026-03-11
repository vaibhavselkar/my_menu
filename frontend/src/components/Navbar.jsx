import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, LayoutDashboard, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { caterer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-saffron-500 text-white p-1.5 rounded-lg">
              <UtensilsCrossed size={20} />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 group-hover:text-saffron-600 transition-colors">
              CaterConnect<span className="text-saffron-500"> India</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {caterer ? (
              <>
                <span className="hidden sm:block text-sm text-gray-600 font-medium">
                  {caterer.businessName}
                </span>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-saffron-500 hover:bg-saffron-600 rounded-lg transition-colors"
              >
                <LogIn size={16} />
                Login as Caterer
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
