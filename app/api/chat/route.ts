import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { retrieveRelevantBooks, getDatasetStats, getCompactBooksList } from "@/lib/retrieval";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  const relevantBooks = retrieveRelevantBooks(lastMessage, 12);
  const stats = getDatasetStats();
  const allBooks = getCompactBooksList();

  const yearBreakdown = Object.entries(stats.yearCounts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([yr, count]) => `${yr}: ${count} books`)
    .join(" | ");

  const detailedContext = relevantBooks
    .map(
      (b) =>
        `[${b.list_type} #${b.rank}] "${b.title}" by ${b.author}
  Rating: ${b.rating ?? "N/A"}/5 | Reviews: ${b.num_reviews?.toLocaleString() ?? "N/A"} | Price: ${b.price}
  Publisher: ${b.publisher} | Published: ${b.publication_date}
  URL: ${b.url}
  Description: ${b.description.slice(0, 300)}${b.description.length > 300 ? "…" : ""}`
    )
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant that answers questions about the Amazon Kindle Paranormal Romance Bestsellers dataset. The current year is 2026.

STRICT RULE: You ONLY answer using the data provided below. Do not use any outside knowledge, do not make up books, authors, or facts. If the answer is not in the dataset, say "I don't have that information in the dataset."

DATASET STATISTICS (computed from ALL 200 books):
- Total books: ${stats.total} (${stats.paid} Paid + ${stats.free} Free)
- Average rating: ${stats.avgRating}/5
- Books with no rating: ${stats.booksWithNoRating}
- Total reviews: ${stats.totalReviews}
- Highest rated: "${stats.highestRated?.title}" (★${stats.highestRated?.rating})
- Most reviewed: "${stats.mostReviewed?.title}" (${stats.mostReviewed?.num_reviews?.toLocaleString()} reviews)
- Paid price range: INR ${stats.minPrice} – INR ${stats.maxPrice} (avg INR ${stats.avgPaidPrice})
- #1 Paid: "${stats.topPaidBook}"
- #1 Free: "${stats.topFreeBook}"
- Publication years: ${yearBreakdown}
- Top publishers: ${stats.topPublishers}

FULL BOOK LIST (all 200 books — use this to answer any counting, filtering, or aggregate questions):
${allBooks}

DETAILED CONTEXT for top relevant books:
${detailedContext}

When answering:
- For counting/aggregate questions (how many, which year, etc.) always scan the FULL BOOK LIST above
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
