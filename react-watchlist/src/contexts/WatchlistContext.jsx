import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, doc, onSnapshot, setDoc } from '../services/firebase';

const WatchlistContext = createContext();

export const useWatchlist = () => useContext(WatchlistContext);

// Utility to calculate series progress metrics
export const calculateSeriesProgress = (item) => {
    if (!item) return { watchedCount: 0, totalCount: 0, percentage: 0, currentSeason: 1, currentEpisode: 0, totalSeasons: 1, seasonEpisodeCount: 0 };
    
    const totalSeasons = item.total_seasons || (item.seasons_detail?.length) || 1;
    const seasonsDetail = item.seasons_detail || [];
    
    // Total episodes in regular seasons
    let totalCount = item.total_episodes || 0;
    if (totalCount === 0 && seasonsDetail.length > 0) {
        totalCount = seasonsDetail.reduce((acc, s) => acc + (s.episode_count || 0), 0);
    }
    if (totalCount === 0) totalCount = 1; // Avoid division by 0

    const currentSeason = item.currentSeason || 1;
    const currentEpisode = item.currentEpisode || 0;

    // Current season's episode count
    const curSeasonObj = seasonsDetail.find(s => s.season_number === currentSeason);
    const seasonEpisodeCount = curSeasonObj?.episode_count || (seasonsDetail.length > 0 ? 0 : Math.ceil(totalCount / totalSeasons));

    // Calculate total episodes watched across all seasons
    let watchedCount = 0;
    if (item.watched || item.status === 'completed') {
        watchedCount = totalCount;
    } else if (seasonsDetail.length > 0) {
        for (const s of seasonsDetail) {
            if (s.season_number < currentSeason) {
                watchedCount += (s.episode_count || 0);
            } else if (s.season_number === currentSeason) {
                watchedCount += Math.min(currentEpisode, s.episode_count || currentEpisode);
            }
        }
    } else {
        // Approximate calculation if seasonsDetail not yet populated
        const avgPerSeason = totalCount / totalSeasons;
        watchedCount = Math.min(totalCount, Math.round(((currentSeason - 1) * avgPerSeason) + currentEpisode));
    }

    const percentage = Math.min(100, Math.max(0, Math.round((watchedCount / totalCount) * 100)));

    return {
        watchedCount,
        totalCount,
        percentage,
        currentSeason,
        currentEpisode,
        totalSeasons,
        seasonEpisodeCount
    };
};

export const WatchlistProvider = ({ children }) => {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState({ movies: [], series: [] });

    useEffect(() => {
        if (!user) {
            setWatchlist({ movies: [], series: [] });
            return;
        }

        const docRef = doc(db, "watchlists", user.uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setWatchlist({
                    movies: data.movies || [],
                    series: data.series || []
                });
            } else {
                setDoc(docRef, { movies: [], series: [] });
                setWatchlist({ movies: [], series: [] });
            }
        });

        return unsubscribe;
    }, [user]);

    const saveWatchlistData = async (updatedList) => {
        if (!user) return;
        try {
            await setDoc(doc(db, "watchlists", user.uid), updatedList);
        } catch (error) {
            console.error("Error saving watchlist:", error);
            localStorage.setItem('offline_watchlist', JSON.stringify(updatedList));
            setWatchlist(updatedList);
        }
    };

    const addToWatchlist = async (item, type, initialStatus = 'plan_to_watch') => {
        if (!user) return false;
        
        const listType = type === 'movie' ? 'movies' : 'series';
        if (watchlist[listType].some(i => i.id === item.id)) return true;

        let newItem;
        const isCompleted = initialStatus === 'completed' || initialStatus === 'watched';

        if (type === 'movie') {
            newItem = {
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                release_date: item.release_date || item.first_air_date,
                watched: isCompleted
            };
        } else {
            // TV Series
            const regularSeasons = item.seasons 
                ? item.seasons.filter(s => s.season_number > 0).map(s => ({
                    season_number: s.season_number,
                    episode_count: s.episode_count || 0,
                    name: s.name || `Season ${s.season_number}`
                }))
                : [];
            
            const totalSeasons = item.number_of_seasons || regularSeasons.length || 1;
            const totalEpisodes = item.number_of_episodes || regularSeasons.reduce((acc, s) => acc + (s.episode_count || 0), 0) || 0;

            const lastSeason = regularSeasons.length > 0 ? regularSeasons[regularSeasons.length - 1] : null;
            const lastSeasonNum = lastSeason ? lastSeason.season_number : totalSeasons;
            const lastSeasonEpCount = lastSeason ? lastSeason.episode_count : 1;

            newItem = {
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                release_date: item.release_date || item.first_air_date,
                total_seasons: totalSeasons,
                total_episodes: totalEpisodes,
                seasons_detail: regularSeasons,
                currentSeason: isCompleted ? lastSeasonNum : 1,
                currentEpisode: isCompleted ? lastSeasonEpCount : (initialStatus === 'watching' ? 1 : 0),
                status: isCompleted ? 'completed' : initialStatus, // 'watching' | 'plan_to_watch' | 'completed'
                watched: isCompleted
            };
        }

        const updatedList = {
            ...watchlist,
            [listType]: [newItem, ...watchlist[listType]]
        };

        setWatchlist(updatedList);
        await saveWatchlistData(updatedList);
        return true;
    };

    const removeFromWatchlist = async (id, type) => {
        if (!user) return;
        const listType = type === 'movie' ? 'movies' : 'series';
        
        const updatedList = {
            ...watchlist,
            [listType]: watchlist[listType].filter(i => i.id !== id)
        };

        setWatchlist(updatedList);
        await saveWatchlistData(updatedList);
    };

    const toggleWatched = async (id, type) => {
        if (!user) return;
        const listType = type === 'movie' ? 'movies' : 'series';
        
        const updatedList = {
            ...watchlist,
            [listType]: watchlist[listType].map(i => {
                if (i.id !== id) return i;
                
                if (type === 'movie') {
                    return { ...i, watched: !i.watched };
                } else {
                    // Series toggle
                    const willBeWatched = !i.watched;
                    return {
                        ...i,
                        watched: willBeWatched,
                        status: willBeWatched ? 'completed' : 'plan_to_watch',
                        currentEpisode: willBeWatched ? (i.total_episodes || i.currentEpisode || 1) : 0
                    };
                }
            })
        };

        setWatchlist(updatedList);
        await saveWatchlistData(updatedList);
    };

    const updateSeriesProgress = async (id, updates) => {
        if (!user) return;

        const updatedList = {
            ...watchlist,
            series: watchlist.series.map(s => {
                if (s.id !== id) return s;

                const merged = { ...s, ...updates };
                
                // Determine status and watched state
                if (updates.status) {
                    merged.status = updates.status;
                    merged.watched = updates.status === 'completed';
                } else if (updates.watched !== undefined) {
                    merged.watched = updates.watched;
                    merged.status = updates.watched ? 'completed' : (merged.currentEpisode > 0 ? 'watching' : 'plan_to_watch');
                } else if (merged.currentEpisode > 0) {
                    // If episode > 0 and not marked completed
                    if (merged.status !== 'completed') {
                        merged.status = 'watching';
                        merged.watched = false;
                    }
                } else if (merged.currentEpisode === 0 && merged.status === 'watching') {
                    merged.status = 'plan_to_watch';
                    merged.watched = false;
                }

                return merged;
            })
        };

        setWatchlist(updatedList);
        await saveWatchlistData(updatedList);
    };

    const incrementEpisode = async (id) => {
        if (!user) return;
        const seriesItem = watchlist.series.find(s => s.id === id);
        if (!seriesItem) return;

        const curSeason = seriesItem.currentSeason || 1;
        const curEp = seriesItem.currentEpisode || 0;
        const seasons = seriesItem.seasons_detail || [];
        const curSeasonObj = seasons.find(s => s.season_number === curSeason);
        const curSeasonMaxEp = curSeasonObj?.episode_count || (seriesItem.total_episodes ? Math.ceil(seriesItem.total_episodes / (seriesItem.total_seasons || 1)) : 99);

        if (curEp < curSeasonMaxEp) {
            await updateSeriesProgress(id, {
                currentSeason: curSeason,
                currentEpisode: curEp + 1,
                status: 'watching',
                watched: false
            });
        } else {
            // End of current season -> move to next season if exists
            const nextSeasonNumber = curSeason + 1;
            const hasMoreSeasons = seasons.some(s => s.season_number === nextSeasonNumber) || 
                                   (seriesItem.total_seasons && nextSeasonNumber <= seriesItem.total_seasons);

            if (hasMoreSeasons) {
                await updateSeriesProgress(id, {
                    currentSeason: nextSeasonNumber,
                    currentEpisode: 1,
                    status: 'watching',
                    watched: false
                });
            } else {
                // Reached end of entire series!
                await updateSeriesProgress(id, {
                    currentSeason: curSeason,
                    currentEpisode: curSeasonMaxEp,
                    status: 'completed',
                    watched: true
                });
            }
        }
    };

    const decrementEpisode = async (id) => {
        if (!user) return;
        const seriesItem = watchlist.series.find(s => s.id === id);
        if (!seriesItem) return;

        const curSeason = seriesItem.currentSeason || 1;
        const curEp = seriesItem.currentEpisode || 0;
        const seasons = seriesItem.seasons_detail || [];

        if (curEp > 1) {
            await updateSeriesProgress(id, {
                currentSeason: curSeason,
                currentEpisode: curEp - 1,
                status: 'watching',
                watched: false
            });
        } else if (curEp === 1) {
            if (curSeason > 1) {
                const prevSeasonNumber = curSeason - 1;
                const prevSeasonObj = seasons.find(s => s.season_number === prevSeasonNumber);
                const prevSeasonMaxEp = prevSeasonObj?.episode_count || 1;
                await updateSeriesProgress(id, {
                    currentSeason: prevSeasonNumber,
                    currentEpisode: prevSeasonMaxEp,
                    status: 'watching',
                    watched: false
                });
            } else {
                // S1 E1 decremented -> 0 watched, back to plan to watch
                await updateSeriesProgress(id, {
                    currentSeason: 1,
                    currentEpisode: 0,
                    status: 'plan_to_watch',
                    watched: false
                });
            }
        }
    };

    const value = {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched,
        updateSeriesProgress,
        incrementEpisode,
        decrementEpisode
    };

    return (
        <WatchlistContext.Provider value={value}>
            {children}
        </WatchlistContext.Provider>
    );
};

