import React, { useState, useEffect, useRef } from 'react';
import {
  AdParams,
  AdStyle,
  AspectRatio,
  TextPosition,
} from './types';
import { generateAdCreative } from './services/geminiService';
import { OptionButton } from './components/OptionButton';
import { GridSelector } from './components/GridSelector';
import { Loader } from './components/Loader';
import { UploadIcon, ImageIcon, MicIcon, StopCircleIcon, SparklesIcon, ImageIconFrame, PaletteIcon, AspectRatioIcon, TextPositionIcon, SlidersIcon, CheckScreenIcon, DownloadIcon } from './components/icons';

// Fix: Add a utility function to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const [mimeInfo, base64] = result.split(',', 2);
            const mimeType = mimeInfo.split(':')[1].split(';')[0];
            resolve({ base64, mimeType });
        };
        reader.onerror = (error) => reject(error);
    });
};

// Fix: Define the main App component
const App: React.FC = () => {
  const [adParams, setAdParams] = useState<Omit<AdParams, 'mainImageBase64' | 'mainImageMimeType' | 'outputFormat'>>({
    adStyle: 'Moderno e minimalista',
    aspectRatio: '1:1',
    textPosition: 'Centro',
    visualChanges: '',
    adText: '',
    displayOptimization: 'Celular',
  });
  const [mainImage, setMainImage] = useState<{ file: File, preview: string } | null>(null);
  const [inspirationalImage, setInspirationalImage] = useState<{ file: File, preview: string } | null>(null);
  const [selectedTextPositions, setSelectedTextPositions] = useState<TextPosition[]>(['Centro']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined') {
        setIsSpeechSupported(true);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            setAdParams(p => ({ ...p, adText: (p.adText || '') + finalTranscript }));
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            let errorMessage = `Erro desconhecido: ${event.error}`;
            if (event.error === 'network') {
                errorMessage = 'Erro de rede ao usar o microfone. Verifique sua conexão.';
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMessage = 'Permissão para usar o microfone negada. Habilite nas configurações do navegador.';
            } else if (event.error === 'no-speech') {
                errorMessage = 'Nenhuma fala detectada. Tente novamente.';
            }
            setSpeechError(errorMessage);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
    }
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setImage: React.Dispatch<React.SetStateAction<{ file: File, preview: string } | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({ file, preview: URL.createObjectURL(file) });
    }
  };

  const handleTextPositionChange = (position: TextPosition) => {
    // Fix: Use 'proporcional' to match the updated AspectRatio type and fix type mismatch.
    if (adParams.aspectRatio === 'proporcional') return;
    
    let newPositions: TextPosition[];
    if (selectedTextPositions.includes(position)) {
      newPositions = selectedTextPositions.filter(p => p !== position);
    } else {
      newPositions = [...selectedTextPositions, position];
    }
    setSelectedTextPositions(newPositions);
    setAdParams({ ...adParams, textPosition: newPositions.join(', ') });
  };
  
  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAdParams(prev => ({...prev, aspectRatio: ratio}));
    // Fix: Use 'proporcional' to match the updated AspectRatio type and fix type mismatch.
    if (ratio === 'proporcional') {
        setSelectedTextPositions([]);
        setAdParams(prev => ({...prev, textPosition: 'proporcional'}));
    } else if (selectedTextPositions.length === 0) {
        const defaultPos = 'Centro';
        setSelectedTextPositions([defaultPos]);
        setAdParams(prev => ({...prev, textPosition: defaultPos}));
    }
  };

  const toggleRecording = () => {
    setSpeechError(null);
    if (!isSpeechSupported) {
        setSpeechError('Reconhecimento de voz não é suportado neste navegador.');
        return;
    }
    if (isRecording) {
        recognitionRef.current?.stop();
    } else {
        recognitionRef.current?.start();
        setIsRecording(true);
    }
  };
  
  const handleSubmit = async () => {
    if (!mainImage) {
      setError('Por favor, adicione uma imagem principal.');
      return;
    }
    
    setError(null);
    setResult(null);
    setIsLoading(true);
    setLoadingMessage('Gerando seu criativo com IA...');

    try {
      const { base64: mainImageBase64, mimeType: mainImageMimeType } = await fileToBase64(mainImage.file);
      let inspirationalImagePayload: { base64: string, mimeType: string } | undefined;
      if (inspirationalImage) {
        inspirationalImagePayload = await fileToBase64(inspirationalImage.file);
      }
      
      const fullParams: AdParams = {
        ...adParams,
        outputFormat: 'Imagem',
        mainImageBase64,
        mainImageMimeType,
        inspirationalImageBase64: inspirationalImagePayload?.base64,
        inspirationalImageMimeType: inspirationalImagePayload?.mimeType,
      };

      // Fix: Call generateAdCreative without apiKey as it now uses environment variables.
      const generatedResult = await generateAdCreative(fullParams);
      setResult(generatedResult);
    } catch (e: any) {
        console.error(e);
        setError(`Ocorreu um erro: ${e.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    const mimeType = result.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `anuncio-gerado.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFileUploader = (
      id: string,
      label: string,
      image: { file: File; preview: string } | null,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
      onClear: () => void
  ) => (
      <div>
          <label htmlFor={id} className="block text-sm font-medium text-brand-text-primary mb-2">{label}</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-blue/30 border-dashed rounded-md hover:border-brand-pink transition-all bg-white/5 backdrop-blur-sm">
              <div className="space-y-1 text-center">
                  {image ? (
                      <div>
                        <img src={image.preview} alt="Preview" className="mx-auto h-24 w-auto object-contain rounded-md"/>
                        <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300 mt-2">Remover</button>
                      </div>
                  ) : (
                      <>
                        <UploadIcon className="mx-auto h-12 w-12 text-brand-text-secondary"/>
                        <div className="flex text-sm text-brand-text-secondary">
                            <label htmlFor={id} className="relative cursor-pointer bg-transparent rounded-md font-medium text-brand-pink hover:text-opacity-80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-brand-bg focus-within:ring-brand-pink">
                                <span>Carregar um arquivo</span>
                                <input id={id} name={id} type="file" className="sr-only" onChange={onChange} accept="image/*"/>
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-brand-text-tertiary">PNG, JPG, GIF até 10MB</p>
                      </>
                  )}
              </div>
          </div>
      </div>
  );

  const renderSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
      <div className="bg-brand-card p-6 rounded-xl shadow-lg relative overflow-hidden backdrop-blur-sm border border-brand-blue/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-pink via-purple-500 to-brand-blue opacity-80 filter blur-sm"></div>
          <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center gap-3">
            {icon}
            <span>{title}</span>
          </h2>
          {children}
      </div>
  );

  const renderOptionGroup = (label: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div className="space-y-3">
        <label className="block text-sm font-medium text-brand-text-primary flex items-center gap-2">
            {icon}
            {label}
        </label>
        <div className="grid grid-cols-2 gap-2">
            {children}
        </div>
    </div>
  )

  return (
    <div className="bg-brand-bg min-h-screen text-brand-text-primary p-4 sm:p-8 font-sans">
        {isLoading && <Loader message={loadingMessage} />}
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
                {/* Inputs */}
                {renderSection('Imagens e Referências', <ImageIconFrame className="w-6 h-6 text-brand-pink"/>, (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderFileUploader('main-image', 'Imagem Principal (Obrigatório)', mainImage, (e) => handleFileChange(e, setMainImage), () => setMainImage(null))}
                        {renderFileUploader('inspirational-image', 'Imagem de Inspiração (Opcional)', inspirationalImage, (e) => handleFileChange(e, setInspirationalImage), () => setInspirationalImage(null))}
                    </div>
                ))}
                
                {renderSection('Estilo e Formato', <AspectRatioIcon className="w-6 h-6 text-brand-blue" />, (
                    <div className="space-y-6">
                        {renderOptionGroup("Estilo do Anúncio", <PaletteIcon className="w-5 h-5 text-brand-pink" />, (
                            <>
                                {(['Moderno e minimalista', 'Criativo e colorido', 'Luxuoso e sofisticado', 'Alta conversão'] as AdStyle[]).map(style => (
                                    <OptionButton key={style} isSelected={adParams.adStyle === style} onClick={() => setAdParams({ ...adParams, adStyle: style })}>{style}</OptionButton>
                                ))}
                            </>
                        ))}

                        {renderOptionGroup("Proporção", <AspectRatioIcon className="w-5 h-5 text-brand-blue" />, (
                             <>
                                {(['1:1', '16:9', '9:16', '4:5', 'proporcional'] as AspectRatio[]).map(ratio => (
                                    <OptionButton key={ratio} isSelected={adParams.aspectRatio === ratio} onClick={() => handleAspectRatioChange(ratio)}>{ratio === 'proporcional' ? 'Proporcional' : ratio}</OptionButton>
                                ))}
                             </>
                         ))}

                         <div>
                            <label className="block text-sm font-medium text-brand-text-primary flex items-center gap-2">
                                <TextPositionIcon className="w-5 h-5 text-green-400" />
                                Posição do Texto
                            </label>
                            <p className="text-xs text-brand-text-secondary my-2">Desabilitado se a proporção for 'Proporcional'.</p>
                            <GridSelector selected={selectedTextPositions} onSelect={handleTextPositionChange} disabled={adParams.aspectRatio === 'proporcional'} />
                         </div>
                    </div>
                ))}

                {renderSection('Conteúdo e Ajustes', <SlidersIcon className="w-6 h-6 text-brand-pink" />, (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="ad-text" className="block text-sm font-medium text-brand-text-primary">Texto do Anúncio (Opcional)</label>
                            <div className="mt-1 relative">
                                <textarea id="ad-text" rows={4}
                                    className="w-full bg-white/5 border-2 border-brand-blue/70 rounded-md p-3 focus:ring-brand-pink focus:border-brand-pink focus:shadow-brand-glow transition-all placeholder:text-brand-text-secondary backdrop-blur-sm"
                                    value={adParams.adText}
                                    onChange={(e) => setAdParams({ ...adParams, adText: e.target.value })}
                                    placeholder="Deixe em branco se não quiser texto na imagem"
                                />
                                <button 
                                  onClick={toggleRecording} 
                                  className={`absolute bottom-2 right-2 p-2 rounded-full bg-brand-pink hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'shadow-brand-glow-pink animate-pulse' : ''}`}
                                  aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
                                  disabled={!isSpeechSupported}
                                  title={!isSpeechSupported ? 'Reconhecimento de voz não suportado' : (isRecording ? 'Parar gravação' : 'Iniciar gravação')}
                                >
                                    <MicIcon className="h-5 w-5 text-white"/>
                                </button>
                            </div>
                            {speechError && <p className="text-xs text-red-400 mt-2">{speechError}</p>}
                        </div>
                        <div>
                            <label htmlFor="visual-changes" className="block text-sm font-medium text-brand-text-primary">Alterações Visuais</label>
                            <p className="text-xs text-brand-text-secondary mb-2">Ex: "fundo de praia", "cor do produto para azul"</p>
                            <textarea id="visual-changes" rows={3}
                                className="w-full bg-white/5 border-2 border-brand-blue/70 rounded-md p-3 focus:ring-brand-pink focus:border-brand-pink focus:shadow-brand-glow transition-all placeholder:text-brand-text-secondary backdrop-blur-sm"
                                value={adParams.visualChanges}
                                onChange={(e) => setAdParams({ ...adParams, visualChanges: e.target.value })}
                                placeholder="Ex: 'mude o fundo para uma praia', 'adicione um efeito de neon', etc."
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Output */}
            <div className="sticky top-8 self-start">
                {renderSection('Resultado Final', <CheckScreenIcon className="w-6 h-6 text-brand-pink" />, (
                    <div className="aspect-[1/1] bg-black/30 rounded-lg flex items-center justify-center border-2 border-brand-blue/20">
                        {result ? (
                            <img src={result} alt="Anúncio gerado" className="max-h-full max-w-full object-contain"/>
                        ) : (
                            <div className="text-center text-brand-text-secondary">
                                <ImageIcon className="mx-auto h-16 w-16"/>
                                <p className="mt-2">Seu anúncio aparecerá aqui</p>
                            </div>
                        )}
                    </div>
                ))}
                {error && <p className="mt-4 text-center text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">{error}</p>}
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-4">
                     <button
                        onClick={handleSubmit}
                        disabled={isLoading || !mainImage}
                        className="w-full bg-brand-pink text-white font-bold py-4 px-4 rounded-lg text-lg hover:bg-opacity-80 transition-all duration-200 disabled:bg-brand-pink/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-pink/30 hover:shadow-brand-glow-pink"
                    >
                        <SparklesIcon className="h-6 w-6"/>
                        {isLoading ? 'Gerando...' : 'Gerar Anúncio'}
                    </button>
                    {result && !isLoading && (
                        <button
                            onClick={handleDownload}
                            className="w-full bg-white/5 backdrop-blur-sm border-2 border-brand-blue/70 hover:border-brand-blue text-brand-text-primary hover:shadow-brand-glow font-bold py-4 px-4 rounded-lg text-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <DownloadIcon className="h-5 w-5 text-brand-blue"/>
                            Baixar Imagem
                        </button>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};

export default App;