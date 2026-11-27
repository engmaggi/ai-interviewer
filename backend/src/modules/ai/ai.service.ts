import Groq from "groq-sdk";
import { AI_CONFIG } from "./ai.constants";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const aiService = {
  async generateReply(systemPrompt: string, conversation: string) {
    const completion = await groq.chat.completions.create({
      model: AI_CONFIG.model,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: conversation },
      ],
    });

    return completion.choices[0]?.message?.content ?? "";
  },
};