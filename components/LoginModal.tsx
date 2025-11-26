import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginModal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: loginError } = await login(email, password, rememberMe);

    if (loginError) {
      setError(loginError.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)' }}>
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 border" style={{ borderColor: 'rgba(44, 44, 44, 0.08)' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif mb-2" style={{ color: '#2C2C2C', fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '0.01em' }}>
            PSM Jewelry
          </h1>
          <p className="text-sm" style={{ color: '#8B8680' }}>Sign in to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8B8680' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Username"
              required
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
              style={{ 
                backgroundColor: '#FDFBF7', 
                border: '1px solid rgba(44, 44, 44, 0.08)',
                color: '#2C2C2C'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#B8941F';
                e.target.style.boxShadow = '0 0 0 2px rgba(184, 148, 31, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(44, 44, 44, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8B8680' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 pr-12"
                style={{ 
                  backgroundColor: '#FDFBF7', 
                  border: '1px solid rgba(44, 44, 44, 0.08)',
                  color: '#2C2C2C'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#B8941F';
                  e.target.style.boxShadow = '0 0 0 2px rgba(184, 148, 31, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(44, 44, 44, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                style={{ color: '#8B8680' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#2C2C2C'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8B8680'}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded focus:ring-2"
              style={{ 
                accentColor: '#B8941F',
                backgroundColor: '#FDFBF7',
                borderColor: 'rgba(44, 44, 44, 0.2)'
              }}
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm" style={{ color: '#8B8680' }}>
              Remember me
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ 
              background: 'linear-gradient(to right, #B8941F, #D4AF37)',
              letterSpacing: '0.03em'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'linear-gradient(to right, #9A7D19, #B8941F)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #B8941F, #D4AF37)';
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center text-xs" style={{ color: '#8B8680' }}>
          Contact your administrator if you need access
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
