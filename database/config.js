const mongoose = require('mongoose');   // importa Mongoose para interactuar con MongoDb

// Función asíncrona para conectar a la base de datos
const dbConnection = async() => {

    try {
        //console.log(process.env.MONGO_URL);
        //Intenta conectar con la base de datos usando la URL almacenada en una variable de entrono
        await mongoose.connect( process.env.MONGO_URL );

        console.log('DB Online');   // Muestra un mensaje en la consola si la conexión es exitos

    }catch ( error ){
        console.log(error); // Imprime el error en la consola en caso de que falle la conexión
        throw new Error('Error a la hora de inicializar BD');   // Lanza un error personalizado si la conexión falla
    }
    
}