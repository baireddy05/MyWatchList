import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Moon, LogIn, LogOut } from 'lucide-react';
import logoSvg from '../assets/logo.svg';
import logoPng from '../assets/logo.png';

const Header = ({ setShowAuthModal, isDarkMode, setIsDarkMode }) => {
    const { user, logout } = useAuth();

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    return (
        <header>
            <div className="brand-logo">
                <img 
                    src={logoSvg} 
                    alt="My Watchlist Logo" 
                    className="app-logo-img"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = logoPng;
                    }}
                />
                <h1>My Watchlist</h1>
            </div>
            <div className="header-actions">
                <button 
                    className="dark-mode-toggle" 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    title="Toggle Dark Mode"
                >
                    <Moon size={20} />
                </button>
                {user ? (
                    <button className="auth-btn outline desktop-only" onClick={logout}>
                        <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                    </button>
                ) : (
                    <button className="auth-btn outline desktop-only" onClick={() => setShowAuthModal(true)}>
                        <LogIn size={16} style={{ marginRight: '8px' }} /> Login
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
