'use client';

import React from 'react';
import { Shield, Users, Film, Check, Lock, Sparkles } from 'lucide-react';

interface AdminStepTabsProps {
  currentStep: 1 | 2 | 3 | 4;
  isSetupMode: boolean;
  canProceedToStep4?: boolean;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
}

const SETUP_STAGES = [
  {
    step: 3 as const,
    stageNumber: 1,
    title: '1. Curate Movies',
    desc: 'Gemini AI prompt or streaming sources',
    icon: Sparkles,
  },
  {
    step: 4 as const,
    stageNumber: 2,
    title: '2. Review Lineup & Launch',
    desc: 'Select contender movies & start voting',
    icon: Film,
  },
];

const SETTINGS_TABS = [
  {
    step: 1 as const,
    title: 'Naming & Rules',
    desc: 'Title, tie-breaks & ballot visibility',
    icon: Shield,
  },
  {
    step: 2 as const,
    title: 'Voters & Permissions',
    desc: 'Votes per person & voter suggestions',
    icon: Users,
  },
  {
    step: 4 as const,
    title: 'Movie Lineup',
    desc: 'Edit contender movies or add more',
    icon: Film,
  },
];

export function AdminStepTabs({
  currentStep,
  isSetupMode,
  canProceedToStep4 = true,
  onSelectStep,
}: AdminStepTabsProps) {
  if (isSetupMode) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SETUP_STAGES.map(({ step, stageNumber, title, desc, icon: Icon }) => {
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;
          const isLocked = step === 4 && !canProceedToStep4;

          return (
            <button
              key={step}
              type="button"
              disabled={isLocked}
              onClick={() => onSelectStep(step)}
              title={isLocked ? 'Step 1 curation or AI suggestions required first' : undefined}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                isLocked
                  ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed text-slate-500'
                  : isActive
                  ? 'bg-amber-500/15 border-amber-500/80 shadow-lg shadow-amber-500/10'
                  : isCompleted
                  ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                      isLocked
                        ? 'bg-slate-900 text-slate-600'
                        : isActive
                        ? 'bg-amber-400 text-slate-950'
                        : isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-3 h-3 text-slate-500" />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      stageNumber
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-black truncate ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                    {title}
                  </span>
                </div>
                {isLocked ? (
                  <Lock className="w-4 h-4 shrink-0 text-slate-600" />
                ) : (
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 pl-8 truncate">
                {isLocked ? 'Step 1 curation or AI required first' : desc}
              </p>
            </button>
          );
        })}
      </div>
    );
  }

  // After Setup Mode: Clean 3-tab settings navigation (no step progress, no Step 3)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {SETTINGS_TABS.map(({ step, title, desc, icon: Icon }) => {
        const isActive = currentStep === step;

        return (
          <button
            key={step}
            type="button"
            onClick={() => onSelectStep(step)}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
              isActive
                ? 'bg-amber-500/15 border-amber-500/80 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  {title}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pl-10 truncate">
              {desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}
