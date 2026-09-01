import { create } from 'zustand';
import type { MenuItem, Restaurant } from '../constants/restaurants';

type CartLine = {
  item: MenuItem | any;
  quantity: number;
};

type RestaurantState = {
  selectedRestaurant?: Restaurant | any;
  cart: Record<string, CartLine>;
  setSelectedRestaurant: (restaurant: Restaurant | any) => void;
  addItem: (item: MenuItem | any) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const getItemId = (item: any): string => item._id ?? item.id;

export const useRestaurant = create<RestaurantState>(set => ({
  selectedRestaurant: undefined,
  cart: {},
  setSelectedRestaurant: restaurant => {
    set({ selectedRestaurant: restaurant });
  },
  addItem: item => {
    const id = getItemId(item);
    set(state => {
      const currentLine = state.cart[id];
      return {
        cart: {
          ...state.cart,
          [id]: {
            item,
            quantity: (currentLine?.quantity ?? 0) + 1,
          },
        },
      };
    });
  },
  removeItem: itemId => {
    set(state => {
      const currentLine = state.cart[itemId];
      if (!currentLine) return state;
      const nextCart = { ...state.cart };
      if (currentLine.quantity <= 1) {
        delete nextCart[itemId];
      } else {
        nextCart[itemId] = { ...currentLine, quantity: currentLine.quantity - 1 };
      }
      return { cart: nextCart };
    });
  },
  clearCart: () => {
    set({ cart: {} });
  },
}));
