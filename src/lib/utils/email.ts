export interface BaseEmailData {
  subject: string;
  content: string;
}

export interface FeedbackEmailData extends BaseEmailData {}
export interface SupportEmailData extends BaseEmailData {}

export interface MeetingEmailData extends BaseEmailData {
  startTime: Date;
  endTime: Date;
  description: string;
}

export type EmailData = 
  | { type: 'feedback'; data: FeedbackEmailData }
  | { type: 'support'; data: SupportEmailData }
  | { type: 'meeting'; data: MeetingEmailData };