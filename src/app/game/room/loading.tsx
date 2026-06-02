import Link from 'next/link';

export default function GameRoomLoading() {
  return (
    <main className="flex h-screen items-center justify-center bg-paper px-4">
      <section className="w-full max-w-md rounded-[12px] border border-line bg-surface p-5 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Loading room</h1>
        <p className="mt-2 text-sm text-muted">
          If this takes too long, return to the lobby and rejoin the room.
        </p>
        <Link
          href="/lobby"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-sm border border-blue-600 bg-blue px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600"
        >
          Back to lobby
        </Link>
      </section>
    </main>
  );
}
