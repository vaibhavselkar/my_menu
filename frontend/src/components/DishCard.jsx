import { UtensilsCrossed } from 'lucide-react';

export default function DishCard({ dish, actions }) {
  return (
    <div className={`bg-white rounded-xl border ${dish.isAvailable ? 'border-gray-200' : 'border-gray-100 opacity-60'} overflow-hidden flex flex-col`}>
      <div className="h-36 bg-gray-50 overflow-hidden flex items-center justify-center">
        {dish.image ? (
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <UtensilsCrossed size={28} className="text-gray-300" />
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight">{dish.name}</h4>
          <span className={`shrink-0 w-4 h-4 mt-0.5 rounded-sm border-2 flex items-center justify-center
            ${dish.isVeg ? 'border-leaf-500' : 'border-spice-500'}`}>
            <span className={`w-2 h-2 rounded-full ${dish.isVeg ? 'bg-leaf-500' : 'bg-spice-500'}`} />
          </span>
        </div>

        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full self-start">{dish.category}</span>

        <p className="text-saffron-600 font-bold text-sm">₹{dish.pricePerPlate}/plate</p>

        {dish.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{dish.description}</p>
        )}

        {!dish.isAvailable && (
          <span className="text-xs text-red-500 font-medium">Unavailable</span>
        )}

        {actions && <div className="mt-auto pt-2">{actions}</div>}
      </div>
    </div>
  );
}
