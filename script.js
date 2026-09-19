/* REAL LUXE — Unified JavaScript Page detection via <body data-page="index|catalogue"> */

var PAGE_TYPE = document.body.getAttribute('data-page') || 'index';

/* Animation is decoration, so nothing on the page may depend on it.
 *
 * Every script tag on every page is deferred and ordered, so by the time this
 * file runs the animation library has either loaded or failed for good. When it
 * failed, a stub takes its place: calls do nothing, but completion callbacks
 * still fire, because several of them are what actually closes a modal or
 * reveals a success panel. Without this a blocked CDN leaves dialogues that
 * cannot be dismissed. */
if (typeof window.gsap === 'undefined') {
  var _stub = {
    __stub: true,
    registerPlugin: function () { return _stub; },
    killTweensOf: function () { return _stub; },
    set: function () { return _stub; },
    timeline: function () { return _stub; },
    add: function () { return _stub; },
    kill: function () { return _stub; }
  };
  var _fire = function () {
    var vars = arguments[arguments.length - 1];
    if (vars && typeof vars.onComplete === 'function') {
      setTimeout(function () { try { vars.onComplete(); } catch (e) {} }, 0);
    }
    return _stub;
  };
  _stub.to = _fire;
  _stub.from = _fire;
  _stub.fromTo = _fire;
  window.gsap = _stub;
  console.warn('[Real Luxe] Animation library unavailable — running without motion.');
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/* PAGE TRANSITION (shared across all pages) */
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

/* Applies config.js to the markup. Runs on every page.

   The rule throughout: a setting left empty removes the element it drives
   rather than leaving an empty row, a dead link or a "+undefined" telephone
   number. That is what makes the shipped configuration safe to publish. */
function applyContactConfig() {
  if (!window.RL) return;
  var get = window.RL.get;

  var email    = get('contact.email');
  var phone    = get('contact.phone');
  var whatsapp = get('contact.whatsapp');
  var office1  = get('contact.office.line1');
  var office2  = get('contact.office.line2');

  /* Contact rows */
  document.querySelectorAll('[data-contact]').forEach(function (row) {
    var kind = row.getAttribute('data-contact');
    var slot = row.querySelector('.ci-value');
    var value = '';
    if (kind === 'phone' && phone) {
      value = '<a href="tel:' + phone.replace(/[^\d+]/g, '') + '">' + escapeHtml(phone) + '</a>';
    } else if (kind === 'email' && email) {
      value = '<a href="mailto:' + encodeURI(email) + '">' + escapeHtml(email) + '</a>';
    } else if (kind === 'office' && (office1 || office2)) {
      value = escapeHtml(office1) + (office2 ? '<br>' + escapeHtml(office2) : '');
    }
    if (value && slot) { slot.innerHTML = value; row.hidden = false; }
    else { row.hidden = true; }
  });

  /* Secondary calls to action: email when there is an address, otherwise the form */
  document.querySelectorAll('[data-contact-cta]').forEach(function (el) {
    if (email) {
      el.setAttribute('href', 'mailto:' + encodeURI(email) + '?subject=' +
        encodeURIComponent('Property enquiry'));
    } else {
      el.setAttribute('href', 'catalogue.html');
      el.addEventListener('click', function (e) {
        if (PAGE_TYPE === 'index') {
          e.preventDefault();
          if (typeof closePropertyDetail === 'function') closePropertyDetail();
          scrollToSection('contact');
        }
      });
    }
  });

  /* Floating shortcut. It stays out of the way over the hero, which already
     carries two calls to action, and appears once the visitor scrolls past. */
  var waBtn = document.getElementById('waBtn');
  if (waBtn) {
    var toggle = function () {
      waBtn.classList.toggle('visible', window.scrollY > window.innerHeight * 0.7);
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
  }
  if (waBtn && whatsapp) {
    waBtn.setAttribute('href', 'https://wa.me/' + whatsapp);
    waBtn.setAttribute('target', '_blank');
    waBtn.setAttribute('rel', 'noopener');
    waBtn.onclick = null;
  }

  /* Anything marked as WhatsApp-only disappears without a number */
  document.querySelectorAll('[data-requires="whatsapp"]').forEach(function (el) {
    if (!whatsapp) el.remove();
  });

  /* Brand name and copyright year */
  var brand = get('brand.fullName', 'Real Luxe');
  document.querySelectorAll('[data-brand]').forEach(function (el) { el.textContent = brand; });
  var year = new Date().getFullYear();
  var founded = parseInt(get('brand.foundedYear', 0), 10);
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = (founded && founded < year) ? founded + '–' + year : String(year);
  });

  /* Social links */
  var socials = document.getElementById('ftSocials');
  if (socials && !socials.childElementCount) {
    var icons = {
      instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
      linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
      facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'
    };
    Object.keys(icons).forEach(function (key) {
      var url = get('social.' + key);
      if (!url) return;
      var a = document.createElement('a');
      a.className = 'ft-social';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', key.charAt(0).toUpperCase() + key.slice(1));
      a.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' + icons[key] + '</svg>';
      socials.appendChild(a);
    });
  }
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* The demonstration notice, dismissible and remembered for the session. */
function initSiteNotice() {
  var bar = document.getElementById('siteNotice');
  if (!bar) return;
  var on = window.RL && window.RL.get('notice.enabled', false) === true;
  var text = window.RL ? window.RL.get('notice.text') : '';
  var dismissed = false;
  try { dismissed = sessionStorage.getItem('rl-notice') === 'off'; } catch (e) {}

  if (!on || !text || dismissed) { bar.remove(); return; }

  var slot = document.getElementById('siteNoticeText');
  if (slot) slot.textContent = text;
  bar.hidden = false;
  document.body.classList.add('has-notice');

  /* The fixed header is offset by this, so it has to track the real height. */
  var syncHeight = function () {
    document.documentElement.style.setProperty('--notice-h', bar.offsetHeight + 'px');
  };
  syncHeight();
  window.addEventListener('resize', syncHeight, { passive: true });

  var close = bar.querySelector('.site-notice-close');
  if (close) close.addEventListener('click', function () {
    bar.remove();
    document.body.classList.remove('has-notice');
    document.documentElement.style.removeProperty('--notice-h');
    try { sessionStorage.setItem('rl-notice', 'off'); } catch (e) {}
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initSiteNotice();
  applyContactConfig();
});

/* PROPERTY DETAIL (shared across index + catalogue) */
let pdMap = null;
let currentGalleryIdx = 0;
let currentProperty = null;

function openPropertyDetail(slug, clickEvent) {
  const p = PROPERTIES.find(function(pr){ return pr.slug === slug; });
  if (!p) return;
  currentProperty = p;
  currentGalleryIdx = 0;

  // Shared element transition: capture source card rect
  var cardRect = null;
  if (clickEvent) {
    var srcCard = clickEvent.currentTarget || clickEvent.target.closest('.prop-card, .cat-card');
    if (srcCard) {
      var imgEl = srcCard.querySelector('.prop-img, .cat-card-img');
      if (imgEl) cardRect = imgEl.getBoundingClientRect();
    }
  }

  // Fill gallery (falls back when there are no images)
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

  // Data-rich sections: investment roi + technical specs
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

  /* The card grows into the gallery image. It is pure decoration and it hides
     the gallery image while it runs, so it is skipped entirely without a real
     animation library — otherwise the image would stay invisible. */
  if (cardRect && !gsap.__stub && !prefersReducedMotion()) {
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
          clone.remove();
        }
      });
    });

    setTimeout(function(){
      galleryMain.style.opacity = '1';
      if (clone.parentNode) clone.remove();
    }, 1500);
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
  if (!mapEl) return;
  if (pdMap) { pdMap.remove(); pdMap = null; }

  /* An empty grey rectangle reads as a broken page. If the tile library is
     blocked, offer the coordinates instead. */
  if (typeof L === 'undefined') {
    mapEl.innerHTML = '<a class="pd-map-fallback" target="_blank" rel="noopener" href="' +
      'https://www.openstreetmap.org/?mlat=' + p.lat + '&mlon=' + p.lng +
      '#map=14/' + p.lat + '/' + p.lng + '">View ' + escapeHtml(p.location || 'this location') +
      ' on a map</a>';
    return;
  }

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

/* INDEX PAGE */
if (PAGE_TYPE === 'index') {

// Security utilities
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

// I18n translations
let currentLang = localStorage.getItem('rl-lang') || 'en';
if (!['en','fr','es'].includes(currentLang)) { currentLang = 'en'; localStorage.setItem('rl-lang','en'); }
/* Translations for the home page. Keys match the data-i18n attributes in
   index.html; a key missing from a language falls back to the markup. */
const I18N = {
  en: {
    nav_0:'Listings', nav_1:'Approach', nav_2:'Confotur', nav_3:'Contact', nav_team:'Team',
    nav_cta:'Arrange a viewing',
    hero_badge:'Cap Cana &middot; Punta Cana &middot; Bayah&iacute;be &middot; Saman&aacute;',
    hero_title:'Coastal property in the<br><em>Dominican Republic</em>',
    hero_sub:'A small desk handling a short list of houses, estates and apartments on the east and north coasts. We check the title and the Confotur certificate before a property appears here, and see a purchase through to registration.',
    hero_btn1:'See the listings', hero_btn2:'Arrange a viewing',
    stat_0:'Coastal areas', stat_1:'Entry price', stat_2:'Confotur exemption',
    props_label:'Current listings', props_title:'Selected <em>houses</em>',
    props_sub:'Five properties are on the books at present. We have been round all of them and checked the title and the Confotur status.',
    props_btn:'Full catalogue',
    vault_label:'Off-market', vault_title:'Not <em>publicly listed</em>',
    vault_sub:'Twelve further properties are withheld from public listing, usually at the seller&rsquo;s request. Viewing them requires a signed non-disclosure agreement and evidence of funds.',
    vault_stat_0:'Properties', vault_stat_1:'Combined asking', vault_stat_2:'Required',
    vault_btn:'Request access',
    vault_form_title:'Request access',
    vault_form_sub:'We reply with the non-disclosure agreement and the current off-market list. Nothing is shared with the sellers until you ask us to.',
    vault_f_name:'Full name', vault_f_email:'Email', vault_f_phone:'Telephone',
    vault_f_budget:'Budget', vault_f_budget_ph:'Select a range',
    vault_f_msg:'Anything we should know (optional)', vault_f_submit:'Send request',
    about_label:'Approach', about_title:'How we<br><em>work</em>',
    about_sub:'We are a small desk. One adviser takes a purchase from the first viewing through the notary and the Title Registry, and is still the one you ring afterwards.',
    af_0_title:'Title checked first', af_0_desc:'The deslinde and the Confotur certificate are checked before a property is shown to anyone. If the survey has not been registered you will hear it from us on the first call.',
    af_1_title:'One point of contact', af_1_desc:'Whoever shows you the house takes it through the notary and on to registration.',
    af_2_title:'Discretion', af_2_desc:'Names and figures stay inside the file. Off-market sellers list with us on that basis.',
    af_3_title:'After completion', af_3_desc:'Rental management, staffing and maintenance go out to firms we have used ourselves and can vouch for.',
    confotur_label:'Tax status', confotur_title:'The <em>Confotur</em> regime',
    confotur_sub:'Law 158-01 exempts qualifying tourism developments from most property taxation for fifteen years. The certificate attaches to the development rather than to the owner, so it travels with the title when the property changes hands.',
    cc_0_title:'Fifteen years<br><em>exempt</em>', cc_0_desc:'For fifteen years from the date on the certificate you pay no 3% transfer duty on purchase, no 1% annual property tax, no tax on rental income and no capital gains tax when you sell.', cc_0_tag0:'0% transfer duty', cc_0_tag1:'0% capital gains',
    cc_1_title:'Residency<br><em>by investment</em>', cc_1_desc:'A property purchase of USD 200,000 or more opens the investor residency route. Filing normally takes three to six months once the paperwork is in. We introduce the immigration lawyers; the application is theirs to make.', cc_1_tag0:'From $200,000', cc_1_tag1:'3&ndash;6 months',
    cc_2_title:'What the<br><em>lettings return</em>', cc_2_desc:'Well-run short lets in Punta Cana and Cap Cana have been returning 7&ndash;10% gross. September and October are thin. The figures below assume professional management.', cc_2_tag0:'7&ndash;10% gross', cc_2_tag1:'Seasonal',
    calc_title:'What the exemption is <em>worth</em>',
    calc_sub_text:'Enter a purchase price to see the tax a Confotur-certified title avoids over fifteen years.',
    calc_l0:'Transfer duty', calc_l1:'Property tax, 15 yrs', calc_l2:'Tax on rental income', calc_l3:'Capital gains tax',
    calc_total_label:'Estimated total over fifteen years',
    calc_note:'An illustration at current rates, assuming full occupancy of the exemption period. It is not tax advice; confirm the figures with a Dominican tax adviser before you rely on them.',
    life_label:'Nearby', life_title:'What is <em>around</em>',
    life_sub:'The four corridors we cover are within ninety minutes of an international airport. These are the places our buyers use most.',
    fo_label:'Services', fo_title:'Beyond the<br><em>transaction</em>',
    fo_sub:'Four things buyers ask us for most often. Each is delivered by a firm we work with regularly, and billed by them directly.',
    fo_0_title:'Legal and notarial', fo_0_sub:'Due diligence &middot; structure &middot; closing', fo_0_body:'A Dominican firm runs the title search, confirms the deslinde is registered and the property is free of charges, and advises whether to hold personally or through a company. They draft the promise of sale and attend the closing. Registration at the Title Registry takes four to eight weeks.',
    fo_1_title:'Staff and security', fo_1_sub:'Household &middot; grounds &middot; monitoring', fo_1_body:'The firm we use handles recruitment and payroll for household staff: cook, housekeeper, gardener, driver. Most gated developments include perimeter security. On a standalone plot you want a monitored system and a caretaker living on site. We arrange both.',
    fo_2_title:'Getting there', fo_2_sub:'Charter &middot; berths &middot; transfers', fo_2_body:'Punta Cana takes direct flights from most of Europe and the eastern United States. For private aircraft, the FBO at PUJ handles the arrival. Berths at Cap Cana and Casa de Campo are leased annually and are usually the constraint.',
    fo_3_title:'Letting and upkeep', fo_3_sub:'Management &middot; insurance &middot; reporting', fo_3_body:'Management companies take 20&ndash;25% of gross rental revenue and handle listings, guests, cleaning and maintenance. Hurricane cover is a separate policy and worth reading closely. Expect quarterly statements.',
    testi_label:'Buyers', testi_title:'In their<br><em>own words</em>',
    contact_label:'Contact', contact_title:'Tell us what<br><em>you are after</em>',
    contact_sub:'We ask three questions, then your details. Replies go out within one working day, in English, French or Spanish.',
    contact_info_title:'Before you write',
    contact_info_body:'It helps to know the area, the budget and whether the property is for your own use or to let. If you already have a shortlist from elsewhere, send it over and we will tell you plainly what we think of it.',
    ci_phone:'Telephone', ci_email:'Email', ci_office:'Office',
    tunnel_title:'Arrange a viewing', tunnel_sub:'Three steps, about a minute',
    t_step1_title:'What is the property for?',
    t_opt0:'Main home', t_opt0_sub:'Living here most of the year',
    t_opt1:'Second home', t_opt1_sub:'Yours, used a few months a year',
    t_opt2:'Letting', t_opt2_sub:'Bought to rent out',
    t_step2_title:'Roughly what budget?',
    t_step2_confotur:'Only show me Confotur-certified properties',
    t_step3_title:'Where should we reply?',
    t_lbl0:'First name', t_lbl1:'Last name', t_lbl2:'Email', t_lbl3:'Telephone <span class="f-optional">optional</span>',
    t_back:'Back', t_next:'Next', t_submit:'Send',
    t_success_title:'Received',
    t_success_msg:'An adviser will reply within one working day. If it is urgent, say so in your reply to the confirmation and we will call instead.',
    partners_label:'Process', partners_title:'How a purchase<br><em>actually runs</em>',
    partners_sub:'From first enquiry to registered title is typically three to five months. The slow parts are the survey and the Title Registry.',
    pstep_0_title:'Brief and shortlist', pstep_0_desc:'A call comes first, to settle the area and the budget, and whether the place is to live in or to let. Five to eight properties follow, off-market ones included, faults and all.', pstep_0_time:'Week 1',
    pstep_1_title:'Viewing trip', pstep_1_desc:'Two or three days on the ground, usually four properties a day. We drive; the developers do not. You will also see the roads, the supermarket and the hospital, because those are what decide whether a house works once you are living in it. Plan on being tired by the end of the second day.', pstep_1_time:'Weeks 2&ndash;4',
    pstep_2_title:'Offer and due diligence', pstep_2_desc:'You sign a promise of sale and 10% goes into escrow, conditional on the title search. The lawyer confirms the deslinde, the absence of charges and the Confotur certificate. Withdraw if anything fails and the deposit returns.', pstep_2_time:'Weeks 4&ndash;8',
    pstep_3_title:'Closing and registration', pstep_3_desc:'The closing itself is a signature before a notary, the balance transferred and the keys handed over. The Title Registry then issues the certificate in your name, four to eight weeks and occasionally longer.', pstep_3_time:'Months 3&ndash;5',
    psvc_0_title:'Legal and tax', psvc_0_desc:'Dominican firms run the title searches, the Confotur compliance and the holding structure. They bill you directly at their own rates, and we tell you what those are before you instruct anyone. They are also the ones chasing the Title Registry afterwards.',
    psvc_1_title:'Letting management', psvc_1_desc:'We introduce two or three management firms, all taking 20&ndash;25% of gross revenue for listings, guests, cleaning and maintenance.',
    psvc_2_title:'Architects and builders', psvc_2_desc:'For plots, and for refurbishing what is already standing. Salt and wind load make coastal construction a trade of its own, and drainage is where a cheap contractor will cost you.',
    psvc_3_title:'Residency', psvc_3_desc:'Immigration lawyers file the investor residency applications. Three to six months is normal, and they are blunt about the awkward cases.',
    wa_text:'Enquire',
    card_beds:'bed', card_baths:'bath',
    pd_cta_visit:'Arrange a viewing', pd_cta_whatsapp:'Request the dossier',
    ft_desc:'Coastal property in the Dominican Republic. Cap Cana, Punta Cana, Bayah&iacute;be and Saman&aacute;.',
    ft_nav:'Site', ft_svc:'Services', ft_dest:'Areas', ft_catalogue:'Full catalogue',
    ft_svc_0:'Buying process', ft_svc_1:'Letting management', ft_svc_2:'Legal and notarial', ft_svc_3:'Residency',
    ft_privacy:'Privacy policy'
  },

  fr: {
    nav_0:'Biens', nav_1:'Méthode', nav_2:'Confotur', nav_3:'Contact', nav_team:'Équipe',
    nav_cta:'Organiser une visite',
    hero_badge:'Cap Cana &middot; Punta Cana &middot; Bayah&iacute;be &middot; Saman&aacute;',
    hero_title:'Biens côtiers en<br><em>République dominicaine</em>',
    hero_sub:'Un cabinet restreint, qui suit un nombre limité de maisons, domaines et appartements sur les côtes est et nord. Nous vérifions le titre et le certificat Confotur avant qu&rsquo;un bien ne figure ici, et accompagnons l&rsquo;achat jusqu&rsquo;à l&rsquo;enregistrement.',
    hero_btn1:'Voir les biens', hero_btn2:'Organiser une visite',
    stat_0:'Zones côtières', stat_1:'Prix d&rsquo;entrée', stat_2:'Exonération Confotur',
    props_label:'Biens disponibles', props_title:'Maisons <em>sélectionnées</em>',
    props_sub:'Cinq biens sont actuellement au portefeuille. Nous sommes allés voir chacun d&rsquo;eux et avons vérifié le titre et le statut Confotur.',
    props_btn:'Catalogue complet',
    vault_label:'Hors marché', vault_title:'Non <em>publiés</em>',
    vault_sub:'Douze biens supplémentaires ne sont pas publiés, le plus souvent à la demande du vendeur. Leur visite suppose un accord de confidentialité signé et un justificatif de fonds.',
    vault_stat_0:'Biens', vault_stat_1:'Total demandé', vault_stat_2:'Requis',
    vault_btn:'Demander l&rsquo;accès',
    vault_form_title:'Demander l&rsquo;accès',
    vault_form_sub:'Nous répondons avec l&rsquo;accord de confidentialité et la liste hors marché du moment. Rien n&rsquo;est transmis aux vendeurs sans votre accord.',
    vault_f_name:'Nom complet', vault_f_email:'E-mail', vault_f_phone:'Téléphone',
    vault_f_budget:'Budget', vault_f_budget_ph:'Choisir une fourchette',
    vault_f_msg:'Précisions (facultatif)', vault_f_submit:'Envoyer',
    about_label:'Méthode', about_title:'Notre<br><em>façon de faire</em>',
    about_sub:'Nous sommes un cabinet restreint. Un conseiller suit l&rsquo;achat de la première visite jusqu&rsquo;au notaire et au registre foncier, et reste celui que vous appelez ensuite.',
    af_0_title:'Le titre d&rsquo;abord', af_0_desc:'Le deslinde et le certificat Confotur sont vérifiés avant la visite, pas après l&rsquo;offre.',
    af_1_title:'Un seul interlocuteur', af_1_desc:'Le conseiller qui vous fait visiter suit le notaire, le transfert et l&rsquo;enregistrement.',
    af_2_title:'Discrétion', af_2_desc:'Les noms et les montants restent dans le dossier. Les vendeurs hors marché nous confient leurs biens à cette condition.',
    af_3_title:'Après la vente', af_3_desc:'Gestion locative, personnel et entretien sont confiés à des sociétés que nous avons nous-mêmes employées.',
    confotur_label:'Fiscalité', confotur_title:'Le régime <em>Confotur</em>',
    confotur_sub:'La loi 158-01 exonère les programmes touristiques éligibles de l&rsquo;essentiel de la fiscalité immobilière pendant quinze ans. Le certificat est attaché au programme plutôt qu&rsquo;au propriétaire, il suit donc le titre lors d&rsquo;une revente.',
    cc_0_title:'Quinze ans<br><em>d&rsquo;exonération</em>', cc_0_desc:'Ni droit de mutation de 3%, ni taxe foncière annuelle de 1%, ni impôt sur les loyers, ni impôt sur la plus-value de revente, pendant quinze ans à compter du certificat.', cc_0_tag0:'0% de mutation', cc_0_tag1:'0% de plus-value',
    cc_1_title:'Résidence<br><em>par investissement</em>', cc_1_desc:'Un achat de 200 000 USD ou plus ouvre la voie de la résidence investisseur. Le dossier prend en général trois à six mois. Nous présentons les avocats en immigration ; nous ne déposons pas le dossier.', cc_1_tag0:'À partir de 200 000 $', cc_1_tag1:'3 à 6 mois',
    cc_2_title:'Ce que rapporte<br><em>la location</em>', cc_2_desc:'Bien gérées, les locations courte durée à Punta Cana et Cap Cana rapportent 7 à 10% bruts. La demande est saisonnière : septembre et octobre sont creux, et ces chiffres supposent une gestion professionnelle.', cc_2_tag0:'7 à 10% bruts', cc_2_tag1:'Saisonnier',
    calc_title:'Ce que vaut <em>l&rsquo;exonération</em>',
    calc_sub_text:'Indiquez un prix d&rsquo;achat pour voir l&rsquo;impôt qu&rsquo;un titre certifié Confotur évite sur quinze ans.',
    calc_l0:'Droit de mutation', calc_l1:'Taxe foncière, 15 ans', calc_l2:'Impôt sur les loyers', calc_l3:'Impôt sur la plus-value',
    calc_total_label:'Total estimé sur quinze ans',
    calc_note:'Illustration aux taux actuels, sur la durée complète de l&rsquo;exonération. Ce n&rsquo;est pas un conseil fiscal : faites confirmer ces montants par un fiscaliste dominicain.',
    life_label:'Aux alentours', life_title:'Ce qu&rsquo;il y a <em>autour</em>',
    life_sub:'Les quatre secteurs que nous couvrons sont à moins de quatre-vingt-dix minutes d&rsquo;un aéroport international. Voici les adresses que nos acquéreurs fréquentent.',
    fo_label:'Services', fo_title:'Au-delà de<br><em>la transaction</em>',
    fo_sub:'Les quatre demandes les plus fréquentes. Chacune est assurée par un cabinet avec lequel nous travaillons régulièrement, et facturée par lui.',
    fo_0_title:'Juridique et notarial', fo_0_sub:'Audit &middot; structure &middot; signature', fo_0_body:'Un cabinet dominicain effectue la recherche de titre, confirme que le deslinde est enregistré et le bien libre de charges, et conseille sur la détention en nom propre ou par société. Il rédige la promesse de vente et assiste à la signature. L&rsquo;enregistrement prend quatre à huit semaines.',
    fo_1_title:'Personnel et sécurité', fo_1_sub:'Maison &middot; jardins &middot; surveillance', fo_1_body:'Recrutement et paie du personnel de maison : cuisinier, gouvernante, jardinier, chauffeur. La plupart des résidences fermées assurent la sécurité périmétrique ; sur terrain isolé, nous mettons en place une télésurveillance et un gardien résident.',
    fo_2_title:'S&rsquo;y rendre', fo_2_sub:'Affrètement &middot; anneaux &middot; transferts', fo_2_body:'Punta Cana est desservie en direct depuis la majeure partie de l&rsquo;Europe et de la côte est américaine. Pour l&rsquo;aviation privée, le FBO de PUJ gère l&rsquo;arrivée. Les anneaux de Cap Cana et Casa de Campo se louent à l&rsquo;année et constituent souvent la contrainte : demandez tôt.',
    fo_3_title:'Location et entretien', fo_3_sub:'Gestion &middot; assurance &middot; reporting', fo_3_body:'Les sociétés de gestion prélèvent 20 à 25% du revenu locatif brut et prennent en charge annonces, voyageurs, ménage et maintenance. La garantie cyclone fait l&rsquo;objet d&rsquo;un contrat distinct, à lire de près. Comptez un relevé trimestriel.',
    testi_label:'Acquéreurs', testi_title:'Dans leurs<br><em>propres mots</em>',
    contact_label:'Contact', contact_title:'Dites-nous ce que<br><em>vous cherchez</em>',
    contact_sub:'Nous posons trois questions, puis nous vous demandons vos coordonnées. Les réponses partent sous un jour ouvré, en français, anglais ou espagnol.',
    contact_info_title:'Avant d&rsquo;écrire',
    contact_info_body:'Il est utile de connaître le secteur, le budget, et si le bien est destiné à votre usage ou à la location. Si vous avez déjà une sélection faite ailleurs, envoyez-la et nous vous dirons franchement ce que nous en pensons.',
    ci_phone:'Téléphone', ci_email:'E-mail', ci_office:'Bureau',
    tunnel_title:'Organiser une visite', tunnel_sub:'Trois étapes, environ une minute',
    t_step1_title:'À quoi le bien est-il destiné ?',
    t_opt0:'Résidence principale', t_opt0_sub:'Y vivre la majeure partie de l&rsquo;année',
    t_opt1:'Résidence secondaire', t_opt1_sub:'À vous, quelques mois par an',
    t_opt2:'Location', t_opt2_sub:'Acheté pour être loué',
    t_step2_title:'Quel budget, approximativement ?',
    t_step2_confotur:'Ne me montrer que des biens certifiés Confotur',
    t_step3_title:'Où devons-nous répondre ?',
    t_lbl0:'Prénom', t_lbl1:'Nom', t_lbl2:'E-mail', t_lbl3:'Téléphone <span class="f-optional">facultatif</span>',
    t_back:'Retour', t_next:'Suivant', t_submit:'Envoyer',
    t_success_title:'Bien reçu',
    t_success_msg:'Un conseiller répondra sous un jour ouvré. Si c&rsquo;est urgent, dites-le en réponse à la confirmation et nous appellerons.',
    partners_label:'Déroulé', partners_title:'Comment se déroule<br><em>un achat</em>',
    partners_sub:'De la première demande au titre enregistré, comptez trois à cinq mois. Les délais viennent du bornage et du registre foncier.',
    pstep_0_title:'Cadrage et sélection', pstep_0_desc:'Un appel pour établir le secteur, le budget et l&rsquo;usage. Nous envoyons cinq à huit biens, y compris hors marché s&rsquo;ils correspondent, avec leurs défauts autant que leurs qualités.', pstep_0_time:'Semaine 1',
    pstep_1_title:'Voyage de visite', pstep_1_desc:'Deux ou trois jours sur place, environ quatre biens par jour. C&rsquo;est nous qui conduisons, pas les promoteurs. Vous verrez aussi les routes, le supermarché et l&rsquo;hôpital, car c&rsquo;est ce qui rend une maison vivable.', pstep_1_time:'Semaines 2 à 4',
    pstep_2_title:'Offre et audit', pstep_2_desc:'Une promesse de vente avec 10% séquestrés, sous condition de la recherche de titre. L&rsquo;avocat confirme le deslinde, l&rsquo;absence de charges et le certificat Confotur. En cas d&rsquo;anomalie, vous vous retirez et le dépôt vous revient.', pstep_2_time:'Semaines 4 à 8',
    pstep_3_title:'Signature et enregistrement', pstep_3_desc:'Signature devant notaire, solde viré, remise des clés. Le registre foncier délivre ensuite le certificat à votre nom, sous quatre à huit semaines, parfois davantage.', pstep_3_time:'Mois 3 à 5',
    psvc_0_title:'Juridique et fiscal', psvc_0_desc:'Cabinets dominicains pour la recherche de titre, la conformité Confotur et la structure de détention. Ils facturent directement, à des tarifs que nous vous indiquons avant de les saisir.',
    psvc_1_title:'Gestion locative', psvc_1_desc:'Annonces, voyageurs, ménage et maintenance pour 20 à 25% du revenu brut. Nous en présentons deux ou trois, vous choisissez.',
    psvc_2_title:'Architectes et constructeurs', psvc_2_desc:'Pour les terrains comme pour les rénovations. La construction en bord de mer a ses exigences — sel, vent, drainage — et le mauvais entrepreneur coûte cher.',
    psvc_3_title:'Résidence', psvc_3_desc:'Avocats en immigration qui déposent les dossiers de résidence investisseur. Trois à six mois, et ils vous diront honnêtement si votre cas est simple.',
    wa_text:'Nous écrire',
    card_beds:'ch.', card_baths:'sdb',
    pd_cta_visit:'Organiser une visite', pd_cta_whatsapp:'Demander le dossier',
    ft_desc:'Biens côtiers en République dominicaine. Cap Cana, Punta Cana, Bayah&iacute;be et Saman&aacute;.',
    ft_nav:'Site', ft_svc:'Services', ft_dest:'Secteurs', ft_catalogue:'Catalogue complet',
    ft_svc_0:'Déroulé de l&rsquo;achat', ft_svc_1:'Gestion locative', ft_svc_2:'Juridique et notarial', ft_svc_3:'Résidence',
    ft_privacy:'Politique de confidentialité'
  },

  es: {
    nav_0:'Propiedades', nav_1:'Método', nav_2:'Confotur', nav_3:'Contacto', nav_team:'Equipo',
    nav_cta:'Concertar una visita',
    hero_badge:'Cap Cana &middot; Punta Cana &middot; Bayah&iacute;be &middot; Saman&aacute;',
    hero_title:'Propiedad costera en la<br><em>República Dominicana</em>',
    hero_sub:'Una oficina pequeña que lleva un número reducido de casas, fincas y apartamentos en las costas este y norte. Comprobamos el título y el certificado Confotur antes de publicar una propiedad, y acompañamos la compra hasta el registro.',
    hero_btn1:'Ver las propiedades', hero_btn2:'Concertar una visita',
    stat_0:'Zonas costeras', stat_1:'Precio de entrada', stat_2:'Exención Confotur',
    props_label:'En cartera', props_title:'Casas <em>seleccionadas</em>',
    props_sub:'Ahora mismo hay cinco propiedades en cartera. Hemos estado en todas y comprobado el título y la situación Confotur.',
    props_btn:'Catálogo completo',
    vault_label:'Fuera de mercado', vault_title:'Sin <em>publicar</em>',
    vault_sub:'Otras doce propiedades no se publican, normalmente a petición del vendedor. Verlas requiere un acuerdo de confidencialidad firmado y acreditación de fondos.',
    vault_stat_0:'Propiedades', vault_stat_1:'Total solicitado', vault_stat_2:'Necesario',
    vault_btn:'Solicitar acceso',
    vault_form_title:'Solicitar acceso',
    vault_form_sub:'Respondemos con el acuerdo de confidencialidad y la lista fuera de mercado vigente. No compartimos nada con los vendedores hasta que usted lo pida.',
    vault_f_name:'Nombre completo', vault_f_email:'Correo', vault_f_phone:'Teléfono',
    vault_f_budget:'Presupuesto', vault_f_budget_ph:'Elija un rango',
    vault_f_msg:'Algo que debamos saber (opcional)', vault_f_submit:'Enviar',
    about_label:'Método', about_title:'Cómo<br><em>trabajamos</em>',
    about_sub:'Somos una oficina pequeña. Un asesor lleva la compra desde la primera visita hasta el notario y el Registro de Títulos, y sigue siendo a quien usted llama después.',
    af_0_title:'Primero el título', af_0_desc:'El deslinde y el certificado Confotur se verifican antes de enseñar la propiedad, no después de la oferta.',
    af_1_title:'Un solo interlocutor', af_1_desc:'El asesor que le enseña la casa lleva el notario, el traspaso y el registro.',
    af_2_title:'Discreción', af_2_desc:'Los nombres y las cifras no salen del expediente. Los vendedores fuera de mercado nos confían su propiedad por eso.',
    af_3_title:'Después de la compra', af_3_desc:'Gestión de alquiler, personal y mantenimiento van a empresas que nosotros mismos hemos usado.',
    confotur_label:'Fiscalidad', confotur_title:'El régimen <em>Confotur</em>',
    confotur_sub:'La ley 158-01 exime a los desarrollos turísticos cualificados de la mayor parte de la fiscalidad inmobiliaria durante quince años. El certificado queda unido al desarrollo, de modo que acompaña al título cuando la propiedad cambia de manos.',
    cc_0_title:'Quince años<br><em>de exención</em>', cc_0_desc:'Sin el 3% de impuesto de transferencia, sin el 1% de impuesto anual, sin impuesto sobre los alquileres ni sobre la plusvalía en la reventa, durante quince años desde el certificado.', cc_0_tag0:'0% de transferencia', cc_0_tag1:'0% de plusvalía',
    cc_1_title:'Residencia<br><em>por inversión</em>', cc_1_desc:'Una compra de 200.000 USD o más abre la vía de residencia por inversión. El expediente suele tardar de tres a seis meses. Presentamos a los abogados de inmigración; no lo tramitamos nosotros.', cc_1_tag0:'Desde 200.000 $', cc_1_tag1:'3 a 6 meses',
    cc_2_title:'Lo que deja<br><em>el alquiler</em>', cc_2_desc:'Bien gestionados, los alquileres de corta estancia en Punta Cana y Cap Cana vienen dando un 7 a 10% bruto. La demanda es estacional: septiembre y octubre son flojos, y estas cifras suponen gestión profesional.', cc_2_tag0:'7 a 10% bruto', cc_2_tag1:'Estacional',
    calc_title:'Cuánto vale <em>la exención</em>',
    calc_sub_text:'Introduzca un precio de compra para ver el impuesto que un título con Confotur evita en quince años.',
    calc_l0:'Impuesto de transferencia', calc_l1:'Impuesto anual, 15 años', calc_l2:'Impuesto sobre alquileres', calc_l3:'Impuesto de plusvalía',
    calc_total_label:'Total estimado en quince años',
    calc_note:'Una ilustración a los tipos actuales, suponiendo el periodo completo de exención. No es asesoramiento fiscal: confirme las cifras con un asesor dominicano antes de basarse en ellas.',
    life_label:'Alrededor', life_title:'Qué hay <em>cerca</em>',
    life_sub:'Los cuatro corredores que cubrimos están a menos de noventa minutos de un aeropuerto internacional. Estos son los sitios que más usan nuestros compradores.',
    fo_label:'Servicios', fo_title:'Más allá de<br><em>la compraventa</em>',
    fo_sub:'Las cuatro cosas que más nos piden. Cada una la presta una firma con la que trabajamos habitualmente, y la factura ella.',
    fo_0_title:'Legal y notarial', fo_0_sub:'Revisión &middot; estructura &middot; cierre', fo_0_body:'Una firma dominicana hace la búsqueda de título, confirma que el deslinde está registrado y la propiedad libre de cargas, y aconseja si conviene comprar a título personal o por sociedad. Redacta la promesa de venta y asiste al cierre. El registro tarda de cuatro a ocho semanas.',
    fo_1_title:'Personal y seguridad', fo_1_sub:'Casa &middot; jardines &middot; vigilancia', fo_1_body:'Selección y nómina del personal doméstico: cocinero, ama de llaves, jardinero, chófer. La mayoría de los residenciales cerrados incluyen seguridad perimetral; en parcelas aisladas montamos un sistema monitorizado y un cuidador residente.',
    fo_2_title:'Cómo llegar', fo_2_sub:'Vuelo privado &middot; amarres &middot; traslados', fo_2_body:'Punta Cana tiene vuelos directos desde gran parte de Europa y del este de Estados Unidos. Para aviación privada, el FBO de PUJ gestiona la llegada. Los amarres de Cap Cana y Casa de Campo se arriendan por años y suelen ser la limitación: pregunte pronto.',
    fo_3_title:'Alquiler y mantenimiento', fo_3_sub:'Gestión &middot; seguro &middot; informes', fo_3_body:'Las gestoras se quedan un 20 a 25% de los ingresos brutos y llevan anuncios, huéspedes, limpieza y mantenimiento. La cobertura de huracán es una póliza aparte y conviene leerla con calma. Cuente con informes trimestrales.',
    testi_label:'Compradores', testi_title:'En sus<br><em>propias palabras</em>',
    contact_label:'Contacto', contact_title:'Cuéntenos qué<br><em>está buscando</em>',
    contact_sub:'Le hacemos tres preguntas y le pedimos sus datos. Respondemos en un día laborable, en español, inglés o francés.',
    contact_info_title:'Antes de escribir',
    contact_info_body:'Ayuda saber la zona, el presupuesto y si la propiedad es para uso propio o para alquilar. Si ya tiene una lista hecha en otro sitio, mándela y le diremos con franqueza qué nos parece.',
    ci_phone:'Teléfono', ci_email:'Correo', ci_office:'Oficina',
    tunnel_title:'Concertar una visita', tunnel_sub:'Tres pasos, alrededor de un minuto',
    t_step1_title:'¿Para qué es la propiedad?',
    t_opt0:'Vivienda habitual', t_opt0_sub:'Vivir aquí la mayor parte del año',
    t_opt1:'Segunda residencia', t_opt1_sub:'Suya, unos meses al año',
    t_opt2:'Alquiler', t_opt2_sub:'Comprada para alquilar',
    t_step2_title:'¿Qué presupuesto, aproximadamente?',
    t_step2_confotur:'Enséñenme solo propiedades con Confotur',
    t_step3_title:'¿Dónde le respondemos?',
    t_lbl0:'Nombre', t_lbl1:'Apellidos', t_lbl2:'Correo', t_lbl3:'Teléfono <span class="f-optional">opcional</span>',
    t_back:'Atrás', t_next:'Siguiente', t_submit:'Enviar',
    t_success_title:'Recibido',
    t_success_msg:'Un asesor responderá en un día laborable. Si es urgente, dígalo al responder a la confirmación y le llamamos.',
    partners_label:'Proceso', partners_title:'Cómo transcurre<br><em>una compra</em>',
    partners_sub:'De la primera consulta al título registrado suelen pasar de tres a cinco meses. Lo lento es el deslinde y el Registro de Títulos.',
    pstep_0_title:'Encargo y preselección', pstep_0_desc:'Una llamada para fijar zona, presupuesto y uso. Enviamos de cinco a ocho propiedades, incluidas las de fuera de mercado que encajen, con sus defectos además de sus virtudes.', pstep_0_time:'Semana 1',
    pstep_1_title:'Viaje de visitas', pstep_1_desc:'Dos o tres días sobre el terreno, unas cuatro propiedades al día. Conducimos nosotros, no los promotores. También verá las carreteras, el supermercado y el hospital, porque de eso depende que una casa funcione.', pstep_1_time:'Semanas 2 a 4',
    pstep_2_title:'Oferta y comprobaciones', pstep_2_desc:'Promesa de venta con un 10% en depósito, condicionada a la búsqueda de título. El abogado confirma el deslinde, la ausencia de cargas y el certificado Confotur. Si algo falla, se retira y recupera el depósito.', pstep_2_time:'Semanas 4 a 8',
    pstep_3_title:'Cierre y registro', pstep_3_desc:'Firma ante notario, transferencia del resto, entrega de llaves. El Registro de Títulos emite después el certificado a su nombre, en cuatro a ocho semanas y a veces más.', pstep_3_time:'Meses 3 a 5',
    psvc_0_title:'Legal y fiscal', psvc_0_desc:'Firmas dominicanas para búsquedas de título, cumplimiento Confotur y estructura de tenencia. Facturan ellas, a tarifas que le indicamos antes de encargarles nada.',
    psvc_1_title:'Gestión de alquiler', psvc_1_desc:'Anuncios, huéspedes, limpieza y mantenimiento por un 20 a 25% de los ingresos brutos. Presentamos dos o tres y usted elige.',
    psvc_2_title:'Arquitectos y constructores', psvc_2_desc:'Para parcelas y para reformas. Construir junto al mar tiene sus exigencias — sal, viento, drenaje — y el contratista equivocado sale caro.',
    psvc_3_title:'Residencia', psvc_3_desc:'Abogados de inmigración que tramitan la residencia por inversión. De tres a seis meses, y le dirán con honestidad si su caso es sencillo.',
    wa_text:'Escríbanos',
    card_beds:'hab.', card_baths:'baños',
    pd_cta_visit:'Concertar una visita', pd_cta_whatsapp:'Pedir el dosier',
    ft_desc:'Propiedad costera en la República Dominicana. Cap Cana, Punta Cana, Bayah&iacute;be y Saman&aacute;.',
    ft_nav:'Sitio', ft_svc:'Servicios', ft_dest:'Zonas', ft_catalogue:'Catálogo completo',
    ft_svc_0:'Proceso de compra', ft_svc_1:'Gestión de alquiler', ft_svc_2:'Legal y notarial', ft_svc_3:'Residencia',
    ft_privacy:'Política de privacidad'
  }
};

// Data (fallback — overwritten by supabase fetch)
/* Catalogue data. Loaded from data.js, which config.js can override with a
   live Supabase project. Kept in a separate file so the copy can be edited
   without touching application code. */
var PROPERTIES = (window.RL_PROPERTIES || []).slice();

var LIFESTYLE = window.RL_LIFESTYLE || [];

var MARQUEE_ITEMS = window.RL_PLACES || [];

// Render
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

// Navigation
function scrollToSection(id){
  var el = document.getElementById(id);
  if(!el) return;
  // Close mobile nav first
  var nav = document.getElementById('mainNav');
  var wasOpen = nav && nav.classList.contains('open');
  if(wasOpen) closeNav();

  function doScroll(){
    // Refresh ScrollTrigger so sections become visible
    if(typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    var header = document.getElementById('mainHeader');
    var notice = document.getElementById('siteNotice');
    var headerH = (header ? header.offsetHeight : 80);
    if(notice && !notice.hidden) headerH += notice.offsetHeight || 0;
    var y = el.getBoundingClientRect().top + window.pageYOffset - headerH - 10;
    if(typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined'){
      gsap.registerPlugin(ScrollToPlugin);
      gsap.to(window, {scrollTo:{y: y, autoKill:false}, duration:1, ease:'power3.inOut'});
    } else {
      window.scrollTo({top: y, behavior:'smooth'});
    }
  }
  // Delay scroll if nav was open (mobile) to let DOM settle
  if(wasOpen){ setTimeout(doScroll, 200); } else { doScroll(); }
}
function toggleNav(){
  setNav(!document.getElementById('mainNav').classList.contains('open'));
}
function closeNav(){ setNav(false); }

/* The open menu covers the page, so the header has to be restyled for a light
   background. The class goes on <body> because the logo precedes the nav in the
   markup and no CSS combinator reaches backwards. */
function setNav(open){
  const nav = document.getElementById('mainNav');
  const header = document.getElementById('mainHeader');
  const toggle = document.getElementById('mobToggle');
  const wa = document.querySelector('.wa-btn');
  if(!nav) return;
  nav.classList.toggle('open', open);
  document.body.classList.toggle('nav-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if(header) header.style.zIndex = open ? '9999' : '';
  if(toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if(wa) wa.style.display = open ? 'none' : '';
}

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape') closeNav();
});

// Header scroll
let lastScroll = 0;
window.addEventListener('scroll',()=>{
  const h = document.getElementById('mainHeader');
  h.classList.toggle('scrolled', window.scrollY > 80);
  lastScroll = window.scrollY;
},{passive:true});

// I18n system
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('rl-lang', lang);
  document.documentElement.lang = lang;
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
  applyContactConfig();
}
function toggleLangMenu(e) {
  e && e.stopPropagation();
  document.getElementById('langSel').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-sel')) document.getElementById('langSel')?.classList.remove('open');
});

// Qualification tunnel
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

  /* The confirmation is only shown once the enquiry is recorded. */
  insertLeadFromTunnel(leadData, function(err, result) {
    if (err) {
      console.warn('[Real Luxe] Tunnel Lead Guard: Supabase error, lead saved locally');
    }
    leadData.commission_id = result ? result.commission_id : 'LOCAL';
    console.log('[Real Luxe] Tunnel lead recorded, commission_id:', leadData.commission_id);

    // EmailJS notification
    sendLeadEmails({
      nom: leadData.firstName + ' ' + leadData.lastName,
      email: leadData.email,
      tel: leadData.phone,
      property_name: 'Private consultation (' + leadData.horizon + ')',
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

// Vault access form
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

  /* The confirmation is only shown once the enquiry is recorded. */
  insertLeadFromVault(vaultData, function(err, result) {
    if (err) {
      console.warn('[Real Luxe] Vault Lead Guard: Supabase error, lead saved locally');
    }
    vaultData.commission_id = result ? result.commission_id : 'LOCAL';
    console.log('[Real Luxe] Vault lead recorded, commission_id:', vaultData.commission_id);

    // EmailJS notification
    sendLeadEmails({
      nom: vaultData.name,
      email: vaultData.email,
      tel: vaultData.phone,
      property_name: 'Off-market collection',
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

// Confotur calculator
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

// Preloader
/* The intro curtain.

   hidePreloader is idempotent and never depends on GSAP, because the curtain
   covers the entire page: if it fails to lift, the site is a blank screen. A
   watchdog lifts it regardless after two seconds, and again on window load, so
   a blocked or slow CDN costs an animation rather than the whole page. */
var _preloaderDone = false;
function hidePreloader() {
  if (_preloaderDone) return;
  _preloaderDone = true;
  var el = document.getElementById('preloader');
  if (el) el.classList.add('done');
  initAnimations();
}

function initPreloader() {
  var el = document.getElementById('preloader');
  if (!el) { hidePreloader(); return; }

  /* Watchdogs, armed before anything that could throw. */
  setTimeout(hidePreloader, 2000);
  window.addEventListener('load', function () { setTimeout(hidePreloader, 300); });

  if (gsap.__stub || prefersReducedMotion()) { hidePreloader(); return; }

  try {
    gsap.timeline()
      .to('.pre-logo', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .to('.pre-sub', { opacity: 1, duration: 0.5 }, '<+.25')
      .to('#preloader', {
        opacity: 0, duration: 0.7, ease: 'power2.inOut', delay: 0.35,
        onComplete: hidePreloader
      });
  } catch (err) {
    hidePreloader();
  }
}

/* Scroll and entrance animation. Every effect here is decoration: the page is
   fully readable with this function never running, which is what happens when
   the animation library is blocked or the visitor asks for reduced motion. */
var _animationsRun = false;
function initAnimations(){
  if (_animationsRun) return;
  _animationsRun = true;
  if (gsap.__stub || typeof ScrollTrigger === 'undefined' || prefersReducedMotion()) return;

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
        if(parseFloat(getComputedStyle(el).opacity) < 0.1) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
    });
  }, 4000);
}

// Family office accordion
function toggleFO(n) {
  const card = document.getElementById('foCard' + n);
  if (!card) return;
  const willOpen = !card.classList.contains('open');

  document.querySelectorAll('.fo-card').forEach(c => {
    c.classList.remove('open');
    const h = c.querySelector('.fo-card-header');
    if (h) h.setAttribute('aria-expanded', 'false');
  });

  if (willOpen) {
    card.classList.add('open');
    const h = card.querySelector('.fo-card-header');
    if (h) h.setAttribute('aria-expanded', 'true');
  }
}

// Init
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
      // Not in the bundled catalogue: look it up in the configured project
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

  // Nav click feedback (CSS transition on .clicked)
  document.querySelectorAll('.nav-link, .nav-cta').forEach(function(link) {
    link.addEventListener('click', function(){
      var el = this;
      el.classList.remove('clicked');
      void el.offsetWidth; // force reflow
      el.classList.add('clicked');
      setTimeout(function(){ el.classList.remove('clicked'); }, 500);
    });
  });

  // Init calculator
  updateCalc();

  // Decorative scroll effects, skipped when the library is absent
  if (!gsap.__stub && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion()) {
    document.querySelectorAll('.prop-img img').forEach(img => {
      gsap.to(img, {
        yPercent: -8, ease: 'none',
        scrollTrigger: { trigger: img.closest('.prop-card'), start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });

    gsap.from('.calc-module', {
      opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.calc-module', start: 'top 80%' }
    });

    gsap.from('.partner-svc', {
      opacity: 0, y: 40, duration: 0.6, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.partners-services', start: 'top 88%' }
    });
  }

});


} // end INDEX

/* CATALOGUE PAGE */
if (PAGE_TYPE === 'catalogue') {

/* Catalogue data flow:
     DOMContentLoaded -> loadPropertiesFromSupabase()
                      -> PROPERTIES filled from the project, or from data.js
                      -> renderCards() injects the DOM
                      -> initAnimations() runs, after the cards exist. */

/* Filled by loadPropertiesFromSupabase, from the project or from data.js. */
var PROPERTIES = [];

/* True once the grid has been populated. */
var _dataReady = false;

/* ===================================================================
   SUPABASE DATA LOADER
   =================================================================== */

/*
 * Fills the catalogue grid.
 *
 * Order of preference:
 *   1. the Supabase project named in config.js, when one is configured;
 *   2. the bundled catalogue in data.js.
 *
 * The bundled catalogue is also used whenever a configured project is
 * unreachable, so a network problem degrades the page rather than emptying it.
 */
async function loadPropertiesFromSupabase() {
  var grid = document.getElementById('propsGrid');
  var loader = document.getElementById('propsLoader');
  if (loader) loader.style.display = 'flex';

  var rows = null;
  var configured = !!(window.RL && window.RL.has('integrations.supabase.url') &&
                      window.RL.has('integrations.supabase.anonKey'));

  if (configured) {
    try {
      if (typeof window.supabase === 'undefined') throw new Error('Supabase SDK did not load.');
      if (typeof fetchPublishedProperties !== 'function') throw new Error('supabase-client.js did not load.');
      if (typeof _supabaseReady !== 'undefined' && !_supabaseReady) {
        throw new Error((typeof _supabaseError !== 'undefined' && _supabaseError)
          ? _supabaseError.message : 'Supabase client failed to initialise.');
      }
      var raw = await fetchPublishedProperties();
      if (raw && raw.length) rows = raw.map(normalizeProperty);
      else console.warn('[Real Luxe] Supabase returned no published rows; using the bundled catalogue.');
    } catch (err) {
      console.warn('[Real Luxe] Supabase unavailable (' + err.message + '); using the bundled catalogue.');
    }
  }

  if (!rows || !rows.length) rows = (window.RL_PROPERTIES || []).slice();

  if (!rows.length) { showEmptyState(grid); return; }

  PROPERTIES = rows;
  displayedProperties = PROPERTIES.slice();
  _dataReady = true;

  updateHeroStats(PROPERTIES);
  buildLocationFilters(PROPERTIES);
  if (loader) loader.remove();
  renderCards(true);

  initAnimations();
  if (!gsap.__stub && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion()) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.cat-footer', {
      scrollTrigger: { trigger: '.cat-footer', start: 'top 95%', toggleActions: 'play none none none' },
      opacity: 0, y: 30, duration: 0.8, ease: 'power3.out'
    });
  }
}

/**
 * updateHeroStats(properties)
 * Rewrites the hero stat line from the properties actually loaded, so it
 * cannot claim a count or an entry price the catalogue does not have.
 */
function updateHeroStats(properties) {
  var statsEl = document.querySelector('.cat-hero-stats');
  if (!statsEl || properties.length === 0) return;

  var locations = [];
  var minPrice = Infinity;

  for (var i = 0; i < properties.length; i++) {
    var p = properties[i];
    /* Distinct areas */
    if (locations.indexOf(p.location) === -1) {
      locations.push(p.location);
    }
    /* Lowest asking price */
    var numPrice = parsePriceNumber(p.price);
    if (numPrice < minPrice) minPrice = numPrice;
  }

  /* Formatted as $1.95M */
  var priceStr = minPrice >= 1000000
    ? '$' + (minPrice / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M'
    : '$' + minPrice.toLocaleString();

  var words = {
    en: { props: 'properties', areas: 'areas', from: 'from' },
    fr: { props: 'biens', areas: 'secteurs', from: 'à partir de' },
    es: { props: 'propiedades', areas: 'zonas', from: 'desde' }
  }[currentLang] || { props: 'properties', areas: 'areas', from: 'from' };

  statsEl.textContent = properties.length + ' ' + words.props +
    ' · ' + locations.length + ' ' + words.areas +
    ' · ' + words.from + ' ' + priceStr;
}

/**
 * showEmptyState(grid)
 * Shown when the catalogue is empty.
 */
function showEmptyState(grid) {
  grid.innerHTML =
    '<div class="props-error">' +
      '<p class="props-error-msg">Nothing on the books just now.<br>Try again in a few days.</p>' +
    '</div>';
}

/* ===================================================================
   i18n
   =================================================================== */
/* Translations for the catalogue. The property count and entry price in
   cat_stats_line are recalculated from the live data by updateHeroStats. */
var I18N = {
  en: {
    cat_label:'Catalogue', cat_title:'The full <em>catalogue</em>',
    cat_sub:'Everything currently on the books, sorted and filtered however you like. Off-market properties are not shown here.',
    card_beds:'bed', card_baths:'bath',
    back_home:'Home',
    filter_all:'All',
    filter_price_asc:'Lowest first',
    filter_price_desc:'Highest first',
    cat_view_details:'Details',
    cat_stats_line:'5 properties \u00B7 4 areas \u00B7 from $1.95M',
    cat_photos:'photos',
    cat_request_visit:'Enquire',
    lead_title:'Enquire about this property',
    lead_sub:'An adviser replies within one working day, with the floor plans and the title position.',
    lead_name:'Full name',
    lead_email:'Email',
    lead_phone:'Telephone',
    lead_message:'Message (optional)',
    lead_send:'Send',
    lead_success_title:'Received',
    lead_success_sub:'We have your enquiry and will come back to you within one working day.',
    lead_wa_cta:'Continue on WhatsApp',
    lead_close:'Close',
    pd_cta_visit:'Arrange a viewing', pd_cta_whatsapp:'Request the dossier'
  },
  fr: {
    cat_label:'Catalogue', cat_title:'Le catalogue <em>complet</em>',
    cat_sub:'Tout ce qui est actuellement au portefeuille, tri\u00E9 et filtr\u00E9 \u00E0 votre guise. Les biens hors march\u00E9 n\u2019y figurent pas.',
    card_beds:'ch.', card_baths:'sdb',
    back_home:'Accueil',
    filter_all:'Tous',
    filter_price_asc:'Prix croissant',
    filter_price_desc:'Prix d\u00E9croissant',
    cat_view_details:'D\u00E9tails',
    cat_stats_line:'5 biens \u00B7 4 secteurs \u00B7 \u00E0 partir de $1.95M',
    cat_photos:'photos',
    cat_request_visit:'Nous \u00E9crire',
    lead_title:'Se renseigner sur ce bien',
    lead_sub:'Un conseiller r\u00E9pond sous un jour ouvr\u00E9, avec les plans et la situation du titre.',
    lead_name:'Nom complet',
    lead_email:'E-mail',
    lead_phone:'T\u00E9l\u00E9phone',
    lead_message:'Message (facultatif)',
    lead_send:'Envoyer',
    lead_success_title:'Bien re\u00E7u',
    lead_success_sub:'Nous avons votre demande et revenons vers vous sous un jour ouvr\u00E9.',
    lead_wa_cta:'Continuer sur WhatsApp',
    lead_close:'Fermer',
    pd_cta_visit:'Organiser une visite', pd_cta_whatsapp:'Demander le dossier'
  },
  es: {
    cat_label:'Cat\u00E1logo', cat_title:'El cat\u00E1logo <em>completo</em>',
    cat_sub:'Todo lo que hay ahora en cartera, ordenado y filtrado como prefiera. Las propiedades fuera de mercado no aparecen aqu\u00ED.',
    card_beds:'hab.', card_baths:'ba\u00F1os',
    back_home:'Inicio',
    filter_all:'Todas',
    filter_price_asc:'Menor precio primero',
    filter_price_desc:'Mayor precio primero',
    cat_view_details:'Detalles',
    cat_stats_line:'5 propiedades \u00B7 4 zonas \u00B7 desde $1.95M',
    cat_photos:'fotos',
    cat_request_visit:'Consultar',
    lead_title:'Consultar sobre esta propiedad',
    lead_sub:'Un asesor responde en un d\u00EDa laborable, con los planos y la situaci\u00F3n del t\u00EDtulo.',
    lead_name:'Nombre completo',
    lead_email:'Correo',
    lead_phone:'Tel\u00E9fono',
    lead_message:'Mensaje (opcional)',
    lead_send:'Enviar',
    lead_success_title:'Recibido',
    lead_success_sub:'Tenemos su consulta y le responderemos en un d\u00EDa laborable.',
    lead_wa_cta:'Seguir por WhatsApp',
    lead_close:'Cerrar',
    pd_cta_visit:'Concertar una visita', pd_cta_whatsapp:'Pedir el dosier'
  }
};

/* Local desk covering each area. Names only: routing an enquiry to a third
   party requires a written agreement with them, so no address is shipped. */
var PARTNER_AGENCIES = {
  'Cap Cana':     { name: 'Cap Cana desk' },
  'Punta Cana':   { name: 'Punta Cana desk' },
  'Las Terrenas': { name: 'Samaná desk' },
  'Bayah\u00EDbe':  { name: 'La Romana desk' },
  'Saman\u00E1':    { name: 'Samaná desk' }
};

/* ===================================================================
   STATE
   =================================================================== */
var currentLang = localStorage.getItem('rl-lang') || 'en';
if (['ru','zh'].indexOf(currentLang) !== -1) { currentLang = 'en'; localStorage.setItem('rl-lang','en'); }
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
            /* A real URL, so the card can be opened in a new tab, shared and
               indexed; the click handler shows the overlay instead. */
            '<a href="property.html?slug=' + encodeURIComponent(p.slug) + '" class="cat-card-btn" onclick="if(event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();event.stopPropagation();openPropertyDetail(\'' + p.slug + '\',event)">' +
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
}

/* ===================================================================
   FILTER & SORT
   =================================================================== */
function filterByLocation(location, btn) {
  var chips = document.querySelectorAll('.filter-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].classList.remove('active');
  }
  if (btn) btn.classList.add('active');
  activeFilter = location;
  applyFilterSort(true);
}

/* Builds the location chips from whatever is actually in the catalogue, so the
   filters cannot drift out of step with the listings the way a hard-coded list
   does. Chips are inserted before the separator, leaving the sort controls. */
function buildLocationFilters(properties) {
  var bar = document.getElementById('filterBarInner');
  if (!bar) return;
  var sep = bar.querySelector('.filter-separator');

  bar.querySelectorAll('.filter-chip').forEach(function (c) {
    if (c.getAttribute('data-filter') !== 'all') c.remove();
  });

  var seen = [];
  properties.forEach(function (p) {
    if (p.location && seen.indexOf(p.location) === -1) seen.push(p.location);
  });
  seen.sort();

  seen.forEach(function (loc) {
    var b = document.createElement('button');
    b.className = 'filter-chip';
    b.type = 'button';
    b.setAttribute('data-filter', loc);
    b.textContent = loc;
    b.addEventListener('click', function () { filterByLocation(loc, b); });
    bar.insertBefore(b, sep);
  });
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
  document.documentElement.lang = lang;
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
  if (gsap.__stub || typeof ScrollTrigger === 'undefined' || prefersReducedMotion()) return;

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
  /* Language first, no waiting on Supabase */
  setLang(currentLang);

  /* Scroll listener (synchronous) */
  window.addEventListener('scroll', handleScroll, {passive: true});
  handleScroll();

  /* Card animations are started by loadPropertiesFromSupabase once the cards
     are in the DOM, not here, so there is no race with the fetch. */

  /* Kick off the async load from Supabase */
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
  leadData.partner_agency = agency ? agency.name : '';

  /* The success panel, and the WhatsApp shortcut on it, appear only after the
     enquiry has been recorded, so nothing is lost between the two. */
  insertLead(leadData, function(err, result) {
    if (err) {
      console.warn('[Real Luxe] Lead Guard: Supabase error, but the lead was saved locally');
    }
    // Carry the reference through for tracking
    leadData.commission_id = result ? result.commission_id : 'LOCAL';

    // EmailJS notification
    sendLeadEmails(leadData);

    // Only now is the enquiry recorded, so only now is success shown
    showLeadSuccess(leadData);
  });

  return false;
}

/* Storage lives in supabase-client.js; see insertLead. */

/* Forwards an enquiry by email.

   Reads its credentials from config.js. With none set, the enquiry stays in the
   browser (see insertLead in supabase-client.js) and is logged for the
   developer; the visitor still sees the normal confirmation, because the
   enquiry has in fact been recorded. */
function sendLeadEmails(data) {
  var cfg = window.RL ? {
    publicKey: window.RL.get('integrations.emailjs.publicKey'),
    serviceId: window.RL.get('integrations.emailjs.serviceId'),
    templateId: window.RL.get('integrations.emailjs.templateId'),
    toEmail: window.RL.get('integrations.emailjs.toEmail') || window.RL.get('contact.email')
  } : {};

  var ready = typeof emailjs !== 'undefined' && cfg.publicKey && cfg.serviceId && cfg.templateId;

  if (!ready) {
    console.info('[Real Luxe] No email service configured — enquiry recorded locally:',
      { email: data.email, property: data.property_name || data.villa_interet, ref: data.commission_id });
    return;
  }

  emailjs.init(cfg.publicKey);
  emailjs.send(cfg.serviceId, cfg.templateId, {
    to_email: cfg.toEmail,
    from_name: data.nom || data.name || '',
    from_email: data.email,
    phone: data.tel || data.phone || '',
    message: data.message || '',
    property: data.property_name || data.villa_interet || '',
    commission_id: data.commission_id || '',
    source: data.source || 'website'
  }).catch(function (err) {
    console.error('[Real Luxe] Email delivery failed:', err);
  });
}

function showLeadSuccess(data) {
  document.getElementById('leadFormState').style.display = 'none';
  var success = document.getElementById('leadSuccessState');
  success.style.display = '';

  // WhatsApp shortcut, only when a number is configured
  var waLink = document.getElementById('leadWhatsAppLink');
  if (waLink) {
    var waNumber = window.RL ? window.RL.get('contact.whatsapp') : '';
    if (waNumber) {
      var waMsg = 'Hello, I have just sent an enquiry about ' + (data.property_name || 'a property') +
        '. My name is ' + (data.nom || data.name || '') +
        ' (reference ' + (data.commission_id || 'n/a') + ').';
      waLink.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(waMsg);
    } else {
      waLink.style.display = 'none';
    }
  }

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

/* TESTIMONIALS CAROUSEL (shared) */
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
