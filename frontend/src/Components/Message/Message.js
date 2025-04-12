
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
//////////////////////////////////////////
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
///////////////////////////////
  // Listen for incoming messages
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prevMessages) => [...prevMessages, { sender: data.senderId, content: data.message }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);
/////////////////////////////// getting id 
const [userId, setUserId] = useState(null);

useEffect(() => {
  const fetchUserId = async () => {
    try {
      const response = await axios.get('http://localhost:5002/me');
      setUserId(response.data.userId);
    } catch (err) {
      console.error("Failed to fetch user ID", err);
    }
  };

  fetchUserId();
}, []);
//////////////////////////////
  // const handleFriendClick = (friend) => {
  //   console.log("Selected friend ID:", friend.id);

  //   setSelectedFriend(friend);
  //   setMessages([]); // Clear chat when selecting a new friend
  // };
/////////////////////////
const handleFriendClick = async (friend) => {
  console.log("Selected friend ID:", friend.id);
  setSelectedFriend(friend);
  setMessages([]); // Clear current chat

  if (!userId) return;

  try {
    const response = await axios.get(`http://localhost:5002/messages/${friend.id}`);
    const fetchedMessages = response.data;
    //console.log("fetchedMessages:   ", formattedMessages);
    const formattedMessages = fetchedMessages.map(msg => ({
      sender: msg.sender,
      content: msg.text
    }));
    console.log("messages:  ", formattedMessages);
    setMessages(formattedMessages);
  } catch (error) {
    console.error("Failed to fetch messages", error);
  }
};
//////////////////////////
  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedFriend && userId !== null) {
      const receiverId = selectedFriend.id;
  
      socket.emit("sendMessage", {
        senderId: userId,
        receiverId,
        message: messageText
      });
  
      setMessages([...messages, { sender: userId, content: messageText }]);
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
                  <div key={index} className={`message ${msg.sender ===  userId  ? "sent" : "received"}`}>
                    <div className="sender">{msg.sender ===  userId  ? "You" : selectedFriend.first}:</div>
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