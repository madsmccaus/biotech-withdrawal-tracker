# Biotech Withdrawal Tracker

A dashboard for tracking withdrawn biotech applications across US regulatory agencies — FDA, USDA/APHIS, and EPA — using free, public government APIs.

## What it does

Queries the [openFDA API](https://open.fda.gov) to surface drug and biologic applications (NDAs, ANDAs, BLAs) where products have been withdrawn from the market. For each application, it shows:

- **Who** filed it (sponsor / manufacturer)
- **What** it was (brand name, generic name, active substances, pharmacological class)
- **When** key submissions happened (full submission timeline with status codes)
- **Supporting documents** linked from FDA (approval letters, labels, reviews)

## Live dashboard

The React app queries openFDA directly from the browser (it's a public, CORS-enabled API — no backend needed).

### Run locally

```bash
npm install
npm run dev
```

### Deploy to GitHub Pages

```bash
npm run build
```

The `dist/` folder is a static site. Deploy with GitHub Pages, Netlify, Vercel, or any static host.

To deploy with GitHub Pages using GitHub Actions, push to `main` and the included workflow will build and deploy automatically.

## Data fetcher script

For deeper analysis across all three agencies (FDA + USDA + EPA), there's a Node.js script that queries multiple APIs and outputs structured JSON:

```bash
# FDA only (no API key needed)
node scripts/fetch-withdrawals.mjs --agency=fda

# All agencies (needs a free regulations.gov key from api.data.gov/signup)
REGULATIONS_GOV_KEY=your_key node scripts/fetch-withdrawals.mjs

# Custom output path
node scripts/fetch-withdrawals.mjs --output=my-data.json
```

## API sources

| Source | API | Key Required | What's Available |
|--------|-----|-------------|------------------|
| **FDA** | [openFDA Drugs@FDA](https://open.fda.gov/apis/drug/drugsfda/) | Optional (free, higher rate limits) | Applications, products, submissions, status, sponsor, documents |
| **FDA** | [openFDA Complete Response Letters](https://open.fda.gov/apis/transparency/completeresponseletters/) | Optional | Deficiency letters (the closest thing to "why" an application failed) |
| **USDA/APHIS** | [regulations.gov v4](https://open.gsa.gov/api/regulationsgov/) | Yes (free) | Biotech petition documents, dockets, withdrawn status |
| **EPA** | [regulations.gov v4](https://open.gsa.gov/api/regulationsgov/) | Yes (free) | Biopesticide registration documents (limited biotech data) |
| **Cross-cutting** | [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1) | No | Withdrawal notices, proposed rules, final rules |

## Architecture notes

- **Phase 1 (current):** FDA-only dashboard querying openFDA from the browser
- **Phase 2:** Add USDA/APHIS petition data (scraped from APHIS petition table + regulations.gov)
- **Phase 3:** EPA biopesticide data (Federal Register monitoring)
- **Future:** LLM-powered extraction of withdrawal reasons from CRLs and Federal Register notices

## License

MIT
