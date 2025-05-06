import OpenAI from "openai";

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface ParticipantSchedule {
  userId: number;
  name: string;
  events: Array<{
    startTime: Date;
    endTime: Date;
  }>;
}

interface MeetingSuggestion {
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  availableParticipants: number;
  totalParticipants: number;
}

// Suggest optimal meeting time using GPT-4o
export async function suggestMeetingDateTime(
  participantSchedules: ParticipantSchedule[],
  durationMinutes: number,
  preferredDates: string[],
  meetingPurpose: string
): Promise<MeetingSuggestion> {
  try {
    // Format participant schedules for AI readability
    const formattedSchedules = participantSchedules.map(p => ({
      userId: p.userId,
      name: p.name,
      events: p.events.map(e => ({
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString()
      }))
    }));
    
    // Prepare the prompt
    const prompt = `
      I need to schedule a meeting with the following participants and their existing schedules:
      ${JSON.stringify(formattedSchedules, null, 2)}
      
      Meeting details:
      - Duration: ${durationMinutes} minutes
      - Purpose: ${meetingPurpose}
      ${preferredDates.length > 0 ? `- Preferred dates: ${preferredDates.join(', ')}` : ''}
      
      Please analyze the schedules and suggest an optimal meeting time that:
      1. Maximizes the number of available participants
      2. Avoids scheduling conflicts
      3. Considers preferred dates if specified
      4. Uses working hours (9:00 AM - 5:00 PM)
      
      Respond with a JSON object containing:
      - suggestedDate: The suggested date (YYYY-MM-DD format)
      - suggestedTime: The suggested time (HH:MM format, 24-hour)
      - reason: Brief explanation for why this time was chosen
      - availableParticipants: Number of participants available at the suggested time
      - totalParticipants: Total number of participants
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a scheduling assistant that analyzes schedules and suggests optimal meeting times." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse and return the suggestion
    const suggestion = JSON.parse(response.choices[0].message.content);
    
    return {
      suggestedDate: suggestion.suggestedDate,
      suggestedTime: suggestion.suggestedTime,
      reason: suggestion.reason,
      availableParticipants: suggestion.availableParticipants,
      totalParticipants: suggestion.totalParticipants
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
      totalParticipants: participantSchedules.length
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
