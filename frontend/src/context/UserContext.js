import { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User state

  // Load user from localStorage on mount
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

  // Function to log in the user
  const login = (userData) => {
    localStorage.setItem("userEmail", userData.email); // Store email
    setUser(userData); // Update user state
  };

  // Function to log out the user
  const logout = () => {
    localStorage.removeItem("userEmail"); // Remove from storage
    setUser(null); // Reset user state
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use user context
export const useUser = () => useContext(UserContext);

