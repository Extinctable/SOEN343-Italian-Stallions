import { AttendeeEventReport } from './AttendeeEventReport.js';
import { OrganizerEventReport } from './OrganizerEventReport.js';
import { AttendeeFinancialReport } from './AttendeeFinancialReport.js';
import { OrganizerFinancialReport } from './OrganizerFinancialReport.js';

export function generatePDFReport(data, context) {
  let report;

  switch (context) {
    case 'attendee_event':
      report = new AttendeeEventReport(data); break;
    case 'organizer_event':
      report = new OrganizerEventReport(data); break;
    case 'attendee_financial':
      report = new AttendeeFinancialReport(data); break;
    case 'organizer_financial':
      report = new OrganizerFinancialReport(data); break;
    default:
      throw new Error(`Unknown report type: ${context}`);
  }

  report.generateReport();
}