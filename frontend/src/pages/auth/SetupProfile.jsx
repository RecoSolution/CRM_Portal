import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupProfile } from '../../utils/authApi';
import { useAuth } from '../../context/AuthContext';

export default function SetupProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await setupProfile({ firstName, lastName, jobTitle, phone });
      updateUser(res.data.user);
      navigate('/profile-complete');
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
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-6 pb-10'>
      <button
        onClick={() => navigate(-1)}
        className='w-10 h-10 flex items-center justify-center -ml-1 mb-4'
      >
        <img
          src='/assets/icons/arrow-left.svg'
          alt='back'
          className='w-5 h-5'
        />
      </button>

      <h1 className='text-center text-[20px] font-bold text-gray-900 mb-2'>
        Set Up Your Profile
      </h1>
      <p className='text-center text-[13px] text-gray-600 mb-8 leading-relaxed px-4'>
        Provide your details to help identify contact ownership and
        collaboration.
      </p>

      <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3'>
            {error}
          </div>
        )}

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            First Name
          </label>
          <input
            type='text'
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            Last Name
          </label>
          <input
            type='text'
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            Job Title
          </label>
          <input
            type='text'
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            Phone Number
          </label>
          <input
            type='tel'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-500 mb-2'>
            Professional Email
          </label>
          <input
            type='email'
            value={user?.email || ''}
            disabled
            className='w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-transparent border-[1.5px] border-forest/60 outline-none'
          />
        </div>

        <div className='mt-4'>
          <button
            type='submit'
            disabled={loading}
            className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60'
          >
            {loading ? 'Please wait...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
