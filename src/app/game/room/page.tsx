type GameRoomPageProps = {
  searchParams: Promise<{ code?: string; sessionId?: string }>;
};

export default async function GameRoomPage({ searchParams }: GameRoomPageProps) {
  const params = await searchParams;
  const code = params.code ?? params.sessionId;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Game room</h1>
      {code ? (
        <p className="font-mono text-sm text-muted">Code: {code}</p>
      ) : (
        <p className="text-sm text-muted">No session code provided.</p>
      )}
    </div>
  );
}
