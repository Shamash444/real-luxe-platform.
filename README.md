# Real Luxe

A five-page property site for a small estate agency: home, catalogue, property
detail, team, privacy policy. Static HTML, CSS and JavaScript — no build step, no
framework, no package manager. Put the files on any web host and it runs.

## Getting it running

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` straight from the file
system also mostly works, but a server is closer to production.

## Configuration

Everything you would normally hunt through the source for lives in
**`config.js`**. Nothing else needs editing to put the site live under your own
name.

Every field is optional, and an empty field removes the feature it controls
rather than leaving a dead link:

| Setting | Empty means |
| --- | --- |
| `contact.email` | email rows and `mailto:` links disappear |
| `contact.phone` | the telephone row disappears |
| `contact.whatsapp` | every WhatsApp button disappears |
| `contact.bookingUrl` | the booking widget is replaced by a link to the enquiry form |
| `integrations.ga4` | no analytics script is loaded at all |
| `integrations.supabase` | the catalogue is served from `data.js` |
| `integrations.emailjs` | enquiries are stored in the browser and logged |
| `brand.legalName` and the `privacy*` addresses | the privacy policy says the controller is not yet named |

As shipped, the site runs end to end on the bundled demo catalogue, with no
accounts, no API keys and no third-party calls beyond Google Fonts and the image
CDN. That is the state to publish a demo in.

### Before going live

1. Fill in `config.js`.
2. Replace the demo listings in `data.js`, or connect a Supabase project.
3. Set `notice.enabled` to `false` in `config.js` once the listings are real.
4. Put your own domain into `robots.txt` and `sitemap.xml`.
5. Complete the data-controller details in `config.js`, or the privacy policy is
   not GDPR-compliant. The page says so on screen until you do.

## Content

`data.js` holds the catalogue, the four tiles under **What is around**, and the
place names in the scrolling band. Each property needs at minimum `slug`, `name`,
`location`, `price`, `beds`, `baths`, `sqm` and `img`; everything else is
optional and the page omits what is missing.

Images are Unsplash URLs. Replace them with your own photography — it is the
single biggest difference between this looking like a template and looking like
an agency.

## Connecting a backend

Setting `integrations.supabase` makes the catalogue read from a `properties`
table (rows with `status = 'published'`) and write enquiries to a `leads` table.
`data.js` then becomes the offline fallback: if the project is unreachable, the
catalogue still renders rather than emptying.

Protect both tables with row level security. The anon key in `config.js` is
public by design and is visible to anyone who views source; the server-side
policies are what actually protect the data, not the key.

## Translations

English, French and Spanish, switched from the header and remembered in
`localStorage`. The strings live in the two `I18N` objects in `script.js` — one
for the home page, one for the catalogue — keyed by the `data-i18n` attributes in
the markup. A key missing from a language falls back to whatever is in the HTML.

## Files

```
index.html          home
catalogue.html      filterable listing grid
property.html       single property, opened as property.html?slug=...
team.html           the people
privacy.html        privacy policy (French)
404.html            not found

config.js           all settings — the only file you must edit
data.js             demo catalogue and page content
script.js           application code for every page
supabase-client.js  database client, retries and offline queue
style.css           the whole design system
```

## Notes on how it behaves

**Nothing depends on the CDNs.** The animation library, the map library and the
database client are all optional at runtime. If any of them is blocked by an ad
blocker, a corporate firewall or an outage, the affected feature degrades — no
animation, a link to a map instead of a map, the bundled catalogue instead of a
live one — and the page still renders and still takes enquiries.

**Enquiries are not lost.** A submission is written to the database with retries;
if that fails it is queued in `localStorage` and flushed on the next successful
connection. The confirmation is shown only once the enquiry has been recorded
somewhere.

**Motion is decoration.** Everything animated is readable without the animation,
and `prefers-reduced-motion` turns all of it off.

## Browsers

Current Chrome, Firefox, Safari and Edge. No build step, so no transpilation: the
JavaScript is written to run as-is.
