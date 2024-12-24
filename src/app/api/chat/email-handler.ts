import { EmailService } from '@/lib/email/email-service'
import { supabase } from '@/lib/supabase/supabase-server'
import { EmailData } from '@/lib/utils/email'

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function parseMeetingDetails(content: string) {
  try {
    // Remove the [EMAIL_ACTION:meeting] tag and quotes
    const cleanContent = content.replace(/\[EMAIL_ACTION:meeting\]"?|"$/g, '').trim();
    
    // Split into lines and create a details object
    const lines = cleanContent.split('\n').map(line => line.trim()).filter(Boolean);
    const details: Record<string, string> = {};
    
    // Parse each line into key-value pairs
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        details[key.trim()] = valueParts.join(':').trim();
      }
    });

    // Validate required fields
    const requiredFields = ['Date', 'Time', 'Name', 'Contact', 'Purpose'];
    const missingFields = requiredFields.filter(field => !details[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate email format
    if (!isValidEmail(details.Contact)) {
      throw new Error('Invalid email format');
    }

    // Validate date format (Month DD, YYYY)
    const dateRegex = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
    if (!dateRegex.test(details.Date)) {
      throw new Error('Invalid date format');
    }

    // Validate time format (HH:MM AM/PM UTC)
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM) UTC$/;
    if (!timeRegex.test(details.Time)) {
      throw new Error('Invalid time format');
    }

    // Parse date and time
    const [timeStr, period, timezone] = details.Time.split(' ');
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    
    // Convert to 24-hour format if PM
    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    // Create Date object and set UTC time
    const startTime = new Date(details.Date);
    startTime.setUTCHours(hour, parseInt(minutes), 0, 0);
    
    // Get duration in minutes (default to 30 if not specified)
    const duration = details.Duration ? 
      parseInt(details.Duration.split(' ')[0]) : 
      30;
    
    // Calculate end time based on duration
    const endTime = new Date(startTime.getTime() + duration * 60000);

    return {
      startTime,
      endTime,
      name: details.Name,
      contact: details.Contact,
      purpose: details.Purpose,
      description: `Meeting Purpose: ${details.Purpose}\n\nRequested by: ${details.Name}\nContact: ${details.Contact}\nDuration: ${duration} minutes`
    };
  } catch (error: unknown) {
    console.error('Meeting details parsing error:', error);
    throw new Error(`Invalid meeting request format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleEmailActions(userId: string, action: EmailData) {
  try {
    // Get user's email and preferences
    const { data: userData, error } = await supabase
      .from('user_tiers')
      .select('email, notification_preferences')
      .eq('user_id', userId)
      .single();

    if (error || !userData?.email) {
      throw new Error('User email not found');
    }

    const { email, notification_preferences } = userData;

    switch (action.type) {
      case 'meeting': {
        const meetingDetails = parseMeetingDetails(action.data.content);
        await EmailService.sendMeetingInvite(
          email,
          notification_preferences,
          {
            subject: `Meeting: ${meetingDetails.purpose}`,
            startTime: meetingDetails.startTime,
            endTime: meetingDetails.endTime,
            description: meetingDetails.description
          }
        );
        break;
      }

      case 'feedback':
      case 'support':
        await EmailService[action.type === 'feedback' ? 'sendFeedback' : 'sendSupportUpdate'](
          email,
          notification_preferences,
          action.data
        );
        break;

      default:
        throw new Error('Invalid email action type');
    }
  } catch (error: unknown) {
    console.error('Email action error:', error);
    throw error instanceof Error ? error : new Error('Unknown email error');
  }
}
