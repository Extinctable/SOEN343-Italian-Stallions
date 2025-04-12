// /src/Events/UpdateEventForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateEventForm.css'; // Reuse same styling.

const UpdateEventForm = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    price: '',
    status: '',
  });

  useEffect(() => {
    const [date, time] = new Date(event.event_date).toISOString().split('T');
    setFormData({
      title: event.title,
      description: event.description,
      event_date: date,
      event_time: time.slice(0, 5),
      location: event.location,
      price: event.price ? event.price.toString() : '', // price field
      status: event.status || 'Upcoming'
    });
  }, [event]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
    const updatedData = {
      title: formData.title,
      description: formData.description,
      event_date: fullDateTime.toISOString(),
      location: formData.location,
      price: parseFloat(formData.price) || 0,
      status: formData.status || "Upcoming"
    };

    try {
      const response = await axios.put(`http://localhost:5002/api/events/${event.id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // After updating, notify registered users.
      try {
        const regResponse = await axios.get(`http://localhost:5002/api/userEvents?event_id=${event.id}`);
        if (regResponse.status === 200) {
          const registrations = regResponse.data;
          for (const reg of registrations) {
            try {
              await axios.post('http://localhost:5002/api/notifications', {
                user_id: reg.user_id,
                event_id: event.id,
                message: `The event "${updatedData.title}" has been updated.`
              });
              console.log(`Notification sent to user ${reg.user_id}`);
            } catch (notifyErr) {
              console.error(`Failed to notify user ${reg.user_id}:`, notifyErr);
            }
          }
        } else {
          console.warn("Failed to fetch user registrations for event.");
        }
      } catch (queryErr) {
        console.error("Failed to query userEvents:", queryErr);
      }
      
      alert('Event updated!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update event');
    }
  };

  return (
    <div className="create-event-form">
      <h2>Update Event</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" value={formData.title} onChange={handleChange} required />
        <textarea name="description" value={formData.description} onChange={handleChange} required />
        <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} required />
        <input type="time" name="event_time" value={formData.event_time} onChange={handleChange} required />
        <input name="location" value={formData.location} onChange={handleChange} required />
        <input name="price" type="number" step="0.01" value={formData.price} placeholder="Price" onChange={handleChange} required />
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button type="submit">Save Changes</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default UpdateEventForm;
