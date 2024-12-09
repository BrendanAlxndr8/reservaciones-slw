import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "../axios"; // Asegúrate de importar la configuración global

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Función para validar correos específicos
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com|saltillo\.tecnm\.mx)$/;
    return emailRegex.test(email);
  }

  // Función para validar el nombre
  function isValidName(name) {
    const nameRegex = /^[^\s].{1,}$/; // Al menos 2 caracteres, el primero no puede ser un espacio
    return nameRegex.test(name);
  }

  // Función para validar la contraseña
  function isValidPassword(password) {
    return password.length >= 8 && !/\s/.test(password); // Mínimo 8 caracteres y sin espacios
  }

  async function registerUser(ev) {
    ev.preventDefault();

    // Validación de nombre
    if (!isValidName(name)) {
      alert('Name must be at least 2 characters long and cannot start with a space.');
      return;
    }

    // Validación de correo electrónico
    if (!isValidEmail(email)) {
      alert('Please enter a valid email address from @gmail.com, @outlook.com, or @saltillo.tecnm.mx.');
      return;
    }

    // Validación de contraseña
    if (!isValidPassword(password)) {
      alert('Password must be at least 8 characters long and cannot contain spaces.');
      return;
    }

    try {
      await axios.post('/api/register', {
        name,
        email,
        password,
      });
      alert('Registration successful. Now you can log in');
    } catch (e) {
      if (e.response && e.response.status === 409) {
        // Código 409 para correos duplicados
        alert('This email is already registered. Please use another email.');
      } else {
        alert('Registration failed. Please try again later.');
      }
    }
  }

  return (
    <div className="mt-4 grow flex items-center justify-around">
      <div className="mb-64">
        <h1 className="text-4xl text-center mb-4">Register</h1>
        <form className="max-w-md mx-auto" onSubmit={registerUser}>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
          />
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
          <button className="primary">Register</button>
          <div className="text-center py-2 text-gray-500">
            Already a member?{' '}
            <Link className="underline text-black" to={'/login'}>
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
