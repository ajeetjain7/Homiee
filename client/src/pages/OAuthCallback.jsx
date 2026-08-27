import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const isNew = searchParams.get('isNew') === 'true';

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(user));

        toast.success(`Welcome back, ${user.name || 'Innovator'}!`);

        const isComplete = Boolean(user.profileComplete || user.isProfileComplete);

        if (!isComplete || isNew) {
          navigate('/teammates', { replace: true, state: { openSetup: true } });
        } else {
          navigate('/teammates', { replace: true });
        }
      } catch (err) {
        console.error('Failed to parse OAuth user param:', err);
        navigate('/login?error=Failed+to+process+login', { replace: true });
      }
    } else {
      const error = searchParams.get('error') || 'Authentication failed';
      toast.error(decodeURIComponent(error));
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center text-white font-sans select-none">
      <div className="bg-[#0B132B] border border-amber-500/40 p-8 rounded-2xl text-center space-y-4 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black font-black text-2xl flex items-center justify-center mx-auto animate-bounce">
          ⚡
        </div>
        <h2 className="text-lg font-black text-white">Completing Secure Sign-in</h2>
        <p className="text-xs text-gray-400 font-mono">Syncing your SIH innovator credentials...</p>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-amber-500 h-full w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;

