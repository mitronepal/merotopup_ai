
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

/**
 * Get response from Gemini for the chat flow.
 */
export const getAIResponse = async (history: { role: string; content: string }[], userMessage: string, context: any) => {
  if (!process.env.API_KEY) {
    throw new Error("MISSING_API_KEY: Please set API_KEY in your hosting environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
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
          
          IMPORTANT: Use Nepali/English mix for chatting. Keep the design of your text clean and professional. 
          Confirm exact Diamonds/UC from the database.
          Creator: Bishal Ghimire. Support: 9764630634.
        `,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.status === 429) {
      throw new Error("RATE_LIMIT: Too many users. Contact Bishal at 9764630634.");
    }
    throw error;
  }
};

/**
 * Strict AI verification of payment screenshots.
 */
export const verifyScreenshotAI = async (imageBase64: string, expectedAmount: number) => {
  if (!process.env.API_KEY) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  
  try {
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
                  
                  Respond in valid JSON format:
                  { 
                    "valid": boolean, 
                    "amount_found": number, 
                    "is_payment_receipt": boolean,
                    "reason": "string" 
                  }` }
        ] 
      },
    });
    
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    
    if (!result.is_payment_receipt) {
      return { valid: false, reason: "यो आधिकारिक पेमेन्ट रसिद होइन। कृपया सफल ट्रान्जेक्सनको फोटो हाल्नुहोस्।" };
    }
    return result;
  } catch (e) {
    return { valid: false, reason: "सर्भरमा समस्या आयो, कृपया विशाल घिमिरेलाई ९७६४६३०६३४ मा सम्पर्क गर्नुहोला।" };
  }
};
