import { GoogleGenAI, Type } from "@google/genai";
import { AI_PERSONAS } from '../constants';
import { getUserSettings } from './db';
import type { SentimentAnalysisResult, PromptKey } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateContent = async (promptKey: PromptKey, userInput: string, userId: string) => {
  try {
    const settings = await getUserSettings(userId);
    const persona = settings.aiPersona || 'empathetic_companion';
    const defaultPersonaConfig = AI_PERSONAS['empathetic_companion'].prompts[promptKey];
    
    let systemInstruction: string;
    const userPrompt = defaultPersonaConfig.userPrompt;

    if (persona === 'custom') {
      const customPromptInstruction = settings.customPersona?.prompts?.[promptKey]?.systemInstruction;
      // Use custom instruction if it's a non-empty string, otherwise fall back to the default
      systemInstruction = customPromptInstruction || defaultPersonaConfig.systemInstruction;
    } else {
      systemInstruction = AI_PERSONAS[persona].prompts[promptKey].systemInstruction;
    }

    // Guardrail instruction to keep the AI focused on its purpose.
    const guardrailInstruction = "You are an AI companion focused exclusively on health and personal well-being (including mental, emotional, and physical health, goal-setting, and self-reflection). Politely refuse to answer any questions or engage in conversations that fall outside of this scope. If a user asks an unrelated question, gently state that you can only discuss topics related to personal wellness and redirect them if appropriate.";

    const fullSystemInstruction = `${guardrailInstruction} ${systemInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${userPrompt} "${userInput}"`,
      config: {
        systemInstruction: fullSystemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
};

export const analyzeReflectionEntry = (entry: string, userId: string): Promise<string> => {
  return generateContent('REFLECTION_ANALYSIS', entry, userId);
};

export const getAspirationInspiration = (aspiration: string, userId: string): Promise<string> => {
  return generateContent('ASPIRATION_INSPIRATION', aspiration, userId);
};

export const getGoalMotivation = (goal: string, userId: string): Promise<string> => {
  return generateContent('GOAL_MOTIVATION', goal, userId);
};

export const getWellnessAdvice = (feeling: string, userId: string): Promise<string> => {
  return generateContent('WELLNESS_ADVICE', feeling, userId);
};

export const getGeneralAdvice = (problem: string, userId: string): Promise<string> => {
  return generateContent('ADVICE', problem, userId);
};

export const getReframingQuestions = async (negativeThought: string, userId: string): Promise<string[]> => {
  try {
    const settings = await getUserSettings(userId);
    const persona = settings.aiPersona || 'empathetic_companion';
    const promptKey = 'COGNITIVE_REFRAMING';
    const defaultPersonaConfig = AI_PERSONAS['empathetic_companion'].prompts[promptKey];
    
    let systemInstruction: string;
    const userPrompt = defaultPersonaConfig.userPrompt;
    
    if (persona === 'custom') {
      const customPromptInstruction = settings.customPersona?.prompts?.[promptKey]?.systemInstruction;
      systemInstruction = customPromptInstruction || defaultPersonaConfig.systemInstruction;
    } else {
      systemInstruction = AI_PERSONAS[persona].prompts[promptKey].systemInstruction;
    }

    const guardrailInstruction = "You are an AI companion focused exclusively on health and personal well-being. Politely refuse to answer any questions or engage in conversations that fall outside of this scope.";
    const fullSystemInstruction = `${guardrailInstruction} ${systemInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${userPrompt} "${negativeThought}"`,
      config: {
        systemInstruction: fullSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["questions"]
        }
      }
    });
    const jsonResponse = JSON.parse(response.text);
    if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
       console.error("Invalid or incomplete JSON structure received from API:", jsonResponse);
       throw new Error("Received an invalid format from the AI.");
    }
    return jsonResponse.questions;
  } catch (error) {
    console.error("Error getting reframing questions:", error);
    throw new Error("I'm sorry, I couldn't generate questions for that thought right now. Please try again.");
  }
};

export const breakdownLongTermGoal = async (goalText: string): Promise<string[]> => {
  try {
    const systemInstruction = `You are a helpful assistant that breaks down large goals into smaller, actionable steps. Return the response as a JSON object with a single key "steps" which is an array of strings.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Break down this long-term goal into 5-7 short-term, actionable steps: "${goalText}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.steps || [];
  } catch (error) {
    console.error("Error breaking down goal:", error);
    throw new Error("I'm sorry, I couldn't break down that goal right now. Please try again.");
  }
};

export const visualizeAspiration = async (aspirationText: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `An artistic, ethereal, and inspiring digital painting representing the aspiration: "${aspirationText}"`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("No image was generated.");
    }
    
    return response.generatedImages[0].image.imageBytes;
  } catch (error) {
    console.error("Error visualizing aspiration:", error);
    throw new Error("I'm sorry, I couldn't create an image for that aspiration. Please try again.");
  }
};

export const analyzeReflectionSentiment = async (entries: { text: string; date: string }[]): Promise<SentimentAnalysisResult> => {
  try {
    const entriesText = entries.map(e => `Date: ${e.date}\nEntry: ${e.text}`).join('\n---\n');
    
    const fullPrompt = `You are an expert sentiment analyst specializing in personal reflections. Analyze the provided reflection entries. Your response MUST be a JSON object that adheres to the provided schema. Provide an 'overallSentiment' (a concise 2-3 sentence summary of the user's emotional state), 'keyThemes' (an array of 3-5 key recurring topics or feelings), and a 'sentimentScore' (a numerical score from 0.0 to 10.0, where 0 is extremely negative, 5 is neutral, and 10 is extremely positive).

Here are the reflection entries:
---
${entriesText}
---
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSentiment: { type: Type.STRING },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            sentimentScore: { type: Type.NUMBER }
          },
          required: ["overallSentiment", "keyThemes", "sentimentScore"]
        }
      }
    });

    const jsonResponse = JSON.parse(response.text);
    
    // More robust validation
    if (
      typeof jsonResponse.overallSentiment !== 'string' ||
      !Array.isArray(jsonResponse.keyThemes) ||
      typeof jsonResponse.sentimentScore !== 'number' || 
      jsonResponse.sentimentScore < 0 || 
      jsonResponse.sentimentScore > 10
    ) {
        console.error("Invalid or incomplete JSON structure received from API:", jsonResponse);
        throw new Error("Received an invalid analysis format from the AI. Please try again.");
    }

    return jsonResponse;

  } catch (error) {
    console.error("Error analyzing journal sentiment:", error);
    throw new Error("I'm sorry, I couldn't analyze the sentiment of your journal right now. Please try again.");
  }
};