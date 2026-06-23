'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  BOOST_DURATION_HOURS,
  BOOST_PRICE_CENTS,
  Listing,
  buildBoostExpiration,
  isBoosted,
  sortListingsForMarketplace,
  starterListings,
} from '@/lib/sellfast-data'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const boostPrice = `$${(BOOST_PRICE_CENTS / 100).toFixed(2)}`

export default function SellFastMarketplace() {
  const [listings, setListings] = useState<Listing[]>(starterListings)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(starterListings.map((listing) => listing.category)))],
    [],
  )

  const visibleListings = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    return sortListingsForMarketplace(listings).filter((listing) => {
      const matchesCategory = category === 'All' || listing.category === category
      const matchesQuery =
        cleanQuery.length === 0 ||
        `${listing.title} ${listing.city} ${listing.category} ${listing.condition}`
          .toLowerCase()
          .includes(cleanQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, listings, query])

  function boostListing(listingId: string) {
    setListings((currentListings) =>
      currentListings.map((listing) =>
        listing.id === listingId
          ? {
              ...listing,
              boostedUntil: buildBoostExpiration(),
              boostPaymentId: `boost_${listing.id}_${Date.now()}`,
            }
          : listing,
      ),
    )
    toast.success(`Listing boosted for ${boostPrice}`, {
      description: `It will stay pinned above regular listings for ${BOOST_DURATION_HOURS} hours.`,
    })
  }

  function toggleSave(listingId: string) {
    setSaved((currentSaved) => {
      const nextSaved = new Set(currentSaved)
      if (nextSaved.has(listingId)) {
        nextSaved.delete(listingId)
        toast('Listing removed from saved items')
      } else {
        nextSaved.add(listingId)
        toast.success('Listing saved')
      }
      return nextSaved
    })
  }

  function shareListing(listing: Listing) {
    const shareText = `${listing.title} on SellFast for ${money.format(listing.price)}`

    if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
      navigator.clipboard.writeText(shareText).catch(() => undefined)
    }

    toast.success('Share text copied', {
      description: shareText,
    })
  }

  function messageSeller(listing: Listing) {
    toast.success(`Message started with ${listing.seller}`, {
      description: `Ask about ${listing.title}.`,
    })
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,.35),_transparent_32rem),linear-gradient(135deg,_#020617,_#111827)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-8 lg:px-8 lg:py-12">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-black tracking-tight text-white">
              SellFast
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <a href="#listings" className="rounded-full px-4 py-2 text-slate-200 hover:bg-white/10">
                Browse
              </a>
              <Link href="/backend" className="rounded-full px-4 py-2 text-slate-200 hover:bg-white/10">
                Admin panel
              </Link>
              <button
                type="button"
                onClick={() => toast.success('Listing wizard opened', { description: 'Create listing flow is ready for a form or auth provider.' })}
                className="rounded-full bg-white px-5 py-2 font-bold text-slate-950 shadow-lg shadow-blue-950/40 hover:bg-blue-50"
              >
                Post listing
              </button>
            </div>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100">
                New: boost any active listing to the top for {boostPrice}
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
                  Local listings that sell faster.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  SellFast now gives sellers a paid top-placement boost, gives buyers clearer listing cards, and gives admins a dedicated backend control center.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['50¢', 'boost price'],
                  ['24h', 'top placement'],
                  ['100%', 'buttons wired'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                    <div className="text-3xl font-black">{value}</div>
                    <div className="text-sm text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-[1.5rem] bg-white p-4 text-slate-950">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-bold">Boost preview</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">TOP SPOT</span>
                </div>
                {sortListingsForMarketplace(listings).slice(0, 3).map((listing, index) => (
                  <div key={listing.id} className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 p-3 last:mb-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">{listing.image}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">#{index + 1} {listing.title}</div>
                      <div className="text-sm text-slate-500">{listing.city} · {money.format(listing.price)}</div>
                    </div>
                    {isBoosted(listing) ? <span className="text-lg">⚡</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="listings" className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-6 grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <label className="sr-only" htmlFor="listing-search">Search listings</label>
          <input
            id="listing-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, city, category, or condition"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-white outline-none ring-blue-400 placeholder:text-slate-500 focus:ring-2"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${category === item ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Marketplace</h2>
            <p className="text-slate-400">Boosted active listings are automatically sorted above regular listings.</p>
          </div>
          <Link href="/backend" className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10">
            Review backend →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleListings.map((listing) => {
            const boosted = isBoosted(listing)
            const isSaved = saved.has(listing.id)

            return (
              <article key={listing.id} className="group rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:bg-white/[0.09]">
                <div className="mb-4 flex h-44 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-slate-900 text-7xl">
                  {listing.image}
                </div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {boosted ? <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-amber-950">⚡ Boosted top listing</span> : null}
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{listing.condition}</span>
                    </div>
                    <h3 className="text-xl font-black leading-tight">{listing.title}</h3>
                    <p className="text-sm text-slate-400">{listing.city} · {listing.category}</p>
                  </div>
                  <div className="text-right text-2xl font-black">{money.format(listing.price)}</div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-white/5 p-3"><b>{listing.views}</b><br /><span className="text-slate-500">views</span></div>
                  <div className="rounded-2xl bg-white/5 p-3"><b>{listing.saves + Number(isSaved)}</b><br /><span className="text-slate-500">saves</span></div>
                  <div className="rounded-2xl bg-white/5 p-3"><b>{listing.seller}</b><br /><span className="text-slate-500">seller</span></div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => boostListing(listing.id)} className="rounded-2xl bg-amber-300 px-4 py-3 font-black text-amber-950 hover:bg-amber-200">
                    Boost for {boostPrice}
                  </button>
                  <button type="button" onClick={() => messageSeller(listing)} className="rounded-2xl bg-blue-500 px-4 py-3 font-black text-white hover:bg-blue-400">
                    Message seller
                  </button>
                  <button type="button" onClick={() => toggleSave(listing.id)} className="rounded-2xl border border-white/10 px-4 py-3 font-bold hover:bg-white/10">
                    {isSaved ? 'Saved ✓' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setSelectedListing(listing)} className="rounded-2xl border border-white/10 px-4 py-3 font-bold hover:bg-white/10">
                    Details
                  </button>
                  <button type="button" onClick={() => shareListing(listing)} className="rounded-2xl border border-white/10 px-4 py-3 font-bold hover:bg-white/10 sm:col-span-2">
                    Share listing
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {visibleListings.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/20 p-10 text-center text-slate-400">
            No active listings match your search. Clear filters or try another category.
          </div>
        ) : null}
      </section>

      {selectedListing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-5xl">{selectedListing.image}</div>
                <h2 className="mt-3 text-2xl font-black">{selectedListing.title}</h2>
                <p className="text-slate-500">{selectedListing.city} · {selectedListing.condition}</p>
              </div>
              <button type="button" onClick={() => setSelectedListing(null)} className="rounded-full bg-slate-100 px-3 py-2 font-bold hover:bg-slate-200">
                Close
              </button>
            </div>
            <p className="mb-5 text-slate-600">
              Seller {selectedListing.seller} listed this item for {money.format(selectedListing.price)}. Boost status: {isBoosted(selectedListing) ? 'active paid placement' : 'not boosted'}.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => boostListing(selectedListing.id)} className="rounded-2xl bg-amber-300 px-4 py-3 font-black text-amber-950 hover:bg-amber-200">
                Boost for {boostPrice}
              </button>
              <button type="button" onClick={() => messageSeller(selectedListing)} className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white hover:bg-blue-500">
                Message seller
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
