import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/slices/authSlice';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      dispatch(setAuth(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ag-card w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading text-primary mb-2">Create Account</h1>
          <p className="text-textSecondary">Join ConnectSphere today</p>
        </div>

        {serverError && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input {...register('name')} className="ag-input" placeholder="John Doe" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

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

          <button type="submit" className="ag-btn w-full">Sign Up</button>
        </form>

        <p className="text-center mt-6 text-sm text-textSecondary">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
