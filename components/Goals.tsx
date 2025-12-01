

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { getGoalMotivation, breakdownLongTermGoal } from '../services/geminiService';
import { getGoals, saveGoals } from '../services/db';
import type { Goal } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { GoalIcon, CalendarIcon, AlertIcon } from './common/Icons';

interface GoalsProps {
  userId: string;
}

const Goals: React.FC<GoalsProps> = ({ userId }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState<string>('');
  const [newGoalDueDate, setNewGoalDueDate] = useState<string>('');
  const [newGoalTags, setNewGoalTags] = useState<string>('');
  const [newGoalType, setNewGoalType] = useState<'short-term' | 'long-term'>('short-term');
  const [motivation, setMotivation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingGoals, setIsFetchingGoals] = useState<boolean>(true);
  const [reminders, setReminders] = useState<Goal[]>([]);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // State for goal breakdown feature
  const [isBreakingDownId, setIsBreakingDownId] = useState<string | null>(null);
  const [breakdownSuggestions, setBreakdownSuggestions] = useState<string[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<Record<string, boolean>>({});
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoals = async () => {
      setIsFetchingGoals(true);
      const userGoals = await getGoals(userId);
      setGoals(userGoals);
      setIsFetchingGoals(false);
    };
    loadGoals();
  }, [userId]);

  useEffect(() => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingGoals = goals.filter(goal => {
      if (!goal.dueDate || goal.isCompleted) return false;
      const dueDate = new Date(goal.dueDate);
      return dueDate > now && dueDate <= in24Hours;
    });

    setReminders(upcomingGoals);
  }, [goals]);

  const handleAddGoal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const tags = newGoalTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    const newGoal: Goal = {
      id: new Date().toISOString(),
      text: newGoalText,
      isCompleted: false,
      dueDate: newGoalDueDate || undefined,
      tags: tags.length > 0 ? tags : undefined,
      type: newGoalType,
    };
    const updatedGoals = [newGoal, ...goals];
    await saveGoals(userId, updatedGoals);
    setGoals(updatedGoals);
    setNewGoalText('');
    setNewGoalDueDate('');
    setNewGoalTags('');
    setNewGoalType('short-term');
  }, [newGoalText, newGoalDueDate, newGoalTags, newGoalType, goals, userId]);

  const toggleGoal = useCallback(async (id: string) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id ? { ...goal, isCompleted: !goal.isCompleted } : goal
    );
    await saveGoals(userId, updatedGoals);
    setGoals(updatedGoals);
  }, [goals, userId]);
  
  const requestMotivation = useCallback(async () => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    if(activeGoals.length === 0) {
        setMotivation("You've completed all your goals! Time to set some new ones.");
        return;
    };
    const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
    setIsLoading(true);
    setMotivation(null);
    const tip = await getGoalMotivation(randomGoal.text, userId);
    setMotivation(tip);
    setIsLoading(false);
  }, [goals, userId]);

  const handleBreakdown = async (goal: Goal) => {
    setIsBreakingDownId(goal.id);
    setBreakdownError(null);
    setBreakdownSuggestions([]);
    try {
      const steps = await breakdownLongTermGoal(goal.text);
      setBreakdownSuggestions(steps);
    } catch(err) {
      setBreakdownError((err as Error).message);
    } finally {
      setIsBreakingDownId(null);
    }
  };

  const handleAddSelectedSteps = async () => {
    const stepsToAdd = Object.keys(selectedSteps).filter(step => selectedSteps[step]);
    if (stepsToAdd.length === 0) return;

    const newGoals: Goal[] = stepsToAdd.map(stepText => ({
      id: new Date().toISOString() + Math.random(),
      text: stepText,
      isCompleted: false,
      type: 'short-term',
    }));
    
    const updatedGoals = [...newGoals, ...goals];
    await saveGoals(userId, updatedGoals);
    setGoals(updatedGoals);

    // Reset breakdown UI
    setBreakdownSuggestions([]);
    setSelectedSteps({});
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    goals.forEach(goal => {
      goal.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (!activeTagFilter) {
      return goals;
    }
    return goals.filter(goal => goal.tags?.includes(activeTagFilter));
  }, [goals, activeTagFilter]);

  const shortTermGoals = useMemo(() => {
    return filteredGoals.filter(g => g.type === 'short-term' || !g.type);
  }, [filteredGoals]);

  const longTermGoals = useMemo(() => {
    return filteredGoals.filter(g => g.type === 'long-term');
  }, [filteredGoals]);

  const calculateProgress = (goals: Goal[]) => {
    const total = goals.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = goals.filter(goal => goal.isCompleted).length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const shortTermProgress = useMemo(() => calculateProgress(shortTermGoals), [shortTermGoals]);
  const longTermProgress = useMemo(() => calculateProgress(longTermGoals), [longTermGoals]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const isOverdue = (goal: Goal): boolean => !!(goal.dueDate && !goal.isCompleted && new Date(goal.dueDate) < new Date());

  const renderGoalList = (goalList: Goal[], type: 'short-term' | 'long-term') => (
    <div className="space-y-3">
      {goalList.length > 0 ? goalList.map(goal => {
        const isUpcoming = !goal.isCompleted && reminders.some(r => r.id === goal.id);
        return (
          <div 
            key={goal.id} 
            className={`p-3 rounded-lg transition-all duration-300 ease-in-out ${
              isUpcoming ? 'bg-yellow-100/70 dark:bg-yellow-500/10' :
              goal.isCompleted ? 'bg-green-50 dark:bg-green-500/10' : 'bg-slate-50 dark:bg-slate-700/50'
            }`}
          >
            <div className="flex items-start sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center space-x-3 flex-grow">
                <input type="checkbox" checked={goal.isCompleted} onChange={() => toggleGoal(goal.id)} className="h-5 w-5 rounded text-calm-blue-600 focus:ring-calm-blue-500 border-slate-300 dark:border-slate-500 dark:bg-slate-600 cursor-pointer flex-shrink-0 mt-0.5 sm:mt-0" id={`goal-${goal.id}`} />
                <label htmlFor={`goal-${goal.id}`} className={`flex-grow cursor-pointer transition-colors duration-300 ease-in-out ${ goal.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300' }`}>{goal.text}</label>
              </div>
              {type === 'long-term' && !goal.isCompleted && (
                <Button onClick={() => handleBreakdown(goal)} disabled={isBreakingDownId !== null} variant="secondary" className="text-xs px-2 py-1 flex-shrink-0">
                  {isBreakingDownId === goal.id ? <Spinner/> : '✨ Break Down'}
                </Button>
              )}
            </div>
            {(goal.tags && goal.tags.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-2 pl-8">{goal.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-xs font-medium text-calm-blue-800 bg-calm-blue-100 dark:text-calm-blue-200 dark:bg-calm-blue-900/50 rounded-full">{tag}</span>)}</div>
            )}
            {goal.dueDate && (
                <div className={`flex items-center space-x-2 mt-2 pl-8 text-xs ${isOverdue(goal) ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}><CalendarIcon /><span>{isOverdue(goal) ? 'Overdue: ' : 'Due: '}{formatDate(goal.dueDate)}</span></div>
            )}
          </div>
        );
      }) : (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center w-12 h-12 bg-calm-blue-100 dark:bg-slate-700 rounded-full text-calm-blue-600 dark:text-calm-blue-300"><GoalIcon /></div>
          <h3 className="mt-4 text-lg font-semibold text-calm-blue-800 dark:text-calm-blue-300">{activeTagFilter ? 'No Goals Found' : `Set Your First ${type === 'short-term' ? 'Short-Term' : 'Long-Term'} Goal`}</h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{activeTagFilter ? `No goals with the tag "${activeTagFilter}" found.` : `What's a goal for this category? Add one above.`}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">Set Your Intentions</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">What do you want to achieve? Add a goal, type, tags, and an optional due date.</p>
          <form onSubmit={handleAddGoal} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="e.g., Meditate for 5 minutes daily" className="flex-grow p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 dark:placeholder-slate-400" />
              <input type="datetime-local" value={newGoalDueDate} onChange={(e) => setNewGoalDueDate(e.target.value)} className="p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 text-slate-500 dark:text-slate-400" aria-label="Goal due date" />
            </div>
            <input type="text" value={newGoalTags} onChange={(e) => setNewGoalTags(e.target.value)} placeholder="Add tags (e.g., Health, Career, Personal)" className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 dark:placeholder-slate-400" />
            <fieldset className="flex items-center space-x-4 pt-1">
                <legend className="text-sm font-medium text-slate-600 dark:text-slate-300 sr-only">Goal Type:</legend>
                <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="goalType" value="short-term" checked={newGoalType === 'short-term'} onChange={() => setNewGoalType('short-term')} className="h-4 w-4 text-calm-blue-600 focus:ring-calm-blue-500 border-slate-400 dark:border-slate-500 dark:bg-slate-600" /><span className="text-sm text-slate-700 dark:text-slate-300">Short-Term</span></label>
                <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="goalType" value="long-term" checked={newGoalType === 'long-term'} onChange={() => setNewGoalType('long-term')} className="h-4 w-4 text-calm-blue-600 focus:ring-calm-blue-500 border-slate-400 dark:border-slate-500 dark:bg-slate-600" /><span className="text-sm text-slate-700 dark:text-slate-300">Long-Term</span></label>
            </fieldset>
            <div className="flex justify-end pt-2"><Button type="submit">Add Goal</Button></div>
          </form>
        </div>
      </Card>

      {breakdownSuggestions.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">Suggested Short-Term Steps</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Select the steps you'd like to add as new short-term goals.</p>
            <div className="space-y-2">
              {breakdownSuggestions.map((step, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={!!selectedSteps[step]} onChange={(e) => setSelectedSteps(prev => ({ ...prev, [step]: e.target.checked }))} className="h-5 w-5 rounded text-calm-blue-600 focus:ring-calm-blue-500 border-slate-300 dark:border-slate-500 dark:bg-slate-600" />
                  <span className="text-slate-700 dark:text-slate-300">{step}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end items-center gap-4 mt-4">
              <Button variant="secondary" onClick={() => setBreakdownSuggestions([])}>Cancel</Button>
              <Button onClick={handleAddSelectedSteps}>Add Selected to Goals</Button>
            </div>
          </div>
        </Card>
      )}
      
      <Card>
        <div className="p-6">
          {isFetchingGoals ? (<div className="flex justify-center items-center h-40"><Spinner /></div>) : (
            <>
              {reminders.length > 0 && (
                <div role="alert" className="p-4 mb-6 bg-yellow-100/70 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300 rounded-lg flex items-start gap-4">
                  <div className="flex-shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5"><AlertIcon /></div>
                  <div>
                    <h4 className="font-bold">Upcoming Deadlines!</h4>
                    <ul className="list-disc list-inside mt-1 text-sm">{reminders.map(reminder => <li key={`reminder-${reminder.id}`}><strong>{reminder.text}</strong> is due {formatDate(reminder.dueDate!)}.</li>)}</ul>
                  </div>
                </div>
              )}
              {breakdownError && <div role="alert" className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded"><p>{breakdownError}</p></div>}
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300">Your Progress</h3><Button onClick={requestMotivation} disabled={isLoading || goals.length === 0} variant="secondary">Get Motivation</Button></div>
              {allTags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">Filter:</span>
                  <Button onClick={() => setActiveTagFilter(null)} variant={activeTagFilter === null ? 'primary' : 'secondary'} className="px-3 py-1 text-xs">All</Button>
                  {allTags.map(tag => <Button key={tag} onClick={() => setActiveTagFilter(tag)} variant={activeTagFilter === tag ? 'primary' : 'secondary'} className="px-3 py-1 text-xs">{tag}</Button>)}
                </div>
              )}
              {isLoading && <div className="flex justify-center my-4"><Spinner/></div>}
              {motivation && <div className="p-4 bg-calm-blue-100/50 dark:bg-slate-700/50 rounded-lg mb-6 text-center text-slate-700 dark:text-slate-300"><p>"{motivation}"</p></div>}

              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-4">Short-Term Goals</h4>
                  {shortTermGoals.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1 text-sm font-medium"><span className="text-slate-600 dark:text-slate-300">Progress</span><span className="text-calm-blue-700 dark:text-calm-blue-300">{shortTermProgress.completed} / {shortTermProgress.total} completed</span></div>
                      <div className="w-full bg-calm-blue-100 dark:bg-slate-700 rounded-full h-2.5" role="progressbar" aria-valuenow={shortTermProgress.percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Short-term goal completion progress"><div className="bg-calm-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${shortTermProgress.percentage}%` }}></div></div>
                    </div>
                  )}
                  {renderGoalList(shortTermGoals, 'short-term')}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-4">Long-Term Goals</h4>
                  {longTermGoals.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1 text-sm font-medium"><span className="text-slate-600 dark:text-slate-300">Progress</span><span className="text-calm-blue-700 dark:text-calm-blue-300">{longTermProgress.completed} / {longTermProgress.total} completed</span></div>
                      <div className="w-full bg-calm-blue-100 dark:bg-slate-700 rounded-full h-2.5" role="progressbar" aria-valuenow={longTermProgress.percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Long-term goal completion progress"><div className="bg-calm-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${longTermProgress.percentage}%` }}></div></div>
                    </div>
                  )}
                  {renderGoalList(longTermGoals, 'long-term')}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Goals;