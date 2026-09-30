'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Save, Check, Rocket } from 'lucide-react';

interface AdminStepFooterProps {
  currentStep: 1 | 2 | 3 | 4;
  selectedCount: number;
  voterCount: number;
  isSaving: boolean;
  saveSuccess: boolean;
  isLaunching: boolean;
  isReadyToStart: boolean;
  canProceedToStep4?: boolean;
  step3Mode?: 'ask' | 'ai' | 'sources';
  onPrevStep: () => void;
  onNextStep: () => void;
  onSaveConfig: () => void;
  onLaunchSession: () => void;
}

export function AdminStepFooter({
  currentStep,
  selectedCount,
  voterCount,
  isSaving,
  saveSuccess,
  isLaunching,
  isReadyToStart,
  canProceedToStep4 = true,
  step3Mode = 'ask',
  onPrevStep,
  onNextStep,
  onSaveConfig,
  onLaunchSession,
}: AdminStepFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md shadow-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentStep === 3}
          onClick={onPrevStep}
          className="px-3.5 sm:px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Stepper info badge */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <span className="font-bold text-amber-400">
            {currentStep === 3 ? 'Step 1 of 2' : 'Step 2 of 2'}
          </span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="text-slate-300 hidden sm:inline">
            {selectedCount} movie(s) selected
          </span>
          <span className="text-slate-600 hidden md:inline">&bull;</span>
          <span className="text-slate-300 hidden md:inline">
            {voterCount} voter(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveConfig}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
          </button>

          {currentStep < 4 ? (
            (() => {
              const isBlockedOnStep3 = currentStep === 3 && !canProceedToStep4;
              return (
                <button
                  type="button"
                  disabled={isBlockedOnStep3}
                  onClick={onNextStep}
                  title={
                    isBlockedOnStep3
                      ? step3Mode === 'ai'
                        ? 'Generate AI movie suggestions first to continue'
                        : 'Choose a movie curation option above first'
                      : 'Next Step'
                  }
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md ${
                    isBlockedOnStep3
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 glow-gold cursor-pointer'
                  }`}
                >
                  <span>
                    {isBlockedOnStep3
                      ? step3Mode === 'ai'
                        ? 'Generate AI First'
                        : 'Choose Option Above'
                      : 'Next'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              );
            })()
          ) : (
            <button
              type="button"
              onClick={onLaunchSession}
              disabled={!isReadyToStart || isLaunching}
              title={
                !isReadyToStart
                  ? selectedCount === 0
                    ? 'Select at least 1 movie to start voting'
                    : 'Session title is required'
                  : 'Start voting now'
              }
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg active:scale-95 ${
                isReadyToStart
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 glow-cyan cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Rocket className="w-4 h-4 stroke-[2.5]" />
              <span>{isLaunching ? 'Starting...' : '🚀 Start Voting'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
