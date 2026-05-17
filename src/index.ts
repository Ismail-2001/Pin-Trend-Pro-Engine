import "dotenv/config";
import { PinTrendProAgent } from "./PinTrendAgent.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required. Set it in .env or your environment.");
}

const promptText = await PinTrendProAgent.loadPrompt();
const agent = new PinTrendProAgent(apiKey, promptText);
const count = Number(process.argv[2] ?? 6);

const userQuery = `Create ${count} Pinterest SEO keyword ideas for Mexican home decor using the PinTrend Pro agent instructions. Use strict JSON output with the exact schema.`;

const keywords = await agent.generateKeywords(userQuery, count);
console.log(JSON.stringify({ keywords }, null, 2));
