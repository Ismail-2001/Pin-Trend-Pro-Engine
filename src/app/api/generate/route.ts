import { NextRequest, NextResponse } from "next/server";
import { PinTrendProAgent } from "../../../PinTrendAgent";

interface GenerateBody {
  count?: number;
  seasonal?: number;
  evergreen?: number;
  trending?: number;
  apiKey?: string;
  userQuery?: string;
  blogUrls?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateBody;
    const resolvedKey = body.apiKey ?? process.env.DEEPSEEK_API_KEY ?? process.env.OPENAI_API_KEY;

    if (!resolvedKey) {
      return NextResponse.json({ error: "DEEPSEEK_API_KEY or OPENAI_API_KEY is required in env or request body." }, { status: 400 });
    }

    const prompt = await PinTrendProAgent.loadPrompt();
    const agent = new PinTrendProAgent(resolvedKey, prompt);

    const count = body.count ?? 6;
    const seasonal = body.seasonal ?? 0;
    const evergreen = body.evergreen ?? 0;
    const trending = body.trending ?? 0;
    const total = seasonal + evergreen + trending;

    const keywordSplit = total === 0 ? `Generate ${count} keyword objects in strict JSON using the exact schema defined in the agent prompt.` :
      `Generate ${count} keyword objects in strict JSON using the exact schema defined in the agent prompt. Include ${seasonal} seasonal, ${evergreen} evergreen, and ${trending} trending keywords.`;

    const query = body.userQuery ?? keywordSplit;
    const keywords = await agent.generateKeywords(query, count);

    return NextResponse.json({ keywords });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
