import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Login is now handled inside the Signup page via tab switching.
// This redirect ensures any /login links still work.
const Login = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/signup', { replace: true }); }, [navigate]);
  return null;
};

export default Login;
