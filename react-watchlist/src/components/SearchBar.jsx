import React, { useState, useEffect, useRef } from 'react';
import { tmdb, config } from '../services/tmdb';

const SearchBar = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsActive(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 2) {
                const data = await tmdb.search(query);
                if (data && data.results) {
                    const validResults = data.results.filter(item => 
                        (item.media_type === 'movie' || item.media_type === 'tv') && 
                        item.poster_path
                    ).slice(0, 8);
                    setResults(validResults);
                    setIsActive(true);
                }
            } else {
                setResults([]);
                setIsActive(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (item) => {
        setIsActive(false);
        setQuery('');
        onSelect(item.id, item.media_type === 'tv' ? 'series' : 'movie');
    };

    return (
        <div className="search-section" ref={searchRef}>
            <input 
                type="text" 
                id="searchInput" 
                placeholder="Search for a movie or series..." 
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if(results.length > 0) setIsActive(true); }}
            />
            
            <div className={`search-results ${isActive && results.length > 0 ? 'active' : ''}`}>
                <ul>
                    {results.map(item => (
                        <li key={item.id} onClick={() => handleSelect(item)}>
                            <img src={`${config.tmdbImageBaseUrl}${item.poster_path}`} alt="" loading="lazy" />
                            <div className="item-info">
                                <div className="title">{item.title || item.name}</div>
                                <div className="year">
                                    {item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 'N/A'}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SearchBar;
