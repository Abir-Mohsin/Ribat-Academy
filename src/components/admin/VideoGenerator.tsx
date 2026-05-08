import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Wand2, 
  Loader2, 
  Download, 
  AlertCircle, 
  CheckCircle,
  Play,
  Monitor,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { Button } from '@/src/components/Button';
import { cn } from '@/src/lib/utils';
import { generatePromoVideo, getOperationStatus, fetchVideoBlob } from '@/src/lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

const RESOLUTIONS = [
  { id: '720p', name: '720p (HD)', icon: Monitor },
  { id: '1080p', name: '1080p (Full HD)', icon: Monitor },
];

const ASPECT_RATIOS = [
  { id: '16:9', name: 'Landscape (16:9)', icon: Monitor },
  { id: '9:16', name: 'Portrait (9:16)', icon: Smartphone },
];

const LOADING_MESSAGES = [
  "রিবাত একাডেমির জন্য ভিডিও স্ক্রিপ্ট তৈরি হচ্ছে...",
  "AI মডেল আপনার ভিডিওর দৃশ্যগুলো আঁকছে...",
  "আলো এবং আবহাওয়া সমন্বয় করা হচ্ছে...",
  "সবকিছু প্রসেস করে চূড়ান্ত রূপ দেওয়া হচ্ছে...",
  "প্রায় শেষ! রিবাত একাডেমির নতুন প্রোমো ভিডিওটি তৈরি হচ্ছে...",
];

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [operationData, setOperationData] = useState<any>(null);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 5000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    
    try {
      // Check for API key access
      const apiStudio = (window as any).aistudio;
      if (typeof window !== 'undefined' && apiStudio) {
        const hasKey = await apiStudio.hasSelectedApiKey();
        if (!hasKey) {
          await apiStudio.openSelectKey();
          // Skill says assume success after opening
        }
      }

      let operation = await generatePromoVideo(prompt, { resolution, aspectRatio });
      setOperationData(operation);
      
      // Polling
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await getOperationStatus(operation);
        setOperationData(operation);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const blob = await fetchVideoBlob(downloadLink);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } else {
        setError("ভিডিও জেনারেট করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("API Key পাওয়া যায়নি। অনুগ্রহ করে সঠিক কি সিলেক্ট করুন।");
        const apiStudio = (window as any).aistudio;
        if (typeof window !== 'undefined' && apiStudio) {
          await apiStudio.openSelectKey();
        }
      } else {
        setError("একটি ত্রুটি ঘটেছে: " + (err.message || String(err)));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `ribat-promo-${Date.now()}.mp4`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-[#0EA5E9]" />
              Video Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTIONS.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setResolution(res.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all",
                        resolution === res.id 
                          ? "bg-blue-50 border-blue-200 text-blue-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                      )}
                    >
                      <res.icon size={18} className="mb-2" />
                      <span className="text-[10px] font-bold">{res.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all",
                        aspectRatio === ratio.id 
                          ? "bg-blue-50 border-blue-200 text-blue-700" 
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                      )}
                    >
                      <ratio.icon size={18} className="mb-2" />
                      <span className="text-[10px] font-bold">{ratio.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-2">
              <AlertCircle size={16} />
              Tips for Best Results
            </h4>
            <ul className="text-xs text-blue-700 space-y-2 opacity-80 list-disc pl-4">
              <li>বিস্ময়কর বা সিনেম্যাটিক লাইটিং-এর কথা উল্লেখ করুন।</li>
              <li>আবির্ভাবের দৃশ্য বা ট্রানজিশন বর্ণনা করুন।</li>
              <li>রিবাত একাডেমির লোগো বা থিম কালার মাথায় রাখুন।</li>
              <li>ভিডিও জেনারেট হতে কয়েক মিনিট সময় লাগতে পারে।</li>
            </ul>
          </div>
        </div>

        {/* Prompt & Player Panel */}
        <div className="lg:col-span-2 space-y-6 text-sans">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold mb-4">Create Promotion Video</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="যেকোনো একটি রিয়্যালিস্টিক ভিডিও প্রোমো এর ধারণা লিখুন - যেমন: 'Cinematic wide shot of a student happily studying an ancient Arabic manuscript in a modern Islamic library, soft golden hour lighting, high quality...'"
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm resize-none"
            />
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Generate with Veo
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className={cn(
            "bg-black rounded-2xl overflow-hidden shadow-xl aspect-video relative flex items-center justify-center border-4 border-white",
            aspectRatio === '9:16' && "aspect-[9/16] max-w-sm mx-auto"
          )}>
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center p-10 text-center text-white bg-black/60 backdrop-blur-sm"
                >
                  <div className="relative mb-8">
                     <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                     <Video className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={32} />
                  </div>
                  <p className="text-lg font-bold mb-2">Generating Your Video</p>
                  <p className="text-sm text-gray-400 h-10">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                </motion.div>
              ) : videoUrl ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full"
                >
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={handleDownload}
                      className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
                      title="Download Video"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </motion.div>
              ) : error ? (
                <div className="text-center p-10">
                   <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                   <p className="text-white font-bold mb-2">Error Occurred</p>
                   <p className="text-gray-400 text-sm max-w-xs mx-auto">{error}</p>
                   <Button variant="ghost" onClick={handleGenerate} className="mt-4 text-white hover:bg-white/10">Try Again</Button>
                </div>
              ) : (
                <div className="text-center p-10 text-gray-400">
                   <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Play size={40} className="text-gray-600" />
                   </div>
                   <p className="text-lg font-medium">Video Preview Area</p>
                   <p className="text-sm opacity-60">Configure settings and write a prompt to start</p>
                </div>
              )}
            </AnimatePresence>
            
            {/* Branding Overlay (Visual Only) */}
            <div className="absolute bottom-4 left-6 z-20 pointer-events-none opacity-40">
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-black font-bold text-[10px]">R</div>
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">Ribat Academy AI</span>
               </div>
            </div>
          </div>

          {videoUrl && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-sm text-green-700 font-medium">পাবলিশ করার জন্য ভিডিওটি এখন প্রস্তুত!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
