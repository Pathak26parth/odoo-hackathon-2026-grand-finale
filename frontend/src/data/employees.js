import employeeService, { normalizeEmployee } from '../services/employeeService';

const STORAGE_KEY = 'peoplepay360_employees_data';

export const INITIAL_EMPLOYEES = [];

export const getEmployees = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((e) => e && e.employeeId !== 'EMP001' && e.position !== 'Chief Executive Officer' && e.name !== 'Admin User')
          .map(normalizeEmployee)
          .filter(Boolean);
      }
    }
  } catch (err) {
    console.error('Error reading employees from cache:', err);
  }
  return INITIAL_EMPLOYEES.map(normalizeEmployee);
};

export const saveEmployeesToStorage = (employees) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch (err) {
    console.error('Error saving employees to cache:', err);
  }
};

export const fetchEmployeesAsync = async () => {
  try {
    const emps = await employeeService.getAllEmployees();
    if (Array.isArray(emps)) {
      saveEmployeesToStorage(emps);
      return emps;
    }
  } catch (err) {
    console.warn('[Data Bridge] Could not fetch employees from backend:', err.message);
  }
  return getEmployees();
};

export const getEmployeeById = (id) => {
  const list = getEmployees();
  return list.find((e) => String(e.id) === String(id) || e.employeeId === id) || null;
};

export const getEmployeeByIdAsync = async (id) => {
  try {
    const emp = await employeeService.getEmployeeById(id);
    return emp;
  } catch (err) {
    return getEmployeeById(id);
  }
};

export const fetchEmployeeByIdAsync = getEmployeeByIdAsync;

export const createEmployee = async (data) => {
  try {
    const res = await employeeService.createEmployee(data);
    await fetchEmployeesAsync();
    return res;
  } catch (err) {
    console.error('Create employee failed on backend:', err.message);
    const list = getEmployees();
    const newEmp = normalizeEmployee({ id: String(Date.now()), ...data });
    saveEmployeesToStorage([newEmp, ...list]);
    return newEmp;
  }
};

export const updateEmployee = async (id, data) => {
  try {
    const res = await employeeService.updateEmployee(id, data);
    const refreshed = await fetchEmployeesAsync();

    // Check if Cloudinary URL was returned
    const returnedPhoto = res?.data?.profilePhotoUrl || res?.data?.avatar || res?.profilePhotoUrl || res?.avatar;

    // Synchronize current logged-in user profile if this employee matches
    try {
      const userRaw = localStorage.getItem('peoplepay360_current_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (
          String(u.internalEmployeeId) === String(id) ||
          u.employeeId === id ||
          (data.email && u.email === data.email)
        ) {
          if (returnedPhoto) {
            u.avatar = returnedPhoto;
          } else if (data.avatar && !data.avatar.startsWith('data:')) {
            u.avatar = data.avatar;
          }
          if (data.firstName && data.lastName) {
            u.name = `${data.firstName} ${data.lastName}`;
          }
          localStorage.setItem('peoplepay360_current_user', JSON.stringify(u));
        }
      }
    } catch (e) {
      console.warn('Could not sync current user local cache:', e);
    }

    return res;
  } catch (err) {
    console.error('Update employee failed on backend:', err.message);
    const list = getEmployees();
    const idx = list.findIndex((e) => String(e.id) === String(id) || e.employeeId === id);
    if (idx !== -1) {
      list[idx] = normalizeEmployee({ ...list[idx], ...data });
      saveEmployeesToStorage(list);
    }
    return data;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const res = await employeeService.deleteEmployee(id);
    await fetchEmployeesAsync();
    return res;
  } catch (err) {
    console.error('Delete employee failed on backend:', err.message);
    const list = getEmployees().filter((e) => String(e.id) !== String(id) && e.employeeId !== id);
    saveEmployeesToStorage(list);
    return true;
  }
};
