import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../../services/firebase';
import { Mail, Key, LogIn, UserPlus } from 'lucide-react';

const AuthModal = ({ show, onClose }) => {
    const { loginWithGoogle } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
    }, [show]);

    if (!show) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleGoogle = async () => {
        try {
            await loginWithGoogle();
            onClose();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                // Implement email login in AuthContext or use service directly
                // await signInWithEmail(email, password);
                alert("Email auth is currently a placeholder for this demo. Use Google Sign-in!");
            } else {
                // await signUpWithEmail(email, password);
            }
            // onClose();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className={`modal-overlay show`} onClick={handleBackdropClick}>
            <div className="auth-container">
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                <button className="google-btn" onClick={handleGoogle}>
                    <i className="fa-brands fa-google" style={{ color: '#DB4437' }}></i> Continue with Google
                </button>
                <div className="divider"><span>OR</span></div>
                
                <form id="emailLoginForm" onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        required 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        required 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button type="submit" className="email-btn">
                        {isLogin ? 'Login with Email' : 'Sign Up with Email'}
                    </button>
                </form>
                
                <a 
                    href="#" 
                    className="toggle-auth" 
                    onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }}
                >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </a>
            </div>
        </div>
    );
};

export default AuthModal;
