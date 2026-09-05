const STORAGE_KEY = 'peoplepay360_employees_data';

export const INITIAL_EMPLOYEES = [
  {
    id: 'emp-1',
    employeeId: 'EMP-001',
    firstName: 'Amelia',
    lastName: 'Johnson',
    name: 'Amelia Johnson',
    position: 'Software Engineer',
    department: 'Engineering',
    manager: 'Ethan Williams',
    schedule: 'Standard 40 Hours',
    status: 'Active',
    email: 'amelia.j@peoplepay360.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    contractsCount: 2,
    attendanceCount: 124,
    timeOffCount: 2,
    allocationsCount: 4
  },
  {
    id: 'emp-2',
    employeeId: 'EMP-002',
    firstName: 'Ethan',
    lastName: 'Williams',
    name: 'Ethan Williams',
    position: 'HR Executive',
    department: 'Human Resources',
    manager: 'Admin User',
    schedule: 'Standard 40 Hours',
    status: 'Active',
    email: 'ethan.w@peoplepay360.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    contractsCount: 1,
    attendanceCount: 98,
    timeOffCount: 1,
    allocationsCount: 3
  },
  {
    id: 'emp-3',
    employeeId: 'EMP-003',
    firstName: 'Olivia',
    lastName: 'Martin',
    name: 'Olivia Martin',
    position: 'Accountant',
    department: 'Finance',
    manager: 'Ethan Williams',
    schedule: 'Flexible Schedule',
    status: 'Active',
    email: 'olivia.m@peoplepay360.com',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    contractsCount: 1,
    attendanceCount: 110,
    timeOffCount: 3,
    allocationsCount: 4
  },
  {
    id: 'emp-4',
    employeeId: 'EMP-004',
    firstName: 'James',
    lastName: 'Anderson',
    name: 'James Anderson',
    position: 'Sales Executive',
    department: 'Sales',
    manager: 'Ethan Williams',
    schedule: 'Standard 40 Hours',
    status: 'Active',
    email: 'james.a@peoplepay360.com',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    contractsCount: 1,
    attendanceCount: 86,
    timeOffCount: 0,
    allocationsCount: 2
  },
  {
    id: 'emp-5',
    employeeId: 'EMP-005',
    firstName: 'Lucas',
    lastName: 'Garcia',
    name: 'Lucas Garcia',
    position: 'Frontend Developer',
    department: 'Engineering',
    manager: 'Amelia Johnson',
    schedule: 'Standard 40 Hours',
    status: 'Active',
    email: 'lucas.g@peoplepay360.com',
    phone: '+1 (555) 678-9012',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    contractsCount: 1,
    attendanceCount: 65,
    timeOffCount: 1,
    allocationsCount: 2
  },
  {
    id: 'emp-6',
    employeeId: 'EMP-006',
    firstName: 'Mia',
    lastName: 'Robinson',
    name: 'Mia Robinson',
    position: 'Product Designer',
    department: 'Design',
    manager: 'Amelia Johnson',
    schedule: 'Flexible Schedule',
    status: 'Inactive',
    email: 'mia.r@peoplepay360.com',
    phone: '+1 (555) 789-0123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    contractsCount: 1,
    attendanceCount: 42,
    timeOffCount: 0,
    allocationsCount: 1
  }
];

export const getEmployees = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading employees from localStorage:', err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EMPLOYEES));
  return INITIAL_EMPLOYEES;
};

export const saveEmployeesToStorage = (employees) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch (err) {
    console.error('Error saving employees to localStorage:', err);
  }
};

export const getEmployeeById = (id) => {
  const list = getEmployees();
  return list.find((e) => e.id === id || e.employeeId === id) || null;
};

export const createEmployee = (data) => {
  const list = getEmployees();
  const newEmp = {
    id: `emp-${Date.now()}`,
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    contractsCount: 0,
    attendanceCount: 0,
    timeOffCount: 0,
    allocationsCount: 0,
    avatar:
      data.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    ...data
  };
  const updated = [newEmp, ...list];
  saveEmployeesToStorage(updated);
  return newEmp;
};

export const updateEmployee = (id, data) => {
  const list = getEmployees();
  const index = list.findIndex((e) => e.id === id || e.employeeId === id);
  if (index === -1) return null;
  const updatedEmp = {
    ...list[index],
    ...data,
    name: `${data.firstName || list[index].firstName || ''} ${data.lastName || list[index].lastName || ''}`.trim()
  };
  list[index] = updatedEmp;
  saveEmployeesToStorage(list);
  return updatedEmp;
};
