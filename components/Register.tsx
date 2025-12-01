import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { registerUser } from '../services/db';
import type { User } from '../types';

interface RegisterProps {
  onRegisterSuccess: (user: User) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }

    setIsLoading(true);

    try {
      const newUser = await registerUser(email, password);
      onRegisterSuccess(newUser);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="flex items-center space-x-3 mb-8">
        <svg className="w-10 h-10 text-calm-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
            <path d="M12 6C9.24 6 7 8.24 7 11C7 12.76 7.84 14.33 9.11 15.33L12 18L14.89 15.33C16.16 14.33 17 12.76 17 11C17 8.24 14.76 6 12 6Z" fill="currentColor" fillOpacity="0.5"/>
        </svg>
        <h1 className="text-4xl font-bold text-calm-blue-800 dark:text-calm-blue-300">Aether</h1>
      </div>

      <Card className="w-full max-w-sm">
        <form onSubmit={handleRegister} className="p-8 space-y-6">
          <h2 className="text-center text-2xl font-semibold text-calm-blue-800 dark:text-calm-blue-300">Create Account</h2>
          
          <div>
            <label htmlFor="email-register" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              id="email-register"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 dark:placeholder-slate-400 text-slate-800 dark:text-slate-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password-register"  className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password-register"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-calm-blue-500 focus:border-calm-blue-500 dark:placeholder-slate-400 text-slate-800 dark:text-slate-200"
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <div>
            <Button type="submit" disabled={isLoading} className="w-full flex justify-center">
              {isLoading ? <Spinner /> : 'Sign Up'}
            </Button>
          </div>
           <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="font-semibold text-calm-blue-600 hover:underline dark:text-calm-blue-400">
              Log in
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Register;