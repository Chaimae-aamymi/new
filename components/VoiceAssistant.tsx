
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Language, FoodItem } from '../types';
import { translations } from '../translations';

interface VoiceAssistantProps {
  lang: Language;
  activeItems: FoodItem[];
  themeAccentClass: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ lang, activeItems, themeAccentClass }) => {
  const t = translations[lang];
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decodeBase64 = (base64: string) => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error("Base64 decode failed", e);
      return new Uint8Array(0);
    }
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    if (!data || data.length === 0) return ctx.createBuffer(1, 1, 24000);
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const validItems = (activeItems || []).filter(i => i && i.name);
      const systemInstruction = `Tu es un chef expert anti-gaspillage. Tu aides les familles à cuisiner avec ce qu'ils ont.
      Inventaire actuel du frigo : ${validItems.map(i => i.name).join(', ')}.
      Ta voix doit être chaleureuse et encourageante. Parle exclusivement en ${lang}.`;

      sessionRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputContext.createMediaStreamSource(stream);
            const processor = inputContext.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              let binary = '';
              const bytes = new Uint8Array(int16.buffer);
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
              
              sessionRef.current.sendRealtimeInput({ 
                media: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' } 
              });
            };
            source.connect(processor);
            processor.connect(inputContext.destination);
          },
          onmessage: async (msg) => {
            const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioBase64 && audioContextRef.current) {
              setIsSpeaking(true);
              const decoded = decodeBase64(audioBase64);
              if (decoded.length > 0) {
                const audioBuffer = await decodeAudioData(decoded, audioContextRef.current);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                
                const startAt = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                source.start(startAt);
                nextStartTimeRef.current = startAt + audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                };
              }
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => { console.error(e); setIsActive(false); }
        }
      });
    } catch (err) {
      console.error("Failed to start session", err);
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
    }
    setIsActive(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-8 animate-in zoom-in duration-500">
      <div className={`w-40 h-40 rounded-full flex items-center justify-center relative ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
        {isActive && (
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
        )}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl text-white shadow-2xl transition-all duration-500 ${isActive ? (isSpeaking ? 'bg-emerald-400 scale-110' : 'bg-emerald-600 scale-100') : 'bg-slate-400'}`}>
           <i className={`fa-solid ${isActive ? 'fa-microphone-lines' : 'fa-microphone-slash'}`}></i>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t.assistantTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {t.assistantDesc}
        </p>
      </div>

      <div className="flex gap-4">
        {!isActive ? (
          <button 
            onClick={startSession}
            className={`px-10 py-5 rounded-[2rem] text-white font-black shadow-xl transition-all transform hover:scale-105 active:scale-95 ${themeAccentClass}`}
          >
            {t.assistantStart}
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="px-10 py-5 rounded-[2rem] bg-red-500 text-white font-black shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            {t.assistantStop}
          </button>
        )}
      </div>

      {isActive && (
        <div className="flex items-center gap-1.5 h-12">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 bg-emerald-500 rounded-full transition-all duration-150 ${isSpeaking ? 'animate-bounce' : 'h-2'}`}
              style={{ 
                height: isSpeaking ? `${Math.random() * 40 + 10}px` : '8px',
                animationDelay: `${i * 0.1}s` 
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
