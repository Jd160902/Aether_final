
import React, { useState, useCallback } from 'react';
import { getGeneralAdvice } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';

interface AdviceProps {
  userId: string;
}

const Advice: React.FC<AdviceProps> = ({ userId }) => {
  const [problem, setProblem] = useState<string>('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRequestAdvice = useCallback(async () => {
    if (!problem.trim()) return;
    setIsLoading(true);
    setAdvice(null);
    const result = await getGeneralAdvice(problem, userId);
    setAdvice(result);
    setIsLoading(false);
  }, [problem, userId]);
  
  const formattedAdvice = advice?.replace(/\n/g, '<br />');

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">Seeking Guidance?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Describe a situation or challenge you're facing. Aether is here to listen and offer a thoughtful perspective.</p>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="What's on your mind? Feel free to share as much or as little as you'd like..."
            className="w-full h-40 p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 dark:placeholder-slate-400 transition"
            disabled={isLoading}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleRequestAdvice} disabled={isLoading || !problem.trim()}>
              {isLoading ? <Spinner /> : 'Get Advice'}
            </Button>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card>
            <div className="flex justify-center items-center h-24"><Spinner /></div>
        </Card>
      )}

      {advice && !isLoading && (
        <Card>
          <div className="p-6 bg-calm-blue-100/50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">Aether's Perspective</h3>
            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formattedAdvice || '' }} />
          </div>
        </Card>
      )}
    </div>
  );
};

export default Advice;
