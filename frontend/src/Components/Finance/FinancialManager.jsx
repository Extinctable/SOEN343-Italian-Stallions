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
  const userId = 1; // Replace with actual authenticated attendee user ID
  
  // State for unpaid registrations (status === "Registered")
  const [unpaidRegistrations, setUnpaidRegistrations] = useState([]);
  // State for payment history (from user_payments)
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('creditcard');
  const [paymentMessage, setPaymentMessage] = useState('');
  
  // Fetch registrations for the user and filter unpaid ones.
  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/userEvents?user_id=${userId}`);
      const data = await response.json();
      // Filter for events with status "Registered"
      const pending = data.filter(reg => reg.status === 'Registered');
      setUnpaidRegistrations(pending);
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  };
  
  // Fetch payment history.
  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/payments?user_id=${userId}`);
      const data = await response.json();
      setPaymentHistory(data);
    } catch (err) {
      console.error("Error fetching payment history:", err);
    }
  };
  
  useEffect(() => {
    fetchRegistrations();
    fetchPaymentHistory();
  }, []);
  
  // Process payment for a single registration.
  const handlePayEvent = async (registration) => {
    const eventPrice = Number(registration.price);
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
      const response = await fetch('http://localhost:5002/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          event_id: registration.id, // registration object contains event fields; ensure event_id is available or use registration.id as appropriate.
          payment_method: selectedMethod === 'creditcard' ? "Credit Card" : "PayPal",
          amount: eventPrice
        })
      });
      const paymentRecord = await response.json();
      
      // Now update the registration status to "Paid".
      const updateResponse = await fetch(`http://localhost:5002/api/userEvents/${registration.registration_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "Paid" })
      });
      const updatedReg = await updateResponse.json();
      
      // Update local state: remove this registration from unpaidRegistrations.
      setUnpaidRegistrations(prev => prev.filter(reg => reg.registration_id !== registration.registration_id));
      
      // Append new payment record to history.
      setPaymentHistory(prev => [paymentRecord, ...prev]);
    } catch (err) {
      console.error("Error processing payment for event", registration.id, err);
    }
  };
  
  // Generate a PDF report of payment history.
  const handleGenerateReport = () => {
    generatePDFReport(paymentHistory, 'financial');
  };
  
  return (
    <div className="financial-manager-container">
      <h2>Financial Manager - Pending Payments</h2>
  
      <div className="pending-events">
        <h3>Events Awaiting Payment</h3>
        {unpaidRegistrations.length === 0 ? (
          <p>All registered events have been paid for.</p>
        ) : (
          unpaidRegistrations.map(reg => (
            <div key={reg.registration_id} className="event-card">
              <h4>{reg.title}</h4>
              <p>{reg.description}</p>
              <p><strong>Date:</strong> {new Date(reg.event_date).toLocaleString()}</p>
              <p className="price">Price: ${reg.price}</p>
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
        {paymentHistory.length === 0 ? (
          <p>No payments recorded yet.</p>
        ) : (
          <ul>
            {paymentHistory.map(tx => (
              <li key={tx.id}>
                {tx.eventTitle || "Event ID " + tx.event_id} - ${tx.amount} paid via {tx.payment_method} on {new Date(tx.payment_date).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleGenerateReport}>Export Payment History as PDF</button>
      </div>
    </div>
  );
};

export default FinancialManager;
