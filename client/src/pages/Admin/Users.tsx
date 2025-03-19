import React, { useState, useEffect } from "react";
import ApiService from '../../services/ApiService';
import { AdminTableType } from "../../Types/AdminTableType";
import AdminTable from "../../components/AdminTable/AdminTable";

const Users: React.FC = () => {
  const [users, setUsers] = useState<AdminTableType[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await ApiService.getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = (data: AdminTableType) => {
    setUsers(users.filter(user => user.email !== data.email));
  };

  
  const labelMap = {
    _id: "ID",
    name: "Enseignant",
    email: "Courriel",
    created_at: "Création",
    roles: "Rôles",
  };

  return (
    <AdminTable 
      data={users} 
      onDelete={handleDelete} 
      filterKeys={["_id", "password"]} 
      labelMap={labelMap}
    />
    
  );
};

export default Users;
