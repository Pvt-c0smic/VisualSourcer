import OpenAI from "openai";

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface ParticipantSchedule {
  userId: number;
  name: string;
  requiredAttendance?: boolean;
  role?: string;
  events: Array<{
    startTime: Date;
    endTime: Date;
    title?: string;
  }>;
}

interface MeetingSuggestion {
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  availableParticipants: number;
  totalParticipants: number;
  alternativeTimes?: Array<{
    date: string;
    time: string;
    availableParticipants: number;
  }>;
  conflictDetails?: {
    conflictingParticipants: Array<{
      userId: number;
      name: string;
      conflictReason: string;
    }>;
    conflictResolutionSuggestion: string;
  };
}

// Suggest optimal meeting time using GPT-4o with intelligent conflict resolution
export async function suggestMeetingDateTime(
  participantSchedules: ParticipantSchedule[],
  durationMinutes: number,
  preferredDates: string[],
  meetingPurpose: string,
  allowRecurring: boolean = false,
  existingMeetingId?: number
): Promise<MeetingSuggestion> {
  try {
    // Format participant schedules for AI readability
    const formattedSchedules = participantSchedules.map(p => ({
      userId: p.userId,
      name: p.name,
      requiredAttendance: p.requiredAttendance !== undefined ? p.requiredAttendance : true,
      role: p.role || "Attendee",
      events: p.events.map(e => ({
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        title: e.title || "Scheduled Event"
      }))
    }));
    
    // Prepare the prompt with enhanced conflict resolution context
    const prompt = `
      I need to schedule a meeting with the following participants and their existing schedules:
      ${JSON.stringify(formattedSchedules, null, 2)}
      
      Meeting details:
      - Duration: ${durationMinutes} minutes
      - Purpose: ${meetingPurpose}
      ${preferredDates.length > 0 ? `- Preferred dates: ${preferredDates.join(', ')}` : ''}
      ${allowRecurring ? '- This meeting may be recurring' : ''}
      ${existingMeetingId ? `- This is rescheduling an existing meeting with ID: ${existingMeetingId}` : ''}
      
      Please analyze the schedules and suggest an optimal meeting time with intelligent conflict resolution that:
      1. Prioritizes times where required participants (requiredAttendance=true) are available
      2. Maximizes the overall number of available participants
      3. Avoids scheduling conflicts, especially for those with the role "Organizer" or "Presenter"
      4. Considers preferred dates if specified
      5. Uses working hours (9:00 AM - 5:00 PM) on weekdays when possible
      6. Provides at least 3 alternative times if the primary suggestion has conflicts
      7. Identifies any conflicts with specific participants and suggests how to resolve them
      
      Respond with a JSON object containing:
      - suggestedDate: The suggested date (YYYY-MM-DD format)
      - suggestedTime: The suggested time (HH:MM format, 24-hour)
      - reason: Brief explanation for why this time was chosen, including consideration of required participants
      - availableParticipants: Number of participants available at the suggested time
      - totalParticipants: Total number of participants
      - alternativeTimes: Array of 3 alternative times, each containing:
        - date: The date (YYYY-MM-DD format)
        - time: The time (HH:MM format, 24-hour)
        - availableParticipants: Number of participants available at this time
      - conflictDetails: Object containing:
        - conflictingParticipants: Array of participants with conflicts at the suggested time, each with:
          - userId: ID of the participant
          - name: Name of the participant
          - conflictReason: Brief description of the conflict (e.g., "Has a meeting titled 'Project Review'")
        - conflictResolutionSuggestion: Suggestion for how to resolve conflicts (e.g., "Consider rescheduling if these participants are critical")
    `;
    
    // Call OpenAI API with enhanced system prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an advanced scheduling assistant with expertise in complex calendar management, conflict resolution, and optimal meeting coordination. Your task is to analyze schedules, identify conflicts, and suggest optimal meeting times with detailed alternatives and resolution strategies." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse and return the enhanced suggestion
    const suggestion = JSON.parse(response.choices[0].message.content);
    
    return {
      suggestedDate: suggestion.suggestedDate,
      suggestedTime: suggestion.suggestedTime,
      reason: suggestion.reason,
      availableParticipants: suggestion.availableParticipants,
      totalParticipants: suggestion.totalParticipants,
      alternativeTimes: suggestion.alternativeTimes || [],
      conflictDetails: suggestion.conflictDetails || {
        conflictingParticipants: [],
        conflictResolutionSuggestion: ""
      }
    };
  } catch (error) {
    console.error("Error suggesting meeting time with OpenAI:", error);
    // Default suggestion as fallback
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    return {
      suggestedDate: tomorrow.toISOString().split('T')[0],
      suggestedTime: "10:00",
      reason: "AI suggestion unavailable, providing default time",
      availableParticipants: 0,
      totalParticipants: participantSchedules.length,
      alternativeTimes: [],
      conflictDetails: {
        conflictingParticipants: [],
        conflictResolutionSuggestion: "AI-assisted conflict resolution unavailable at this time."
      }
    };
  }
}

// Analyze skills and suggest training programs
export async function suggestTrainingPrograms(
  userSkills: any[],
  availablePrograms: any[]
): Promise<any[]> {
  try {
    const prompt = `
      I need to suggest training programs for a user based on their skills and available programs.
      
      User skills:
      ${JSON.stringify(userSkills, null, 2)}
      
      Available programs:
      ${JSON.stringify(availablePrograms, null, 2)}
      
      Please suggest up to 3 programs that would be most beneficial for the user's skill development.
      Respond with a JSON array of program IDs and a brief reason for each suggestion.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a training advisor that matches users with appropriate training programs." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content).suggestions;
  } catch (error) {
    console.error("Error suggesting training programs with OpenAI:", error);
    return [];
  }
}

// Analyze user performance and progress
export async function analyzeUserProgress(
  userEnrollments: any[],
  completedPrograms: any[]
): Promise<string> {
  try {
    const prompt = `
      I need to analyze a user's training progress based on their enrollments and completed programs.
      
      Current enrollments:
      ${JSON.stringify(userEnrollments, null, 2)}
      
      Completed programs:
      ${JSON.stringify(completedPrograms, null, 2)}
      
      Please provide:
      1. A summary of the user's progress
      2. Areas of strength
      3. Areas for improvement
      4. Suggestions for next steps in their training journey
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a training analytics expert that provides insights on user progress." },
        { role: "user", content: prompt }
      ]
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error analyzing user progress with OpenAI:", error);
    return "Unable to analyze progress at this time.";
  }
}
