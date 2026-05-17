import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { validatePinKeywords } from "./schema.js";

export type KeywordType = "seasonal" | "evergreen" | "trending";

export interface PinKeyword {
  keyword: string;
  type: KeywordType;
  trend_score: number;
  pin_title_en: string;
  pin_title_es: string;
  pin_description_en: string;
  pin_description_es: string;
  image_prompt: string;
  suggested_blog_index: number;
}

export class PinTrendProAgent {
  private client: OpenAI;
  private promptText: string;

  constructor(apiKey: string, promptText: string) {
    this.client = new OpenAI({ apiKey });
    this.promptText = promptText;
  }

  static async loadPrompt(): Promise<string> {
    const promptPath = path.resolve(process.cwd(), "pintrend-pro.agent.md");
    return fs.readFile(promptPath, "utf8");
  }

  private buildMessages(userQuery: string): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
 content: this.promptText,
      },
      {
        role: "user",
        content: userQuery,
      },
    ];
  }

  public async generateKeywords(userQuery: string, count = 6): Promise<PinKeyword[]> {
    const messages = this.buildMessages(`${userQuery}\n\nGenerate ${count} keyword objects in strict JSON using the exact schema defined in the agent prompt.`);

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      // messages shape is enforced at runtime; cast to any to satisfy SDK types
      messages: messages as any,
      max_tokens: 1400,
      temperature: 0.7,
    } as any);

    const text = response.choices?.[0]?.message?.content ?? "";
    return this.parseJson(text);
  }

  private parseJson(rawText: string): PinKeyword[] {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");

    if (firstBrace < 0 || lastBrace < 0) {
      throw new Error("Unable to locate JSON object in model response.");
    }

    const jsonText = rawText.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonText) as { keywords: PinKeyword[] };

    const { valid, errors } = validatePinKeywords(parsed);
    if (!valid) {
      throw new Error(`Validation failed for model output: ${JSON.stringify(errors)}`);
    }

    return parsed.keywords;
  }
}
