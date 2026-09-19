/*
 * Demo catalogue.
 *
 * Used directly when no Supabase project is configured in config.js, and as a
 * fallback whenever a configured project is unreachable. Replace the entries
 * with your own, or point config.integrations.supabase at a project and this
 * file becomes the offline safety net.
 *
 * Yield and occupancy figures are indicative ranges for the region, not
 * guarantees attached to a specific title.
 */
window.RL_PROPERTIES = [
  {
    slug: 'villa-oceana',
    name: 'Villa Oceana',
    location: 'Cap Cana',
    price: '$4,200,000',
    tag: 'Exclusive',
    beds: 6, baths: 7, sqm: 850,
    featured: true,
    lat: 18.5085, lng: -68.3734,
    year: 2023, lot: 2200, pool: 'Infinity, 25 m', parking: 4,
    img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=82&auto=format'
    ],
    description: 'The house sits on the coral shelf at the eastern edge of Cap Cana, about twelve metres above the water. It is a single storey wrapped around a central courtyard, and the living pavilion has been turned east so that the sea is in view from the kitchen and the pool terrace, and from both principal suites. Glass panels along the whole eastern face retract into the wall. For most of the year that leaves the living room and the terrace working as one room. Calacatta marble underfoot and ipe decking outside; the ironmongery is bronze throughout. The pool runs twenty-five metres along the edge of the terrace. Four of the six bedrooms are in a guest wing that has its own entrance and a service stair, which is useful if you intend to let the place and slightly odd if you do not. The plot is 2,200 m².',
    amenities: ['Infinity pool', 'Beach access', 'Screening room', 'Wine store', 'Spa and hammam', 'Staff quarters', 'Gated, patrolled', 'Helipad'],
    roi: { rentalYield: '8–12%', occupancyRate: '80%', projectedAppreciation: '6–8% p.a.', capRate: '7%' },
    confoturBenefits: 'Confotur certified. Fifteen years exempt from transfer duty, annual property tax, rental income tax and capital gains tax.',
    techSpecs: {
      construction: 'Reinforced concrete frame, hurricane-rated glazing',
      energy: 'Solar-ready roof, Daikin VRV air conditioning',
      water: 'Reverse osmosis plant, 40,000 L cistern',
      smart: 'Crestron control, Lutron lighting',
      security: 'Biometric entry, perimeter cameras, safe room'
    },
    conciergeServices: ['Chef placement', 'Yacht charter', 'Airport fast-track', 'Property management', 'Housekeeping', 'Vehicle hire']
  },

  {
    slug: 'villa-palma',
    name: 'Villa Palma Real',
    location: 'Punta Cana',
    price: '$2,800,000',
    tag: 'New build',
    beds: 5, baths: 5, sqm: 620,
    lat: 18.5601, lng: -68.3725,
    year: 2024, lot: 1800, pool: 'Freeform lagoon', parking: 3,
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=82&auto=format'
    ],
    description: 'Palma Real was finished at the start of 2024 and stands in a gated community about fifteen minutes from Punta Cana airport. The house is two blocks joined by a covered walkway, living and kitchen on one side, four bedrooms on the other, with a fifth room for staff off the service court. The pool is a shallow freeform lagoon edged in local coral stone, so anyone who wants to swim lengths will be disappointed. The kitchen is Spanish, with quartz worktops and a gas range. Planting is mature along all four boundaries and no neighbouring roof is visible from the ground floor.',
    amenities: ['Lagoon pool', 'Mature gardens', 'Outdoor kitchen', 'Principal suite with terrace', 'Gym', 'Triple garage', 'Staff room'],
    roi: { rentalYield: '9–11%', occupancyRate: '78%', projectedAppreciation: '7–9% p.a.', capRate: '7%' },
    confoturBenefits: 'Confotur certified under Law 158-01. Fifteen-year exemption; qualifies for the investor residency route.',
    techSpecs: {
      construction: 'Insulated concrete forms, impact-rated windows',
      energy: 'Rooftop solar with battery storage',
      water: 'Well with mains backup, greywater recovery',
      smart: 'Control4 automation, multi-room audio',
      security: 'Gated community, private patrol, smart locks'
    },
    conciergeServices: ['Tee-time booking', 'Spa and wellness', 'Private dining', 'Excursion planning']
  },

  {
    slug: 'penthouse-marina',
    name: 'Penthouse Marina',
    location: 'Cap Cana',
    price: '$1,950,000',
    tag: 'Sea view',
    beds: 4, baths: 4, sqm: 380,
    lat: 18.5120, lng: -68.3680,
    year: 2022, lot: 0, pool: 'Roof plunge pool', parking: 2,
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600&q=82&auto=format'
    ],
    description: 'Top floor of a six-storey block on the northern quay, reached by a lift that opens into the flat rather than onto a landing. Main rooms face south-west over the moorings; the second bedroom and the study look inland across the golf course. The roof terrace is private and holds a plunge pool and an outdoor kitchen, with covered seating for ten, and the fifteen-metre berth included in the sale lies roughly sixty metres from the lobby door. Terrazzo floors throughout, motorised external blinds on the west elevation.',
    amenities: ['Private roof terrace', 'Plunge pool', 'Berth included', 'Private lift', 'Concierge desk', 'Wine wall'],
    roi: { rentalYield: '7–10%', occupancyRate: '75%', projectedAppreciation: '5–7% p.a.', capRate: '6%' },
    confoturBenefits: 'Confotur certified. Short-let demand is steady year round given the marina frontage.',
    techSpecs: {
      construction: 'Steel frame, hurricane-rated curtain wall',
      energy: 'Building solar array, individual metering',
      smart: 'Savant control, motorised blinds',
      security: 'Staffed lobby, biometric lift, marina patrol'
    },
    conciergeServices: ['Berth management and provisioning', 'Diving and water sports', 'Marina club membership', 'Helicopter transfers', 'Restaurant booking']
  },

  {
    slug: 'domaine-samana',
    name: 'Domaine Samaná',
    location: 'Las Terrenas',
    price: '$5,500,000',
    tag: 'Private estate',
    beds: 8, baths: 9, sqm: 1200,
    lat: 19.3117, lng: -69.5396,
    year: 2021, lot: 8500, pool: 'Two pools and a cenote', parking: 6,
    img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=82&auto=format'
    ],
    description: 'The plot is 8,500 m² and runs from the coast road down to a private stretch of sand on the northern side of the Samaná peninsula. The fall of the land sets the layout: nothing sits on one level and you walk a good deal. Accommodation is split across three buildings, a main house of five bedrooms and guest pavilions of two and one. At eight bedrooms and nine bathrooms that is closer to a small compound than a house, and it needs staff on the place year round. Construction is timber frame on stone bases with deep overhangs, and the living areas are cross-ventilated rather than air conditioned. The buildings date from 2021, so the timber has not had long to weather. A natural sinkhole on the lower terrace has been cleared and is used for swimming, and there are two pools besides. The land carries fruit trees and a working kitchen garden, both of which want looking after, and the caretaker’s cottage sits by the upper gate. There is a tennis court, and a private dock at the bottom of the land.',
    amenities: ['Private beach', 'Two pools', 'Natural cenote', 'Guest pavilions', 'Kitchen garden', 'Orchard', 'Private dock', 'Tennis court', 'Caretaker’s cottage'],
    roi: { rentalYield: '6–9%', occupancyRate: '70%', projectedAppreciation: '8–12% p.a.', capRate: '6%' },
    confoturBenefits: 'Confotur certified. Las Terrenas remains the least built-out of the four corridors we cover.',
    techSpecs: {
      construction: 'Timber frame on stone bases',
      energy: 'Off-grid solar with wind micro-turbine',
      water: 'Spring supply and rainwater harvesting',
      smart: 'Deliberately minimal; satellite broadband',
      security: 'Private access road, resident manager, perimeter sensors'
    },
    conciergeServices: ['Guided walks with a naturalist', 'Whale watching in season', 'Farm-to-table dining', 'Kite and surf instruction', 'Wellness programming', 'Boat days to Cayo Levantado']
  },

  {
    slug: 'villa-coral',
    name: 'Villa Coral Bay',
    location: 'Bayahíbe',
    price: '$3,100,000',
    beds: 5, baths: 6, sqm: 720,
    lat: 18.3667, lng: -68.8333,
    year: 2023, lot: 3200, pool: 'Infinity and jacuzzi', parking: 3,
    img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=82&auto=format',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1600&q=82&auto=format'
    ],
    description: 'Villa Coral Bay is built into the cliff above Bayahíbe, looking across at the marine reserve of the Parque Nacional del Este. It steps down the slope over three levels, so every room has an unbroken sea view and the roof of each level does duty as the terrace for the one above. A stair cut into the rock drops to a small private cove. Walls are local coral stone and poured concrete left exposed; the joinery is Caribbean cedar. The lowest level holds a studio with its own entrance, in use at the moment as a workshop. The arrangement does mean stairs between every level, and there are a lot of them. Plot is 3,200 m² and the garden is walled.',
    amenities: ['Private cove', 'Infinity pool', 'Cliff-edge jacuzzi', 'Three terraces', 'Principal suite with dressing room', 'Studio with separate entrance', 'Open kitchen', 'Walled garden'],
    roi: { rentalYield: '7–10%', occupancyRate: '72%', projectedAppreciation: '6–8% p.a.', capRate: '6%' },
    confoturBenefits: 'Confotur eligible. The adjoining national park limits what can be built on the neighbouring plots.',
    techSpecs: {
      construction: 'Coral stone and reinforced concrete',
      energy: 'Solar array with mains backup',
      water: 'Desalination plant and rainwater capture',
      smart: 'KNX building control',
      security: 'Cliff on one side, electronic gates, resident guard'
    },
    conciergeServices: ['Diving and snorkelling', 'Boat days to Saona', 'Marine reserve tours', 'Yoga on the terrace', 'Private chef']
  }
];

/* Lifestyle tiles on the home page. */
window.RL_LIFESTYLE = [
  { title: 'Golf', sub: 'Punta Espada, Corales, Teeth of the Dog', img: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=900&q=80&auto=format' },
  { title: 'Marinas', sub: 'Cap Cana, Casa de Campo, Samaná', img: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=900&q=80&auto=format' },
  { title: 'Restaurants', sub: 'Playa Blanca, La Yola, Mitre', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format' },
  { title: 'Wellness', sub: 'Six Senses spa, Solaya, Bagua', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=80&auto=format' }
];

/* Place names in the scrolling band between sections. */
window.RL_PLACES = [
  'Cap Cana', 'Punta Cana', 'Casa de Campo', 'Las Terrenas', 'Samaná',
  'Bayahíbe', 'La Romana', 'Puerto Plata', 'Cabarete', 'Sosúa'
];
