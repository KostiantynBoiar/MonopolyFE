export enum SessionStatus {
  WAITING     = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED    = 'finished',
}

export enum SessionVisibility {
  PUBLIC  = 'public',
  PRIVATE = 'private',
}

export enum MemberRole {
  HOST   = 'host',
  PLAYER = 'player',
}

export enum StatusDot {
  CONNECTING = 'bg-gold animate-pulse',
  OPEN = 'bg-green',
  ERROR = 'bg-red',
  CLOSED = 'bg-muted',
}