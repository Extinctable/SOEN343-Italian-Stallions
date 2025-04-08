// Events/EventManager.jsx
import React, { useState } from 'react';
import './EventManager.css';

// Command Pattern classes
class EventCommand {
  execute() {
    throw new Error("Method not implemented");
  }
  undo() {
    throw new Error("Method not implemented");
  }
}

class CreateEventCommand extends EventCommand {
  constructor(event, addEventFn, removeEventFn) {
    super();
    this.event = event;
    this.addEventFn = addEventFn;
    this.removeEventFn = removeEventFn;
  }
  execute() {
    this.addEventFn(this.event);
    console.log("Created event:", this.event);
  }
  undo() {
    this.removeEventFn(this.event.id);
    console.log("Undid creation of event:", this.event);
  }
}

// Template Pattern for Report Generation
class ReportGenerator {
  generateReport(data) {
    const header = this.header();
    const body = this.body(data);
    const footer = this.footer();
    return `${header}\n${body}\n${footer}`;
  }
  header() {
    return "Default Header";
  }
  body(data) {
    return JSON.stringify(data, null, 2);
  }
  footer() {
    return "Default Footer";
  }
}

class EventReportGenerator extends ReportGenerator {
  header() {
    return "Event Report";
  }
  footer() {
    return "End of Event Report";
  }
}

// Observer Pattern implementation
class Subject {
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
    this.observers.forEach(observer => observer.update(data));
  }
}

class Observer {
  update(data) {
    console.log("Observer received update:", data);
  }
}

const EventManager = () => {
  const [events, setEvents] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [report, setReport] = useState("");

  // Create an observer subject and subscribe a dummy observer that uses alert() for notification.
  const subject = new Subject();
  const dummyObserver = { update: (data) => alert("Event Update: " + JSON.stringify(data)) };
  subject.subscribe(dummyObserver);

  // Helper functions to add or remove events from state.
  const addEvent = (event) => {
    setEvents(prev => [...prev, event]);
  };

  const removeEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleCreateEvent = () => {
    const newEvent = {
      id: Date.now(),
      title: `Demo Event ${events.length + 1}`,
      description: "This is a demo event created using the Command Pattern",
      date: new Date().toLocaleString(),
      status: "Scheduled",
    };

    const command = new CreateEventCommand(newEvent, addEvent, removeEvent);
    command.execute();
    setCommandHistory(prev => [...prev, command]);

    // Notify observers about the new event
    subject.notify({ action: "create", event: newEvent });
  };

  const handleUndo = () => {
    if (commandHistory.length === 0) return;
    const lastCommand = commandHistory[commandHistory.length - 1];
    lastCommand.undo();
    setCommandHistory(prev => prev.slice(0, -1));

    // Notify observers about the undo operation
    subject.notify({ action: "undo", event: "Last creation undone" });
  };

  const handleGenerateReport = () => {
    const generator = new EventReportGenerator();
    const generatedReport = generator.generateReport(events);
    setReport(generatedReport);
  };

  return (
    <div className="event-manager-container">
      <h2>Event Manager</h2>
      <div className="buttons">
        <button onClick={handleCreateEvent}>Create Event</button>
        <button onClick={handleUndo}>Undo Last Command</button>
        <button onClick={handleGenerateReport}>Generate Report</button>
      </div>
      <div className="events-list">
        {events.length === 0 ? <p>No events created yet.</p> : events.map(event => (
          <div key={event.id} className="event-item">
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p><strong>Date:</strong> {event.date}</p>
            <p>Status: {event.status}</p>
          </div>
        ))}
      </div>
      {report && (
        <div className="report-section">
          <h3>Event Report</h3>
          <pre>{report}</pre>
        </div>
      )}
    </div>
  );
};

export default EventManager;
