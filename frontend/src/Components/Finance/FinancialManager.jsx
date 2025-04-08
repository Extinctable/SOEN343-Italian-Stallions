// Finance/FinancialManager.jsx
import React, { useState } from 'react';
import './FinancialManager.css';

// Payment Strategy Pattern
class PaymentStrategy {
  pay(amount) {
    throw new Error("Method not implemented");
  }
}

class CreditCardPayment extends PaymentStrategy {
  pay(amount) {
    return `Processed a credit card payment of $${amount}`;
  }
}

class PayPalPayment extends PaymentStrategy {
  pay(amount) {
    return `Processed a PayPal payment of $${amount}`;
  }
}

// Template Pattern for Financial Report Generation
class ReportGenerator {
  generateReport(data) {
    const header = this.header();
    const body = this.body(data);
    const footer = this.footer();
    return `${header}\n${body}\n${footer}`;
  }
  header() {
    return "Default Financial Report Header";
  }
  body(data) {
    return JSON.stringify(data, null, 2);
  }
  footer() {
    return "Default Financial Report Footer";
  }
}

class FinancialReportGenerator extends ReportGenerator {
  header() {
    return "Financial Manager Report";
  }
  footer() {
    return "End of Financial Report";
  }
}

const FinancialManager = () => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('creditcard');
  const [paymentResult, setPaymentResult] = useState('');
  const [report, setReport] = useState('');
  
  const handlePayment = () => {
    let strategy;
    if (selectedMethod === 'creditcard') {
      strategy = new CreditCardPayment();
    } else {
      strategy = new PayPalPayment();
    }
    const result = strategy.pay(amount);
    setPaymentResult(result);
  };
  
  const handleGenerateReport = () => {
    // Dummy financial data for report generation
    const financialData = {
      revenue: "$5000",
      expenses: "$3000",
      profit: "$2000",
      transactions: [
        { id: 1, type: "Credit Card", amount: "$1000" },
        { id: 2, type: "PayPal", amount: "$2000" },
      ]
    };
    const generator = new FinancialReportGenerator();
    const generatedReport = generator.generateReport(financialData);
    setReport(generatedReport);
  };
  
  return (
    <div className="financial-manager-container">
      <h2>Financial Manager</h2>
      <div className="payment-section">
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input 
            type="number" 
            id="amount" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
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
        <div className="form-group">
          <button onClick={handlePayment}>Process Payment</button>
        </div>
        {paymentResult && <p className="result">{paymentResult}</p>}
      </div>
      <div className="report-section">
        <button onClick={handleGenerateReport}>Generate Financial Report</button>
        {report && (
          <pre>{report}</pre>
        )}
      </div>
    </div>
  );
};

export default FinancialManager;
