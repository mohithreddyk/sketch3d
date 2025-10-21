
import React, { useState } from 'react';
import { CubeIcon } from './icons/CubeIcon';
import { UserIcon } from './icons/UserIcon';
import { LockIcon } from './icons/LockIcon';

interface LoginPageProps {
  onLogin: () => void;
  onNavigateToSignUp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    onLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100 text-content antialiased p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="w-full max-w-md p-8 space-y-8 bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-2xl shadow-2xl animate-fade-in z-10">
        <div className="text-center">
            <div className="inline-block relative mb-4">
                <CubeIcon className="w-16 h-16 text-brand-primary" />
                <CubeIcon className="w-16 h-16 text-brand-primary absolute top-0 left-0 animate-glow opacity-75" />
            </div>
          <h1 className="text-3xl font-bold tracking-wider">
            Sketch-to-3D <span className="text-brand-primary font-bold">Mesh AI</span>
          </h1>
          <p className="mt-2 text-content-muted">Sign in to the AI workspace.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <UserIcon className="w-5 h-5 text-content-muted" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 p-3 bg-base-300/70 text-content border border-base-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
              placeholder="Email address"
              required
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <LockIcon className="w-5 h-5 text-content-muted" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 bg-base-300/70 text-content border border-base-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
              placeholder="Password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50"
            >
              Sign In
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-content-muted">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="font-semibold text-brand-primary hover:underline focus:outline-none"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};