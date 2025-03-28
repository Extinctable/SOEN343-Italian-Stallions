import React, { useState, useEffect } from "react";
import "./Network.css";
let pwOther;
const Network = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       const response = await fetch("http://localhost:5002/returnUsers");
  //       if (!response.ok) {
  //         throw new Error("Network response was not ok");
  //       }
  //       const data = await response.json();
  //       setUsers(data);
  //     } catch (error) {
  //       console.error("Error fetching users:", error);
  //     }
  //   };

  //   fetchUsers();
  // }, []);
  useEffect(() => {
    const fetchUsersAndRequests = async () => {
      try {
        
  
        // Fetch friend requests
        const requestResponse = await fetch("http://localhost:5002/getFriendRequests");
        if (!requestResponse.ok) {
          throw new Error("Failed to fetch friend requests");
        }
        const friendRequests = await requestResponse.json();
  
        // Fetch all users
        const usersResponse = await fetch("http://localhost:5002/returnUsers");
        if (!usersResponse.ok) {
          throw new Error("Failed to fetch users");
        }
        const allUsers = await usersResponse.json();
  
        // Mark users who sent a friend request
        const updatedUsers = allUsers.map(user => {
          const request = friendRequests.find(req => req.senderID === user.id);
          if (request) {
            return { ...user, requested: true }; // Mark as requested
          }
          return user;
        });
  
        // Combine friend requests first, then other users
        const sortedUsers = [...friendRequests.map(req => ({ ...req, requested: true })), ...updatedUsers];
  
        setUsers(sortedUsers);
      } catch (error) {
        console.error("Error fetching users and requests:", error);
      }
    };
  
    fetchUsersAndRequests();
  }, []);
  
  const sendRequest = async ( receiverID) => {
    
console.log('Received receiverID:', receiverID);

pwOther =receiverID;

    try {
      const response = await fetch("http://localhost:5002/sendFriendRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({  receiverID }), // Sending senderID and receiverID
      });
  
      const data = await response.json();
      console.log(data.message); // Handle response
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const acceptRequest = async ( receiverID) => {
    console.log('Received 88 receiverID:', receiverID);
    try {
      const response = await fetch("http://localhost:5002/acceptFriendRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
        //,body: JSON.stringify({  receiverID }), // Sending senderID and receiverID
      });
  
      const data = await response.json();
      console.log(data.message); // Handle response

      setUsers(users.map(user =>
        user.id === pwOther  ? { ...user, friend: true, requested: false } : user
    ));
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  return (
    <div className="network-container">
      <h2 className="network-title">Find Friends</h2>
      <input
        type="text"
        className="network-search"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul className="network-list">
        {users
          .filter(user => user.firstName.toLowerCase().includes(search.toLowerCase()) || user.lastName.toLowerCase().includes(search.toLowerCase()))
          .map(user => (
            <li key={user.id} className="network-item">
              <span className="network-username">{user.firstName} {user.lastName}</span>
              {!user.friend && !user.requested && (
                <button className="network-button add" onClick={() => sendRequest(user.id)}>
                  Add Friend
                </button>
              )}
              {user.requested && (
                <button className="network-button accept" onClick={() => acceptRequest(true)}>
                  Accept
                </button>
              )}
              {user.friend && <span className="network-friend-label">✔ Friend</span>}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Network;
