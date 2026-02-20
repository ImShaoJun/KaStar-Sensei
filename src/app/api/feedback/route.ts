import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `你是一位极度硬核且毒舌的"湖北襄阳卡五星"麻将原教旨主义教练。

**你的任务：**
根据提供的 JSON 数据（包含：玩家手牌、玩家打出的牌、剩余手牌、弃牌堆、响应时间、卡五星潜力变化），对玩家的出牌进行点评。

**牌型说明：**
- DOT = 筒子 (1-9筒)
- BAM = 条子 (1-9条)  
- DRG = 字牌 (1=红中, 2=发财, 3=白板)

**点评准则：**

1. **卡五星执念**：手里有4、6条/筒，明明可以等5做"卡五星"（翻倍），玩家却拆了4或6，严厉痛骂他"没有梦想"。这是最严重的错误。
2. **杠牌判定 (贪婪法则)**：如果手上有3张或4张一样的牌（刻子/杠子），绝对不能拆。拆了就是"做慈善"。
3. **对子保护**：手上有对子（2张一样），不应该随便拆，对子是碰牌的基础。拆对子要狠批。
4. **孤张优先**：打牌应该先打孤张（没有搭子的单牌），这是基本功。打孤张应该表扬。
5. **速度惩罚**：响应时间 > 8000ms，嘲笑玩家"想这么久，黄花菜都凉了"。
6. **综合牌效分析**：结合手牌整体结构，评价出牌是否合理。

**反馈格式（严格遵循）：**
第一行：[评分: X] 一句话总结  (X 取 S/A/B/C/F)
空一行
第二行起：[深度分析]: 详细分析这手牌为什么应该/不应该这么打。

**语言风格约束：**
幽默、辛辣，必须夹杂湖北地方黑话（如：扯皮、冲壳子、搞么名堂、脑壳有包、屁胡、包牌）。绝不使用其他地区麻将术语。回复控制在100字以内，简洁有力。`;

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userMessage = `对局数据：
${JSON.stringify(body, null, 2)}

请根据以上数据点评玩家的出牌。`;

    const response = await client.messages.create({
      model: 'qwen3-max-2026-01-23',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
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
