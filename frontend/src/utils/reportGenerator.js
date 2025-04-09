import { jsPDF } from "jspdf";

/**
 * Generates a PDF report.
 * @param {Array} data - Array of event objects or transaction objects.
 * @param {string} type - 'event' or 'financial' to determine the report template.
 */
export function generatePDFReport(data, type) {
  const doc = new jsPDF();
  let y = 10;
  if (type === 'event') {
    doc.setFontSize(16);
    doc.text("Event Report", 10, y);
    y += 10;
    data.forEach(item => {
      doc.setFontSize(14);
      doc.text(`${item.title}`, 10, y);
      y += 7;
      doc.setFontSize(12);
      doc.text(`Description: ${item.description}`, 10, y);
      y += 7;
      doc.text(`Date: ${item.date}`, 10, y);
      y += 7;
      doc.text(`Status: ${item.status}`, 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });
    doc.setFontSize(10);
    doc.text("End of Event Report", 10, y);
  } else if (type === 'financial') {
    doc.setFontSize(16);
    doc.text("Financial Report", 10, y);
    y += 10;
    data.forEach(item => {
      doc.setFontSize(14);
      doc.text(`Transaction ID: ${item.id}`, 10, y);
      y += 7;
      doc.setFontSize(12);
      doc.text(`Type: ${item.type}`, 10, y);
      y += 7;
      doc.text(`Amount: ${item.amount}`, 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });
    doc.setFontSize(10);
    doc.text("End of Financial Report", 10, y);
  }
  doc.save("report.pdf");
}
