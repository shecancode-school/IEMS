import { PrismaClient, type GuestType } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // Clean slate for a repeatable seed.
  await db.meetingRequest.deleteMany();
  await db.meetingSlot.deleteMany();
  await db.invitation.deleteMany();
  await db.eventAttendee.deleteMany();
  await db.event.deleteMany();
  await db.user.deleteMany();

  // 1) Admin user.
  const admin = await db.user.create({
    data: {
      email: 'admin@igire.example',
      fullName: 'IGIRE Admin',
      role: 'ADMIN',
    },
  });

  // 2) One LIVE event.
  const start = new Date('2026-09-01T09:00:00Z');
  const event = await db.event.create({
    data: {
      name: 'IGIRE Global Networking Forum 2026',
      startsAt: start,
      endsAt: new Date('2026-09-01T18:00:00Z'),
      venue: 'Kigali Convention Centre',
      status: 'LIVE',
    },
  });

  // 3) Eight 30-minute meeting slots.
  const slots = await Promise.all(
    Array.from({ length: 8 }, (_, i) => {
      const slotStart = new Date(start.getTime() + i * 30 * 60_000);
      return db.meetingSlot.create({
        data: {
          eventId: event.id,
          startsAt: slotStart,
          endsAt: new Date(slotStart.getTime() + 30 * 60_000),
          location: `Table ${i + 1}`,
        },
      });
    }),
  );

  // 4) Six sample attendees across all three guest types.
  const people: Array<{
    email: string;
    fullName: string;
    guestType: GuestType;
    sector?: string;
    headline: string;
  }> = [
    { email: 'amina@igire.example', fullName: 'Amina Uwase', guestType: 'PARTICIPANT', headline: 'Fintech founder' },
    { email: 'jean@igire.example', fullName: 'Jean Habimana', guestType: 'PARTICIPANT', headline: 'Climate investor' },
    { email: 'sana@igire.example', fullName: 'Sana Keita', guestType: 'PARTICIPANT', headline: 'Health-tech PM' },
    { email: 'gov@igire.example', fullName: 'Hon. Claudine Niyibizi', guestType: 'SECTOR_GUEST', sector: 'Government', headline: 'Ministry of ICT' },
    { email: 'embassy@igire.example', fullName: 'David Mwangi', guestType: 'SECTOR_GUEST', sector: 'Embassy', headline: 'Trade attaché' },
  ];

  const attendees = [];
  for (const p of people) {
    const user = await db.user.create({
      data: { email: p.email, fullName: p.fullName, role: 'GUEST' },
    });
    const attendee = await db.eventAttendee.create({
      data: {
        eventId: event.id,
        userId: user.id,
        guestType: p.guestType,
        sector: p.sector ?? null,
        headline: p.headline,
        interests: ['networking', p.guestType.toLowerCase()],
      },
    });
    attendees.push(attendee);
  }

  // The 6th attendee is a PLUS_ONE correctly linked to the first PARTICIPANT.
  const host = attendees[0];
  if (!host) throw new Error('Expected at least one participant to host a plus-one');
  const plusOneUser = await db.user.create({
    data: { email: 'plusone@igire.example', fullName: 'Eric Uwase', role: 'GUEST' },
  });
  await db.eventAttendee.create({
    data: {
      eventId: event.id,
      userId: plusOneUser.id,
      guestType: 'PLUS_ONE',
      headline: 'Guest of Amina Uwase',
      interests: ['networking'],
      invitedByAttendeeId: host.id, // +1 lineage
    },
  });

  // eslint-disable-next-line no-console
  console.warn(
    `Seeded: admin=${admin.email}, event=${event.name}, slots=${slots.length}, attendees=6 (incl. 1 plus-one linked to ${host.id}).`,
  );
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
