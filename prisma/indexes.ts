import { PrismaClient } from '@prisma/client';

// Creates the MongoDB partial unique indexes that Prisma cannot express in the
// schema. These enforce "at most one ACCEPTED meeting per (attendee, slot)",
// covering both the requester side and the recipient side.
//
// Run after `prisma db push`: `npm run db:indexes`. Safe to re-run (createIndexes
// is idempotent for identical definitions).

const db = new PrismaClient();

async function main() {
  await db.$runCommandRaw({
    createIndexes: 'meeting_requests',
    indexes: [
      {
        key: { requesterId: 1, slotId: 1 },
        name: 'accepted_requester_slot_unique',
        unique: true,
        partialFilterExpression: { status: 'ACCEPTED' },
      },
      {
        key: { recipientId: 1, slotId: 1 },
        name: 'accepted_recipient_slot_unique',
        unique: true,
        partialFilterExpression: { status: 'ACCEPTED' },
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.warn('Created partial unique indexes on meeting_requests (ACCEPTED per attendee+slot).');
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
