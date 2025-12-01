import React from 'react';
import Button from './common/Button';
import { ReflectionsIcon, GoalIcon, WellnessIcon, InsightsIcon } from './common/Icons';

interface HomeProps {
  onNavigateToAuth: (view: 'login' | 'register') => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-center w-12 h-12 bg-calm-blue-100 dark:bg-slate-700 rounded-full text-calm-blue-600 dark:text-calm-blue-300 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400">{children}</p>
  </div>
);

const Home: React.FC<HomeProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="text-slate-800 dark:text-slate-300 font-sans min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto flex items-center justify-between p-4 max-w-5xl">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-calm-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
              <path d="M12 6C9.24 6 7 8.24 7 11C7 12.76 7.84 14.33 9.11 15.33L12 18L14.89 15.33C16.16 14.33 17 12.76 17 11C17 8.24 14.76 6 12 6Z" fill="currentColor" fillOpacity="0.5"/>
            </svg>
            <h1 className="text-2xl font-bold text-calm-blue-800 dark:text-calm-blue-300">Aether</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => onNavigateToAuth('login')}>Log In</Button>
            <Button onClick={() => onNavigateToAuth('register')}>Sign Up</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative text-center py-20 md:py-32 px-4 overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(2,132,199,0.3),rgba(15,23,42,0))]"></div>
          </div>
          <div className="container mx-auto max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-calm-blue-900 dark:text-white mb-4 leading-tight">
              Find Your Center, <br/> Understand Your Mind.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Aether is an intelligent journal and wellness companion designed to help you navigate your inner world, achieve your goals, and cultivate a more balanced life.
            </p>
            <Button onClick={() => onNavigateToAuth('register')} className="px-8 py-3 text-lg">
              Get Started for Free
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-white dark:bg-slate-800/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-calm-blue-800 dark:text-calm-blue-200">A Path to Self-Discovery</h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Everything you need to reflect, grow, and thrive.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard icon={<ReflectionsIcon />} title="AI-Powered Reflections">
                Record your thoughts and let Aether provide gentle insights, helping you connect your emotions to your well-being.
              </FeatureCard>
              <FeatureCard icon={<GoalIcon />} title="Intentional Goal Setting">
                Define, track, and achieve your short-term and long-term goals with motivational support to keep you on track.
              </FeatureCard>
              <FeatureCard icon={<WellnessIcon />} title="Guided Wellness">
                Access interactive exercises like guided breathing and grounding techniques to find calm whenever you need it.
              </FeatureCard>
              <FeatureCard icon={<InsightsIcon />} title="Personalized Insights">
                Visualize your mood trends and gain a deeper understanding of your emotional patterns over time.
              </FeatureCard>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="text-center py-20 px-4">
            <div className="container mx-auto max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-calm-blue-800 dark:text-calm-blue-200 mb-4">Ready to Begin Your Journey?</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    Start your path to self-awareness and personal growth today. It's free to get started.
                </p>
                <Button onClick={() => onNavigateToAuth('register')} className="px-8 py-3 text-lg">
                    Sign Up Now
                </Button>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-5xl p-4 text-center text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} Aether. Your companion for body, mind, and soul.
        </div>
      </footer>
    </div>
  );
};

export default Home;