# Real Luxe

A property site for a small estate agency: home, catalogue, property detail,
team, privacy policy, plus a 404 page. Static HTML, CSS and JavaScript, with no build
step. Copy the files onto any web host and it runs.

## Running it

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` straight off the file system
mostly works, but a server behaves more like production.

## Configuration

Everything you would otherwise go hunting through the source for lives in
`config.js`. Nothing else needs editing to put your own name and contact details
on the site.

Every field is optional, and an empty field removes the feature it controls
instead of leaving a dead link:

| Setting | Empty means |
| --- | --- |
| `contact.email` | email rows and `mailto:` links disappear |
| `contact.phone` | the telephone row disappears |
| `contact.whatsapp` | every WhatsApp button disappears |
| `contact.bookingUrl` | the booking widget is replaced by a link to the enquiry form |
| `integrations.ga4` | no analytics script is loaded at all |
| `integrations.supabase` | the catalogue is served from `data.js` |
| `integrations.emailjs` | enquiries are kept in the browser and logged to the console |
| `brand.legalName` and the `privacy*` addresses | the privacy policy says the controller is not yet named |

As shipped the site runs end to end on the bundled demo catalogue. No accounts,
no API keys. It does still make outbound requests: Google Fonts, the Unsplash
images, and four libraries from public CDNs (GSAP, Leaflet, the Supabase client,
EmailJS). The last two sit idle until you configure them. This is the state to
publish a demo in.

### Before going live

1. Fill in `config.js`.
2. Replace the demo listings in `data.js`, or connect a Supabase project.
3. Set `notice.enabled` to `false` once the listings are real.
4. Put your own domain into `robots.txt` and `sitemap.xml`. Both ship pointing at
   `example.com`.
5. Complete the data-controller details in `config.js`. Until you do, the privacy
   policy is not GDPR-compliant, and the page says so on screen.

## Content

`data.js` holds the catalogue, the four tiles under "What is around" on the home
page, and the place names in the scrolling band. A property needs `slug`, `name`,
`location`, `price`, `beds`, `baths`, `sqm` and `img`. Everything else is
optional, and the page omits what is missing.

Images are Unsplash URLs. Replace them with real photography before you show the
site to a client.

## Connecting a backend

Setting `integrations.supabase` makes the catalogue read from a `properties`
table (rows with `status = 'published'`) and write enquiries to a `leads` table.
`data.js` then becomes the offline fallback: if the project is unreachable, the
catalogue still renders rather than emptying.

Protect both tables with row level security. The anon key in `config.js` is
public by design and visible to anyone who views source. Your server-side
policies are the thing doing the protecting.

## Translations

English, French and Spanish on the home page and the catalogue, switched from the
header and remembered in `localStorage` under `rl-lang`. The strings live in the
two `I18N` objects in `script.js`, one per page, keyed by the `data-i18n`
attributes in the markup. A key missing from a language leaves whatever the HTML
shipped with.

The other pages carry no language switcher.

## Files

```
index.html          home
catalogue.html      filterable listing grid
property.html       single property, opened as property.html?slug=...
team.html           the people
privacy.html        privacy policy
404.html            not found

config.js           every setting; start here
data.js             demo catalogue and page content
script.js           application code
supabase-client.js  database client, retries and offline queue
style.css           the whole design system
```

`404.html` is self-contained and loads none of the scripts.

## Behaviour

### Nothing depends on the CDNs

The animation library, the map library and the database client are all optional
at runtime. If an ad blocker or an outage takes one out, that feature degrades.
You get the bundled catalogue rather than a live one. The map becomes a link to
the same coordinates on OpenStreetMap. Entrance animations stop happening. The
page still renders and still takes enquiries.

### Enquiries are not lost

A submission is written to the database with retries. If that fails it is queued
in `localStorage` under `rl-leads-pending` and flushed on the next successful
connection. The confirmation only appears once the enquiry has been recorded
somewhere.

### Motion is decoration

Everything animated is readable without the animation, and
`prefers-reduced-motion` turns all of it off.

## Browsers

Current Chrome, Firefox, Safari and Edge. Nothing is transpiled, so the
JavaScript is written to run as it stands.
