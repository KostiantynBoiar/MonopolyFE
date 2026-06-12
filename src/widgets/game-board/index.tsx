'use client';

import type { ReactElement } from 'react';
import { BoardContainer } from '@/features/game-board';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import type { BoardPlayer, WalkingPlayer } from '@/features/game-board';
import type { BoardTileSelectionTone } from '@/features/game-board/game-board.enums';
import type { Player } from '@/features/player-panel/player-panel.schema';
import type { LogEntry, PropertyState } from '@/shared/protocol/game-state';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { GameCenterGrid } from './components/GameCenterGrid';
import type { GameCenterGridProps } from './components/GameCenterGrid';
import { WaitingCenterGrid } from './components/WaitingCenterGrid';
import type { WaitingCenterGridProps } from './components/WaitingCenterGrid';
import { EmptyGameState, FinishedGameState } from './components/RoomStates';
import { MobileGameRoom } from './components/mobile/MobileGameRoom';
import { MobileWaitingRoom } from './components/mobile/MobileWaitingRoom';
import { MobileFinishedState } from './components/mobile/MobileFinishedState';
import { MobileEmptyState } from './components/mobile/MobileEmptyState';

export { ActiveOverlay } from './components/FullOverlay';
export type { FullOverlayProps, TradeBuilderData } from './components/FullOverlay';

export enum RoomPhase {
  WAITING  = 'waiting',
  PLAYING  = 'playing',
  FINISHED = 'finished',
  EMPTY    = 'empty',
}

export interface BoardDisplayData {
  spaces: PropertyState[];
  boardPlayers: BoardPlayer[];
  walkingPlayers?: WalkingPlayer[];
  sidebarPlayers: Player[];
  log: LogEntry[];
  selectedPosition: number | null;
  tileSelectionTones?: Partial<Record<number, BoardTileSelectionTone>>;
  focusPositions?: Set<number> | null;
  onSelectPosition: (pos: number) => void;
  viewerId?: string;
  createdAt?: string;
  gameMode: GameMode;
  onSurrender: () => void;
}

export interface WaitingPhaseProps {
  phase: RoomPhase.WAITING;
  gameMode: GameMode;
  waitingSidebarPlayers: Player[];
  waiting: WaitingCenterGridProps;
}

export interface PlayingPhaseProps extends BoardDisplayData {
  phase: RoomPhase.PLAYING;
  center: GameCenterGridProps;
}

export interface FinishedPhaseProps extends BoardDisplayData {
  phase: RoomPhase.FINISHED;
  winnerName: string | null;
  isLeaving: boolean;
  onLeave: () => void;
}

export interface EmptyPhaseProps {
  phase: RoomPhase.EMPTY;
  gameMode: GameMode;
  sessionCode: string;
  wsStatus: string;
}

export type GameBoardWidgetProps =
  | WaitingPhaseProps
  | PlayingPhaseProps
  | FinishedPhaseProps
  | EmptyPhaseProps;

// ─── Phase render handlers ─────────────────────────────────────────────────

function renderWaiting(props: WaitingPhaseProps, isMobile: boolean): ReactElement {
  if (isMobile) {
    return <MobileWaitingRoom {...props.waiting} />;
  }
  return (
    <div className="h-full min-h-0 p-[4px]">
      <BoardContainer
        centerContent={<WaitingCenterGrid {...props.waiting} />}
        sidebarPlayers={props.waitingSidebarPlayers}
        gameMode={props.gameMode}
      />
    </div>
  );
}

function renderPlaying(props: PlayingPhaseProps, isMobile: boolean): ReactElement {
  if (isMobile) {
    return (
      <MobileGameRoom
        {...props.center}
        spaces={props.spaces}
        players={props.boardPlayers}
        walkingPlayers={props.walkingPlayers}
        sidebarPlayers={props.sidebarPlayers}
        selectedPosition={props.selectedPosition}
        tileSelectionTones={props.tileSelectionTones}
        focusPositions={props.focusPositions}
        onSelectPosition={props.onSelectPosition}
        viewerId={props.viewerId}
        createdAt={props.createdAt}
        gameMode={props.gameMode}
      />
    );
  }
  return (
    <div className="h-full min-h-0 p-[4px]">
      <BoardContainer
        centerContent={<GameCenterGrid {...props.center} />}
        spaces={props.spaces}
        players={props.boardPlayers}
        walkingPlayers={props.walkingPlayers}
        sidebarPlayers={props.sidebarPlayers}
        log={props.log}
        selectedPosition={props.selectedPosition}
        tileSelectionTones={props.tileSelectionTones}
        onSelectPosition={props.onSelectPosition}
        focusPositions={props.focusPositions}
        viewerId={props.viewerId}
        createdAt={props.createdAt}
        gameMode={props.gameMode}
        onSurrender={props.onSurrender}
      />
    </div>
  );
}

function renderFinished(props: FinishedPhaseProps, isMobile: boolean): ReactElement {
  if (isMobile) {
    return (
      <MobileFinishedState
        winnerName={props.winnerName}
        onLeave={props.onLeave}
        isLeaving={props.isLeaving}
      />
    );
  }
  return (
    <div className="h-full min-h-0 p-[4px]">
      <BoardContainer
        centerContent={
          <FinishedGameState
            winnerName={props.winnerName}
            onLeave={props.onLeave}
            isLeaving={props.isLeaving}
          />
        }
        spaces={props.spaces}
        players={props.boardPlayers}
        sidebarPlayers={props.sidebarPlayers}
        log={props.log}
        viewerId={props.viewerId}
        createdAt={props.createdAt}
        gameMode={props.gameMode}
        onSurrender={props.onSurrender}
      />
    </div>
  );
}

function renderEmpty(props: EmptyPhaseProps, isMobile: boolean): ReactElement {
  if (isMobile) {
    return <MobileEmptyState sessionCode={props.sessionCode} status={props.wsStatus} />;
  }
  return (
    <div className="h-full min-h-0 p-[4px]">
      <BoardContainer
        centerContent={<EmptyGameState sessionCode={props.sessionCode} status={props.wsStatus} />}
        gameMode={props.gameMode}
      />
    </div>
  );
}

type PhaseHandler = (props: GameBoardWidgetProps, isMobile: boolean) => ReactElement;

const phaseHandlers: Record<RoomPhase, PhaseHandler> = {
  [RoomPhase.WAITING]:  (p, m) => renderWaiting(p  as WaitingPhaseProps,  m),
  [RoomPhase.PLAYING]:  (p, m) => renderPlaying(p  as PlayingPhaseProps,  m),
  [RoomPhase.FINISHED]: (p, m) => renderFinished(p as FinishedPhaseProps, m),
  [RoomPhase.EMPTY]:    (p, m) => renderEmpty(p    as EmptyPhaseProps,    m),
};

export function GameBoardWidget(props: GameBoardWidgetProps) {
  const isMobile = useIsMobile();
  return phaseHandlers[props.phase](props, isMobile);
}
