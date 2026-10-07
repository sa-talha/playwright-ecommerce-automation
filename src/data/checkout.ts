export const validCustomer = { firstName: 'Alva', lastName: 'Lind', postalCode: '114 55' };

/** Data-driven negative cases for the delivery details form. */
export const invalidCustomers = [
  {
    title: 'missing first name',
    data: { firstName: '', lastName: 'Lind', postalCode: '114 55' },
    error: 'First name is required',
    field: 'firstName',
  },
  {
    title: 'missing last name',
    data: { firstName: 'Alva', lastName: '', postalCode: '114 55' },
    error: 'Last name is required',
    field: 'lastName',
  },
  {
    title: 'missing postal code',
    data: { firstName: 'Alva', lastName: 'Lind', postalCode: '' },
    error: 'Postal code is required',
    field: 'postalCode',
  },
  {
    title: 'postal code with letters',
    data: { firstName: 'Alva', lastName: 'Lind', postalCode: 'ABC 12' },
    error: 'Postal code must be 5 digits, for example 114 55',
    field: 'postalCode',
  },
  {
    title: 'postal code too short',
    data: { firstName: 'Alva', lastName: 'Lind', postalCode: '114' },
    error: 'Postal code must be 5 digits, for example 114 55',
    field: 'postalCode',
  },
] as const;
