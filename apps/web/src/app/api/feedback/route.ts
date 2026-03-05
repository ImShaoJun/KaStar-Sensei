import { NextRequest, NextResponse } from 'next/server';
import { ClaudeCoach } from '@kastar/coach-plugins';
import { DiscardContext } from '@kastar/coach-api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DiscardContext;

    const coach = new ClaudeCoach({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseURL: process.env.ANTHROPIC_BASE_URL,
      model: process.env.ANTHROPIC_MODEL,
    });

    const feedback = await coach.analyze(body);

    return NextResponse.json({ feedback: `${feedback.summary}\n\n${feedback.analysis}`, rating: feedback.rating });
  } catch (error: unknown) {
    console.error('AI feedback error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { feedback: `[评分: ?] AI教练罢工了...\n\n[错误]: ${message}` },
      { status: 500 }
    );
  }
}
