export type OutputFormat = 'Imagem';
export type AdStyle = 'Moderno e minimalista' | 'Criativo e colorido' | 'Luxuoso e sofisticado' | 'Alta conversão';
// Fix: Use 'proporcional' to match Portuguese localization and fix type mismatch.
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | 'proporcional';
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
  displayOptimization: 'Desktop' | 'Celular';
}

declare global {
    interface Window {
        // Fix: Added SpeechRecognition types to consolidate global declarations from App.tsx.
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}