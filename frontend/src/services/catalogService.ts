/**
 * Product Catalog Service (Tasks 401-425)
 * 
 * Frontend service for interacting with the separate product catalog database.
 * Provides fast lookups, search, and filtering capabilities.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://pellicura-api.fly.dev/api/v1';

export interface CatalogProduct {
  id: string;
  barcode?: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  description?: string;
  size_ml?: number;
  price_usd?: number;
  price_range?: string;
  image_url?: string;
  image_front_url?: string;
  thumbnail_url?: string;
  safety_score?: number;
  safety_summary?: string;
  flagged_ingredients?: FlaggedIngredient[];
  pregnancy_safe?: boolean;
  sensitive_skin_safe?: boolean;
  ingredients?: string[];
  ingredients_text?: string;
  key_ingredients?: KeyIngredient[];
  is_fragrance_free?: boolean;
  is_vegan?: boolean;
  is_cruelty_free?: boolean;
  suitable_skin_types?: string[];
  targets_concerns?: string[];
  is_verified?: boolean;
  data_quality_score?: number;
  source?: string;
  scan_count?: number;
}

export interface FlaggedIngredient {
  name: string;
  severity: 'high' | 'moderate' | 'low';
  reason: string;
  alternatives?: string[];
}

export interface KeyIngredient {
  name: string;
  percentage?: string;
}

export interface CatalogLookupResponse {
  found: boolean;
  product?: CatalogProduct;
  source: string;
}

export interface CatalogSearchResponse {
  products: CatalogProduct[];
  total: number;
  query: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  icon: string;
}

export interface CatalogBrand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  product_count: number;
  is_cruelty_free?: boolean;
  is_vegan?: boolean;
}

export interface CatalogIngredient {
  id: string;
  inci_name: string;
  common_names?: string[];
  category?: string;
  function?: string;
  ewg_score?: number;
  is_harmful: boolean;
  harm_severity?: string;
}

export interface CatalogStats {
  total_products: number;
  verified_products: number;
  total_ingredients: number;
  by_source: Record<string, number>;
  by_category: Record<string, number>;
}

export interface ProductListResponse {
  filter: string;
  category?: string;
  count: number;
  products: CatalogProduct[];
}

/**
 * Look up a product by barcode.
 * This is the fastest lookup method - checks the product catalog database first.
 */
export async function lookupByBarcode(barcode: string): Promise<CatalogLookupResponse> {
  const response = await fetch(`${API_BASE}/catalog/barcode/${barcode}`);
  if (!response.ok) {
    throw new Error(`Barcode lookup failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Look up a product by name and brand.
 * Uses fuzzy matching for better results.
 */
export async function lookupByNameBrand(name: string, brand: string): Promise<CatalogLookupResponse> {
  const params = new URLSearchParams({ name, brand });
  const response = await fetch(`${API_BASE}/catalog/lookup?${params}`);
  if (!response.ok) {
    throw new Error(`Name/brand lookup failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Search products in the catalog.
 */
export async function searchProducts(
  query: string,
  options?: {
    category?: string;
    brand?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CatalogSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (options?.category) params.append('category', options.category);
  if (options?.brand) params.append('brand', options.brand);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  
  const response = await fetch(`${API_BASE}/catalog/search?${params}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Get a product by ID.
 */
export async function getProduct(productId: string): Promise<CatalogProduct> {
  const response = await fetch(`${API_BASE}/catalog/product/${productId}`);
  if (!response.ok) {
    throw new Error(`Product not found: ${response.status}`);
  }
  return response.json();
}

/**
 * Get all product categories.
 */
export async function getCategories(): Promise<{ categories: CatalogCategory[] }> {
  const response = await fetch(`${API_BASE}/catalog/categories`);
  if (!response.ok) {
    throw new Error(`Failed to get categories: ${response.status}`);
  }
  return response.json();
}

/**
 * Get all brands.
 */
export async function getBrands(limit = 50, offset = 0): Promise<CatalogBrand[]> {
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  const response = await fetch(`${API_BASE}/catalog/brands?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get brands: ${response.status}`);
  }
  return response.json();
}

/**
 * Get ingredients list.
 */
export async function getIngredients(options?: {
  search?: string;
  harmfulOnly?: boolean;
  limit?: number;
}): Promise<CatalogIngredient[]> {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.harmfulOnly) params.append('harmful_only', 'true');
  if (options?.limit) params.append('limit', options.limit.toString());
  
  const response = await fetch(`${API_BASE}/catalog/ingredients?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get ingredients: ${response.status}`);
  }
  return response.json();
}

/**
 * Get popular products.
 */
export async function getPopularProducts(category?: string, limit = 20): Promise<ProductListResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (category) params.append('category', category);
  
  const response = await fetch(`${API_BASE}/catalog/products/popular?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get popular products: ${response.status}`);
  }
  return response.json();
}

/**
 * Get recently added products.
 */
export async function getRecentProducts(limit = 20): Promise<ProductListResponse> {
  const response = await fetch(`${API_BASE}/catalog/products/recent?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to get recent products: ${response.status}`);
  }
  return response.json();
}

/**
 * Get vegan products.
 */
export async function getVeganProducts(category?: string, limit = 20): Promise<ProductListResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (category) params.append('category', category);
  
  const response = await fetch(`${API_BASE}/catalog/products/vegan?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get vegan products: ${response.status}`);
  }
  return response.json();
}

/**
 * Get pregnancy-safe products.
 */
export async function getPregnancySafeProducts(category?: string, limit = 20): Promise<ProductListResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (category) params.append('category', category);
  
  const response = await fetch(`${API_BASE}/catalog/products/pregnancy-safe?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get pregnancy-safe products: ${response.status}`);
  }
  return response.json();
}

/**
 * Get fragrance-free products.
 */
export async function getFragranceFreeProducts(category?: string, limit = 20): Promise<ProductListResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (category) params.append('category', category);
  
  const response = await fetch(`${API_BASE}/catalog/products/fragrance-free?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get fragrance-free products: ${response.status}`);
  }
  return response.json();
}

/**
 * Get products containing a specific ingredient.
 */
export async function getProductsByIngredient(ingredientName: string, limit = 20): Promise<ProductListResponse> {
  const response = await fetch(`${API_BASE}/catalog/products/by-ingredient/${encodeURIComponent(ingredientName)}?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to get products by ingredient: ${response.status}`);
  }
  return response.json();
}

/**
 * Get products safe for a specific skin type.
 */
export async function getProductsSafeFor(skinType: string, category?: string, limit = 20): Promise<ProductListResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (category) params.append('category', category);
  
  const response = await fetch(`${API_BASE}/catalog/products/safe-for/${encodeURIComponent(skinType)}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get safe products: ${response.status}`);
  }
  return response.json();
}

/**
 * Get catalog statistics (requires authentication).
 */
export async function getCatalogStats(token: string): Promise<CatalogStats> {
  const response = await fetch(`${API_BASE}/catalog/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to get catalog stats: ${response.status}`);
  }
  return response.json();
}

/**
 * Check catalog health.
 */
export async function checkCatalogHealth(): Promise<{
  status: string;
  latency_ms?: number;
  counts?: {
    products: number;
    ingredients: number;
    brands: number;
  };
}> {
  const response = await fetch(`${API_BASE}/catalog/health`);
  if (!response.ok) {
    throw new Error(`Catalog health check failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Add a product to the catalog (requires authentication).
 */
export async function addProduct(
  token: string,
  product: {
    name: string;
    brand: string;
    category: string;
    barcode?: string;
    description?: string;
    ingredients?: string[];
    image_url?: string;
  }
): Promise<CatalogProduct> {
  const response = await fetch(`${API_BASE}/catalog/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });
  if (!response.ok) {
    throw new Error(`Failed to add product: ${response.status}`);
  }
  return response.json();
}

export default {
  lookupByBarcode,
  lookupByNameBrand,
  searchProducts,
  getProduct,
  getCategories,
  getBrands,
  getIngredients,
  getPopularProducts,
  getRecentProducts,
  getVeganProducts,
  getPregnancySafeProducts,
  getFragranceFreeProducts,
  getProductsByIngredient,
  getProductsSafeFor,
  getCatalogStats,
  checkCatalogHealth,
  addProduct,
};
