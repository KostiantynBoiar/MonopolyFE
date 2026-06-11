'use client';

import type { ReactNode } from 'react';
import { FilterPill } from '@/shared/ui/FilterPill';
import type { LobbyFilterOption, RankedFilter, StatusFilter } from '../lobby.filters';

interface LobbyFiltersProps {
  statusLabel: string;
  modeLabel: string;
  capacityLabel: string;
  hideFullLabel: string;
  statusFilter: StatusFilter;
  rankedFilter: RankedFilter;
  hideFullRooms: boolean;
  statusOptions: LobbyFilterOption<StatusFilter>[];
  rankedOptions: LobbyFilterOption<RankedFilter>[];
  onStatusChange: (value: StatusFilter) => void;
  onRankedChange: (value: RankedFilter) => void;
  onHideFullRoomsToggle: () => void;
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 rounded-sm border border-line bg-paper/70 px-2.5 py-2 sm:px-3">
      <legend className="px-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-muted sm:text-[10px]">
        {label}
      </legend>
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">{children}</div>
    </fieldset>
  );
}

export function LobbyFilters({
  statusLabel,
  modeLabel,
  capacityLabel,
  hideFullLabel,
  statusFilter,
  rankedFilter,
  hideFullRooms,
  statusOptions,
  rankedOptions,
  onStatusChange,
  onRankedChange,
  onHideFullRoomsToggle,
}: LobbyFiltersProps) {
  return (
    <div className="mb-3 rounded-sm border border-line bg-surface p-2 shadow-sm sm:mb-4 sm:p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        <FilterGroup label={statusLabel}>
          {statusOptions.map(({ value, label }) => (
            <FilterPill
              key={value}
              active={statusFilter === value}
              onClick={() => onStatusChange(value)}
            >
              {label}
            </FilterPill>
          ))}
        </FilterGroup>

        <FilterGroup label={modeLabel}>
          {rankedOptions.map(({ value, label }) => (
            <FilterPill
              key={value}
              active={rankedFilter === value}
              onClick={() => onRankedChange(value)}
            >
              {label}
            </FilterPill>
          ))}
        </FilterGroup>

        <FilterGroup label={capacityLabel}>
          <FilterPill active={hideFullRooms} onClick={onHideFullRoomsToggle}>
            {hideFullLabel}
          </FilterPill>
        </FilterGroup>
      </div>
    </div>
  );
}
