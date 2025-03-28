
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './Message.css';

// const Message = () => {
//   const [selectedFriend, setSelectedFriend] = useState(null);
//   const [messageText, setMessageText] = useState('');
//   const [friends, setFriends] = useState([]);
//   const [error, setError] = useState('');

//   // Fetch friends from the server when the component mounts
//   useEffect(() => {
//     const fetchFriends = async () => {
//       try {
//         const response = await axios.get('http://localhost:5002/friends');
//         if (response.data.message) {
//           setError(response.data.message); // Handle 'No friends' message
//         } else {
//           setFriends(response.data.friends); // Set friends list
//         }
//       } catch (err) {
//         console.error('Error fetching friends:', err);
//         setError('Failed to fetch friends');
//       }
//     };

//     fetchFriends();
//   }, []); // Run once when the component mounts

//   const handleFriendClick = (friend) => {
//     setSelectedFriend(friend);
//   };

//   const handleMessageChange = (e) => {
//     setMessageText(e.target.value);
//   };

//   const handleSendMessage = () => {
//     if (messageText.trim()) {
//       console.log(`Message sent to ${selectedFriend.first} ${selectedFriend.last}: ${messageText}`);
//       setMessageText('');
//     }
//   };

//   return (
//     <div className="message-container">
//       <div className="side-panel">
//         <h3>Friends</h3>
//         {error ? (
//           <p>{error}</p> // Display error message if there are no friends
//         ) : (
//           <ul>
//             {friends.map((friend) => (
//               <li
//                 key={friend.id}
//                 className={selectedFriend?.id === friend.id ? 'active' : ''}
//                 onClick={() => handleFriendClick(friend)}
//               >
//                 {friend.first} {friend.last}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       <div className="message-panel">
//         {selectedFriend ? (
//           <>
//             <div className="header">
//               <h3>Chat with {selectedFriend.first} {selectedFriend.last}</h3>
//             </div>
//             <div className="chat-box">
//               <div className="messages">
//                 {/* Example messages */}
//                 <div className="message">
//                   <div className="sender">You:</div>
//                   <div className="content">Hello, {selectedFriend.first}!</div>
//                 </div>
//                 <div className="message">
//                   <div className="sender">{selectedFriend.first} {selectedFriend.last}:</div>
//                   <div className="content">Hi there!</div>
//                 </div>
//               </div>
//             </div>
//             <div className="input-area">
//               <input
//                 type="text"
//                 value={messageText}
//                 onChange={handleMessageChange}
//                 placeholder="Type your message..."
//               />
//               <button onClick={handleSendMessage}>Send</button>
//             </div>
//           </>
//         ) : (
//           <div className="no-chat">
//             <p>Select a friend to start chatting!</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Message;



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './Message.css';

const socket = io("http://localhost:5002"); // Connect to backend

const Message = () => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]); // Store messages
  const [error, setError] = useState('');

  // Fetch friends when component mounts
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get('http://localhost:5002/friends');
        if (response.data.message) {
          setError(response.data.message);
        } else {
          setFriends(response.data.friends);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError('Failed to fetch friends');
      }
    };

    fetchFriends();
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prevMessages) => [...prevMessages, { sender: data.senderId, content: data.message }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    setMessages([]); // Clear chat when selecting a new friend
  };

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedFriend) {
      const senderId = "YOUR_USER_ID"; // Replace with actual logged-in user ID
      const receiverId = selectedFriend.id;

      // Send message to backend via Socket.IO
      socket.emit("sendMessage", { senderId, receiverId, message: messageText });

      // Update UI immediately (optimistic update)
      setMessages([...messages, { sender: senderId, content: messageText }]);
      setMessageText('');
    }
  };

  return (
    <div className="message-container">
      <div className="side-panel">
        <h3>Friends</h3>
        {error ? (
          <p>{error}</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li
                key={friend.id}
                className={selectedFriend?.id === friend.id ? 'active' : ''}
                onClick={() => handleFriendClick(friend)}
              >
                {friend.first} {friend.last}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="message-panel">
        {selectedFriend ? (
          <>
            <div className="header">
              <h3>Chat with {selectedFriend.first} {selectedFriend.last}</h3>
            </div>
            <div className="chat-box">
              <div className="messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender === "YOUR_USER_ID" ? "sent" : "received"}`}>
                    <div className="sender">{msg.sender === "YOUR_USER_ID" ? "You" : selectedFriend.first}:</div>
                    <div className="content">{msg.content}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="input-area">
              <input
                type="text"
                value={messageText}
                onChange={handleMessageChange}
                placeholder="Type your message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-chat">
            <p>Select a friend to start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;