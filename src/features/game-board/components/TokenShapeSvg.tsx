'use client';

import { useId } from 'react';
import { TOKEN_SHAPE_PATH, type TokenShape } from '../token-shapes';

interface TokenShapeSvgProps {
  shape: TokenShape;
  /** Resolved hex colour — fills plain tokens, backs transparent avatars. */
  color: string;
  /** When present, the avatar image is clipped to the shape silhouette. */
  avatarUrl?: string | null;
  /** Any CSS length; the token is always square. */
  size: string;
  className?: string;
}

// Stroke widths are in viewBox units (0..100). White sits outside, dark hairline
// inside — mirroring the previous circular token's outline + box-shadow ring.
const RING_WHITE = 5;
const RING_DARK = 1.6;
const SHADOW = 'drop-shadow(0 3px 9px rgba(0,0,0,0.55))';

export function TokenShapeSvg({ shape, color, avatarUrl, size, className }: TokenShapeSvgProps) {
  const clipId = `token-clip-${useId()}`;
  const d = TOKEN_SHAPE_PATH[shape];

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      aria-hidden="true"
      // Size goes through CSS, not the SVG width/height attributes: the callers
      // pass clamp()/vmin values, which are invalid SVG <length> syntax and get
      // dropped (the token would fall back to the ~300px replaced-element default).
      style={{ width: size, height: size, display: 'block', flexShrink: 0, overflow: 'visible', filter: SHADOW }}
    >
      {avatarUrl ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={d} />
            </clipPath>
          </defs>
          <path d={d} fill={color} />
          <image
            href={avatarUrl}
            x={0}
            y={0}
            width={100}
            height={100}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        </>
      ) : (
        <path d={d} fill={color} />
      )}
      <path d={d} fill="none" stroke="rgba(255,255,255,0.96)" strokeWidth={RING_WHITE} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={RING_DARK} strokeLinejoin="round" />
    </svg>
  );
}
