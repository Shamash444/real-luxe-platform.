/*
 * Supabase client for the public site.
 *
 * Reads retry twice. Writes get three attempts before falling back to
 * localStorage, so a dropped connection doesn't swallow an enquiry.
 *
 * The anon key is public by design. Row level security on the server is the
 * thing actually protecting these tables.
 */

/* From config.js. With nothing set the client stays dormant: the catalogue
   falls back to data.js and enquiries queue in the browser. */
var SUPABASE_URL      = (window.RL && window.RL.get('integrations.supabase.url')) || '';
var SUPABASE_ANON_KEY = (window.RL && window.RL.get('integrations.supabase.anonKey')) || '';

var _sb             = null;
var _supabaseReady  = false;
var _supabaseError  = null;
var _retryQueue     = [];   // enquiries waiting on a working connection
var _initAttempts   = 0;
var _maxInitRetries = 3;

function _initSupabase() {
  'use strict';
  _initAttempts++;


  var sdk = window.supabase;
  if (!sdk) {
    _supabaseError = new Error(
      'Supabase SDK not loaded (window.supabase is undefined).\n' +
      'Check that <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> ' +
      'comes BEFORE supabase-client.js and does NOT carry the "defer" attribute.'
    );
    console.warn('[Real Luxe] ' + _supabaseError.message);

    // CDN script may still be in flight, so back off and look again
    if (_initAttempts < _maxInitRetries) {
      setTimeout(_initSupabase, _initAttempts * 1000);
    }
    return;
  }

  // UMD build hangs createClient off the namespace; bundled ESM buries it under .default
  var createFn = sdk.createClient || (sdk.default && sdk.default.createClient);
  if (typeof createFn !== 'function') {
    _supabaseError = new Error(
      'SDK loaded but createClient() is missing.\n' +
      'window.supabase contains: ' + Object.keys(sdk).join(', ')
    );
    console.warn('[Real Luxe] ' + _supabaseError.message);
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_URL.startsWith('https://')) {
    _supabaseError = new Error('SUPABASE_URL is not valid: "' + SUPABASE_URL + '"');
    console.warn('[Real Luxe] ' + _supabaseError.message);
    return;
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 30) {
    _supabaseError = new Error('SUPABASE_ANON_KEY is not valid (too short).');
    console.warn('[Real Luxe] ' + _supabaseError.message);
    return;
  }

  try {
    _sb = createFn(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { 'X-Client': 'real-luxe-web' }
      }
    });
    _supabaseReady = true;
    _supabaseError = null;
    console.info('[Real Luxe] Supabase connected.');

    _flushRetryQueue();   // drain whatever piled up while we were down

  } catch (err) {
    _supabaseError = new Error('createClient() threw: ' + err.message);
    console.warn('[Real Luxe] ' + _supabaseError.message);
  }
}

/* Only attempt a connection when credentials exist. */
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  _initSupabase();
} else {
  _supabaseError = new Error('No Supabase project configured in config.js.');
}


/* Properties */

// null when nothing is configured or the connection failed; callers fall back to data.js
function getSupabaseClient() {
  return (_supabaseReady && _sb) ? _sb : null;
}

async function fetchPublishedProperties(options) {
  options = options || {};
  var location  = options.location  || null;
  var orderBy   = options.orderBy   || 'price';
  var ascending = options.ascending !== undefined ? options.ascending : true;
  var retries   = options._retries  || 0;

  if (!_supabaseReady || !_sb) {
    var reason = _supabaseError ? _supabaseError.message : 'Client not initialised.';
    throw new Error('[Connection] ' + reason);
  }


  var query = _sb
    .from('properties')
    .select('*')
    .eq('status', 'published');

  if (location && location !== 'all') {
    query = query.eq('location', location);
  }

  query = query.order(orderBy, { ascending: ascending });

  var result = await query;
  var data  = result.data;
  var error = result.error;

  if (error) {
    console.warn('[Real Luxe] Property fetch failed: ' + error.message);

    // two retries, 1.5s then 3s, then give up and let the caller show data.js
    if (retries < 2) {
      var delay = (retries + 1) * 1500;
      await new Promise(function(r) { setTimeout(r, delay); });
      options._retries = retries + 1;
      return fetchPublishedProperties(options);
    }

    throw new Error('[Query] ' + error.message + (error.hint ? ' (Hint: ' + error.hint + ')' : ''));
  }

  return data || [];
}


/* Leads */

// RL-YYYYMMDD-XXXXXXXX. Made client side so an enquiry stuck in localStorage still has a reference.
function generateCommissionId() {
  var now = new Date();
  var date = now.getFullYear().toString() +
    ('0' + (now.getMonth() + 1)).slice(-2) +
    ('0' + now.getDate()).slice(-2);
  var uid = Math.random().toString(36).substring(2, 10).toUpperCase();
  return 'RL-' + date + '-' + uid;
}

/* The callback is the Lead Guard — script.js only reveals the WhatsApp button
   once it fires with a null error. Every path out of this function has to call
   it, including the failures. */
async function insertLead(leadData, callback) {
  callback = callback || function() {};

  var commissionId = generateCommissionId();
  leadData.commission_id = commissionId;


  /* No client yet. Queue in memory for the flush and keep a localStorage copy
     in case the tab closes first. Both can drain later, so the same enquiry can
     land twice; dedupe on commission_id if that ever turns up. */
  if (!_supabaseReady || !_sb) {
    console.warn('[Real Luxe] Supabase unavailable — enquiry queued locally.');
    _retryQueue.push({ data: leadData, callback: callback });

    _storeLeadLocally(leadData);
    callback(new Error('Supabase not ready, enquiry saved locally'), { commission_id: commissionId, saved_locally: true });
    return;
  }

  // the table columns are still the original French ones
  var payload = {
    commission_id:     commissionId,
    nom:               leadData.nom || leadData.name || '',
    email:             leadData.email || '',
    tel:               leadData.tel || leadData.phone || '',
    message:           leadData.message || '',
    villa_interet:     leadData.villa_interet || leadData.property_slug || '',
    property_name:     leadData.property_name || '',
    property_location: leadData.property_location || '',
    horizon:           leadData.horizon || '',
    budget:            leadData.budget || '',
    confotur_interest: leadData.confotur_interest || false,
    source:            leadData.source || 'website',
    language:          leadData.language || 'en',
    partner_agency:    leadData.partner_agency || ''
  };

  var maxRetries = 3;
  var lastError = null;

  for (var attempt = 0; attempt < maxRetries; attempt++) {
    try {
      var result = await _sb.from('leads').insert([payload]);

      if (result.error) {
        lastError = result.error;
        console.warn('[Real Luxe] Enquiry write failed (attempt ' + (attempt + 1) + '): ' + result.error.message);

        if (attempt < maxRetries - 1) {
          await new Promise(function(r) { setTimeout(r, (attempt + 1) * 1000); });
          continue;
        }
      } else {
        console.info('[Real Luxe] Enquiry recorded (' + commissionId + ').');

        callback(null, {
          commission_id: commissionId,
          supabase_id: null,
          saved: true
        });
        return;
      }
    } catch (err) {
      lastError = err;
      console.warn('[Real Luxe] Enquiry write threw (attempt ' + (attempt + 1) + '): ' + err.message);
      if (attempt < maxRetries - 1) {
        await new Promise(function(r) { setTimeout(r, (attempt + 1) * 1000); });
      }
    }
  }

  // out of attempts
  console.error('[Real Luxe] Enquiry could not be written after ' + maxRetries + ' attempts.');
  _storeLeadLocally(leadData);
  callback(lastError || new Error('Insert failed'), { commission_id: commissionId, saved_locally: true });
}


// "tunnel" is the three-step form on the home page, "vault" the off-market one below it
async function insertLeadFromTunnel(tunnelData, callback) {
  var leadData = {
    nom:               (tunnelData.firstName || '') + ' ' + (tunnelData.lastName || ''),
    email:             tunnelData.email || '',
    tel:               tunnelData.phone || '',
    villa_interet:     'general-inquiry',
    property_name:     'Private consultation',
    property_location: '',
    horizon:           tunnelData.horizon || '',
    budget:            tunnelData.budget || '',
    confotur_interest: tunnelData.confoturInterest || false,
    source:            'tunnel',
    language:          tunnelData.language || 'en'
  };

  await insertLead(leadData, callback);
}


async function insertLeadFromVault(vaultData, callback) {
  var leadData = {
    nom:               vaultData.name || '',
    email:             vaultData.email || '',
    tel:               vaultData.phone || '',
    message:           vaultData.message || '',
    villa_interet:     'vault-access',
    property_name:     'Off-market collection',
    budget:            vaultData.budget || '',
    source:            'vault',
    language:          vaultData.language || 'en'
  };

  await insertLead(leadData, callback);
}


function _storeLeadLocally(data) {
  try {
    var stored = JSON.parse(localStorage.getItem('rl-leads-pending') || '[]');
    data._savedAt = new Date().toISOString();
    stored.push(data);
    localStorage.setItem('rl-leads-pending', JSON.stringify(stored));
    console.info('[Real Luxe] Enquiry stored locally (' + stored.length + ' pending).');
  } catch (e) {
    // private browsing and a full quota both throw on setItem
    console.error('[Real Luxe] Local storage unavailable: ' + e.message);
  }
}

// resend the queued leads once Supabase comes back
async function _flushRetryQueue() {
  if (_retryQueue.length === 0) return;


  var queue = _retryQueue.slice();
  _retryQueue = [];

  for (var i = 0; i < queue.length; i++) {
    await insertLead(queue[i].data, queue[i].callback);
  }
}

async function syncPendingLeads() {
  if (!_supabaseReady || !_sb) return;

  try {
    var stored = JSON.parse(localStorage.getItem('rl-leads-pending') || '[]');
    if (stored.length === 0) return;

    var remaining = [];
    for (var i = 0; i < stored.length; i++) {
      try {
        await insertLead(stored[i], function(err) {
          if (err) remaining.push(stored[i]);
        });
      } catch (e) {
        remaining.push(stored[i]);
      }
    }

    /* insertLead re-stores its own failures, and the setItem below overwrites
       that with `remaining`. Same set either way. */
    localStorage.setItem('rl-leads-pending', JSON.stringify(remaining));
    if (remaining.length === 0) {
      console.info('[Real Luxe] Pending enquiries synchronised.');
    } else {
      console.warn('[Real Luxe] ' + remaining.length + ' enquiry(ies) still pending.');
    }
  } catch (e) { /* silent */ }
}

// after the init retries, which run at 0, 1s and 3s
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(syncPendingLeads, 3000);
  });
} else {
  setTimeout(syncPendingLeads, 3000);
}


function formatPrice(value) {
  if (typeof value === 'string' && value.startsWith('$')) return value;
  var num = typeof value === 'number' ? value : parseInt(value, 10);
  if (isNaN(num)) return '$0';
  return '$' + num.toLocaleString('en-US');
}

// turns a Supabase row into the shape the renderer expects
function normalizeProperty(row) {
  return {
    slug:              row.slug              || '',
    name:              row.name              || '',
    location:          row.location          || '',
    price:             formatPrice(row.price),
    tag:               row.tag               || '',
    beds:              row.beds              || 0,
    baths:             row.baths             || 0,
    sqm:               row.sqm              || 0,
    sqft:              row.sqft             || Math.round((row.sqm || 0) * 10.7639),   // older rows have no sqft
    lot:               row.lot              || 0,
    year:              row.year             || 2024,
    pool:              row.pool             || '',
    parking:           row.parking          || 0,
    img:               row.img              || '',
    gallery:           Array.isArray(row.gallery) ? row.gallery : [],
    description:       row.description_en   || row.description || '',
    description_fr:    row.description_fr   || '',
    description_en:    row.description_en   || '',
    featured:          row.featured         || false,
    lat:               row.lat              || 0,
    lng:               row.lng              || 0,
    amenities:         Array.isArray(row.amenities) ? row.amenities : [],
    roi:               row.roi              || {},
    confoturBenefits:  row.confotur_benefits || '',
    techSpecs:         row.tech_specs       || {},
    conciergeServices: Array.isArray(row.concierge_services) ? row.concierge_services : []
  };
}


/* No modules here. The pages load this with a plain script tag, so everything
   above is global. */
