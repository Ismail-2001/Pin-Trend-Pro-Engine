# PinTrend Pro Agent

A small Node.js/TypeScript starter agent for PinTrend Pro, the Mexican home decor Pinterest strategist.

## Setup

1. Copy `.env.example` to `.env`
2. Set `OPENAI_API_KEY` in `.env`
3. Install dependencies:

   npm install

## Run

- Development (Next.js app):

  npm run dev

- Build the Next.js app:

  npm run build

- Run the Next.js production server:

  npm start

- Run the standalone CLI:

  npm run cli

## What this does

- Loads the PinTrend Pro prompt from `pintrend-pro.agent.md`
- Provides a Next.js API route at `/api/generate` for server-side keyword generation
- Sends a user query to OpenAI via `src/PinTrendAgent.ts`
- Prints strict JSON that matches the agent schema

## Notes

- Use `npm run dev -- 8` to generate 8 keyword objects instead of the default 6.
