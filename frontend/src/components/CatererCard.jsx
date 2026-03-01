import { Link } from 'react-router-dom';
import { MapPin, Phone, ChefHat } from 'lucide-react';

export default function CatererCard({ caterer }) {
  return (
    <Link
      to={`/caterer/${caterer._id}`}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-saffron-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="bg-gradient-to-br from-saffron-50 to-gold-50 h-28 flex items-center justify-center">
        {caterer.profileImage ? (
          <img src={caterer.profileImage} alt={caterer.businessName} className="h-full w-full object-cover" />
        ) : (
          <div className="w-16 h-16 bg-saffron-100 rounded-full flex items-center justify-center">
            <ChefHat size={32} className="text-saffron-500" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-display font-bold text-gray-900 text-lg group-hover:text-saffron-600 transition-colors leading-tight">
          {caterer.businessName}
        </h3>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={13} className="shrink-0 text-saffron-400" />
          <span>{caterer.city}, {caterer.state}</span>
        </div>

        {caterer.phone && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Phone size={13} className="shrink-0 text-gray-400" />
            <span>{caterer.phone}</span>
          </div>
        )}

        {caterer.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{caterer.description}</p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100">
          <span className="text-xs font-semibold text-saffron-600 uppercase tracking-wide">View Menu →</span>
        </div>
      </div>
    </Link>
  );
}
