import { NextResponse } from 'next/server'
import { BOOST_DURATION_HOURS, BOOST_PRICE_CENTS, buildBoostExpiration } from '@/lib/sellfast-data'

type BoostRequest = {
  listingId?: string
  amountCents?: number
}

export async function POST(request: Request) {
  let body: BoostRequest

  try {
    body = (await request.json()) as BoostRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.listingId) {
    return NextResponse.json({ error: 'listingId is required.' }, { status: 400 })
  }

  if (body.amountCents !== BOOST_PRICE_CENTS) {
    return NextResponse.json(
      {
        error: `Boosts must be exactly $${(BOOST_PRICE_CENTS / 100).toFixed(2)}.`,
        expectedAmountCents: BOOST_PRICE_CENTS,
      },
      { status: 400 },
    )
  }

  return NextResponse.json({
    listingId: body.listingId,
    amountCents: BOOST_PRICE_CENTS,
    status: 'paid',
    boostPaymentId: `boost_${body.listingId}_${Date.now()}`,
    boostedUntil: buildBoostExpiration(),
    durationHours: BOOST_DURATION_HOURS,
  })
}
