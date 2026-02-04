# Best & Easiest Affiliate Setup for Starting (Location-Based)

## Recommendation: **Start with Amazon (one country)**

For **starting** and **location-based** links with minimal setup:

| Why | Detail |
|-----|--------|
| **Already integrated** | Your app already has Amazon PA-API; you only add credentials. |
| **One signup** | Single Amazon Associates account for one marketplace (e.g. US or UK). |
| **Location-based** | Backend accepts a **country** (e.g. from the frontend). Amazon links are only shown when the user’s country matches your configured marketplace, so you don’t send US users to UK Amazon or vice versa. |
| **Easy to add more later** | When you’re ready, you can register for more Amazon marketplaces (e.g. UK, DE) and add a second set of credentials; the same API can then choose by country. |

**Steps:**

1. Get Amazon PA-API credentials for **one** marketplace (e.g. US): [How to get the API](AMAZON-AFFILIATE-SETUP.md#how-to-get-the-api).
2. Set env: `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG`, and `AMAZON_COUNTRY=US` (or your chosen country).
3. In the app, pass the user’s country (e.g. from browser locale or a selector) to the recommendations API as `?country=US`. The backend will only add Amazon results when `country` matches `AMAZON_COUNTRY`.

---

## If you want **one account, many countries** later

- **Awin** (or similar networks) give you one publisher account and one API; they handle many countries and localize links. That’s easier than managing several Amazon accounts, but requires integrating their API first.
- **Practical approach:** Start with **Amazon in one country** (easiest). When you need more regions, either add more Amazon marketplace credentials (per country) or add **Awin** (or another global network) so one integration covers many locations.

---

## Summary

- **Best & easiest for starting location-based:** **Amazon**, one marketplace (e.g. US), with the new `country` parameter so links are only shown for that region.
- **Later, for many countries:** Add more Amazon marketplaces and/or a global network (e.g. Awin).
