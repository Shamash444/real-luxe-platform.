/*
 * Site configuration — edit this file, nothing else.
 *
 * Every field below is optional. A field left empty removes the feature it
 * controls rather than leaving a dead link or a broken widget on the page:
 *
 *   contact.email     empty -> email rows and mailto links disappear
 *   contact.phone     empty -> the phone row disappears
 *   contact.whatsapp  empty -> every WhatsApp button disappears
 *   contact.bookingUrl empty -> the booking section disappears
 *   integrations.*    empty -> that service is never loaded or called
 *
 * With the file as shipped the site runs end to end on its bundled demo
 * catalogue, with no accounts, no keys and no third-party calls beyond fonts.
 */
window.RL_CONFIG = {

  /* ---------------------------------------------------------------
     Brand
     --------------------------------------------------------------- */
  brand: {
    /* Shown in the header. Two words: the second is set in italic gold. */
    name: 'Real',
    nameAccent: 'Luxe',

    /* Used in <title>, structured data and the footer. */
    fullName: 'Real Luxe',

    /* Absolute site URL, no trailing slash. Used for canonical and og:url.
       Leave empty to omit those tags. */
    url: '',

    /* Registered company name and jurisdiction, for the privacy policy. */
    legalName: '',
    legalJurisdiction: '',

    /* First year of trading, shown in the footer copyright range. */
    foundedYear: 2019
  },

  /* ---------------------------------------------------------------
     Contact
     --------------------------------------------------------------- */
  contact: {
    email: '',

    /* Display form, e.g. '+1 809 555 0100'. */
    phone: '01 02 03 04 05 06',

    /* Digits only, country code first, no +, spaces or dashes.
       e.g. '18095550100'. Empty removes WhatsApp from the whole site. */
    whatsapp: '',

    office: {
      line1: '',
      line2: ''
    },

    /* Calendly, Cal.com or any embeddable scheduler URL. */
    bookingUrl: '',

    /* Address for GDPR requests, shown in the privacy policy. */
    privacyEmail: '',
    dpoEmail: ''
  },

  /* ---------------------------------------------------------------
     Language
     --------------------------------------------------------------- */
  i18n: {
    /* Languages the site ships. Removing one also removes its button. */
    available: ['en', 'fr', 'es'],

    /* Used when detection is off, or when the visitor's browser asks for a
       language the site does not have. */
    fallback: 'en',

    /* On a first visit, match the language the browser asks for.
       Note this is the browser's language setting, not the visitor's country:
       a French speaker in Madrid gets French. Detecting the country itself
       needs a geo-IP service, which a static site cannot do on its own.
       Once someone picks a language by hand, their choice wins from then on. */
    autoDetect: true
  },

  /* ---------------------------------------------------------------
     Social — empty entries are skipped
     --------------------------------------------------------------- */
  social: {
    instagram: '',
    linkedin: '',
    facebook: ''
  },

  /* ---------------------------------------------------------------
     Integrations — all optional
     --------------------------------------------------------------- */
  integrations: {
    /* Google Analytics 4 measurement ID, e.g. 'G-XXXXXXXXXX'.
       Empty means no analytics script is loaded at all. */
    ga4: '',

    /* Supabase backs the live catalogue and stores enquiries.
       Empty means the bundled demo catalogue in data.js is used instead. */
    supabase: {
      url: '',
      anonKey: ''
    },

    /* EmailJS forwards enquiries to your inbox.
       Empty means enquiries are kept in the browser and logged to the console. */
    emailjs: {
      publicKey: '',
      serviceId: '',
      templateId: '',
      toEmail: ''
    }
  },

  /* ---------------------------------------------------------------
     Demonstration notice
     Set enabled to false once the site carries real listings.
     --------------------------------------------------------------- */
  notice: {
    enabled: true,
    text: 'Demonstration site. The properties, figures and testimonials shown are illustrative.'
  }
};

/*
 * Small read helper, used across the site.
 * RL.get('contact.whatsapp') returns '' rather than throwing when a branch
 * of the config is missing entirely.
 */
window.RL = window.RL || {};
window.RL.get = function (path, fallback) {
  var parts = String(path).split('.');
  var node = window.RL_CONFIG;
  for (var i = 0; i < parts.length; i++) {
    if (node === null || typeof node !== 'object' || !(parts[i] in node)) {
      return fallback === undefined ? '' : fallback;
    }
    node = node[parts[i]];
  }
  if (node === undefined || node === null || node === '') {
    return fallback === undefined ? '' : fallback;
  }
  return node;
};
window.RL.has = function (path) {
  return window.RL.get(path, '') !== '';
};

/* Load Google Analytics only when a measurement ID is configured. */
(function () {
  var id = window.RL.get('integrations.ga4');
  if (!id) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true });
})();
