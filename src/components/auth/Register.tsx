import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Eye, EyeOff, Zap, Rocket } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>();

  const password = watch('password');

  const getPasswordStrength = (password: string) => {
    const length = password.length;
    if (length >= 12) return { strength: 4, label: 'Very Strong', className: 'bg-green-500' };
    if (length >= 10) return { strength: 3, label: 'Strong', className: 'bg-yellow-400' };
    if (length >= 8) return { strength: 2, label: 'Medium', className: 'bg-orange-400' };
    if (length >= 6) return { strength: 1, label: 'Weak', className: 'bg-red-600' };
    return { strength: 0, label: '', className: '' };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const response = await authAPI.register(data.username, data.email, data.password);
      const { user, token } = response.data;

      setAuth(user, token);
      toast.success('Your Sith training begins now...');

      setShowRocket(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'The path to the dark side is blocked');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center space-bg px-4 text-white relative overflow-hidden">
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
            Begin Your Training
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Join the Sith Order and embrace unlimited power
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 bg-opacity-90 backdrop-blur-md p-8 rounded-xl shadow-2xl space-y-6 border border-red-900 sith-glow">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-red-400 mb-1">
              Sith Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-red-600" />
              <input
                {...register('username', {
                  required: 'Sith name is required',
                  minLength: { value: 3, message: 'Minimum 3 characters' },
                  maxLength: { value: 20, message: 'Maximum 20 characters' },
                })}
                id="username"
                type="text"
                placeholder="Choose your Sith name"
                className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-800 border border-red-700 text-red-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-red-400 mb-1">
              Email Address
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
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-800 border border-red-700 text-red-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-red-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-red-600" />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
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
            {password && (
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.className}`}
                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Password strength:{' '}
                  <span className={
                    passwordStrength.strength === 1 ? 'text-red-400' :
                    passwordStrength.strength === 2 ? 'text-orange-400' :
                    passwordStrength.strength === 3 ? 'text-yellow-400' :
                    passwordStrength.strength === 4 ? 'text-green-400' : ''
                  }>
                    {passwordStrength.label}
                  </span>
                </p>
              </div>
            )}
            {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-red-400 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-red-600" />
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match',
                })}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="w-full pl-10 pr-10 py-2 rounded-md bg-gray-800 border border-red-700 text-red-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-red-500"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-md bg-gradient-to-r from-red-500 to-red-700 text-black font-semibold hover:from-red-600 hover:to-red-800 transition-all disabled:opacity-50 sith-glow"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                Joining the Order...
              </div>
            ) : (
              'Join the Sith Order'
            )}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already a Sith Lord?{' '}
            <Link to="/login" className="text-red-500 hover:text-red-400 sith-text-glow">
              Return to the dark side
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
