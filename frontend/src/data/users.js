import userService, { normalizeUser } from '../services/userService';

const STORAGE_KEY = 'peoplepay360_users_data';

export const INITIAL_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@peoplepay360.com',
    role: 'Admin',
    status: 'Active',
    employeeId: 'EMP001',
    employeeName: 'Admin User',
    createdAt: '2026-01-10'
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
  return INITIAL_USERS;
};

export const fetchUsersAsync = async () => {
  try {
    const data = await userService.getAllUsers();
    if (data && data.length > 0) {
      saveUsersToStorage(data);
      return data;
    }
  } catch (err) {
    console.warn('API fetchUsers failed, using cached data:', err.message);
  }
  return getUsers();
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
  return users.find((u) => String(u.id) === String(id)) || null;
};

export const fetchUserByIdAsync = async (id) => {
  try {
    const user = await userService.getUserById(id);
    return user;
  } catch (err) {
    console.warn('API fetchUserById failed, using cached user:', err.message);
    return getUserById(id);
  }
};

export const createUser = async (userData) => {
  try {
    const result = await userService.createUser(userData);
    const created = result.user ? normalizeUser(result.user) : { id: String(Date.now()), ...userData };
    const users = getUsers();
    saveUsersToStorage([created, ...users]);
    return created;
  } catch (err) {
    console.warn('API createUser failed, falling back to local storage:', err.message);
    const users = getUsers();
    const newUser = {
      id: String(Date.now()),
      ...userData,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newUser, ...users];
    saveUsersToStorage(updated);
    return newUser;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const result = await userService.updateUser(id, userData);
    const updatedUser = result.user ? normalizeUser(result.user) : { ...userData, id: String(id) };
    const users = getUsers();
    const index = users.findIndex((u) => String(u.id) === String(id));
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      saveUsersToStorage(users);
    }
    return updatedUser;
  } catch (err) {
    console.warn('API updateUser failed, updating local storage:', err.message);
    const users = getUsers();
    const index = users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return null;
    const updatedUser = { ...users[index], ...userData };
    users[index] = updatedUser;
    saveUsersToStorage(users);
    return updatedUser;
  }
};

export const deleteUser = async (id) => {
  try {
    await userService.deleteUser(id);
  } catch (err) {
    console.warn('API deleteUser failed, deleting from local storage:', err.message);
  }
  const users = getUsers();
  const updated = users.filter((u) => String(u.id) !== String(id));
  saveUsersToStorage(updated);
  return true;
};
