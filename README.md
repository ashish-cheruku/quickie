# Kindle Paranormal Romance — AI Chatbot

An AI-powered chatbot that answers questions about the **Amazon Kindle Paranormal Romance Bestsellers** dataset (Top 100 Paid + Top 100 Free). Built with Next.js 16, Groq API, Vercel AI SDK, and shadcn/ui.

---

## Features

- **RAG (Retrieval-Augmented Generation)** — BM25-inspired search retrieves the most relevant books from the dataset before every query, so the model only answers from real data
- **Streaming responses** — token-by-token streaming via Vercel AI SDK
- **Dataset-only answers** — strict system prompt prevents hallucination; if the answer isn't in the dataset, the bot says so
- **Stats sidebar** — live panel showing total books, average rating, total reviews, Paid/Free split, and the #1 book in each category
- **Dark theme UI** — black + grey design built with shadcn/ui and Tailwind CSS
- **Suggestion chips** — one-click starter queries on the empty state
- **Copy button** — hover any AI message to copy it to clipboard
- **Typing indicator** — animated three-dot loader while the model streams

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI / LLM | Groq API — `llama-3.1-8b-instant` |
| AI SDK | Vercel AI SDK (`ai` + `@ai-sdk/groq`) |
| UI Components | shadcn/ui (Button, Input, Badge, ScrollArea, Separator, Tooltip) |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Markdown | react-markdown |

---

## Dataset

The dataset (`data/books.json`) contains **198 books** scraped from the Amazon Kindle Store Paranormal Romance bestsellers page:

- **100 Paid** books (ranks 1–100)
- **98 Free** books (ranks 1–98, Amazon returned 49 per page)

Each book record includes:

| Field | Description |
|-------|-------------|
| `id` | Sequential identifier |
| `list_type` | `"Paid"` or `"Free"` |
| `rank` | Position in the bestseller list |
| `title` | Book title |
| `author` | Author name |
| `rating` | Average star rating (out of 5) |
| `num_reviews` | Total number of customer reviews |
| `price` | Listed price |
| `url` | Amazon product URL |
| `description` | Full book description |
| `publisher` | Publisher name (or "Independently published") |
| `publication_date` | Publication date (YYYY-MM-DD) |
| `asin` | Amazon Standard Identification Number |

---

## Project Structure

```
kindle-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Groq streaming API endpoint
│   ├── globals.css               # Tailwind + shadcn CSS variables + animations
│   ├── layout.tsx                # Root layout (dark class, metadata)
│   └── page.tsx                  # Entry page
├── components/
│   ├── ui/                       # shadcn/ui generated components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   └── tooltip.tsx
│   ├── ChatInterface.tsx         # Main chat UI (messages, input, suggestions)
│   ├── StatsPanel.tsx            # Left sidebar with dataset statistics
│   └── TypingIndicator.tsx       # Animated three-dot loader
├── data/
│   └── books.json                # 198-book dataset
├── lib/
│   ├── retrieval.ts              # BM25-style RAG retrieval + dataset stats
│   └── utils.ts                  # shadcn cn() utility
├── .env.local                    # API key (gitignored)
├── .env.local.example            # Template for env vars
├── components.json               # shadcn/ui configuration
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## How RAG Works

Every user message goes through the following pipeline before hitting the LLM:

```
User query
    │
    ▼
tokenize(query)          — lowercase, strip punctuation, remove stop words
    │
    ▼
scoreBook(book, terms)   — field-weighted BM25-style scoring:
                             title       ×5
                             author      ×4
                             rank        ×3
                             list_type   ×3
                             publisher   ×2
                             description ×1
    │
    ▼
intent signals           — regex boosts for "top/best/rank", "free", "paid",
                           "highest rated", "most reviewed", "cheap", "expensive"
    │
    ▼
top-12 books retrieved   — sorted by score, fallback to rank order if no match
    │
    ▼
injected into system     — structured context block sent to the LLM along
prompt as context          with strict "dataset only" instructions
    │
    ▼
LLM (llama-3.1-8b-instant) streams response
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
# Clone or download the project
cd kindle-chatbot

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Groq API key:
# GROQ_API_KEY=gsk_...
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key — get one free at [console.groq.com](https://console.groq.com) |

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=gsk_your_key_here
```

---

## Deploying to Vercel

1. Push the project to a GitHub repository
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the environment variable in **Settings → Environment Variables**:
   - Key: `GROQ_API_KEY`
   - Value: your Groq API key
4. Deploy

> **Note:** `.env.local` is gitignored and should never be committed. Always set the API key via the Vercel dashboard for production deployments.

---

## API Reference

### `POST /api/chat`

Accepts a JSON body with a `messages` array (Vercel AI SDK format) and streams a response.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "What is the #1 paid book?" }
  ]
}
```

**Response:** Server-Sent Events stream (Vercel AI SDK data stream format).

**Model config:**
- Model: `llama-3.1-8b-instant`
- Max tokens: `1024`
- Temperature: `0.2`
- Context: top-12 retrieved books injected per query

---

## Example Questions

- *What is the #1 paid book?*
- *Show me the highest rated books in the dataset*
- *Which free books have the most reviews?*
- *List all books by [author name]*
- *What is the cheapest paid book?*
- *Which books were published in 2023?*
- *What is the average rating of free books?*
- *Which authors appear more than once?*

---

## Model Choice

`llama-3.1-8b-instant` was selected for:

- **Speed** — lowest latency of Groq's available models
- **Cost** — $0.05 / 1M input tokens, $0.08 / 1M output tokens
- **Capability** — sufficient for factual Q&A over structured context

---

## License

MIT
