# Amazon Affiliate API – Product Recommendations

The app can supplement product recommendations with **Amazon Product Advertising API (PA-API 5.0)** results so users see real, purchasable products with affiliate links.

## How it works

- **Recommendations endpoint** (`GET /api/v1/recommendations`) returns DB products first (from the catalog, filtered by user profile).
- If there are **fewer than requested** results, the backend calls the Amazon PA-API with keywords derived from the user’s **skin type** and **concerns** (e.g. `dry skin acne skincare`).
- Amazon items are appended to the list (same `RecommendationItem` shape: id = ASIN, `purchase_url` = affiliate link).
- If Amazon credentials are not set or the API fails, only DB results are returned (no error to the user).

## How to get the API

### Option A: Product Advertising API (PA-API 5.0) – if you already have access

**Note:** Amazon is deprecating PA-API on **April 30, 2026** and may not accept new PA-API signups. If you don’t see “Product Advertising API” in your Associates account, use **Option B (Creators API)** instead.

1. **Sign in to Amazon Associates**  
   Go to **[affiliate-program.amazon.com](https://affiliate-program.amazon.com)** and sign in (you must be an approved Associate).

2. **Open Product Advertising API**  
   In the Associates dashboard: **Tools** → **Product Advertising API**  
   (Or use the direct link from the PA-API docs: [Register for PA-API](https://webservices.amazon.com/paapi5/documentation/register-for-pa-api.html).)

3. **Request/join the API**  
   If you see an option to “Join” or “Request access,” complete it. Approval can take a short time.

4. **Get your credentials**  
   - **Access Key** and **Secret Key** – under “Manage Your Credentials” (you can add or download; max 2 key pairs).  
   - **Partner Tag** – your Associates tracking ID (e.g. `yoursite-20`), usually in **Account** → **Manage Your Account** or in the same Tools area.

5. **Use them in the app**  
   Set `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, and `AMAZON_PARTNER_TAG` in your backend environment (see below).

---

### Option B: Amazon Creators API – for new signups (recommended by Amazon)

Amazon is moving to the **Creators API**; new applicants should use this.

1. **Sign up for Amazon Associates**  
   **[affiliate-program.amazon.com/signup](https://affiliate-program.amazon.com/signup)** – create an account and get approved as an Associate.

2. **Open Creators API**  
   In Associates Central: **Tools** → **Creators API**.

3. **Create an application and get credentials**  
   Create a new application and generate:
   - **Credential ID**
   - **Credential Secret**  
   (Creators API uses these instead of Access Key / Secret Key, and uses OAuth 2.0.)

4. **Partner Tag**  
   Your affiliate/tracking ID (e.g. `yoursite-20`) is the same as for Associates; find it in your account settings.

**App support:** The current backend is wired for **PA-API 5.0** (Access Key + Secret Key + Partner Tag). To use **Creators API**, the backend would need a small new integration (different auth and endpoints). If you only have Creators API credentials, we can add support for that next.

---

### Summary

| Source        | What you get                          | Use in this app                          |
|---------------|----------------------------------------|------------------------------------------|
| **PA-API 5.0** | Access Key, Secret Key, Partner Tag   | Set `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG` |
| **Creators API** | Credential ID, Credential Secret, Partner Tag | Not yet supported; can be added          |

## Environment variables

Set these in your backend environment (e.g. Railway, `.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `AMAZON_ACCESS_KEY` | Yes (for Amazon results) | PA-API access key |
| `AMAZON_SECRET_KEY` | Yes | PA-API secret key |
| `AMAZON_PARTNER_TAG` | Yes | Associates partner/tracking tag for affiliate links |
| `AMAZON_COUNTRY` | No | Marketplace country code (default: `US`). e.g. `UK`, `DE`, `FR`. |
| `AMAZON_SEARCH_INDEX` | No | Category for search (default: `Beauty`). |

If any of the three required vars are missing, the app runs as before and only DB recommendations are used.

## Dependency

- **Backend:** `python-amazon-paapi` (see `backend/requirements.txt`).

## Note on PA-API deprecation

Amazon has announced that **PA-API will be deprecated on April 30, 2026**. They recommend migrating to the **Creators API**. When that migration is required, the integration can be switched to the new API; the rest of the app (recommendations endpoint and frontend) can stay the same.
