export type Restaurant = {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: string;
  deliveryTime: string;
  distance: string;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  oldPrice: number;
  description: string;
  image: string;
  isVeg: boolean;
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'dapur-kiarong',
    name: 'Dapur Kiarong',
    category: 'Burger',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=900&auto=format&fit=crop',
    rating: '4.5',
    deliveryTime: '30-45 mins',
    distance: '4.5 KM',
  },
  {
    id: 'kaizen-sushi',
    name: 'Kaizen Sushi',
    category: 'Sandwich',
    image:
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=900&auto=format&fit=crop',
    rating: '4.5',
    deliveryTime: '30-45 mins',
    distance: '4.5 KM',
  },
  {
    id: 'burger-house',
    name: 'Burger House',
    category: 'Burger',
    image:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=900&auto=format&fit=crop',
    rating: '4.5',
    deliveryTime: '30-45 mins',
    distance: '4.5 KM',
  },
  {
    id: 'pizza-palace',
    name: 'Pizza Palace',
    category: 'Pizza',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=900&auto=format&fit=crop',
    rating: '4.5',
    deliveryTime: '30-45 mins',
    distance: '4.5 KM',
  },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'ambuyat-1',
    restaurantId: 'dapur-kiarong',
    name: 'Ambuyat',
    price: 130,
    oldPrice: 150,
    description:
      'Ambuyat is a dish derived from the interior trunk of the sago palm.',
    image:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=500&auto=format&fit=crop',
    isVeg: true,
  },
  {
    id: 'ambuyat-2',
    restaurantId: 'dapur-kiarong',
    name: 'Ambuyat',
    price: 130,
    oldPrice: 150,
    description:
      'Ambuyat is a dish derived from the interior trunk of the sago palm.',
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=500&auto=format&fit=crop',
    isVeg: true,
  },
  {
    id: 'butter-rice',
    restaurantId: 'dapur-kiarong',
    name: 'Butter Rice',
    price: 115,
    oldPrice: 140,
    description:
      'Warm rice served with butter sauce, herbs, and crisp garnish.',
    image:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=500&auto=format&fit=crop',
    isVeg: false,
  },
  {
    id: 'sushi-roll',
    restaurantId: 'kaizen-sushi',
    name: 'Signature Sushi',
    price: 95,
    oldPrice: 120,
    description: 'Fresh sushi roll with house sauce and crunchy topping.',
    image:
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=500&auto=format&fit=crop',
    isVeg: false,
  },
  {
    id: 'burger-meal',
    restaurantId: 'burger-house',
    name: 'Burger Meal',
    price: 110,
    oldPrice: 135,
    description: 'Juicy grilled burger with cheese, pickles, and fries.',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop',
    isVeg: false,
  },
  {
    id: 'classic-pizza',
    restaurantId: 'pizza-palace',
    name: 'Classic Pizza',
    price: 125,
    oldPrice: 155,
    description: 'Crisp base, tomato sauce, melted cheese, and basil.',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=500&auto=format&fit=crop',
    isVeg: true,
  },
];

export function getRestaurantById(id: string) {
  return RESTAURANTS.find(item => item.id === id);
}

export function getMenuByRestaurantId(restaurantId: string) {
  const menu = MENU_ITEMS.filter(item => item.restaurantId === restaurantId);

  if (menu.length > 0) {
    return menu;
  }

  return MENU_ITEMS.slice(0, 3).map(item => ({ ...item, restaurantId }));
}
