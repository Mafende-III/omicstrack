const ADMIN_ID = '00000000-0000-0000-0000-000000000001';

export async function seed(knex) {
  const existing = await knex('patients').count('id as count');
  if (parseInt(existing[0].count, 10) > 0) return;

  const patients = [
    {
      id: '00000000-0000-0000-0001-000000000001',
      code: '001',
      name: 'GASANA Claude',
      age: 48,
      leukemia_type: 'AML',
      treatment: 'On Treatment',
      facility: 'RMH',
      enrolled_at: '2025-01-10T09:00:00Z',
      enrolled_by: ADMIN_ID,
    },
    {
      id: '00000000-0000-0000-0001-000000000002',
      code: '002',
      name: 'Nsengiyumva Schadrack',
      age: 46,
      leukemia_type: 'AML',
      treatment: 'Not on Treatment',
      facility: 'KFH',
      enrolled_at: '2025-01-12T10:00:00Z',
      enrolled_by: ADMIN_ID,
    },
    {
      id: '00000000-0000-0000-0001-000000000003',
      code: '003',
      name: 'Uzaribara Ignace',
      age: 61,
      leukemia_type: 'CLL',
      treatment: 'Not on Treatment',
      facility: 'RMH',
      enrolled_at: '2025-01-15T11:00:00Z',
      enrolled_by: ADMIN_ID,
    },
    {
      id: '00000000-0000-0000-0001-000000000004',
      code: '004',
      name: 'Ruzagiriza Cyriac',
      age: 87,
      leukemia_type: 'AML',
      treatment: 'Not on Treatment',
      facility: 'RMH',
      enrolled_at: '2025-01-18T08:00:00Z',
      enrolled_by: ADMIN_ID,
    },
  ];

  await knex('patients').insert(patients);
}
