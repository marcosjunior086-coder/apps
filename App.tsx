
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
import { UploadIcon, ImageIcon, MicIcon, StopCircleIcon, SparklesIcon } from './components/icons';

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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            setAdParams(p => ({ ...p, adText: p.adText + finalTranscript }));
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };
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
    if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
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

  const renderFileUploader = (
      id: string,
      label: string,
      image: { file: File; preview: string } | null,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
      onClear: () => void
  ) => (
      <div>
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-indigo-500 transition-colors">
              <div className="space-y-1 text-center">
                  {image ? (
                      <div>
                        <img src={image.preview} alt="Preview" className="mx-auto h-24 w-auto object-contain rounded-md"/>
                        <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300 mt-2">Remover</button>
                      </div>
                  ) : (
                      <>
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-500"/>
                        <div className="flex text-sm text-gray-400">
                            <label htmlFor={id} className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500">
                                <span>Carregar um arquivo</span>
                                <input id={id} name={id} type="file" className="sr-only" onChange={onChange} accept="image/*"/>
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                      </>
                  )}
              </div>
          </div>
      </div>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
          {children}
      </div>
  );

  const renderOptionGroup = (label: string, children: React.ReactNode) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <div className="grid grid-cols-2 gap-2">
            {children}
        </div>
    </div>
  )

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8 font-sans">
        {isLoading && <Loader message={loadingMessage} />}
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
                {/* Inputs */}
                {renderSection('1. Imagens de Referência', (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderFileUploader('main-image', 'Imagem Principal (Obrigatório)', mainImage, (e) => handleFileChange(e, setMainImage), () => setMainImage(null))}
                        {renderFileUploader('inspirational-image', 'Imagem de Inspiração (Opcional)', inspirationalImage, (e) => handleFileChange(e, setInspirationalImage), () => setInspirationalImage(null))}
                    </div>
                ))}
                
                {renderSection('2. Definições do Anúncio', (
                    <div className="space-y-6">
                        {renderOptionGroup("Estilo do Anúncio", (
                            <>
                                {(['Moderno e minimalista', 'Criativo e colorido', 'Luxuoso e sofisticado', 'Alta conversão'] as AdStyle[]).map(style => (
                                    <OptionButton key={style} isSelected={adParams.adStyle === style} onClick={() => setAdParams({ ...adParams, adStyle: style })}>{style}</OptionButton>
                                ))}
                            </>
                        ))}

                        {renderOptionGroup("Proporção", (
                             <>
                                {/* Fix: Use 'proporcional' to match the updated AspectRatio type and fix type mismatch. */}
                                {(['1:1', '16:9', '9:16', '4:5', 'proporcional'] as AspectRatio[]).map(ratio => (
                                    <OptionButton key={ratio} isSelected={adParams.aspectRatio === ratio} onClick={() => handleAspectRatioChange(ratio)}>{ratio === 'proporcional' ? 'Proporcional' : ratio}</OptionButton>
                                ))}
                             </>
                         ))}

                         <div>
                            <label className="block text-sm font-medium text-gray-300">Posição do Texto</label>
                            <p className="text-xs text-gray-400 mb-2">Desabilitado se a proporção for 'Proporcional'.</p>
                            <GridSelector selected={selectedTextPositions} onSelect={handleTextPositionChange} disabled={adParams.aspectRatio === 'proporcional'} />
                         </div>
                    </div>
                ))}

                {renderSection('3. Conteúdo e Ajustes', (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="ad-text" className="block text-sm font-medium text-gray-300">Texto do Anúncio</label>
                            <div className="mt-1 relative">
                                <textarea id="ad-text" rows={4}
                                    className="w-full bg-gray-700/50 border-2 border-gray-600 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    value={adParams.adText}
                                    onChange={(e) => setAdParams({ ...adParams, adText: e.target.value })}
                                />
                                <button onClick={toggleRecording} className={`absolute bottom-2 right-2 p-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-indigo-600'} hover:opacity-80 transition-opacity`}>
                                    {isRecording ? <StopCircleIcon className="h-5 w-5"/> : <MicIcon className="h-5 w-5"/>}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="visual-changes" className="block text-sm font-medium text-gray-300">Alterações Visuais</label>
                            <p className="text-xs text-gray-400 mb-2">Ex: "fundo de praia", "cor do produto para azul"</p>
                            <input id="visual-changes" type="text"
                                className="w-full bg-gray-700/50 border-2 border-gray-600 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                value={adParams.visualChanges}
                                onChange={(e) => setAdParams({ ...adParams, visualChanges: e.target.value })}
                            />
                        </div>
                    </div>
                ))}

            </div>
            
            {/* Output */}
            <div className="sticky top-8 self-start">
                {renderSection('Resultado', (
                    <div className="aspect-[1/1] bg-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700">
                        {result ? (
                            <img src={result} alt="Anúncio gerado" className="max-h-full max-w-full object-contain"/>
                        ) : (
                            <div className="text-center text-gray-500">
                                <ImageIcon className="mx-auto h-16 w-16"/>
                                <p className="mt-2">Seu anúncio aparecerá aqui</p>
                            </div>
                        )}
                    </div>
                ))}
                {error && <p className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !mainImage}
                    className="w-full mt-6 bg-indigo-600 text-white font-bold py-4 px-4 rounded-lg text-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <SparklesIcon className="h-6 w-6"/>
                    {isLoading ? 'Gerando...' : 'Gerar Anúncio'}
                </button>
            </div>
        </main>
    </div>
  );
};

export default App;