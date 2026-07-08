import 'dotenv/config';
import { getZohoAccessToken } from './utils/zoho.js';

getZohoAccessToken()
  .then((token) => console.log('Got access token:', token.slice(0, 20) + '...'))
  .catch((err) => console.error('Failed:', err.response?.data || err.message));