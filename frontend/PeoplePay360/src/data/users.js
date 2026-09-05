const STORAGE_KEY = 'peoplepay360_users_data';

export const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Admin User',
    email: 'admin@peoplepay360.com',
    role: 'Admin',
    status: 'Active',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-2',
    name: 'Emma Wilson',
    email: 'emma@peoplepay360.com',
    role: 'HR Manager',
    status: 'Active',
    employeeId: 'emp-2',
    employeeName: 'Ethan Williams',
    createdAt: '2026-02-14'
  },
  {
    id: 'usr-3',
    name: 'Liam Brown',
    email: 'liam@peoplepay360.com',
    role: 'HR Payroll User',
    status: 'Active',
    employeeId: 'emp-3',
    employeeName: 'Olivia Martin',
    createdAt: '2026-03-01'
  },
  {
    id: 'usr-4',
    name: 'Sophia Taylor',
    email: 'sophia@peoplepay360.com',
    role: 'Employee',
    status: 'Active',
    employeeId: 'emp-4',
    employeeName: 'James Anderson',
    createdAt: '2026-03-20'
  },
  {
    id: 'usr-5',
    name: 'Noah Smith',
    email: 'noah@peoplepay360.com',
    role: 'Employee',
    status: 'Inactive',
    employeeId: 'emp-1',
    employeeName: 'Amelia Johnson',
    createdAt: '2026-04-05'
  }
];

export const getUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading users from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

export const saveUsersToStorage = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to localStorage:', err);
  }
};

export const getUserById = (id) => {
  const users = getUsers();
  return users.find((u) => u.id === id) || null;
};

export const createUser = (userData) => {
  const users = getUsers();
  const newUser = {
    id: `usr-${Date.now()}`,
    ...userData,
    createdAt: new Date().toISOString().split('T')[0]
  };
  const updated = [newUser, ...users];
  saveUsersToStorage(updated);
  return newUser;
};

export const updateUser = (id, userData) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  const updatedUser = { ...users[index], ...userData };
  users[index] = updatedUser;
  saveUsersToStorage(users);
  return updatedUser;
};

export const deleteUser = (id) => {
  const users = getUsers();
  const updated = users.filter((u) => u.id !== id);
  saveUsersToStorage(updated);
  return true;
};
