import { useContext } from 'react';
import { RoomType } from 'src/Types/RoomType';
import { createContext } from 'react';

//import { RoomContext } from './RoomContext';

type RoomContextType = {
    rooms: RoomType[];
    selectedRoom: RoomType | null;
    selectRoom: (roomId: string) => void;
    createRoom: (title: string) => Promise<void>;
  };
  
export const RoomContext = createContext<RoomContextType | undefined>(undefined);
  
export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRooms must be used within a RoomProvider');
  return context;
};
