export default function AttendeeProfilePage({ params }: { params: { attendeeId: string } }) {
  return (
    <section>
      <h1 className="text-2xl font-bold">Attendee profile</h1>
      <p className="mt-2 text-gray-500">
        Placeholder for attendee <code className="rounded bg-gray-100 px-1">{params.attendeeId}</code>
        {' '}— headline, interests, and a “request meeting” action.
      </p>
    </section>
  );
}
