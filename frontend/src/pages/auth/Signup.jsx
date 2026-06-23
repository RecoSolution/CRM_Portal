import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../utils/authApi';

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // firstName/lastName collected later in "Complete the Profile" step,
      // so we send placeholder values here since backend requires them
      const res = await registerUser({
        email,
        password,
      });
      navigate('/verify-otp', {
        state: { email: res.data.email, flow: 'signup' },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-10 pb-10'>
      <img
        src='/assets/illustrations/create-account.png'
        alt='Create your account'
        className='w-[170px] h-[150px] mx-auto mb-6 object-contain'
      />

      <h1 className='text-center text-[20px] font-bold text-gray-900 mb-8'>
        Create Your Account
      </h1>

      <form onSubmit={handleSignup} className='flex flex-col gap-6'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3'>
            {error}
          </div>
        )}

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            Email
          </label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            Create Password
          </label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            Confirm Password
          </label>
          <input
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none'
          />
        </div>

        <p className='text-center text-[13px] text-gray-600'>
          Already have an Account?{' '}
          <Link to='/login' className='text-forest font-semibold underline'>
            Sign In
          </Link>
        </p>

        <button
          type='submit'
          disabled={loading}
          className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60'
        >
          {loading ? 'Please wait...' : 'SIGN UP'}
        </button>
      </form>
    </div>
  );
}
