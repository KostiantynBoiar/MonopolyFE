import { Spinner } from '@/shared/ui/Spinner';

export default function LobbyLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <Spinner size="lg" />
    </div>
  );
}
