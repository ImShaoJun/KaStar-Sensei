import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL, // Optional, falls back to default if not set
    });

    const userMessage = `对局数据：
${JSON.stringify(body, null, 2)}

请根据以上数据点评玩家的出最新的一手牌。`;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    let resultText = '';
    const content = response.content[0];
    if (content.type === 'text') {
      resultText = content.text;
    }

    return NextResponse.json({ feedback: resultText });
  } catch (error: unknown) {
    console.error('AI feedback error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { feedback: `[评分: ?] AI教练罢工了...\n\n[错误]: ${message}` },
      { status: 500 }
    );
  }
}
