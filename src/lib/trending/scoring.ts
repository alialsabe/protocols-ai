// Composite popularity score: log-weighted blend of YouTube views, Reddit
// posts, and Amazon reviews. Logs compress fat-tailed distributions so a
// blockbuster YT channel doesn't drown out everything else.
// Formula:
//   raw = log10(ytViews+1)*15 + log10(redditPosts+1)*10 + log10(amazonReviews+1)*5
//   score = clamp(raw, 0, 100)
export interface ScoreInputs {
  ytViews: number;
  redditPosts: number;
  amazonReviews: number | null;
}

export function computePopularityScore(input: ScoreInputs): number {
  const yt = Math.log10((input.ytViews ?? 0) + 1) * 15;
  const rd = Math.log10((input.redditPosts ?? 0) + 1) * 10;
  const az = Math.log10((input.amazonReviews ?? 0) + 1) * 5;
  const raw = yt + rd + az;
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}
