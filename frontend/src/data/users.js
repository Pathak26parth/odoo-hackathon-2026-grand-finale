import userService, { normalizeUser } from '../services/userService';

const STORAGE_KEY = 'peoplepay360_users_data';

export const INITIAL_USERS = [];

export const getUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading users from localStorage:', err);
  }
  return INITIAL_USERS;
};

export const fetchUsersAsync = async () => {
  try {
    const data = await userService.getAllUsers();
    if (Array.isArray(data)) {
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
    if (user) {
      const current = getUsers();
      const idx = current.findIndex((u) => String(u.id) === String(id));
      if (idx !== -1) current[idx] = user;
      else current.push(user);
      saveUsersToStorage(current);
      return user;
    }
  } catch (err) {
    console.warn('API fetchUserById failed, using cached user:', err.message);
  }
  return getUserById(id);
};

export const createUser = async (userData) => {
  const result = await userService.createUser(userData);
  await fetchUsersAsync();
  return result?.user ? normalizeUser(result.user) : result;
};

export const updateUser = async (id, userData) => {
  const result = await userService.updateUser(id, userData);
  await fetchUsersAsync();
  return result?.user ? normalizeUser(result.user) : result;
};

export const deleteUser = async (id) => {
  const res = await userService.deleteUser(id);
  const users = getUsers().filter((u) => String(u.id) !== String(id));
  saveUsersToStorage(users);
  await fetchUsersAsync();
  return res;
};
