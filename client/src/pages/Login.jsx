import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/slices/authSlice';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      dispatch(setAuth(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ag-card w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading text-primary mb-2">Welcome Back</h1>
          <p className="text-textSecondary">Sign in to continue to ConnectSphere</p>
        </div>

        {serverError && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register('email')} className="ag-input" placeholder="you@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" {...register('password')} className="ag-input" placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" className="ag-btn w-full">Sign In</button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-2">
          <span className="h-px bg-border flex-1"></span>
          <span className="text-sm text-textSecondary">OR</span>
          <span className="h-px bg-border flex-1"></span>
        </div>

        <button onClick={handleGoogleLogin} className="mt-6 w-full ag-input flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>

        <p className="text-center mt-6 text-sm text-textSecondary">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
