import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button, Card } from '@/components/ui';
import {
  Timer,
  ProgressBar,
  QuestionNavigator,
  MultipleChoiceQuestion,
  ShortAnswerQuestion,
} from '@/components/exam-components';
import { sessionAPI } from '@/lib/api';
import { useExamStore } from '@/lib/store';

const ExamPage: React.FC = () => {
  const router = useRouter();
  const { formId, mode } = router.query;
  
  const { session, setSession, updateResponse, clearSession } = useExamStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [responseTime, setResponseTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set(),
  );

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      if (!formId || session) return;

      try {
        const { data } = await sessionAPI.create(
          formId as string,
          (mode || 'SIMULATION') as 'SIMULATION' | 'STUDY',
        );
        setSession(data);
      } catch (error) {
        console.error('Failed to start exam:', error);
        router.push('/exams');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [formId, mode, session, setSession, router]);

  // Load current question
  useEffect(() => {
    const loadQuestion = async () => {
      if (!session) return;

      try {
        const { data } = await sessionAPI.getCurrentQuestion(
          session.sessionId,
          currentQuestionIndex,
        );
        setCurrentQuestion(data.question);
        setSelectedOptions(data.userResponse?.selectedOptionIds || []);
        setFreeText(data.userResponse?.freeTextAnswer || '');
      } catch (error) {
        console.error('Failed to load question:', error);
      }
    };

    loadQuestion();
    setResponseTime(0);
  }, [session, currentQuestionIndex]);

  // Track response time
  useEffect(() => {
    const timer = setInterval(() => {
      setResponseTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex]);

  const handleSubmitAnswer = async () => {
    if (!session) return;

    try {
      const result = await sessionAPI.submitAnswer(
        session.sessionId,
        currentQuestionIndex,
        selectedOptions,
        freeText,
        responseTime * 1000,
      );

      updateResponse(currentQuestionIndex, {
        selectedOptions,
        freeText,
        isCorrect: result.data.isCorrect,
      });

      // Move to next question or complete
      if (currentQuestionIndex < session.totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOptions([]);
        setFreeText('');
      } else {
        handleCompleteExam();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleCompleteExam = async () => {
    if (!session) return;

    try {
      await sessionAPI.complete(session.sessionId);
      router.push(
        `/exam/results?sessionId=${session.sessionId}`,
      );
    } catch (error) {
      console.error('Failed to complete exam:', error);
    }
  };

  const handleNavigate = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleFlagQuestion = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestionIndex)) {
      newFlagged.delete(currentQuestionIndex);
    } else {
      newFlagged.add(currentQuestionIndex);
    }
    setFlaggedQuestions(newFlagged);
  };

  if (loading || !session || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading exam...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{session.examName} - CCNA Practice Platform</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Exam Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-xl font-bold">{session.examName}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {session.totalQuestions}
                </p>
              </div>
              <Timer
                durationMinutes={session.timeLimitMinutes}
                onTimeUp={handleCompleteExam}
              />
            </div>
            <ProgressBar
              current={currentQuestionIndex + 1}
              total={session.totalQuestions}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
          {/* Question Panel */}
          <div className="flex-1">
            <Card>
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">{currentQuestion.stem}</h2>

                {currentQuestion.type in
                ['SINGLE_CHOICE', 'MULTI_SELECT'] ? (
                  <MultipleChoiceQuestion
                    options={currentQuestion.answerOptions}
                    selectedIds={selectedOptions}
                    onSelect={setSelectedOptions}
                    multiSelect={currentQuestion.type === 'MULTI_SELECT'}
                  />
                ) : currentQuestion.type === 'SHORT_ANSWER' ? (
                  <ShortAnswerQuestion
                    value={freeText}
                    onChange={setFreeText}
                  />
                ) : null}
              </div>

              {/* In STUDY mode, show feedback */}
              {session.mode === 'STUDY' && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    In Study Mode you would see feedback here
                  </p>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <Button
                  variant={flaggedQuestions.has(currentQuestionIndex) ? 'danger' : 'secondary'}
                  onClick={handleFlagQuestion}
                >
                  {flaggedQuestions.has(currentQuestionIndex) ? '🚩 Flagged' : '🔖 Flag'}
                </Button>

                {currentQuestionIndex > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => handleNavigate(currentQuestionIndex - 1)}
                  >
                    ← Previous
                  </Button>
                )}

                <Button
                  onClick={handleSubmitAnswer}
                  className="flex-1"
                >
                  {currentQuestionIndex === session.totalQuestions - 1
                    ? 'Finish Exam'
                    : 'Next Question →'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="hidden lg:block w-48">
            <QuestionNavigator
              totalQuestions={session.totalQuestions}
              currentIndex={currentQuestionIndex}
              responses={session.responses || {}}
              onSelect={handleNavigate}
              flaggedQuestions={flaggedQuestions}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamPage;
