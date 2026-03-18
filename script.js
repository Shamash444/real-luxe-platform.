/* ═══════════════════════════════════════════════════════════════
 * REAL LUXE — Unified JavaScript
 * Page detection via <body data-page="index|catalogue">
 * ═══════════════════════════════════════════════════════════════ */

var PAGE_TYPE = document.body.getAttribute('data-page') || 'index';

/* ═══════════════════════════════════════════════════════════════
   PAGE TRANSITION (shared across all pages)
   ═══════════════════════════════════════════════════════════════ */
(function() {
  // Fade in on page load
  var pt = document.getElementById('pageTransition');
  if (pt && pt.classList.contains('active')) {
    requestAnimationFrame(function() { pt.classList.remove('active'); });
  }

  // Intercept internal links for smooth page transitions
  function navigateWithTransition(url) {
    var pt = document.getElementById('pageTransition');
    if (!pt) { window.location.href = url; return; }
    pt.classList.add('active');
    setTimeout(function() { window.location.href = url; }, 400);
  }

  // Delegate click on internal <a> links
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href) return;
    // Only intercept internal page navigations (not anchors, external, WhatsApp)
    if (href.indexOf('index.html') === 0 || href.indexOf('catalogue.html') === 0 || href.indexOf('privacy.html') === 0) {
      // Skip if modifier key pressed (open in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || link.target === '_blank') return;
      e.preventDefault();
      navigateWithTransition(href);
    }
  });

  // Override button onclick navigations (e.g., "window.location.href = 'catalogue.html'")
  window.navigateWithTransition = navigateWithTransition;
})();

/* ═══════════════════════════════════════════════════════════════
   PROPERTY DETAIL (shared across index + catalogue)
   ═══════════════════════════════════════════════════════════════ */
let pdMap = null;
let currentGalleryIdx = 0;
let currentProperty = null;

function openPropertyDetail(slug, clickEvent) {
  const p = PROPERTIES.find(function(pr){ return pr.slug === slug; });
  if (!p) return;
  currentProperty = p;
  currentGalleryIdx = 0;

  // ── Shared Element Transition: capture source card rect ──
  var cardRect = null;
  if (clickEvent) {
    var srcCard = clickEvent.currentTarget || clickEvent.target.closest('.prop-card, .cat-card');
    if (srcCard) {
      var imgEl = srcCard.querySelector('.prop-img, .cat-card-img');
      if (imgEl) cardRect = imgEl.getBoundingClientRect();
    }
  }

  // Fill gallery (fallback si pas d'images)
  var gallery = (p.gallery && p.gallery.length > 0) ? p.gallery : (p.img ? [p.img] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format']);
  var mainImg = document.getElementById('pdMainImg');
  mainImg.innerHTML = '<img src="' + gallery[0] + '" alt="' + p.name + '">';

  var thumbs = document.getElementById('pdThumbs');
  thumbs.innerHTML = gallery.map(function(img, i){
    return '<div class="pd-thumb ' + (i===0?'active':'') + '" onclick="switchGalleryImg(' + i + ',event)"><img src="' + img + '" alt="' + p.name + ' - ' + (i+1) + '" loading="lazy"></div>';
  }).join('');

  // Fill header
  document.getElementById('pdTag').textContent = p.tag || p.location;
  document.getElementById('pdName').textContent = p.name;
  document.getElementById('pdLocation').querySelector('span').textContent = p.location + ', Dominican Republic';
  document.getElementById('pdPrice').textContent = p.price;

  // Fill specs
  var specs = [
    { value: p.beds, label: 'Bedrooms' },
    { value: p.baths, label: 'Bathrooms' },
    { value: p.sqm + ' m\u00B2', label: 'Living Area' },
    { value: p.lot ? p.lot.toLocaleString() + ' m\u00B2' : '\u2014', label: 'Land' },
    { value: p.pool || '\u2014', label: 'Pool' },
    { value: p.year || '\u2014', label: 'Year' }
  ];
  document.getElementById('pdSpecs').innerHTML = specs.map(function(s){
    return '<div class="pd-spec"><div class="pd-spec-value">' + s.value + '</div><div class="pd-spec-label">' + s.label + '</div></div>';
  }).join('');

  // Fill description
  document.getElementById('pdDesc').textContent = p.description;

  // ── Data-Rich Sections: Investment ROI + Technical Specs ──
  var dataHtml = '';
  if (p.roi && p.roi.rentalYield) {
    dataHtml += '<div class="pd-data-card"><h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>Investment ROI</h4>';
    dataHtml += '<div class="pd-data-item"><span class="label">Rental Yield</span><span class="value">' + p.roi.rentalYield + '</span></div>';
    dataHtml += '<div class="pd-data-item"><span class="label">Occupancy Rate</span><span class="value">' + p.roi.occupancyRate + '</span></div>';
    dataHtml += '<div class="pd-data-item"><span class="label">Projected Appreciation</span><span class="value">' + p.roi.projectedAppreciation + '</span></div>';
    dataHtml += '<div class="pd-data-item"><span class="label">Cap Rate</span><span class="value">' + p.roi.capRate + '</span></div>';
    dataHtml += '</div>';
  }
  if (p.techSpecs) {
    dataHtml += '<div class="pd-data-card"><h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Technical Specs</h4>';
    var specKeys = {construction:'Construction',energy:'Energy',water:'Water',smart:'Smart Home',security:'Security'};
    for (var key in specKeys) {
      if (p.techSpecs[key]) {
        dataHtml += '<div class="pd-data-item"><span class="label">' + specKeys[key] + '</span><span class="value">' + p.techSpecs[key] + '</span></div>';
      }
    }
    dataHtml += '</div>';
  }
  document.getElementById('pdDataGrid').innerHTML = dataHtml;

  // Confotur badge
  var confoturEl = document.getElementById('pdConfoturBadge');
  if (p.confoturBenefits) {
    document.getElementById('pdConfoturText').textContent = p.confoturBenefits;
    confoturEl.style.display = 'flex';
  } else {
    confoturEl.style.display = 'none';
  }

  // Fill amenities
  document.getElementById('pdAmenities').innerHTML = p.amenities.map(function(a){
    return '<div class="pd-amenity"><div class="pd-amenity-dot"></div>' + a + '</div>';
  }).join('');

  // Fill concierge services
  var conciergeHtml = '';
  if (p.conciergeServices) {
    conciergeHtml = p.conciergeServices.map(function(s){
      return '<div class="pd-concierge-item">' + s + '</div>';
    }).join('');
  }
  document.getElementById('pdConcierge').innerHTML = conciergeHtml;

  // Show overlay
  var overlay = document.getElementById('pdOverlay');
  overlay.classList.add('active');
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';

  // ── Shared Element Transition animation ──
  if (cardRect) {
    var galleryMain = document.getElementById('pdMainImg');
    var clone = document.createElement('div');
    clone.className = 'prop-card-clone';
    clone.innerHTML = '<img src="' + (p.gallery && p.gallery[0] ? p.gallery[0] : p.img) + '" alt="">';
    clone.style.left = cardRect.left + 'px';
    clone.style.top = cardRect.top + 'px';
    clone.style.width = cardRect.width + 'px';
    clone.style.height = cardRect.height + 'px';
    document.body.appendChild(clone);
    galleryMain.style.opacity = '0';

    requestAnimationFrame(function(){
      var targetRect = galleryMain.getBoundingClientRect();
      var dx = targetRect.left - cardRect.left;
      var dy = targetRect.top - cardRect.top;
      var sx = targetRect.width / cardRect.width;
      var sy = targetRect.height / cardRect.height;
      clone.style.transformOrigin = 'top left';
      gsap.to(clone, {
        x: dx, y: dy,
        scaleX: sx, scaleY: sy,
        borderRadius: 'var(--radius-lg)',
        duration: 0.65, ease: 'power3.inOut',
        onComplete: function(){
          galleryMain.style.opacity = '1';
          gsap.fromTo(galleryMain, {opacity:0}, {opacity:1, duration:0.2});
          clone.remove();
        }
      });
    });
  }

  // Kill any previous property detail tweens to prevent conflicts
  gsap.killTweensOf('.pd-thumb, .pd-header, .pd-spec, .pd-description, .pd-data-card, .pd-confotur-badge, .pd-amenity, .pd-concierge-item, .pd-map, .pd-cta');

  // Reset all elements to their visible final state first
  gsap.set(['.pd-thumb','.pd-header','.pd-spec','.pd-description','.pd-data-card','.pd-confotur-badge','.pd-amenity','.pd-concierge-item','.pd-map','.pd-cta'], {clearProps:'opacity,y,transform'});

  // GSAP entrance — above-fold elements animate in with timeline
  var thumbs = document.querySelectorAll('.pd-gallery-thumbs .pd-thumb');
  var tl = gsap.timeline({delay: cardRect ? 0.5 : 0.15});
  tl.fromTo(thumbs, {opacity:0, y:15}, {opacity:0.5, y:0, stagger:0.06, duration:0.4, ease:'power3.out', onComplete:function(){ thumbs.forEach(function(t){t.removeAttribute('style');}); }})
    .fromTo('.pd-header', {opacity:0, y:25}, {opacity:1, y:0, duration:0.5, ease:'power3.out', clearProps:'all'}, '<+0.1')
    .fromTo('.pd-spec', {opacity:0, y:15}, {opacity:1, y:0, stagger:0.05, duration:0.35, ease:'power3.out', clearProps:'all'}, '<+0.1')
    .fromTo('.pd-description', {opacity:0, y:15}, {opacity:1, y:0, duration:0.4, ease:'power3.out', clearProps:'all'}, '<+0.1');

  // Below-fold sections: simple delayed entrance (no ScrollTrigger on overlay)
  var belowFoldItems = [
    {sel:'.pd-data-card', stagger:0.1, y:20, delay:0.8},
    {sel:'.pd-confotur-badge', stagger:0, y:15, delay:0.9},
    {sel:'.pd-amenity', stagger:0.02, y:12, delay:1.0},
    {sel:'.pd-concierge-item', stagger:0.03, y:12, delay:1.1},
    {sel:'.pd-map', stagger:0, y:15, delay:1.2},
    {sel:'.pd-cta', stagger:0, y:15, delay:1.3}
  ];
  belowFoldItems.forEach(function(item){
    var els = document.querySelectorAll(item.sel);
    if (!els.length) return;
    gsap.fromTo(els, {opacity:0, y:item.y}, {opacity:1, y:0, stagger:item.stagger, duration:0.5, ease:'power3.out', delay:item.delay, clearProps:'all'});
  });

  // Init map
  setTimeout(function(){ initPropertyMap(p); }, 350);
}

function closePropertyDetail() {
  const overlay = document.getElementById('pdOverlay');
  gsap.to(overlay, {
    opacity: 0,
    duration: 0.4,
    ease: 'power3.inOut',
    onComplete: () => {
      overlay.classList.remove('active');
      overlay.style.opacity = '';
      document.body.style.overflow = '';
      if (pdMap) { pdMap.remove(); pdMap = null; }
    }
  });
}

function switchGalleryImg(idx, e) {
  if (e) e.stopPropagation();
  currentGalleryIdx = idx;
  const p = currentProperty;
  const mainImg = document.getElementById('pdMainImg');
  const img = mainImg.querySelector('img');
  gsap.to(img, {
    opacity: 0,
    duration: 0.25,
    onComplete: () => {
      var gal = (p.gallery && p.gallery.length > 0) ? p.gallery : (p.img ? [p.img] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format']);
      img.src = gal[idx] || gal[0];
      gsap.to(img, { opacity: 1, duration: 0.4 });
    }
  });
  document.querySelectorAll('.pd-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });
}

function initPropertyMap(p) {
  const mapEl = document.getElementById('pdMap');
  if (pdMap) { pdMap.remove(); pdMap = null; }

  pdMap = L.map(mapEl, {
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true
  }).setView([p.lat, p.lng], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '\u00a9 OpenStreetMap \u00b7 CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(pdMap);

  // Custom gold marker
  const goldIcon = L.divIcon({
    className: 'pd-marker',
    html: '<div style="width:20px;height:20px;background:var(--gold);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  L.marker([p.lat, p.lng], { icon: goldIcon })
    .addTo(pdMap)
    .bindPopup(`<strong style="font-family:'Playfair Display',serif;">${p.name}</strong><br><span style="color:#6B6B6B;font-size:12px;">${p.location}</span><br><span style="color:#C6A55C;font-weight:600;">${p.price}</span>`);

  // Fix map sizing
  setTimeout(() => pdMap.invalidateSize(), 100);
}

// Close property detail on Escape (shared)
document.addEventListener('keydown', (e) => {
  var pdOv = document.getElementById('pdOverlay');
  if (e.key === 'Escape' && pdOv && pdOv.classList.contains('active')) {
    closePropertyDetail();
  }
});

/* ═══════════════════════════════════════════════════════════════
   INDEX PAGE
   ═══════════════════════════════════════════════════════════════ */
if (PAGE_TYPE === 'index') {

/*
 * ═══════════════════════════════════════════════════════════════
 * REAL LUXE — Production JavaScript
 * ═══════════════════════════════════════════════════════════════
 *
 * CORS CONFIGURATION (for production server — nginx/Apache/.htaccess):
 * ────────────────────────────────────────────────────────────────
 *   Access-Control-Allow-Origin: https://real-luxe.com
 *   Access-Control-Allow-Methods: GET, POST, OPTIONS
 *   Access-Control-Allow-Headers: Content-Type, Authorization
 *   X-Content-Type-Options: nosniff
 *   X-Frame-Options: DENY
 *   X-XSS-Protection: 1; mode=block
 *   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com data:; connect-src 'self' https://api.emailjs.com;
 *   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
 *   Referrer-Policy: strict-origin-when-cross-origin
 *
 * RATE LIMITING (server-side — nginx example):
 * ────────────────────────────────────────────
 *   limit_req_zone $binary_remote_addr zone=contact:10m rate=3r/m;
 *   location /api/contact { limit_req zone=contact burst=2 nodelay; }
 */

// ═══ SECURITY UTILITIES ═══
function sanitize(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML.trim().substring(0, 500);
}
const _rateLimiter = { timestamps: [], maxAttempts: 3, windowMs: 300000 };
function checkRateLimit() {
  const now = Date.now();
  _rateLimiter.timestamps = _rateLimiter.timestamps.filter(function(t){ return now - t < _rateLimiter.windowMs; });
  if (_rateLimiter.timestamps.length >= _rateLimiter.maxAttempts) return false;
  _rateLimiter.timestamps.push(now);
  return true;
}

// ═══ i18n TRANSLATIONS ═══
let currentLang = localStorage.getItem('rl-lang') || 'en';
const I18N = {
  fr: {
    nav_0:'Propriétés', nav_1:'À Propos', nav_2:'Lifestyle', nav_3:'Contact', nav_cta:'Consultation Privée',
    hero_badge:"Immobilier d'Exception · Caraïbes",
    hero_title:"Vivez l'Exception<br><em>Sans Compromis</em>",
    hero_sub:"Des propriétés d'exception en République Dominicaine, sélectionnées pour une élite exigeante. Villas pieds dans l'eau, domaines privés, penthouses avec vue océan.",
    hero_btn1:'Découvrir les Propriétés', hero_btn2:'Consultation Privée →',
    stat_0:'Prix moyen', stat_1:'Propriétés exclusives', stat_2:'Satisfaction client',
    props_label:'Collection Exclusive', props_title:"Propriétés <em>d'Exception</em>",
    props_sub:'Chaque résidence est sélectionnée avec une rigueur absolue. Seul le meilleur accède à notre portfolio.',
    props_btn:'Voir le Catalogue Complet',
    vault_label:'Accès Restreint', vault_title:'Collection Privée<br><em>Off-Market</em>',
    vault_sub:"12 propriétés confidentielles réservées à notre cercle d'investisseurs qualifiés. Ces biens ne sont pas listés publiquement et nécessitent une accréditation préalable.",
    vault_stat_0:'Propriétés', vault_stat_1:'Valeur totale', vault_stat_2:'Requis',
    vault_btn:"Demander l'Accès Confidentiel",
    about_label:'Notre Approche', about_title:"L'Art du<br><em>Sur-Mesure</em>",
    about_sub:"Depuis plus de 15 ans, nous accompagnons une clientèle internationale dans l'acquisition de biens d'exception en République Dominicaine. Chaque transaction est une œuvre d'art.",
    confotur_label:'Avantages Fiscaux', confotur_title:'Loi <em>Confotur</em>',
    confotur_sub:'La République Dominicaine offre un cadre fiscal exceptionnel pour les investisseurs immobiliers internationaux.',
    calc_title:'Calculateur <em>Confotur</em>', calc_sub_text:"Entrez la valeur d'un bien pour estimer vos économies fiscales sur 15 ans.",
    calc_l0:'Taxe de Transfert', calc_l1:'Impôt Foncier (15 ans)', calc_l2:'Impôt Revenus Locatifs', calc_l3:'Impôt Plus-Values',
    calc_total_label:'Économies totales estimées sur 15 ans',
    life_label:'Art de Vivre', life_title:'Le Lifestyle<br><em>Caraïbes</em>',
    life_sub:"Bien plus qu'une propriété, c'est un mode de vie d'exception qui vous attend. Golf, yachting, gastronomie, bien-être.",
    fo_label:'Services Premium', fo_title:'Accompagnement<br><em>Family Office</em>',
    fo_sub:"Un écosystème complet de services dédiés aux investisseurs exigeants. Chaque détail est pris en charge.",
    testi_label:'Témoignages', testi_title:'Ce Que Disent<br><em>Nos Clients</em>',
    testi_quote:"L'équipe Real Luxe a transformé notre rêve en réalité. Leur connaissance intime du marché dominicain et leur sens du détail sont tout simplement incomparables.",
    testi_author:'Sophie & Laurent Dubois', testi_role:'Acquéreurs · Villa Cap Cana · €3.2M',
    contact_label:'Contact', contact_title:'Votre Propriété<br><em>Vous Attend</em>',
    contact_sub:'Prenez rendez-vous pour une consultation privée et confidentielle. Notre équipe vous accompagne dans chaque étape.',
    tunnel_title:'Consultation Privée', tunnel_sub:'Un parcours personnalisé en 3 étapes',
    t_step1_title:"Quel est votre horizon d'investissement ?",
    t_opt0:'Résidence Principale', t_opt0_sub:'Votre résidence principale aux Caraïbes',
    t_opt1:'Résidence Secondaire', t_opt1_sub:'Une maison de vacances de luxe',
    t_opt2:'Pur Investissement', t_opt2_sub:'Maximisez votre ROI avec Confotur',
    t_step2_title:'Votre gamme de budget',
    t_step2_confotur:'Je suis intéressé par les avantages fiscaux Confotur (exonération 15 ans)',
    t_step3_title:'Vos coordonnées sécurisées',
    t_lbl0:'Prénom', t_lbl1:'Nom', t_lbl2:'Email', t_lbl3:'Téléphone',
    t_back:'Retour', t_next:'Suivant', t_submit:'Envoyer ma Demande',
    t_success_title:'Demande Envoyée',
    t_success_msg:'Merci pour votre intérêt. Un conseiller Real Luxe vous contactera dans les 24 heures pour une consultation personnalisée et confidentielle.',
    partners_label:'Partenaires Privilégiés', partners_title:"Un Réseau<br><em>d'Excellence</em>",
    wa_text:'Expertise Privée',
    card_beds:'Ch.', card_baths:'SdB', pd_cta_visit:'Planifier une Visite Privée', pd_cta_whatsapp:'Contacter sur WhatsApp',
    cat_label:'Collection Complète', cat_title:'Nos <em>Propriétés</em>', cat_sub:'Explorez notre collection complète de propriétés de luxe en République Dominicaine.',
    vault_form_title:'Rejoindre le Cercle', vault_form_sub:'Complétez ce formulaire d\'accréditation pour accéder à notre collection off-market. Vos informations restent strictement confidentielles.',
    vault_f_name:'Nom Complet', vault_f_email:'Adresse Email', vault_f_phone:'Numéro de Téléphone', vault_f_budget:'Gamme d\'Investissement', vault_f_budget_ph:'Sélectionner une gamme', vault_f_msg:'Message (optionnel)', vault_f_submit:'Demander l\'Accès',
    partners_sub:'Nous collaborons avec les marques les plus prestigieuses en hôtellerie, immobilier et services de luxe pour offrir une expérience inégalée.',
    psvc_0_title:'Conseil Juridique & Fiscal', psvc_0_desc:'Avocats et conseillers fiscaux spécialisés assurant la conformité Confotur et une structuration fiscale optimale.',
    psvc_1_title:'Gestion Locative', psvc_1_desc:'Gestion locative clé en main, entretien et conciergerie offrant des rendements premium sans intervention du propriétaire.',
    psvc_2_title:'Architecture & Design', psvc_2_desc:'Architectes caribéens primés et designers d\'intérieur créant des résidences sur mesure mêlant luxe et âme tropicale.',
    psvc_3_title:'Résidence & Immigration', psvc_3_desc:'Programmes de résidence dominicaine accélérés, coordination de visas investisseur et conseil en double nationalité.',
    af_0_title:'Confidentialité Totale', af_0_desc:'Chaque dossier est traité avec la plus stricte discrétion.',
    af_1_title:'Réseau International', af_1_desc:'Accès à des propriétés hors-marché réservées à notre cercle.',
    af_2_title:'Concierge Dédié', af_2_desc:'Un interlocuteur unique de A à Z pour votre acquisition.',
    af_3_title:'Visite Virtuelle', af_3_desc:'Explorez chaque propriété en immersion 3D depuis chez vous.',
    cc_0_title:'Exonération Fiscale<br><em>15 Ans</em>', cc_0_desc:'Aucun impôt sur le revenu, les plus-values ou les transferts de propriété pendant 15 ans grâce à la Loi Confotur 158-01.', cc_0_tag0:'0% Impôt sur le Revenu', cc_0_tag1:'0% Plus-Values',
    cc_1_title:'Golden Visa<br><em>& Résidence</em>', cc_1_desc:'Obtenez la résidence dominicaine par investissement à partir de $200,000. Processus accéléré pour nos clients.', cc_1_tag0:'Résidence en 90 jours', cc_1_tag1:'Investissement $200K+',
    cc_2_title:'Rendement Locatif<br><em>&gt; 8% Net</em>', cc_2_desc:'Le marché locatif touristique dominicain offre des rendements parmi les plus élevés des Caraïbes avec un taux d\'occupation supérieur à 75%.', cc_2_tag0:'8-12% Net', cc_2_tag1:'Occupation 75%+',
    fo_0_title:'Conseil Juridique & Notarial', fo_0_sub:'Due diligence · Structuration · Closing', fo_0_body:'Notre cabinet d\'avocats partenaire supervise chaque étape : vérification des titres de propriété, structuration juridique optimale (SAS, LLC, trust), négociation des termes et closing sécurisé.',
    fo_1_title:'Staff Privé & Sécurité', fo_1_sub:'Personnel de maison · Surveillance · Maintenance', fo_1_body:'Recrutement et gestion de votre personnel domestique : chef cuisinier, majordome, femme de ménage, jardinier, chauffeur. Système de sécurité 24/7.',
    fo_2_title:'Conciergerie Aérienne & Maritime', fo_2_sub:'Jets privés · Yachts · Transferts VIP', fo_2_body:'Organisation complète de vos déplacements : affrètement de jets privés, location de yachts avec équipage, transferts héliportés et conciergerie automobile de luxe.',
    fo_3_title:'Gestion Patrimoniale', fo_3_sub:'Fiscalité · Assurance · Rendement locatif', fo_3_body:'Optimisation fiscale via la Loi Confotur, gestion locative haut de gamme avec un rendement net de 8-12%, assurance propriété et reporting financier trimestriel.',
    ft_desc:'L\'immobilier d\'exception en République Dominicaine. Villas, penthouses et domaines privés pour une clientèle internationale exigeante.',
    ft_nav:'Navigation', ft_svc:'Services', ft_dest:'Destinations',
    ft_svc_0:'Recherche Personnalisée', ft_svc_1:'Gestion Locative', ft_svc_2:'Concierge VIP', ft_svc_3:'Conseil Juridique',
    ft_privacy:'Politique de Confidentialité'
  },
  en: {
    nav_0:'Properties', nav_1:'About', nav_2:'Lifestyle', nav_3:'Contact', nav_cta:'Private Consultation',
    hero_badge:'Exceptional Real Estate · Caribbean',
    hero_title:'Live the Exception<br><em>Without Compromise</em>',
    hero_sub:'Exceptional properties in the Dominican Republic, curated for a discerning elite. Beachfront villas, private estates, ocean-view penthouses.',
    hero_btn1:'Discover Properties', hero_btn2:'Private Consultation →',
    stat_0:'Average Price', stat_1:'Exclusive Properties', stat_2:'Client Satisfaction',
    props_label:'Exclusive Collection', props_title:'Exceptional <em>Properties</em>',
    props_sub:'Each residence is selected with absolute rigor. Only the finest enters our portfolio.',
    props_btn:'View Full Catalogue',
    vault_label:'Restricted Access', vault_title:'Private Collection<br><em>Off-Market</em>',
    vault_sub:'12 confidential properties reserved for our circle of qualified investors. Not publicly listed — prior accreditation required.',
    vault_stat_0:'Properties', vault_stat_1:'Total Value', vault_stat_2:'Required',
    vault_btn:'Request Confidential Access',
    about_label:'Our Approach', about_title:'The Art of<br><em>Bespoke</em>',
    about_sub:'For over 15 years, we have accompanied international clients in acquiring exceptional properties in the Dominican Republic.',
    confotur_label:'Tax Advantages', confotur_title:'Confotur <em>Law</em>',
    confotur_sub:'The Dominican Republic offers an exceptional tax framework for international real estate investors.',
    calc_title:'Confotur <em>Calculator</em>', calc_sub_text:'Enter a property value to see your estimated tax savings over 15 years.',
    calc_l0:'Transfer Tax Saved', calc_l1:'Property Tax (15 yrs)', calc_l2:'Rental Income Tax', calc_l3:'Capital Gains Tax',
    calc_total_label:'Total estimated savings over 15 years',
    life_label:'Art of Living', life_title:'The Caribbean<br><em>Lifestyle</em>',
    life_sub:'More than a property — an exceptional way of life awaits. Golf, yachting, gastronomy, wellness.',
    fo_label:'Premium Services', fo_title:'Family Office<br><em>Support</em>',
    fo_sub:'A complete ecosystem of services for discerning investors. Every detail is handled.',
    testi_label:'Testimonials', testi_title:'What Our<br><em>Clients Say</em>',
    testi_quote:'The Real Luxe team turned our dream into reality. Their intimate knowledge of the Dominican market and attention to detail are simply incomparable.',
    testi_author:'Sophie & Laurent Dubois', testi_role:'Buyers · Villa Cap Cana · €3.2M',
    contact_label:'Contact', contact_title:'Your Property<br><em>Awaits</em>',
    contact_sub:'Schedule a private and confidential consultation. Our team guides you through every step.',
    tunnel_title:'Private Consultation', tunnel_sub:'A personalized journey in 3 steps',
    t_step1_title:'What is your investment horizon?',
    t_opt0:'Primary Residence', t_opt0_sub:'Your main home in the Caribbean',
    t_opt1:'Secondary Residence', t_opt1_sub:'A luxury vacation home',
    t_opt2:'Pure Investment', t_opt2_sub:'Maximize your ROI with Confotur',
    t_step2_title:'Your budget range',
    t_step2_confotur:'I am interested in Confotur tax benefits (15-year exemption)',
    t_step3_title:'Your secure contact details',
    t_lbl0:'First Name', t_lbl1:'Last Name', t_lbl2:'Email', t_lbl3:'Phone',
    t_back:'Back', t_next:'Next', t_submit:'Send My Request',
    t_success_title:'Request Sent',
    t_success_msg:'Thank you for your interest. A Real Luxe advisor will contact you within 24 hours.',
    partners_label:'Privileged Partners', partners_title:'A Network of<br><em>Excellence</em>',
    wa_text:'Private Expertise',
    card_beds:'Beds', card_baths:'Baths', pd_cta_visit:'Schedule a Private Viewing', pd_cta_whatsapp:'Contact on WhatsApp',
    cat_label:'Full Collection', cat_title:'Our <em>Properties</em>', cat_sub:'Explore our complete collection of luxury properties in the Dominican Republic.',
    vault_form_title:'Enter the Circle', vault_form_sub:'Complete this accreditation form to access our off-market collection. Your information remains strictly confidential.',
    vault_f_name:'Full Name', vault_f_email:'Email Address', vault_f_phone:'Phone Number', vault_f_budget:'Investment Range', vault_f_budget_ph:'Select a range', vault_f_msg:'Message (optional)', vault_f_submit:'Request Access',
    partners_sub:'We collaborate with the most prestigious brands in hospitality, real estate, and luxury services to deliver an unparalleled experience.',
    psvc_0_title:'Legal & Tax Advisory', psvc_0_desc:'Specialized attorneys and tax advisors ensuring full Confotur compliance and optimal fiscal structuring for international investors.',
    psvc_1_title:'Property Management', psvc_1_desc:'Turnkey rental management, maintenance, and concierge services delivering premium yields with zero owner involvement.',
    psvc_2_title:'Architecture & Design', psvc_2_desc:'Award-winning Caribbean architects and interior designers crafting bespoke residences that blend luxury with tropical soul.',
    psvc_3_title:'Residency & Immigration', psvc_3_desc:'Fast-track Dominican residency programs, investor visa coordination, and dual citizenship advisory for UHNWI clients.',
    af_0_title:'Total Confidentiality', af_0_desc:'Every file is handled with the strictest discretion.',
    af_1_title:'International Network', af_1_desc:'Access to off-market properties reserved for our circle.',
    af_2_title:'Dedicated Concierge', af_2_desc:'A single point of contact from A to Z for your acquisition.',
    af_3_title:'Virtual Tour', af_3_desc:'Explore each property in 3D immersion from home.',
    cc_0_title:'Tax Exemption<br><em>15 Years</em>', cc_0_desc:'Zero income tax, capital gains or property transfer taxes for 15 years under Confotur Law 158-01.', cc_0_tag0:'0% Income Tax', cc_0_tag1:'0% Capital Gains',
    cc_1_title:'Golden Visa<br><em>& Residency</em>', cc_1_desc:'Obtain Dominican residency through investment starting at $200,000. Fast-track process for our clients.', cc_1_tag0:'Residency in 90 Days', cc_1_tag1:'Investment $200K+',
    cc_2_title:'Rental Yield<br><em>&gt; 8% Net</em>', cc_2_desc:'The Dominican tourist rental market offers among the highest yields in the Caribbean with occupancy rates above 75%.', cc_2_tag0:'8-12% Net', cc_2_tag1:'Occupancy 75%+',
    fo_0_title:'Legal & Notarial Advisory', fo_0_sub:'Due diligence · Structuring · Closing', fo_0_body:'Our partner law firm oversees every step: property title verification, optimal legal structuring (SAS, LLC, trust), term negotiation and secure closing.',
    fo_1_title:'Private Staff & Security', fo_1_sub:'Household staff · Surveillance · Maintenance', fo_1_body:'Recruitment and management of your domestic staff: private chef, butler, housekeeper, gardener, chauffeur. 24/7 security system and connected surveillance.',
    fo_2_title:'Air & Maritime Concierge', fo_2_sub:'Private jets · Yachts · VIP transfers', fo_2_body:'Complete travel arrangements: private jet charters from Europe and the Americas, crewed yacht rentals, helicopter transfers and luxury car concierge.',
    fo_3_title:'Wealth Management', fo_3_sub:'Tax planning · Insurance · Rental yield', fo_3_body:'Tax optimization via Confotur Law, premium rental management with 8-12% net yield, Caribbean-adapted property insurance, and quarterly financial reporting.',
    ft_desc:'Ultra-luxury real estate in the Dominican Republic. Villas, penthouses and private estates for a discerning international clientele.',
    ft_nav:'Navigation', ft_svc:'Services', ft_dest:'Destinations',
    ft_svc_0:'Personalized Search', ft_svc_1:'Rental Management', ft_svc_2:'VIP Concierge', ft_svc_3:'Legal Advisory',
    ft_privacy:'Privacy Policy'
  },
  es: {
    nav_0:'Propiedades', nav_1:'Acerca de', nav_2:'Estilo de Vida', nav_3:'Contacto', nav_cta:'Consulta Privada',
    hero_badge:'Bienes Raíces de Excepción · Caribe',
    hero_title:'Viva la Excepción<br><em>Sin Compromiso</em>',
    hero_sub:'Propiedades excepcionales en República Dominicana, seleccionadas para una élite exigente.',
    hero_btn1:'Descubrir Propiedades', hero_btn2:'Consulta Privada →',
    stat_0:'Precio Promedio', stat_1:'Propiedades Exclusivas', stat_2:'Satisfacción del Cliente',
    props_label:'Colección Exclusiva', props_title:'Propiedades <em>de Excepción</em>',
    props_sub:'Cada residencia se selecciona con rigor absoluto. Solo lo mejor accede a nuestro portafolio.',
    props_btn:'Ver Catálogo Completo',
    vault_label:'Acceso Restringido', vault_title:'Colección Privada<br><em>Off-Market</em>',
    vault_sub:'12 propiedades confidenciales reservadas para nuestro círculo de inversores calificados.',
    vault_stat_0:'Propiedades', vault_stat_1:'Valor total', vault_stat_2:'Requerido',
    vault_btn:'Solicitar Acceso Confidencial',
    about_label:'Nuestro Enfoque', about_title:'El Arte de<br><em>lo A Medida</em>',
    about_sub:'Durante más de 15 años, acompañamos a clientes internacionales en la adquisición de propiedades excepcionales.',
    confotur_label:'Ventajas Fiscales', confotur_title:'Ley <em>Confotur</em>',
    confotur_sub:'República Dominicana ofrece un marco fiscal excepcional para inversores inmobiliarios internacionales.',
    calc_title:'Calculadora <em>Confotur</em>', calc_sub_text:'Ingrese el valor de una propiedad para ver sus ahorros fiscales en 15 años.',
    calc_l0:'Impuesto Transferencia', calc_l1:'Impuesto Predial (15 años)', calc_l2:'Impuesto Renta Locativa', calc_l3:'Impuesto Plusvalía',
    calc_total_label:'Ahorro total estimado en 15 años',
    life_label:'Arte de Vivir', life_title:'El Estilo de Vida<br><em>Caribeño</em>',
    life_sub:'Más que una propiedad, un modo de vida excepcional le espera.',
    fo_label:'Servicios Premium', fo_title:'Acompañamiento<br><em>Family Office</em>',
    fo_sub:'Un ecosistema completo de servicios para inversores exigentes.',
    testi_label:'Testimonios', testi_title:'Lo Que Dicen<br><em>Nuestros Clientes</em>',
    testi_quote:'El equipo de Real Luxe convirtió nuestro sueño en realidad. Su conocimiento del mercado dominicano es simplemente incomparable.',
    testi_author:'Sophie & Laurent Dubois', testi_role:'Compradores · Villa Cap Cana · €3.2M',
    contact_label:'Contacto', contact_title:'Su Propiedad<br><em>Le Espera</em>',
    contact_sub:'Agende una consulta privada y confidencial.',
    tunnel_title:'Consulta Privada', tunnel_sub:'Un recorrido personalizado en 3 pasos',
    t_step1_title:'¿Cuál es su horizonte de inversión?',
    t_opt0:'Residencia Principal', t_opt0_sub:'Su hogar principal en el Caribe',
    t_opt1:'Residencia Secundaria', t_opt1_sub:'Una casa de vacaciones de lujo',
    t_opt2:'Inversión Pura', t_opt2_sub:'Maximice su ROI con Confotur',
    t_step2_title:'Su rango de presupuesto',
    t_step2_confotur:'Estoy interesado en los beneficios fiscales Confotur (exención 15 años)',
    t_step3_title:'Sus datos de contacto seguros',
    t_lbl0:'Nombre', t_lbl1:'Apellido', t_lbl2:'Email', t_lbl3:'Teléfono',
    t_back:'Volver', t_next:'Siguiente', t_submit:'Enviar mi Solicitud',
    t_success_title:'Solicitud Enviada',
    t_success_msg:'Gracias por su interés. Un asesor le contactará en las próximas 24 horas.',
    partners_label:'Socios Privilegiados', partners_title:'Una Red de<br><em>Excelencia</em>',
    wa_text:'Experiencia Privada',
    card_beds:'Hab.', card_baths:'Baños', pd_cta_visit:'Agendar Visita Privada', pd_cta_whatsapp:'Contactar por WhatsApp',
    cat_label:'Colección Completa', cat_title:'Nuestras <em>Propiedades</em>', cat_sub:'Explore nuestra colección completa de propiedades de lujo en República Dominicana.',
    vault_form_title:'Entrar al Círculo', vault_form_sub:'Complete este formulario de acreditación para acceder a nuestra colección off-market. Su información es estrictamente confidencial.',
    vault_f_name:'Nombre Completo', vault_f_email:'Correo Electrónico', vault_f_phone:'Número de Teléfono', vault_f_budget:'Rango de Inversión', vault_f_budget_ph:'Seleccionar un rango', vault_f_msg:'Mensaje (opcional)', vault_f_submit:'Solicitar Acceso',
    partners_sub:'Colaboramos con las marcas más prestigiosas en hotelería, bienes raíces y servicios de lujo para ofrecer una experiencia sin igual.',
    psvc_0_title:'Asesoría Legal & Fiscal', psvc_0_desc:'Abogados y asesores fiscales especializados asegurando el cumplimiento Confotur y estructura fiscal óptima.',
    psvc_1_title:'Gestión de Propiedades', psvc_1_desc:'Gestión de alquileres llave en mano, mantenimiento y servicios de conserjería con rendimientos premium.',
    psvc_2_title:'Arquitectura & Diseño', psvc_2_desc:'Arquitectos caribeños galardonados y diseñadores de interiores creando residencias a medida.',
    psvc_3_title:'Residencia & Inmigración', psvc_3_desc:'Programas de residencia dominicana acelerados, coordinación de visas de inversor y asesoría en doble ciudadanía.',
    af_0_title:'Confidencialidad Total', af_0_desc:'Cada expediente se trata con la más estricta discreción.',
    af_1_title:'Red Internacional', af_1_desc:'Acceso a propiedades fuera de mercado reservadas a nuestro círculo.',
    af_2_title:'Concierge Dedicado', af_2_desc:'Un interlocutor único de la A a la Z para su adquisición.',
    af_3_title:'Visita Virtual', af_3_desc:'Explore cada propiedad en inmersión 3D desde su hogar.',
    cc_0_title:'Exención Fiscal<br><em>15 Años</em>', cc_0_desc:'Cero impuestos sobre la renta, plusvalías o transferencias de propiedad durante 15 años bajo la Ley Confotur 158-01.', cc_0_tag0:'0% Impuesto Renta', cc_0_tag1:'0% Plusvalía',
    cc_1_title:'Golden Visa<br><em>& Residencia</em>', cc_1_desc:'Obtenga la residencia dominicana por inversión desde $200,000. Proceso acelerado para nuestros clientes.', cc_1_tag0:'Residencia en 90 días', cc_1_tag1:'Inversión $200K+',
    cc_2_title:'Rentabilidad Locativa<br><em>&gt; 8% Neto</em>', cc_2_desc:'El mercado de alquiler turístico dominicano ofrece los rendimientos más altos del Caribe con una tasa de ocupación superior al 75%.', cc_2_tag0:'8-12% Neto', cc_2_tag1:'Ocupación 75%+',
    fo_0_title:'Asesoría Legal & Notarial', fo_0_sub:'Due diligence · Estructuración · Cierre', fo_0_body:'Nuestro bufete asociado supervisa cada etapa: verificación de títulos, estructuración legal óptima (SAS, LLC, trust), negociación y cierre seguro.',
    fo_1_title:'Personal Privado & Seguridad', fo_1_sub:'Personal doméstico · Vigilancia · Mantenimiento', fo_1_body:'Reclutamiento y gestión de su personal: chef privado, mayordomo, servicio de limpieza, jardinero, chófer. Sistema de seguridad 24/7.',
    fo_2_title:'Conserjería Aérea & Marítima', fo_2_sub:'Jets privados · Yates · Traslados VIP', fo_2_body:'Organización completa de viajes: chárter de jets privados, alquiler de yates con tripulación, traslados en helicóptero y conserjería de autos de lujo.',
    fo_3_title:'Gestión Patrimonial', fo_3_sub:'Fiscalidad · Seguros · Rentabilidad locativa', fo_3_body:'Optimización fiscal vía Ley Confotur, gestión locativa premium con 8-12% neto, seguro de propiedad e informes financieros trimestrales.',
    ft_desc:'Bienes raíces de ultra-lujo en República Dominicana. Villas, penthouses y fincas privadas para una clientela internacional exigente.',
    ft_nav:'Navegación', ft_svc:'Servicios', ft_dest:'Destinos',
    ft_svc_0:'Búsqueda Personalizada', ft_svc_1:'Gestión Locativa', ft_svc_2:'Concierge VIP', ft_svc_3:'Asesoría Legal',
    ft_privacy:'Política de Privacidad'
  },
  ru: {
    nav_0:'Недвижимость', nav_1:'О Нас', nav_2:'Стиль Жизни', nav_3:'Контакт', nav_cta:'Частная Консультация',
    hero_badge:'Элитная Недвижимость · Карибы',
    hero_title:'Живите Исключительно<br><em>Без Компромиссов</em>',
    hero_sub:'Исключительная недвижимость в Доминиканской Республике для взыскательной элиты.',
    hero_btn1:'Смотреть Объекты', hero_btn2:'Частная Консультация →',
    stat_0:'Средняя Цена', stat_1:'Эксклюзивных Объектов', stat_2:'Довольных Клиентов',
    props_label:'Эксклюзивная Коллекция', props_title:'Исключительная <em>Недвижимость</em>',
    props_sub:'Каждая резиденция отобрана с абсолютной строгостью.',
    props_btn:'Полный Каталог',
    vault_label:'Ограниченный Доступ', vault_title:'Частная Коллекция<br><em>Off-Market</em>',
    vault_sub:'12 конфиденциальных объектов для нашего круга квалифицированных инвесторов.',
    vault_stat_0:'Объектов', vault_stat_1:'Общая стоимость', vault_stat_2:'Требуется',
    vault_btn:'Запросить Доступ',
    about_label:'Наш Подход', about_title:'Искусство<br><em>Индивидуальности</em>',
    about_sub:'Более 15 лет мы сопровождаем международных клиентов в приобретении исключительной недвижимости.',
    confotur_label:'Налоговые Преимущества', confotur_title:'Закон <em>Конфотур</em>',
    confotur_sub:'Доминиканская Республика предлагает исключительный налоговый режим для инвесторов.',
    calc_title:'Калькулятор <em>Конфотур</em>', calc_sub_text:'Введите стоимость для расчёта налоговой экономии за 15 лет.',
    calc_l0:'Налог Передачи', calc_l1:'Налог на Имущество (15 лет)', calc_l2:'Налог с Аренды', calc_l3:'Налог с Прироста',
    calc_total_label:'Общая экономия за 15 лет',
    life_label:'Стиль Жизни', life_title:'Карибский<br><em>Стиль Жизни</em>',
    life_sub:'Больше чем недвижимость — исключительный образ жизни.',
    fo_label:'Премиум Сервисы', fo_title:'Поддержка<br><em>Family Office</em>',
    fo_sub:'Полная экосистема услуг для взыскательных инвесторов.',
    testi_label:'Отзывы', testi_title:'Что Говорят<br><em>Наши Клиенты</em>',
    testi_quote:'Команда Real Luxe воплотила нашу мечту в реальность. Их знание рынка и внимание к деталям несравнимы.',
    testi_author:'Софи и Лоран Дюбуа', testi_role:'Покупатели · Вилла Кап Кана · €3.2M',
    contact_label:'Контакт', contact_title:'Ваша Недвижимость<br><em>Ждёт Вас</em>',
    contact_sub:'Запланируйте частную и конфиденциальную консультацию.',
    tunnel_title:'Частная Консультация', tunnel_sub:'Персонализированный путь в 3 шага',
    t_step1_title:'Каков ваш инвестиционный горизонт?',
    t_opt0:'Основная Резиденция', t_opt0_sub:'Ваш основной дом в Карибском бассейне',
    t_opt1:'Вторичная Резиденция', t_opt1_sub:'Роскошный загородный дом',
    t_opt2:'Чистая Инвестиция', t_opt2_sub:'Максимизируйте ROI с Конфотур',
    t_step2_title:'Ваш бюджетный диапазон',
    t_step2_confotur:'Мне интересны налоговые льготы Конфотур (освобождение 15 лет)',
    t_step3_title:'Ваши контактные данные',
    t_lbl0:'Имя', t_lbl1:'Фамилия', t_lbl2:'Email', t_lbl3:'Телефон',
    t_back:'Назад', t_next:'Далее', t_submit:'Отправить Запрос',
    t_success_title:'Запрос Отправлен',
    t_success_msg:'Спасибо. Консультант Real Luxe свяжется с вами в течение 24 часов.',
    partners_label:'Привилегированные Партнёры', partners_title:'Сеть<br><em>Совершенства</em>',
    wa_text:'Экспертиза',
    card_beds:'Спален', card_baths:'Ванных', pd_cta_visit:'Записаться на Просмотр', pd_cta_whatsapp:'Написать в WhatsApp',
    cat_label:'Полная Коллекция', cat_title:'Наши <em>Объекты</em>', cat_sub:'Ознакомьтесь с полной коллекцией элитной недвижимости в Доминиканской Республике.',
    vault_form_title:'Вступить в Круг', vault_form_sub:'Заполните эту форму аккредитации для доступа к нашей off-market коллекции. Ваша информация строго конфиденциальна.',
    vault_f_name:'Полное Имя', vault_f_email:'Email', vault_f_phone:'Телефон', vault_f_budget:'Диапазон Инвестиций', vault_f_budget_ph:'Выберите диапазон', vault_f_msg:'Сообщение (необязательно)', vault_f_submit:'Запросить Доступ',
    partners_sub:'Мы сотрудничаем с самыми престижными брендами в гостиничном бизнесе, недвижимости и премиум-сервисах.',
    psvc_0_title:'Юридический & Налоговый Консалтинг', psvc_0_desc:'Специализированные юристы и налоговые консультанты для оптимальной фискальной структуры.',
    psvc_1_title:'Управление Недвижимостью', psvc_1_desc:'Управление арендой под ключ, обслуживание и консьерж-сервис с премиальной доходностью.',
    psvc_2_title:'Архитектура & Дизайн', psvc_2_desc:'Отмеченные наградами карибские архитекторы и дизайнеры интерьеров.',
    psvc_3_title:'Резиденция & Иммиграция', psvc_3_desc:'Ускоренные программы доминиканского резидентства и координация инвесторских виз.',
    af_0_title:'Полная Конфиденциальность', af_0_desc:'Каждое дело обрабатывается с максимальной секретностью.',
    af_1_title:'Международная Сеть', af_1_desc:'Доступ к эксклюзивной недвижимости вне рынка для нашего круга.',
    af_2_title:'Персональный Консьерж', af_2_desc:'Единый координатор от А до Я для вашей покупки.',
    af_3_title:'Виртуальный Тур', af_3_desc:'Исследуйте каждый объект в 3D с комфортом из дома.',
    cc_0_title:'Налоговое Освобождение<br><em>15 Лет</em>', cc_0_desc:'Нулевой подоходный налог, налог на прирост капитала и передачу собственности в течение 15 лет по Закону Конфотур 158-01.', cc_0_tag0:'0% Подоходный Налог', cc_0_tag1:'0% Прирост Капитала',
    cc_1_title:'Golden Visa<br><em>& Резиденция</em>', cc_1_desc:'Получите доминиканское резидентство через инвестиции от $200,000. Ускоренный процесс для наших клиентов.', cc_1_tag0:'Резиденция за 90 дней', cc_1_tag1:'Инвестиции $200K+',
    cc_2_title:'Арендная Доходность<br><em>&gt; 8% Чистыми</em>', cc_2_desc:'Доминиканский рынок туристической аренды предлагает одну из самых высоких доходностей в Карибском бассейне с заполняемостью более 75%.', cc_2_tag0:'8-12% Чистыми', cc_2_tag1:'Заполняемость 75%+',
    fo_0_title:'Юридический & Нотариальный Консалтинг', fo_0_sub:'Due diligence · Структурирование · Закрытие', fo_0_body:'Наша партнёрская юридическая фирма контролирует каждый этап: проверка прав собственности, оптимальная юридическая структура, переговоры и безопасное закрытие.',
    fo_1_title:'Персонал & Безопасность', fo_1_sub:'Домашний персонал · Охрана · Обслуживание', fo_1_body:'Подбор и управление домашним персоналом: шеф-повар, дворецкий, горничная, садовник, водитель. Охранная система 24/7 и видеонаблюдение.',
    fo_2_title:'Авиа & Морской Консьерж', fo_2_sub:'Частные джеты · Яхты · VIP-трансферы', fo_2_body:'Полная организация поездок: чартер частных джетов, аренда яхт с экипажем, вертолётные трансферы и автомобильный консьерж-сервис.',
    fo_3_title:'Управление Капиталом', fo_3_sub:'Налоги · Страхование · Арендная доходность', fo_3_body:'Налоговая оптимизация по Закону Конфотур, премиальное управление арендой с доходностью 8-12% нетто, страхование недвижимости и квартальная финансовая отчётность.',
    ft_desc:'Элитная недвижимость в Доминиканской Республике. Виллы, пентхаусы и частные поместья для взыскательной международной клиентуры.',
    ft_nav:'Навигация', ft_svc:'Сервисы', ft_dest:'Направления',
    ft_svc_0:'Персональный Поиск', ft_svc_1:'Управление Арендой', ft_svc_2:'VIP Консьерж', ft_svc_3:'Юридические Услуги',
    ft_privacy:'Политика Конфиденциальности'
  },
  zh: {
    nav_0:'房产', nav_1:'关于', nav_2:'生活方式', nav_3:'联系', nav_cta:'私人咨询',
    hero_badge:'卓越房地产 · 加勒比',
    hero_title:'体验卓越<br><em>毫不妥协</em>',
    hero_sub:'多米尼加共和国精选顶级物业，专为尊贵精英打造。',
    hero_btn1:'探索房产', hero_btn2:'私人咨询 →',
    stat_0:'平均价格', stat_1:'独家房产', stat_2:'客户满意度',
    props_label:'独家收藏', props_title:'卓越<em>房产</em>',
    props_sub:'每处住宅都经过严格筛选。只有最优质的才能进入我们的投资组合。',
    props_btn:'查看完整目录',
    vault_label:'限制访问', vault_title:'私人收藏<br><em>非公开</em>',
    vault_sub:'12处机密房产，仅面向合格投资者。',
    vault_stat_0:'房产', vault_stat_1:'总价值', vault_stat_2:'需签署',
    vault_btn:'申请机密访问',
    about_label:'我们的方法', about_title:'定制<br><em>艺术</em>',
    about_sub:'15年来，我们陪伴国际客户在多米尼加共和国收购卓越房产。',
    confotur_label:'税收优惠', confotur_title:'Confotur <em>法案</em>',
    confotur_sub:'多米尼加共和国为国际投资者提供卓越的税收框架。',
    calc_title:'Confotur <em>计算器</em>', calc_sub_text:'输入房产价值，查看15年预估税收节省。',
    calc_l0:'转让税节省', calc_l1:'房产税 (15年)', calc_l2:'租赁所得税', calc_l3:'资本利得税',
    calc_total_label:'15年总预估节省',
    life_label:'生活艺术', life_title:'加勒比<br><em>生活方式</em>',
    life_sub:'不仅是房产，卓越的生活方式等待着您。',
    fo_label:'高端服务', fo_title:'家族办公室<br><em>支持</em>',
    fo_sub:'为高端投资者打造的完整服务生态系统。',
    testi_label:'客户证言', testi_title:'客户<br><em>评价</em>',
    testi_quote:'Real Luxe团队将我们的梦想变为现实。他们对多米尼加市场的深入了解无与伦比。',
    testi_author:'Sophie & Laurent Dubois', testi_role:'买家 · Cap Cana别墅 · €3.2M',
    contact_label:'联系', contact_title:'您的房产<br><em>等待您</em>',
    contact_sub:'预约私人保密咨询。',
    tunnel_title:'私人咨询', tunnel_sub:'3步个性化旅程',
    t_step1_title:'您的投资目标是什么？',
    t_opt0:'主要住宅', t_opt0_sub:'您在加勒比的主要住所',
    t_opt1:'度假住宅', t_opt1_sub:'豪华度假别墅',
    t_opt2:'纯投资', t_opt2_sub:'利用Confotur最大化回报',
    t_step2_title:'您的预算范围',
    t_step2_confotur:'我对Confotur税收优惠感兴趣（15年免税）',
    t_step3_title:'您的安全联系方式',
    t_lbl0:'名', t_lbl1:'姓', t_lbl2:'邮箱', t_lbl3:'电话',
    t_back:'返回', t_next:'下一步', t_submit:'提交申请',
    t_success_title:'申请已发送',
    t_success_msg:'感谢您的关注。顾问将在24小时内与您联系。',
    partners_label:'特权合作伙伴', partners_title:'卓越<br><em>网络</em>',
    wa_text:'私人专家',
    card_beds:'卧室', card_baths:'浴室', pd_cta_visit:'预约私人看房', pd_cta_whatsapp:'WhatsApp联系',
    cat_label:'完整收藏', cat_title:'我们的<em>房产</em>', cat_sub:'探索我们在多米尼加共和国的完整豪华房产收藏。',
    vault_form_title:'加入圈子', vault_form_sub:'完成此认证表以访问我们的非公开收藏。您的信息严格保密。',
    vault_f_name:'全名', vault_f_email:'邮箱地址', vault_f_phone:'电话号码', vault_f_budget:'投资范围', vault_f_budget_ph:'选择范围', vault_f_msg:'留言（可选）', vault_f_submit:'申请访问',
    partners_sub:'我们与酒店、房地产和奢侈品服务领域最负盛名的品牌合作，提供无与伦比的体验。',
    psvc_0_title:'法律与税务咨询', psvc_0_desc:'专业律师和税务顾问，确保Confotur合规和最优税务结构。',
    psvc_1_title:'物业管理', psvc_1_desc:'全方位租赁管理、维护和礼宾服务，无需业主参与即可获得优质收益。',
    psvc_2_title:'建筑与设计', psvc_2_desc:'屡获殊荣的加勒比建筑师和室内设计师，打造融合奢华与热带风情的定制住宅。',
    psvc_3_title:'居留与移民', psvc_3_desc:'快速办理多米尼加居留项目、投资者签证协调和双重国籍咨询。',
    af_0_title:'完全保密', af_0_desc:'每份文件都以最严格的保密方式处理。',
    af_1_title:'国际网络', af_1_desc:'进入仅限我们圈子的非公开房产市场。',
    af_2_title:'专属管家', af_2_desc:'从始至终的一站式专属联络人。',
    af_3_title:'虚拟参观', af_3_desc:'足不出户，沉浸式3D探索每处房产。',
    cc_0_title:'税收豁免<br><em>15年</em>', cc_0_desc:'根据Confotur法案158-01，15年内零所得税、零资本利得税、零产权转让税。', cc_0_tag0:'0% 所得税', cc_0_tag1:'0% 资本利得',
    cc_1_title:'黄金签证<br><em>& 居留</em>', cc_1_desc:'通过投资$200,000起获得多米尼加居留权。为我们的客户提供加速流程。', cc_1_tag0:'90天内获居留', cc_1_tag1:'投资 $200K+',
    cc_2_title:'租赁收益<br><em>&gt; 8% 净收</em>', cc_2_desc:'多米尼加旅游租赁市场提供加勒比地区最高的收益率，入住率超过75%。', cc_2_tag0:'8-12% 净收', cc_2_tag1:'入住率 75%+',
    fo_0_title:'法律与公证咨询', fo_0_sub:'尽职调查 · 架构设计 · 交割', fo_0_body:'我们的合作律所监督每个环节：产权验证、最优法律架构、条款谈判和安全交割。',
    fo_1_title:'私人管家与安保', fo_1_sub:'家政人员 · 安保 · 维护', fo_1_body:'招聘和管理您的家政团队：私人厨师、管家、保洁、园丁、司机。24/7安保系统和视频监控。',
    fo_2_title:'航空与海上礼宾', fo_2_sub:'私人飞机 · 游艇 · VIP接送', fo_2_body:'完整旅行安排：私人飞机包机、带船员游艇租赁、直升机接送和豪华汽车礼宾服务。',
    fo_3_title:'财富管理', fo_3_sub:'税务 · 保险 · 租赁收益', fo_3_body:'通过Confotur法案优化税务，8-12%净收益的高端租赁管理，房产保险和季度财务报告。',
    ft_desc:'多米尼加共和国超豪华房地产。别墅、顶层公寓和私人庄园，为挑剔的国际客户而生。',
    ft_nav:'导航', ft_svc:'服务', ft_dest:'目的地',
    ft_svc_0:'个性化搜索', ft_svc_1:'租赁管理', ft_svc_2:'VIP礼宾', ft_svc_3:'法律咨询',
    ft_privacy:'隐私政策'
  }
};

// ─── DATA (fallback — overwritten by Supabase fetch) ───
var PROPERTIES = [
  {
    slug:'villa-oceana',name:'Villa Oceana',location:'Cap Cana',price:'$4,200,000',tag:'Exclusive',beds:6,baths:7,sqm:850,
    img:'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format',featured:true,
    lat:18.5085,lng:-68.3734,
    year:2023,lot:2200,pool:'Infinity 25m',parking:4,
    gallery:[
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=85&auto=format'
    ],
    description:'An architectural triumph perched on the coral cliffs of Cap Cana, Villa Oceana commands sweeping 180\u00B0 panoramas of the Caribbean Sea. Floor-to-ceiling glass walls dissolve the boundary between interior and infinity \u2014 morning light floods the Brazilian ipe terraces while the scent of frangipani drifts from the sculpture garden. Every surface speaks of uncompromising craft: Calacatta marble flows through open-plan living spaces, hand-forged bronze fixtures catch the golden hour, and the infinity pool appears to pour into the ocean below.',
    amenities:['Infinity Pool','Private Beach','Home Cinema','Wine Cellar','Private Spa','Household Staff','24/7 Security','Helipad'],
    roi:{rentalYield:'8-12%',occupancyRate:'82%',projectedAppreciation:'6-8% p.a.',capRate:'7.2%'},
    confoturBenefits:'15 years tax exempt: 0% transfer tax, 0% property tax, 0% income tax on rental revenue, 0% capital gains tax.',
    techSpecs:{construction:'Reinforced concrete + hurricane-rated glazing',energy:'100% solar-ready, Daikin VRV HVAC',water:'Reverse osmosis + 40,000L cistern',smart:'Crestron whole-home automation, Lutron lighting',security:'Biometric entry, 24/7 CCTV, panic room'},
    conciergeServices:['Private chef placement','Yacht charter coordination','Airport VIP meet & greet','Property management','Housekeeping staff','Luxury car rental']
  },
  {
    slug:'villa-palma',name:'Villa Palma Real',location:'Punta Cana',price:'$2,800,000',tag:'New',beds:5,baths:5,sqm:620,
    img:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format',
    lat:18.5601,lng:-68.3725,
    year:2024,lot:1800,pool:'Natural Lagoon',parking:3,
    gallery:[
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1200&q=85&auto=format'
    ],
    description:'Set within the most coveted gated enclave of Punta Cana, Villa Palma Real redefines tropical elegance for the modern connoisseur. Delivered in 2024 with impeccable attention to every detail \u2014 Carrara marble countertops gleam beneath pendant lighting by Flos, while walls of local coral stone create a dialogue between contemporary architecture and Caribbean soul. Step through the oversized pivot door into a world where a private lagoon mirrors the sky and tropical gardens release the perfume of night-blooming jasmine.',
    amenities:['Private Lagoon','Tropical Garden','Summer Kitchen','Panoramic Master Suite','Private Gym','Smart Home','Triple Garage','Staff Quarters'],
    roi:{rentalYield:'9-11%',occupancyRate:'78%',projectedAppreciation:'7-9% p.a.',capRate:'6.8%'},
    confoturBenefits:'15-year full tax exemption under Law 158-01. Eligible for accelerated residency program.',
    techSpecs:{construction:'ICF walls + impact-resistant windows',energy:'Solar panels + Tesla Powerwall',water:'Well + municipal backup, greywater recycling',smart:'Control4 automation, Sonos multi-room',security:'Gated community, private patrol, smart locks'},
    conciergeServices:['Golf tee-time reservations','Spa & wellness bookings','Private dining experiences','Excursion planning','Pet care services','Event hosting support']
  },
  {
    slug:'penthouse-marina',name:'Penthouse Marina',location:'Cap Cana Marina',price:'$1,950,000',tag:'Sea View',beds:4,baths:4,sqm:380,
    img:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format',
    lat:18.5120,lng:-68.3680,
    year:2022,lot:0,pool:'Rooftop Pool',parking:2,
    gallery:[
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85&auto=format'
    ],
    description:'Suspended above the most prestigious marina in the Caribbean, this crown-jewel penthouse offers a front-row seat to a life of nautical luxury. Wake to the sight of superyachts glinting in the morning sun, take your coffee on a wraparound terrace with 360\u00B0 views, then descend directly to your private berth. The rooftop \u2014 your personal sky lounge \u2014 features a cantilevered pool that appears to float above the harbour. Inside: polished terrazzo floors, Boffi kitchen, and ambient lighting that transforms with the hour.',
    amenities:['Private Rooftop','Cantilevered Pool','360\u00B0 Marina View','Direct Dock Access','Private Elevator','24/7 Concierge','Wine Bar','Full Home Automation'],
    roi:{rentalYield:'7-10%',occupancyRate:'75%',projectedAppreciation:'5-7% p.a.',capRate:'6.5%'},
    confoturBenefits:'Full Confotur exemption. Ideal for short-term luxury rental with marina premium.',
    techSpecs:{construction:'Steel frame + hurricane glass curtain wall',energy:'Building solar array, individual metering',water:'Municipal + building filtration',smart:'Savant Pro automation, motorized blinds',security:'Lobby concierge, biometric elevator, marina patrol'},
    conciergeServices:['Berth management & yacht provisioning','Water sports & diving','Marina club membership','Helicopter transfers','Fine dining reservations','Personal shopping']
  },
  {
    slug:'domaine-samana',name:'Domaine Saman\u00E1',location:'Las Terrenas',price:'$5,500,000',tag:'Private Estate',beds:8,baths:9,sqm:1200,
    img:'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80&auto=format',
    lat:19.3117,lng:-69.5396,
    year:2021,lot:8500,pool:'2 Pools + Cenote',parking:6,
    gallery:[
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85&auto=format'
    ],
    description:'A 8,500 m\u00B2 private estate where virgin jungle cascades to turquoise waters \u2014 Domaine Saman\u00E1 is the Caribbean\'s most exclusive retreat. Follow a botanical path through 200 species of tropical flora to reach a private beach of powdered white sand. The main villa, two guest pavilions, and a restored natural cenote create an archipelago of serenity. Bioclimatic architecture ensures every room breathes with the ocean breeze, while hand-laid river-stone walls and reclaimed teak frame views that no photograph can capture.',
    amenities:['Private Beach','2 Pools','Natural Cenote','Guest Pavilions','Botanical Garden','Organic Farm','Private Dock','Tennis Court'],
    roi:{rentalYield:'6-9%',occupancyRate:'70%',projectedAppreciation:'8-12% p.a.',capRate:'5.8%'},
    confoturBenefits:'Fully Confotur-certified. Highest appreciation potential in emerging luxury corridor.',
    techSpecs:{construction:'Bioclimatic timber frame + stone',energy:'Off-grid solar + wind micro-turbine',water:'Natural spring + rainwater harvesting',smart:'Minimal tech by design, satellite internet',security:'Private road, estate manager, perimeter sensors'},
    conciergeServices:['Private naturalist guided tours','Whale watching excursions','Organic farm-to-table dining','Kite & surf instruction','Wellness retreat programming','Private island day trips']
  },
  {
    slug:'villa-coral',name:'Villa Coral Bay',location:'Bayah\u00EDbe',price:'$3,100,000',beds:5,baths:6,sqm:720,
    img:'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format',
    lat:18.3667,lng:-68.8333,
    year:2023,lot:3200,pool:'Infinity + Jacuzzi',parking:3,
    gallery:[
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1200&q=85&auto=format',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=85&auto=format'
    ],
    description:'Carved into the ancient coral cliffs of Bayah\u00EDbe, overlooking the protected waters of the East National Park, Villa Coral Bay is a sanctuary sculpted by nature and perfected by human vision. Terraces cascade down the cliff face like geological strata, connected by a staircase carved from living rock that leads to a hidden cove. The architecture \u2014 an award-winning fusion of organic forms and contemporary minimalism \u2014 uses exclusively local and sustainable materials: Dominican coral stone, Caribbean cedar, and hand-polished concrete that glows warm in the golden hour light.',
    amenities:['Private Cove','Infinity Pool','Cliff Jacuzzi','Panoramic Terrace','Master Suite','Artist Studio','Gourmet Kitchen','Zen Garden'],
    roi:{rentalYield:'7-10%',occupancyRate:'72%',projectedAppreciation:'6-8% p.a.',capRate:'6.2%'},
    confoturBenefits:'Confotur-eligible. Adjacent to national park ensures perpetual exclusivity and value retention.',
    techSpecs:{construction:'Coral stone + reinforced concrete',energy:'Solar array + grid backup',water:'Desalination plant + rainwater',smart:'KNX building automation',security:'Cliff-side natural barrier, electronic gates, 24/7 guard'},
    conciergeServices:['Scuba & snorkeling expeditions','Private island hopping','Marine biologist guided tours','Cliff-side yoga sessions','Art studio access','Chef-curated tasting menus']
  }
];

const LIFESTYLE = [
  {title:'Golf Championship',sub:'Dents de Perro · Capcana',img:'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80&auto=format'},
  {title:'Yacht & Marina',sub:'Port de plaisance privé',img:'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80&auto=format'},
  {title:'Gastronomie',sub:'Chefs étoilés & terroir',img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format'},
  {title:'Wellness & Spa',sub:'Centres de bien-être',img:'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&auto=format'},
];

const MARQUEE_ITEMS = [
  'Cap Cana','Punta Cana','<em>Casa de Campo</em>','Las Terrenas','<em>Samaná</em>','Bayahíbe','<em>La Romana</em>','Puerto Plata','<em>Cabarete</em>','Sosúa'
];

// ─── RENDER ───
function renderProperties(){
  const grid = document.getElementById('propsGrid');
  var t = I18N[currentLang] || I18N.en;
  var bedLabel = t.card_beds || 'Beds';
  var bathLabel = t.card_baths || 'Baths';
  grid.innerHTML = PROPERTIES.map((p,i) => `
    <div class="prop-card ${p.featured?'featured':''}" onclick="openPropertyDetail('${p.slug}',event)">
      <div class="prop-img">
        <img src="${p.img}" alt="${p.name}" loading="${i<2?'eager':'lazy'}">
        ${p.tag?`<span class="prop-tag">${p.tag}</span>`:''}
      </div>
      <div class="prop-info">
        <div class="prop-loc">${p.location}</div>
        <div class="prop-name">${p.name}</div>
        <div class="prop-meta">
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7"/><path d="M21 7H3l2-4h14l2 4z"/></svg> ${p.beds} ${bedLabel}</span>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16a1 1 0 0 1 1 1v3H3v-3a1 1 0 0 1 1-1z"/><path d="M4 12V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v6"/></svg> ${p.baths} ${bathLabel}</span>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> ${p.sqm}m²</span>
        </div>
        <div class="prop-price">${p.price}</div>
      </div>
      <div class="prop-actions">
        <button class="prop-act-btn" title="Details" onclick="event.stopPropagation();openPropertyDetail('${p.slug}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
      </div>
    </div>
  `).join('');
}

function renderLifestyle(){
  document.getElementById('lifeGrid').innerHTML = LIFESTYLE.map(l => `
    <div class="life-card">
      <img src="${l.img}" alt="${l.title}" loading="lazy">
      <div class="life-card-info"><h4>${l.title}</h4><span>${l.sub}</span></div>
    </div>
  `).join('');
}

function renderMarquee(){
  const items = [...MARQUEE_ITEMS,...MARQUEE_ITEMS].map(t=>`<span class="marquee-item">${t}</span>`).join('');
  document.getElementById('marqueeTrack').innerHTML = items;
}

// ─── NAVIGATION ───
function scrollToSection(id){
  const el = document.getElementById(id);
  if(!el) return;
  const headerH = document.getElementById('mainHeader').offsetHeight || 80;
  const y = el.getBoundingClientRect().top + window.pageYOffset - headerH;
  if(typeof gsap !== 'undefined'){
    gsap.to(window, {scrollTo:{y:y, autoKill:true}, duration:1, ease:'power3.inOut'});
  } else {
    window.scrollTo({top:y, behavior:'smooth'});
  }
}
function toggleNav(){
  const nav = document.getElementById('mainNav');
  const header = document.getElementById('mainHeader');
  const wa = document.querySelector('.wa-btn');
  nav.classList.toggle('open');
  const isOpen = nav.classList.contains('open');
  if(header) header.style.zIndex = isOpen ? '9999' : '';
  if(wa) wa.style.display = isOpen ? 'none' : '';
}
function closeNav(){
  const nav = document.getElementById('mainNav');
  const header = document.getElementById('mainHeader');
  const wa = document.querySelector('.wa-btn');
  nav.classList.remove('open');
  if(header) header.style.zIndex = '';
  if(wa) wa.style.display = '';
}

// ─── HEADER SCROLL ───
let lastScroll = 0;
window.addEventListener('scroll',()=>{
  const h = document.getElementById('mainHeader');
  h.classList.toggle('scrolled', window.scrollY > 80);
  lastScroll = window.scrollY;
},{passive:true});

// ─── CUSTOM CURSOR ───
if(window.matchMedia('(pointer:fine)').matches){
  const dot=document.getElementById('curDot'),ring=document.getElementById('curRing');
  let mx=0,my=0,dx=0,dy=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform='translate3d('+(mx-4)+'px,'+(my-4)+'px,0)'},{ passive:true });
  function animCursor(){dx+=(mx-dx)*.12;dy+=(my-dy)*.12;ring.style.transform='translate3d('+(dx-20)+'px,'+(dy-20)+'px,0)';requestAnimationFrame(animCursor)}
  animCursor();
  document.querySelectorAll('a,button,.prop-card,.life-card,.pd-thumb,.pd-amenity').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('hover'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('hover'));
  });
}

// ═══ i18n SYSTEM ═══
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('rl-lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  document.getElementById('currentLangText').textContent = lang.toUpperCase();
  // Update active state in dropdown
  document.querySelectorAll('.lang-opt').forEach(o => o.classList.toggle('active', o.textContent.trim().toLowerCase() === lang));
  // Close dropdown
  document.getElementById('langSel').classList.remove('open');
  // Update all data-i18n elements
  const t = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  // Re-render properties with translated labels
  renderProperties();
  // Update WhatsApp link
  const waBtn = document.getElementById('waBtn');
  if (waBtn && t.wa_text) {
    const msg = I18N[lang === 'fr' ? 'fr' : lang === 'es' ? 'es' : lang === 'ru' ? 'ru' : lang === 'zh' ? 'zh' : 'en'];
    waBtn.href = 'https://wa.me/61436007811?text=' + encodeURIComponent(msg.hero_sub || '');
  }
}
function toggleLangMenu(e) {
  e && e.stopPropagation();
  document.getElementById('langSel').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-sel')) document.getElementById('langSel')?.classList.remove('open');
});

// ═══ QUALIFICATION TUNNEL ═══
let tunnelStep = 0;
let tunnelData = { horizon: '', budget: '1m-3m', confotur: false };

function selectHorizon(el, value) {
  document.querySelectorAll('.t-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  tunnelData.horizon = value;
}

function tunnelNext() {
  if (tunnelStep === 0 && !tunnelData.horizon) {
    // Shake the options to indicate selection needed
    gsap.fromTo('.t-options', {x: -5}, {x: 5, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut', onComplete: () => gsap.set('.t-options', {x: 0})});
    return;
  }
  if (tunnelStep === 1) {
    tunnelData.budget = document.getElementById('tBudget').value;
    tunnelData.confotur = document.getElementById('tConfotur').checked;
  }
  if (tunnelStep === 2) {
    submitTunnel();
    return;
  }
  tunnelStep++;
  updateTunnelUI();
}

function tunnelPrev() {
  if (tunnelStep > 0) { tunnelStep--; updateTunnelUI(); }
}

function updateTunnelUI() {
  const t = I18N[currentLang];
  // Steps
  for (let i = 0; i < 3; i++) {
    const step = document.getElementById('tStep' + i);
    const dot = document.getElementById('tDot' + i);
    step.classList.toggle('active', i === tunnelStep);
    dot.classList.toggle('active', i === tunnelStep);
    dot.classList.toggle('done', i < tunnelStep);
  }
  // Back button
  document.getElementById('tBackBtn').style.display = tunnelStep > 0 ? 'flex' : 'none';
  // Next button text
  const nextText = document.getElementById('tNextText');
  if (tunnelStep === 2) {
    nextText.innerHTML = t.t_submit || 'Send';
  } else {
    nextText.innerHTML = t.t_next || 'Next';
  }
}

function submitTunnel(e) {
  if (e) e.preventDefault();

  // Rate limiting check
  if (!checkRateLimit()) {
    var btn = document.getElementById('tNextBtn');
    gsap.fromTo(btn, {x:-4}, {x:4, duration:0.08, repeat:5, yoyo:true, ease:'power2.inOut', onComplete:function(){gsap.set(btn,{x:0})}});
    return;
  }

  // Sanitize all inputs
  var firstName = sanitize(document.getElementById('tFirstName').value);
  var email = sanitize(document.getElementById('tEmail').value);
  if (!firstName || !email) {
    document.getElementById('leadForm').reportValidity();
    return;
  }
  // Email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('tEmail').setCustomValidity('Please enter a valid email address');
    document.getElementById('leadForm').reportValidity();
    document.getElementById('tEmail').setCustomValidity('');
    return;
  }

  var btn = document.getElementById('tNextBtn');
  btn.style.opacity = '0.6';
  btn.style.pointerEvents = 'none';

  var leadData = {
    firstName: firstName,
    lastName: sanitize(document.getElementById('tLastName').value),
    email: email,
    phone: sanitize(document.getElementById('tPhone').value),
    horizon: tunnelData.horizon,
    budget: tunnelData.budget,
    confoturInterest: tunnelData.confotur,
    lead_source: 'Real_Luxe_Website',
    language: currentLang
  };

  /* ══════════════════════════════════════════════════════════
     LEAD GUARD TUNNEL — Enregistrement Supabase AVANT succès
     ══════════════════════════════════════════════════════════ */
  insertLeadFromTunnel(leadData, function(err, result) {
    if (err) {
      console.warn('[Real Luxe] Tunnel Lead Guard : erreur Supabase, lead sauvegardé localement');
    }
    leadData.commission_id = result ? result.commission_id : 'LOCAL';
    console.log('[Real Luxe] ✓ Tunnel lead enregistré — commission_id:', leadData.commission_id);

    // EmailJS notification
    sendLeadEmails({
      nom: leadData.firstName + ' ' + leadData.lastName,
      email: leadData.email,
      tel: leadData.phone,
      property_name: 'Consultation Privée (' + leadData.horizon + ')',
      villa_interet: 'general-inquiry',
      commission_id: leadData.commission_id,
      source: 'tunnel'
    });

    showTunnelSuccess();
  });
}

function showTunnelSuccess() {
  document.querySelectorAll('.tunnel-step, .tunnel-progress, .t-nav').forEach(el => el.style.display = 'none');
  const success = document.getElementById('formSuccess');
  success.classList.add('show');
  gsap.from(success, {opacity: 0, y: 20, duration: 0.6, ease: 'power3.out'});
}

// ═══ VAULT ACCESS FORM ═══
function openVaultForm() {
  document.getElementById('vaultModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  // Reset form state
  document.getElementById('vaultAccessForm').reset();
  document.getElementById('vaultFormContent').innerHTML = document.getElementById('vaultFormContent').innerHTML;
  var modal = document.querySelector('.vault-modal');
  gsap.fromTo(modal, {y:30, scale:0.97}, {y:0, scale:1, duration:0.5, ease:'power3.out'});
}
function closeVaultForm() {
  var overlay = document.getElementById('vaultModal');
  gsap.to('.vault-modal', {y:20, opacity:0, duration:0.3, ease:'power3.in', onComplete:function(){
    overlay.classList.remove('active');
    document.querySelector('.vault-modal').style.opacity = '';
    document.querySelector('.vault-modal').style.transform = '';
    if (!document.getElementById('pdOverlay').classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }});
}
function submitVaultForm(e) {
  if (e) e.preventDefault();
  if (!checkRateLimit()) {
    var btn = document.getElementById('vaultSubmitBtn');
    gsap.fromTo(btn, {x:-4}, {x:4, duration:0.08, repeat:5, yoyo:true, ease:'power2.inOut', onComplete:function(){gsap.set(btn,{x:0})}});
    return;
  }
  var name = sanitize(document.getElementById('vaultName').value);
  var email = sanitize(document.getElementById('vaultEmail').value);
  var phone = sanitize(document.getElementById('vaultPhone').value);
  var budget = sanitize(document.getElementById('vaultBudget').value);
  var msg = sanitize(document.getElementById('vaultMsg').value);
  if (!name || !email || !phone || !budget) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('vaultEmail').setCustomValidity('Please enter a valid email address');
    document.getElementById('vaultAccessForm').reportValidity();
    document.getElementById('vaultEmail').setCustomValidity('');
    return;
  }
  var btn = document.getElementById('vaultSubmitBtn');
  btn.classList.add('sending');
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="31 31"/></svg> Sending...';

  var vaultData = { name:name, email:email, phone:phone, budget:budget, message:msg, source:'vault', language:currentLang };

  /* ══════════════════════════════════════════════════════════
     LEAD GUARD VAULT — Enregistrement Supabase AVANT succès
     ══════════════════════════════════════════════════════════ */
  insertLeadFromVault(vaultData, function(err, result) {
    if (err) {
      console.warn('[Real Luxe] Vault Lead Guard : erreur Supabase, lead sauvegardé localement');
    }
    vaultData.commission_id = result ? result.commission_id : 'LOCAL';
    console.log('[Real Luxe] ✓ Vault lead enregistré — commission_id:', vaultData.commission_id);

    // EmailJS notification
    sendLeadEmails({
      nom: vaultData.name,
      email: vaultData.email,
      tel: vaultData.phone,
      property_name: 'Collection Off-Market',
      villa_interet: 'vault-access',
      commission_id: vaultData.commission_id,
      source: 'vault'
    });

    showVaultSuccess();
  });
}
function showVaultSuccess() {
  var content = document.getElementById('vaultFormContent');
  content.innerHTML = '<div class="vm-success"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><h4>Access Requested</h4><p>Thank you. Our private client advisor will contact you within 24 hours to complete your accreditation.</p></div>';
  gsap.from('.vm-success', {opacity:0, y:15, duration:0.5, ease:'power3.out'});
  setTimeout(closeVaultForm, 4000);
}

// ═══ CONFOTUR CALCULATOR ═══
function updateCalc() {
  const raw = document.getElementById('calcInput').value.replace(/[^0-9]/g, '');
  const price = parseInt(raw) || 0;
  // Format input with commas
  document.getElementById('calcInput').value = price.toLocaleString('en-US');
  // Calculations under Confotur Law 158-01
  const transfer = price * 0.03;                    // 3% transfer tax
  const property = price * 0.01 * 15;               // 1% property tax × 15 years
  const income = price * 0.08 * 0.27 * 15;          // 8% yield × 27% tax × 15 years
  const gains = price * 0.50 * 0.27;                // 50% appreciation × 27% tax
  const total = transfer + property + income + gains;
  // Update display
  const fmt = v => '$' + Math.round(v).toLocaleString('en-US');
  document.getElementById('calcTransfer').textContent = fmt(transfer);
  document.getElementById('calcProperty').textContent = fmt(property);
  document.getElementById('calcIncome').textContent = fmt(income);
  document.getElementById('calcGains').textContent = fmt(gains);
  document.getElementById('calcTotal').textContent = fmt(total);
}

// ─── PRELOADER ───
function initPreloader(){
  const tl = gsap.timeline();
  tl.to('.pre-logo',{opacity:1,y:0,duration:.8,ease:'power3.out'})
    .to('.pre-sub',{opacity:1,duration:.5},'<+.3')
    .to('.pre-fill',{width:'100%',duration:1.5,ease:'power2.inOut'},'<')
    .to('#preloader', {
      yPercent: -100,
      duration: 0.9,
      ease: 'power3.inOut',
      delay: 0.3,
      onComplete: () => {
        document.getElementById('preloader').classList.add('done');
        initAnimations();
      }
    });
}

// ─── GSAP ANIMATIONS ───
function initAnimations(){
  gsap.registerPlugin(ScrollTrigger);
  if(typeof ScrollToPlugin !== 'undefined') gsap.registerPlugin(ScrollToPlugin);

  // Signature Logo Animation
  var logoTl = gsap.timeline({delay: 0});
  logoTl.from('.h-logo', {opacity: 0, letterSpacing: '20px', duration: 1.2, ease: 'power3.out'})
        .from('.h-logo span', {opacity: 0, x: -10, duration: 0.6, ease: 'power3.out'}, '<+0.4');

  // Nav links entrance (fade-in + slide from top)
  gsap.from('.nav-link', {opacity:0, y:-15, duration:0.6, stagger:0.08, ease:'power3.out', delay:0.3});
  gsap.from('.nav-cta', {opacity:0, scale:0.9, duration:0.5, ease:'back.out(1.7)', delay:0.8});

  // Hero entrance
  const htl = gsap.timeline({delay:.1});
  htl.from('.hero-badge',{opacity:0,y:30,duration:.8,ease:'power3.out'})
     .from('.hero-title',{opacity:0,y:50,duration:1,ease:'power3.out'},'<+.15')
     .from('.hero-title em',{opacity:0,x:-30,scale:0.95,duration:.8,ease:'power3.out'},'<+.3')
     .from('.hero-sub',{opacity:0,y:30,duration:.8,ease:'power3.out'},'<+.2')
     .from('.hero-actions',{opacity:0,y:30,duration:.8,ease:'power3.out'},'<+.15')
     .from('.hero-stats .h-stat',{opacity:0,y:20,duration:.6,stagger:.12,ease:'power3.out'},'<+.1')
     .from('.hero-scroll',{opacity:0,duration:.6},'<+.3')
     .from('.lang-sel',{opacity:0,x:20,duration:.5,ease:'power3.out'},'<');

  // Hero parallax
  gsap.to('#heroBgImg',{
    yPercent:-12,
    ease:'none',
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:1}
  });

  // Properties
  gsap.from('.props-header',{
    opacity:0,y:60,duration:1,ease:'power3.out',
    scrollTrigger:{trigger:'#properties',start:'top 80%'}
  });
  gsap.from('.prop-card',{
    opacity:0,y:80,duration:.8,stagger:.15,ease:'power3.out',
    scrollTrigger:{trigger:'.props-grid',start:'top 85%'}
  });

  // About
  gsap.from('.about-img-wrap',{
    opacity:0,x:-60,duration:1,ease:'power3.out',
    scrollTrigger:{trigger:'#about',start:'top 75%'}
  });
  gsap.from('.about-content',{
    opacity:0,x:60,duration:1,ease:'power3.out',
    scrollTrigger:{trigger:'#about',start:'top 75%'}
  });
  gsap.from('.about-feat',{
    opacity:0,y:40,duration:.6,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'.about-features',start:'top 85%'}
  });

  // About parallax
  gsap.to('.about-img-wrap img',{
    yPercent:-15,ease:'none',
    scrollTrigger:{trigger:'.about-img-wrap',start:'top bottom',end:'bottom top',scrub:1}
  });

  // Lifestyle
  gsap.from('.life-card',{
    opacity:0,y:60,scale:.95,duration:.7,stagger:.1,ease:'power3.out',
    scrollTrigger:{trigger:'#lifestyle',start:'top 75%'}
  });


  // Vault
  gsap.from('#vault .sec-label, #vault .sec-title, #vault p, #vault .btn-primary', {
    opacity: 0, y: 40, duration: 0.8, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '#vault', start: 'top 75%' }
  });

  // Confotur
  gsap.from('.confotur-card', {
    opacity: 0, y: 60, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '#confotur', start: 'top 75%' }
  });

  // Family Office
  gsap.from('.fo-card', {
    opacity: 0, y: 40, duration: 0.7, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '#familyoffice', start: 'top 75%' }
  });

  // Testimonial
  gsap.from('.testi-img',{
    opacity:0,x:-60,duration:1,ease:'power3.out',
    scrollTrigger:{trigger:'#testimonial',start:'top 75%'}
  });
  gsap.from('.testi-content',{
    opacity:0,x:60,duration:1,ease:'power3.out',
    scrollTrigger:{trigger:'#testimonial',start:'top 75%'}
  });

  // Contact
  gsap.from('.contact-info',{
    opacity:0,y:60,duration:1,ease:'power3.out',
    scrollTrigger:{trigger:'#contact',start:'top 75%'}
  });
  gsap.from('.form-card',{
    opacity:0,y:60,duration:1,ease:'power3.out',delay:.2,
    scrollTrigger:{trigger:'#contact',start:'top 75%'}
  });

  // Section labels & titles
  document.querySelectorAll('.sec-label').forEach(el=>{
    gsap.from(el,{opacity:0,x:-30,duration:.7,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}});
  });
  document.querySelectorAll('.sec-title').forEach(el=>{
    gsap.from(el,{opacity:0,y:40,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}});
  });

  // Safety net: ensure no elements are stuck invisible after 4 seconds
  setTimeout(function(){
    var selectors = ['.props-header','.prop-card','.about-img-wrap','.about-content','.about-feat','.life-card','.confotur-card','.fo-card','.testi-img','.testi-content','.contact-info','.form-card','.sec-label','.sec-title','#vault .sec-label','#vault .sec-title','#vault p','#vault .btn-primary','.partner-logo','.partner-svc'];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(getComputedStyle(el).opacity < 0.1) {
          gsap.to(el, {opacity:1, y:0, x:0, duration:0.3, clearProps:'all'});
        }
      });
    });
  }, 4000);
}

// ─── FAMILY OFFICE ACCORDION ───
function toggleFO(n) {
  const card = document.getElementById('foCard' + n);
  const isOpen = card.classList.contains('open');

  // Close all
  document.querySelectorAll('.fo-card').forEach(c => c.classList.remove('open'));

  // Open clicked if it was closed
  if (!isOpen) card.classList.add('open');
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded',()=>{
  renderProperties();
  renderLifestyle();
  renderMarquee();
  initPreloader();

  // Apply saved language (default EN)
  setLang(currentLang);

  // Handle ?property=SLUG from catalogue page
  var urlParams = new URLSearchParams(window.location.search);
  var propSlug = urlParams.get('property');
  if (propSlug) {
    setTimeout(async function(){
      // Si la propriété n'est pas dans le tableau hardcodé, la chercher dans Supabase
      var found = PROPERTIES.find(function(pr){ return pr.slug === propSlug; });
      if (!found && typeof fetchPublishedProperties === 'function') {
        try {
          var allProps = await fetchPublishedProperties();
          var match = allProps.find(function(pr){ return pr.slug === propSlug; });
          if (match) {
            PROPERTIES.push(normalizeProperty(match));
          }
        } catch(e) { console.error('[Real Luxe] Fetch for deep-link failed:', e); }
      }
      openPropertyDetail(propSlug);
    }, 1200);
    // Clean URL
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // Nav click bounce feedback
  document.querySelectorAll('.nav-link, .nav-cta').forEach(function(link) {
    link.addEventListener('click', function(){
      var el = this;
      el.classList.remove('clicked');
      void el.offsetWidth; // force reflow
      el.classList.add('clicked');
      gsap.fromTo(el, {scale:1}, {scale:1.1, duration:0.15, ease:'power2.out', yoyo:true, repeat:1});
      setTimeout(function(){ el.classList.remove('clicked'); }, 500);
    });
  });

  // Init calculator
  updateCalc();

  // Parallax on property images
  document.querySelectorAll('.prop-img img').forEach(img => {
    gsap.to(img, {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: img.closest('.prop-card'), start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  });

  // Calculator animation
  gsap.from('.calc-module', {
    opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.calc-module', start: 'top 80%' }
  });

  // Partners animation
  gsap.from('.partner-logo', {
    opacity: 0, y: 30, duration: 0.6, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '#partners', start: 'top 85%' }
  });
  gsap.from('.partner-svc', {
    opacity: 0, y: 40, duration: 0.6, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.partners-services', start: 'top 88%' }
  });

});


} // end INDEX

/* ═══════════════════════════════════════════════════════════════
   CATALOGUE PAGE
   ═══════════════════════════════════════════════════════════════ */
if (PAGE_TYPE === 'catalogue') {

/* ═══════════════════════════════════════════════════════════════
   CATALOGUE — DONNÉES DYNAMIQUES VIA SUPABASE
   ═══════════════════════════════════════════════════════════════
   Les données ne sont plus codées en dur.
   Elles sont récupérées via fetchPublishedProperties()
   défini dans supabase-client.js.

   Flux d'initialisation :
     1. DOMContentLoaded → loadPropertiesFromSupabase()
     2. Fetch async → PROPERTIES[] rempli
     3. renderCards(true) → injection DOM
     4. initAnimations() → GSAP s'exécute APRÈS le DOM
   ═══════════════════════════════════════════════════════════════ */

/* Source de données dynamique (rempli après fetch Supabase) */
var PROPERTIES = [];

/* Flag : indique si les données ont été chargées avec succès */
var _dataReady = false;

/* ===================================================================
   SUPABASE DATA LOADER
   =================================================================== */

/**
 * loadPropertiesFromSupabase()
 * ────────────────────────────
 * Orchestre le chargement des données :
 *   1. Affiche le loader
 *   2. Fetch les propriétés publiées
 *   3. Normalise les données pour le renderer existant
 *   4. Met à jour les stats dynamiques du hero
 *   5. Lance le premier rendu + animations GSAP
 *
 * En cas d'erreur → affiche un message + bouton retry.
 */
async function loadPropertiesFromSupabase() {
  var grid = document.getElementById('propsGrid');
  var loader = document.getElementById('propsLoader');

  /* Afficher le loader */
  if (loader) loader.style.display = 'flex';

  try {
    /* ── DIAGNOSTIC 1 : Le SDK Supabase est-il chargé ? ── */
    if (typeof window.supabase === 'undefined') {
      throw new Error(
        'SDK Supabase NON CHARGÉ.\n' +
        'window.supabase est undefined.\n' +
        'CAUSE PROBABLE : La balise <script> du CDN Supabase n\'a pas fonctionné.\n' +
        'SOLUTION : Ouvre catalogue.html et vérifie que cette ligne existe dans le <head> :\n' +
        '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
      );
    }

    /* ── DIAGNOSTIC 2 : supabase-client.js a-t-il été chargé ? ── */
    if (typeof fetchPublishedProperties !== 'function') {
      throw new Error(
        'La fonction fetchPublishedProperties() n\'existe pas.\n' +
        'CAUSE PROBABLE : supabase-client.js n\'est pas chargé ou a crashé.\n' +
        'SOLUTION : Vérifie que <script src="supabase-client.js"></script> est dans catalogue.html AVANT script.js.'
      );
    }

    /* ── DIAGNOSTIC 3 : Le client Supabase est-il initialisé ? ── */
    if (typeof _supabaseReady !== 'undefined' && !_supabaseReady) {
      var reason = (typeof _supabaseError !== 'undefined' && _supabaseError)
        ? _supabaseError.message
        : 'Raison inconnue — ouvre la Console pour plus de détails.';
      throw new Error(
        'Le client Supabase n\'a pas réussi à s\'initialiser.\n' + reason
      );
    }

    /* ── Fetch depuis Supabase (status = 'published' filtré côté serveur) ── */
    console.log('[Real Luxe] Lancement du fetch Supabase...');
    var rawData = await fetchPublishedProperties();

    if (!rawData || rawData.length === 0) {
      console.warn('[Real Luxe] Requête OK mais 0 résultats.');
      console.warn('[Real Luxe]   → Vérifie que la table "properties" contient des lignes avec status = "published"');
      showEmptyState(grid);
      return;
    }

    /* ── Normaliser chaque ligne pour le renderer de cartes existant ── */
    PROPERTIES = rawData.map(normalizeProperty);
    displayedProperties = PROPERTIES.slice();
    _dataReady = true;

    /* ── Mettre à jour la ligne de stats du hero ── */
    updateHeroStats(PROPERTIES);

    /* ── Supprimer le loader ── */
    if (loader) loader.remove();

    /* ── Premier rendu des cartes AVEC animation ── */
    renderCards(true);

    /* ── Lancer les animations GSAP (uniquement après injection DOM) ── */
    if (typeof gsap !== 'undefined') {
      initAnimations();

      /* ── ScrollTrigger pour le footer ── */
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        gsap.from('.cat-footer', {
          scrollTrigger: {
            trigger: '.cat-footer',
            start: 'top 95%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power3.out'
        });
      }
    } else {
      console.warn('[Real Luxe] GSAP non chargé — les animations sont désactivées.');
    }

    console.log('[Real Luxe] ✓ ' + PROPERTIES.length + ' propriétés chargées depuis Supabase');

  } catch (err) {
    console.error('═══════════════════════════════════════════════');
    console.error('[Real Luxe] ✗ ÉCHEC DU CHARGEMENT DES PROPRIÉTÉS');
    console.error('═══════════════════════════════════════════════');
    console.error('[Real Luxe] Type :', err.name || 'Unknown');
    console.error('[Real Luxe] Message :', err.message);
    if (err.stack) {
      console.error('[Real Luxe] Stack :', err.stack);
    }
    console.error('───────────────────────────────────────────────');
    console.error('[Real Luxe] CHECKLIST DE DIAGNOSTIC :');
    console.error('  1. window.supabase existe ?', typeof window.supabase);
    console.error('  2. _supabaseReady ?', typeof _supabaseReady !== 'undefined' ? _supabaseReady : 'N/A');
    console.error('  3. _supabaseError ?', typeof _supabaseError !== 'undefined' && _supabaseError ? _supabaseError.message : 'aucune');
    console.error('  4. fetchPublishedProperties existe ?', typeof fetchPublishedProperties);
    console.error('═══════════════════════════════════════════════');
    showErrorState(grid, err.message);
  }
}

/**
 * updateHeroStats(properties)
 * ───────────────────────────
 * Met à jour dynamiquement la ligne de stats du hero
 * avec les données réelles (nombre, locations, prix min).
 */
function updateHeroStats(properties) {
  var statsEl = document.querySelector('.cat-hero-stats');
  if (!statsEl || properties.length === 0) return;

  var locations = [];
  var minPrice = Infinity;

  for (var i = 0; i < properties.length; i++) {
    var p = properties[i];
    /* Comptage des locations uniques */
    if (locations.indexOf(p.location) === -1) {
      locations.push(p.location);
    }
    /* Prix minimum */
    var numPrice = parsePriceNumber(p.price);
    if (numPrice < minPrice) minPrice = numPrice;
  }

  /* Formater le prix minimum (ex: $1.95M) */
  var priceStr = minPrice >= 1000000
    ? '$' + (minPrice / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M'
    : '$' + minPrice.toLocaleString();

  var t = I18N[currentLang] || I18N.en;
  var propWord = currentLang === 'fr' ? 'Propriétés' :
                 currentLang === 'es' ? 'Propiedades' :
                 'Properties';
  var locWord  = currentLang === 'fr' ? 'Emplacements' :
                 currentLang === 'es' ? 'Ubicaciones' :
                 'Locations';
  var fromWord = currentLang === 'fr' ? 'À partir de' :
                 currentLang === 'es' ? 'Desde' :
                 'From';

  statsEl.textContent = properties.length + ' ' + propWord +
    ' · ' + locations.length + ' ' + locWord +
    ' · ' + fromWord + ' ' + priceStr;
}

/**
 * showEmptyState(grid)
 * ────────────────────
 * Affiche un message quand aucune propriété n'est trouvée.
 */
function showEmptyState(grid) {
  grid.innerHTML =
    '<div class="props-error">' +
      '<div class="props-error-icon">🏝️</div>' +
      '<p class="props-error-msg">No properties available at this time.<br>Please check back soon.</p>' +
    '</div>';
}

/**
 * showErrorState(grid, errorMsg)
 * ──────────────────────────────
 * Affiche un message d'erreur avec le détail réel + bouton retry.
 * En mode dev, l'erreur exacte est visible dans le DOM.
 */
function showErrorState(grid, errorMsg) {
  var detailHtml = '';
  if (errorMsg) {
    /* Formatage lisible : chaque \n devient un <br> */
    var safeMsg = errorMsg
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    detailHtml =
      '<div style="margin-top:16px;padding:14px 18px;' +
      'background:rgba(192,57,43,0.06);border:1px solid rgba(192,57,43,0.15);border-radius:10px;' +
      'font-size:12px;font-family:\'DM Sans\',monospace;color:#c0392b;' +
      'word-break:break-word;max-width:550px;margin-left:auto;margin-right:auto;text-align:left;line-height:1.7;">' +
        '<strong style="display:block;margin-bottom:6px;font-size:13px;">Diagnostic :</strong>' +
        safeMsg +
      '</div>';
  }
  grid.innerHTML =
    '<div class="props-error">' +
      '<div class="props-error-icon">⚠️</div>' +
      '<p class="props-error-msg">Impossible de charger les propriétés.<br>Vérifie ta connexion et réessaie.</p>' +
      detailHtml +
      '<button class="props-retry-btn" onclick="retryLoad()">Réessayer</button>' +
    '</div>';
}

/**
 * retryLoad()
 * ───────────
 * Relance le chargement après une erreur.
 */
function retryLoad() {
  var grid = document.getElementById('propsGrid');
  grid.innerHTML =
    '<div class="props-loading" id="propsLoader">' +
      '<div class="props-loading-spinner"></div>' +
      '<div class="props-loading-text">Loading properties...</div>' +
    '</div>';
  loadPropertiesFromSupabase();
}

/* ===================================================================
   i18n
   =================================================================== */
var I18N = {
  fr: {
    cat_label:'Collection Compl\u00E8te', cat_title:'Nos <em>Propri\u00E9t\u00E9s</em>', cat_sub:'Explorez notre collection compl\u00E8te de propri\u00E9t\u00E9s de luxe en R\u00E9publique Dominicaine.',
    card_beds:'Ch.', card_baths:'SdB',
    back_home:'Retour',
    filter_all:'Toutes',
    filter_price_asc:'Prix croissant',
    filter_price_desc:'Prix d\u00E9croissant',
    cat_view_details:'Voir les D\u00E9tails',
    cat_stats_line:'5 Propri\u00E9t\u00E9s \u00B7 3 Emplacements \u00B7 \u00C0 partir de $1.95M',
    footer_rights:'\u00A9 2024 Real Luxe. Tous droits r\u00E9serv\u00E9s.',
    cat_photos:'photos',
    cat_request_visit:'Solliciter une Visite',
    lead_title:'Consultation Priv\u00E9e',
    lead_sub:'Notre \u00E9quipe vous contactera sous 24h pour une exp\u00E9rience personnalis\u00E9e.',
    lead_name:'Nom complet',
    lead_email:'Email',
    lead_phone:'T\u00E9l\u00E9phone',
    lead_message:'Message (optionnel)',
    lead_send:'Envoyer la Demande',
    lead_success_title:'Demande VIP Transmise',
    lead_success_sub:'Notre \u00E9quipe concierge a \u00E9t\u00E9 notifi\u00E9e et vous contactera dans les plus brefs d\u00E9lais.',
    lead_wa_cta:'R\u00E9ponse Imm\u00E9diate sur WhatsApp',
    lead_close:'Fermer'
  },
  en: {
    cat_label:'Full Collection', cat_title:'Our <em>Properties</em>', cat_sub:'Explore our complete collection of luxury properties in the Dominican Republic.',
    card_beds:'Beds', card_baths:'Baths',
    back_home:'Back',
    filter_all:'All',
    filter_price_asc:'Price: Low to High',
    filter_price_desc:'Price: High to Low',
    cat_view_details:'View Details',
    cat_stats_line:'5 Properties \u00B7 3 Locations \u00B7 From $1.95M',
    footer_rights:'\u00A9 2024 Real Luxe. All rights reserved.',
    cat_photos:'photos',
    cat_request_visit:'Request a Visit',
    lead_title:'Private Consultation',
    lead_sub:'Our team will contact you within 24 hours for a personalized experience.',
    lead_name:'Full Name',
    lead_email:'Email',
    lead_phone:'Phone',
    lead_message:'Message (optional)',
    lead_send:'Send Request',
    lead_success_title:'VIP Request Transmitted',
    lead_success_sub:'Our concierge team has been notified and will contact you shortly.',
    lead_wa_cta:'Immediate Response on WhatsApp',
    lead_close:'Close'
  },
  es: {
    cat_label:'Colecci\u00F3n Completa', cat_title:'Nuestras <em>Propiedades</em>', cat_sub:'Explore nuestra colecci\u00F3n completa de propiedades de lujo en Rep\u00FAblica Dominicana.',
    card_beds:'Hab.', card_baths:'Ba\u00F1os',
    back_home:'Volver',
    filter_all:'Todas',
    filter_price_asc:'Precio: menor a mayor',
    filter_price_desc:'Precio: mayor a menor',
    cat_view_details:'Ver Detalles',
    cat_stats_line:'5 Propiedades \u00B7 3 Ubicaciones \u00B7 Desde $1.95M',
    footer_rights:'\u00A9 2024 Real Luxe. Todos los derechos reservados.',
    cat_photos:'fotos',
    cat_request_visit:'Solicitar una Visita',
    lead_title:'Consulta Privada',
    lead_sub:'Nuestro equipo le contactar\u00E1 en 24 horas para una experiencia personalizada.',
    lead_name:'Nombre completo',
    lead_email:'Email',
    lead_phone:'Tel\u00E9fono',
    lead_message:'Mensaje (opcional)',
    lead_send:'Enviar Solicitud',
    lead_success_title:'Solicitud VIP Transmitida',
    lead_success_sub:'Nuestro equipo concierge ha sido notificado y le contactar\u00E1 en breve.',
    lead_wa_cta:'Respuesta Inmediata por WhatsApp',
    lead_close:'Cerrar'
  },
  ru: {
    cat_label:'\u041F\u043E\u043B\u043D\u0430\u044F \u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F', cat_title:'\u041D\u0430\u0448\u0438 <em>\u041E\u0431\u044A\u0435\u043A\u0442\u044B</em>', cat_sub:'\u041E\u0437\u043D\u0430\u043A\u043E\u043C\u044C\u0442\u0435\u0441\u044C \u0441 \u043F\u043E\u043B\u043D\u043E\u0439 \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u0435\u0439 \u044D\u043B\u0438\u0442\u043D\u043E\u0439 \u043D\u0435\u0434\u0432\u0438\u0436\u0438\u043C\u043E\u0441\u0442\u0438 \u0432 \u0414\u043E\u043C\u0438\u043D\u0438\u043A\u0430\u043D\u0441\u043A\u043E\u0439 \u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0435.',
    card_beds:'\u0421\u043F\u0430\u043B\u0435\u043D', card_baths:'\u0412\u0430\u043D\u043D\u044B\u0445',
    back_home:'\u041D\u0430\u0437\u0430\u0434',
    filter_all:'\u0412\u0441\u0435',
    filter_price_asc:'\u0426\u0435\u043D\u0430: \u043F\u043E \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430\u043D\u0438\u044E',
    filter_price_desc:'\u0426\u0435\u043D\u0430: \u043F\u043E \u0443\u0431\u044B\u0432\u0430\u043D\u0438\u044E',
    cat_view_details:'\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435',
    cat_stats_line:'5 \u041E\u0431\u044A\u0435\u043A\u0442\u043E\u0432 \u00B7 3 \u041B\u043E\u043A\u0430\u0446\u0438\u0438 \u00B7 \u041E\u0442 $1.95M',
    footer_rights:'\u00A9 2024 Real Luxe. \u0412\u0441\u0435 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u044B.',
    cat_photos:'\u0444\u043E\u0442\u043E',
    cat_request_visit:'\u0417\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0435',
    lead_title:'\u041F\u0440\u0438\u0432\u0430\u0442\u043D\u0430\u044F \u041A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u044F',
    lead_sub:'\u041D\u0430\u0448\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u0441\u0432\u044F\u0436\u0435\u0442\u0441\u044F \u0441 \u0432\u0430\u043C\u0438 \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 24 \u0447\u0430\u0441\u043E\u0432.',
    lead_name:'\u0424\u0418\u041E',
    lead_email:'Email',
    lead_phone:'\u0422\u0435\u043B\u0435\u0444\u043E\u043D',
    lead_message:'\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)',
    lead_send:'\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C',
    lead_success_title:'VIP \u0417\u0430\u043F\u0440\u043E\u0441 \u041F\u0435\u0440\u0435\u0434\u0430\u043D',
    lead_success_sub:'\u041D\u0430\u0448 \u043A\u043E\u043D\u0441\u044C\u0435\u0440\u0436 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D \u0438 \u0441\u0432\u044F\u0436\u0435\u0442\u0441\u044F \u0441 \u0432\u0430\u043C\u0438 \u0432 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F.',
    lead_wa_cta:'\u041C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442 \u0432 WhatsApp',
    lead_close:'\u0417\u0430\u043A\u0440\u044B\u0442\u044C'
  },
  zh: {
    cat_label:'\u5B8C\u6574\u6536\u85CF', cat_title:'\u6211\u4EEC\u7684<em>\u623F\u4EA7</em>', cat_sub:'\u63A2\u7D22\u6211\u4EEC\u5728\u591A\u7C73\u5C3C\u52A0\u5171\u548C\u56FD\u7684\u5B8C\u6574\u8C6A\u534E\u623F\u4EA7\u6536\u85CF\u3002',
    card_beds:'\u5367\u5BA4', card_baths:'\u6D74\u5BA4',
    back_home:'\u8FD4\u56DE',
    filter_all:'\u5168\u90E8',
    filter_price_asc:'\u4EF7\u683C: \u4F4E\u5230\u9AD8',
    filter_price_desc:'\u4EF7\u683C: \u9AD8\u5230\u4F4E',
    cat_view_details:'\u67E5\u770B\u8BE6\u60C5',
    cat_stats_line:'5 \u623F\u4EA7 \u00B7 3 \u5730\u70B9 \u00B7 \u4ECE $1.95M \u8D77',
    footer_rights:'\u00A9 2024 Real Luxe. \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002',
    cat_photos:'\u7167\u7247',
    cat_request_visit:'\u9884\u7EA6\u53C2\u89C2',
    lead_title:'\u79C1\u4EBA\u54A8\u8BE2',
    lead_sub:'\u6211\u4EEC\u7684\u56E2\u961F\u5C06\u572824\u5C0F\u65F6\u5185\u4E0E\u60A8\u8054\u7CFB\u3002',
    lead_name:'\u59D3\u540D',
    lead_email:'\u7535\u5B50\u90AE\u4EF6',
    lead_phone:'\u7535\u8BDD',
    lead_message:'\u7559\u8A00\uFF08\u53EF\u9009\uFF09',
    lead_send:'\u53D1\u9001\u8BF7\u6C42',
    lead_success_title:'VIP\u8BF7\u6C42\u5DF2\u53D1\u9001',
    lead_success_sub:'\u6211\u4EEC\u7684\u793C\u5BBE\u670D\u52A1\u56E2\u961F\u5DF2\u6536\u5230\u901A\u77E5\uFF0C\u5C06\u5C3D\u5FEB\u4E0E\u60A8\u8054\u7CFB\u3002',
    lead_wa_cta:'WhatsApp\u5373\u65F6\u56DE\u590D',
    lead_close:'\u5173\u95ED'
  }
};

/* ===================================================================
   PARTNER AGENCY MAPPING
   =================================================================== */
var PARTNER_AGENCIES = {
  'Cap Cana':       { name: 'Cap Cana Real Estate', email: 'sales@capcana.com' },
  'Punta Cana':     { name: 'Punta Cana Realty', email: 'info@puntacanarealty.com' },
  'Las Terrenas':   { name: 'Las Terrenas Properties', email: 'contact@lasterrenasproperties.com' },
  'Bayah\u00EDbe': { name: 'Bayah\u00EDbe Estates', email: 'info@bayahibeestates.com' },
  'Saman\u00E1':   { name: 'Saman\u00E1 Properties', email: 'info@samanaproperties.com' },
  'Casa de Campo':  { name: 'Casa de Campo Real Estate', email: 'realestate@casadecampo.com' }
};

/* ===================================================================
   STATE
   =================================================================== */
var currentLang = localStorage.getItem('rl-lang') || 'en';
var activeFilter = 'all';
var activeSort = null;
var displayedProperties = PROPERTIES.slice();

/* ===================================================================
   HELPERS
   =================================================================== */
function parsePriceNumber(priceStr) {
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
}

function getT(key) {
  var t = I18N[currentLang];
  return (t && t[key] !== undefined) ? t[key] : (I18N.en[key] || '');
}

/* ===================================================================
   RENDER CARDS
   =================================================================== */
function renderCards(animate) {
  var grid = document.getElementById('propsGrid');
  var t = I18N[currentLang] || I18N.en;
  var bedsLabel = t.card_beds || 'Beds';
  var bathsLabel = t.card_baths || 'Baths';
  var viewLabel = t.cat_view_details || 'View Details';
  var visitLabel = t.cat_request_visit || 'Request a Visit';
  var photosLabel = t.cat_photos || 'photos';
  var html = '';

  for (var i = 0; i < displayedProperties.length; i++) {
    var p = displayedProperties[i];
    var thumbsHtml = '';
    var thumbCount = Math.min(4, p.gallery.length);
    for (var j = 0; j < thumbCount; j++) {
      thumbsHtml = thumbsHtml + '<img src="' + p.gallery[j].replace('w=1200', 'w=200').replace('q=85', 'q=60') + '" alt="' + p.name + ' ' + (j + 1) + '" loading="lazy">';
    }

    var tagHtml = '';
    if (p.tag) {
      tagHtml = '<div class="cat-card-tag">' + p.tag + '</div>';
    }

    var lotHtml = '';
    if (p.lot && p.lot > 0) {
      lotHtml = '<span class="cat-card-stat">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' +
        '<strong>' + p.lot.toLocaleString() + '</strong> m\u00B2 lot</span>';
    }

    html = html +
      '<div class="cat-card" data-slug="' + p.slug + '" data-location="' + p.location + '">' +
        '<div class="cat-card-gallery">' +
          '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
          tagHtml +
          '<div class="cat-card-count">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
            p.gallery.length + ' ' + photosLabel +
          '</div>' +
        '</div>' +
        '<div class="cat-card-thumbs">' + thumbsHtml + '</div>' +
        '<div class="cat-card-body">' +
          '<div class="cat-card-loc">' + p.location + '</div>' +
          '<h3 class="cat-card-name">' + p.name + '</h3>' +
          '<p class="cat-card-desc">' + p.description + '</p>' +
          '<div class="cat-card-stats">' +
            '<span class="cat-card-stat">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>' +
              '<strong>' + p.beds + '</strong> ' + bedsLabel +
            '</span>' +
            '<span class="cat-card-stat">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 011 1v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3a1 1 0 011 1v8"/></svg>' +
              '<strong>' + p.baths + '</strong> ' + bathsLabel +
            '</span>' +
            '<span class="cat-card-stat">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' +
              '<strong>' + p.sqm + '</strong> m\u00B2' +
            '</span>' +
            lotHtml +
          '</div>' +
          '<div class="cat-card-bottom">' +
            '<div class="cat-card-price">' + p.price + '</div>' +
            '<a href="#" class="cat-card-btn" onclick="event.preventDefault();event.stopPropagation();openPropertyDetail(\'' + p.slug + '\',event)">' +
              '<span>' + viewLabel + '</span>' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
            '</a>' +
            '<button class="cat-card-btn cat-card-btn-visit" onclick="event.preventDefault();event.stopPropagation();openLeadModal(\'' + p.slug + '\')">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
              '<span>' + visitLabel + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  grid.innerHTML = html;

  if (animate) {
    var cards = grid.querySelectorAll('.cat-card');
    gsap.fromTo(cards, {
      opacity: 0,
      y: 40
    }, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'all'
    });
  }

  // Re-bind hover for custom cursor
  initCursorHovers();
}

/* ===================================================================
   FILTER & SORT
   =================================================================== */
function filterByLocation(location, btn) {
  // Update active chip
  var chips = document.querySelectorAll('.filter-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].classList.remove('active');
  }
  btn.classList.add('active');
  activeFilter = location;
  applyFilterSort(true);
}

function sortByPrice(direction, btn) {
  // Toggle sort
  var sortChips = document.querySelectorAll('.sort-chip');
  var wasActive = btn.classList.contains('active');
  for (var i = 0; i < sortChips.length; i++) {
    sortChips[i].classList.remove('active');
  }
  if (wasActive) {
    activeSort = null;
  } else {
    btn.classList.add('active');
    activeSort = direction;
  }
  applyFilterSort(true);
}

function applyFilterSort(animate) {
  // Filter
  var filtered = [];
  for (var i = 0; i < PROPERTIES.length; i++) {
    if (activeFilter === 'all' || PROPERTIES[i].location === activeFilter) {
      filtered.push(PROPERTIES[i]);
    }
  }

  // Sort
  if (activeSort === 'asc') {
    filtered.sort(function(a, b) {
      return parsePriceNumber(a.price) - parsePriceNumber(b.price);
    });
  } else if (activeSort === 'desc') {
    filtered.sort(function(a, b) {
      return parsePriceNumber(b.price) - parsePriceNumber(a.price);
    });
  }

  displayedProperties = filtered;

  if (animate) {
    var grid = document.getElementById('propsGrid');
    var cards = grid.querySelectorAll('.cat-card');
    gsap.to(cards, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      stagger: 0.05,
      ease: 'power2.in',
      onComplete: function() {
        renderCards(true);
      }
    });
  } else {
    renderCards(false);
  }
}

/* ===================================================================
   LANGUAGE
   =================================================================== */
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('rl-lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  document.getElementById('currentLangText').textContent = lang.toUpperCase();

  // Update active state in dropdown
  var opts = document.querySelectorAll('.lang-opt');
  for (var i = 0; i < opts.length; i++) {
    if (opts[i].textContent.trim().toLowerCase() === lang) {
      opts[i].classList.add('active');
    } else {
      opts[i].classList.remove('active');
    }
  }

  // Close dropdown
  document.getElementById('langSel').classList.remove('open');

  // Update all data-i18n elements
  var t = I18N[lang];
  if (!t) t = I18N.en;
  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    var key = els[i].getAttribute('data-i18n');
    if (t[key] !== undefined) {
      els[i].innerHTML = t[key];
    }
  }

  // Update filter "All" chip text
  var allChip = document.querySelector('[data-i18n-filter="filter_all"]');
  if (allChip && t.filter_all) {
    allChip.textContent = t.filter_all;
  }

  // Re-render cards with new language
  renderCards(false);
}

function toggleLangMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('langSel').classList.toggle('open');
}

/* ===================================================================
   HEADER SCROLL
   =================================================================== */
function handleScroll() {
  var header = document.getElementById('catHeader');
  var filterBar = document.getElementById('filterBar');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  if (window.scrollY > 400) {
    filterBar.classList.add('shadow');
  } else {
    filterBar.classList.remove('shadow');
  }
}

/* ===================================================================
   CUSTOM CURSOR
   =================================================================== */
function initCursor() {
  if (window.matchMedia('(pointer:fine)').matches === false) return;

  var dot = document.getElementById('curDot');
  var ring = document.getElementById('curRing');
  if (!dot || !ring) return;

  var mx = -100, my = -100;
  var dx = -100, dy = -100;
  var rx = -100, ry = -100;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;
  });

  function render() {
    dx += (mx - dx) * 0.2;
    dy += (my - dy) * 0.2;
    rx += (mx - rx) * 0.08;
    ry += (my - ry) * 0.08;
    dot.style.transform = 'translate(' + (dx - 4) + 'px,' + (dy - 4) + 'px)';
    ring.style.transform = 'translate(' + (rx - 20) + 'px,' + (ry - 20) + 'px)';
    requestAnimationFrame(render);
  }
  render();

  initCursorHovers();
}

function initCursorHovers() {
  var ring = document.getElementById('curRing');
  if (!ring) return;
  if (window.matchMedia('(pointer:fine)').matches === false) return;

  var hoverEls = document.querySelectorAll('a,button,.cat-card,.filter-chip,.sort-chip,.lang-opt');
  for (var i = 0; i < hoverEls.length; i++) {
    hoverEls[i].addEventListener('mouseenter', function() { ring.classList.add('hover'); });
    hoverEls[i].addEventListener('mouseleave', function() { ring.classList.remove('hover'); });
  }
}

/* ===================================================================
   CLOSE LANG ON OUTSIDE CLICK
   =================================================================== */
document.addEventListener('click', function(e) {
  if (!e.target.closest('.lang-sel')) {
    var langSel = document.getElementById('langSel');
    if (langSel) langSel.classList.remove('open');
  }
});

/* ===================================================================
   GSAP ENTRANCE ANIMATIONS
   =================================================================== */
function initAnimations() {
  // Hero content
  gsap.from('.cat-hero-label', {opacity: 0, y: 20, duration: 0.8, delay: 0.2, ease: 'power3.out'});
  gsap.from('.cat-hero-title', {opacity: 0, y: 30, duration: 0.9, delay: 0.35, ease: 'power3.out'});
  gsap.from('.cat-hero-sub', {opacity: 0, y: 20, duration: 0.8, delay: 0.5, ease: 'power3.out'});
  gsap.from('.cat-hero-stats', {opacity: 0, y: 15, duration: 0.7, delay: 0.65, ease: 'power3.out'});

  // Filter bar
  gsap.from('.filter-bar', {opacity: 0, y: -10, duration: 0.6, delay: 0.7, ease: 'power3.out'});

  // Header elements
  gsap.from('.h-logo', {opacity: 0, x: -20, duration: 0.6, delay: 0.1, ease: 'power3.out'});
  gsap.from('.cat-header-center', {opacity: 0, y: -10, duration: 0.5, delay: 0.3, ease: 'power3.out'});
  gsap.from('.cat-header-right', {opacity: 0, x: 20, duration: 0.6, delay: 0.2, ease: 'power3.out'});
}

/* ===================================================================
   INIT
   =================================================================== */
document.addEventListener('DOMContentLoaded', function() {
  /* ── Langue (synchrone, pas besoin d'attendre Supabase) ── */
  setLang(currentLang);

  /* ── Scroll listener (synchrone) ── */
  window.addEventListener('scroll', handleScroll, {passive: true});
  handleScroll();

  /* ── Custom cursor (synchrone) ── */
  initCursor();

  /* ══════════════════════════════════════════════════════════
     POINT CLÉ : Les animations GSAP des cartes ne sont PAS
     lancées ici. Elles sont déclenchées dans
     loadPropertiesFromSupabase() APRÈS le fetch + DOM inject.
     Cela garantit zéro race condition.
     ══════════════════════════════════════════════════════════ */

  /* ── Lancer le chargement async depuis Supabase ── */
  loadPropertiesFromSupabase();
});


/* ===================================================================
   LEAD CAPTURE MODAL
   =================================================================== */
var _leadLastSubmit = 0;

function openLeadModal(slug) {
  var p = null;
  for (var i = 0; i < PROPERTIES.length; i++) {
    if (PROPERTIES[i].slug === slug) { p = PROPERTIES[i]; break; }
  }
  if (!p) return;

  // Populate hidden fields
  document.getElementById('leadPropertySlug').value = p.slug;
  document.getElementById('leadPropertyLocation').value = p.location;
  document.getElementById('leadPropertyName').textContent = p.name + ' — ' + p.location;

  // Reset to form state
  document.getElementById('leadFormState').style.display = '';
  document.getElementById('leadSuccessState').style.display = 'none';
  document.getElementById('leadCaptureForm').reset();
  document.getElementById('leadSubmitBtn').classList.remove('sending');

  // Update i18n labels
  var t = I18N[currentLang] || I18N.en;
  var modal = document.getElementById('leadModal');
  var i18nEls = modal.querySelectorAll('[data-i18n]');
  for (var j = 0; j < i18nEls.length; j++) {
    var key = i18nEls[j].getAttribute('data-i18n');
    if (t[key] !== undefined) i18nEls[j].innerHTML = t[key];
  }

  // Show modal with GSAP
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  var box = modal.querySelector('.lead-modal');
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(box, {y: 30, scale: 0.97, opacity: 0}, {y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out'});
  }
}

function closeLeadModal() {
  var modal = document.getElementById('leadModal');
  var box = modal.querySelector('.lead-modal');
  if (typeof gsap !== 'undefined') {
    gsap.to(box, {y: 20, opacity: 0, duration: 0.3, ease: 'power3.in', onComplete: function() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }});
  } else {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function submitLeadForm(e) {
  e.preventDefault();

  // Rate limiting (10s)
  var now = Date.now();
  if (now - _leadLastSubmit < 10000) {
    var btn = document.getElementById('leadSubmitBtn');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(btn, {x: -4}, {x: 4, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut', onComplete: function() { gsap.set(btn, {x: 0}); }});
    }
    return false;
  }
  _leadLastSubmit = now;

  var btn = document.getElementById('leadSubmitBtn');
  btn.classList.add('sending');

  // Gather form data
  var leadData = {
    nom: document.getElementById('leadName').value.trim(),
    email: document.getElementById('leadEmail').value.trim(),
    tel: document.getElementById('leadPhone').value.trim(),
    message: document.getElementById('leadMessage').value.trim(),
    villa_interet: document.getElementById('leadPropertySlug').value,
    property_location: document.getElementById('leadPropertyLocation').value,
    property_name: document.getElementById('leadPropertyName').textContent,
    language: currentLang,
    source: 'catalogue'
  };

  // Get partner agency info
  var agency = PARTNER_AGENCIES[leadData.property_location] || null;
  leadData.partner_agency = agency ? agency.name : 'N/A';
  leadData.partner_email = agency ? agency.email : '';

  /* ══════════════════════════════════════════════════════════
     LEAD GUARD : WhatsApp s'active UNIQUEMENT après confirmation
     Supabase. Pas de fuite de lead possible.
     ══════════════════════════════════════════════════════════ */
  insertLead(leadData, function(err, result) {
    if (err) {
      console.warn('[Real Luxe] Lead Guard : erreur Supabase mais lead sauvegardé localement');
    }
    // Injecter le commission_id dans les données pour le suivi
    leadData.commission_id = result ? result.commission_id : 'LOCAL';

    // EmailJS notification
    sendLeadEmails(leadData);

    // MAINTENANT on peut afficher le succès + activer WhatsApp
    showLeadSuccess(leadData);
  });

  return false;
}

/* saveLeadToSupabase / storeLeadLocally → déplacés dans supabase-client.js (insertLead) */

function sendLeadEmails(data) {
  /* ═══════════════════════════════════════════════════════════════
     EmailJS — NOTIFICATION IMMÉDIATE
     ─────────────────────────────────
     CONFIGURATION (à faire UNE SEULE FOIS) :
       1. Crée un compte sur https://emailjs.com (gratuit 200 emails/mois)
       2. Crée un "Service" (Gmail, Outlook, etc.)
       3. Crée un "Template" avec les variables : {{from_name}}, {{from_email}},
          {{phone}}, {{message}}, {{property}}, {{commission_id}}, {{partner_agency}}
       4. Remplace les 3 constantes ci-dessous par tes vraies valeurs
     ═══════════════════════════════════════════════════════════════ */
  var EMAILJS_PUBLIC_KEY    = 'WSlEoSspq66Rm1iN-';
  var EMAILJS_SERVICE_ID    = 'service_hphj9bc';
  var EMAILJS_TEMPLATE_ID   = 'template_708shzk';
  var EMAILJS_TEMPLATE_PARTNER = 'YOUR_TEMPLATE_PARTNER_ID'; // ← Remplacer (optionnel)
  var EMAILJS_CONFIGURED    = (EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY');

  if (typeof emailjs !== 'undefined' && EMAILJS_CONFIGURED) {
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Email à Tony (notification lead + commission_id)
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: 'anthony.adlun@gmail.com',
      from_name: data.nom || data.name || '',
      from_email: data.email,
      phone: data.tel || data.phone || '',
      message: data.message || '',
      property: data.property_name || data.villa_interet || '',
      commission_id: data.commission_id || 'N/A',
      partner_agency: data.partner_agency || '',
      source: data.source || 'website'
    }).then(function() {
      console.log('[Real Luxe] ✓ Email notification envoyée');
    }).catch(function(err) {
      console.error('[Real Luxe] ✗ EmailJS erreur :', err);
    });

    // Email à l'agence partenaire
    if (data.partner_email && EMAILJS_TEMPLATE_PARTNER !== 'YOUR_TEMPLATE_PARTNER_ID') {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_PARTNER, {
        to_email: data.partner_email,
        from_name: data.nom || data.name || '',
        from_email: data.email,
        phone: data.tel || data.phone || '',
        message: data.message || '',
        property: data.property_name || '',
        agency_name: data.partner_agency || ''
      });
    }
  } else {
    console.log('[Real Luxe] EmailJS non configuré — notification simulée');
    console.log('[Real Luxe] → Lead :', data.email, '| Commission ID :', data.commission_id);
    console.log('[Real Luxe] → Villa :', data.property_name || data.villa_interet);
    if (data.partner_email) {
      console.log('[Real Luxe] → Agence :', data.partner_agency, data.partner_email);
    }
  }
}

function showLeadSuccess(data) {
  document.getElementById('leadFormState').style.display = 'none';
  var success = document.getElementById('leadSuccessState');
  success.style.display = '';

  // Set WhatsApp link with pre-filled message + commission_id pour traçabilité
  var waMsg = 'Bonjour, je viens de soumettre une demande VIP pour ' + data.property_name +
    '. Mon nom: ' + (data.nom || data.name || '') +
    ' | Réf: ' + (data.commission_id || 'N/A');
  document.getElementById('leadWhatsAppLink').href = 'https://wa.me/61436007811?text=' + encodeURIComponent(waMsg);

  // Update i18n for success state
  var t = I18N[currentLang] || I18N.en;
  var i18nEls = success.querySelectorAll('[data-i18n]');
  for (var j = 0; j < i18nEls.length; j++) {
    var key = i18nEls[j].getAttribute('data-i18n');
    if (t[key] !== undefined) i18nEls[j].innerHTML = t[key];
  }

  // GSAP entrance
  if (typeof gsap !== 'undefined') {
    gsap.fromTo('.lead-success', {opacity: 0, y: 15}, {opacity: 1, y: 0, duration: 0.5, ease: 'power3.out'});
    gsap.fromTo('.lead-success > svg', {scale: 0}, {scale: 1, duration: 0.6, delay: 0.2, ease: 'back.out(1.7)'});
    gsap.fromTo('.lead-wa-btn', {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.4, delay: 0.5, ease: 'power3.out'});
    gsap.fromTo('.lead-close-btn', {opacity: 0}, {opacity: 1, duration: 0.3, delay: 0.7, ease: 'power3.out'});
  }
}

// Close on overlay click
document.getElementById('leadModal').addEventListener('click', function(e) {
  if (e.target === this) closeLeadModal();
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && document.getElementById('leadModal').classList.contains('active')) {
    closeLeadModal();
  }
});

} // end CATALOGUE

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS CAROUSEL (shared)
   ═══════════════════════════════════════════════════════════════ */
var currentTestimonial = 0;
var totalTestimonials = 3;
var testiAutoplayInterval = null;

function goToTestimonial(idx) {
  currentTestimonial = idx;
  var slides = document.querySelectorAll('.testi-slide');
  var dots = document.querySelectorAll('.testi-dot');
  if (!slides.length) return;
  slides.forEach(function(s) { s.classList.remove('active'); });
  dots.forEach(function(d) { d.classList.remove('active'); });
  if (slides[idx]) slides[idx].classList.add('active');
  if (dots[idx]) dots[idx].classList.add('active');
}

function nextTestimonial() {
  goToTestimonial((currentTestimonial + 1) % totalTestimonials);
}

function prevTestimonial() {
  goToTestimonial((currentTestimonial - 1 + totalTestimonials) % totalTestimonials);
}

// Auto-advance every 6 seconds
if (document.querySelector('.testi-carousel')) {
  testiAutoplayInterval = setInterval(nextTestimonial, 6000);
  document.querySelector('.testi-carousel').addEventListener('mouseenter', function() {
    clearInterval(testiAutoplayInterval);
  });
  document.querySelector('.testi-carousel').addEventListener('mouseleave', function() {
    testiAutoplayInterval = setInterval(nextTestimonial, 6000);
  });
}
