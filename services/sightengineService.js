import axios from 'axios';
import FormData from 'form-data';

export async function analyzeMedia(fileBuffer, filename, mimetype) {
    try {
        const data = new FormData();
        
        // Add the file buffer as a virtual file
        data.append('media', fileBuffer, {
            filename: filename,
            contentType: mimetype
        });
        
        // Use models from environment variables
        data.append('models', process.env.SIGHTENGINE_MODELS || 'nudity,wad,offensive,genai');
        data.append('api_user', process.env.SIGHTENGINE_API_USER);
        data.append('api_secret', process.env.SIGHTENGINE_API_SECRET);

        console.log('Sending request to Sightengine API...');
        console.log('API User:', process.env.SIGHTENGINE_API_USER);
        console.log('Models:', process.env.SIGHTENGINE_MODELS || 'nudity,wad,offensive,genai');

        // Make the API request
        const response = await axios.post(
            process.env.EXTERNAL_API_URL,
            data, 
            { headers: data.getHeaders() }
        );

        // Enhanced logging of the response
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Full API response:', JSON.stringify(response.data, null, 2));
        
        // Process the response
        if (response.data && response.data.status === 'success') {
            const result = {
                isAIGenerated: determineIfAIGenerated(response.data),
                confidence: calculateConfidence(response.data),
                details: extractDetails(response.data),
                status: 'success'
            };
            return result;
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Sightengine API error:');
        if (error.response) {
            console.error('API response status:', error.response.status);
            console.error('API response data:', error.response.data);
        } else {
            console.error('Error message:', error.message);
        }
        throw new Error('Failed to analyze content. Please try again.');
    }
}

/**
 * Determines if content is AI-generated based on Sightengine response
 * @param {Object} apiResponse - The Sightengine API response
 * @returns {boolean} - Whether the content is likely AI-generated
 */
function determineIfAIGenerated(apiResponse) {
    // Check for type.ai_generated field (primary location based on actual API response)
    if (apiResponse.type && typeof apiResponse.type.ai_generated === 'number') {
        return apiResponse.type.ai_generated > 0.7;
    }
    
    // Check for genai model if available (secondary check)
    if (apiResponse.genai && typeof apiResponse.genai.ai_generated === 'number') {
        return apiResponse.genai.ai_generated > 0.7;
    }
    
    // Fallback to wad model's artificial score
    if (apiResponse.wad && typeof apiResponse.wad.artificial === 'number') {
        return apiResponse.wad.artificial > 0.7;
    }
    
    return false;
}

/**
 * Calculates confidence score based on Sightengine response
 * @param {Object} apiResponse - The Sightengine API response
 * @returns {number} - Confidence percentage (0-100)
 */
function calculateConfidence(apiResponse) {
    // Get confidence from type.ai_generated field (primary location based on actual API response)
    if (apiResponse.type && typeof apiResponse.type.ai_generated === 'number') {
        return apiResponse.type.ai_generated * 100;
    }
    
    // Get confidence from genai model if available
    if (apiResponse.genai && typeof apiResponse.genai.ai_generated === 'number') {
        return apiResponse.genai.ai_generated * 100;
    }
    
    // Fallback to wad model's artificial score
    if (apiResponse.wad && typeof apiResponse.wad.artificial === 'number') {
        return apiResponse.wad.artificial * 100;
    }
    
    return 50; // Default confidence
}

/**
 * Extracts additional details from the API response
 * @param {Object} apiResponse - The Sightengine API response
 * @returns {Object} - Extracted details
 */
function extractDetails(apiResponse) {
    const details = {};
    
    // Extract AI generation information if available
    if (apiResponse.type && typeof apiResponse.type.ai_generated === 'number') {
        details.aiGenerated = apiResponse.type.ai_generated;
    }
    
    // Extract nudity information if available
    if (apiResponse.nudity) {
        details.nudity = {
            raw: apiResponse.nudity.raw,
            partial: apiResponse.nudity.partial,
            safe: apiResponse.nudity.safe
        };
    }
    
    // Extract offensive content information if available
    if (apiResponse.offensive) {
        details.offensive = apiResponse.offensive;
    }
    
    // Extract weapon/alcohol/drugs information if available
    if (apiResponse.weapon) {
        details.weapon = apiResponse.weapon;
    }
    
    if (apiResponse.alcohol) {
        details.alcohol = apiResponse.alcohol;
    }
    
    if (apiResponse.drugs) {
        details.drugs = apiResponse.drugs;
    }
    
    return details;
}