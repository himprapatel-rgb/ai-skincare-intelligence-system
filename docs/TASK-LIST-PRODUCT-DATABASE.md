# Product Catalog Database - 500 Task Implementation Plan

**Goal:** Create a separate dedicated database for storing all product information harvested from scanning. This creates a two-database architecture for better scalability and performance.

**Architecture:**
- **Main Database (Railway PostgreSQL)**: Users, authentication, scans, shelf, routines
- **Product Catalog Database (NEW - Separate)**: Products, ingredients, brands, images, safety data

**Progress:** 200/500 tasks completed (40%)

### Completed:
- ✅ Tasks 1-50: Database Infrastructure (config, multi-DB setup, ProductBase)
- ✅ Tasks 51-100: Product Data Models (CatalogProduct, CatalogIngredient)
- ✅ Tasks 101-150: Ingredient Data Models (safety data, CatalogProductIngredient)
- ✅ Tasks 151-200: Brand & Category Models (CatalogBrand, CatalogProductImage)
- ✅ Tasks 251-300: Import Infrastructure (OBF importer, job tracking)
- ✅ Tasks 301-350: Scanner Integration (barcode + image scanner use product DB)

---

## SECTION A: DATABASE INFRASTRUCTURE (Tasks 1-50)

### Database Setup & Configuration (1-25)

1. Choose database provider for product catalog (Railway, Supabase, Neon, PlanetScale)
2. Create new PostgreSQL database instance for products
3. Configure database connection pooling (PgBouncer)
4. Set up database credentials and secrets
5. Create DATABASE_PRODUCT_URL environment variable
6. Add product database URL to backend .env.example
7. Configure Fly.io secrets for product database
8. Set up GitHub Actions secrets for product database
9. Create database user with appropriate permissions
10. Configure SSL/TLS for database connections
11. Set up connection timeout settings
12. Configure max connections limit
13. Set up database backup schedule
14. Configure point-in-time recovery
15. Set up database monitoring (connection count, query time)
16. Create read replica for scaling (future)
17. Configure database firewall rules
18. Set up IP allowlist for production
19. Document database credentials securely
20. Create database initialization script
21. Set up automatic schema migrations
22. Configure database connection retry logic
23. Add health check for product database
24. Create database connection wrapper
25. Test database connectivity from backend

### SQLAlchemy Multi-Database Setup (26-50)

26. Create separate SQLAlchemy engine for product database
27. Create ProductBase class for product models
28. Configure session factory for product database
29. Create get_product_db dependency
30. Implement connection pool for product database
31. Add session cleanup middleware
32. Configure async support for product database
33. Create transaction management utilities
34. Implement retry logic for transient failures
35. Add query logging for debugging
36. Configure SQLAlchemy echo mode for development
37. Set up Alembic for product database migrations
38. Create initial Alembic migration
39. Configure Alembic for multiple databases
40. Add migration version tracking table
41. Create migration rollback scripts
42. Set up pre-commit hooks for migrations
43. Document migration workflow
44. Create database seeding script
45. Add test database configuration
46. Configure pytest fixtures for product database
47. Create database factory for testing
48. Add transaction rollback for tests
49. Set up CI/CD database for testing
50. Document multi-database architecture

---

## SECTION B: PRODUCT DATA MODELS (Tasks 51-100)

### Core Product Model (51-75)

51. Create CatalogProduct model in product database
52. Add UUID primary key with auto-generation
53. Add barcode field (unique, indexed)
54. Add barcode_type field (EAN-13, UPC-A, QR)
55. Add product name field (required, indexed)
56. Add brand field (required, indexed)
57. Add category field (required, indexed)
58. Add subcategory field
59. Add description field (text)
60. Add size_ml field
61. Add size_unit field (ml, oz, g, fl oz)
62. Add price_usd field
63. Add price_range field (budget, mid, luxury)
64. Add currency field
65. Add country_of_origin field
66. Add manufacturer field
67. Add product_line field (collection/series)
68. Add sku field (stock keeping unit)
69. Add upc field (universal product code)
70. Add asin field (Amazon identifier)
71. Add discontinued field (boolean)
72. Add release_date field
73. Add expiry_months field (shelf life)
74. Add storage_instructions field
75. Add usage_instructions field

### Product Images (76-90)

76. Create ProductImage model
77. Add image_url field (Cloudinary URL)
78. Add thumbnail_url field
79. Add image_type field (front, back, ingredients, texture)
80. Add is_primary field (boolean)
81. Add width/height fields
82. Add file_size_kb field
83. Add quality_score field (0-100)
84. Add source field (user, brand, obf)
85. Add cloudinary_public_id field
86. Add alt_text field for accessibility
87. Add upload_date field
88. Add uploaded_by_user_id field (reference only, no FK)
89. Create index on product_id
90. Add cascade delete for product images

### Product Attributes (91-100)

91. Add is_fragrance_free field
92. Add is_vegan field
93. Add is_cruelty_free field
94. Add is_organic field
95. Add is_clean_beauty field
96. Add is_dermatologist_tested field
97. Add is_hypoallergenic field
98. Add is_non_comedogenic field
99. Add is_paraben_free field
100. Add is_sulfate_free field

---

## SECTION C: INGREDIENT DATA MODELS (Tasks 101-150)

### Ingredient Master Table (101-125)

101. Create Ingredient model in product database
102. Add UUID primary key
103. Add inci_name field (unique, indexed)
104. Add common_names field (JSONB array)
105. Add cas_number field (Chemical Abstracts Service)
106. Add ec_number field (European Commission)
107. Add category field (humectant, emollient, preservative)
108. Add function field (what it does)
109. Add description field (detailed info)
110. Add molecular_weight field
111. Add ph_range field
112. Add solubility field
113. Add origin field (synthetic, natural, bio-fermented)
114. Add ewg_score field (1-10)
115. Add comedogenic_rating field (0-5)
116. Add irritancy_rating field (0-5)
117. Add is_active_ingredient field
118. Add is_preservative field
119. Add is_fragrance field
120. Add is_colorant field
121. Add benefits field (JSONB array)
122. Add targets_concerns field (JSONB array)
123. Add created_at field
124. Add updated_at field
125. Add data_sources field (JSONB)

### Ingredient Safety Data (126-140)

126. Add is_harmful field (boolean)
127. Add harm_severity field (high, moderate, low)
128. Add harm_categories field (array)
129. Add harm_reason field (text)
130. Add harm_alternatives field (array)
131. Add avoid_if field (array - pregnancy, sensitive skin)
132. Add max_concentration_percent field
133. Add fda_approved field
134. Add eu_approved field
135. Add banned_countries field (array)
136. Add restricted_in field (array)
137. Add pregnancy_safe field
138. Add breastfeeding_safe field
139. Add children_safe field
140. Add regulatory_notes field

### Product-Ingredient Junction (141-150)

141. Create ProductIngredient junction table
142. Add product_id foreign key
143. Add ingredient_id foreign key
144. Add position field (order in ingredient list)
145. Add concentration_percent field (if known)
146. Add is_key_active field (featured ingredient)
147. Add unique constraint (product_id, ingredient_id)
148. Create index on product_id
149. Create index on ingredient_id
150. Add cascade delete rules

---

## SECTION D: BRAND & CATEGORY MODELS (Tasks 151-200)

### Brand Model (151-175)

151. Create Brand model in product database
152. Add UUID primary key
153. Add name field (unique, indexed)
154. Add slug field (URL-friendly, unique)
155. Add display_name field
156. Add description field
157. Add logo_url field
158. Add website_url field
159. Add instagram_handle field
160. Add founded_year field
161. Add headquarters_country field
162. Add is_cruelty_free field
163. Add is_vegan field
164. Add is_clean_beauty field
165. Add is_luxury field
166. Add is_drugstore field
167. Add is_indie field
168. Add parent_company field
169. Add certifications field (JSONB array)
170. Add product_count field (denormalized)
171. Add average_rating field
172. Add price_tier field (budget, mid, premium, luxury)
173. Add created_at field
174. Add updated_at field
175. Link products to brands (foreign key)

### Category Model (176-190)

176. Create Category model
177. Add UUID primary key
178. Add name field (unique)
179. Add slug field
180. Add display_name field
181. Add description field
182. Add icon_name field
183. Add parent_category_id (self-referential FK)
184. Add display_order field
185. Add is_active field
186. Add product_count field
187. Add typical_usage_time field (morning, evening, both)
188. Add typical_step_order field
189. Add typical_frequency field
190. Create hierarchical category index

### Subcategory & Tags (191-200)

191. Create Subcategory model
192. Link subcategories to categories
193. Create ProductTag model
194. Create tag junction table
195. Add popular tags seeding
196. Create concern-based tags
197. Create skin-type tags
198. Create routine-step tags
199. Add tag search functionality
200. Create tag autocomplete

---

## SECTION E: SAFETY & ANALYSIS MODELS (Tasks 201-250)

### Pre-computed Safety Data (201-225)

201. Add safety_score field to products (0-100)
202. Add safety_summary field (text explanation)
203. Add flagged_ingredients field (JSONB)
204. Add pregnancy_safe field
205. Add breastfeeding_safe field
206. Add sensitive_skin_safe field
207. Add acne_prone_safe field
208. Add eczema_safe field
209. Add rosacea_safe field
210. Add fragrance_sensitivity_safe field
211. Add high_severity_count field
212. Add moderate_severity_count field
213. Add low_severity_count field
214. Add safety_computed_at field
215. Create safety recomputation trigger
216. Add suitable_skin_types field (array)
217. Add targets_concerns field (array)
218. Add not_suitable_for field (array)
219. Add warnings field (JSONB)
220. Add interactions field (don't use with X)
221. Create SafetyReport model for detailed reports
222. Link safety reports to products
223. Add report_version field
224. Add report_generated_by field (algorithm version)
225. Create safety score calculation function

### Product Efficacy Data (226-250)

226. Create ProductClaim model
227. Add claim_text field
228. Add claim_type field (hydration, anti-aging, etc.)
229. Add is_verified field
230. Add source field (brand, study, user)
231. Add confidence_score field
232. Create ProductStudy model
233. Add study_url field
234. Add study_summary field
235. Add study_date field
236. Add study_type field (clinical, user trial)
237. Add participant_count field
238. Add study_duration field
239. Add key_findings field
240. Create ProductReview aggregation
241. Add average_rating field
242. Add review_count field
243. Add rating_distribution field (JSONB)
244. Add common_praises field (array)
245. Add common_complaints field (array)
246. Add repurchase_rate field
247. Add effectiveness_rating field
248. Add value_rating field
249. Add texture_rating field
250. Add scent_rating field

---

## SECTION F: DATA IMPORT INFRASTRUCTURE (Tasks 251-300)

### Import Job Tracking (251-275)

251. Create ImportJob model
252. Add source field (obf, sephora, user_scan, ai)
253. Add status field (pending, running, completed, failed)
254. Add started_at field
255. Add completed_at field
256. Add total_records field
257. Add processed_records field
258. Add imported_records field
259. Add skipped_records field
260. Add error_records field
261. Add error_log field (text)
262. Add progress_percent computed field
263. Add estimated_completion field
264. Add created_by field
265. Add import_config field (JSONB)
266. Create ImportError model
267. Add record_data field
268. Add error_message field
269. Add error_type field
270. Add is_retryable field
271. Add retry_count field
272. Add resolved_at field
273. Create import dashboard API
274. Add import statistics endpoint
275. Create import retry mechanism

### Open Beauty Facts Import (276-300)

276. Create OBF import script
277. Add OBF API client
278. Implement rate limiting for OBF API
279. Create product mapping from OBF format
280. Parse OBF ingredient lists
281. Map OBF categories to our categories
282. Download and upload OBF images to Cloudinary
283. Handle duplicate barcodes
284. Create incremental sync (only new products)
285. Add last_synced_at tracking
286. Implement batch processing (1000 products at a time)
287. Add progress reporting
288. Create OBF data quality scoring
289. Filter out low-quality OBF entries
290. Map OBF brands to our brand table
291. Create brand matching/merging logic
292. Handle OBF ingredient parsing edge cases
293. Add OBF image quality filtering
294. Create scheduled OBF sync job
295. Add OBF sync monitoring
296. Document OBF import process
297. Create OBF import tests
298. Add OBF import error handling
299. Create OBF import rollback
300. Add OBF sync statistics dashboard

---

## SECTION G: SCANNER INTEGRATION (Tasks 301-350)

### Catalog-First Lookup (301-325)

301. Modify barcode scanner to check catalog first
302. Create fast barcode lookup query
303. Add barcode index optimization
304. Implement barcode lookup caching (Redis)
305. Return cached product if found
306. Skip OpenAI call if product in catalog
307. Log catalog hit/miss ratio
308. Create catalog hit rate dashboard
309. Add response time comparison metrics
310. Implement fallback to OpenAI on cache miss
311. Create product name/brand lookup
312. Add fuzzy matching for name lookup
313. Implement trigram search for names
314. Create combined barcode+name lookup
315. Add lookup result ranking
316. Implement confidence scoring for matches
317. Create partial match suggestions
318. Add "did you mean" functionality
319. Implement auto-correction for typos
320. Create lookup result caching
321. Add cache invalidation strategy
322. Implement cache warming for popular products
323. Create lookup performance monitoring
324. Add slow query alerts
325. Optimize database indexes for lookup

### Auto-Save Scanned Products (326-350)

326. Save new products to catalog after AI scan
327. Extract product data from OpenAI response
328. Parse and save ingredient list
329. Create/link to existing ingredients
330. Calculate and save safety score
331. Upload product image to Cloudinary
332. Save image reference to catalog
333. Create/link to brand
334. Assign product category
335. Set data quality score
336. Mark as unverified (AI-sourced)
337. Increment scan_count
338. Set last_scanned_at
339. Handle duplicate detection
340. Merge duplicate product data
341. Log new product additions
342. Create new product notification (admin)
343. Add product to verification queue
344. Track product source (which user scanned)
345. Create scan-to-product linking
346. Add rollback on save failure
347. Implement async product save
348. Create save queue for high traffic
349. Add save retry mechanism
350. Monitor save success rate

---

## SECTION H: API ENDPOINTS (Tasks 351-400)

### Product Lookup APIs (351-375)

351. Create GET /catalog/barcode/{barcode} endpoint
352. Create GET /catalog/lookup endpoint (name+brand)
353. Create GET /catalog/search endpoint
354. Add search filters (category, brand, price)
355. Add search sorting (popularity, name, rating)
356. Implement pagination for search
357. Add search result highlighting
358. Create GET /catalog/product/{id} endpoint
359. Add related products endpoint
360. Create products by brand endpoint
361. Create products by category endpoint
362. Add new products endpoint (recently added)
363. Create popular products endpoint
364. Add trending products endpoint
365. Create product comparison endpoint
366. Add ingredient search endpoint
367. Create products by ingredient endpoint
368. Add products without ingredient endpoint
369. Create safe products endpoint (by skin type)
370. Add pregnancy-safe products endpoint
371. Create vegan products endpoint
372. Add cruelty-free products endpoint
373. Create fragrance-free products endpoint
374. Add products by concern endpoint
375. Create OpenAPI documentation

### Admin & Management APIs (376-400)

376. Create POST /catalog/product endpoint (add)
377. Create PUT /catalog/product/{id} endpoint (update)
378. Create DELETE /catalog/product/{id} endpoint
379. Add bulk import endpoint
380. Create product verification endpoint
381. Add product merge endpoint
382. Create ingredient add endpoint
383. Add ingredient update endpoint
384. Create brand add endpoint
385. Add brand update endpoint
386. Create category management endpoints
387. Add import trigger endpoint
388. Create import status endpoint
389. Add catalog statistics endpoint
390. Create data quality report endpoint
391. Add duplicate detection endpoint
392. Create product audit log
393. Add change history endpoint
394. Create export endpoint (CSV, JSON)
395. Add backup trigger endpoint
396. Create cache clear endpoint
397. Add reindex endpoint
398. Create health check endpoint
399. Add performance metrics endpoint
400. Create API rate limiting for catalog

---

## SECTION I: FRONTEND INTEGRATION (Tasks 401-450)

### Product Display Updates (401-425)

401. Update ProductDetailsPage to use catalog data
402. Show "from catalog" badge for cached products
403. Display safety score prominently
404. Show ingredient safety highlights
405. Add pregnancy safety indicator
406. Show skin type compatibility
407. Display product attributes (vegan, etc.)
408. Add product image gallery
409. Show ingredient count
410. Display key active ingredients
411. Add product warnings section
412. Show similar products
413. Add "also bought" section
414. Display product rating summary
415. Show product claims
416. Add ingredient details modal
417. Create ingredient safety popup
418. Add "flag this product" option
419. Show product source (catalog vs AI)
420. Display data quality indicator
421. Add product last updated date
422. Show scan count (popularity)
423. Create shareable product page
424. Add product to routine button
425. Show product conflicts with existing routine

### Scanner Page Updates (426-450)

426. Show loading state during catalog lookup
427. Display "Checking catalog..." message
428. Show instant result for catalog hits
429. Display "Not in catalog, analyzing..." for misses
430. Add catalog hit celebration (faster!)
431. Show response time comparison
432. Update result display for catalog data
433. Add "Add to catalog" for new products
434. Show product verification status
435. Display confidence score
436. Add "Is this correct?" feedback
437. Create product correction flow
438. Add ingredient edit request
439. Show product history
440. Display last scanned info
441. Add product bookmarking
442. Create scan history with catalog links
443. Show related products after scan
444. Add quick add to shelf
445. Display product tips
446. Show pairing suggestions
447. Add product alternatives
448. Create comparison with similar products
449. Show price comparison
450. Add where to buy links

---

## SECTION J: DATA QUALITY & MAINTENANCE (Tasks 451-500)

### Data Verification (451-475)

451. Create product verification queue
452. Add admin verification interface
453. Create verification workflow
454. Add verification status field
455. Track verifier user ID
456. Add verification date
457. Create verification priority scoring
458. Add high-scan products to priority
459. Create ingredient verification
460. Add brand verification
461. Create image quality verification
462. Add safety score verification
463. Create duplicate detection algorithm
464. Add product merge UI
465. Create data quality scoring
466. Add quality score thresholds
467. Create quality improvement suggestions
468. Add missing data indicators
469. Create data enrichment queue
470. Add external data source integration
471. Create brand data enrichment
472. Add ingredient data enrichment
473. Create image improvement suggestions
474. Add auto-fix for common issues
475. Create data quality dashboard

### Maintenance & Monitoring (476-500)

476. Create database backup automation
477. Add backup verification tests
478. Create disaster recovery plan
479. Add database restore procedure
480. Create index optimization schedule
481. Add query performance monitoring
482. Create slow query alerts
483. Add connection pool monitoring
484. Create database size monitoring
485. Add growth projection alerts
486. Create data archival strategy
487. Add old data cleanup jobs
488. Create audit logging
489. Add change tracking
490. Create compliance reporting
491. Add GDPR data handling
492. Create data retention policy
493. Add cache hit rate monitoring
494. Create API response time tracking
495. Add error rate monitoring
496. Create uptime monitoring
497. Add failover testing
498. Create load testing scripts
499. Add performance benchmarks
500. Create documentation for entire system

---

## Implementation Priority

### Phase 1: Foundation (Tasks 1-100)
- Set up separate database
- Configure multi-database SQLAlchemy
- Create core product and ingredient models

### Phase 2: Data Models (Tasks 101-250)
- Complete all data models
- Set up migrations
- Create safety data structures

### Phase 3: Import & Integration (Tasks 251-350)
- Build import infrastructure
- Integrate with scanner
- Enable auto-save

### Phase 4: APIs & Frontend (Tasks 351-450)
- Create all API endpoints
- Update frontend to use catalog
- Add admin tools

### Phase 5: Quality & Ops (Tasks 451-500)
- Data verification
- Monitoring and maintenance
- Documentation

---

**Estimated Effort:** 2-3 weeks for complete implementation
**Database Provider Recommendation:** Railway PostgreSQL (same provider, easier management) or Supabase (free tier, good tooling)
