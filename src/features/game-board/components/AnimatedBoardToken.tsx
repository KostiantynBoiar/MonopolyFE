'use client';

import { useEffect, useRef, useState } from 'react';
import { getTileOuterEdgePct } from '@/shared/config/board-layout';
import type { BoardConfig } from '@/shared/config/board-layout';
import { WalkingAnimationVariant } from '@/shared/protocol/animation';
import { TokenShapeSvg } from '@/features/board-tile/components/TokenShapeSvg';
import type { WalkingPlayer } from '../game-board.types';
import { ANIM } from '../game-board.constants';

type AnimatedBoardTokenProps = WalkingPlayer & { config: BoardConfig };

export function AnimatedBoardToken({
  id,
  currentPos,
  tokenColor,
  tokenShape,
  variant = WalkingAnimationVariant.NORMAL,
  config,
}: AnimatedBoardTokenProps) {
  const prevPosRef            = useRef(currentPos);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const prev    = prevPosRef.current;
    const prevIdx = config.positionIndexByPosition[prev] ?? 0;
    const curIdx  = config.positionIndexByPosition[currentPos] ?? 0;
    const delta   = Math.abs(curIdx - prevIdx);
    if (variant !== WalkingAnimationVariant.DRAG && delta > config.positions.length / 2) {
      setAnimate(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(true);
    }
    prevPosRef.current = currentPos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPos]);

  const { x, y }             = getTileOuterEdgePct(currentPos, config);
  const { easing, duration } = ANIM[variant];

  return (
    <div
      key={id}
      aria-hidden="true"
      style={{
        position:      'absolute',
        left:          `${x}%`,
        top:           `${y}%`,
        transform:     'translate(-50%, -50%)',
        transition:    animate
          ? `left ${duration}ms ${easing}, top ${duration}ms ${easing}`
          : 'none',
        zIndex:        60,
        pointerEvents: 'none',
        willChange:    'left, top',
      }}
    >
      <TokenShapeSvg shape={tokenShape} color={tokenColor} size="clamp(20px, 2.6vmin, 38px)" />
    </div>
  );
}
