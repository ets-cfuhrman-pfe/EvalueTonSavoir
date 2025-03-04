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
      const roomsList = userRooms as RoomType[];
      setRooms(roomsList);
  
      const savedRoomId = localStorage.getItem('selectedRoomId');
      if (savedRoomId) {
        const savedRoom = roomsList.find(r => r._id === savedRoomId);
        if (savedRoom) {
          setSelectedRoom(savedRoom);
          return;
        }
      }
  
      if (roomsList.length > 0) {
        setSelectedRoom(roomsList[0]);
        localStorage.setItem('selectedRoomId', roomsList[0]._id);
      }
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
    // Créer la salle et récupérer l'objet complet
    const newRoom = await ApiService.createRoom(title);
    
    // Mettre à jour la liste des salles
    const updatedRooms = await ApiService.getUserRooms();
    setRooms(updatedRooms as RoomType[]);
    
    // Sélectionner la nouvelle salle avec son ID
    selectRoom(newRoom); // Utiliser l'ID de l'objet retourné
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