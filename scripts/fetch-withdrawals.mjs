#!/usr/bin/env node

/**
 * Biotech Withdrawal Tracker — Data Fetcher
 * 
 * Queries openFDA, regulations.gov, and Federal Register APIs
 * to find withdrawn biotech applications across FDA, USDA, and EPA.
 * 
 * Usage:
 *   node fetch-withdrawals.mjs
 *   node fetch-withdrawals.mjs --agency=fda
 *   node fetch-withdrawals.mjs --agency=usda
 *   node fetch-withdrawals.mjs --output=data.json
 * 
 * API Keys:
 *   - openFDA: optional (set OPENFDA_API_KEY env var for higher rate limits)
 *   - regulations.gov: required (set REGULATIONS_GOV_KEY env var, get free key at api.data.gov/signup)
 */

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace('--', '').split('=');
    return [k, v || true];
  })
);

const OPENFDA_KEY = process.env.OPENFDA_API_KEY || '';
const REGULATIONS_KEY = process.env.REGULATIONS_GOV_KEY || 'DEMO_KEY';
const OUTPUT_FILE = args.output || 'biotech-withdrawals.json';
const AGENCY_FILTER = args.agency || 'all';

// ─── openFDA ────────────────────────────────────────────────

async function fetchFDA() {
  console.log('\n📋 Querying openFDA Drugs@FDA for withdrawn biologics...\n');

  const base = 'https://api.fda.gov/drug/drugsfda.json';
  const apiParam = OPENFDA_KEY ? `&api_key=${OPENFDA_KEY}` : '';

  // Step 1: Get all unique submission_status values to understand the data
  const statusCountUrl = `${base}?count=submissions.submission_status.exact&limit=20${apiParam}`;
  console.log('  → Enumerating submission status values...');
  
  let statusValues = [];
  try {
    const res = await fetch(statusCountUrl);
    const data = await res.json();
    statusValues = data.results || [];
    console.log('    Status values found:');
    statusValues.forEach(s => console.log(`      ${s.term}: ${s.count} submissions`));
  } catch (e) {
    console.error('    ⚠ Could not enumerate statuses:', e.message);
  }

  // Step 2: Query for withdrawn marketing status products
  const withdrawnUrl = `${base}?search=products.marketing_status:"Withdrawn"&limit=99${apiParam}`;
  console.log('\n  → Fetching products with Withdrawn marketing status...');
  
  let withdrawnProducts = [];
  try {
    const res = await fetch(withdrawnUrl);
    const data = await res.json();
    const total = data.meta?.results?.total || 0;
    console.log(`    Found ${total} total applications with withdrawn products`);
    withdrawnProducts = (data.results || []).map(app => ({
      source: 'FDA',
      application_number: app.application_number,
      sponsor: app.sponsor_name || app.openfda?.manufacturer_name?.[0] || 'Unknown',
      brand_name: app.openfda?.brand_name?.[0] || 'Unknown',
      generic_name: app.openfda?.generic_name?.[0] || 'Unknown',
      pharm_class: app.openfda?.pharm_class_epc?.[0] || 'Unknown',
      substance: app.openfda?.substance_name?.[0] || 'Unknown',
      products: (app.products || []).map(p => ({
        marketing_status: p.marketing_status,
        dosage_form: p.dosage_form,
        route: p.route,
        active_ingredients: (p.active_ingredients || []).map(i => i.name).join(', '),
      })),
      submissions: (app.submissions || []).map(s => ({
        type: s.submission_type,
        number: s.submission_number,
        status: s.submission_status,
        status_date: s.submission_status_date,
        class_code: s.submission_class_code_description,
        public_notes: s.submission_public_notes || null,
        review_priority: s.review_priority || null,
        docs: (s.application_docs || []).map(d => ({
          title: d.title,
          date: d.date,
          type: d.type,
          url: d.url,
        })),
      })),
      is_biologic: (app.application_number || '').startsWith('BLA'),
    }));
  } catch (e) {
    console.error('    ⚠ Error fetching withdrawn products:', e.message);
  }

  // Step 3: Also specifically query BLAs (Biologics License Applications)
  const blaUrl = `${base}?search=application_number:BLA*&limit=99${apiParam}`;
  console.log('\n  → Fetching all BLA (biologics) applications...');
  
  let blaApplications = [];
  try {
    const res = await fetch(blaUrl);
    const data = await res.json();
    const total = data.meta?.results?.total || 0;
    console.log(`    Found ${total} total BLA applications`);
    blaApplications = (data.results || []).map(app => ({
      application_number: app.application_number,
      sponsor: app.sponsor_name || app.openfda?.manufacturer_name?.[0] || 'Unknown',
      brand_name: app.openfda?.brand_name?.[0] || 'Unknown',
      generic_name: app.openfda?.generic_name?.[0] || 'Unknown',
      has_withdrawn_product: (app.products || []).some(p => p.marketing_status === 'Withdrawn'),
      latest_submission_status: app.submissions?.[0]?.submission_status || 'Unknown',
    }));
  } catch (e) {
    console.error('    ⚠ Error fetching BLAs:', e.message);
  }

  // Step 4: Try the Complete Response Letters endpoint
  console.log('\n  → Checking Complete Response Letters endpoint...');
  let crls = [];
  try {
    const crlUrl = `https://api.fda.gov/other/completeresponseletters.json?limit=5${apiParam}`;
    const res = await fetch(crlUrl);
    const data = await res.json();
    const total = data.meta?.results?.total || 0;
    console.log(`    CRL database contains ${total} total letters`);
    crls = (data.results || []).slice(0, 5).map(crl => ({
      application_number: crl.application_number,
      letter_issue_date: crl.letter_issue_date,
      application_type: crl.application_type,
    }));
  } catch (e) {
    console.error('    ⚠ CRL endpoint not available or errored:', e.message);
  }

  return {
    withdrawn_products: withdrawnProducts,
    bla_applications: blaApplications,
    complete_response_letters: crls,
    status_value_counts: statusValues,
  };
}

// ─── Regulations.gov (USDA/APHIS + EPA) ────────────────────

async function fetchRegulationsGov(agencyId, searchTerm) {
  console.log(`\n📋 Querying regulations.gov for ${agencyId} — "${searchTerm}"...\n`);

  const base = 'https://api.regulations.gov/v4';
  
  // Search for documents
  const docsUrl = `${base}/documents?filter[agencyId]=${agencyId}&filter[searchTerm]=${encodeURIComponent(searchTerm)}&page[size]=25&sort=-postedDate&api_key=${REGULATIONS_KEY}`;
  
  let documents = [];
  try {
    const res = await fetch(docsUrl);
    const data = await res.json();
    const total = data.meta?.totalElements || 0;
    console.log(`  Found ${total} documents`);
    
    documents = (data.data || []).map(doc => ({
      source: agencyId,
      document_id: doc.id,
      type: doc.attributes?.documentType,
      title: doc.attributes?.title,
      posted_date: doc.attributes?.postedDate,
      comment_end_date: doc.attributes?.commentEndDate,
      withdrawn: doc.attributes?.withdrawn || false,
      docket_id: doc.attributes?.docketId,
      subtype: doc.attributes?.subtype,
    }));

    const withdrawnCount = documents.filter(d => d.withdrawn).length;
    console.log(`  ${withdrawnCount} of ${documents.length} returned documents are marked withdrawn`);
  } catch (e) {
    console.error(`  ⚠ Error querying regulations.gov: ${e.message}`);
  }

  return documents;
}

async function fetchUSDA() {
  const biotech = await fetchRegulationsGov('APHIS', 'biotechnology petition nonregulated status');
  const ge = await fetchRegulationsGov('APHIS', 'genetically engineered deregulation withdrawn');
  
  // Deduplicate by document_id
  const seen = new Set();
  const all = [...biotech, ...ge].filter(d => {
    if (seen.has(d.document_id)) return false;
    seen.add(d.document_id);
    return true;
  });

  return all;
}

async function fetchEPA() {
  const pips = await fetchRegulationsGov('EPA', 'plant-incorporated protectant biotechnology');
  const biopesticides = await fetchRegulationsGov('EPA', 'biopesticide registration genetically engineered');
  
  const seen = new Set();
  return [...pips, ...biopesticides].filter(d => {
    if (seen.has(d.document_id)) return false;
    seen.add(d.document_id);
    return true;
  });
}

// ─── Federal Register ───────────────────────────────────────

async function fetchFederalRegister() {
  console.log('\n📋 Querying Federal Register for biotech withdrawal notices...\n');

  const base = 'https://www.federalregister.gov/api/v1/documents.json';
  const params = new URLSearchParams({
    'conditions[term]': 'withdrawn biotechnology application',
    'conditions[agencies][]': 'food-and-drug-administration',
    'per_page': '20',
    'order': 'newest',
    'fields[]': 'title,publication_date,type,abstract,agencies,document_number,html_url',
  });

  let notices = [];
  try {
    const res = await fetch(`${base}?${params}`);
    const data = await res.json();
    console.log(`  Found ${data.count || 0} Federal Register notices`);
    notices = (data.results || []).map(n => ({
      title: n.title,
      date: n.publication_date,
      type: n.type,
      abstract: n.abstract,
      url: n.html_url,
      document_number: n.document_number,
    }));
  } catch (e) {
    console.error(`  ⚠ Error: ${e.message}`);
  }

  return notices;
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Biotech Withdrawal Tracker — Data Fetcher  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\nAgency filter: ${AGENCY_FILTER}`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  const result = {
    fetched_at: new Date().toISOString(),
    fda: null,
    usda: null,
    epa: null,
    federal_register: null,
  };

  if (AGENCY_FILTER === 'all' || AGENCY_FILTER === 'fda') {
    result.fda = await fetchFDA();
  }

  if (AGENCY_FILTER === 'all' || AGENCY_FILTER === 'usda') {
    result.usda = await fetchUSDA();
  }

  if (AGENCY_FILTER === 'all' || AGENCY_FILTER === 'epa') {
    result.epa = await fetchEPA();
  }

  if (AGENCY_FILTER === 'all') {
    result.federal_register = await fetchFederalRegister();
  }

  // Write output
  const { writeFileSync } = await import('node:fs');
  writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`\n✅ Data written to ${OUTPUT_FILE}`);

  // Summary
  console.log('\n── Summary ──────────────────────────────────');
  if (result.fda) {
    console.log(`FDA: ${result.fda.withdrawn_products.length} withdrawn products, ${result.fda.bla_applications.length} BLAs sampled`);
    console.log(`     ${result.fda.withdrawn_products.filter(p => p.is_biologic).length} of withdrawn are biologics (BLAs)`);
  }
  if (result.usda) {
    console.log(`USDA: ${result.usda.length} documents found, ${result.usda.filter(d => d.withdrawn).length} marked withdrawn`);
  }
  if (result.epa) {
    console.log(`EPA: ${result.epa.length} documents found, ${result.epa.filter(d => d.withdrawn).length} marked withdrawn`);
  }
  if (result.federal_register) {
    console.log(`Federal Register: ${result.federal_register.length} relevant notices`);
  }
}

main().catch(console.error);
