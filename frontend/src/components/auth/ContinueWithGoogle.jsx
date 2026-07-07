import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../config/api';
import { saveAuth } from '../../utils/auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const ContinueWithGoogle = ({ onError }) => {
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(400);
  const navigate = useNavigate();

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setButtonWidth(Math.max(containerRef.current.offsetWidth, 280));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleSuccess = useCallback(async (credentialResponse) => {
    try {
      const data = await apiPost('/api/users/google-login', {
        credential: credentialResponse.credential,
      });
      saveAuth(data);
      navigate('/dashboard');
    } catch (err) {
      onError?.(err.message || 'Google login failed');
    }
  }, [navigate, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="google-btn google-btn--disabled"
        title="Set VITE_GOOGLE_CLIENT_ID in frontend/.env"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    );
  }

  return (
    <div ref={containerRef} className="google-btn-wrap">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.('Google login failed')}
        text="continue_with"
        theme="outline"
        size="large"
        shape="rectangular"
        width={buttonWidth}
      />
    </div>
  );
};

export default ContinueWithGoogle;
