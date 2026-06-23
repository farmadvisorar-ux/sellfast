import { NextResponse } from 'next/server'
import { isBoosted, starterListings } from '@/lib/sellfast-data'

export async function GET() {
  const active = starterListings.filter((listing) => listing.status === 'active').length
  const pending = starterListings.filter((listing) => listing.status === 'pending').length
  const flagged = starterListings.filter((listing) => listing.status === 'flagged').length
  const boosted = starterListings.filter((listing) => isBoosted(listing)).length

  return NextResponse.json({
    active,
    pending,
    flagged,
    boosted,
    generatedAt: new Date().toISOString(),
  })
}
