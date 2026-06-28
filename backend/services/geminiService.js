const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

// The @google/genai SDK automatically picks up GEMINI_API_KEY from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
# ROLE AND IDENTITY
You are the core intelligence, orchestration, and execution engine of "The Last-Minute Life Saver"—an elite, proactive AI productivity companion designed to prevent missed deadlines and eliminate human friction. You do not just remind; you prioritize, plan, and autonomously execute.

# TASK PRIORITIZATION & BURNOUT LOGIC
When evaluating user tasks, deadlines, and current states, apply a composite optimization logic:
- Urgency Score (0-100):
  * > 80: EXTREMELY URGENT (Due within 24 to 48 hours)
  * 50-80: MEDIUM URGENT (Due within 3 to 7 days)
  * < 50: LOW URGENT (Due in more than 7 days)
- Burnout Risk (0-100): Calculated via time-series analysis (conceptually resembling sequential anomaly detection models like LSTMs/Transformers). If historical task completion rates drop sharply relative to incoming velocity, flag a high burnout condition.
- Decision Framework:
  * IF Urgency > 80 AND User Energy < 4 -> Route to 'execute_via_agent'.
  * IF Urgency > 80 AND User Energy >= 4 -> Route to 'trigger_deep_work'.
  * IF Urgency <= 80 -> Route to 'schedule_later'.

# OPERATIONAL GUARDRAILS
- Never generate conversational fluff or introductory text.
- Act defensively against user procrastination.

# DEEP WORK PROTOCOL
When routing.action is "trigger_deep_work", the "user_message" should NOT simulate fake actions like "turning on a playlist" or "blocking distractions" or "initiating a session". Instead, provide a highly actionable, structured "Deep Work Framework" (e.g. "Step 1: Do X. Step 2: Do Y. Use the next 25 minutes to focus.").

# OUTPUT FORMAT ENFORCEMENT
You must ALWAYS respond in a valid JSON object matching the schema below. Do not include markdown code block formatting wrapping the JSON.
{
  "analysis": {
    "calculated_urgency": "integer (0-100)",
    "burnout_index": "integer (0-100)",
    "rationale": "String explaining the systemic reasoning"
  },
  "routing": {
    "action": "schedule_reminder | trigger_deep_work | schedule_later",
    "target_tool": "String name of the function to call, or null"
  },
  "execution_payload": {
    "parameters": {
      "key": "value"
    },
    "user_message": "A direct, high-impact, empathetic but candid communication text instructing the user on the action being taken.",
    "personalized_recommendation": "A short, context-aware productivity tip based on their energy and urgency.",
    "calendar_event": {
      "start_time": "ISO 8601 datetime string. You MUST provide a start time for ALL tasks, even if scheduling for right now.",
      "end_time": "ISO 8601 datetime string or null",
      "task_title": "Short title for the calendar event or null",
      "details": "Description for the calendar event or null"
    },
    "actionable_steps": [
      "String (Step 1)",
      "String (Step 2)"
    ]
  }
}
`;

const responseSchema = {
    type: 'OBJECT',
    properties: {
        analysis: {
            type: 'OBJECT',
            properties: {
                calculated_urgency: { type: 'INTEGER', description: 'Urgency score from 0-100' },
                burnout_index: { type: 'INTEGER', description: 'Burnout risk score from 0-100' },
                rationale: { type: 'STRING', description: 'String explaining the systemic reasoning' }
            },
            required: ['calculated_urgency', 'burnout_index', 'rationale']
        },
        routing: {
            type: 'OBJECT',
            properties: {
                action: { type: 'STRING', enum: ['execute_via_agent', 'trigger_deep_work', 'schedule_later'] },
                target_tool: { type: 'STRING', description: 'String name of the function to call, or null. Nullable.' }
            },
            required: ['action']
        },
        execution_payload: {
            type: 'OBJECT',
            properties: {
                parameters: {
                    type: 'OBJECT',
                    description: 'Key value pair parameters for the execution'
                },
                user_message: { type: 'STRING', description: 'A direct, high-impact, empathetic but candid communication text instructing the user on the action being taken.' },
                personalized_recommendation: { type: 'STRING', description: 'A short, context-aware productivity tip based on their energy and urgency.' },
                calendar_event: {
                    type: 'OBJECT',
                    description: 'Calendar event details. You MUST provide start_time and task_title for ALL tasks, even if scheduling for right now (e.g. for deep work).',
                    properties: {
                        start_time: { type: 'STRING', description: 'ISO 8601 datetime string or null' },
                        end_time: { type: 'STRING', description: 'ISO 8601 datetime string or null' },
                        task_title: { type: 'STRING', description: 'Short title for the calendar event or null' },
                        details: { type: 'STRING', description: 'Description for the calendar event or null' }
                    }
                },
                actionable_steps: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                    description: 'List of actionable steps to complete the task'
                }
            },
            required: ['parameters', 'user_message', 'personalized_recommendation', 'actionable_steps']
        }
    },
    required: ['analysis', 'routing', 'execution_payload']
};


const tools = [
  {
    functionDeclarations: [
      {
        name: 'trigger_deep_work',
        description: 'Trigger condition: High urgency task where user energy is sufficient for focus.',
        parameters: {
          type: 'OBJECT',
          properties: {
            playlist_type: { type: 'STRING', description: 'Select high_octane_hip_hop if user requires high energy' },
            block_distractions: { type: 'BOOLEAN' }
          },
          required: ['playlist_type', 'block_distractions']
        }
      },
      {
        name: 'schedule_calendar_event',
        description: 'Trigger condition: The task should be scheduled for later or requires a reminder before the deadline. Provides precise start and end times to generate a Google Calendar event.',
        parameters: {
          type: 'OBJECT',
          properties: {
            task_title: { type: 'STRING' },
            details: { type: 'STRING' },
            start_time: { type: 'STRING', description: 'ISO 8601 format e.g. 2026-06-23T15:00:00Z' },
            end_time: { type: 'STRING', description: 'ISO 8601 format e.g. 2026-06-23T16:00:00Z' }
          },
          required: ['task_title', 'start_time', 'end_time']
        }
      },
      {
        name: 'create_autonomous_plan',
        description: 'Trigger condition: The task is complex or large and needs to be broken down into actionable sub-steps.',
        parameters: {
          type: 'OBJECT',
          properties: {
            sub_tasks: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'List of 3 to 5 actionable sub-steps to complete the task'
            }
          },
          required: ['sub_tasks']
        }
      }
    ]
  }
];

async function evaluateTaskWithGemini(taskDescription, deadline, userEnergy) {
    const currentTimeIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", timeZoneName: "short" });
    const prompt = `Current Time (IST): ${currentTimeIST}\nTask: ${taskDescription}\nDeadline: ${deadline}\nCurrent User Energy Level (1-10): ${userEnergy}\nEvaluate the task and return the structured response. Also call the required tool based on the decision framework.`;
    
    let response;
    try {
        // First interaction: Ask Gemini to evaluate the task and output the structured JSON + tool calls
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.2
            }
        });
    } catch (apiError) {
        const errorMsg = apiError.message || String(apiError);
        console.error('Gemini API call failed:', errorMsg);
        return {
            structuredOutput: null,
            toolCall: null,
            error: errorMsg
        };
    }

    let toolCall = null;
    if (response.functionCalls && response.functionCalls.length > 0) {
        toolCall = response.functionCalls[0];
    }
    
    let structuredOutput = null;
    try {
        if(response.text) {
            let cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            structuredOutput = JSON.parse(cleanText);
        }
    } catch(e) {
        console.error("Failed to parse JSON response", e);
        console.log("Raw response was:", response.text);
    }

    return {
        structuredOutput,
        toolCall
    };
}

module.exports = { evaluateTaskWithGemini };
