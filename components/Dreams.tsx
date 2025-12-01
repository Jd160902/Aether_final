

import React, { useState, useCallback, useEffect } from 'react';
import { getAspirationInspiration, visualizeAspiration } from '../services/geminiService';
import { getAspirations, saveAspirations } from '../services/db';
import type { Aspiration } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { DreamIcon } from './common/Icons';

interface AspirationsProps {
  userId: string;
}

const Aspirations: React.FC<AspirationsProps> = ({ userId }) => {
  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [currentAspiration, setCurrentAspiration] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [activeInspiration, setActiveInspiration] = useState<string | null>(null);
  const [isVisualizingId, setIsVisualizingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAspirations = async () => {
      setIsFetching(true);
      const userAspirations = await getAspirations(userId);
      setAspirations(userAspirations);
      if (userAspirations.length > 0) {
        setActiveInspiration(userAspirations[0].inspiration || null);
      }
      setIsFetching(false);
    };
    loadAspirations();
  }, [userId]);

  const handleSaveAndInspire = useCallback(async () => {
    if (!currentAspiration.trim()) return;
    setIsLoading(true);
    const inspiration = await getAspirationInspiration(currentAspiration, userId);
    const newAspiration: Aspiration = {
      id: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      text: currentAspiration,
      inspiration,
    };
    const updatedAspirations = [newAspiration, ...aspirations];
    await saveAspirations(userId, updatedAspirations);
    setAspirations(updatedAspirations);
    setActiveInspiration(inspiration);
    setCurrentAspiration('');
    setIsLoading(false);
  }, [currentAspiration, aspirations, userId]);

  const handleVisualize = useCallback(async (aspiration: Aspiration) => {
    setIsVisualizingId(aspiration.id);
    setError(null);
    try {
      // Fix: The `visualizeAspiration` function only takes one argument.
      const base64ImageBytes = await visualizeAspiration(aspiration.text);
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      
      const updatedAspirations = aspirations.map(a => 
        a.id === aspiration.id ? { ...a, imageUrl } : a
      );
      setAspirations(updatedAspirations);
      await saveAspirations(userId, updatedAspirations);

    } catch (err) {
      setError((err as Error).message || "An unknown error occurred.");
    } finally {
      setIsVisualizingId(null);
    }
  }, [aspirations, userId]);
  
  const formattedInspiration = activeInspiration?.replace(/\n/g, '<br />');

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">What are your aspirations?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Capture your biggest dreams and goals. Aether will provide a spark of inspiration and a visual representation.</p>
          <textarea
            value={currentAspiration}
            onChange={(e) => setCurrentAspiration(e.target.value)}
            placeholder="e.g., Write a novel, travel the world, learn to play the guitar..."
            className="w-full h-40 p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 dark:placeholder-slate-400 transition"
            disabled={isLoading}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveAndInspire} disabled={isLoading || !currentAspiration.trim()}>
              {isLoading ? <Spinner /> : 'Save & Inspire Me'}
            </Button>
          </div>
        </div>
      </Card>
      
      {isFetching ? (
        <div className="flex justify-center items-center h-40"><Spinner /></div>
      ) : aspirations.length > 0 ? (
        <>
          {activeInspiration && (
            <Card>
              <div className="p-6 bg-calm-blue-100/50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">A Spark of Inspiration</h3>
                <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formattedInspiration || '' }} />
              </div>
            </Card>
          )}

          <div className="space-y-4">
              <h3 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mt-8 mb-4">Your Aspirations</h3>
              {error && <div role="alert" className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded mb-4"><p>{error}</p></div>}
              {aspirations.map(aspiration => (
                <Card key={aspiration.id} className="p-4" >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {aspiration.imageUrl ? (
                        <img src={aspiration.imageUrl} alt={aspiration.text} className="w-full sm:w-32 h-32 object-cover rounded-lg flex-shrink-0" />
                    ) : isVisualizingId === aspiration.id && (
                        <div className="w-full sm:w-32 h-32 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                            <Spinner />
                        </div>
                    )}
                    <div className="flex-grow">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 cursor-pointer" onClick={() => setActiveInspiration(aspiration.inspiration || null)}>{aspiration.text}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{aspiration.date}</p>
                        <div className="mt-3">
                            <Button 
                                onClick={() => handleVisualize(aspiration)} 
                                disabled={isVisualizingId !== null}
                                variant="secondary"
                                className="text-xs px-3 py-1"
                            >
                                {isVisualizingId === aspiration.id ? 'Visualizing...' : aspiration.imageUrl ? '🎨 Re-visualize' : '🎨 Visualize'}
                            </Button>
                        </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 bg-calm-blue-100 dark:bg-slate-700 rounded-full text-calm-blue-600 dark:text-calm-blue-300">
                <DreamIcon />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-calm-blue-800 dark:text-calm-blue-300">Your Aspirations Canvas is Blank</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">What is a dream you hold for your future? Add it above to begin.</p>
          </div>
        </Card>
      )}

    </div>
  );
};

export default Aspirations;