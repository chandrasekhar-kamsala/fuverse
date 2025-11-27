import axios from "axios";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function getFutureSelfReply(prompt, language = "English") {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are the user's future self, a calm and wise AI. 
            Give thoughtful, warm, and motivating replies.
            Always reply in ${language}.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 20000,
      }
    );

    const reply =
      response.data.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No reply.";
    return reply;
  } catch (error) {
    console.error("❌ GPT ERROR:", error.response?.data || error.message);
    return "⚠️ Future self is currently unavailable. Try again later.";
  }
}
