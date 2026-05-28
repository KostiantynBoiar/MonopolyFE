import { BoardPreview } from './BoardPreview';
import { JoinWithCode } from './JoinWithCode';
import { Button, Container, Icon, StatusDot } from '@/shared/ui';

type HeroProps = {
  onlineCount?: number;
};

export function Hero({ onlineCount }: HeroProps) {
  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
          <div className="flex flex-col gap-6">
            {onlineCount !== undefined && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted shadow-sm">
                <StatusDot />
                <span>{onlineCount.toLocaleString()} players online</span>
              </div>
            )}

            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-ink">
              Play the classic property game <em className="italic text-blue">online</em>
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-muted md:text-lg">
              Real-time multiplayer tables with private rooms and built-in negotiation.
              Create a session, share a code, and trade your way to the top.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button as="a" href="/lobby/new" variant="gold">
                Create a game
                <Icon name="arrow" />
              </Button>
              <JoinWithCode />
            </div>
          </div>

          <BoardPreview />
        </div>
      </Container>
    </section>
  );
}
