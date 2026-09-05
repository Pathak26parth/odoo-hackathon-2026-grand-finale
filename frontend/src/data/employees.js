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
    const updatedEmp = await employeeService.updateEmployee(id, data);
    
    // Immediately update local cache with normalized updated employee
    const list = getEmployees();
    const idx = list.findIndex((e) => String(e.id) === String(id) || e.employeeId === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedEmp };
    } else {
      list.push(updatedEmp);
    }
    saveEmployeesToStorage(list);

    // Also trigger background fetch to stay in sync
    fetchEmployeesAsync().catch(console.error);

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
          if (updatedEmp.avatar) {
            u.avatar = updatedEmp.avatar;
          }
          if (updatedEmp.name) {
            u.name = updatedEmp.name;
          }
          if (updatedEmp.email) {
            u.email = updatedEmp.email;
          }
          localStorage.setItem('peoplepay360_current_user', JSON.stringify(u));
        }
      }
    } catch (e) {
      console.warn('Could not sync current user local cache:', e);
    }

    return updatedEmp;
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
    const list = getEmployees().filter((e) => String(e.id) !== String(id) && e.employeeId !== String(id));
    saveEmployeesToStorage(list);
    await fetchEmployeesAsync().catch(console.error);
    return res;
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message || 'Failed to delete employee';
    console.error('Delete employee failed on backend:', errMsg);
    if (err.response?.status === 404) {
      const list = getEmployees().filter((e) => String(e.id) !== String(id) && e.employeeId !== String(id));
      saveEmployeesToStorage(list);
      return true;
    }
    throw new Error(errMsg);
  }
};
