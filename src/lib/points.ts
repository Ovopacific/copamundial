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

  // Correct Result (Winner or Tie) -> 3 points
  const actualDiff = actualHome - actualAway;
  const predDiff = predHome - predAway;

  // Sign function helps determine winner (1 for Home, -1 for Away, 0 for Tie)
  if (Math.sign(actualDiff) === Math.sign(predDiff)) {
    return { pointsEarned: 3, isExactScore: false, isCorrectResult: true };
  }

  // Incorrect
  return { pointsEarned: 0, isExactScore: false, isCorrectResult: false };
}
