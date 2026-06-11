import { getTranslations } from 'next-intl/server';
import { Container } from '@/shared/ui/Container';

export async function SiteFooter() {
  const t = await getTranslations('Landing');
  return (
    <footer className="border-t border-line bg-navy">
      <Container className="py-10 text-center">
        <p className="font-display text-sm font-semibold text-surface">TYCOON</p>
        <p className="mt-2 text-xs text-surface/60">
          {t('footerTagline')}
        </p>
      </Container>
    </footer>
  );
}
