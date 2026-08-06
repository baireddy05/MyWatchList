import React, { useEffect } from 'react';
import { config } from '../../services/tmdb';
import { useWatchlist, calculateSeriesProgress } from '../../contexts/WatchlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Plus, Minus, CheckCircle2, Play, Tv } from 'lucide-react';

const DetailModal = ({ show, data, onClose }) => {
    const { watchlist, addToWatchlist, updateSeriesProgress, incrementEpisode, decrementEpisode } = useWatchlist();
    const { user } = useAuth();

    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
    }, [show]);

    if (!show || !data) return null;

    const isMovie = Boolean(data.title);
    const type = isMovie ? 'movie' : 'series';
    const providers = data['watch/providers']?.results[config.region] || data['watch/providers']?.results['US'];
    const imdbId = data.external_ids?.imdb_id;
    
    // Check if in watchlist
    const listType = isMovie ? 'movies' : 'series';
    const watchlistItem = user && watchlist[listType]?.find(item => item.id === data.id);
    const isInWatchlist = Boolean(watchlistItem);

    // Regular seasons for TV
    const regularSeasons = !isMovie && data.seasons 
        ? data.seasons.filter(s => s.season_number > 0)
        : [];
    const totalSeasons = data.number_of_seasons || regularSeasons.length || 1;
    const totalEpisodes = data.number_of_episodes || regularSeasons.reduce((acc, s) => acc + (s.episode_count || 0), 0) || 0;

    // Series progress metrics if in watchlist
    const seriesProgressItem = watchlistItem ? {
        ...watchlistItem,
        total_seasons: watchlistItem.total_seasons || totalSeasons,
        total_episodes: watchlistItem.total_episodes || totalEpisodes,
        seasons_detail: watchlistItem.seasons_detail?.length ? watchlistItem.seasons_detail : regularSeasons.map(s => ({
            season_number: s.season_number,
            episode_count: s.episode_count || 0,
            name: s.name || `Season ${s.season_number}`
        }))
    } : null;

    const progress = seriesProgressItem ? calculateSeriesProgress(seriesProgressItem) : null;
    const currentSeasonNum = seriesProgressItem?.currentSeason || 1;
    const currentEpisodeNum = seriesProgressItem?.currentEpisode || 0;

    const curSeasonObj = regularSeasons.find(s => s.season_number === currentSeasonNum);
    const curSeasonMaxEp = curSeasonObj?.episode_count || (regularSeasons.length > 0 ? 0 : Math.ceil(totalEpisodes / totalSeasons));

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget || e.target.closest('.close-detail-btn')) {
            onClose();
        }
    };

    const handleSeasonChange = (newSeason) => {
        const seasonNum = Number(newSeason);
        updateSeriesProgress(data.id, {
            currentSeason: seasonNum,
            currentEpisode: 1,
            status: 'watching',
            watched: false
        });
    };

    const handleEpisodeChange = (newEp) => {
        const epNum = Number(newEp);
        updateSeriesProgress(data.id, {
            currentSeason: currentSeasonNum,
            currentEpisode: epNum,
            status: epNum > 0 ? 'watching' : 'plan_to_watch',
            watched: false
        });
    };

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'completed') {
            updateSeriesProgress(data.id, {
                status: 'completed',
                watched: true,
                currentEpisode: totalEpisodes
            });
        } else if (newStatus === 'watching') {
            updateSeriesProgress(data.id, {
                status: 'watching',
                watched: false,
                currentEpisode: currentEpisodeNum > 0 ? currentEpisodeNum : 1
            });
        } else {
            // Plan to watch
            updateSeriesProgress(data.id, {
                status: 'plan_to_watch',
                watched: false,
                currentEpisode: 0
            });
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
                            {isMovie && data.runtime ? <span> &bull; {data.runtime} min</span> : null}
                            {!isMovie && (
                                <span>
                                    {' '}&bull; {totalSeasons} {totalSeasons === 1 ? 'Season' : 'Seasons'}
                                    {totalEpisodes > 0 ? ` • ${totalEpisodes} Episodes` : ''}
                                </span>
                            )}
                        </div>

                        {/* Interactive Progress Card for Series in Watchlist */}
                        {!isMovie && isInWatchlist && seriesProgressItem && (
                            <div className="modal-progress-section">
                                <div className="modal-progress-header">
                                    <div className="modal-progress-title">
                                        <Tv size={18} />
                                        <span>Your Watch Progress</span>
                                    </div>
                                    <div className="modal-status-pills">
                                        <button 
                                            className={`status-pill ${seriesProgressItem.status === 'plan_to_watch' ? 'active' : ''}`}
                                            onClick={() => handleStatusChange('plan_to_watch')}
                                        >
                                            Plan to Watch
                                        </button>
                                        <button 
                                            className={`status-pill ${seriesProgressItem.status === 'watching' ? 'active' : ''}`}
                                            onClick={() => handleStatusChange('watching')}
                                        >
                                            Watching
                                        </button>
                                        <button 
                                            className={`status-pill ${seriesProgressItem.status === 'completed' ? 'active' : ''}`}
                                            onClick={() => handleStatusChange('completed')}
                                        >
                                            Completed
                                        </button>
                                    </div>
                                </div>

                                <div className="modal-progress-body">
                                    <div className="modal-selectors-grid">
                                        <div className="modal-selector-box">
                                            <label>Season</label>
                                            <select 
                                                value={currentSeasonNum}
                                                onChange={(e) => handleSeasonChange(e.target.value)}
                                                className="modal-select"
                                            >
                                                {regularSeasons.length > 0 ? (
                                                    regularSeasons.map(s => (
                                                        <option key={s.season_number} value={s.season_number}>
                                                            {s.name || `Season ${s.season_number}`} ({s.episode_count} eps)
                                                        </option>
                                                    ))
                                                ) : (
                                                    Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => (
                                                        <option key={s} value={s}>Season {s}</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        <div className="modal-selector-box">
                                            <label>Episode</label>
                                            <div className="modal-ep-stepper">
                                                <button 
                                                    className="modal-stepper-btn minus"
                                                    onClick={() => decrementEpisode(data.id)}
                                                    disabled={currentEpisodeNum <= 0}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <select 
                                                    value={currentEpisodeNum}
                                                    onChange={(e) => handleEpisodeChange(e.target.value)}
                                                    className="modal-select inline-select"
                                                >
                                                    <option value={0}>0 (Not started)</option>
                                                    {Array.from({ length: curSeasonMaxEp || 30 }, (_, i) => i + 1).map(ep => (
                                                        <option key={ep} value={ep}>Ep {ep}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    className="modal-stepper-btn plus"
                                                    onClick={() => incrementEpisode(data.id)}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-bar-container">
                                        <div className="modal-bar-labels">
                                            <span>Progress: <strong>{progress.watchedCount}</strong> / {progress.totalCount} episodes</span>
                                            <span className="modal-bar-percent">{progress.percentage}%</span>
                                        </div>
                                        <div className="watching-progress-bar-bg">
                                            <div 
                                                className="watching-progress-bar-fill"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
                            <div className="detail-add-actions">
                                <button 
                                    className="add-to-list-btn" 
                                    onClick={() => addToWatchlist(data, type, 'plan_to_watch')}
                                >
                                    <Plus size={16} /> Add to Watchlist
                                </button>
                                {!isMovie && (
                                    <button 
                                        className="add-to-list-btn start-watching-now-btn" 
                                        onClick={() => addToWatchlist(data, type, 'watching')}
                                    >
                                        <Play size={15} fill="currentColor" /> Start Watching
                                    </button>
                                )}
                                <button 
                                    className="add-to-list-btn already-watched-btn" 
                                    onClick={() => addToWatchlist(data, type, 'completed')}
                                >
                                    <CheckCircle2 size={16} /> Already Watched
                                </button>
                            </div>
                        ) : (
                            <div className="detail-in-watchlist-status">
                                <p className="success-text">
                                    <Check size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                                    {watchlistItem.watched ? 'Marked as Watched' : 'In Watchlist'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;

