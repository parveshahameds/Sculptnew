import { supabase } from './supabaseClient';

/**
 * Fetches the current credit balance for the authenticated user
 * @returns The user's current credit balance
 * @throws Error if user is not authenticated or fetch fails
 */
export const getUserCredits = async (): Promise<number> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to check credits');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('credits')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching credits:', error);
    throw new Error(`Failed to fetch credits: ${error.message}`);
  }

  return data?.credits ?? 0;
};

/**
 * Deducts credits from the user's account using atomic database function
 * @param creditsToDeduct Number of credits to deduct
 * @param operationType Type of operation: generate, analyze, refine, or try_on
 * @returns The user's new credit balance after deduction
 * @throws Error if user is not authenticated, has insufficient credits, or deduction fails
 */
export const deductCredits = async (
  creditsToDeduct: number,
  operationType: 'generate' | 'analyze' | 'refine' | 'try_on'
): Promise<number> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to deduct credits');
  }

  const { data, error } = await supabase.rpc('deduct_user_credits', {
    p_user_id: user.id,
    p_credits_to_deduct: creditsToDeduct,
    p_operation_type: operationType
  });

  if (error) {
    console.error('Error deducting credits:', error);
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }

  return data;
};
