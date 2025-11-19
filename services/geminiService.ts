import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateGreatWallGuide = async (
  history: ChatMessage[],
  context: string
): Promise<string> => {
  if (!API_KEY) {
    return "Please provide a valid API_KEY in the environment to chat with the guide.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Construct a conversation history for the model
    // In a real app, we would maintain the chat session object, but for this stateless call:
    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    // Add the current context as a system instruction effectively by prepending it or using the config
    const systemInstruction = `You are a knowledgeable and enthusiastic tour guide at the Great Wall of China. 
    The user is viewing a 3D LEGO rendering of the wall. 
    Keep your answers concise (under 100 words), fun, and educational. 
    You are specifically a "Lego Minifigure Historian".
    Current Scene Context: ${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: history[history.length - 1].text }] }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I'm having trouble finding that brick of information right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I lost my connection to the history books!";
  }
};
