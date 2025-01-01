interface BaseEmailData {
  subject: string;
  content: string;
}

interface FeedbackEmailData extends BaseEmailData {}
interface SupportEmailData extends BaseEmailData {}

interface MeetingEmailData extends BaseEmailData {
  startTime: Date;
  endTime: Date;
  description: string;
}

export type EmailData = 
  | { type: 'feedback'; data: FeedbackEmailData }
  | { type: 'support'; data: SupportEmailData }
  | { type: 'meeting'; data: MeetingEmailData };