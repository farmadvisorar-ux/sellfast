export type ListingStatus = 'active' | 'pending' | 'flagged' | 'sold'

export type Listing = {
  id: string
  title: string
  price: number
  category: string
  city: string
  condition: string
  seller: string
  status: ListingStatus
  postedAt: string
  views: number
  saves: number
  image: string
  boostedUntil?: string
  boostPaymentId?: string
}

export const BOOST_PRICE_CENTS = 50
export const BOOST_DURATION_HOURS = 24

export const starterListings: Listing[] = [
  {
    id: 'lst-101',
    title: '2019 MacBook Air - clean and ready',
    price: 425,
    category: 'Electronics',
    city: 'Dallas, TX',
    condition: 'Good',
    seller: 'Mia R.',
    status: 'active',
    postedAt: '2026-06-22T14:20:00.000Z',
    views: 246,
    saves: 18,
    image: '💻',
    boostedUntil: '2026-06-24T14:20:00.000Z',
    boostPaymentId: 'boost_paid_101',
  },
  {
    id: 'lst-102',
    title: 'Leather sectional sofa',
    price: 650,
    category: 'Furniture',
    city: 'Plano, TX',
    condition: 'Like new',
    seller: 'Andre L.',
    status: 'active',
    postedAt: '2026-06-22T09:10:00.000Z',
    views: 183,
    saves: 11,
    image: '🛋️',
  },
  {
    id: 'lst-103',
    title: 'Trek mountain bike',
    price: 310,
    category: 'Sports',
    city: 'Fort Worth, TX',
    condition: 'Good',
    seller: 'Taylor S.',
    status: 'active',
    postedAt: '2026-06-21T19:30:00.000Z',
    views: 321,
    saves: 28,
    image: '🚲',
  },
  {
    id: 'lst-104',
    title: 'Commercial pressure washer',
    price: 520,
    category: 'Tools',
    city: 'Arlington, TX',
    condition: 'Excellent',
    seller: 'Ramon C.',
    status: 'pending',
    postedAt: '2026-06-23T08:45:00.000Z',
    views: 91,
    saves: 6,
    image: '🧰',
  },
  {
    id: 'lst-105',
    title: 'Gaming desk with LED shelf',
    price: 140,
    category: 'Furniture',
    city: 'Irving, TX',
    condition: 'Good',
    seller: 'Nora P.',
    status: 'active',
    postedAt: '2026-06-20T16:05:00.000Z',
    views: 144,
    saves: 9,
    image: '🖥️',
  },
  {
    id: 'lst-106',
    title: 'Pair of concert tickets',
    price: 90,
    category: 'Tickets',
    city: 'Dallas, TX',
    condition: 'Digital transfer',
    seller: 'Chris W.',
    status: 'flagged',
    postedAt: '2026-06-19T21:15:00.000Z',
    views: 402,
    saves: 14,
    image: '🎟️',
  },
]

export function isBoosted(listing: Listing, now = new Date()) {
  return Boolean(listing.boostedUntil && new Date(listing.boostedUntil).getTime() > now.getTime())
}

export function sortListingsForMarketplace(listings: Listing[], now = new Date()) {
  return [...listings]
    .filter((listing) => listing.status === 'active')
    .sort((a, b) => {
      const boostedDelta = Number(isBoosted(b, now)) - Number(isBoosted(a, now))
      if (boostedDelta !== 0) return boostedDelta
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    })
}

export function buildBoostExpiration(now = new Date()) {
  return new Date(now.getTime() + BOOST_DURATION_HOURS * 60 * 60 * 1000).toISOString()
}
