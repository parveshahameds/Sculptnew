import { supabase } from './supabaseClient';
import type { JewelrySpec } from '../components/ManufacturingDetails';

/**
 * Uploads a base64 image to Supabase Storage
 * @param base64Image - The base64 encoded image (without data URL prefix)
 * @param bucket - The storage bucket name
 * @param fileName - The name for the file
 * @returns The public URL of the uploaded image
 */
export const uploadImageToStorage = async (
    base64Image: string,
    bucket: 'jewelry-designs' | 'try-on-results',
    fileName?: string
): Promise<string> => {
    try {
        // Clean base64 string if it has data URL prefix
        let cleanBase64 = base64Image.trim();
        if (cleanBase64.startsWith('data:')) {
            cleanBase64 = cleanBase64.split(',')[1];
        }

        // Convert base64 to blob
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        // Generate unique filename if not provided
        const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(uniqueFileName, blob, {
                contentType: 'image/png',
                upsert: false
            });

        if (error) {
            console.error('Supabase storage upload error:', error);
            throw new Error(`Failed to upload image: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return publicUrl;

    } catch (error) {
        console.error('Error uploading image to storage:', error);
        if (error instanceof Error) {
            throw new Error(`Image upload failed: ${error.message}`);
        }
        throw new Error('Image upload failed due to an unknown error');
    }
};

/**
 * Saves a jewelry design to the database
 * @param designData - The design data to save
 * @returns The saved design with ID
 */
export const saveJewelryDesign = async (designData: {
    prompt: string;
    jewelryType?: string;
    material?: string;
    gemstone?: string;
    engravingStyle?: string;
    imageBase64: string;
    designSpecs: JewelrySpec;
}): Promise<{ id: string; imageUrl: string }> => {
    try {
        // Upload image to storage
        const imageUrl = await uploadImageToStorage(
            designData.imageBase64,
            'jewelry-designs'
        );

        // Save design to database
        const { data, error } = await supabase
            .from('jewelry_designs')
            .insert({
                prompt: designData.prompt,
                jewelry_type: designData.jewelryType || null,
                material: designData.material || null,
                gemstone: designData.gemstone || null,
                engraving_style: designData.engravingStyle || null,
                image_url: imageUrl,
                design_specs: designData.designSpecs
            })
            .select('id, image_url')
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(`Failed to save design: ${error.message}`);
        }

        console.log('Design saved successfully:', data);
        return { id: data.id, imageUrl: data.image_url };

    } catch (error) {
        console.error('Error saving jewelry design:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to save design: ${error.message}`);
        }
        throw new Error('Failed to save design due to an unknown error');
    }
};

/**
 * Saves a virtual try-on result to the database
 * @param tryOnData - The try-on data to save
 * @returns The saved try-on result with ID
 */
export const saveTryOnResult = async (tryOnData: {
    designId?: string;
    personImageBase64: string;
    resultImageBase64: string;
    jewelryType: string;
}): Promise<{ id: string; resultImageUrl: string }> => {
    try {
        // Upload both images to storage
        const [personImageUrl, resultImageUrl] = await Promise.all([
            uploadImageToStorage(tryOnData.personImageBase64, 'try-on-results'),
            uploadImageToStorage(tryOnData.resultImageBase64, 'try-on-results')
        ]);

        // Save try-on result to database
        const { data, error } = await supabase
            .from('try_on_results')
            .insert({
                design_id: tryOnData.designId || null,
                person_image_url: personImageUrl,
                jewelry_type: tryOnData.jewelryType,
                result_image_url: resultImageUrl
            })
            .select('id, result_image_url')
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(`Failed to save try-on result: ${error.message}`);
        }

        console.log('Try-on result saved successfully:', data);
        return { id: data.id, resultImageUrl: data.result_image_url };

    } catch (error) {
        console.error('Error saving try-on result:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to save try-on result: ${error.message}`);
        }
        throw new Error('Failed to save try-on result due to an unknown error');
    }
};

/**
 * Retrieves all jewelry designs from the database
 * @param limit - Maximum number of designs to retrieve
 * @returns Array of jewelry designs
 */
export const getJewelryDesigns = async (limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('jewelry_designs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase query error:', error);
            throw new Error(`Failed to fetch designs: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error('Error fetching jewelry designs:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch designs: ${error.message}`);
        }
        throw new Error('Failed to fetch designs due to an unknown error');
    }
};

/**
 * Retrieves all try-on results from the database
 * @param limit - Maximum number of results to retrieve
 * @returns Array of try-on results
 */
export const getTryOnResults = async (limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('try_on_results')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase query error:', error);
            throw new Error(`Failed to fetch try-on results: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error('Error fetching try-on results:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch try-on results: ${error.message}`);
        }
        throw new Error('Failed to fetch try-on results due to an unknown error');
    }
};
