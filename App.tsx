import React, { useState } from 'react';
import { LegoScene } from './components/LegoScene';
import { ChatInterface } from './components/ChatInterface';
import { SceneTime, BrickData } from './types';
import { Sun, Moon, Sunset, Box, X } from 'lucide-react';

const App: React.FC = () => {
  const [timeOfDay, setTimeOfDay] = useState<SceneTime>(SceneTime.DAY);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedBrick, setSelectedBrick] = useState<BrickData | null>(null);

  return (
    <div className="relative w-full h-screen bg-stone-900 font-sans">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <LegoScene timeOfDay={timeOfDay} onBrickSelect={setSelectedBrick} />
      </div>

      {/* Overlay UI Layer */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto">
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
            LEGO<sup className="text-lg align-top">®</sup> <span className="text-yellow-400">Great Wall</span>
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium drop-shadow-md max-w-xs">
            Interactive 3D Experiment. <br/> 
            <span className="text-yellow-300">Click any brick</span> to inspect it.
          </p>
        </div>

        {/* Time Controls */}
        <div className="flex gap-2 pointer-events-auto bg-black/30 backdrop-blur-sm p-2 rounded-full border border-white/10 shadow-lg">
          <button
            onClick={() => setTimeOfDay(SceneTime.DAY)}
            className={`p-2 rounded-full transition-colors ${timeOfDay === SceneTime.DAY ? 'bg-white text-yellow-600' : 'text-white hover:bg-white/10'}`}
            title="Day"
          >
            <Sun size={20} />
          </button>
          <button
             onClick={() => setTimeOfDay(SceneTime.SUNSET)}
             className={`p-2 rounded-full transition-colors ${timeOfDay === SceneTime.SUNSET ? 'bg-orange-500 text-white' : 'text-white hover:bg-white/10'}`}
             title="Sunset"
          >
            <Sunset size={20} />
          </button>
          <button
            onClick={() => setTimeOfDay(SceneTime.NIGHT)}
            className={`p-2 rounded-full transition-colors ${timeOfDay === SceneTime.NIGHT ? 'bg-indigo-900 text-indigo-200' : 'text-white hover:bg-white/10'}`}
            title="Night"
          >
            <Moon size={20} />
          </button>
        </div>
      </div>

      {/* Brick Inspector Panel */}
      {selectedBrick && (
        <div className="absolute top-24 left-6 z-20 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-l-4 border-yellow-400 overflow-hidden animate-in slide-in-from-left-10 duration-300">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-yellow-600 font-bold uppercase text-xs tracking-wider">
                <Box size={14} />
                <span>Brick Inspector</span>
              </div>
              <button 
                onClick={() => setSelectedBrick(null)}
                className="text-stone-400 hover:text-stone-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-stone-900 leading-tight mb-1">
              {selectedBrick.name}
            </h3>
            <div className="inline-block px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] rounded-md font-mono mb-3">
              POS: {selectedBrick.position.x}, {selectedBrick.position.y}, {selectedBrick.position.z}
            </div>
            
            <p className="text-stone-600 text-sm leading-relaxed">
              {selectedBrick.description || "A standard high-quality ABS plastic brick used to construct this procedural world."}
            </p>
            
            <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2">
               <div className="w-6 h-6 rounded border border-stone-200 shadow-sm" style={{ backgroundColor: selectedBrick.color }} />
               <span className="text-xs text-stone-400 flex items-center">Color Hex: {selectedBrick.color}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Interface */}
      <ChatInterface 
        timeOfDay={timeOfDay}
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
      />
      
      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/20" />
    </div>
  );
};

export default App;
