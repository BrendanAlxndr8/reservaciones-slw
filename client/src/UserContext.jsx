import { createContext, useEffect, useState } from "react";
import axios from "./axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      axios
        .get('/api/profile')
        .then(({ data }) => {
          if (data) {
            setUser(data); // Asignar datos válidos del usuario
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        })
        .finally(() => {
          setReady(true); // Siempre marca como listo, incluso si falla
        });
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}
