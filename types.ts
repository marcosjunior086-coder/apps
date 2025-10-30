export type OutputFormat = 'Imagem' | 'Vídeo';
export type AdStyle = 'Moderno e minimalista' | 'Criativo e colorido' | 'Luxuoso e sofisticado' | 'Alta conversão';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | 'proportional';
export type TextPosition =
  | 'Superior esquerdo'
  | 'Superior central'
  | 'Superior direito'
  | 'Centro esquerdo'
  | 'Centro'
  | 'Centro direito'
  | 'Inferior esquerdo'
  | 'Inferior central'
  | 'Inferior direito';

export interface AdParams {
  mainImageBase64: string;
  mainImageMimeType: string;
  inspirationalImageBase64?: string;
  inspirationalImageMimeType?: string;
  outputFormat: OutputFormat;
  adStyle: AdStyle;
  aspectRatio: AspectRatio;
  textPosition: string; // Can be a comma-separated list or 'proporcional'
  visualChanges: string;
  adText: string;
  // New properties for animation and optimization
  animateImage: boolean;
  animationDuration: 5 | 10 | 15;
  displayOptimization: 'Desktop' | 'Celular';
}

declare global {
    interface Window {
        aistudio: AIStudio;
        // Fix: Added SpeechRecognition types to consolidate global declarations from App.tsx.
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export interface AIStudio {
    openSelectKey: () => Promise<void>;
    hasSelectedApiKey: () => Promise<boolean>;
    getHostUrl: () => Promise<string>;
    getModelQuota: (apiKey?: string) => Promise<ModelQuota>;
}

export interface ModelQuota {
    is_free_tier: boolean;
    allowed_model_regions: string[];
    has_quota: boolean;
    metricName: string;
    maxQuota: number;
    remainingQuota: number;
}
