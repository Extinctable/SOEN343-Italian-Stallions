import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UpdateEventForm = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
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
      status: event.status || 'upcoming'
    });
  }, [event]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const fullDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
  
    // Prepare only the allowed fields
    const updatedData = {
      title: formData.title,
      description: formData.description,
      event_date: fullDateTime.toISOString(),
      location: formData.location,
      status: formData.status || "upcoming"
    };
  
    try {
      await axios.put(`http://localhost:5002/api/events/${event.id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
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
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit">Save Changes</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default UpdateEventForm;
