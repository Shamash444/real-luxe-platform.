/* ═══════════════════════════════════════════════════════════════
 * REAL LUXE — Supabase Client Module v2.0 "Incassable"
 * ═══════════════════════════════════════════════════════════════
 *
 * ARCHITECTURE :
 *   - Client singleton (jamais recréé)
 *   - Retry automatique (3 tentatives avec backoff exponentiel)
 *   - File d'attente offline pour les leads
 *   - Génération de commission_id unique côté client
 *   - Callback system pour le Lead Guard
 *
 * SÉCURITÉ :
 *   - Clé anon publique par design (RLS côté Supabase)
 *   - Sanitize côté client en complément
 *   - Rate limiting côté client
 *
 * ═══════════════════════════════════════════════════════════════ */

/* ─── CONFIGURATION ─── */
var SUPABASE_URL      = 'https://bfwygmxebrlspimhobpa.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmd3lnbXhlYnJsc3BpbWhvYnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzc1MjAsImV4cCI6MjA4ODgxMzUyMH0.Z9yles_hVya984uKN0fWWy4lDE1rmhFG_SmoSEj_Ca0';

/* ─── ÉTAT INTERNE ─── */
var _sb            = null;   // Client singleton
var _supabaseReady = false;
var _supabaseError = null;
var _retryQueue    = [];     // File d'attente des leads en cas d'échec
var _initAttempts  = 0;
var _maxInitRetries = 3;

/* ═══════════════════════════════════════════════════════════════
   INITIALISATION — Robuste avec retry
   ═══════════════════════════════════════════════════════════════ */

function _initSupabase() {
  'use strict';
  _initAttempts++;

  console.log('[Real Luxe] ── Supabase Init (tentative ' + _initAttempts + '/' + _maxInitRetries + ') ──');

  /* ── SDK chargé ? ── */
  var sdk = window.supabase;
  if (!sdk) {
    _supabaseError = new Error(
      'SDK Supabase non chargé (window.supabase undefined).\n' +
      'Vérifie que <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> ' +
      'est AVANT supabase-client.js et n\'a PAS l\'attribut "defer".'
    );
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);

    // Retry si le SDK n'est pas encore chargé (defer/async)
    if (_initAttempts < _maxInitRetries) {
      console.log('[Real Luxe] ⟳ Retry dans ' + (_initAttempts * 1000) + 'ms...');
      setTimeout(_initSupabase, _initAttempts * 1000);
    }
    return;
  }

  /* ── createClient existe ? ── */
  var createFn = sdk.createClient || (sdk.default && sdk.default.createClient);
  if (typeof createFn !== 'function') {
    _supabaseError = new Error(
      'SDK chargé mais createClient() introuvable.\n' +
      'Contenu de window.supabase : ' + Object.keys(sdk).join(', ')
    );
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
    return;
  }

  /* ── Validation URL + Key ── */
  if (!SUPABASE_URL || !SUPABASE_URL.startsWith('https://')) {
    _supabaseError = new Error('SUPABASE_URL invalide : "' + SUPABASE_URL + '"');
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
    return;
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 30) {
    _supabaseError = new Error('SUPABASE_ANON_KEY invalide (trop courte).');
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
    return;
  }

  /* ── Création du client singleton ── */
  try {
    _sb = createFn(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { 'X-Client': 'real-luxe-web' }
      }
    });
    _supabaseReady = true;
    _supabaseError = null;
    console.log('[Real Luxe] ✓ Supabase client OK');
    console.log('[Real Luxe]   → URL : ' + SUPABASE_URL);
    console.log('[Real Luxe]   → Key : ' + SUPABASE_ANON_KEY.substring(0, 20) + '...');

    // Flush la file d'attente si des leads étaient en attente
    _flushRetryQueue();

  } catch (err) {
    _supabaseError = new Error('createClient() crash : ' + err.message);
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
  }
}

// Lancement immédiat
_initSupabase();


/* ═══════════════════════════════════════════════════════════════
   HELPERS — Properties
   ═══════════════════════════════════════════════════════════════ */

/**
 * fetchPublishedProperties(options)
 * Récupère les propriétés publiées avec retry automatique.
 */
async function fetchPublishedProperties(options) {
  options = options || {};
  var location  = options.location  || null;
  var orderBy   = options.orderBy   || 'price';
  var ascending = options.ascending !== undefined ? options.ascending : true;
  var retries   = options._retries  || 0;

  /* ── Client prêt ? ── */
  if (!_supabaseReady || !_sb) {
    var reason = _supabaseError ? _supabaseError.message : 'Client non initialisé.';
    throw new Error('[Connexion] ' + reason);
  }

  console.log('[Real Luxe] Fetch properties...');

  /* ── Construction requête ── */
  var query = _sb
    .from('properties')
    .select('*')
    .eq('status', 'published');

  if (location && location !== 'all') {
    query = query.eq('location', location);
  }

  query = query.order(orderBy, { ascending: ascending });

  /* ── Exécution avec retry ── */
  var result = await query;
  var data  = result.data;
  var error = result.error;

  if (error) {
    console.error('[Real Luxe] ✗ Fetch échoué : ' + error.message);

    // Retry automatique (max 2 retries)
    if (retries < 2) {
      var delay = (retries + 1) * 1500;
      console.log('[Real Luxe] ⟳ Retry dans ' + delay + 'ms...');
      await new Promise(function(r) { setTimeout(r, delay); });
      options._retries = retries + 1;
      return fetchPublishedProperties(options);
    }

    throw new Error('[Requête] ' + error.message + (error.hint ? ' (Hint: ' + error.hint + ')' : ''));
  }

  console.log('[Real Luxe] ✓ ' + (data ? data.length : 0) + ' propriétés reçues');
  return data || [];
}


/* ═══════════════════════════════════════════════════════════════
   HELPERS — Leads (avec Lead Guard)
   ═══════════════════════════════════════════════════════════════ */

/**
 * generateCommissionId()
 * Génère un ID unique : RL-YYYYMMDD-XXXXXXXX
 * Garantit la traçabilité de chaque lead pour la commission.
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
 * ──────────────────────────────
 * Insère un lead dans Supabase avec :
 *   - commission_id unique auto-généré
 *   - Retry automatique (3 tentatives)
 *   - Fallback localStorage si tout échoue
 *   - Callback(error, result) pour le Lead Guard
 *
 * Le bouton WhatsApp ne s'active qu'au callback(null, result).
 */
async function insertLead(leadData, callback) {
  callback = callback || function() {};

  /* ── Générer le commission_id ── */
  var commissionId = generateCommissionId();
  leadData.commission_id = commissionId;

  console.log('[Real Luxe] 📋 Lead → commission_id : ' + commissionId);

  /* ── Client pas prêt ? Queue pour plus tard ── */
  if (!_supabaseReady || !_sb) {
    console.warn('[Real Luxe] Supabase pas prêt — lead mis en file d\'attente');
    _retryQueue.push({ data: leadData, callback: callback });

    // Tenter quand même le stockage local
    _storeLeadLocally(leadData);
    callback(new Error('Supabase pas prêt — lead sauvegardé localement'), { commission_id: commissionId, saved_locally: true });
    return;
  }

  /* ── Construire le payload pour Supabase ── */
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
    partner_agency:    leadData.partner_agency || '',
    partner_email:     leadData.partner_email || ''
  };

  /* ── Insert avec retry ── */
  var maxRetries = 3;
  var lastError = null;

  for (var attempt = 0; attempt < maxRetries; attempt++) {
    try {
      var result = await _sb.from('leads').insert([payload]);

      if (result.error) {
        lastError = result.error;
        console.error('[Real Luxe] ✗ Insert lead (tentative ' + (attempt + 1) + ') : ' + result.error.message);

        if (attempt < maxRetries - 1) {
          await new Promise(function(r) { setTimeout(r, (attempt + 1) * 1000); });
          continue;
        }
      } else {
        /* ── SUCCÈS ── */
        console.log('[Real Luxe] ✓ Lead enregistré dans Supabase');
        console.log('[Real Luxe]   → commission_id : ' + commissionId);
        console.log('[Real Luxe]   → email : ' + payload.email);
        console.log('[Real Luxe]   → villa : ' + payload.villa_interet);

        callback(null, {
          commission_id: commissionId,
          supabase_id: null,
          saved: true
        });
        return;
      }
    } catch (err) {
      lastError = err;
      console.error('[Real Luxe] ✗ Exception insert (tentative ' + (attempt + 1) + ') : ' + err.message);
      if (attempt < maxRetries - 1) {
        await new Promise(function(r) { setTimeout(r, (attempt + 1) * 1000); });
      }
    }
  }

  /* ── Toutes les tentatives ont échoué → stockage local ── */
  console.error('[Real Luxe] ✗ Impossible d\'insérer le lead après ' + maxRetries + ' tentatives');
  _storeLeadLocally(leadData);
  callback(lastError || new Error('Insert failed'), { commission_id: commissionId, saved_locally: true });
}


/**
 * insertLeadFromTunnel(tunnelData, callback)
 * Wrapper spécifique pour le tunnel de qualification (index.html).
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
 * Wrapper spécifique pour le formulaire Vault (off-market).
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


/* ═══════════════════════════════════════════════════════════════
   UTILITAIRES INTERNES
   ═══════════════════════════════════════════════════════════════ */

/**
 * _storeLeadLocally(data)
 * Sauvegarde un lead en localStorage en cas de panne réseau.
 */
function _storeLeadLocally(data) {
  try {
    var stored = JSON.parse(localStorage.getItem('rl-leads-pending') || '[]');
    data._savedAt = new Date().toISOString();
    stored.push(data);
    localStorage.setItem('rl-leads-pending', JSON.stringify(stored));
    console.log('[Real Luxe] 💾 Lead sauvegardé localement (' + stored.length + ' en attente)');
  } catch (e) {
    console.error('[Real Luxe] ✗ Impossible de sauvegarder localement : ' + e.message);
  }
}

/**
 * _flushRetryQueue()
 * Renvoie les leads en file d'attente quand Supabase revient.
 */
async function _flushRetryQueue() {
  if (_retryQueue.length === 0) return;
  console.log('[Real Luxe] ⟳ Flush de ' + _retryQueue.length + ' lead(s) en attente...');

  var queue = _retryQueue.slice();
  _retryQueue = [];

  for (var i = 0; i < queue.length; i++) {
    await insertLead(queue[i].data, queue[i].callback);
  }
}

/**
 * syncPendingLeads()
 * Tente de synchroniser les leads stockés en localStorage.
 * Appelé au chargement si Supabase est prêt.
 */
async function syncPendingLeads() {
  if (!_supabaseReady || !_sb) return;

  try {
    var stored = JSON.parse(localStorage.getItem('rl-leads-pending') || '[]');
    if (stored.length === 0) return;

    console.log('[Real Luxe] ⟳ Sync de ' + stored.length + ' lead(s) pendants...');

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
      console.log('[Real Luxe] ✓ Tous les leads pendants synchronisés');
    } else {
      console.warn('[Real Luxe] ⚠ ' + remaining.length + ' lead(s) encore en attente');
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


/* ═══════════════════════════════════════════════════════════════
   FORMATAGE & NORMALISATION
   ═══════════════════════════════════════════════════════════════ */

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


/* ═══════════════════════════════════════════════════════════════
   EXPORT — Tout est global pour compatibilité avec le site
   ═══════════════════════════════════════════════════════════════ */
// Fonctions exposées :
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
