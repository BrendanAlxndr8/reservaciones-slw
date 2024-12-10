import axios from 'axios';

// Creamos una instancia de axios con la URL base correcta
const instance = axios.create({
  // Si la variable de entorno está definida, se usa, si no, toma el valor por defecto
  baseURL: process.env.REACT_APP_API_URL || 'https://reservaciones-slw.onrender.com/', // Cambia esto a la URL de tu backend en producción
  withCredentials: true, // Permite enviar cookies si las usas
});

export default instance;

