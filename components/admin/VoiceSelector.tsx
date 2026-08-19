'use client';

import React, { useState } from 'react';
import type { GeminiVoice } from '@/types';
import { Volume2, Play, Square, Sparkles, Check } from 'lucide-react';

interface VoiceOption {
  id: GeminiVoice;
  name: string;
  gender: 'Female' | 'Male';
  toneDesc: string;
  recommendedFor: string;
  sampleText: string;
  pitch: number;
  rate: number;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    toneDesc: 'Warm, natural, and friendly',
    recommendedFor: 'Luxury residences & villas (Recommended)',
    sampleText: 'Hello! I am Aoede, your virtual real estate advisor. Let me guide you through the property specifications and 7-year installment plans.',
    pitch: 1.1,
    rate: 0.95,
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    toneDesc: 'Clear, elegant, and professional',
    recommendedFor: 'Commercial towers & modern apartments',
    sampleText: 'Welcome to the virtual tour. I am Kore. Feel free to ask about unit pricing, delivery schedules, and smart home features.',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    toneDesc: 'Friendly, youthful, and upbeat',
    recommendedFor: 'Modern urban communities & studios',
    sampleText: 'Hey there! I am Puck. Looking for a high-ROI studio or a 2-bedroom with pool views? I can calculate the downpayment right now.',
    pitch: 1.05,
    rate: 1.05,
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    toneDesc: 'Deep, authoritative, and confident',
    recommendedFor: 'High-end penthouses & executive estates',
    sampleText: 'Good day. I am Charon. I can provide detailed financial structures and private floor availability for your investment.',
    pitch: 0.75,
    rate: 0.9,
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    toneDesc: 'Energetic, articulate, and persuasive',
    recommendedFor: 'Fast-paced sales & launch campaigns',
    sampleText: 'Welcome! I am Fenrir. We have exclusive 7-year installment opportunities with only 10% downpayment today.',
    pitch: 0.9,
    rate: 1.05,
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    toneDesc: 'Calm, soothing, and consultative',
    recommendedFor: 'Resort & coastal beachfront properties',
    sampleText: 'Welcome to this serene virtual tour. I am Zephyr, here to assist you with every detail of your future dream home.',
    pitch: 1.15,
    rate: 0.88,
  },
];

interface VoiceSelectorProps {
  value: GeminiVoice;
  onChange: (voice: GeminiVoice) => void;
}

export default function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  const [playingVoice, setPlayingVoice] = useState<GeminiVoice | null>(null);

  const playVoiceSample = (option: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing this voice, stop it
    if (playingVoice === option.id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingVoice(null);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(option.sampleText);
      utterance.pitch = option.pitch;
      utterance.rate = option.rate;

      // Try to find a matching natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (option.gender === 'Female' ? v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Zira') : v.name.includes('Male') || v.name.includes('David') || v.name.includes('Guy'))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => setPlayingVoice(option.id);
      utterance.onend = () => setPlayingVoice(null);
      utterance.onerror = () => setPlayingVoice(null);

      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Voice Sample for ${option.name}: "${option.sampleText}"`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          AI Agent Voice (Gemini Multimodal Live)
        </label>
        <span className="text-xs text-white/40">Click Play to listen test</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {VOICE_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          const isPlaying = playingVoice === option.id;

          return (
            <div
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-indigo-500/15 border-2 border-indigo-400 shadow-lg shadow-indigo-500/10'
                  : 'bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              {/* Top Row: Name & Tag */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{option.name}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        option.gender === 'Female'
                          ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {option.gender}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">{option.toneDesc}</p>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Recommendation */}
              <p className="text-[11px] text-white/40 leading-relaxed">
                🎯 {option.recommendedFor}
              </p>

              {/* Listen Test Audio Button */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => playVoiceSample(option, e)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isPlaying
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" /> Listen Test
                    </>
                  )}
                </button>

                {isPlaying && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-4 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
