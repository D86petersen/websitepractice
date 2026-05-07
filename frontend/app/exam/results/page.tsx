import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { ResultSummaryCard } from '@/components/exam-components';
import { sessionAPI } from '@/lib/api';

const ResultsPage: React.FC = () => {
  const router = useRouter();
  const { sessionId } = router.query;

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchResults = async () => {
      try {
        const { data } = await sessionAPI.getResult(sessionId as string);
        setResults(data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  if (loading || !results) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading results...</p>
      </div>
    );
  }

  const weakAreas = results.weakAreas || [];

  return (
    <>
      <Head>
        <title>Exam Results - CCNA Practice Platform</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold">Exam Results</h1>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Card */}
          <div className="mb-8">
            <ResultSummaryCard
              totalScore={results.totalScore}
              scaledScore={results.scoreScale}
              passFail={results.passFail}
              correctCount={results.rawCorrectCount}
              totalCount={results.rawTotalCount}
            />
          </div>

          {/* Domain Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <h3 className="font-bold text-lg mb-4">Domain Performance</h3>
              <div className="space-y-4">
                {Object.entries(results.domainScores).map(
                  ([domainKey, score]: [string, any]) => {
                    const isWeak = score < 70;
                    return (
                      <div key={domainKey}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {domainKey
                              .split('_')
                              .map(
                                (w: string) =>
                                  w.charAt(0) +
                                  w.slice(1).toLowerCase(),
                              )
                              .join(' ')}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              isWeak ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {score.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              isWeak ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </Card>

            <Card>
              <h3 className="font-bold text-lg mb-4">Recommendations</h3>
              {weakAreas.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 mb-3">
                    Focus your next study session on these weak areas:
                  </p>
                  <ul className="space-y-2">
                    {weakAreas.map((domain: string) => (
                      <li key={domain} className="text-sm">
                        • {domain.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                  <Link href="/exams">
                    <Button size="sm" className="w-full mt-4">
                      Take Domain-Focused Quiz
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-green-700">
                  ✓ Great job! You performed well across all domains.
                </p>
              )}
            </Card>
          </div>

          {/* Question Review (Sample) */}
          <Card>
            <h3 className="font-bold text-lg mb-4">Question Review</h3>
            <div className="space-y-4">
              {results.questionReviews.slice(0, 3).map((q: any, idx: number) => (
                <div key={idx} className="pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm">{q.questionStem}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        q.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  {q.explanation && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        View Explanation
                      </summary>
                      <p className="text-sm text-gray-700 mt-2">{q.explanation}</p>
                    </details>
                  )}
                </div>
              ))}
            </div>
            {results.questionReviews.length > 3 && (
              <Button variant="secondary" className="w-full mt-4">
                View All {results.questionReviews.length} Questions
              </Button>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-4 mt-8 justify-center">
            <Link href="/exams">
              <Button variant="secondary">Take Another Exam</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsPage;
