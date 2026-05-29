import { Spinner } from '@/shared/ui/Spinner';

export default function GameRoomLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-paper">
      <Spinner size="lg" />
    </div>
  );
}
