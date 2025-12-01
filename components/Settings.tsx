import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { getUserSettings, saveUserSettings } from '../services/db';
import type { AiPersona, UserSettings, PersonaPrompts, PromptKey } from '../types';
import { AI_PERSONAS, PROMPT_CONFIG } from '../constants';

interface SettingsProps {
  userId: string;
}

const Settings: React.FC<SettingsProps> = ({ userId }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for persona selection
  const [selectedPersona, setSelectedPersona] = useState<AiPersona>('empathetic_companion');
  
  // State for custom persona form
  const [customPersonaName, setCustomPersonaName] = useState('');
  const [customPersonaDescription, setCustomPersonaDescription] = useState('');
  const [customPrompts, setCustomPrompts] = useState<Partial<PersonaPrompts>>({});

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const userSettings = await getUserSettings(userId);
      setSettings(userSettings);
      setSelectedPersona(userSettings.aiPersona);

      // Populate custom persona form state
      setCustomPersonaName(userSettings.customPersona?.name || '');
      setCustomPersonaDescription(userSettings.customPersona?.description || '');
      
      const initialPrompts: Partial<PersonaPrompts> = {};
      const defaultPrompts = AI_PERSONAS.empathetic_companion.prompts;
      for (const key in PROMPT_CONFIG) {
          const promptKey = key as PromptKey;
          initialPrompts[promptKey] = {
              // Use saved instruction, or fall back to default as a placeholder
              systemInstruction: userSettings.customPersona?.prompts?.[promptKey]?.systemInstruction || defaultPrompts[promptKey].systemInstruction,
              userPrompt: defaultPrompts[promptKey].userPrompt, // Not user-editable
          };
      }
      setCustomPrompts(initialPrompts);

      setIsLoading(false);
    };
    loadSettings();
  }, [userId]);
  
  const handlePromptChange = (promptKey: PromptKey, value: string) => {
    setCustomPrompts(prev => ({
        ...prev,
        [promptKey]: {
            ...(prev[promptKey] as any),
            systemInstruction: value,
        }
    }));
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    const newSettings: UserSettings = { 
      aiPersona: selectedPersona,
      customPersona: {
        name: customPersonaName.trim(),
        description: customPersonaDescription.trim(),
        prompts: customPrompts,
      }
    };
    await saveUserSettings(userId, newSettings);
    setSettings(newSettings);

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [userId, selectedPersona, customPersonaName, customPersonaDescription, customPrompts]);

  const isSaveDisabled = useMemo(() => {
    if (isSaving || !settings) return true;

    const hasPersonaChanged = selectedPersona !== settings.aiPersona;

    let hasCustomFieldsChanged = false;
    if (selectedPersona === 'custom') {
      const original = settings.customPersona;
      const originalPrompts = original?.prompts || {};

      hasCustomFieldsChanged = (
        customPersonaName !== (original?.name || '') ||
        customPersonaDescription !== (original?.description || '') ||
        Object.keys(PROMPT_CONFIG).some(key => {
          const promptKey = key as PromptKey;
          return customPrompts[promptKey]?.systemInstruction !== originalPrompts[promptKey]?.systemInstruction;
        })
      );
    }
    
    return !(hasPersonaChanged || hasCustomFieldsChanged);
  }, [isSaving, settings, selectedPersona, customPersonaName, customPersonaDescription, customPrompts]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-calm-blue-800 dark:text-calm-blue-300 mb-2">Customize Aether's Personality</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Choose a predefined persona or create your own to tailor Aether's responses.</p>
          
          <fieldset className="space-y-4">
            <legend className="sr-only">Aether's Persona</legend>
            {Object.entries(AI_PERSONAS).map(([key, persona]) => (
              <label 
                key={key}
                htmlFor={key}
                className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedPersona === key
                    ? 'border-calm-blue-500 bg-calm-blue-50 dark:bg-slate-700/80 ring-2 ring-calm-blue-500'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-calm-blue-400 dark:hover:border-calm-blue-600'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={key}
                    name="persona"
                    value={key}
                    checked={selectedPersona === key}
                    onChange={() => setSelectedPersona(key as AiPersona)}
                    className="h-4 w-4 text-calm-blue-600 border-slate-300 focus:ring-calm-blue-500"
                  />
                  <span className="ml-3 text-base font-semibold text-slate-800 dark:text-slate-200">{key === 'custom' && customPersonaName ? customPersonaName : persona.name}</span>
                </div>
                <p className="mt-1 ml-7 text-sm text-slate-500 dark:text-slate-400">{key === 'custom' && customPersonaDescription ? customPersonaDescription : persona.description}</p>
                
                {key === 'custom' && selectedPersona === 'custom' && (
                  <div className="mt-6 ml-7 animate-fade-in border-t border-slate-200 dark:border-slate-600 pt-4 space-y-4">
                     <div>
                        <label htmlFor="customName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Persona Name</label>
                        <input id="customName" type="text" value={customPersonaName} onChange={(e) => setCustomPersonaName(e.target.value)} placeholder="e.g., Captain Jack" className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-calm-blue-500" disabled={isSaving}/>
                    </div>
                     <div>
                        <label htmlFor="customDesc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Persona Description</label>
                        <textarea id="customDesc" value={customPersonaDescription} onChange={(e) => setCustomPersonaDescription(e.target.value)} placeholder="e.g., A witty pirate who gives advice." className="w-full h-16 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-calm-blue-500" disabled={isSaving}/>
                    </div>
                    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-600">Custom Instructions</h4>
                    {Object.entries(PROMPT_CONFIG).map(([promptKey, config]) => (
                        <div key={promptKey}>
                            <label htmlFor={promptKey} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{config.label}</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{config.description}</p>
                            <textarea
                                id={promptKey}
                                value={customPrompts[promptKey as PromptKey]?.systemInstruction || ''}
                                onChange={e => handlePromptChange(promptKey as PromptKey, e.target.value)}
                                className="w-full h-28 p-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-calm-blue-500"
                                disabled={isSaving}
                            />
                        </div>
                    ))}
                  </div>
                )}
              </label>
            ))}
          </fieldset>
          
          <div className="mt-6 flex justify-end items-center gap-4">
             {saveSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 animate-fade-in">Settings saved!</p>
              )}
            <Button onClick={handleSave} disabled={isSaveDisabled}>
              {isSaving ? <Spinner /> : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;