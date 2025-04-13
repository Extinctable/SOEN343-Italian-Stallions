import { PDFReportTemplate } from './PDFReportTemplate.js';

export class OrganizerEventReport extends PDFReportTemplate {
  getTitle() { return "Organized Event Report"; }
  getItemHeight() { return 45; }
  getFileName() { return "organizer_event_report.pdf"; }

  renderItem(item, index) {
    const y = this.y;
    this.doc.setDrawColor(220);
    this.doc.setFillColor(250, 250, 250);
    this.doc.roundedRect(12, y - 5, this.pageWidth - 24, 40, 3, 3, 'FD');

    this.doc.setFontSize(13);
    this.doc.setTextColor(20);
    this.doc.text(`${index + 1}. ${item.title}`, 16, y + 3);

    this.doc.setFontSize(11);
    this.doc.setTextColor(80);
    this.doc.text(`Date: ${new Date(item.event_date).toLocaleString()}`, 16, y + 10);
    this.doc.text(`Attendees: ${item.attendee_count || 0}`, 16, y + 17);
    this.doc.text(`Status: ${item.status || "upcoming"}`, 16, y + 24);
  }

  addEndNote() {
    this.doc.setFontSize(10);
    this.doc.setTextColor(100);
    this.doc.text("End of Organized Events Summary", 14, this.y);
  }
}