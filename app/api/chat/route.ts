import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { retrieveRelevantBooks, getDatasetStats } from "@/lib/retrieval";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  // RAG: retrieve relevant books for this query
  const relevantBooks = retrieveRelevantBooks(lastMessage, 12);
  const stats = getDatasetStats();

  const context = relevantBooks
    .map(
      (b) =>
        `[${b.list_type} #${b.rank}] "${b.title}" by ${b.author}
  Rating: ${b.rating ?? "N/A"}/5 | Reviews: ${b.num_reviews?.toLocaleString() ?? "N/A"} | Price: ${b.price}
  Publisher: ${b.publisher} | Published: ${b.publication_date}
  URL: ${b.url}
  Description: ${b.description.slice(0, 300)}${b.description.length > 300 ? "…" : ""}`
    )
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant that answers questions about the Amazon Kindle Paranormal Romance Bestsellers dataset.

STRICT RULE: You ONLY answer using the data provided below. Do not use any outside knowledge, do not make up books, authors, or facts. If the answer is not in the dataset, say "I don't have that information in the dataset."

DATASET OVERVIEW:
- Total books: ${stats.total} (${stats.paid} Paid + ${stats.free} Free)
- Average rating: ${stats.avgRating}/5
- Total reviews across all books: ${stats.totalReviews}
- #1 Paid: "${stats.topPaidBook}"
- #1 Free: "${stats.topFreeBook}"

RETRIEVED BOOKS (most relevant to the current question — ${relevantBooks.length} books):
${context}

When answering:
- Cite book titles and ranks (e.g., "Paid #3 — The Wolf King")
- Use exact numbers from the data
- If asked for a list, format it clearly with bullet points or numbered items
- Keep answers concise and factual`;

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    system: systemPrompt,
    messages,
    maxTokens: 1024,
    temperature: 0.2,
  });

  return result.toDataStreamResponse();
}
