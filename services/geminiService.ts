import type { JewelrySpec } from '../components/ManufacturingDetails';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const GEMINI_MODEL = 'google/gemini-2.5-flash-image'; // Supports image generation and vision

interface OpenRouterMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export const generateJewelryImage = async (
    prompt: string, 
    imageInputs: { base64: string, mimeType: string }[]
): Promise<string> => {
    const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];
    
    // Add all images
    for (const imageInput of imageInputs) {
        content.push({
            type: 'image_url',
            image_url: {
                url: `data:${imageInput.mimeType};base64,${imageInput.base64}`
            }
        });
    }
    
    // Add the prompt
    content.push({
        type: 'text',
        text: prompt
    });

    try {
        const requestBody = {
            model: GEMINI_MODEL,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            response_modalities: ['image'] // Enable image generation
        };
        
        console.log('Generating jewelry image with:', GEMINI_MODEL);

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Jewelry Design App'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter error:', errorData);
            throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('OpenRouter image generation response:', data);
        
        const messageContent = data.choices?.[0]?.message?.content;
        
        // Handle array response (image + optional text)
        if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
                if (item.type === 'image_url' && item.image_url?.url) {
                    // Remove data URL prefix if present
                    const base64 = item.image_url.url.replace(/^data:image\/\w+;base64,/, '');
                    return base64;
                }
            }
        }
        
        // Handle string response (shouldn't happen with image generation)
        if (typeof messageContent === 'string') {
            console.warn('Received text instead of image:', messageContent);
            throw new Error("Model returned text instead of an image. Please try again.");
        }
        
        throw new Error("No image found in the API response.");

    } catch (error) {
        console.error("OpenRouter API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Image generation failed: ${error.message}`);
        }
        throw new Error("Image generation failed due to an unknown error. Please try again.");
    }
};

export const analyzeJewelryImage = async (
    imageBase64: string
): Promise<JewelrySpec> => {
    if (!imageBase64 || imageBase64.trim() === '') {
        throw new Error('No image provided for analysis');
    }

    const prompt = `You are an expert jewelry designer and manufacturing specialist. Analyze the provided image of a piece of jewelry. Based on your expert assessment, provide detailed manufacturing specifications. 

Your response must be ONLY valid JSON (no markdown, no code blocks) and strictly adhere to this schema:
{
  "designId": "string - A unique alphanumeric identifier for the design",
  "estimatedWeightGm": number,
  "metal": "string - The primary metal used, including purity (e.g., '18K Yellow Gold', 'Platinum 950')",
  "totalCaratCt": number,
  "gemstones": [
    {
      "type": "string - Type of gemstone (e.g., 'Diamond', 'Ruby')",
      "cut": "string - The cut (e.g., 'Round Brilliant', 'Princess')",
      "sizeMm": "string - Size range in millimeters (e.g., '2.5mm', '5x3mm')",
      "quantity": number,
      "caratWeight": number
    }
  ],
  "manufacturingNotes": ["string array of key manufacturing instructions"]
}

Generate plausible specifications based on the visual information. Estimate dimensions, weights, and quantities as a seasoned professional would.`;

    // Clean up the base64 string - remove data URL prefix if present
    let cleanBase64 = imageBase64.trim();
    if (cleanBase64.startsWith('data:')) {
        cleanBase64 = cleanBase64.split(',')[1];
    }

    // Detect image format from the original string or default to png
    let mimeType = 'image/png';
    if (imageBase64.includes('data:image/')) {
        const match = imageBase64.match(/data:(image\/[^;]+);/);
        if (match) {
            mimeType = match[1];
        }
    }

    const content = [
        {
            type: 'image_url',
            image_url: {
                url: `data:${mimeType};base64,${cleanBase64}`
            }
        },
        {
            type: 'text',
            text: prompt
        }
    ];

    try {
        const requestBody = {
            model: GEMINI_MODEL,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            temperature: 0.7
        };

        console.log('Analyzing jewelry image with:', GEMINI_MODEL);
        
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Jewelry Design App'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
            console.error('OpenRouter error response:', errorData);
            throw new Error(`OpenRouter API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const jsonText = data.choices?.[0]?.message?.content?.trim();
        
        if (!jsonText) {
            throw new Error("No response from the model");
        }

        // Clean up response - remove markdown code blocks if present
        let cleanJson = jsonText;
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/```\n?/g, '');
        }
        
        const parsedJson = JSON.parse(cleanJson.trim());
        return parsedJson as JewelrySpec;

    } catch (error) {
        console.error("OpenRouter analysis call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Image analysis failed: ${error.message}`);
        }
        throw new Error("Image analysis failed due to an unknown error. Please try again.");
    }
};

export const generateTryOnImage = async (
    personImageBase64: string,
    personImageMimeType: string,
    jewelryImageBase64: string,
    jewelryType: string
): Promise<string> => {
    const prompt = `Generate a photorealistic image of the person from the first image wearing the jewelry from the second image (${jewelryType}).
    
Requirements:
- The person's identity, facial features, pose, and background must remain exactly the same
- Place the jewelry naturally on the correct body part for a ${jewelryType} (e.g., ring on finger, necklace on neck, earring on ear)
- Adjust the lighting and shadows of the jewelry to match the person's photo realistically
- High quality, photorealistic output`;

    const content = [
        {
            type: 'image_url',
            image_url: {
                url: `data:${personImageMimeType};base64,${personImageBase64}`
            }
        },
        {
            type: 'image_url',
            image_url: {
                url: `data:image/png;base64,${jewelryImageBase64}`
            }
        },
        {
            type: 'text',
            text: prompt
        }
    ];

    try {
        const requestBody = {
            model: GEMINI_MODEL,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            response_modalities: ['image'] // Enable image generation
        };
        
        console.log('Generating virtual try-on with:', GEMINI_MODEL);

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Jewelry Design App'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter error:', errorData);
            throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('OpenRouter try-on response:', data);
        
        const messageContent = data.choices?.[0]?.message?.content;
        
        // Handle array response (image + optional text)
        if (Array.isArray(messageContent)) {
            for (const item of messageContent) {
                if (item.type === 'image_url' && item.image_url?.url) {
                    const base64 = item.image_url.url.replace(/^data:image\/\w+;base64,/, '');
                    return base64;
                }
            }
        }
        
        throw new Error("No image found in the API response.");
        
    } catch (error) {
        console.error("OpenRouter Try-On API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Virtual try-on failed: ${error.message}`);
        }
        throw new Error("Virtual try-on failed due to an unknown error.");
    }
};
