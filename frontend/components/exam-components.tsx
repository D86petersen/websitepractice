import React, { useState, useEffect } from 'react';
import { Button, Card, Badge } from './ui';

// Timer component for exam
export const Timer: React.FC<{
  durationMinutes: number;
  onTimeUp?: () => void;
}> = ({ durationMinutes, onTimeUp }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(
    durationMinutes * 60,
  );

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, onTimeUp]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isWarning = secondsRemaining < 300; // 5 minutes

  return (
    <div
      className={`text-lg font-semibold ${isWarning ? 'text-red-600' : 'text-gray-700'}`}
    >
      ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

// Progress indicator
export const ProgressBar: React.FC<{
  current: number;
  total: number;
  className?: string;
}> = ({ current, total, className = '' }) => {
  const percentage = (current / total) * 100;

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Question navigator (for fixed exam layouts)
export const QuestionNavigator: React.FC<{
  totalQuestions: number;
  currentIndex: number;
  responses: Record<number, any>;
  onSelect: (index: number) => void;
  flaggedQuestions?: Set<number>;
}> = ({ totalQuestions, currentIndex, responses, onSelect, flaggedQuestions = new Set() }) => {
  return (
    <div className="border-l border-gray-200 pl-4 max-h-96 overflow-y-auto">
      <h3 className="font-bold text-sm text-gray-700 mb-3">Questions</h3>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`
              p-2 text-sm font-medium rounded transition-all
              ${i === currentIndex ? 'ring-2 ring-blue-600' : ''}
              ${responses[i] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
              ${flaggedQuestions.has(i) ? 'border-l-4 border-red-600' : ''}
              hover:bg-blue-50
            `}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

// Multiple choice option renderer
export const MultipleChoiceQuestion: React.FC<{
  options: Array<{ id: string; text: string; orderIndex?: number }>;
  selectedIds?: string[];
  onSelect: (ids: string[]) => void;
  multiSelect?: boolean;
  disabled?: boolean;
}> = ({
  options,
  selectedIds = [],
  onSelect,
  multiSelect = false,
  disabled = false,
}) => {
  const handleSelect = (optionId: string) => {
    if (multiSelect) {
      if (selectedIds.includes(optionId)) {
        onSelect(selectedIds.filter((id) => id !== optionId));
      } else {
        onSelect([...selectedIds, optionId]);
      }
    } else {
      onSelect(selectedIds[0] === optionId ? [] : [optionId]);
    }
  };

  const sortedOptions = [...options].sort((a, b) =>
    (a.orderIndex || 0) - (b.orderIndex || 0),
  );

  return (
    <div className="space-y-3">
      {sortedOptions.map((option) => (
        <label
          key={option.id}
          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIds.includes(option.id)
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type={multiSelect ? 'checkbox' : 'radio'}
            name="answer"
            value={option.id}
            checked={selectedIds.includes(option.id)}
            onChange={() => handleSelect(option.id)}
            disabled={disabled}
            className="w-5 h-5"
          />
          <span className="ml-3 text-gray-700">{option.text}</span>
        </label>
      ))}
    </div>
  );
};

// Short answer input
export const ShortAnswerQuestion: React.FC<{
  value?: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({
  value = '',
  onChange,
  placeholder = 'Enter your answer here...',
  disabled = false,
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
      rows={4}
    />
  );
};

// Result summary card
export const ResultSummaryCard: React.FC<{
  totalScore: number;
  scaledScore: number;
  passFail: 'PASS' | 'FAIL';
  correctCount: number;
  totalCount: number;
}> = ({ totalScore, scaledScore, passFail, correctCount, totalCount }) => {
  const isPassing = passFail === 'PASS';

  return (
    <Card className="border-l-4" style={{
      borderLeftColor: isPassing ? '#22c55e' : '#ef4444',
    }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Exam Results</h2>
        <Badge
          variant={isPassing ? 'success' : 'danger'}
          className="text-lg px-4 py-2"
        >
          {isPassing ? '✓ PASSED' : '✗ FAILED'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Score</p>
          <p className="text-3xl font-bold">{totalScore.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Scaled Score (300–1000)</p>
          <p className="text-3xl font-bold">{scaledScore}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Questions Correct</p>
        <p className="text-lg">
          {correctCount} of {totalCount} ({((correctCount / totalCount) * 100).toFixed(1)}%)
        </p>
      </div>

      <p className="text-xs text-gray-500 mt-4 italic">
        Note: Scaled scores are estimated for practice purposes only.
      </p>
    </Card>
  );
};
