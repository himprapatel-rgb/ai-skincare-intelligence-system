/**
 * Shelf Context - Global state for user's product shelf
 * Syncs shelf count and products across all components
 * Powered by TanStack Query
 */
import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { queryKeys } from '../api/queryKeys';

import { API_BASE_URL } from '../config';
const API_BASE = API_BASE_URL;

// Ingredient with optional percentage
export interface KeyIngredient {
  name: string;
  percentage?: string | null;
}

// Safety report from scan (stored with shelf product)
export interface FlaggedIngredientSnapshot {
  name: string;
  matched_term?: string;
  severity: 'high' | 'moderate' | 'low';
  categories?: string[];
  reason: string;
  alternatives?: string[];
  avoid_if?: string[];
}

export interface SafetyReportSnapshot {
  flagged_ingredients: FlaggedIngredientSnapshot[];
  total_flagged?: number;
  high_severity_count?: number;
  moderate_severity_count?: number;
  low_severity_count?: number;
  safety_score?: number;
  recommendations?: string[];
  is_pregnancy_safe?: boolean;
  is_sensitive_skin_safe?: boolean;
}

// Ingredient snapshot stored with shelf product (includes scan safety data)
export interface IngredientsSnapshot {
  ingredients: string[];
  key_ingredients: KeyIngredient[];
  captured_at?: string;
  /** From scan - safety data preserved when adding to shelf */
  safety_rating?: number;
  suitability_score?: number;
  safety_report?: SafetyReportSnapshot;
  warnings?: string[];
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

function mapProduct(p: Record<string, unknown>): ShelfProduct {
  return {
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
    expiry_date: p.expiry_date as string | undefined,
    purchase_date: p.purchase_date as string | undefined,
    purchase_price: p.purchase_price as number | undefined,
    would_repurchase: p.would_repurchase as boolean | undefined,
    ingredients_json: p.ingredients_json as IngredientsSnapshot | undefined,
  };
}

export const ShelfProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const shelfQueryKey = queryKeys.shelf.list(user?.id ?? 0);

  const { data, isLoading, error } = useQuery({
    queryKey: shelfQueryKey,
    queryFn: async (): Promise<ShelfProduct[]> => {
      const response = await fetch(`${API_BASE}/shelf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          return data.products.map((p: Record<string, unknown>) => mapProduct(p));
        }
      } else {
        throw new Error('Failed to load shelf');
      }
      return [];
    },
    enabled: !!token && !!user,
  });

  const products = data ?? [];

  // Computed counts (memoized for performance)
  const totalCount = useMemo(() => products.length, [products]);
  const usingCount = useMemo(() => products.filter(p => p.status === 'active').length, [products]);
  const wishlistCount = useMemo(() => products.filter(p => p.status === 'wishlist').length, [products]);
  const discontinuedCount = useMemo(() => products.filter(p => p.status === 'discontinued').length, [products]);

  // Refresh shelf via query invalidation
  const refreshShelf = useCallback(async () => {
    if (!token || !user) return;
    await queryClient.invalidateQueries({ queryKey: shelfQueryKey });
  }, [token, user, queryClient, shelfQueryKey]);

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
          ingredients_json: product.ingredients_json,
          expiry_date: product.expiry_date || null,
          purchase_date: product.purchase_date || null
        })
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: shelfQueryKey });
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
  }, [token, queryClient, shelfQueryKey]);

  // Remove product from shelf
  const removeFromShelf = useCallback(async (productId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/shelf/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Optimistic update: remove from cache immediately
        queryClient.setQueryData<ShelfProduct[]>(shelfQueryKey, (old) =>
          old ? old.filter(p => p.id !== productId) : []
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Remove from shelf error:', err);
      return false;
    }
  }, [token, queryClient, shelfQueryKey]);

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
        // Optimistic update
        queryClient.setQueryData<ShelfProduct[]>(shelfQueryKey, (old) =>
          old ? old.map(p => p.id === productId ? { ...p, status } : p) : []
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update status error:', err);
      return false;
    }
  }, [token, queryClient, shelfQueryKey]);

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
        // Optimistic update
        queryClient.setQueryData<ShelfProduct[]>(shelfQueryKey, (old) =>
          old ? old.map(p => p.id === productId ? { ...p, ...updates } : p) : []
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update product error:', err);
      return false;
    }
  }, [token, queryClient, shelfQueryKey]);

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
      loading: isLoading,
      error: error ? (error instanceof Error ? error.message : 'Failed to load shelf') : null,
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

/* eslint-disable react-refresh/only-export-components -- context hook */
export const useShelf = (): ShelfContextType => {
  const context = useContext(ShelfContext);
  if (context === undefined) {
    throw new Error('useShelf must be used within a ShelfProvider');
  }
  return context;
};

export default ShelfContext;
