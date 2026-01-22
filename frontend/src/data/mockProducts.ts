export type MockProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  status: 'using' | 'wishlist' | 'discontinued';
  notes: string;
  addedDate: string;
  imageUrl?: string;
};

export const mockProducts: MockProduct[] = [
  {
    id: '1',
    name: 'Hydrating Serum',
    brand: 'CeraVe',
    category: 'Serum',
    rating: 4.5,
    status: 'using',
    notes: 'Great for morning routine',
    addedDate: '2026-01-01',
  },
  {
    id: '2',
    name: 'Retinol Cream',
    brand: 'The Ordinary',
    category: 'Treatment',
    rating: 4.8,
    status: 'using',
    notes: 'Use only at night',
    addedDate: '2026-01-05',
  },
  {
    id: '3',
    name: 'Vitamin C Serum',
    brand: 'Skinceuticals',
    category: 'Serum',
    rating: 4.9,
    status: 'wishlist',
    notes: 'Want to try',
    addedDate: '2026-01-10',
  },
];
