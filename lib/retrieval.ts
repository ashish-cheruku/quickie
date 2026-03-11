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
  if (/most.{0,10}review|popular/.test(q) && book.num_reviews && book.num_reviews > 10000) score += 5;
  if (/cheap|inexpensive|low.{0,5}price/.test(q)) {
    const priceNum = parseFloat(book.price.replace(/[^0-9.]/g, ""));
    if (!isNaN(priceNum) && priceNum < 400) score += 4;
  }
  if (/expensive|premium/.test(q)) {
    const priceNum = parseFloat(book.price.replace(/[^0-9.]/g, ""));
    if (!isNaN(priceNum) && priceNum > 700) score += 4;
  }

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

  return {
    total: books.length,
    paid: paid.length,
    free: free.length,
    avgRating: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2),
    totalReviews: reviews.reduce((a, b) => a + b, 0).toLocaleString(),
    topPaidBook: paid.sort((a, b) => a.rank - b.rank)[0]?.title,
    topFreeBook: free.sort((a, b) => a.rank - b.rank)[0]?.title,
  };
}
