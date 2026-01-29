/**
 * Shelf Context - Global state for user's product shelf
 * Syncs shelf count and products across all components
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';

// Ingredient with optional percentage
export interface KeyIngredient {
  name: string;
  percentage?: string | null;
}

// Ingredient snapshot stored with shelf product
export interface IngredientsSnapshot {
  ingredients: string[];
  key_ingredients: KeyIngredient[];
  captured_at?: string;
}

export interface ShelfProduct {
  id: string;
  product_id?: string;
  external_product_id?: string;
  product_name: string;
  product_brand?: string;
  product_category?: string;
  product_image?: string;
  status: 'active' | 'wishlist' | 'discontinued';
  rating?: number;
  notes?: string;
  created_at?: string;
  expiry_date?: string;
  purchase_date?: string;
  purchase_price?: number;
  would_repurchase?: boolean;
  ingredients_json?: IngredientsSnapshot;  // Ingredient snapshot
}

// Partial update type for products
export type ShelfProductUpdate = Partial<Omit<ShelfProduct, 'id' | 'product_id' | 'external_product_id' | 'created_at'>>;

interface ShelfContextType {
  products: ShelfProduct[];
  loading: boolean;
  error: string | null;
  // Counts
  totalCount: number;
  usingCount: number;
  wishlistCount: number;
  discontinuedCount: number;
  // Actions
  refreshShelf: () => Promise<void>;
  addToShelf: (product: Omit<ShelfProduct, 'id'>) => Promise<boolean>;
  removeFromShelf: (productId: string) => Promise<boolean>;
  updateProductStatus: (productId: string, status: 'active' | 'wishlist' | 'discontinued') => Promise<boolean>;
  updateProduct: (productId: string, updates: ShelfProductUpdate) => Promise<boolean>;
  isOnShelf: (productId: string) => boolean;
  getProductIds: () => Set<string>;
}

const ShelfContext = createContext<ShelfContextType | undefined>(undefined);

export const ShelfProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<ShelfProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed counts
  const totalCount = products.length;
  const usingCount = products.filter(p => p.status === 'active').length;
  const wishlistCount = products.filter(p => p.status === 'wishlist').length;
  const discontinuedCount = products.filter(p => p.status === 'discontinued').length;

  // Fetch shelf from API
  const refreshShelf = useCallback(async () => {
    if (!token) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/shelf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products.map((p: Record<string, unknown>) => ({
            id: String(p.id ?? ''),
            product_id: p.product_id as string | undefined,
            external_product_id: p.external_product_id as string | undefined,
            product_name: String(p.product_name ?? ''),
            product_brand: String(p.product_brand ?? ''),
            product_category: String(p.product_category ?? ''),
            product_image: p.product_image as string | undefined,
            status: (p.status as 'active' | 'wishlist' | 'discontinued') || 'active',
            rating: Number(p.rating ?? 0),
            notes: String(p.notes ?? ''),
            created_at: p.created_at as string | undefined,
          })));
        }
      } else {
        console.error('Failed to fetch shelf:', response.status);
        setError('Failed to load shelf');
      }
    } catch (err) {
      console.error('Shelf fetch error:', err);
      setError('Failed to load shelf');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch shelf when user logs in
  useEffect(() => {
    if (token && user) {
      refreshShelf();
    } else {
      setProducts([]);
    }
  }, [token, user, refreshShelf]);

  // Add product to shelf
  const addToShelf = useCallback(async (product: Omit<ShelfProduct, 'id'>): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/shelf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.product_id,
          external_product_id: product.external_product_id,
          product_name: product.product_name,
          product_brand: product.product_brand,
          product_category: product.product_category,
          product_image: product.product_image,
          status: product.status || 'active',
          ingredients_json: product.ingredients_json  // Include ingredient snapshot
        })
      });

      if (response.ok) {
        // Refresh shelf to get the new product with server-assigned ID
        await refreshShelf();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to add to shelf:', errorData);
        return false;
      }
    } catch (err) {
      console.error('Add to shelf error:', err);
      return false;
    }
  }, [token, refreshShelf]);

  // Remove product from shelf
  const removeFromShelf = useCallback(async (productId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/shelf/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Update local state immediately for responsiveness
        setProducts(prev => prev.filter(p => p.id !== productId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Remove from shelf error:', err);
      return false;
    }
  }, [token]);

  // Update product status
  const updateProductStatus = useCallback(async (
    productId: string, 
    status: 'active' | 'wishlist' | 'discontinued'
  ): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/shelf/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update local state immediately
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, status } : p
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update status error:', err);
      return false;
    }
  }, [token]);

  // Update product with any fields (rating, expiry, etc.)
  const updateProduct = useCallback(async (
    productId: string,
    updates: ShelfProductUpdate
  ): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/shelf/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Update local state immediately
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, ...updates } : p
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update product error:', err);
      return false;
    }
  }, [token]);

  // Check if product is on shelf
  const isOnShelf = useCallback((productId: string): boolean => {
    return products.some(p => 
      p.id === productId || 
      p.product_id === productId || 
      p.external_product_id === productId
    );
  }, [products]);

  // Get all product IDs on shelf
  const getProductIds = useCallback((): Set<string> => {
    const ids = new Set<string>();
    products.forEach(p => {
      if (p.id) ids.add(p.id);
      if (p.product_id) ids.add(p.product_id);
      if (p.external_product_id) ids.add(p.external_product_id);
    });
    return ids;
  }, [products]);

  return (
    <ShelfContext.Provider value={{
      products,
      loading,
      error,
      totalCount,
      usingCount,
      wishlistCount,
      discontinuedCount,
      refreshShelf,
      addToShelf,
      removeFromShelf,
      updateProductStatus,
      updateProduct,
      isOnShelf,
      getProductIds
    }}>
      {children}
    </ShelfContext.Provider>
  );
};

export const useShelf = (): ShelfContextType => {
  const context = useContext(ShelfContext);
  if (context === undefined) {
    throw new Error('useShelf must be used within a ShelfProvider');
  }
  return context;
};

export default ShelfContext;
