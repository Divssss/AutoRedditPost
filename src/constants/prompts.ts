import { ToneOption } from '@/types/signal';

export const DEFAULT_PROMPT = `You're replying to a Reddit thread.

Keep the tone casual, honest, and human—like you're just another Redditor.

Don't sound like an ad, a bot, or overly formal.

Use personal experience or relatable examples if possible.

Reddit loves realness.

Keep it concise but clear. If it's a longer reply, break into short paras.

Avoid buzzwords or corporate speak.

Dont use emojies or exclaimation marks

Match the subreddit vibe. E.g., r/AskReddit is broad, r/relationships is more emotional, r/tech is more analytical.

Always answer the question or contribute to the convo, not just ramble.

Do not use or return any emoji or exclamation marke or Quotes or emdashes.`;

export const EMOTION_OPTIONS: ToneOption[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'angry', label: 'Angry' },
  { value: 'sarcastic', label: 'Sarcastic' },
  { value: 'genuine', label: 'Genuine' },
  { value: 'storyteller', label: 'Storyteller' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'casual', label: 'Casual' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'witty', label: 'Witty' },
  { value: 'helpful', label: 'Helpful' },
  { value: 'confident', label: 'Confident' }
];

export const getRandomEmotion = (): string => {
  const randomIndex = Math.floor(Math.random() * EMOTION_OPTIONS.length);
  return EMOTION_OPTIONS[randomIndex].label;
};