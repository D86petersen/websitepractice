import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>CCNA 200-301 Practice Exam Platform</title>
        <meta
          name="description"
          content="Take realistic practice exams for Cisco CCNA 200-301 certification. Multiple exam types, domain-focused practice, and detailed analytics."
        />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">CCNA Platform</h1>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Master the Cisco CCNA 200-301
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Realistic practice exams aligned to the official blueprint. Study
              like you'll test with simulation mode, study mode with instant
              feedback, and detailed domain analytics.
            </p>
            <Link href="/register">
              <Button size="lg">Start Practicing Now</Button>
            </Link>
          </div>

          {/* Disclaimer */}
          <Card className="bg-blue-50 border border-blue-200 mb-12">
            <p className="text-sm text-blue-900">
              <strong>Important:</strong> This is an independent CCNA practice
              platform. Our questions are original and based on publicly
              available exam topics and Cisco documentation, not brain dumps or
              official exam content. For the official exam, visit{' '}
              <a href="https://learningnetwork.cisco.com" target="_blank" rel="noopener">
                Cisco Learning Network
              </a>
              .
            </p>
          </Card>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: 'Full Simulations',
                  description:
                    'Complete 120-question exams matching the official blueprint distribution',
                  icon: '🎯',
                },
                {
                  title: 'Domain Practice',
                  description:
                    'Focus on specific domains: Network Fundamentals, IP Services, Security, etc.',
                  icon: '📚',
                },
                {
                  title: 'Two Study Modes',
                  description:
                    'Simulation mode (no feedback) or Study mode (instant feedback)',
                  icon: '🔄',
                },
                {
                  title: 'Detailed Analytics',
                  description:
                    'Track progress by domain, identify weak areas, get recommendations',
                  icon: '📊',
                },
              ].map((feature, i) => (
                <Card key={i}>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Exam Types */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h3 className="text-3xl font-bold text-center mb-12">
            Multiple Exam Types
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <h4 className="font-bold text-xl mb-4">Full CCNA Simulation</h4>
              <ul className="space-y-2 text-gray-700 text-sm mb-6">
                <li>✓ ~120 questions (realistic length)</li>
                <li>✓ Blueprint-aligned domain distribution</li>
                <li>✓ 120 minutes (real exam duration)</li>
                <li>✓ No feedback until completion</li>
              </ul>
              <Badge variant="primary">Recommended</Badge>
            </Card>

            <Card>
              <h4 className="font-bold text-xl mb-4">Domain-Focused Quizzes</h4>
              <ul className="space-y-2 text-gray-700 text-sm mb-6">
                <li>✓ Pick 1–3 domains to focus on</li>
                <li>✓ 20–50 questions per session</li>
                <li>✓ Study mode (instant feedback)</li>
                <li>✓ Perfect for targeted practice</li>
              </ul>
              <Badge variant="secondary">Popular</Badge>
            </Card>

            <Card>
              <h4 className="font-bold text-xl mb-4">Short Drills</h4>
              <ul className="space-y-2 text-gray-700 text-sm mb-6">
                <li>✓ Quick 15–20 question drills</li>
                <li>✓ Topics: subnetting, routing, security</li>
                <li>✓ 10–20 minutes</li>
                <li>✓ Great for warm-ups</li>
              </ul>
              <Badge variant="secondary">Quick</Badge>
            </Card>

            <Card>
              <h4 className="font-bold text-xl mb-4">Custom Exams</h4>
              <ul className="space-y-2 text-gray-700 text-sm mb-6">
                <li>✓ Build your own exam</li>
                <li>✓ Choose domains, difficulty, types</li>
                <li>✓ Set question count and time limit</li>
                <li>✓ Maximum flexibility</li>
              </ul>
              <Badge variant="secondary">Advanced</Badge>
            </Card>
          </div>
        </section>

        {/* Six Domains */}
        <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">
              CCNA Blueprint Domains
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Network Fundamentals', weight: '20%' },
                { name: 'Network Access', weight: '20%' },
                { name: 'IP Connectivity', weight: '25%' },
                { name: 'IP Services', weight: '10%' },
                { name: 'Security Fundamentals', weight: '15%' },
                { name: 'Automation & Programmability', weight: '10%' },
              ].map((domain, i) => (
                <Card key={i}>
                  <p className="font-bold mb-2">{domain.name}</p>
                  <p className="text-sm text-gray-600">
                    ~{domain.weight} of exam questions
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-6">Ready to Get Started?</h3>
            <p className="text-lg mb-8">
              Create a free account and take your first practice exam today.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-8 px-4">
          <div className="max-w-7xl mx-auto text-center text-sm">
            <p>
              © 2024 CCNA Practice Platform. Independent study tool. Not
              affiliated with Cisco Systems.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

// Helper Badge component (should be in shared components)
const Badge: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: 'primary' | 'secondary';
  }
> = ({ variant = 'primary', children, className = '' }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
      variant === 'primary'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800'
    } ${className}`}
  >
    {children}
  </span>
);

export default Home;
