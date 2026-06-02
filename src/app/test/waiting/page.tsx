'use client';

import { useState } from 'react';
import { BoardContainer } from '@/features/game-board';
import { TOKEN_COLORS } from '@/features/player-panel';
import { WaitingActionsPanel, WaitingChatPanel, WaitingInviteCodePanel, SessionStatus, SessionVisibility, MemberRole } from '@/features/lobby';
import type { SessionDetail } from '@/features/lobby';
import type { ChatMessage } from '@/features/chat/chat.types';
import { TokenColor } from '@/shared/protocol/game-state.enums';
import { TOKEN_ORDER } from '@/shared/config/constants';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SESSION: SessionDetail = {
  id:           'test-session-1',
  invite_code:  'TYC-W8X2',
  status:       SessionStatus.WAITING,
  visibility:   SessionVisibility.PRIVATE,
  member_count: 3,
  max_players:  16,
  host:         { id: 'u1', display_name: 'You (host)' },
  created_at:   new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  members: [
    { user_id: 'u1', display_name: 'You (host)', role: MemberRole.HOST,   joined_at: new Date().toISOString() },
    { user_id: 'u2', display_name: 'Carol',       role: MemberRole.PLAYER, joined_at: new Date().toISOString() },
    { user_id: 'u3', display_name: 'Dave',         role: MemberRole.PLAYER, joined_at: new Date().toISOString() },
  ],
  your_role: MemberRole.HOST,
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', kind: 'chat', author: 'Carol', token: TokenColor.RED,   text: 'Ready when you are!', ts: Date.now() - 1000 * 90 },
  { id: 'm2', kind: 'chat', author: 'Dave',  token: TokenColor.GREEN, text: "Same, let's go 🎲",   ts: Date.now() - 1000 * 45 },
];

// Players for BoardContainer sidebar (name + token label)
const SIDEBAR_PLAYERS = MOCK_SESSION.members.map((m, i) => ({
  id:             m.user_id,
  name:           m.display_name,
  balance:        0,
  position:       0,
  token:          TOKEN_ORDER[i % TOKEN_ORDER.length],
  ownedPositions: [],
  isActive:       false,
  isBankrupt:     false,
  inJail:         false,
}));

// Players for BoardContainer — all tokens sit on GO (position 0), no ownership
const BOARD_PLAYERS = MOCK_SESSION.members.map((m, i) => ({
  id:         m.user_id,
  position:   0,
  tokenColor: TOKEN_COLORS[TOKEN_ORDER[i % TOKEN_ORDER.length]],
  isBankrupt: false,
}));

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestWaitingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  function handleSendMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id:     `local-${Date.now()}`,
        kind:   'chat',
        author: 'You (host)',
        token:  TokenColor.BLUE,
        text,
        ts:     Date.now(),
      },
    ]);
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-paper">
      <div className="flex-1 overflow-hidden">
        <BoardContainer
          players={BOARD_PLAYERS}
          spaces={[]}
          sidebarPlayers={SIDEBAR_PLAYERS}
          centerSlots={{
            actions: (
              <WaitingActionsPanel
                session={MOCK_SESSION}
                onLeave={() => {}}
                onStart={() => {}}
              />
            ),
            chat: (
              <WaitingChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            ),
            deed: (
              <WaitingInviteCodePanel
                session={MOCK_SESSION}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
