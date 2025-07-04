import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, Zap, Rocket } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await authAPI.login(data.email, data.password);
      const { user, token } = response.data;

      setAuth(user, token);
      toast.success('Welcome to the dark side...');

      setShowRocket(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'The Force is not with you');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center space-bg text-white px-4 relative overflow-hidden">
      {/* Rocket animation */}
      {showRocket && (
        <div className="absolute top-10 animate-bounce z-50">
          <Rocket className="w-16 h-16 text-red-500" />
        </div>
      )}

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg">
            <Zap className="h-8 w-8 text-red-300" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-red-500 sith-text-glow">
            Join the Dark Side
          </h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to embrace the power of the Sith</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 bg-opacity-80 backdrop-blur-md p-8 rounded-xl shadow-2xl space-y-6 border border-red-900 sith-glow">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-red-400 mb-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-red-600" />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                id="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-800 border border-red-700 text-red-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-red-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-red-600" />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2 rounded-md bg-gray-800 border border-red-700 text-red-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-red-500"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-md bg-gradient-to-r from-red-500 to-red-700 text-black font-semibold hover:from-red-600 hover:to-red-800 transition-all disabled:opacity-50 sith-glow"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                Channeling the Force...
              </div>
            ) : (
              'Embrace the Dark Side'
            )}
          </button>

          <p className="text-center text-sm text-gray-400">
            New to the Sith Order?{' '}
            <Link to="/register" className="text-red-500 hover:text-red-400 sith-text-glow">
              Begin your training
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
