import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { examFormAPI, blueprintAPI } from '@/lib/api';

interface ExamForm {
  id: string;
  name: string;
  mode: string;
  questionCount: number;
  timeLimitMinutes: number;
  blueprint: { name: string };
}

const ExamsPage: React.FC = () => {
  const router = useRouter();
  const [exams, setExams] = useState<ExamForm[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlueprint, setSelectedBlueprint] = useState<string | null>(null);
  const [mode, setMode] = useState<'all' | 'SIMULATION' | 'STUDY'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bpRes = await blueprintAPI.list(true);
        setBlueprints(bpRes.data);

        const exRes = await examFormAPI.list(
          selectedBlueprint || undefined,
        );
        setExams(exRes.data.forms || []);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBlueprint]);

  const filteredExams = exams.filter((exam) => {
    if (mode !== 'all' && exam.mode !== mode) return false;
    return true;
  });

  const handleStartExam = (examFormId: string, examMode: string) => {
    router.push(
      `/exam/take?formId=${examFormId}&mode=${examMode}`,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading exams...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Exam Catalog - CCNA Practice Platform</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">CCNA Practice Exams</h1>
            <Link href="/dashboard">
              <Button variant="secondary">My Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blueprint
              </label>
              <select
                value={selectedBlueprint || ''}
                onChange={(e) => setSelectedBlueprint(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Blueprints</option>
                {blueprints.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Modes</option>
                <option value="SIMULATION">Simulation</option>
                <option value="STUDY">Study</option>
              </select>
            </div>
          </div>

          {/* Exams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.length === 0 ? (
              <Card className="col-span-full text-center py-12">
                <p className="text-gray-600">No exams available</p>
              </Card>
            ) : (
              filteredExams.map((exam) => (
                <Card key={exam.id}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg">{exam.name}</h3>
                    <Badge variant={exam.mode === 'SIMULATION' ? 'primary' : 'secondary'}>
                      {exam.mode}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {exam.blueprint.name}
                  </p>

                  <div className="space-y-2 mb-6 text-sm text-gray-700">
                    <p>📝 {exam.questionCount} questions</p>
                    <p>⏱ {exam.timeLimitMinutes} minutes</p>
                  </div>

                  <Button
                    onClick={() => handleStartExam(exam.id, exam.mode)}
                    className="w-full"
                  >
                    Start Exam
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamsPage;
