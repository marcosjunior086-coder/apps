// Fix: Import GoogleGenAI and other necessary types from @google/genai
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { AdParams } from '../types';

// Fix: Function to generate ad creative using Gemini API
export const generateAdCreative = async (params: AdParams): Promise<string> => {
    // Fix: Initialize GoogleGenAI with API key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (params.outputFormat === 'Imagem') {
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

    } else if (params.outputFormat === 'Vídeo') {
        // Fix: Use a recommended video generation model
        const model = 'veo-3.1-fast-generate-preview';
        const prompt = `Crie um vídeo de anúncio de ${params.animationDuration} segundos no estilo "${params.adStyle}" com as seguintes características:
- Texto do anúncio: "${params.adText}"
- Otimização para display: ${params.displayOptimization}
- Alterações visuais desejadas: "${params.visualChanges}"
- Animação: ${params.animateImage ? 'Sim' : 'Não'}

Use a imagem principal fornecida como ponto de partida. ${params.inspirationalImageBase64 ? 'Use a imagem de inspiração fornecida para guiar o estilo visual.' : ''}`;

        const videoAspectRatio = (params.aspectRatio === '1:1' || params.aspectRatio === '4:5' || params.aspectRatio === 'proportional' ? '9:16' : params.aspectRatio) as '16:9' | '9:16';

        let operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            image: {
                imageBytes: params.mainImageBase64,
                mimeType: params.mainImageMimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: videoAspectRatio,
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
             // Fix: Append API key to the download link as per documentation
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!videoResponse.ok) {
                throw new Error('Falha ao baixar o vídeo gerado.');
            }
            const videoBlob = await videoResponse.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(videoBlob);
            });
        } else {
            throw new Error('Não foi possível gerar o vídeo.');
        }
    }

    throw new Error('Formato de saída inválido.');
};
