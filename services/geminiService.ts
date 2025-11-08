// Fix: Import GoogleGenAI and other necessary types from @google/genai
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { AdParams } from '../types';

// Fix: Function to generate ad creative using Gemini API
// Fix: Removed apiKey parameter. API key is now handled by environment variables.
export const generateAdCreative = async (params: AdParams): Promise<string> => {
    // Fix: Initialize GoogleGenAI with API key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: Part[] = [
        {
            inlineData: {
                mimeType: params.mainImageMimeType,
                data: params.mainImageBase64,
            },
        },
    ];

    let prompt = `Com base na imagem fornecida, crie uma imagem de anúncio no estilo "${params.adStyle}".\n`;
    prompt += `Adicione o seguinte texto: "${params.adText}".\n`;
    prompt += `Posicione o texto em: ${params.textPosition}.\n`;
    
    if (params.inspirationalImageBase64 && params.inspirationalImageMimeType) {
        parts.push({
            inlineData: {
                mimeType: params.inspirationalImageMimeType,
                data: params.inspirationalImageBase64,
            },
        });
        prompt += `Use a segunda imagem como inspiração para o estilo visual.\n`;
    }
    
    prompt += `Aplique as seguintes alterações visuais: "${params.visualChanges}".\n`;
    prompt += `Otimize o anúncio para visualização em ${params.displayOptimization}.\n`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        // Fix: Use a recommended image editing model
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
            // Fix: Must specify IMAGE modality for image output
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error('Não foi possível gerar a imagem.');
};