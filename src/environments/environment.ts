const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const environment = {
  production: false,
  platform: 'mobile' as 'mobile' | 'web',
  apiUrl: `http://${hostname}:3000`,
};
