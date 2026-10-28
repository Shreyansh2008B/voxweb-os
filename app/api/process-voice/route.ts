import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI Browser Agent Planner. Analyze the user command and return JSON with:
          {
            "actionType": "NAVIGATE" | "SEARCH" | "FORM_FILL" | "SCRAPE",
            "startUrl": "Starting web URL",
            "promptUser": "Question to ask user if details like email or password are required",
            "instruction": "Detailed natural language step for the browser agent"
          }`
        },
        { role: 'user', content: command }
      ],
      response_format: { type: 'json_object' }
    });

    const plan = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json({ plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}