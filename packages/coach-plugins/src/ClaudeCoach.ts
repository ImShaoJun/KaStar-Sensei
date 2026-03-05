import { Anthropic } from '@anthropic-ai/sdk';
import { ICoachProvider, DiscardContext, CoachFeedback, Rating } from '@kastar/coach-api';
import { SYSTEM_PROMPT } from './prompts';

export interface ClaudeCoachConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class ClaudeCoach implements ICoachProvider {
  name = "Claude 毒舌教练";
  description = "由 Claude 3.5 Sonnet 驱动的硬核湖北麻将教练";
  private client: Anthropic;
  private model: string;

  constructor(config: ClaudeCoachConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model || 'claude-3-5-sonnet-20241022';
  }

  async analyze(context: DiscardContext): Promise<CoachFeedback> {
    try {
      const userMessage = `对局数据：\n${JSON.stringify(context, null, 2)}\n\n请根据以上数据点评玩家的出最新的一手牌。`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 300,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from AI');
      }

      return this.parseFeedback(content.text);
    } catch (error) {
      console.error('Claude Coach analysis error:', error);
      return {
        rating: 'F',
        summary: '教练罢工了...',
        analysis: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  private parseFeedback(text: string): CoachFeedback {
    // 简单解析第一行的评分和总结
    // 格式: [评分: X] 一句话总结
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const firstLine = lines[0] || '';
    const ratingMatch = firstLine.match(/\[评分:\s*([SABCF])\]/i);
    const rating = (ratingMatch ? ratingMatch[1].toUpperCase() : 'B') as Rating;
    const summary = firstLine.replace(/\[评分:.*?\]/i, '').trim();
    
    // 剩余部分作为深度分析
    const analysis = lines.slice(1).join('\n').replace(/\[深度分析\]:\s*/i, '').trim();

    return {
      rating,
      summary,
      analysis: analysis || text,
    };
  }
}
