'use client';

import { DashboardData, GroupData, RoomsFilter, cleanGroupName, ROOMS } from '@/types';

interface RoomsTableProps {
  data: DashboardData;
  groups: GroupData[];
  filter: RoomsFilter;
  onFilterChange: (filter: RoomsFilter) => void;
}

export default function RoomsTable({ data, groups }: RoomsTableProps) {
  // Map groups to rooms
  const roomsWithData = ROOMS.map(room => {
    const group = groups.find(g => 
      cleanGroupName(g.имя).toLowerCase().includes(room.name.toLowerCase()) ||
      g.имя.toLowerCase().includes(room.short.toLowerCase())
    );
    return {
      ...room,
      group
    };
  });

  return (
    <div className="rooms-page">
      <div className="rooms-grid">
        {roomsWithData.map(room => (
          <div 
            key={room.short} 
            className={`room-card ${room.group ? 'has-data' : ''}`}
          >
            <div className="room-name">{room.name}</div>
            <div className="room-short">{room.short}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
