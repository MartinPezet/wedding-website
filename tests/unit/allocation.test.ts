// @vitest-environment node
import { describe, expect, it } from 'vitest'

// variable path so a missing module fails tests, not the whole file
const allocationUtil = async () => await import(`../../server/utils/${'allocation'}.ts`)

describe('pairing survives RSVP resubmission', () => {
  it('releases the partner when a resubmit replaces the paired room', async () => {
    const { createDb } = await import('../../server/utils/db')
    const { migrate } = await import('drizzle-orm/libsql/migrator')
    const { createParty } = await import('../../server/utils/parties')
    const { saveRsvp, getRoomRequests } = await import('../../server/utils/rsvp')
    const db = createDb(':memory:')
    await migrate(db, { migrationsFolder: 'server/db/migrations' })

    const submitMatchMe = async (partyId: number, guestId: number) =>
      saveRsvp(db, partyId, { phone: '', guests: [{ id: guestId, attending: true }], rooms: [{ night: 'of', choice: 'share_match' }] })

    const seeded = []
    for (const name of ['The Ables', 'The Bakers']) {
      const party = await createParty(db, { name, guests: [{ name: `${name} lead` }] })
      const full = await db.query.parties.findFirst({ where: (parties, { eq }) => eq(parties.id, party.id), with: { guests: true } })
      const guestId = full!.guests[0]!.id
      expect(await submitMatchMe(party.id, guestId)).toEqual({ ok: true })
      seeded.push({ partyId: party.id, guestId })
    }
    const [ables, bakers] = seeded as [typeof seeded[number], typeof seeded[number]]
    const { pairRooms } = await allocationUtil()
    const [ableRoom] = await getRoomRequests(db, ables.partyId)
    const [bakerRoom] = await getRoomRequests(db, bakers.partyId)
    expect(await pairRooms(db, ableRoom!.id, bakerRoom!.id)).toEqual({ ok: true })

    expect(await submitMatchMe(ables.partyId, ables.guestId)).toEqual({ ok: true })

    const [bakerAfter] = await getRoomRequests(db, bakers.partyId)
    expect(bakerAfter!.pairedWithId).toBeNull()
  })
})
