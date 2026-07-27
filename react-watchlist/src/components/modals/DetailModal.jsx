import React, { useEffect } from 'react';
import { config } from '../../services/tmdb';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { Check } from 'lucide-react';

const DetailModal = ({ show, data, onClose }) => {
    const { watchlist, addToWatchlist } = useWatchlist();
    const { user } = useAuth();

    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open');
        } else {
            // Need to be careful here if another modal is open, but assuming one modal at a time for simplicity in this port
            document.body.classList.remove('modal-open');
        }
    }, [show]);

    if (!show || !data) return null;

    const type = data.title ? 'movie' : 'series';
    const providers = data['watch/providers']?.results[config.region] || data['watch/providers']?.results['US'];
    const imdbId = data.external_ids?.imdb_id;
    
    // Check if in watchlist
    const listType = type === 'movie' ? 'movies' : 'series';
    const isInWatchlist = user && watchlist[listType]?.some(item => item.id === data.id);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget || e.target.closest('.close-detail-btn')) {
            onClose();
        }
    };

    return (
        <div id="detailModalOverlay" className={`modal-overlay show`} onClick={handleBackdropClick}>
            <div className="modal-container">
                <button className="close-detail-btn" onClick={onClose}>&times;</button>
                <div className="detail-content-wrapper">
                    <div className="detail-poster">
                        <img 
                            src={data.poster_path ? `${config.tmdbImageBaseUrl}${data.poster_path}` : config.placeholder} 
                            alt={data.title || data.name} 
                        />
                    </div>
                    <div className="detail-info">
                        <h1>{data.title || data.name}</h1>
                        <div className="meta">
                            <span>{new Date(data.release_date || data.first_air_date).getFullYear() || ''}</span>
                            {data.runtime ? <span> &bull; {data.runtime} min</span> : ''}
                        </div>
                        <h2>Synopsis</h2>
                        <p className="plot">{data.overview || 'Not available.'}</p>
                        
                        <h2>Ratings</h2>
                        <div className="ratings">
                            <span>TMDb: <b>{data.vote_average ? data.vote_average.toFixed(1) : 'N/A'}</b>/10</span>
                            {imdbId && (
                                <a href={`https://www.imdb.com/title/${imdbId}`} target="_blank" rel="noopener noreferrer" className="imdb-link">
                                    IMDb
                                </a>
                            )}
                        </div>
                        
                        <h2>Where to Watch</h2>
                        <div className="providers-list">
                            {providers?.flatrate ? (
                                providers.flatrate.map(p => (
                                    <img 
                                        key={p.provider_id} 
                                        src={`${config.tmdbImageBaseUrl}${p.logo_path}`} 
                                        title={p.provider_name}
                                        alt={p.provider_name}
                                    />
                                ))
                            ) : (
                                <p className="subtle">Not available for streaming.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="add-btn-container">
                        {!isInWatchlist ? (
                            <button className="add-to-list-btn" onClick={() => addToWatchlist(data, type)}>
                                Add to Watchlist
                            </button>
                        ) : (
                            <p className="success-text">
                                <Check size={20} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> In Watchlist
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;
