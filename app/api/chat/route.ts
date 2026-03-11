import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { retrieveRelevantBooks, getDatasetStats, getCompactBooksList } from "@/lib/retrieval";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  const relevantBooks = retrieveRelevantBooks(lastMessage, 15);
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
  Publisher: ${b.publisher || "N/A"} | Published: ${b.publication_date || "N/A"}
  URL: ${b.url}
  Description: ${b.description?.slice(0, 400)}${(b.description?.length ?? 0) > 400 ? "…" : ""}`
    )
    .join("\n\n");

  const systemPrompt = `You are a knowledgeable assistant for the Amazon Kindle Paranormal Romance Bestsellers dataset. The current year is 2026.

STRICT RULE: Answer ONLY using the data below. Do not invent books, authors, or facts. If something is genuinely not in the data, say so clearly.

═══════════════════════════════════════
DATASET STATISTICS (ALL 200 BOOKS)
═══════════════════════════════════════
- Total: ${stats.total} books (${stats.paid} Paid + ${stats.free} Free)
- Average rating: ${stats.avgRating}/5
- Total reviews: ${stats.totalReviews}
- #1 Paid: "${stats.topPaidBook}"
- #1 Free: "${stats.topFreeBook}"

PUBLICATION YEARS:
${yearBreakdown}

PRICES (Paid books):
- Cheapest: "${stats.cheapestPaid?.title}" — ${stats.cheapestPaid?.priceStr}
- Most expensive: "${stats.mostExpensivePaid?.title}" — ${stats.mostExpensivePaid?.priceStr}
- Average price: INR ${stats.avgPaidPrice}
- All Free books are priced at INR 0.00

RATINGS:
- Books rated ≥ 4.8: ${stats.ratingAbove48Count} → ${stats.ratingAbove48}
- Books rated ≥ 4.5: ${stats.ratingAbove45Count}
- Books rated < 4.0: ${stats.ratingBelow40Count} → ${stats.ratingBelow40}
- Books with no rating: ${stats.booksWithNoRating} → ${stats.unratedBooks}
- Highest rated: "${stats.highestRated?.title}" (★${stats.highestRated?.rating}, ${stats.highestRated?.list_type} #${stats.highestRated?.rank})

REVIEWS:
- Most reviewed: "${stats.mostReviewed?.title}" (${stats.mostReviewed?.num_reviews?.toLocaleString()} reviews)
- Least reviewed (bottom 5): ${stats.leastReviewed}

TOP PUBLISHERS: ${stats.topPublishers}

AUTHORS WITH MULTIPLE BOOKS:
${stats.multiBookAuthors}

═══════════════════════════════════════
FULL BOOK LIST (all 200 — use for counting, filtering, listing)
═══════════════════════════════════════
${allBooks}

═══════════════════════════════════════
DETAILED CONTEXT (top ${relevantBooks.length} most relevant books)
═══════════════════════════════════════
${detailedContext}

ANSWERING GUIDELINES:
- For count/aggregate questions (how many, which year, list all, etc.) → scan the FULL BOOK LIST above
- For specific book info, descriptions, or recommendations → use the DETAILED CONTEXT
- Always cite rank and list type: e.g. "Paid #3 — The Wolf King"
- Include Amazon URLs when asked for links
- Use exact numbers from the data — never estimate
- If a book has no rating, say "unrated" not "N/A"`;

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemPrompt,
    messages,
    maxTokens: 1024,
    temperature: 0.1,
  });

  return result.toDataStreamResponse();
}
