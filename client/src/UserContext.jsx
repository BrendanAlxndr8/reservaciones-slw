import { createContext, useEffect, useState } from "react";
import axios from "./axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setReady(true);
        return;
      }

      try {
        // Adjuntar el token a las solicitudes si existe
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const { data } = await axios.get('/api/profile');
        setUser(data); // Asignar datos válidos del usuario
      } catch (error) {
        if (error.response?.status === 401) {
          // Token inválido o expirado
          console.error("Token inválido. Cerrando sesión.");
          localStorage.removeItem('token');
          setUser(null);
          window.location.href = '/login'; // Redirigir al login
        } else {
          console.error("Error al obtener el perfil:", error);
        }
      } finally {
        setReady(true);
      }
    };

    fetchProfile();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}
