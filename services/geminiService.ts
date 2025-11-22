
import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import type { JewelrySpec } from '../components/ManufacturingDetails';

export const generateJewelryImage = async (
    prompt: string, 
    imageInputs: { base64: string, mimeType: string }[]
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: Part[] = [];

    // Add all image parts first. The prompt will refer to them in order.
    for (const imageInput of imageInputs) {
        parts.push({
            inlineData: {
                data: imageInput.base64,
                mimeType: imageInput.mimeType,
            },
        });
    }

    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
                return part.inlineData.data; // Return the first image found
            }
        }
        
        throw new Error("No image data found in the API response. The model may not have been able to fulfill the request.");

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`The AI model failed to generate an image: ${error.message}`);
        }
        throw new Error("The AI model failed to generate an image due to an unknown error. Please try again.");
    }
};


export const analyzeJewelryImage = async (
    imageBase64: string
): Promise<JewelrySpec> => {
     if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are an expert jewelry designer and manufacturing specialist. Analyze the provided image of a piece of jewelry. Based on your expert assessment, provide detailed manufacturing specifications. Your response must be in JSON format and strictly adhere to the provided schema. Generate a plausible and consistent set of specifications based on the visual information in the image. Estimate dimensions, weights, and quantities as a seasoned professional would. Invent a creative but professional-sounding Design ID.`;

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: 'image/png', // The generated image is always PNG
        },
    };

    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        designId: { type: Type.STRING, description: "A unique alphanumeric identifier for the design." },
                        estimatedWeightGm: { type: Type.NUMBER, description: "Estimated total weight of the piece in grams." },
                        metal: { type: Type.STRING, description: "The primary metal used, including purity (e.g., '18K Yellow Gold', 'Platinum 950')." },
                        totalCaratCt: { type: Type.NUMBER, description: "Estimated total carat weight of all gemstones combined." },
                        gemstones: {
                            type: Type.ARRAY,
                            description: "A list of all types of gemstones used in the piece.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, description: "Type of the gemstone (e.g., 'Diamond', 'Ruby')." },
                                    cut: { type: Type.STRING, description: "The cut of the gemstone (e.g., 'Round Brilliant', 'Princess')." },
                                    sizeMm: { type: Type.STRING, description: "Estimated size range in millimeters (e.g., '2.5mm', '5x3mm')." },
                                    quantity: { type: Type.INTEGER, description: "The number of gemstones of this type." },
                                    caratWeight: { type: Type.NUMBER, description: "The estimated total carat weight for this group of gemstones." },
                                },
                                required: ['type', 'cut', 'sizeMm', 'quantity', 'caratWeight']
                            }
                        },
                        manufacturingNotes: {
                            type: Type.ARRAY,
                            description: "A list of key manufacturing instructions and notes.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['designId', 'estimatedWeightGm', 'metal', 'totalCaratCt', 'gemstones', 'manufacturingNotes']
                }
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as JewelrySpec;

    } catch (error) {
        console.error("Gemini analysis call failed:", error);
        if (error instanceof Error) {
            throw new Error(`The AI model failed to analyze the image: ${error.message}`);
        }
        throw new Error("The AI model failed to analyze the image due to an unknown error. Please try again.");
    }
};

export const generateTryOnImage = async (
    personImageBase64: string,
    personImageMimeType: string,
    jewelryImageBase64: string,
    jewelryType: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `The first image is a photo of a person. The second image is a piece of jewelry (${jewelryType}). 
    Generate a new photorealistic image of the person from the first image wearing the jewelry from the second image.
    - The person's identity, facial features, pose, and background must remain exactly the same.
    - Place the jewelry naturally on the correct body part for a ${jewelryType} (e.g., ring on finger, necklace on neck, earring on ear).
    - Adjust the lighting and shadows of the jewelry to match the person's photo realistically.
    - High quality, photorealistic output.`;

    const parts = [
        {
            inlineData: {
                data: personImageBase64,
                mimeType: personImageMimeType,
            },
        },
        {
            inlineData: {
                data: jewelryImageBase64,
                mimeType: 'image/png',
            },
        },
        { text: prompt }
    ];

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image data found in the API response.");
    } catch (error) {
        console.error("Gemini Try-On API call failed:", error);
         if (error instanceof Error) {
            throw new Error(`The AI model failed to generate the try-on image: ${error.message}`);
        }
        throw new Error("The AI model failed due to an unknown error.");
    }
};
