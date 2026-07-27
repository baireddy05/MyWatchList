export const state = {
    user: null,
    watchlist: { movies: [], series: [] }, // Will be synced from Firestore
    activeTab: 'movies',
    isDarkMode: localStorage.getItem('isDarkMode') === 'true',
    currentDetailItem: null,
};
