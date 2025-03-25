import { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = not loaded yet

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;
  
    fetch(`http://localhost:5002/user?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => {
        console.error("Failed to fetch user", err);
        setUser(null);
      });
  }, []);
  

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
