
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export const getAIResponse = async (history: { role: string; content: string }[], userMessage: string, context: any) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key configuration error.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: `
          ${SYSTEM_INSTRUCTION}
          
          GAMES & PACKAGES DATA:
          ${JSON.stringify(context.availableGames, null, 2)}
          
          SESSION INFO:
          - Current User: ${context.userName || 'Guest'}
          
          TASK:
          Respond to the user professionally. Ensure you use the specific action tags like [ACTION: REQUIRE_LOGIN] etc., to trigger UI components.
        `,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("AI Server Error. Please retry.");
  }
};

/**
 * Enhanced Strict Verification for Payment Screenshots
 */
export const verifyScreenshotAI = async (imageBase64: string, expectedAmount: number) => {
  if (!process.env.API_KEY) throw new Error("API Key Missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/jpeg';
  const base64Data = match ? match[2] : imageBase64;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [
          { inlineData: { mimeType, data: base64Data } }, 
          { text: `Strictly analyze this payment screenshot:
                  1. Is it a real transaction receipt from eSewa, Khalti, IME Pay, or a Nepalese Bank?
                  2. Does it show 'SUCCESS' or 'COMPLETE' status? (Reject pending/failed/processing screenshots)
                  3. Does it show a Transaction ID / Reference Code?
                  4. Is the amount exactly or very close to Rs. ${expectedAmount}?
                  5. Does it show 'Bishal Ghimire' or the merchant ID '9861513184'?
                  6. Ensure it is NOT a screenshot of the QR code itself or a fake edited receipt.
                  
                  Respond with JSON:
                  { 
                    "valid": boolean, 
                    "confidence": number (0-1),
                    "amount_found": number,
                    "transaction_id": "string",
                    "reason": "Nepali explanation if invalid" 
                  }` }
        ] 
      },
    });
    
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI Response");
    
    const result = JSON.parse(jsonMatch[0]);
    // Confidence threshold
    if (result.confidence < 0.8) {
      result.valid = false;
      result.reason = "यो रसिद स्पष्ट छैन वा फेक हुन सक्छ। कृपया ओरिजिनल रसिद पठाउनुहोस्।";
    }

    return result;
  } catch (e: any) {
    console.error("Verification Error:", e);
    return { valid: false, reason: "भेरिफिकेसन सर्भरमा समस्या आयो। फेरि प्रयास गर्नुहोस्।" };
  }
};
