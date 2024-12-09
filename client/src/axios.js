import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000', // Cambia automáticamente según el entorno
  withCredentials: true, // Permite enviar cookies si las usas
});

export default instance;

