import { Match, Prediction } from "@/types";

export interface PointsCalculationResult {
  pointsEarned: number;
  isExactScore: boolean;
  isCorrectResult: boolean;
}

export function calculatePredictionPoints(match: Match, prediction: Prediction): PointsCalculationResult {
  if (match.status !== "finished" || match.homeScore === undefined || match.awayScore === undefined) {
    return { pointsEarned: 0, isExactScore: false, isCorrectResult: false };
  }

  const { homeScore: actualHome, awayScore: actualAway } = match;
  const { predictedHomeScore: predHome, predictedAwayScore: predAway } = prediction;

  // Exact Score -> 5 points
  if (actualHome === predHome && actualAway === predAway) {
    return { pointsEarned: 5, isExactScore: true, isCorrectResult: true };
  }

  const actualDiff = actualHome - actualAway;
  const predDiff = predHome - predAway;

  // Correct Result (Winner or Tie) -> 0 points (disabled 3 points reward per user request)
  if (Math.sign(actualDiff) === Math.sign(predDiff)) {
    return { pointsEarned: 0, isExactScore: false, isCorrectResult: true };
  }

  // Incorrect
  return { pointsEarned: 0, isExactScore: false, isCorrectResult: false };
}
