# Other Ways to Earn Globally (Affiliate Options)

Besides **Amazon Associates** (PA-API / Creators API), you can use these affiliate options to recommend products and earn globally. Many support multiple countries and have APIs or product feeds.

---

## 1. **Awin** (includes former ShareASale)

- **Coverage:** Global (9,500+ advertisers, 250,000+ publishers after ShareASale merger).
- **How you earn:** Commission per sale/lead; payouts in multiple currencies.
- **Product data:** Product feeds (CSV/API). Publishers can use the **Product Feed List** API to get merchant feeds (names, prices, images, deep links). Good for “search → show products → affiliate link.”
- **Beauty/skincare:** Many beauty and retail advertisers; search by vertical.
- **Get started:** [awin.com](https://www.awin.com) → sign up as Publisher → Developer Centre: [developer.awin.com](https://developer.awin.com) for API/docs and product feeds.
- **Integration:** REST APIs with Bearer token; feed-based (download/parse feeds or call feed list endpoint). You’d add a backend service that fetches Awin feeds or uses their APIs and returns products in the same shape as your recommendations.

---

## 2. **Rakuten Advertising** (formerly Rakuten Marketing / LinkShare)

- **Coverage:** Global; 200M+ transactions/year, 1.2B+ consumers.
- **How you earn:** Commission on sales; used by many beauty brands (e.g. Sephora’s affiliate program runs through Rakuten).
- **Product data:** Product feeds (CSV, TSV, Google format); they have a Product Feed Specification and developer guides (product search, etc.).
- **Beauty/skincare:** Strong in beauty (Sephora and 200+ brands, 13,000+ products in one program).
- **Get started:** [rakutenadvertising.com](https://rakutenadvertising.com) → sign up as publisher → use product feeds and/or APIs (see their Developer Portal / product search guides).
- **Integration:** Feed-based or API; you’d normalize feed/API response to your recommendation format and add affiliate links.

---

## 3. **Affiliate.com (programmatic APIs)**

- **Coverage:** 180+ network endpoints globally.
- **How you earn:** Commission via their network of advertisers.
- **Product data:** **Product API** and **Promotion API** – real-time pricing, inventory, 30+ meta fields (name, description, price, images, barcodes). REST APIs or data files.
- **Use case:** Suited for shopping assistants, product recommendations, and deal discovery.
- **Get started:** [affiliate.com](https://www.affiliate.com) → programmatic/product APIs.
- **Integration:** REST APIs; backend service could call their APIs and map results to your recommendation schema.

---

## 4. **Skimlinks** (Skimlinks / Connexity)

- **Coverage:** Global; used by many publishers and creators.
- **How you earn:** Commission; they auto-apply affiliate links across merchants.
- **Product data:** Often used as “link wrap” (you output normal product links; they redirect through affiliate). Some merchants/product catalogs available depending on plan.
- **Beauty:** Supports beauty merchants (e.g. Sephora via their network).
- **Get started:** [skimlinks.com](https://skimlinks.com) or Connexity brand.
- **Integration:** Can be as simple as “redirect outbound product links through Skimlinks” without a full product API; for a full “recommendation grid” you’d combine with a product source (e.g. your DB + Skimlinks for links).

---

## 5. **CJ Affiliate** (Commission Junction)

- **Coverage:** Global; large network.
- **How you earn:** Commission per sale/lead.
- **Product data:** Product feeds and reporting APIs; many advertisers provide feeds.
- **Get started:** [cj.com](https://www.cj.com) → publisher signup → use feeds/API.
- **Integration:** Feed or API; normalize to your recommendation format and add CJ links.

---

## 6. **Impact** (impact.com)

- **Coverage:** Global; enterprise and mid-market brands.
- **How you earn:** Commission; strong in retail and CPG (including beauty).
- **Product data:** Depends on advertiser; product catalog and reporting APIs available.
- **Get started:** [impact.com](https://www.impact.com) → publisher/partner signup.
- **Integration:** API-based; add a service that calls Impact’s APIs and maps to your recommendations.

---

## 7. **Direct brand programs (no single API)**

- Many **skincare/beauty brands** run their own affiliate programs (e.g. through Awin, Rakuten, or in-house). You join per brand and get links/feeds from each.
- **Pros:** Often higher commission, brand fit.  
- **Cons:** No single “one API for all”; you aggregate multiple programs or use a network (Awin/Rakuten) that already aggregates them.

---

## Quick comparison (for “earn globally”)

| Option           | Global? | Product API / feed? | Beauty/skincare | Ease for dev |
|------------------|--------|----------------------|------------------|--------------|
| **Amazon**       | Yes (per marketplace) | Yes (PA-API / Creators) | Yes            | Already integrated (PA-API) |
| **Awin**         | Yes    | Yes (feeds + API)    | Yes              | Add service + auth |
| **Rakuten**      | Yes    | Feeds + APIs         | Yes (e.g. Sephora) | Add service + feeds/API |
| **Affiliate.com**| Yes    | Yes (Product/Promotion API) | Yes    | Add service + API |
| **Skimlinks**    | Yes    | Link wrap + some data| Yes              | Link redirect or hybrid |
| **CJ / Impact**  | Yes    | Feeds / API          | Yes              | Add service |

---

## How to add another affiliate source to this app

1. **Backend:** Add a new service (e.g. `awin_affiliate_service.py` or `rakuten_affiliate_service.py`) that:
   - Uses the network’s API or product feeds.
   - Returns a list of items in the same shape as your recommendation items (id, name, brand, category, price, image_url, **purchase_url** = affiliate link).
2. **Recommendations endpoint:** In `get_recommendations`, after DB and (optionally) Amazon, if you still need more items, call the new service and append results (same as we do for Amazon).
3. **Config:** Add env vars for that network (e.g. `AWIN_API_TOKEN`, `RAKUTEN_*`). Keep keys and secrets server-side only.

If you tell me which network you want first (e.g. Awin, Rakuten, or Affiliate.com), I can outline the exact API/feed steps and the minimal code changes for this repo.
