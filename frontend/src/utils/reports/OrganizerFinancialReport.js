import { PDFReportTemplate } from './PDFReportTemplate.js';

export class OrganizerFinancialReport extends PDFReportTemplate {
  getTitle() { return "Organizer Financial Summary"; }
  getItemHeight() { return 40; }
  getFileName() { return "organizer_financial_report.pdf"; }

  renderItem(item, index) {
    const y = this.y;
    this.doc.setDrawColor(220);
    this.doc.setFillColor(245, 245, 245);
    this.doc.roundedRect(12, y - 5, this.pageWidth - 24, 35, 3, 3, 'FD');

    this.doc.setFontSize(13);
    this.doc.setTextColor(20);
    this.doc.text(`${index + 1}. Transaction ID: ${item.id}`, 16, y + 3);

    this.doc.setFontSize(11);
    this.doc.setTextColor(80);
    this.doc.text(`Event: ${item.eventName}`, 16, y + 10);
    this.doc.text(`Revenue: $${item.amount}`, 16, y + 17);
  }

  addEndNote() {
    this.doc.setFontSize(10);
    this.doc.setTextColor(100);
    this.doc.text("Organizer revenue report ends here.", 14, this.y);
  }
}