import { jsPDF } from "jspdf";

export class PDFReportTemplate {
  constructor(data) {
    this.data = data;
    this.doc = new jsPDF();
    this.y = 30;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
  }

  generateReport() {
    this.addHeader();
    this.data.forEach((item, index) => {
      this.renderItem(item, index);
      this.y += this.getItemHeight();
      if (this.y > 270) {
        this.addFooter();
        this.doc.addPage();
        this.y = 30;
      }
    });
    this.addEndNote();
    this.addFooter();
    this.doc.save(this.getFileName());
  }

  addHeader() {
    this.doc.setFontSize(22);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text(this.getTitle(), 14, 20);

    this.doc.setFontSize(10);
    const now = new Date().toLocaleString();
    this.doc.setTextColor(100);
    this.doc.text(`Generated: ${now}`, this.pageWidth - 60, 20);
  }

  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    const pageHeight = this.doc.internal.pageSize.getHeight();
    this.doc.setFontSize(9);
    this.doc.setTextColor(150);
    this.doc.text(`Page ${pageCount}`, this.pageWidth - 30, pageHeight - 10);
  }

  getTitle() { throw "getTitle() not implemented"; }
  getItemHeight() { throw "getItemHeight() not implemented"; }
  renderItem(item, index) { throw "renderItem() not implemented"; }
  addEndNote() { throw "addEndNote() not implemented"; }
  getFileName() { throw "getFileName() not implemented"; }
}