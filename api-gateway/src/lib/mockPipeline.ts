/**
 * Simulates stemming and word cloud generation for local/mock pipeline testing.
 *
 * @param title Title of the article.
 * @param content Optional raw text content.
 *
 * @returns Object containing mock stemmed tokens string and wordCloud frequency array.
 */
export function generateMockAnalysis(title: string, content?: string) {
  const words = (content || title || 'artikel dokumen pdf pipeline')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 3);
  
  const stemmedWords = words.map((w: string) => {
    return w.length > 5 ? w.slice(0, 5) : w;
  });

  const freq: Record<string, number> = {};
  stemmedWords.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });

  const wordCloud = Object.entries(freq)
    .map(([word, count]) => ({ word, count: count * 3 + 2 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    stemmed: stemmedWords.slice(0, 15).join(' '),
    wordCloud: wordCloud.length > 0 ? wordCloud : [
      { word: 'dokum', count: 14 },
      { word: 'proses', count: 9 },
      { word: 'siste', count: 5 }
    ]
  };
}
