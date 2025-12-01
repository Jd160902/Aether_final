import React, { useState, useCallback, useEffect } from 'react';
import { analyzeReflectionEntry } from '../services/geminiService';
import { getReflectionEntries, saveReflectionEntries } from '../services/db';
import type { ReflectionEntry, Mood } from '../types';
import { MOODS } from '../constants';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { ReflectionsIcon } from './common/Icons';

interface ReflectionsProps {
  userId: string;
}

const Reflections: React.FC<ReflectionsProps> = ({ userId }) => {
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [currentText, setCurrentText] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingEntries, setIsFetchingEntries] = useState<boolean>(true);
  const [selectedEntry, setSelectedEntry] = useState<ReflectionEntry | null>(null);

  useEffect(() => {
    const loadEntries = async () => {
      setIsFetchingEntries(true);
      const userEntries = await getReflectionEntries(userId);
      setEntries(userEntries);
      if (userEntries.length > 0) {
        setSelectedEntry(userEntries[0]);
      }
      setIsFetchingEntries(false);
    };
    loadEntries();
  }, [userId]);

  const handleAnalysis = useCallback(async () => {
    if (!currentText.trim()) return;
    setIsLoading(true);
    const analysis = await analyzeReflectionEntry(currentText, userId);
    const newEntry: ReflectionEntry = {
      id: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      text: currentText,
      analysis: analysis,
      mood: selectedMood || undefined,
    };
    const updatedEntries = [newEntry, ...entries];
    await saveReflectionEntries(userId, updatedEntries);
    setEntries(updatedEntries);
    setSelectedEntry(newEntry);
    setCurrentText('');
    setSelectedMood(null);
    setIsLoading(false);
  }, [currentText, entries, userId, selectedMood]);
  
  const formattedAnalysis = selectedEntry?.analysis?.replace(/\n/g, '<br />');

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">How are you feeling today?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Let your thoughts flow. When you're ready, Aether can help you find deeper insights.</p>
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Write about your day, your feelings, your thoughts..."
            className="w-full h-40 p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 dark:placeholder-slate-400 transition"
            disabled={isLoading}
          />
          <div className="mt-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Select a mood (optional)</p>
              <div className="flex space-x-2">
                {MOODS.map(mood => (
                    <button 
                        key={mood.name}
                        onClick={() => setSelectedMood(mood.name)}
                        className={`text-2xl p-2 rounded-full transition-all duration-200 ${selectedMood === mood.name ? 'ring-2 ring-calm-blue-500 ring-offset-2 dark:ring-offset-slate-800' : 'hover:scale-110'}`}
                        title={mood.name}
                    >
                        {mood.icon}
                    </button>
                ))}
              </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAnalysis} disabled={isLoading || !currentText.trim()}>
              {isLoading ? <Spinner /> : 'Save & Analyze'}
            </Button>
          </div>
        </div>
      </Card>
      
      {isFetchingEntries ? (
        <div className="flex justify-center items-center h-40"><Spinner /></div>
      ) : entries.length > 0 ? (
        <>
          {selectedEntry && (
             <Card>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-calm-blue-800 dark:text-calm-blue-300">
                      {selectedEntry.date}
                    </h3>
                  </div>
                  {selectedEntry.mood && (
                    <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-xl">{MOODS.find(m => m.name === selectedEntry.mood)?.icon}</span>
                      <span className="font-medium capitalize">{selectedEntry.mood}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Your Entry</h4>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedEntry.text}</p>
                </div>
                
                {selectedEntry.analysis && (
                  <>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">Aether's Insight</h4>
                      <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formattedAnalysis || '' }} />
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mt-8 mb-4">Past Reflections</h3>
            {entries.map(entry => (
                <div key={entry.id} className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition border-2 flex items-center space-x-4 ${selectedEntry?.id === entry.id ? 'border-calm-blue-500 dark:border-calm-blue-500' : 'border-transparent dark:border-slate-700'}`} onClick={() => setSelectedEntry(entry)}>
                    <div className="text-2xl">
                        {entry.mood ? MOODS.find(m => m.name === entry.mood)?.icon : '🗒️'}
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{entry.date}</p>
                        <p className="text-slate-500 dark:text-slate-400 truncate">{entry.text}</p>
                    </div>
                </div>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 bg-calm-blue-100 dark:bg-slate-700 rounded-full text-calm-blue-600 dark:text-calm-blue-300">
                <ReflectionsIcon />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-calm-blue-800 dark:text-calm-blue-300">Your Reflections Await</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Use the space above to write your first reflection and begin your journey of self-discovery.</p>
          </div>
        </Card>
      )}

    </div>
  );
};

export default Reflections;