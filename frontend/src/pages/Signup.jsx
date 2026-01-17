import { useState } from 'react';
import api from '../services/api';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    await api.post('/auth/signup', { email, password });
    alert('OTP sent to email');
  };

  return (
    <>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Sign Up</button>
    </>
  );
}
