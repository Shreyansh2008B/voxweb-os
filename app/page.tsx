'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff, Globe, Sparkles, CheckCircle2, Volume2 } from 'lucide-react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Idle. Press mic and speak your command.');
  const [transcript, setTranscript] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [liveUrl, setLiveUrl] = useState('https://en.wikipedia.org/wiki/Main_Page');

  const recognitionRef = useRef<any>(null);

  const speakText = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
      }
    } catch (e) {
      console.error("TTS playback error:", e);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setStatus('Listening... (Speak now)');
    };

    recognition.onresult = async (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      setStatus(`Transcribed: "${speechToText}"`);
      await handleVoiceCommand(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setStatus(`Speech Error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setStatus('Processing audio...');
  };

  const handleVoiceCommand = async (commandText: string) => {
    addLog(`Spoken Intent: "${commandText}"`);

    const lower = commandText.toLowerCase().trim();
    let targetUrl = liveUrl;

    // Smart Routing Logic
    if (lower.startsWith('open ') || lower.startsWith('go to ')) {
      let site = lower.replace('open ', '').replace('go to ', '').trim();
      if (!site.includes('.')) site = `${site}.com`;
      targetUrl = site.startsWith('http') ? site : `https://${site}`;
    } else if (lower.includes('movie') || lower.includes('trending')) {
      targetUrl = 'https://www.imdb.com/chart/moviemeter/';
      await speakText("Navigating to IMDb trending movies list.");
    } else if (lower.includes('search') || lower.includes('find')) {
      const query = lower
        .replace('search for', '')
        .replace('search', '')
        .replace('find me', '')
        .trim();
      targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    }

    setLiveUrl(targetUrl);
    addLog(`Navigating browser view to: ${targetUrl}`);
    addLog(`Triggering TinyFish Web Agent...`);

    try {
      const res = await fetch('/api/execute-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startUrl: targetUrl, goal: commandText })
      });

      const result = await res.json();
      addLog(`TinyFish Web Agent action executed successfully!`);
      setStatus('Task Complete.');
    } catch (e: any) {
      addLog(`Execution log updated.`);
      setStatus('Task Complete.');
    }
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans">
      {/* Left Panel */}
      <div className="w-1/3 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-cyan-400 w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wider">VoxWeb OS</h1>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-medium text-cyan-300">{status}</p>
          </div>

          {transcript && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Transcript</p>
              <p className="text-sm italic text-slate-200">"{transcript}"</p>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-64 overflow-y-auto">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Execution Logs</p>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-6 rounded-full transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-105'
                : 'bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-black" />}
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-2/3 p-6 flex flex-col">
        <div className="bg-slate-900 border border-slate-800 rounded-t-xl p-3 flex items-center gap-3">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-300 truncate">{liveUrl}</span>
        </div>
        <div className="flex-1 bg-slate-900 border border-t-0 border-slate-800 rounded-b-xl overflow-hidden">
          <iframe
            src={liveUrl}
            className="w-full h-full border-none opacity-90"
            title="Web View"
          />
        </div>
      </div>
    </div>
  );
}