import React from 'react';
import { config } from '../services/tmdb';
import { useWatchlist, calculateSeriesProgress } from '../contexts/WatchlistContext';
import { Eye, Trash2, Play, CheckCircle2 } from 'lucide-react';

const GridItem = ({ item, type, onClick }) => {
    const { removeFromWatchlist, toggleWatched, updateSeriesProgress } = useWatchlist();

    const handleRemove = (e) => {
        e.stopPropagation();
        removeFromWatchlist(item.id, type);
    };

    const handleToggleWatched = (e) => {
        e.stopPropagation();
        toggleWatched(item.id, type);
    };

    const handleStartWatching = (e) => {
        e.stopPropagation();
        updateSeriesProgress(item.id, {
            status: 'watching',
            currentSeason: item.currentSeason || 1,
            currentEpisode: (item.currentEpisode && item.currentEpisode > 0) ? item.currentEpisode : 1,
            watched: false
        });
    };

    const isSeries = type === 'series';
    const progress = isSeries ? calculateSeriesProgress(item) : null;

    return (
        <div className={`grid-item ${item.watched ? 'item-watched' : ''}`}>
            <a className="poster-link" onClick={() => onClick(item)}>
                <img 
                    src={item.poster_path ? `${config.tmdbImageBaseUrl}${item.poster_path}` : config.placeholder} 
                    alt={item.title} 
                    loading="lazy" 
                />
                {isSeries && item.watched && (
                    <div className="grid-item-badge completed-badge">
                        <CheckCircle2 size={12} /> Completed
                    </div>
                )}
                {isSeries && !item.watched && item.currentEpisode > 0 && (
                    <div className="grid-item-badge progress-badge">
                        S{item.currentSeason || 1}:E{item.currentEpisode} ({progress?.percentage}%)
                    </div>
                )}
            </a>
            <div className="item-content">
                <div>
                    <div className="item-title" title={item.title}>{item.title}</div>
                    <div className="item-year">
                        {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                        {isSeries && item.total_seasons && ` • ${item.total_seasons} ${item.total_seasons === 1 ? 'season' : 'seasons'}`}
                    </div>
                </div>
                <div className="item-actions">
                    {isSeries && !item.watched && item.status !== 'watching' && (
                        <button 
                            className="action-btn start-watching-btn"
                            title="Start Watching"
                            onClick={handleStartWatching}
                        >
                            <Play size={16} fill="currentColor" />
                        </button>
                    )}
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

