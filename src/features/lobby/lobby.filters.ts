import { SessionStatus, type SessionSummary } from '@/shared/protocol/session';

export enum CommonFilterValue {
  ALL = 'all',
}

export enum RankedFilterValue {
  ALL = 'all',
  RANKED = 'ranked',
  UNRANKED = 'unranked',
}

export enum LobbyPanel {
  JOIN = 'join',
  CREATE = 'create',
}

export type StatusFilter = CommonFilterValue.ALL | SessionStatus.WAITING | SessionStatus.IN_PROGRESS;
export type RankedFilter = RankedFilterValue;

export interface LobbyFilters {
  status: StatusFilter;
  ranked: RankedFilter;
  hideFullRooms: boolean;
}

export interface LobbyFilterOption<TValue extends string> {
  value: TValue;
  label: string;
}

export function getStatusFilterOptions(
  translate: (key: string) => string,
): LobbyFilterOption<StatusFilter>[] {
  return [
    { value: CommonFilterValue.ALL, label: translate('all') },
    { value: SessionStatus.WAITING, label: translate('waiting') },
    { value: SessionStatus.IN_PROGRESS, label: translate('inProgress') },
  ];
}

export function getRankedFilterOptions(
  translate: (key: string) => string,
): LobbyFilterOption<RankedFilter>[] {
  return [
    { value: RankedFilterValue.ALL, label: translate('all') },
    { value: RankedFilterValue.RANKED, label: translate('ranked') },
    { value: RankedFilterValue.UNRANKED, label: translate('unranked') },
  ];
}

export function resolveLobbyPanel(panelParam: string | null): LobbyPanel {
  return panelParam === LobbyPanel.CREATE ? LobbyPanel.CREATE : LobbyPanel.JOIN;
}

export function filterLobbySessions(
  sessions: SessionSummary[],
  filters: LobbyFilters,
): SessionSummary[] {
  return sessions.filter((session) => matchesLobbyFilters(session, filters));
}

function matchesLobbyFilters(session: SessionSummary, filters: LobbyFilters): boolean {
  if (filters.status !== CommonFilterValue.ALL && session.status !== filters.status) return false;
  if (filters.ranked === RankedFilterValue.RANKED && !session.ranked) return false;
  if (filters.ranked === RankedFilterValue.UNRANKED && session.ranked) return false;
  if (filters.hideFullRooms && session.member_count >= session.max_players) return false;
  return true;
}
