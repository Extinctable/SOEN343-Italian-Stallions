import React, { useState, useEffect } from 'react';
import './FinancialManager.css';
import { generatePDFReport } from '../../utils/reportGenerator';

// Payment Strategy Pattern Implementation
class PaymentStrategy {
  pay(amount) {
    throw new Error("Method not implemented");
  }
}
  
class CreditCardPayment extends PaymentStrategy {
  pay(amount) {
    return `Processed credit card payment of $${amount}`;
  }
}
  
class PayPalPayment extends PaymentStrategy {
  pay(amount) {
    return `Processed PayPal payment of $${amount}`;
  }
}
  
const FinancialManager = () => {
  // Change userRole to "attendee" or "organizer" to test both flows.
  const userRole = "organizer"; // or "organizer"
  
  // For attendee flow.
  const attendeeId = 2; // Replace with authenticated attendee user ID
  const [unpaidRegistrations, setUnpaidRegistrations] = useState([]);
  const [attendeePaymentHistory, setAttendeePaymentHistory] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('creditcard');
  const [paymentMessage, setPaymentMessage] = useState('');
  
  // For organizer flow.
  const organizerId = 1; // Replace with authenticated organizer user ID
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [organizerPayments, setOrganizerPayments] = useState([]);
  
  // -------------------
  // Attendee Flow Functions
  // -------------------
  const fetchAttendeeRegistrations = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/userEvents?user_id=${attendeeId}`);
      const data = await response.json();
      // Filter for registrations with status "Registered" (unpaid)
      const pending = data.filter(reg => reg.status === 'Registered');
      setUnpaidRegistrations(pending);
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  };
  
  const fetchAttendeePaymentHistory = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/payments?user_id=${attendeeId}`);
      const data = await response.json();
      setAttendeePaymentHistory(data);
    } catch (err) {
      console.error("Error fetching attendee payment history:", err);
    }
  };
  
  const handlePayEvent = async (registration) => {
    // Use the event's price; if missing, default to 0.
    const eventPrice = registration.price ? Number(registration.price) : 0;
    let strategy;
    if (selectedMethod === 'creditcard') {
      strategy = new CreditCardPayment();
    } else {
      strategy = new PayPalPayment();
    }
    const resultText = strategy.pay(eventPrice);
    setPaymentMessage(resultText);
    
    // Record payment in user_payments.
    try {
      const paymentResponse = await fetch('http://localhost:5002/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: attendeeId,
          event_id: registration.event_id,  // <<-- Use event_id from the registration record.
          payment_method: selectedMethod === 'creditcard' ? "Credit Card" : "PayPal",
          amount: eventPrice
        })
      });
      const paymentRecord = await paymentResponse.json();
      
      // Now update the registration status to "Paid".
      const updateResponse = await fetch(`http://localhost:5002/api/userEvents/${registration.registration_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "Paid" })
      });
      await updateResponse.json();
      
      // Update local state.
      setUnpaidRegistrations(prev => prev.filter(reg => reg.registration_id !== registration.registration_id));
      setAttendeePaymentHistory(prev => [paymentRecord, ...prev]);
    } catch (err) {
      console.error("Error processing payment for event", registration.event_id, err);
    }
  };
  
  
  // -------------------
  // Organizer Flow Functions
  // -------------------
  const fetchOrganizerEvents = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/events?organizer_id=${organizerId}`);
      const data = await response.json();
      setOrganizerEvents(data);
    } catch (err) {
      console.error("Error fetching organizer events:", err);
    }
  };
  
  // New endpoint to fetch payments for events by organizer.
  const fetchOrganizerPayments = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/eventPayments?organizer_id=${organizerId}`);
      const data = await response.json();
      setOrganizerPayments(data);
    } catch (err) {
      console.error("Error fetching organizer payments:", err);
    }
  };
  
  // For revenue display: Sum payments per event.
  const revenueByEvent = organizerEvents.map(event => {
    const eventPayments = organizerPayments.filter(payment => payment.event_id === event.id);
    const totalRevenue = eventPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { ...event, revenue: totalRevenue };
  });
  
  // -------------------
  // useEffect Hooks
  // -------------------
  useEffect(() => {
    if (userRole === "attendee") {
      fetchAttendeeRegistrations();
      fetchAttendeePaymentHistory();
    }
  }, [userRole]);
  
  useEffect(() => {
    if (userRole === "organizer") {
      fetchOrganizerEvents();
      fetchOrganizerPayments();
    }
  }, [userRole]);
  
  // -------------------
  // Report Generation (common)
  // -------------------
  const handleGenerateReport = () => {
    // For attendees, report registered events; for organizer, report revenue summary.
    if (userRole === "attendee") {
      generatePDFReport(attendeePaymentHistory, 'financial');
    } else {
      generatePDFReport(revenueByEvent, 'financial');
    }
  };
  
  return (
    <div className="financial-manager-container">
      {userRole === "attendee" ? (
        <>
          <h2>Financial Manager - Pending Payments</h2>
          <div className="pending-events">
            <h3>Events Awaiting Payment</h3>
            {unpaidRegistrations.length === 0 ? (
              <p>All registered events have been paid for.</p>
            ) : (
              unpaidRegistrations.map(reg => (
                <div key={reg.registration_id} className="event-card">
                  <h4>{reg.title || "Untitled Event"}</h4>
                  <p>{reg.description || "No description"}</p>
                  <p><strong>Date:</strong> {reg.event_date ? new Date(reg.event_date).toLocaleString() : "N/A"}</p>
                  <p className="price">Price: ${reg.price !== null ? reg.price : "N/A"}</p>
                  <button onClick={() => handlePayEvent(reg)}>Pay Now</button>
                </div>
              ))
            )}
          </div>
  
          <div className="payment-options">
            <h3>Payment Options</h3>
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method:</label>
              <select 
                id="paymentMethod" 
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <option value="creditcard">Credit Card</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            {paymentMessage && <p className="result">{paymentMessage}</p>}
          </div>
  
          <div className="payment-history">
            <h3>Payment History</h3>
            {attendeePaymentHistory.length === 0 ? (
              <p>No payments recorded yet.</p>
            ) : (
              <ul>
                {attendeePaymentHistory.map(tx => (
                  <li key={tx.id}>
                    {tx.eventTitle || "Event ID " + tx.event_id} - ${tx.amount} paid via {tx.payment_method} on {new Date(tx.payment_date).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={handleGenerateReport}>Export Payment History as PDF</button>
          </div>
        </>
      ) : (
        // Organizer Flow:
        <>
          <h2>Financial Manager - Revenue Summary</h2>
          <div className="revenue-summary">
            {organizerEvents.length === 0 ? (
              <p>No events created.</p>
            ) : (
              organizerEvents.map(event => {
                const revenue = revenueByEvent.find(e => e.id === event.id)?.revenue || 0;
                return (
                  <div key={event.id} className="event-card">
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <p><strong>Date:</strong> {new Date(event.event_date).toLocaleString()}</p>
                    <p><strong>Revenue:</strong> ${revenue.toFixed(2)}</p>
                  </div>
                );
              })
            )}
          </div>
          <button onClick={handleGenerateReport}>Export Revenue Report as PDF</button>
        </>
      )}
    </div>
  );
};

export default FinancialManager;
