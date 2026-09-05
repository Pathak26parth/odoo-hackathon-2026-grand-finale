import employeeService, { normalizeEmployee } from '../services/employeeService';

const STORAGE_KEY = 'peoplepay360_employees_data';

export const INITIAL_EMPLOYEES = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@peoplepay360.com',
    phone: '+1 (555) 010-0001',
    department: 'Management',
    position: 'Chief Executive Officer',
    schedule: 'Standard 40 Hours',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

export const getEmployees = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading employees from cache:', err);
  }
  return INITIAL_EMPLOYEES;
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
    if (emps && emps.length > 0) {
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
    const newEmp = { id: String(Date.now()), ...data };
    saveEmployeesToStorage([newEmp, ...list]);
    return newEmp;
  }
};

export const updateEmployee = async (id, data) => {
  try {
    const res = await employeeService.updateEmployee(id, data);
    await fetchEmployeesAsync();
    return res;
  } catch (err) {
    console.error('Update employee failed on backend:', err.message);
    const list = getEmployees();
    const idx = list.findIndex((e) => String(e.id) === String(id) || e.employeeId === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
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
