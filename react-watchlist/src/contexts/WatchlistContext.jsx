import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, doc, onSnapshot, setDoc } from '../services/firebase';

const WatchlistContext = createContext();

export const useWatchlist = () => useContext(WatchlistContext);

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
                setWatchlist(docSnap.data());
            } else {
                setDoc(docRef, { movies: [], series: [] });
                setWatchlist({ movies: [], series: [] });
            }
        });

        return unsubscribe;
    }, [user]);

    const addToWatchlist = async (item, type) => {
        if (!user) return false;
        
        const listType = type === 'movie' ? 'movies' : 'series';
        if (watchlist[listType].some(i => i.id === item.id)) return true;

        const updatedList = {
            ...watchlist,
            [listType]: [{
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                release_date: item.release_date || item.first_air_date,
                watched: false
            }, ...watchlist[listType]]
        };

        try {
            await setDoc(doc(db, "watchlists", user.uid), updatedList);
            return true;
        } catch (error) {
            console.error("Error adding to watchlist:", error);
            // Offline fallback
            localStorage.setItem('offline_watchlist', JSON.stringify(updatedList));
            setWatchlist(updatedList);
            return true;
        }
    };

    const removeFromWatchlist = async (id, type) => {
        if (!user) return;
        const listType = type === 'movie' ? 'movies' : 'series';
        
        const updatedList = {
            ...watchlist,
            [listType]: watchlist[listType].filter(i => i.id !== id)
        };

        try {
            await setDoc(doc(db, "watchlists", user.uid), updatedList);
        } catch (error) {
            localStorage.setItem('offline_watchlist', JSON.stringify(updatedList));
            setWatchlist(updatedList);
        }
    };

    const toggleWatched = async (id, type) => {
        if (!user) return;
        const listType = type === 'movie' ? 'movies' : 'series';
        
        const updatedList = {
            ...watchlist,
            [listType]: watchlist[listType].map(i => 
                i.id === id ? { ...i, watched: !i.watched } : i
            )
        };

        try {
            await setDoc(doc(db, "watchlists", user.uid), updatedList);
        } catch (error) {
            localStorage.setItem('offline_watchlist', JSON.stringify(updatedList));
            setWatchlist(updatedList);
        }
    };

    const value = {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched
    };

    return (
        <WatchlistContext.Provider value={value}>
            {children}
        </WatchlistContext.Provider>
    );
};
