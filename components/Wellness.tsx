import React, { useState, useCallback, useEffect } from 'react';
import { getReframingQuestions } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';

// --- Shared Interactive Exercise Components ---

const GROUNDING_STEPS = [
  { prompt: "Acknowledge 5 things you can SEE.", detail: "Look around you. It could be a pen, a cloud, or a spot on the wall." },
  { prompt: "Acknowledge 4 things you can FEEL.", detail: "Notice the texture of your clothes or the surface beneath your hands." },
  { prompt: "Acknowledge 3 things you can HEAR.", detail: "Listen for sounds you might have tuned out, near or far." },
  { prompt: "Acknowledge 2 things you can SMELL.", detail: "Maybe the scent of the air or a nearby drink." },
  { prompt: "Acknowledge 1 thing you can TASTE.", detail: "It might be faint, like the remnants of your last meal, or nothing at all." },
];

const GroundingExercise: React.FC<{ onStop: () => void }> = ({ onStop }) => {
  const [step, setStep] = useState(0);
  const currentStep = GROUNDING_STEPS[step];
  const isLastStep = step === GROUNDING_STEPS.length - 1;

  return (
    <div className="text-center p-6 bg-calm-blue-50 dark:bg-slate-700/50 rounded-lg space-y-4 animate-fade-in">
        <h3 className="text-2xl font-medium text-calm-blue-700 dark:text-calm-blue-300">{currentStep.prompt}</h3>
        <p className="text-slate-500 dark:text-slate-400 min-h-[40px]">{currentStep.detail}</p>
        <div className="flex justify-center items-center gap-4 pt-4">
            <Button onClick={onStop} variant="secondary">Stop Exercise</Button>
            <Button onClick={() => isLastStep ? onStop() : setStep(s => s + 1)}>
                {isLastStep ? "Finish" : "Next"}
            </Button>
        </div>
        <div className="flex justify-center gap-2 pt-2">
            {GROUNDING_STEPS.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full transition-colors ${index <= step ? 'bg-calm-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            ))}
        </div>
    </div>
  );
};

const PMR_STEPS = [
  { group: "Hands", instructions: "Clench your fists tightly." },
  { group: "Arms", instructions: "Tense your biceps, as if flexing." },
  { group: "Shoulders", instructions: "Shrug your shoulders up towards your ears." },
  { group: "Forehead", instructions: "Raise your eyebrows as high as you can." },
  { group: "Face", instructions: "Scrunch up your facial muscles." },
  { group: "Legs", instructions: "Tighten your thigh muscles." },
  { group: "Feet", instructions: "Curl your toes downwards." },
];
const TENSE_DURATION = 5;
const RELAX_DURATION = 10;

const PMRExercise: React.FC<{ onStop: () => void }> = ({ onStop }) => {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState<'tense' | 'relax' | 'done'>('tense');
    const [countdown, setCountdown] = useState(TENSE_DURATION);
    const currentStepData = PMR_STEPS[step];

    useEffect(() => {
        if (phase === 'done') return;
        const timerId = setTimeout(() => {
            if (countdown > 1) {
                setCountdown(c => c - 1);
            } else {
                if (phase === 'tense') {
                    setPhase('relax');
                    setCountdown(RELAX_DURATION);
                } else if (phase === 'relax') {
                    if (step < PMR_STEPS.length - 1) {
                        setStep(s => s + 1);
                        setPhase('tense');
                        setCountdown(TENSE_DURATION);
                    } else {
                        setPhase('done');
                    }
                }
            }
        }, 1000);
        return () => clearTimeout(timerId);
    }, [phase, countdown, step]);
    
    const progressPercentage = ((step + 1) / PMR_STEPS.length) * 100;
    
    let instructionText = '';
    if (phase === 'tense') instructionText = `Tense your ${currentStepData.group}. ${currentStepData.instructions}`;
    else if (phase === 'relax') instructionText = `Now, relax your ${currentStepData.group}. Notice the feeling of release.`;
    else instructionText = "Exercise complete. Take a moment to feel the calm.";

    return (
        <div className="text-center p-6 bg-calm-blue-50 dark:bg-slate-700/50 rounded-lg space-y-4 animate-fade-in">
            <h3 className="text-xl font-medium text-calm-blue-700 dark:text-calm-blue-300 min-h-[48px] flex items-center justify-center">{instructionText}</h3>
            {phase !== 'done' ? (
                <p className="text-4xl font-bold text-slate-700 dark:text-slate-300">{countdown}</p>
            ) : <div className="h-[48px] flex items-center justify-center text-3xl">🧘</div>}
            <div className="w-full bg-calm-blue-100 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-calm-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="pt-4"><Button onClick={onStop} variant="secondary">{phase === 'done' ? 'Finish' : 'Stop Exercise'}</Button></div>
        </div>
    );
};

// --- New Psychological Toolkit Components ---

const CognitiveReframingExercise: React.FC<{ userId: string; onStop: () => void }> = ({ userId, onStop }) => {
    const [thought, setThought] = useState('');
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        if (!thought.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const generatedQuestions = await getReframingQuestions(thought, userId);
            setQuestions([...generatedQuestions, "Based on your answers, what is a more balanced or helpful way to look at this situation?"]);
            setAnswers(Array(generatedQuestions.length + 1).fill(''));
            setStep(1);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnswerChange = (text: string) => {
        const newAnswers = [...answers];
        newAnswers[step - 1] = text;
        setAnswers(newAnswers);
    };

    const isLastStep = step === questions.length;

    if (step === 0) {
        return (
            <div className="space-y-4">
                 <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">What's a negative thought on your mind?</h4>
                 <textarea value={thought} onChange={e => setThought(e.target.value)} placeholder="e.g., I'm going to fail my presentation." className="w-full h-24 p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500" disabled={isLoading} />
                 {error && <p className="text-sm text-red-600">{error}</p>}
                 <div className="flex justify-end items-center gap-4">
                    <Button onClick={onStop} variant="secondary">Cancel</Button>
                    <Button onClick={handleStart} disabled={isLoading || !thought.trim()}>{isLoading ? <Spinner /> : 'Challenge Thought'}</Button>
                 </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Original Thought:</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">"{thought}"</p>
            </div>
            <div>
                <label className="block font-semibold text-calm-blue-700 dark:text-calm-blue-300 mb-2">{questions[step - 1]}</label>
                <textarea value={answers[step - 1]} onChange={e => handleAnswerChange(e.target.value)} className="w-full h-32 p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500" />
            </div>
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Step {step} of {questions.length}</p>
                <div>
                  <Button onClick={() => setStep(s => s - 1)} variant="secondary" disabled={step <= 1}>Back</Button>
                  <Button onClick={() => isLastStep ? onStop() : setStep(s => s + 1)} className="ml-2">{isLastStep ? 'Finish' : 'Next'}</Button>
                </div>
            </div>
        </div>
    )
}

const GratitudePractice: React.FC<{ onStop: () => void }> = ({ onStop }) => {
    const [completed, setCompleted] = useState(false);
    return (
        <div className="space-y-4">
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">List three things you're grateful for today:</h4>
            {completed ? <p className="text-center text-green-600 dark:text-green-400 p-4 bg-green-50 dark:bg-green-500/10 rounded-lg">Thank you for taking this moment of gratitude.</p> : (
                 <div className="space-y-2">
                    <input type="text" placeholder="1." className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                    <input type="text" placeholder="2." className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                    <input type="text" placeholder="3." className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                 </div>
            )}
            <div className="flex justify-end items-center gap-4">
                <Button onClick={onStop} variant="secondary">Close</Button>
                <Button onClick={() => setCompleted(true)} disabled={completed}>Complete Practice</Button>
            </div>
        </div>
    )
}

// --- Main Component ---

interface WellnessProps {
  userId: string;
}

const Wellness: React.FC<WellnessProps> = ({ userId }) => {
    const [activeExercise, setActiveExercise] = useState<'none' | 'reframing' | 'gratitude' | 'grounding' | 'pmr'>('none');

    const handleSelectExercise = (exercise: typeof activeExercise) => {
      setActiveExercise(prev => prev === exercise ? 'none' : exercise);
    };
    
    const renderActiveExercise = () => {
        switch(activeExercise) {
            case 'reframing': return <CognitiveReframingExercise userId={userId} onStop={() => setActiveExercise('none')} />;
            case 'gratitude': return <GratitudePractice onStop={() => setActiveExercise('none')} />;
            case 'grounding': return <GroundingExercise onStop={() => setActiveExercise('none')} />;
            case 'pmr': return <PMRExercise onStop={() => setActiveExercise('none')} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-calm-blue-800 dark:text-calm-blue-300">Psychological Toolkit</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">A collection of evidence-based techniques from psychology to help you manage your thoughts and feelings.</p>
                </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300">Challenge Negative Thoughts (from CBT)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This exercise helps you identify, challenge, and reframe unhelpful thought patterns.</p>
                <div className="mt-4">
                  <Button onClick={() => handleSelectExercise('reframing')}>
                    {activeExercise === 'reframing' ? 'Close Exercise' : 'Begin Cognitive Reframing'}
                  </Button>
                </div>
                {activeExercise === 'reframing' && <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">{renderActiveExercise()}</div>}
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300">Practice Gratitude (from Positive Psychology)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Focusing on what you're thankful for is a powerful way to improve your mood and outlook.</p>
                <div className="mt-4">
                  <Button onClick={() => handleSelectExercise('gratitude')}>
                    {activeExercise === 'gratitude' ? 'Close Exercise' : 'Start Gratitude Practice'}
                  </Button>
                </div>
                {activeExercise === 'gratitude' && <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">{renderActiveExercise()}</div>}
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-calm-blue-700 dark:text-calm-blue-300">Ground Yourself in the Present (from Mindfulness)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Use these techniques when you feel overwhelmed or anxious to reconnect with the here and now.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => handleSelectExercise('grounding')}>
                    {activeExercise === 'grounding' ? 'Close 5-4-3-2-1' : 'Start 5-4-3-2-1 Grounding'}
                  </Button>
                  <Button variant="secondary" onClick={() => handleSelectExercise('pmr')}>
                    {activeExercise === 'pmr' ? 'Close PMR' : 'Start Progressive Muscle Relaxation'}
                  </Button>
                </div>
                {(activeExercise === 'grounding' || activeExercise === 'pmr') && (
                  <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">{renderActiveExercise()}</div>
                )}
              </div>
            </Card>
        </div>
    );
};

export default Wellness;