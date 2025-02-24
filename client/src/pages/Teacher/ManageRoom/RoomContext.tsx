import { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../../../services/ApiService';
import { RoomType } from 'src/Types/RoomType';
import React from "react";

type RoomContextType = {
  rooms: RoomType[];
  selectedRoom: RoomType | null;
  selectRoom: (roomId: string) => void;
  createRoom: (title: string) => Promise<void>;
};

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);

  useEffect(() => {
    const loadRooms = async () => {
      const userRooms = await ApiService.getUserRooms();
      setRooms(userRooms as RoomType[]);
    };
    loadRooms();
  }, []);

  // Sélectionner une salle
  const selectRoom = (roomId: string) => {
    const room = rooms.find(r => r._id === roomId) || null;
    setSelectedRoom(room);
    localStorage.setItem('selectedRoomId', roomId);
  };

  // Créer une salle
  const createRoom = async (title: string) => {
    const newRoomId = await ApiService.createRoom(title);
    const updatedRooms = await ApiService.getUserRooms();
    setRooms(updatedRooms as RoomType[]);
    selectRoom(newRoomId);
  };

  return (
    <RoomContext.Provider value={{ rooms, selectedRoom, selectRoom, createRoom }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRooms must be used within a RoomProvider');
  return context;
};