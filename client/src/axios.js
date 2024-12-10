import axios from 'axios';

// Crear una instancia de Axios con la URL base
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://reservaciones-slw.onrender.com/', // URL base ajustada
  withCredentials: true, // Permite el envío de cookies si es necesario
});

// Interceptor para agregar el token JWT a cada solicitud
instance.interceptors.request.use(
  (config) => {
    // Intentar obtener el token desde las cookies
    const token = document.cookie.split('; ').find(row => row.startsWith('token='));
    if (token) {
      const actualToken = token.split('=')[1]; // Extraer el valor del token
      config.headers.Authorization = `Bearer ${actualToken}`; // Agregar el token al encabezado Authorization
    }
    return config;
  },
  (error) => {
    // Manejo de errores al configurar la solicitud
    console.error('Error en la configuración de la solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores globales
instance.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, simplemente devuélvela
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Manejo de errores 401 (No autorizado)
        console.error('Error 401: Usuario no autorizado. Por favor, inicia sesión nuevamente.');
        // Opcional: redirigir al usuario a la página de inicio de sesión
        // window.location.href = '/login'; 
      } else {
        console.error(`Error ${error.response.status}:`, error.response.data);
      }
    } else {
      console.error('Error de red: No se pudo conectar con el servidor.');
    }
    return Promise.reject(error);
  }
);

export default instance;
