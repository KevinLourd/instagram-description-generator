# Lincoln - Instagram Caption Generator

Open source tool to generate Instagram captions using OpenAI fine-tuning. Train a model on your own captions, then generate new ones that match your style.

## How it works

1. **Add training data** — Provide examples of your Instagram captions (at least 10)
2. **Fine-tune** — Train a custom GPT-4o-mini model on your writing style
3. **Generate** — Describe a photo and get a caption in your style

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add your OpenAI API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cost Warning

Fine-tuning uses the OpenAI API and costs real money. Check [OpenAI pricing](https://openai.com/pricing) for current rates. GPT-4o-mini fine-tuning is the cheapest option.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4
- OpenAI SDK
- Zod for validation

## License

MIT
