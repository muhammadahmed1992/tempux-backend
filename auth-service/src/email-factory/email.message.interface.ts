export interface EmailMessage {
  to: string;
  subject: string;
  body: string; // HTML content
  // Add other common email properties like cc, bcc, attachments if needed
}
