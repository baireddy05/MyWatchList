import { config } from './config.js';

const cache = new Map();

export const api = {
    async fetch(endpoint, params = '') {
        try {
            const url = `${config.tmdbBaseUrl}${endpoint}?api_key=${config.tmdbApiKey}${params ? '&' + params : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("API Fetch Error:", error);
            return null;
        }
    },
    
    search(query) {
        return this.fetch(`/search/multi`, `query=${encodeURIComponent(query)}`);
    },
    
    async getDetails(id, type) {
        const endpointType = type === 'series' ? 'tv' : type;
        const cacheKey = `${endpointType}-${id}`;
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }
        
        const data = await this.fetch(`/${endpointType}/${id}`, `append_to_response=watch/providers,external_ids`);
        if (data) {
            cache.set(cacheKey, data);
        }
        return data;
    },

    async getSeasonDetails(seriesId, seasonNumber) {
        const cacheKey = `tv-${seriesId}-season-${seasonNumber}`;
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        const data = await this.fetch(`/tv/${seriesId}/season/${seasonNumber}`);
        if (data) {
            cache.set(cacheKey, data);
        }
        return data;
    }
};
