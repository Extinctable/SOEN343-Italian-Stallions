import React, { useState, useEffect } from 'react';
import './EventManager.css';
import { generatePDFReport } from '../../utils/reportGenerator';

// Dummy user role for demonstration ("organizer" or "attendee")
// In a real app, replace this with your authenticated user context.
const userRole = "organizer"; // Change to "attendee" to test attendee flow

// --------------------
// Command Pattern Classes for Organizer Flow (DB Implementation)
// --------------------
class EventCommand {
  async execute() {
    throw new Error("Method not implemented");
  }
  async undo() {
    throw new Error("Method not implemented");
  }
}

// Create Event Command: calls POST /api/events.
class CreateEventCommand extends EventCommand {
  constructor(eventData, addEventCallback) {
    super();
    this.eventData = eventData;
    this.addEventCallback = addEventCallback;
  }
  async execute() {
    try {
      const response = await fetch('http://localhost:5002/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.eventData)
      });
      const createdEvent = await response.json();
      this.addEventCallback(createdEvent);
      console.log("Created event:", createdEvent);
      // Save created event for undo
      this.createdEvent = createdEvent;
    } catch (err) {
      console.error("Error creating event:", err);
    }
  }
  async undo() {
    if (!this.createdEvent) return;
    try {
      const response = await fetch(`http://localhost:5002/api/events/${this.createdEvent.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      this.addEventCallback(null, this.createdEvent.id);
      console.log("Undid creation:", result);
    } catch (err) {
      console.error("Error undoing creation:", err);
    }
  }
}

// Update Event Command: calls PUT /api/events/:id.
class UpdateEventCommand extends EventCommand {
  constructor(eventId, newData, updateEventCallback, originalData) {
    super();
    this.eventId = eventId;
    this.newData = newData;
    this.updateEventCallback = updateEventCallback;
    this.originalData = originalData; // stored for undo
  }
  async execute() {
    try {
      const response = await fetch(`http://localhost:5002/api/events/${this.eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.newData)
      });
      const updatedEvent = await response.json();
      this.updateEventCallback(this.eventId, updatedEvent);
      console.log("Updated event:", updatedEvent);
    } catch (err) {
      console.error("Error updating event:", err);
    }
  }
  async undo() {
    try {
      const response = await fetch(`http://localhost:5002/api/events/${this.eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.originalData)
      });
      const restoredEvent = await response.json();
      this.updateEventCallback(this.eventId, restoredEvent);
      console.log("Undid update for event:", this.eventId);
    } catch (err) {
      console.error("Error undoing update:", err);
    }
  }
}

// Delete Event Command: calls DELETE /api/events/:id.
class DeleteEventCommand extends EventCommand {
  constructor(eventId, deleteEventCallback, eventData) {
    super();
    this.eventId = eventId;
    this.deleteEventCallback = deleteEventCallback;
    this.eventData = eventData; // stored for undo
  }
  async execute() {
    try {
      const response = await fetch(`http://localhost:5002/api/events/${this.eventId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      this.deleteEventCallback(this.eventId);
      console.log("Deleted event:", this.eventId, result);
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  }
  async undo() {
    try {
      // Re-create the deleted event.
      const response = await fetch('http://localhost:5002/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.eventData)
      });
      const restoredEvent = await response.json();
      this.deleteEventCallback(null, restoredEvent);
      console.log("Undid deletion:", restoredEvent);
    } catch (err) {
      console.error("Error undoing deletion:", err);
    }
  }
}

// --------------------
// End Organizer Command Classes
// --------------------

const EventManager = () => {
  // State for events (used in organizer flow)
  const [events, setEvents] = useState([]);
  // Command history for organizer commands (for undo)
  const [commandHistory, setCommandHistory] = useState([]);
  
  // States for attendee flow
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);

  // ------------------------
  // Organizer Flow Functions
  // ------------------------
  const fetchOrganizerEvents = async () => {
    try {
      // Replace with actual authenticated organizer's id.
      const response = await fetch('http://localhost:5002/api/events?organizer_id=1');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch organizer events:", err);
    }
  };

  const addEventLocal = (newEvent, deleteId) => {
    if (newEvent) {
      setEvents(prev => [...prev, newEvent]);
    } else if (deleteId) {
      setEvents(prev => prev.filter(ev => ev.id !== deleteId));
    }
  };

  const updateEventLocal = (id, updatedEvent) => {
    setEvents(prev => prev.map(ev => ev.id === id ? updatedEvent : ev));
  };

  const deleteEventLocal = (deleteId, restoredEvent) => {
    if (deleteId) {
      setEvents(prev => prev.filter(ev => ev.id !== deleteId));
    } else if (restoredEvent) {
      setEvents(prev => [...prev, restoredEvent]);
    }
  };

  const handleCreateEvent = async () => {
    console.log("Create Event button clicked");
    const newEventData = {
      title: `New Event ${events.length + 1}`,
      description: "Event created by organizer.",
      event_date: new Date().toISOString(),
      status: "Upcoming",
      organizer_id: 1, // Replace with actual organizer id
      location: "Concordia University"
    };
    const command = new CreateEventCommand(newEventData, addEventLocal);
    await command.execute();
    setCommandHistory(prev => [...prev, command]);
  };

  const handleUpdateEvent = async (eventId) => {
    const currentEvent = events.find(ev => ev.id === eventId);
    if (!currentEvent) return;
    const newData = { title: currentEvent.title + " (Updated)" };
    const command = new UpdateEventCommand(eventId, newData, updateEventLocal, { title: currentEvent.title });
    await command.execute();
    setCommandHistory(prev => [...prev, command]);
  };

  const handleDeleteEvent = async (eventId) => {
    const eventData = events.find(ev => ev.id === eventId);
    if (!eventData) return;
    const command = new DeleteEventCommand(eventId, deleteEventLocal, eventData);
    await command.execute();
    setCommandHistory(prev => [...prev, command]);
  };

  const handleUndo = async () => {
    if (commandHistory.length === 0) return;
    const lastCommand = commandHistory[commandHistory.length - 1];
    await lastCommand.undo();
    setCommandHistory(prev => prev.slice(0, -1));
  };

  // ------------------------
  // Attendee Flow Functions
  // ------------------------
  const userId = 1; // Replace with actual authenticated attendee user ID
  
  // Fetch registered events (from user_events joined with events)
  const fetchRegisteredEvents = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/userEvents?user_id=${userId}`);
      const data = await response.json();
      setRegisteredEvents(data);
    } catch (err) {
      console.error("Error fetching registered events:", err);
    }
  };

  // Fetch all events (available to register)
  const fetchAllEvents = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/events');
      const data = await response.json();
      setAllEvents(data);
    } catch (err) {
      console.error("Error fetching all events:", err);
    }
  };

  // Calculate available events = all events minus registered events
  useEffect(() => {
    if (userRole === "attendee") {
      fetchRegisteredEvents();
      fetchAllEvents();
    }
  }, []);

  useEffect(() => {
    if (userRole === "attendee" && allEvents.length > 0) {
      if (registeredEvents.length > 0) {
        const registeredIds = registeredEvents.map(ev => ev.id);
        const filtered = allEvents.filter(ev => !registeredIds.includes(ev.id));
        setAvailableEvents(filtered);
      } else {
        setAvailableEvents(allEvents);
      }
    }
  }, [allEvents, registeredEvents, userRole]);

  // Handle event registration (attendee flow)
  const handleRegisterEvent = async (event) => {
    try {
      const response = await fetch('http://localhost:5002/api/userEvents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, event_id: event.id })
      });
      if (!response.ok) {
        console.error("Registration failed for event", event.id);
        return;
      }
      const registration = await response.json();
      // After successful registration, update the registeredEvents and availableEvents lists.
      setRegisteredEvents(prev => [...prev, event]);
      setAvailableEvents(prev => prev.filter(ev => ev.id !== event.id));
    } catch (err) {
      console.error("Error during registration for event", event.id, err);
    }
  };

  // ------------------------
  // Report Generation (common to both flows)
  // ------------------------
  const handleGenerateReport = () => {
    // Use the events list for organizer or registeredEvents for attendee.
    const reportData = userRole === "organizer" ? events : registeredEvents;
    generatePDFReport(reportData, 'event');
  };

  return (
    <div className="event-manager-container">
      <h2>Event Manager</h2>

      {userRole === "organizer" ? (
        <>
          <div className="organizer-actions">
            <button onClick={handleCreateEvent}>Create Event</button>
            <button onClick={handleUndo}>Undo Last Command</button>
          </div>
          <div className="events-list">
            {events.length === 0 ? (
              <p>No events available.</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="event-item">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <p><strong>Date:</strong> {new Date(event.event_date).toLocaleString()}</p>
                  <p>Status: {event.status}</p>
                  <div className="organizer-controls">
                    <button onClick={() => handleUpdateEvent(event.id)}>Update</button>
                    <button onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        // Attendee flow:
        <>
          <section className="registered-events">
            <h3>Your Registered Events</h3>
            {registeredEvents.length === 0 ? (
              <p>You have not registered for any events yet.</p>
            ) : (
              registeredEvents.map(event => (
                <div key={event.id} className="event-item">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <p><strong>Date:</strong> {new Date(event.event_date).toLocaleString()}</p>
                  <p>Status: {event.status}</p>
                </div>
              ))
            )}
          </section>
          <section className="browse-events">
            <h3>Available Events</h3>
            {availableEvents.length === 0 ? (
              <p>No new events available for registration.</p>
            ) : (
              availableEvents.map(event => (
                <div key={event.id} className="event-item">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <p><strong>Date:</strong> {new Date(event.event_date).toLocaleString()}</p>
                  <p>Location: {event.location}</p>
                  <button onClick={() => handleRegisterEvent(event)}>Register</button>
                </div>
              ))
            )}
          </section>
        </>
      )}

      <div className="report-section">
        <button onClick={handleGenerateReport}>Export Events Report as PDF</button>
      </div>
    </div>
  );
};

export default EventManager;
