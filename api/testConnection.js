// testConnection.js
require('dotenv').config(); // Carga las variables de entorno
const mongoose = require('mongoose'); // Importa Mongoose

const MONGO_URL = process.env.MONGO_URL; // Obtiene la URI desde .env

// Función para probar la conexión a MongoDB
async function testConnection() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conexión exitosa a MongoDB 🎉");
    process.exit(0); // Finaliza el script con éxito
  } catch (error) {
    console.error("Error al conectar a MongoDB ❌", error);
    process.exit(1); // Finaliza el script con un error
  }
}

// Ejecuta la función de prueba
testConnection();
