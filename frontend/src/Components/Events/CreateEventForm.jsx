// /src/Events/CreateEventForm.jsx
import React, { useState } from 'react';
import './CreateEventForm.css';
import axios from 'axios';

const CreateEventForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    price: '',   // New field for price
    status: 'Upcoming' // default
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine date and time
    const fullDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
    try {
      await axios.post('http://localhost:5002/api/events', {
        ...formData,
        event_date: fullDateTime.toISOString(),
        price: parseFloat(formData.price) || 0  // Ensure price is numeric
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Event created!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create event');
    }
  };

  return (
    <div className="create-event-form">
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" onChange={handleChange} required />
        <textarea name="description" placeholder="Description" onChange={handleChange} required />
        <input type="date" name="event_date" onChange={handleChange} required />
        <input type="time" name="event_time" onChange={handleChange} required />
        <input name="location" placeholder="Location" onChange={handleChange} required />
        <input name="price" type="number" step="0.01" placeholder="Price" onChange={handleChange} required />
        <button type="submit">Create</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default CreateEventForm;
