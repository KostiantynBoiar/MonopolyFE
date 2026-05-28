import { landingFeatures } from './features.data';
import { Container, Icon } from '@/shared/ui';

export function FeatureRow() {
  return (
    <section className="border-t border-line py-16 md:py-20">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {landingFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className={`flex flex-col gap-4 px-0 py-8 md:px-8 md:py-0 ${
                index > 0 ? 'border-t border-line md:border-l md:border-t-0' : ''
              } ${index === 0 ? 'md:pl-0' : ''} ${index === landingFeatures.length - 1 ? 'md:pr-0' : ''}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-blue-50 text-blue">
                <Icon name={feature.icon} />
              </div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {feature.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
