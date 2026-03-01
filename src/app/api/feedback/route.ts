import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const client = new Anthropic({
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });

    const userMessage = `对局数据：
${JSON.stringify(body, null, 2)}

请根据以上数据点评玩家的出最新的一手牌。`;

    const response = await client.messages.create({
      model: 'qwen3-max-2026-01-23',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    return NextResponse.json({ feedback: text });
  } catch (error: unknown) {
    console.error('AI feedback error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { feedback: `[评分: ?] AI教练罢工了...\n\n[错误]: ${message}` },
      { status: 500 }
    );
  }
}
