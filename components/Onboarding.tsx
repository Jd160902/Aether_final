import React from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { ReflectionsIcon, DreamIcon, GoalIcon } from './common/Icons';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-lg">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-calm-blue-800 dark:text-calm-blue-300 mb-2">Welcome to Aether!</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Your personal companion for mind, body, and soul. Here's a quick look at what you can do:</p>

          <div className="space-y-4 text-left my-8">
            <div className="flex items-start space-x-4">
              <div className="text-calm-blue-600 dark:text-calm-blue-400 mt-1"><ReflectionsIcon /></div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Capture Your Reflections</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Log your thoughts and feelings to receive gentle, AI-powered insights.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
               <div className="text-calm-blue-600 dark:text-calm-blue-400 mt-1"><DreamIcon /></div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Define Your Aspirations</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Capture your biggest life dreams and get inspired with motivational quotes.</p>
              </div>
            </div>
             <div className="flex items-start space-x-4">
               <div className="text-calm-blue-600 dark:text-calm-blue-400 mt-1"><GoalIcon /></div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Set Your Goals</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Define your intentions and get motivational nudges to stay on track.</p>
              </div>
            </div>
          </div>
          
          <Button onClick={onComplete}>Get Started</Button>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;