import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add secret context header if 'secret=true' is in the URL
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('secret') === 'true') {
                config.headers['X-Secret-Context'] = 'true';
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
