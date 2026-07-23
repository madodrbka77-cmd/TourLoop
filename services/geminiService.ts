let aiInstance: any = null;

const getAiClient = async () => {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
    return null;
  }
  try {
    const { GoogleGenAI } = await import("@google/genai");
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (e) {
    console.error("Failed to load GoogleGenAI SDK:", e);
    return null;
  }
};

export const generatePostContent = async (topic: string): Promise<string> => {
  const ai = await getAiClient();
  if (!ai) {
    console.warn("No API Key provided for Gemini");
    return `منشور تلقائي بواسطة الذكاء الاصطناعي عن: ${topic}. (يرجى تفعيل مفتاح API)`;
  }

  try {
    /* Use gemini-3.5-flash as recommended for basic text tasks */
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `اكتب منشوراً قصيراً وجذاباً لمواقع التواصل الاجتماعي باللهجة العربية أو العربية الفصحى البسيطة حول: "${topic}". استخدم الإيموجي المناسب. اجعله أقل من 280 حرفاً.`,
    });
    // Access response.text property directly
    return response.text || "";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "عذراً، لا أستطيع التفكير في شيء الآن! 🤖";
  }
};