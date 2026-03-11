import booksData from "@/data/books.json";

export interface Book {
  id: number;
  list_type: string;
  rank: number;
  title: string;
  author: string;
  rating: number | null;
  num_reviews: number | null;
  price: string;
  url: string;
  description: string;
  publisher: string;
  publication_date: string;
  asin: string;
}

const books = booksData as Book[];

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","is","it","its","was","are","be","been","has","have","had","do",
  "does","did","will","would","could","should","may","might","shall",
  "can","this","that","these","those","i","me","my","we","our","you",
  "your","he","she","his","her","they","their","what","which","who",
  "book","books","kindle","amazon","story","novel","series",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function scoreBook(book: Book, queryTerms: string[], queryRaw: string): number {
  let score = 0;
  const q = queryRaw.toLowerCase();

  // Exact title match (highest weight)
  if (book.title.toLowerCase().includes(q)) score += 20;

  // Field-weighted term scoring
  const fields: [string, number][] = [
    [book.title,       5],
    [book.author,      4],
    [book.publisher,   2],
    [book.description, 1],
    [String(book.rank), 3],
    [book.list_type,   3],
  ];

  for (const term of queryTerms) {
    for (const [text, weight] of fields) {
      if (text.toLowerCase().includes(term)) score += weight;
    }
  }

  // Numeric intent signals
  if (/top|best|rank|number\s*1|#1/.test(q) && book.rank <= 10) score += 8;
  if (/free/.test(q) && book.list_type === "Free") score += 6;
  if (/paid/.test(q) && book.list_type === "Paid") score += 6;
  if (/highest.{0,10}rated|best.{0,10}rating/.test(q) && book.rating && book.rating >= 4.7) score += 5;
  if (/least.{0,10}rated|lowest.{0,10}rated|worst.{0,10}rated|low.{0,10}rated|minimum.{0,10}rat/.test(q) && book.rating !== null) score += (5 - book.rating) * 3;
  if (/most.{0,10}review|popular/.test(q) && book.num_reviews && book.num_reviews > 10000) score += 5;
  if (/fewest.{0,10}review|least.{0,10}review|lowest.{0,10}review/.test(q) && book.num_reviews !== null) score += 5 / (book.num_reviews + 1) * 50000;
  if (/cheap|inexpensive|low.{0,5}price|lowest.{0,5}price|least.{0,5}expens/.test(q)) {
    const priceNum = parseFloat(book.price.replace(/[^0-9.]/g, ""));
    if (!isNaN(priceNum) && priceNum < 400) score += 4;
  }
  if (/expensive|premium|highest.{0,5}price|most.{0,5}expens/.test(q)) {
    const priceNum = parseFloat(book.price.replace(/[^0-9.]/g, ""));
    if (!isNaN(priceNum) && priceNum > 700) score += 4;
  }
  if (/lowest.{0,5}rank|worst.{0,5}rank|last.{0,5}rank|bottom/.test(q) && book.rank >= 90) score += 6;

  return score;
}

export function retrieveRelevantBooks(query: string, topK = 10): Book[] {
  const queryTerms = tokenize(query);

  // If query has no meaningful terms, return top-ranked books
  if (queryTerms.length === 0) {
    return books
      .filter((b) => b.list_type === "Paid")
      .sort((a, b) => a.rank - b.rank)
      .slice(0, topK);
  }

  const scored = books
    .map((book) => ({ book, score: scoreBook(book, queryTerms, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ book }) => book);

  // If nothing matched, return top-ranked books as fallback
  return scored.length > 0
    ? scored
    : books.sort((a, b) => a.rank - b.rank).slice(0, topK);
}

export function getAllBooks(): Book[] {
  return books;
}

export function getDatasetStats() {
  const paid = books.filter((b) => b.list_type === "Paid");
  const free = books.filter((b) => b.list_type === "Free");
  const ratings = books.filter((b) => b.rating !== null).map((b) => b.rating!);
  const reviews = books.filter((b) => b.num_reviews !== null).map((b) => b.num_reviews!);

  // Publication year breakdown
  const yearCounts: Record<string, number> = {};
  for (const b of books) {
    const yr = b.publication_date ? b.publication_date.slice(0, 4) : "Unknown";
    yearCounts[yr] = (yearCounts[yr] ?? 0) + 1;
  }

  // Publisher breakdown (top 10)
  const pubCounts: Record<string, number> = {};
  for (const b of books) {
    const p = b.publisher?.trim() || "Unknown";
    pubCounts[p] = (pubCounts[p] ?? 0) + 1;
  }
  const topPublishers = Object.entries(pubCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => `${name} (${count})`)
    .join(", ");

  // Rating distribution
  const ratingDist: Record<string, number> = {};
  for (const r of ratings) {
    const key = r.toFixed(1);
    ratingDist[key] = (ratingDist[key] ?? 0) + 1;
  }

  // Price stats (paid only)
  const paidPrices = paid
    .map((b) => parseFloat(b.price.replace(/[^0-9.]/g, "")))
    .filter((p) => !isNaN(p) && p > 0);
  const avgPaidPrice = paidPrices.length
    ? (paidPrices.reduce((a, b) => a + b, 0) / paidPrices.length).toFixed(2)
    : "N/A";
  const minPrice = paidPrices.length ? Math.min(...paidPrices).toFixed(2) : "N/A";
  const maxPrice = paidPrices.length ? Math.max(...paidPrices).toFixed(2) : "N/A";

  return {
    total: books.length,
    paid: paid.length,
    free: free.length,
    avgRating: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2),
    totalReviews: reviews.reduce((a, b) => a + b, 0).toLocaleString(),
    topPaidBook: [...paid].sort((a, b) => a.rank - b.rank)[0]?.title,
    topFreeBook: [...free].sort((a, b) => a.rank - b.rank)[0]?.title,
    yearCounts,
    topPublishers,
    ratingDist,
    avgPaidPrice,
    minPrice,
    maxPrice,
    booksWithNoRating: books.filter((b) => b.rating === null).length,
    highestRated: [...books].filter((b) => b.rating !== null).sort((a, b) => b.rating! - a.rating!)[0],
    mostReviewed: [...books].filter((b) => b.num_reviews !== null).sort((a, b) => b.num_reviews! - a.num_reviews!)[0],
  };
}

export function getCompactBooksList(): string {
  return books
    .map(
      (b) =>
        `[${b.list_type} #${b.rank}] "${b.title}" by ${b.author} | ★${b.rating ?? "N/A"} | ${b.num_reviews?.toLocaleString() ?? "N/A"} reviews | ${b.price} | Published: ${b.publication_date || "N/A"} | Publisher: ${b.publisher || "N/A"} | ASIN: ${b.asin}`
    )
    .join("\n");
}
