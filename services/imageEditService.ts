import { updateJewelryDesign } from './supabaseService';
import type { JewelrySpec } from '../components/ManufacturingDetails';
import { analyzeJewelryImage } from './geminiService';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const GEMINI_MODEL = 'google/gemini-2.5-flash-image-preview';

export interface RefinementRequest {
    originalImageBase64: string;
    refinementPrompt: string;
    contextPrompt?: string; // Original design description for context
    designId?: string; // ID of the design to update in Supabase
}

export interface RefinementResult {
    refinedImageBase64: string;
    appliedChange: string;
    updatedSpecs?: JewelrySpec;
}

/**
 * Refine a specific aspect of a jewelry image without regenerating the entire design.
 * This uses targeted prompting to modify only the requested element while preserving the rest.
 * Automatically saves the refined image to Supabase if designId is provided.
 */
export const refineJewelryImage = async (
    request: RefinementRequest
): Promise<RefinementResult> => {
    const { originalImageBase64, refinementPrompt, contextPrompt, designId } = request;

    // Clean up the base64 string
    let cleanBase64 = originalImageBase64.trim();
    if (cleanBase64.startsWith('data:')) {
        cleanBase64 = cleanBase64.split(',')[1];
    }

    // Build a detailed prompt that emphasizes preserving the original design
    const fullPrompt = `You are an expert jewelry designer. I have a jewelry design that needs a MINOR, TARGETED refinement.

IMPORTANT INSTRUCTIONS:
- You must preserve the ENTIRE original design exactly as it is
- Only modify the SPECIFIC element mentioned in the refinement request
- Keep the same style, lighting, background, and overall composition
- Make the change subtle and natural, as if adjusting the original design
- DO NOT regenerate the entire piece or change unrelated elements

Original Design Context: ${contextPrompt || 'High-end jewelry piece'}

REFINEMENT REQUEST: ${refinementPrompt}

Generate the refined jewelry image with ONLY the requested change applied. Everything else must remain identical to the original image.`;

    const content = [
        {
            type: 'image_url',
            image_url: {
                url: `data:image/png;base64,${cleanBase64}`
            }
        },
        {
            type: 'text',
            text: fullPrompt
        }
    ];

    try {
        const requestBody = {
            model: GEMINI_MODEL,
            modalities: ["text", "image"],
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            temperature: 0.3 // Lower temperature for more consistent, controlled edits
        };

        console.log('Refining jewelry image with:', GEMINI_MODEL);
        console.log('Refinement prompt:', refinementPrompt);

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Jewelry Design App - Refinement'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter refinement error:', errorData);
            throw new Error(`Refinement failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('OpenRouter refinement response:', data);

        const message = data.choices?.[0]?.message;

        // Check for images in the separate 'images' field
        if (message?.images && Array.isArray(message.images)) {
            for (const item of message.images) {
                if (item.type === 'image_url' && item.image_url?.url) {
                    const base64 = item.image_url.url.replace(/^data:image\/\w+;base64,/, '');

                    // Auto-save to Supabase if designId provided
                    let updatedSpecs: JewelrySpec | undefined;
                    if (designId) {
                        try {
                            console.log('Analyzing refined image...');
                            updatedSpecs = await analyzeJewelryImage(base64);

                            console.log('Saving refined design to Supabase...');
                            await updateJewelryDesign(designId, {
                                imageBase64: base64,
                                designSpecs: updatedSpecs,
                                refinementPrompt
                            });
                            console.log('Refined design saved successfully');
                        } catch (saveError) {
                            console.error('Failed to save refined design:', saveError);
                            // Continue - don't fail refinement if save fails
                        }
                    }

                    return {
                        refinedImageBase64: base64,
                        appliedChange: refinementPrompt,
                        updatedSpecs
                    };
                }
            }
        }

        // Fallback: Check if content is an array with images
        const messageContent = message?.content;
        if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
                if (item.type === 'image_url' && item.image_url?.url) {
                    const base64 = item.image_url.url.replace(/^data:image\/\w+;base64,/, '');

                    // Auto-save to Supabase if designId provided
                    let updatedSpecs: JewelrySpec | undefined;
                    if (designId) {
                        try {
                            console.log('Analyzing refined image...');
                            updatedSpecs = await analyzeJewelryImage(base64);

                            console.log('Saving refined design to Supabase...');
                            await updateJewelryDesign(designId, {
                                imageBase64: base64,
                                designSpecs: updatedSpecs,
                                refinementPrompt
                            });
                            console.log('Refined design saved successfully');
                        } catch (saveError) {
                            console.error('Failed to save refined design:', saveError);
                            // Continue - don't fail refinement if save fails
                        }
                    }

                    return {
                        refinedImageBase64: base64,
                        appliedChange: refinementPrompt,
                        updatedSpecs
                    };
                }
            }
        }

        throw new Error("No refined image found in the API response. Please try again.");

    } catch (error) {
        console.error("Image refinement failed:", error);
        if (error instanceof Error) {
            throw new Error(`Refinement failed: ${error.message}`);
        }
        throw new Error("Image refinement failed due to an unknown error. Please try again.");
    }
};
