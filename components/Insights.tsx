import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Chart } from 'chart.js';
import type { ReflectionEntry, Mood, SentimentAnalysisResult, Goal } from '../types';
import { getReflectionEntries, getGoals } from '../services/db';
import { analyzeReflectionSentiment } from '../services/geminiService';
import { MOODS } from '../constants';
import Card from './common/Card';
import Spinner from './common/Spinner';
import Button from './common/Button';
import { InsightsIcon, GoalIcon } from './common/Icons';

interface InsightsProps {
  userId: string;
  isDarkMode: boolean;
}

const moodToScore: Record<Mood, number> = {
  awful: 1,
  bad: 2,
  meh: 3,
  good: 4,
  rad: 5,
};

const Insights: React.FC<InsightsProps> = ({ userId, isDarkMode }) => {
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Sentiment Analysis
  const [sentimentData, setSentimentData] = useState<SentimentAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Refs for Chart
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [userEntries, userGoals] = await Promise.all([
        getReflectionEntries(userId),
        getGoals(userId),
      ]);
      // Sort entries by date for the line chart
      const sortedEntries = userEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEntries(sortedEntries);
      setGoals(userGoals);
      setIsLoading(false);
    };
    loadData();
  }, [userId]);

  const goalStats = useMemo(() => {
    const totalGoals = goals.length;
    if (totalGoals === 0) return null;
    
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const completionRate = (completedGoals / totalGoals) * 100;
    
    const tagCounts: Record<string, number> = {};
    goals.forEach(goal => {
      goal.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
      
    return {
      totalGoals,
      completedGoals,
      completionRate,
      topTags
    };
  }, [goals]);


  const moodBarData = useMemo(() => {
    const moodCounts: Record<Mood, number> = { rad: 0, good: 0, meh: 0, bad: 0, awful: 0 };
    let totalMoods = 0;
    for (const entry of entries) {
      if (entry.mood) {
        moodCounts[entry.mood]++;
        totalMoods++;
      }
    }
    if (totalMoods === 0) return null;
    const maxCount = Math.max(...Object.values(moodCounts));
    return MOODS.map(moodInfo => ({
      ...moodInfo,
      count: moodCounts[moodInfo.name],
      percentage: maxCount > 0 ? (moodCounts[moodInfo.name] / maxCount) * 100 : 0,
    }));
  }, [entries]);

  const moodLineChartData = useMemo(() => {
    const dataPoints = entries
      .filter(entry => entry.mood)
      .map(entry => ({
        x: new Date(entry.date).getTime(),
        y: moodToScore[entry.mood!],
        mood: entry.mood,
      }));
    return dataPoints;
  }, [entries]);

  // Chart.js effect
  useEffect(() => {
    if (!chartCanvasRef.current || moodLineChartData.length < 2) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, isDarkMode ? 'rgba(2, 132, 199, 0.5)' : 'rgba(14, 165, 233, 0.5)');
    gradient.addColorStop(1, isDarkMode ? 'rgba(2, 132, 199, 0)' : 'rgba(14, 165, 233, 0)');

    chartInstanceRef.current = new (window as any).Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Mood Score',
          data: moodLineChartData,
          fill: true,
          backgroundColor: gradient,
          borderColor: isDarkMode ? '#38bdf8' : '#0284c7',
          tension: 0.3,
          pointBackgroundColor: isDarkMode ? '#38bdf8' : '#0284c7',
          pointBorderColor: '#fff',
          pointHoverRadius: 7,
          pointRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day' },
            grid: { color: isDarkMode ? '#334155' : '#e2e8f0' },
            ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
          },
          y: {
            min: 1,
            max: 5,
            ticks: {
              color: isDarkMode ? '#94a3b8' : '#64748b',
              stepSize: 1,
              callback: function(value) {
                const mood = Object.keys(moodToScore).find(key => moodToScore[key as Mood] === value);
                return mood ? MOODS.find(m => m.name === mood)?.icon : '';
              },
              font: { size: 18 }
            },
            grid: { color: isDarkMode ? '#334155' : '#e2e8f0' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
                title: (context) => new Date(context[0].parsed.x).toLocaleDateString(),
                label: (context) => `Mood: ${context.raw.mood.charAt(0).toUpperCase() + context.raw.mood.slice(1)}`
            }
          }
        }
      }
    });

    return () => {
      chartInstanceRef.current?.destroy();
    };

  }, [moodLineChartData, isDarkMode]);
  
  const handleAnalyzeSentiment = async () => {
      if (entries.length === 0) return;
      setIsAnalyzing(true);
      setAnalysisError(null);
      setSentimentData(null);
      try {
        const result = await analyzeReflectionSentiment(entries.map(e => ({ text: e.text, date: e.date })));
        setSentimentData(result);
      } catch (err) {
        setAnalysisError((err as Error).message);
      } finally {
        setIsAnalyzing(false);
      }
  };

  const scoreColor = useMemo(() => {
    if (!sentimentData) return 'bg-slate-400';
    if (sentimentData.sentimentScore > 7) return 'bg-green-500';
    if (sentimentData.sentimentScore > 4) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [sentimentData]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      <Card className="lg:col-span-2">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-4">Goal Progress</h2>
          {goalStats ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <svg className="w-32 h-32" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-calm-blue-600 transition-all duration-1000 ease-out"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${goalStats.completionRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-calm-blue-800 dark:text-calm-blue-300">{Math.round(goalStats.completionRate)}%</span>
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  You've completed <span className="font-bold text-calm-blue-700 dark:text-calm-blue-200">{goalStats.completedGoals}</span> of your <span className="font-bold text-calm-blue-700 dark:text-calm-blue-200">{goalStats.totalGoals}</span> goals. Keep it up!
                </p>
                {goalStats.topTags.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">TOP FOCUS AREAS</h3>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {goalStats.topTags.map(tag => (
                        <span key={tag} className="px-3 py-1 text-xs font-medium text-calm-blue-800 bg-calm-blue-100 dark:text-calm-blue-200 dark:bg-calm-blue-900/50 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-calm-blue-100 dark:bg-slate-700 rounded-full text-calm-blue-600 dark:text-calm-blue-300">
                <GoalIcon />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-calm-blue-800 dark:text-calm-blue-300">No Goal Data Yet</h3>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Set some goals to see your progress insights here!</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">Mood Over Time</h2>
          {moodLineChartData.length >= 2 ? (
             <div className="relative h-72">
                <canvas ref={chartCanvasRef}></canvas>
            </div>
          ) : (
             <div className="text-center py-12 flex flex-col items-center justify-center h-72">
                <p className="text-slate-500 dark:text-slate-400">Not enough data for a trend line.</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Keep logging moods to see your timeline!</p>
             </div>
          )}
        </div>
      </Card>
      
       <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">Mood Distribution</h2>
          {moodBarData ? (
             <div className="space-y-4 pt-4">
               {moodBarData.map(mood => (
                 <div key={mood.name} className="flex items-center space-x-4">
                   <span className="text-3xl w-8 text-center">{mood.icon}</span>
                   <div className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-full h-8">
                      <div 
                        className={`${mood.color} h-8 rounded-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out`}
                        style={{ width: `${mood.percentage || 2}%` }} /* Min width for visibility */
                        >
                          <span className="text-xs font-bold text-white shadow-sm">{mood.count > 0 ? mood.count : ''}</span>
                      </div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
             <div className="text-center py-12 flex flex-col items-center justify-center h-72">
                <div className="mx-auto flex items-center justify-center w-12 h-12 bg-calm-blue-100 dark:bg-slate-700 rounded-full text-calm-blue-600 dark:text-calm-blue-300">
                    <InsightsIcon />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-calm-blue-800 dark:text-calm-blue-300">No Mood Data Yet</h3>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Start adding moods to your reflections to see your trends here!</p>
             </div>
          )}

        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">Reflection Sentiment Analysis</h2>
           <p className="text-slate-500 dark:text-slate-400 mb-6">Discover deeper insights from your writing. Aether will analyze your entries to find recurring themes and your overall sentiment.</p>
           
           <div className="flex justify-center">
             <Button onClick={handleAnalyzeSentiment} disabled={isAnalyzing || entries.length === 0}>
                {isAnalyzing ? <Spinner/> : 'Analyze Reflections'}
             </Button>
           </div>
           
           {isAnalyzing && <div className="flex justify-center py-8"><Spinner /></div>}
           {analysisError && <div role="alert" className="mt-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded"><p>{analysisError}</p></div>}
           
           {sentimentData && !isAnalyzing && (
             <div className="mt-6 space-y-6 animate-fade-in">
               <div>
                  <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">Sentiment Score</h3>
                  <div className="flex items-center gap-4">
                      <p className={`text-3xl font-bold ${scoreColor.replace('bg-','text-')}`}>{sentimentData.sentimentScore.toFixed(1)} <span className="text-lg text-slate-400">/ 10</span></p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4" role="progressbar" aria-valuenow={sentimentData.sentimentScore} aria-valuemin={0} aria-valuemax={10}>
                          <div className={`${scoreColor} h-4 rounded-full transition-all duration-500 ease-out`} style={{width: `${sentimentData.sentimentScore * 10}%`}}></div>
                      </div>
                  </div>
               </div>
               <div>
                  <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">Overall Sentiment</h3>
                  <p className="text-slate-600 dark:text-slate-300">{sentimentData.overallSentiment}</p>
               </div>
                <div>
                  <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">Key Themes</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    {sentimentData.keyThemes.map((theme, index) => <li key={index}>{theme}</li>)}
                  </ul>
               </div>
             </div>
           )}

        </div>
      </Card>
      
    </div>
  );
};

export default Insights;