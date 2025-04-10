import { jsPDF } from "jspdf";

/**
 * Generates a modern and aesthetic PDF report.
 * @param {Array} data - Array of event or transaction objects.
 * @param {string} type - 'event' or 'financial'.
 */
export function generatePDFReport(data, type) {
  const doc = new jsPDF();
  let y = 30;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(type === 'event' ? "Event Report" : "Financial Report", 14, 20);

  // Date of generation
  doc.setFontSize(10);
  const now = new Date().toLocaleString();
  doc.setTextColor(100);
  doc.text(`Generated: ${now}`, pageWidth - 60, 20);

  if (type === 'event') {
    data.forEach((item, index) => {
      doc.setDrawColor(220);
      doc.setFillColor(245, 245, 245); // light gray background
      doc.roundedRect(12, y - 5, pageWidth - 24, 40, 3, 3, 'FD');

      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text(`${index + 1}. ${item.title}`, 16, y + 3);

      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Description: ${item.description}`, 16, y + 10);

      const formattedDate = item.event_date
        ? new Date(item.event_date).toLocaleString()
        : "Unknown";
      doc.text(`Date: ${formattedDate}`, 16, y + 17);
      doc.text(`Status: ${item.status || "upcoming"}`, 16, y + 24);

      y += 45;
      if (y > 270) {
        addFooter(doc);
        doc.addPage();
        y = 30;
      }
    });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("End of Event Report", 14, y);
  }

  else if (type === 'financial') {
    data.forEach((item, index) => {
      doc.setDrawColor(220);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(12, y - 5, pageWidth - 24, 35, 3, 3, 'FD');

      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text(`${index + 1}. Transaction ID: ${item.id}`, 16, y + 3);

      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Type: ${item.type}`, 16, y + 10);
      doc.text(`Amount: $${item.amount}`, 16, y + 17);

      y += 40;
      if (y > 270) {
        addFooter(doc);
        doc.addPage();
        y = 30;
      }
    });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("End of Financial Report", 14, y);
  }

  addFooter(doc);
  doc.save(`${type}_report.pdf`);
}

// Footer with page number
function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Page ${pageCount}`, pageWidth - 30, pageHeight - 10);
}
