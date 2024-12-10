require('dotenv').config(); // Cargar las variables de entorno

console.log("MONGO_URL:", process.env.MONGO_URL);
console.log('PORT:', process.env.PORT);

const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const fs = require('fs');
const mime = require('mime-types');

const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg'; // Mantén tu secreto de JWT igual
const bucket = 'reservaciones-slw';

// Middleware para permitir CORS desde el frontend
const allowedOrigins = [
  process.env.FRONTEND_URL, // Origen del frontend en producción
  'http://127.0.0.1:5173', // Desarrollo local
  'http://localhost:5173'  // Desarrollo local
];

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Permitir el origen
    } else {
      callback(new Error('Not allowed by CORS')); // Bloquear
    }
  },
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// Función de subida a S3
async function uploadToS3(path, originalFilename, mimetype) {
  const client = new S3Client({
    region: 'us-east-2',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const parts = originalFilename.split('.');
  const ext = parts[parts.length - 1];
  const newFilename = Date.now() + '.' + ext;
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Body: fs.readFileSync(path),
    Key: newFilename,
    ContentType: mimetype,
    ACL: 'public-read',
  }));
  return `https://${bucket}.s3.amazonaws.com/${newFilename}`;
}

// Función para obtener datos del usuario desde el token
function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    if (!token) {
      return reject(new Error('Token no proporcionado'));
    }
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) {
        return reject(new Error('Token inválido'));
      }
      resolve(userData);
    });
  });
}

// Rutas
app.get('/api/test', (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.json('test ok');
});

app.post('/api/register', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { email, password } = req.body;
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
          if (err) throw err;
          res.cookie('token', token).json(userDoc);
        });
      } else {
        res.status(422).json('pass not ok');
      }
    } else {
      res.status(404).json('not found');
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/profile', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const userData = await getUserDataFromReq(req);
    const { name, email, _id } = await User.findById(userData.id);
    res.json({ name, email, _id });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

app.post('/api/upload-by-link', async (req, res) => {
  const { link } = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: '/tmp/' + newName,
  });
  const url = await uploadToS3('/tmp/' + newName, newName, mime.lookup('/tmp/' + newName));
  res.json(url);
});

const photosMiddleware = multer({ dest: '/tmp' });
app.post('/api/upload', photosMiddleware.array('photos', 100), async (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname, mimetype } = req.files[i];
    const url = await uploadToS3(path, originalname, mimetype);
    uploadedFiles.push(url);
  }
  res.json(uploadedFiles);
});

app.post('/api/places', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const userData = await getUserDataFromReq(req);
    const { title, address, addedPhotos, description, price, perks, extraInfo, checkIn, checkOut, maxGuests } = req.body;
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  } catch (err) {
    console.error('Error creating place:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-places', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const userData = await getUserDataFromReq(req);
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  } catch (err) {
    console.error('Error fetching user places:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/places/:id', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { id } = req.params;
  try {
    const place = await Place.findById(id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    res.json(place);
  } catch (err) {
    console.error('Error fetching place details:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/places', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {
    id, title, address, addedPhotos, description,
    perks, extraInfo, checkIn, checkOut, maxGuests, price,
  } = req.body;
  try {
    const userData = await getUserDataFromReq(req);
    const placeDoc = await Place.findById(id);
    if (!placeDoc) return res.status(404).json({ error: 'Place not found' });

    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title, address, photos: addedPhotos, description,
        perks, extraInfo, checkIn, checkOut, maxGuests, price,
      });
      await placeDoc.save();
      res.json('ok');
    } else {
      res.status(403).json({ error: 'You are not the owner of this place' });
    }
  } catch (err) {
    console.error('Error updating place:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/places', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    res.json(await Place.find());
  } catch (err) {
    console.error('Error fetching places:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bookings', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const userData = await getUserDataFromReq(req);
    const { place, checkIn, checkOut, numberOfGuests, name, phone, price } = req.body;
    const booking = await Booking.create({
      place, checkIn, checkOut, numberOfGuests, name, phone, price,
      user: userData.id,
    });
    res.json(booking);
  } catch (err) {
    console.error('Error creating booking:', err.message);
    res.status(err.message === 'Token no proporcionado' ? 401 : 500).json({ error: err.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const userData = await getUserDataFromReq(req);
    const bookings = await Booking.find({ user: userData.id }).populate('place');
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inicia el servidor
app.listen(process.env.PORT || 4000, () => {
  console.log(`Server is running on port ${process.env.PORT || 4000}`);
});

