
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Get response from Gemini for the chat flow.
 * Adheres to direct generateContent call guidelines and Gemini 3 Pro for complex tasks.
 */
export const getAIResponse = async (history: { role: string; content: string }[], userMessage: string, context: any) => {
  // Using direct ai.models.generateContent call as per guidelines
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ],
    config: {
      systemInstruction: `
        ${SYSTEM_INSTRUCTION}
        
        FIREBASE LIVE DATABASE (GAMES & PACKAGES):
        ${JSON.stringify(context.availableGames, null, 2)}
        
        SESSION:
        - Active User: ${context.userName || 'Guest'}
        
        STRICT PROTOCOL:
        1. When a user asks for top-up, check the provided Games data. List ALL packages for that game accurately.
        2. PRICE TAGGING: When a package is chosen, you MUST output: "Price is Rs. [PRICE: X]. [ACTION: ASK_GAME_DETAILS]"
        3. Once ID/IGN are given, output: "[ACTION: SHOW_PAYMENT_METHODS]"
        4. When they pick a method, guide them and output: "[ACTION: SHOW_SCREENSHOT_UPLOAD]"
        
        IMPORTANT: Use Nepali for chatting. Keep the design of your text clean and professional. 
        Always confirm the exact Diamonds/UC count from the database.
      `,
      temperature: 0.7,
    },
  });

  return response.text;
};

/**
 * Strict AI verification of payment screenshots.
 * Note: responseMimeType is removed because gemini-2.5-flash-image (nano banana series) does not support it.
 */
export const verifyScreenshotAI = async (imageBase64: string, expectedAmount: number) => {
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }, 
        { text: `Strict Verification Mode:
                1. Is this a payment receipt from eSewa, Khalti, or a Bank? (Answer Yes/No)
                2. Does the receipt show a successful transaction?
                3. Does the recipient name contain 'MeroTopup', 'Bishal', or 'Ghimire'?
                4. Does the amount match Rs. ${expectedAmount}?
                
                If the image is a person, a game screenshot, or random media, it is INVALID.
                
                Respond in valid JSON format:
                { 
                  "valid": boolean, 
                  "amount_found": number, 
                  "is_payment_receipt": boolean,
                  "reason": "string" 
                }` }
      ] 
    },
    // responseMimeType is not supported for gemini-2.5-flash-image
  });
  
  try {
    // Manually extract JSON from the response text as responseMimeType is disabled
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    
    if (!result.is_payment_receipt) {
      return { valid: false, reason: "This is not a valid payment screenshot. Please upload the transaction receipt." };
    }
    return result;
  } catch (e) {
    return { valid: false, reason: "Image analysis failed. Please ensure the screenshot is clear." };
  }
};
