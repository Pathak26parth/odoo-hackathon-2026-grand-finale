// utils/contractUtils.js
// Contract validation and eligibility evaluation for payroll

import { getContracts } from '../data/contracts';

/**
 * Checks if a contract is active within a given payrun period
 * Payrun period: [periodStart, periodEnd]
 */
export const isContractActiveInPeriod = (contract, periodStart, periodEnd) => {
  if (!contract || contract.status !== 'Active') return false;

  const cStart = new Date(contract.startDate).getTime();
  const cEnd = contract.endDate ? new Date(contract.endDate).getTime() : Infinity;

  const pStart = new Date(periodStart).getTime();
  const pEnd = new Date(periodEnd).getTime();

  // Overlap condition: contract starts on/before period ends AND contract ends on/after period starts
  return cStart <= pEnd && cEnd >= pStart;
};

/**
 * Finds the applicable contract for an employee during a given payrun period
 */
export const getApplicableContract = (employeeId, periodStart, periodEnd) => {
  const allContracts = getContracts(employeeId);
  const activeContracts = allContracts.filter((c) =>
    isContractActiveInPeriod(c, periodStart, periodEnd)
  );

  return {
    contract: activeContracts[0] || null,
    multipleActive: activeContracts.length > 1,
    allMatching: activeContracts
  };
};

/**
 * Validates employee eligibility for a payrun
 */
export const evaluateEmployeeEligibility = (employee, payrunPeriodStart, payrunPeriodEnd, targetStructureNameOrId) => {
  if (!employee) {
    return { isEligible: false, reason: 'Invalid Employee', status: 'Invalid' };
  }

  if (employee.status !== 'Active') {
    return { isEligible: false, reason: 'Employee is inactive', status: 'Inactive' };
  }

  const { contract, multipleActive } = getApplicableContract(
    employee.id,
    payrunPeriodStart,
    payrunPeriodEnd
  );

  if (!contract) {
    return {
      isEligible: false,
      reason: 'No active contract matching payrun period',
      status: 'No Active Contract',
      contract: null
    };
  }

  // Check structure assignment
  // Support matching by name or id
  const contractStructure = (contract.salaryStructure || '').trim().toLowerCase();
  const targetStructure = (targetStructureNameOrId || '').trim().toLowerCase();

  const isStructureMatch =
    !targetStructure ||
    contractStructure === targetStructure ||
    (targetStructure.includes('standard') && contractStructure.includes('standard')) ||
    contractStructure.includes(targetStructure) ||
    targetStructure.includes(contractStructure);

  if (!isStructureMatch) {
    return {
      isEligible: false,
      reason: `Salary structure mismatch (Contract: ${contract.salaryStructure}, Payrun: ${targetStructureNameOrId})`,
      status: 'Structure Mismatch',
      contract,
      warning: multipleActive ? 'Multiple active contracts detected' : null
    };
  }

  return {
    isEligible: true,
    reason: 'Eligible for payroll computation',
    status: 'Eligible',
    contract,
    wage: contract.wage,
    warning: multipleActive ? 'Multiple active overlapping contracts exist for this employee' : null
  };
};

/**
 * Validates all contracts for general health (expired, missing wage, overlaps)
 */
export const checkAllContractsHealth = () => {
  const contracts = getContracts();
  const now = new Date().getTime();
  const warnings = [];

  // Group by employee
  const byEmp = {};
  contracts.forEach((c) => {
    if (!byEmp[c.employeeId]) byEmp[c.employeeId] = [];
    byEmp[c.employeeId].push(c);

    // Expired check
    if (c.status === 'Active' && c.endDate && new Date(c.endDate).getTime() < now) {
      warnings.push({
        type: 'Expired Contract',
        contractId: c.id,
        employeeName: c.employeeName,
        message: `Contract ${c.id} for ${c.employeeName} expired on ${c.endDate} but is still marked Active.`
      });
    }
  });

  // Multiple active check
  Object.keys(byEmp).forEach((empId) => {
    const active = byEmp[empId].filter((c) => c.status === 'Active');
    if (active.length > 1) {
      warnings.push({
        type: 'Overlapping Active Contracts',
        employeeId: empId,
        employeeName: active[0].employeeName,
        message: `${active[0].employeeName} has ${active.length} overlapping active contracts.`
      });
    }
  });

  return warnings;
};
