// /src/Notifications.js
import React, { useState, useEffect } from "react";
import "./Notifications.css";

// Observer Subject implementation
export class NotificationSubject {
  constructor() {
    this.observers = [];
  }
  subscribe(observer) {
    this.observers.push(observer);
  }
  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  notify(data) {
    this.observers.forEach(observer => observer(data));
  }
}

// Create and export a singleton subject instance.
export const notificationSubject = new NotificationSubject();

const Notifications = () => {
  // (Your existing notifications component code)
  const userRole = "attendee"; // or "organizer"
  const userId = userRole === "attendee" ? 2 : 1;
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/notifications?user_id=${userId}`);
      if (!response.ok) {
        console.error("Failed to fetch notifications. Status:", response.status);
        return;
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  return (
    <div className="notifications-container">
      <h2>{userRole === "organizer" ? "Attendee Registrations" : "Event Updates"}</h2>
      {notifications.length === 0 ? (
        <p className="no-notifications">No notifications available.</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((notification) => (
            <li key={notification.id} className="notification-item">
              <p className="notification-message">{notification.message}</p>
              <p className="notification-date">
                {new Date(notification.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
