/*
 * Supabase client.
 *
 * One client, created once. Reads retry twice on failure; writes queue in
 * localStorage when the network is down and flush on the next successful
 * connection, so an enquiry is never silently lost.
 *
 * The anon key is public by design — every row is protected by row level
 * security on the server. Nothing here is a substitute for those policies.
 */

/* Credentials come from config.js. Left unset there, the client stays dormant:
   the catalogue falls back to data.js and enquiries are queued in the browser. */
var SUPABASE_URL      = (window.RL && window.RL.get('integrations.supabase.url')) || '';
var SUPABASE_ANON_KEY = (window.RL && window.RL.get('integrations.supabase.anonKey')) || '';

/* Module state. One client for the page; leads that cannot be written wait in
   _retryQueue and are flushed on the next successful connection. */
var _sb             = null;
var _supabaseReady  = false;
var _supabaseError  = null;
var _retryQueue     = [];   // enquiries awaiting a working connection
var _initAttempts   = 0;
var _maxInitRetries = 3;

/* Initialisation, retried a few times in case the SDK is still loading. */

function _initSupabase() {
  'use strict';
  _initAttempts++;


  /* Is the SDK present? */
  var sdk = window.supabase;
  if (!sdk) {
    _supabaseError = new Error(
      'SDK Supabase non chargé (window.supabase undefined).\n' +
      'Vérifie que <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> ' +
      'est AVANT supabase-client.js et n\'a PAS l\'attribut "defer".'
    );
    console.warn('[Real Luxe] ' + _supabaseError.message);

    // It may still be loading; try again shortly
    if (_initAttempts < _maxInitRetries) {
      setTimeout(_initSupabase, _initAttempts * 1000);
    }
    return;
  }

  /* Createclient existe ? */
  var createFn = sdk.createClient || (sdk.default && sdk.default.createClient);
  if (typeof createFn !== 'function') {
    _supabaseError = new Error(
      'SDK chargé mais createClient() introuvable.\n' +
      'Contenu de window.supabase : ' + Object.keys(sdk).join(', ')
    );
    console.warn('[Real Luxe] ' + _supabaseError.message);
    return;
  }

  /* Validation url + key */
  if (!SUPABASE_URL || !SUPABASE_URL.startsWith('https://')) {
    _supabaseError = new Error('SUPABASE_URL invalide : "' + SUPABASE_URL + '"');
    console.warn('[Real Luxe] ' + _supabaseError.message);
    return;
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 30) {
    _supabaseError = new Error('SUPABASE_ANON_KEY invalide (trop courte).');
    console.warn('[Real Luxe] ' + _supabaseError.message);
    return;
  }

  /* Create the single client */
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

    // Send anything that queued while the connection was down
    _flushRetryQueue();

  } catch (err) {
    _supabaseError = new Error('createClient() crash : ' + err.message);
    console.warn('[Real Luxe] ' + _supabaseError.message);
  }
}

/* Only attempt a connection when credentials exist. */
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  _initSupabase();
} else {
  _supabaseError = new Error('No Supabase project configured in config.js.');
}


/* HELPERS — Properties */

/* The live client, or null when none is configured or the connection failed.
   Callers are expected to have a fallback for null. */
function getSupabaseClient() {
  return (_supabaseReady && _sb) ? _sb : null;
}

/**
 * fetchPublishedProperties(options)
 * Fetches published properties, retrying twice on failure.
 */
async function fetchPublishedProperties(options) {
  options = options || {};
  var location  = options.location  || null;
  var orderBy   = options.orderBy   || 'price';
  var ascending = options.ascending !== undefined ? options.ascending : true;
  var retries   = options._retries  || 0;

  /* Is the client ready? */
  if (!_supabaseReady || !_sb) {
    var reason = _supabaseError ? _supabaseError.message : 'Client non initialisé.';
    throw new Error('[Connexion] ' + reason);
  }


  /* Build the query */
  var query = _sb
    .from('properties')
    .select('*')
    .eq('status', 'published');

  if (location && location !== 'all') {
    query = query.eq('location', location);
  }

  query = query.order(orderBy, { ascending: ascending });

  /* Run it, retrying on failure */
  var result = await query;
  var data  = result.data;
  var error = result.error;

  if (error) {
    console.warn('[Real Luxe] Property fetch failed: ' + error.message);

    // Retry automatique (max 2 retries)
    if (retries < 2) {
      var delay = (retries + 1) * 1500;
      await new Promise(function(r) { setTimeout(r, delay); });
      options._retries = retries + 1;
      return fetchPublishedProperties(options);
    }

    throw new Error('[Requête] ' + error.message + (error.hint ? ' (Hint: ' + error.hint + ')' : ''));
  }

  return data || [];
}


/* HELPERS — Leads (avec Lead Guard) */

/**
 * generateCommissionId()
 * A reference of the form RL-YYYYMMDD-XXXXXXXX, generated client side so an
 * enquiry can be traced even when it is only stored locally.
 */
function generateCommissionId() {
  var now = new Date();
  var date = now.getFullYear().toString() +
    ('0' + (now.getMonth() + 1)).slice(-2) +
    ('0' + now.getDate()).slice(-2);
  var uid = Math.random().toString(36).substring(2, 10).toUpperCase();
  return 'RL-' + date + '-' + uid;
}

/**
 * insertLead(leadData, callback)
 * Records an enquiry:
 *   - with a generated reference
 *   - Retry automatique (3 tentatives)
 *   - falling back to localStorage if every attempt fails
 *   - Callback(error, result) pour le Lead Guard
 *
 * Le bouton WhatsApp ne s'active qu'au callback(null, result).
 */
async function insertLead(leadData, callback) {
  callback = callback || function() {};

  /* Generate the reference */
  var commissionId = generateCommissionId();
  leadData.commission_id = commissionId;


  /* Client not ready: queue for later */
  if (!_supabaseReady || !_sb) {
    console.warn('[Real Luxe] Supabase unavailable — enquiry queued locally.');
    _retryQueue.push({ data: leadData, callback: callback });

    // Keep it locally regardless
    _storeLeadLocally(leadData);
    callback(new Error('Supabase pas prêt — lead sauvegardé localement'), { commission_id: commissionId, saved_locally: true });
    return;
  }

  /* Construire le payload pour supabase */
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

  /* Insert, retrying on failure */
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
        /* Written */
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

  /* Every attempt failed: fall back to local storage */
  console.error('[Real Luxe] Enquiry could not be written after ' + maxRetries + ' attempts.');
  _storeLeadLocally(leadData);
  callback(lastError || new Error('Insert failed'), { commission_id: commissionId, saved_locally: true });
}


/**
 * insertLeadFromTunnel(tunnelData, callback)
 * Enquiry from the three-step form on the home page.
 */
async function insertLeadFromTunnel(tunnelData, callback) {
  var leadData = {
    nom:               (tunnelData.firstName || '') + ' ' + (tunnelData.lastName || ''),
    email:             tunnelData.email || '',
    tel:               tunnelData.phone || '',
    villa_interet:     'general-inquiry',
    property_name:     'Consultation Privée',
    property_location: '',
    horizon:           tunnelData.horizon || '',
    budget:            tunnelData.budget || '',
    confotur_interest: tunnelData.confoturInterest || false,
    source:            'tunnel',
    language:          tunnelData.language || 'en'
  };

  await insertLead(leadData, callback);
}


/**
 * insertLeadFromVault(vaultData, callback)
 * Enquiry from the off-market access form.
 */
async function insertLeadFromVault(vaultData, callback) {
  var leadData = {
    nom:               vaultData.name || '',
    email:             vaultData.email || '',
    tel:               vaultData.phone || '',
    message:           vaultData.message || '',
    villa_interet:     'vault-access',
    property_name:     'Collection Off-Market',
    budget:            vaultData.budget || '',
    source:            'vault',
    language:          vaultData.language || 'en'
  };

  await insertLead(leadData, callback);
}


/* UTILITAIRES INTERNES */

/**
 * _storeLeadLocally(data)
 * Keeps an enquiry in localStorage when the network is down.
 */
function _storeLeadLocally(data) {
  try {
    var stored = JSON.parse(localStorage.getItem('rl-leads-pending') || '[]');
    data._savedAt = new Date().toISOString();
    stored.push(data);
    localStorage.setItem('rl-leads-pending', JSON.stringify(stored));
    console.info('[Real Luxe] Enquiry stored locally (' + stored.length + ' pending).');
  } catch (e) {
    console.error('[Real Luxe] Local storage unavailable: ' + e.message);
  }
}

/**
 * _flushRetryQueue()
 * Renvoie les leads en file d'attente quand Supabase revient.
 */
async function _flushRetryQueue() {
  if (_retryQueue.length === 0) return;


  var queue = _retryQueue.slice();
  _retryQueue = [];

  for (var i = 0; i < queue.length; i++) {
    await insertLead(queue[i].data, queue[i].callback);
  }
}

/**
 * syncPendingLeads()
 * Sends anything held in localStorage. Called once the client connects.
 */
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

    localStorage.setItem('rl-leads-pending', JSON.stringify(remaining));
    if (remaining.length === 0) {
      console.info('[Real Luxe] Pending enquiries synchronised.');
    } else {
      console.warn('[Real Luxe] ' + remaining.length + ' enquiry(ies) still pending.');
    }
  } catch (e) { /* silent */ }
}

// Auto-sync au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(syncPendingLeads, 3000);
  });
} else {
  setTimeout(syncPendingLeads, 3000);
}


/* FORMATAGE & NORMALISATION */

/**
 * formatPrice(value) → "$4,200,000"
 */
function formatPrice(value) {
  if (typeof value === 'string' && value.startsWith('$')) return value;
  var num = typeof value === 'number' ? value : parseInt(value, 10);
  if (isNaN(num)) return '$0';
  return '$' + num.toLocaleString('en-US');
}

/**
 * normalizeProperty(row)
 * Transforme une ligne Supabase en objet compatible avec le renderer.
 */
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
    sqft:              row.sqft             || Math.round((row.sqm || 0) * 10.7639),
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


/* Everything is global: the pages load this as a plain script, not a module. */
// Exposed:
//   - fetchPublishedProperties(options)   → Promise<Array>
//   - insertLead(data, callback)          → Promise<void>
//   - insertLeadFromTunnel(data, cb)      → Promise<void>
//   - insertLeadFromVault(data, cb)       → Promise<void>
//   - generateCommissionId()              → string
//   - formatPrice(value)                  → string
//   - normalizeProperty(row)              → object
//   - syncPendingLeads()                  → Promise<void>
//
// Variables globales :
//   - _supabaseReady  (boolean)
//   - _supabaseError  (Error|null)
//   - SUPABASE_URL    (string)
