export const users = [
  {
    id: 1,
    isTrainer: true,
    name: 'Entrenador Mañana',
    initials: 'EM',
    firstName: 'Entrenador',
    lastName: 'Mañana',
    email: 'entrenadormaniana@gmail.com',
    dni: '30123456',
    password: 'gymbro123',
    gender: 'Masculino',
    age: '32 años',
    weight: '82 kg',
    height: '180 cm',
    phone: '3794112233',
    emergencyPhone: '3794112244',
    healthInsurance: 'OSDE',
    contraindications: 'Ninguna registrada',
    goal: 'Ganar fuerza',
  },
  {
    id: 2,
    isTrainer: false,
    id_rutina: 1,
    name: 'Sol Gaetmank',
    initials: 'SG',
    firstName: 'Sol',
    lastName: 'Gaetmank',
    email: 'solgaetmank@gmail.com',
    dni: '44363966',
    password: 'gymbro123',
    gender: 'Femenino',
    age: '23 años',
    weight: '75.5 kg',
    height: '160 cm',
    phone: '3794033628',
    emergencyPhone: '3794033620',
    healthInsurance: '-',
    contraindications: 'Ninguna',
    goal: 'Tonificar',
  },
  {
    id: 3,
    isTrainer: false,
    id_rutina: 3,
    name: 'Lucía Fernández',
    initials: 'LF',
    firstName: 'Lucía',
    lastName: 'Fernández',
    email: 'luciafernandez@gmail.com',
    dni: '42123456',
    password: 'gymbro123',
    gender: 'Femenino',
    age: '26 años',
    weight: '64 kg',
    height: '168 cm',
    phone: '3794223344',
    emergencyPhone: '3794223355',
    healthInsurance: 'Swiss Medical',
    contraindications: 'Lesión leve en rodilla',
    goal: 'Bajar de peso',
  },
  {
    id: 4,
    isTrainer: false,
    id_rutina: 4,
    name: 'Martín Rodríguez',
    initials: 'MR',
    firstName: 'Martín',
    lastName: 'Rodríguez',
    email: 'martinrodriguez@gmail.com',
    dni: '39876543',
    password: 'gymbro123',
    gender: 'Masculino',
    age: '29 años',
    weight: '88 kg',
    height: '182 cm',
    phone: '3794334455',
    emergencyPhone: '3794334466',
    healthInsurance: 'Medifé',
    contraindications: 'Ninguna',
    goal: 'Ganar fuerza',
  },
  {
    id: 5,
    isTrainer: true,
    name: 'Entrenador Tarde',
    initials: 'ET',
    firstName: 'Entrenador',
    lastName: 'Tarde',
    email: 'entrenadortarde@gmail.com',
    dni: '28987654',
    password: 'gymbro123',
    gender: 'Masculino',
    age: '35 años',
    weight: '90 kg',
    height: '185 cm',
    phone: '3794556677',
    emergencyPhone: '3794556688',
    healthInsurance: 'OSDE',
    contraindications: 'Ninguna registrada',
    goal: 'Mantener masa muscular',
  },
];

export function getUserById(userId) {
  return users.find((user) => user.id === userId);
}

export function addUser(data) {
  // Alta de un alumno nuevo (equivale a un INSERT en la base de datos).
  // Nace sin rutina: se la arma el entrenador desde su pantalla de edición.
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();

  const newUser = {
    id: Math.max(...users.map((user) => user.id)) + 1,
    isTrainer: false,
    id_rutina: null,
    name: `${firstName} ${lastName}`,
    initials: `${firstName[0]}${lastName[0]}`.toUpperCase(),
    firstName,
    lastName,
    email: data.email.trim().toLowerCase(),
    dni: data.dni.trim(),
    password: data.password,
    gender: data.gender,
    // Mismo formato con unidad que los usuarios existentes
    age: `${data.age} años`,
    weight: `${data.weight} kg`,
    height: `${data.height} cm`,
    phone: data.phone.trim(),
    emergencyPhone: data.emergencyPhone.trim(),
    healthInsurance: data.healthInsurance.trim() || '-',
    contraindications: data.contraindications.trim() || 'Ninguna',
    goal: data.goal,
  };

  users.push(newUser);
  return newUser;
}

export function setUserRoutine(userId, routineId) {
  // Asigna una rutina a un usuario (equivale a un UPDATE en la base de datos).
  const user = getUserById(userId);
  if (!user) return false;
  user.id_rutina = routineId;
  return true;
}
