import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SearchBar from './components/SearchBar';
import GridItem from './components/GridItem';
import AuthModal from './components/modals/AuthModal';
import DetailModal from './components/modals/DetailModal';
import { useAuth } from './contexts/AuthContext';
import { useWatchlist } from './contexts/WatchlistContext';
import { tmdb } from './services/tmdb';

function App() {
    const { user } = useAuth();
    const { watchlist } = useWatchlist();
    const [activeTab, setActiveTab] = useState('movies');
    const [isDarkMode, setIsDarkMode] = useState(
        localStorage.getItem('isDarkMode') === 'true'
    );
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        localStorage.setItem('isDarkMode', isDarkMode);
    }, [isDarkMode]);

    // Handle History API for Modals
    useEffect(() => {
        const handlePopState = () => {
            if (showDetailModal) {
                setShowDetailModal(false);
            } else if (showAuthModal) {
                setShowAuthModal(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [showDetailModal, showAuthModal]);

    const handleSelectSearchItem = async (id, type) => {
        const data = await tmdb.getDetails(id, type);
        setDetailData(data);
        setShowDetailModal(true);
        history.pushState({ modal: 'detail' }, '');
    };

    const handleGridItemClick = async (item) => {
        // Find if it's a movie or tv series based on activeTab
        const type = activeTab === 'movies' ? 'movie' : 'series';
        const data = await tmdb.getDetails(item.id, type);
        setDetailData(data);
        setShowDetailModal(true);
        history.pushState({ modal: 'detail' }, '');
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        if (history.state && history.state.modal === 'detail') {
            history.back();
        }
    };

    const handleCloseAuth = () => {
        setShowAuthModal(false);
        if (history.state && history.state.modal === 'auth') {
            history.back();
        }
    };

    const openAuthModal = () => {
        setShowAuthModal(true);
        history.pushState({ modal: 'auth' }, '');
    };

    return (
        <div className="container">
            <Header 
                setShowAuthModal={openAuthModal} 
                isDarkMode={isDarkMode} 
                setIsDarkMode={setIsDarkMode} 
            />

            <SearchBar onSelect={handleSelectSearchItem} />

            <div className="tabs desktop-only">
                <button 
                    className={`tab-button ${activeTab === 'movies' ? 'active' : ''}`}
                    onClick={() => setActiveTab('movies')}
                >
                    Movies
                </button>
                <button 
                    className={`tab-button ${activeTab === 'series' ? 'active' : ''}`}
                    onClick={() => setActiveTab('series')}
                >
                    Series
                </button>
            </div>

            <main>
                {!user ? (
                    <div className="auth-prompt">
                        <h2>Please login to view your watchlist</h2>
                        <button className="auth-btn email-btn" onClick={openAuthModal}>
                            Login
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={`bucket-list ${activeTab === 'movies' ? 'active' : ''}`}>
                            <div className="list-category">
                                <h2>Your Movies</h2>
                                {watchlist.movies.length === 0 ? (
                                    <p className="empty-msg">No movies in your list yet. Start searching!</p>
                                ) : (
                                    <div className="item-grid">
                                        {watchlist.movies.map(movie => (
                                            <GridItem key={movie.id} item={movie} type="movie" onClick={handleGridItemClick} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`bucket-list ${activeTab === 'series' ? 'active' : ''}`}>
                            <div className="list-category">
                                <h2>Your Series</h2>
                                {watchlist.series.length === 0 ? (
                                    <p className="empty-msg">No series in your list yet. Start searching!</p>
                                ) : (
                                    <div className="item-grid">
                                        {watchlist.series.map(series => (
                                            <GridItem key={series.id} item={series} type="series" onClick={handleGridItemClick} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <AuthModal show={showAuthModal} onClose={handleCloseAuth} />
            <DetailModal show={showDetailModal} data={detailData} onClose={handleCloseDetail} />
        </div>
    );
}

export default App;
