import { getUserCredits, deductCredits } from './creditService';

/**
 * Custom error class for insufficient credits
 */
export class InsufficientCreditsError extends Error {
  constructor(required: number, current: number) {
    super(`Insufficient credits. Required: ${required}, Available: ${current}`);
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Higher-order function that wraps an operation with credit checking and deduction
 * Credits are deducted BEFORE the operation runs
 *
 * @param creditsRequired Number of credits required for the operation
 * @param operationType Type of operation for logging purposes
 * @param operation The async operation to execute if credits are sufficient
 * @returns The result of the operation
 * @throws InsufficientCreditsError if user doesn't have enough credits
 * @throws Error if the operation itself fails
 *
 * @example
 * await withCreditCheck(2, 'generate', async () => {
 *   const image = await generateJewelryImage(prompt);
 *   return image;
 * });
 */
export async function withCreditCheck<T>(
  creditsRequired: number,
  operationType: 'generate' | 'analyze' | 'refine' | 'try_on',
  operation: () => Promise<T>
): Promise<T> {
  // 1. Check if user has enough credits
  const currentCredits = await getUserCredits();

  if (currentCredits < creditsRequired) {
    throw new InsufficientCreditsError(creditsRequired, currentCredits);
  }

  // 2. Deduct credits BEFORE executing the operation
  //    This ensures credits are consumed even if the operation fails
  //    (to prevent retry abuse of failed API calls)
  await deductCredits(creditsRequired, operationType);

  // 3. Execute the operation
  try {
    const result = await operation();
    return result;
  } catch (error) {
    // Note: Credits have already been deducted at this point
    // In a production system, you might want to implement a refund mechanism
    // for certain types of failures (e.g., API errors vs user errors)
    console.error(`Operation ${operationType} failed after credit deduction:`, error);
    throw error;
  }
}
