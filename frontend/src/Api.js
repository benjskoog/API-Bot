import axios from 'axios';

const tunnel = process.env.REACT_APP_BACKEND_URL

const backendUrl = tunnel || "http://localhost:3001";

const baseUrl = `${backendUrl}/api`

const api = axios.create({
    baseURL: baseUrl,
});


if (tunnel) api.defaults.headers.common['ngrok-skip-browser-warning'] = 'any';

export default api;
