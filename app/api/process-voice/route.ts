import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // 1. Transcribe voice command using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    const userCommand = transcription.text;

    // 2. Parse command into structured web execution parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI Web Agent Planner. Convert the user spoken command into a starting URL and a step-by-step instruction string for a browser agent. Return valid JSON format: {"startUrl": string, "goal": string}.'
        },
        { role: 'user', content: userCommand }
      ],
      response_format: { type: 'json_object' }
    });

    const parsedPlan = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      rawText: userCommand,
      plan: parsedPlan
    });
  } catch (err: any) {
    // THIS LOG WILL SHOW THE EXACT ERROR IN YOUR TERMINAL
    console.error("SERVER ERROR IN PROCESS-VOICE:", err);
    return NextResponse.json({ error: err.message || err.toString() }, { status: 500 });
  }
}