import {
  calculateTotalExperienceYears,
  validateWorkStep,
  validateRatesStep,
} from '../src/utils/serviceProviderValidation';
const experience = {
  id: 'job',
  jobTitle: 'Technician',
  companyName: 'Repairs',
  startDate: '2020-01-01',
  endDate: '',
  currentlyWorking: true,
};
const education = {
  id: 'edu',
  title: 'Diploma',
  institution: 'Institute',
  startDate: '2018-01-01',
  endDate: '2019-01-01',
  description: 'Technical training',
};
const work = () => ({
  totalExperience: '2-5',
  experiences: [{ ...experience }],
  educations: [{ ...education }],
});
const rates = () => ({
  hourlyRate: '20',
  serviceCallCharge: '0',
  minimumCharge: '0',
  availabilityPreference: 'WEEKENDS',
  workingAreas: [
    {
      id: 'area',
      address: 'Main Road',
      area: 'Central',
      city: 'Dubai',
      pinCode: '00000',
    },
  ],
});
test('ongoing work does not need an end date and certificates do not need a URL', () => {
  expect(validateWorkStep(work())).toEqual({});
});
test('calculates exact experience from date ranges without double-counting overlaps', () => {
  expect(
    calculateTotalExperienceYears(
      [
        {
          ...experience,
          startDate: '2020-01-01',
          endDate: '2022-07-02',
          currentlyWorking: false,
        },
        {
          ...experience,
          startDate: '2021-01-01',
          endDate: '2023-01-01',
          currentlyWorking: false,
        },
      ],
      new Date('2024-01-01T00:00:00.000Z'),
    ),
  ).toBe(3);
  expect(calculateTotalExperienceYears([experience])).not.toBeNull();
  expect(
    calculateTotalExperienceYears([
      { ...experience, startDate: 'invalid', currentlyWorking: false },
    ]),
  ).toBeNull();
});
test('requires nonempty repeated sections and trimmed fields on the experience step', () => {
  const form = work();
  form.totalExperience = '';
  form.experiences[0].jobTitle = ' ';
  expect(validateWorkStep(form)).toMatchObject({
    totalExperience: expect.any(String),
    'experiences.job.jobTitle': expect.any(String),
  });
  expect(
    validateWorkStep({ ...form, experiences: [], educations: [] }),
  ).toMatchObject({
    experiences: expect.any(String),
    educations: expect.any(String),
  });
});
test('invalid calendar dates, missing end dates and reversed ranges are caught on step 2', () => {
  const form = work();
  form.experiences[0].currentlyWorking = false;
  form.educations[0].startDate = '2025-02-30';
  expect(validateWorkStep(form)['experiences.job.endDate']).toBeDefined();
  expect(validateWorkStep(form)['educations.edu.startDate']).toBeDefined();
  form.educations[0].startDate = '2025-01-01';
  form.educations[0].endDate = '2024-01-01';
  expect(validateWorkStep(form)['educations.edu.endDate']).toContain(
    'on or after',
  );
});
test('rates reject NaN, Infinity, negative and blank values while allowing zero call and minimum charges', () => {
  expect(validateRatesStep(rates())).toEqual({});
  for (const value of ['NaN', 'Infinity', '-1', ' ', '0'])
    expect(
      validateRatesStep({ ...rates(), hourlyRate: value }).hourlyRate,
    ).toBeDefined();
  expect(
    validateRatesStep({ ...rates(), serviceCallCharge: '-1' })
      .serviceCallCharge,
  ).toBeDefined();
});
test('working area errors use stable row IDs and unsupported availability values are rejected', () => {
  const form = rates();
  form.workingAreas[0].city = ' ';
  expect(validateRatesStep(form)['workingAreas.area.city']).toBeDefined();
  expect(
    validateRatesStep({ ...form, workingAreas: [] }).workingAreas,
  ).toBeDefined();
  expect(
    validateRatesStep({ ...rates(), availabilityPreference: 'WEEKENDS_ONLY' })
      .availabilityPreference,
  ).toBeDefined();
});

test('geocoded areas support multiple selections without postal codes and reject duplicates or missing coordinates', () => {
  const first = {
    id: 'one',
    address: 'Kiulap, Brunei',
    area: 'Kiulap',
    city: 'Bandar Seri Begawan',
    pinCode: '',
    coordinates: { latitude: 4.91, longitude: 114.93 },
  };
  const second = {
    ...first,
    id: 'two',
    city: 'London',
    area: 'Westminster',
    coordinates: { latitude: 51.5, longitude: -0.12 },
  };
  expect(
    validateRatesStep({ ...rates(), workingAreas: [first, second] }),
  ).toEqual({});
  expect(
    validateRatesStep({
      ...rates(),
      workingAreas: [first, { ...first, id: 'duplicate' }],
    })['workingAreas.duplicate.area'],
  ).toBeDefined();
  expect(
    validateRatesStep({
      ...rates(),
      workingAreas: [{ ...first, coordinates: null }],
    })['workingAreas.one.coordinates'],
  ).toBeDefined();
});
