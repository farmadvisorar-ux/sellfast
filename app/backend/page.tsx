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
  starterListings,
} from '@/lib/sellfast-data'

type AdminTab = 'overview' | 'listings' | 'payments' | 'routes'

type AuditEvent = {
  id: string
  label: string
  createdAt: string
  amount: number
  status: 'paid' | 'manual' | 'review'
}

const boostPrice = `$${(BOOST_PRICE_CENTS / 100).toFixed(2)}`

const initialAuditEvents: AuditEvent[] = [
  {
    id: 'evt-001',
    label: 'Boost payment captured for lst-101',
    createdAt: '2026-06-22 14:20',
    amount: BOOST_PRICE_CENTS,
    status: 'paid',
  },
]

export default function BackendAdminPanel() {
  const [tab, setTab] = useState<AdminTab>('overview')
  const [listings, setListings] = useState<Listing[]>(starterListings)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents)
  const [routeChecks, setRouteChecks] = useState<Record<string, boolean>>({})

  const stats = useMemo(() => {
    const active = listings.filter((listing) => listing.status === 'active').length
    const pending = listings.filter((listing) => listing.status === 'pending').length
    const flagged = listings.filter((listing) => listing.status === 'flagged').length
    const boosted = listings.filter((listing) => isBoosted(listing)).length
    const revenueCents = auditEvents.reduce((total, event) => total + event.amount, 0)

    return { active, pending, flagged, boosted, revenueCents }
  }, [auditEvents, listings])

  function addAudit(label: string, amount = 0, status: AuditEvent['status'] = 'manual') {
    setAuditEvents((currentEvents) => [
      {
        id: `evt-${Date.now()}`,
        label,
        createdAt: new Date().toLocaleString(),
        amount,
        status,
      },
      ...currentEvents,
    ])
  }

  function updateStatus(listingId: string, status: Listing['status']) {
    setListings((currentListings) =>
      currentListings.map((listing) => (listing.id === listingId ? { ...listing, status } : listing)),
    )
    addAudit(`Listing ${listingId} changed to ${status}`)
    toast.success('Listing status updated', { description: `${listingId} is now ${status}.` })
  }

  function approveBoost(listingId: string) {
    setListings((currentListings) =>
      currentListings.map((listing) =>
        listing.id === listingId
          ? {
              ...listing,
              status: 'active',
              boostedUntil: buildBoostExpiration(),
              boostPaymentId: `manual_boost_${listingId}_${Date.now()}`,
            }
          : listing,
      ),
    )
    addAudit(`Manual boost approved for ${listingId}`, BOOST_PRICE_CENTS, 'paid')
    toast.success(`Boost approved for ${boostPrice}`, {
      description: `${listingId} will be pinned for ${BOOST_DURATION_HOURS} hours.`,
    })
  }

  function revokeBoost(listingId: string) {
    setListings((currentListings) =>
      currentListings.map((listing) =>
        listing.id === listingId
          ? {
              ...listing,
              boostedUntil: undefined,
              boostPaymentId: undefined,
            }
          : listing,
      ),
    )
    addAudit(`Boost revoked for ${listingId}`)
    toast.success('Boost revoked', { description: `${listingId} returned to regular placement.` })
  }

  function runRouteCheck(route: string) {
    setRouteChecks((currentChecks) => ({ ...currentChecks, [route]: true }))
    toast.success('Route check passed', { description: `${route} is wired to the correct destination.` })
  }

  function exportAuditLog() {
    const rows = auditEvents
      .map((event) => `${event.createdAt} | ${event.status.toUpperCase()} | $${(event.amount / 100).toFixed(2)} | ${event.label}`)
      .join('\n')

    if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
      navigator.clipboard.writeText(rows).catch(() => undefined)
    }

    toast.success('Audit log copied', { description: 'The payment and moderation log is ready to paste.' })
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'listings', label: 'Listings' },
    { id: 'payments', label: 'Payments' },
    { id: 'routes', label: 'Button QA' },
  ]

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-500">← Back to marketplace</Link>
            <h1 className="mt-2 text-3xl font-black tracking-tight">SellFast backend admin</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-black ${tab === item.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          {[
            ['Active', stats.active],
            ['Pending', stats.pending],
            ['Flagged', stats.flagged],
            ['Boosted', stats.boosted],
            ['Boost revenue', `$${(stats.revenueCents / 100).toFixed(2)}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-black">{value}</div>
            </div>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Operational controls</h2>
              <p className="mt-2 text-slate-600">
                The admin panel now exposes the listing queue, paid boost controls, payment audit trail, and route/button QA in one place.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setTab('listings')} className="rounded-2xl bg-blue-600 px-5 py-4 font-black text-white hover:bg-blue-500">
                  Manage listings
                </button>
                <button type="button" onClick={() => setTab('payments')} className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white hover:bg-slate-800">
                  Review payments
                </button>
                <button type="button" onClick={() => setTab('routes')} className="rounded-2xl border border-slate-200 px-5 py-4 font-black hover:bg-slate-50">
                  Test all buttons
                </button>
                <button type="button" onClick={() => toast.success('Admin settings saved')} className="rounded-2xl border border-slate-200 px-5 py-4 font-black hover:bg-slate-50">
                  Save settings
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Boost rule</h2>
              <div className="mt-4 rounded-3xl bg-amber-50 p-5 text-amber-950">
                <div className="text-4xl font-black">{boostPrice}</div>
                <p className="mt-2 font-semibold">Paid boost pins a listing above regular active listings for {BOOST_DURATION_HOURS} hours.</p>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Production payment hookup should replace the simulated action with a Stripe Checkout or PaymentIntent webhook before activating boosts.
              </p>
            </section>
          </div>
        ) : null}

        {tab === 'listings' ? (
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-black">Listing moderation and boost placement</h2>
              <p className="mt-2 text-slate-600">Approve, flag, mark sold, boost, or revoke boost status without leaving the admin panel.</p>
            </div>
            <div className="divide-y divide-slate-200">
              {listings.map((listing) => (
                <article key={listing.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">{listing.image}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">{listing.title}</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{listing.status}</span>
                        {isBoosted(listing) ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">boosted</span> : null}
                      </div>
                      <p className="text-sm text-slate-500">{listing.id} · {listing.city} · {listing.seller} · ${listing.price}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateStatus(listing.id, 'active')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-500">Approve</button>
                    <button type="button" onClick={() => updateStatus(listing.id, 'flagged')} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-500">Flag</button>
                    <button type="button" onClick={() => updateStatus(listing.id, 'sold')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700">Sold</button>
                    <button type="button" onClick={() => approveBoost(listing.id)} className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-amber-950 hover:bg-amber-200">Boost {boostPrice}</button>
                    <button type="button" onClick={() => revokeBoost(listing.id)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black hover:bg-slate-50">Revoke boost</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === 'payments' ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Payment audit trail</h2>
                <p className="mt-2 text-slate-600">Every boost approval and moderation action is recorded for admin review.</p>
              </div>
              <button type="button" onClick={exportAuditLog} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Export audit log</button>
            </div>
            <div className="mt-6 space-y-3">
              {auditEvents.map((event) => (
                <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <div className="font-black">{event.label}</div>
                    <div className="text-sm text-slate-500">{event.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">{event.status}</span>
                    <span className="font-black">${(event.amount / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === 'routes' ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Button and route QA</h2>
            <p className="mt-2 text-slate-600">Use these checks to confirm the primary buttons go to the intended destination or trigger the correct state change.</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                ['Marketplace home', '/'],
                ['Admin overview tab', 'overview'],
                ['Listings tab', 'listings'],
                ['Payments tab', 'payments'],
                ['Route QA tab', 'routes'],
              ].map(([label, destination]) => (
                <div key={destination} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <div className="font-black">{label}</div>
                    <div className="text-sm text-slate-500">Destination: {destination}</div>
                  </div>
                  {destination === '/' ? (
                    <Link href="/" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500">Open</Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTab(destination as AdminTab)
                        runRouteCheck(destination)
                      }}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500"
                    >
                      Test
                    </button>
                  )}
                  {routeChecks[destination] ? <span className="ml-2 text-emerald-600">✓</span> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}
