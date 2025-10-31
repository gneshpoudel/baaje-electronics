import { useState } from 'react';
import axios from 'axios';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import './AuthModal.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthModal = ({ mode, onClose, onLogin, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      onLogin(response.data.user, response.data.token);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
    } catch (error) {
      const message = error.response?.data?.detail || 'An error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login will be available soon!`);
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="auth-modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="auth-modal">
        <button className="modal-close" onClick={onClose} data-testid="auth-modal-close">
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title" data-testid="auth-modal-title">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="modal-subtitle">
            {mode === 'login' ? 'Login to your account' : 'Sign up to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" data-testid="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name" data-testid="label-name">Full Name</label>
              <div className="input-group">
                <UserIcon size={20} className="input-icon" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  data-testid="input-name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" data-testid="label-email">Email</label>
            <div className="input-group">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" data-testid="label-password">Password</label>
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                minLength="6"
                data-testid="input-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="divider" data-testid="divider">
          <span>OR</span>
        </div>

        <div className="social-login">
          <button
            className="social-btn google-btn"
            onClick={() => handleSocialLogin('Google')}
            data-testid="google-login-button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            className="social-btn facebook-btn"
            onClick={() => handleSocialLogin('Facebook')}
            data-testid="facebook-login-button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>
        </div>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p data-testid="switch-to-signup">
              Don't have an account?{' '}
              <button onClick={() => onSwitchMode('signup')} data-testid="switch-signup-button">
                Sign Up
              </button>
            </p>
          ) : (
            <p data-testid="switch-to-login">
              Already have an account?{' '}
              <button onClick={() => onSwitchMode('login')} data-testid="switch-login-button">
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
