import React, { useState } from 'react';
import api from '../utils/api';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    try {
      const { data } = await api.post(endpoint, { email, password });
      if (isLogin) {
        localStorage.setItem('token', data.token);
        onLogin(data.email);
      } else {
        setIsLogin(true);
        alert('Registration successful! Please log in.');
      }
    } catch (err: any) {
      console.error('Frontend Auth Error:', err);
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="subtitle">{isLogin ? 'Verify your authenticity in real-time' : 'Join Vi-Notes to secure your authorship'}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <Mail size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <Lock size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary-btn">
            {isLogin ? 'Login' : 'Sign Up'} <ArrowRight size={18} />
          </button>
        </form>
        
        <p className="toggle-auth">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
