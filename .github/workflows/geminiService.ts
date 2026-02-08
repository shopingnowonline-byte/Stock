
import { GoogleGenAI, Type } from "@google/genai";
import { SheetRow } from "../types";

export const getAIInsights = async (data: SheetRow[], sheetName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the following data from the "${sheetName}" sheet and provide key insights, trends, and a brief summary.
    Data: ${JSON.stringify(data.slice(0, 20))}
    
    Focus on:
    1. Overall trends in numeric values.
    2. Anomalies or interesting patterns.
    3. Actionable advice based on the data.
    
    Format your response in professional Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights could be generated at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI service.";
  }
};
