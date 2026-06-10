import { getTranslations } from 'next-intl/server';
import { Brand, Button, Container } from '@/shared/ui';

export default async function NotFoundPage() {
  const t = await getTranslations('NotFound');

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <Container className="flex min-h-dvh flex-col">
        <header className="flex h-16 items-center justify-between">
          <Brand />
        </header>

        <section className="grid flex-1 place-items-center py-12">
          <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
            <p className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-semibold text-muted shadow-sm">
              {t('eyebrow')}
            </p>

            <div className="flex flex-col gap-3">
              <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-none text-ink">
                {t('title')}
              </h1>
              <p className="mx-auto max-w-lg text-base leading-relaxed text-muted md:text-lg">
                {t('description')}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button as="a" href="/home" variant="gold" className="w-full sm:w-auto">
                {t('goHome')}
              </Button>
              <Button as="a" href="/lobby" variant="ghost" className="w-full sm:w-auto">
                {t('openLobby')}
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
