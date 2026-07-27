import React from 'react';
import { config } from '../services/tmdb';
import { useWatchlist } from '../contexts/WatchlistContext';
import { Eye, Trash2 } from 'lucide-react';

const GridItem = ({ item, type, onClick }) => {
    const { removeFromWatchlist, toggleWatched } = useWatchlist();

    const handleRemove = (e) => {
        e.stopPropagation();
        // Prompt for confirm in real app, simplified here
        removeFromWatchlist(item.id, type);
    };

    const handleToggleWatched = (e) => {
        e.stopPropagation();
        toggleWatched(item.id, type);
    };

    return (
        <div className="grid-item">
            <a className="poster-link" onClick={() => onClick(item)}>
                <img src={item.poster_path ? `${config.tmdbImageBaseUrl}${item.poster_path}` : config.placeholder} alt={item.title} loading="lazy" />
            </a>
            <div className="item-content">
                <div>
                    <div className="item-title">{item.title}</div>
                    <div className="item-year">{item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}</div>
                </div>
                <div className="item-actions">
                    <button 
                        className={`action-btn toggle-watched ${item.watched ? 'watched' : ''}`}
                        title={item.watched ? "Mark as unwatched" : "Mark as watched"}
                        onClick={handleToggleWatched}
                    >
                        <Eye size={18} />
                    </button>
                    <button 
                        className="action-btn remove" 
                        title="Remove"
                        onClick={handleRemove}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GridItem;
