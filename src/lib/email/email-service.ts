// We'll use dynamic imports to avoid Next.js issues with these packages
let nodemailer: typeof import('nodemailer')
let icalGenerator: typeof import('ical-generator').default

// Initialize these modules only on the server side
async function initializeModules() {
  if (typeof window === 'undefined') {
    nodemailer = await import('nodemailer')
    icalGenerator = (await import('ical-generator')).default
  }
}

interface EmailPreferences {
  feedback_emails: boolean
  meeting_invites: boolean
  support_updates: boolean
}

export class EmailService {
  private static async getTransporter() {
    await initializeModules()
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }

  static async sendFeedback(
    to: string,
    preferences: EmailPreferences,
    feedback: { subject: string; content: string }
  ) {
    if (!preferences.feedback_emails) return

    const transporter = await this.getTransporter()
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: `Feedback: ${feedback.subject}`,
      text: feedback.content,
    })
  }

  static async sendMeetingInvite(
    to: string,
    preferences: EmailPreferences,
    meeting: {
      subject: string
      startTime: Date
      endTime: Date
      description: string
    }
  ) {
    if (!preferences.meeting_invites) return

    await initializeModules()
    const calendar = icalGenerator({
      name: 'Meeting Invitation',
      prodId: { company: 'answerlyai', product: 'calendar' },
    })

    calendar.createEvent({
      start: meeting.startTime,
      end: meeting.endTime,
      summary: meeting.subject,
      description: meeting.description,
      organizer: {
        name: 'AnswerlyAI',
        email: process.env.GMAIL_USER || '',
      },
    })

    const transporter = await this.getTransporter()
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: `${meeting.subject}`,
      text: meeting.description,
      icalEvent: {
        content: calendar.toString(),
        method: 'REQUEST',
      },
    })
  }

  static async sendSupportUpdate(
    to: string,
    preferences: EmailPreferences,
    update: { subject: string; content: string }
  ) {
    if (!preferences.support_updates) return

    const transporter = await this.getTransporter()
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: `Support Update: ${update.subject}`,
      text: update.content,
    })
  }
}
