/* ═══════════════════════════════════════════════════════════════
 * REAL LUXE — Supabase Client Module
 * ═══════════════════════════════════════════════════════════════
 *
 * Responsabilités :
 *   1. Initialiser le client Supabase (URL + anon key)
 *   2. Exposer des helpers réutilisables pour chaque table
 *   3. Filtrer côté client en complément du RLS côté serveur
 *
 * Sécurité :
 *   - La clé anon est publique par design (Row Level Security
 *     côté Supabase protège les données sensibles).
 *   - Toutes les requêtes filtrent `status = 'published'`.
 *
 * ═══════════════════════════════════════════════════════════════ */

/* ─── CONFIGURATION ─── */
var SUPABASE_URL      = 'https://bfwygmxebrlspimhobpa.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_E6Nd4RBpNblUEpWZvvcUhw_AycOMKnB';

/* ─── VALIDATION & INITIALISATION ─── */
var _supabaseReady = false;
var _supabaseError = null;
var _sb = null;  // le client Supabase (on utilise _sb pour éviter conflit avec le SDK global)

(function initSupabase() {
  'use strict';

  console.log('[Real Luxe] ── Supabase Client Init ──');

  /* ── ÉTAPE 1 : Le SDK est-il chargé ? ── */
  var sdk = window.supabase;

  if (!sdk) {
    _supabaseError = new Error(
      'Le SDK Supabase n\'est pas chargé (window.supabase est undefined).\n' +
      'SOLUTION : Vérifie que la balise <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> ' +
      'est AVANT supabase-client.js dans catalogue.html et qu\'elle n\'a PAS l\'attribut "defer".'
    );
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
    return;
  }

  /* ── ÉTAPE 2 : createClient existe-t-il ? ── */
  var createFn = sdk.createClient || sdk.default?.createClient;

  if (typeof createFn !== 'function') {
    _supabaseError = new Error(
      'Le SDK Supabase est chargé mais createClient() est introuvable.\n' +
      'window.supabase contient : ' + Object.keys(sdk).join(', ') + '\n' +
      'SOLUTION : Assure-toi d\'utiliser la bonne URL CDN (UMD bundle).'
    );
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
    return;
  }

  /* ── ÉTAPE 3 : Les clés sont-elles configurées ? ── */
  if (!SUPABASE_URL || SUPABASE_URL === 'VOTRE_URL' || !SUPABASE_URL.startsWith('https://')) {
    _supabaseError = new Error(
      'SUPABASE_URL non configurée.\n' +
      'Valeur actuelle : "' + SUPABASE_URL + '"\n' +
      'SOLUTION : Ouvre supabase-client.js et mets ton URL Supabase (ex: https://abc123.supabase.co)'
    );
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
    return;
  }

  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'VOTRE_CLE' || SUPABASE_ANON_KEY.length < 10) {
    _supabaseError = new Error(
      'SUPABASE_ANON_KEY non configurée.\n' +
      'SOLUTION : Ouvre supabase-client.js et mets ta clé anon Supabase.'
    );
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
    return;
  }

  /* ── ÉTAPE 4 : Créer le client ── */
  try {
    _sb = createFn(SUPABASE_URL, SUPABASE_ANON_KEY);
    _supabaseReady = true;
    console.log('[Real Luxe] ✓ Supabase client initialisé avec succès');
    console.log('[Real Luxe]   → URL   : ' + SUPABASE_URL);
    console.log('[Real Luxe]   → Key   : ' + SUPABASE_ANON_KEY.substring(0, 20) + '...');
  } catch (err) {
    _supabaseError = new Error(
      'createClient() a planté : ' + err.message + '\n' +
      'SOLUTION : Vérifie que l\'URL et la clé sont correctes.'
    );
    console.error('[Real Luxe] ✗ ' + _supabaseError.message);
  }
})();


/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * fetchPublishedProperties()
 * ──────────────────────────
 * Récupère toutes les propriétés publiées depuis la table `properties`.
 *
 * IMPORTANT : Cette fonction THROW en cas d'erreur (ne retourne
 * plus [] silencieusement). L'appelant DOIT gérer le catch.
 *
 * @param  {Object}  options
 * @param  {string}  [options.location]  — Filtre par localisation
 * @param  {string}  [options.orderBy]   — Colonne de tri (défaut: 'price')
 * @param  {boolean} [options.ascending] — Sens du tri (défaut: true)
 * @returns {Promise<Array>} — Tableau de propriétés
 * @throws {Error} — Si le client n'est pas prêt ou si la requête échoue
 */
async function fetchPublishedProperties(options) {
  options = options || {};
  var location  = options.location  || null;
  var orderBy   = options.orderBy   || 'price';
  var ascending = options.ascending !== undefined ? options.ascending : true;

  /* ── Garde : le client est-il prêt ? ── */
  if (!_supabaseReady || !_sb) {
    var reason = _supabaseError
      ? _supabaseError.message
      : 'Supabase client non initialisé (raison inconnue).';
    throw new Error('[Connexion] ' + reason);
  }

  console.log('[Real Luxe] Fetching properties from Supabase...');

  /* ── Construction de la requête ── */
  var query = _sb
    .from('properties')
    .select('*')
    .eq('status', 'published');

  if (location && location !== 'all') {
    query = query.eq('location', location);
  }

  query = query.order(orderBy, { ascending: ascending });

  /* ── Exécution ── */
  var result = await query;
  var data  = result.data;
  var error = result.error;

  if (error) {
    var details = [
      'Code: ' + (error.code || 'N/A'),
      'Message: ' + (error.message || 'inconnu'),
      'Hint: ' + (error.hint || 'aucun'),
      'Details: ' + (error.details || 'aucun')
    ].join(' | ');

    console.error('[Real Luxe] ✗ Requête Supabase échouée → ' + details);
    throw new Error('[Requête] ' + error.message + (error.hint ? ' (Hint: ' + error.hint + ')' : ''));
  }

  console.log('[Real Luxe] ✓ ' + (data ? data.length : 0) + ' propriétés reçues');
  return data || [];
}


/**
 * formatPrice(value)
 * ──────────────────
 * Convertit un nombre (ex: 4200000) en string formaté (ex: "$4,200,000").
 */
function formatPrice(value) {
  if (typeof value === 'string' && value.startsWith('$')) return value;
  var num = typeof value === 'number' ? value : parseInt(value, 10);
  if (isNaN(num)) return '$0';
  return '$' + num.toLocaleString('en-US');
}

/**
 * normalizeProperty(row)
 * ──────────────────────
 * Transforme une ligne Supabase en objet compatible avec le
 * renderer de cartes existant (renderCards).
 */
function normalizeProperty(row) {
  return {
    slug:        row.slug        || '',
    name:        row.name        || '',
    location:    row.location    || '',
    price:       formatPrice(row.price),
    tag:         row.tag         || '',
    beds:        row.beds        || 0,
    baths:       row.baths       || 0,
    sqm:         row.sqm         || 0,
    lot:         row.lot         || 0,
    img:         row.img         || '',
    gallery:     Array.isArray(row.gallery) ? row.gallery : [],
    description: row.description || '',
    featured:    row.featured    || false,
    amenities:         row.amenities          || [],
    roi:               row.roi                || {},
    confoturBenefits:  row.confotur_benefits  || '',
    techSpecs:         row.tech_specs         || {},
    conciergeServices: row.concierge_services || []
  };
}
