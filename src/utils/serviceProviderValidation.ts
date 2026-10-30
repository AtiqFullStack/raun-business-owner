export type StepErrors = Record<string, string>;

type Experience = {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
};
type Education = {
  id: string;
  title: string;
  institution: string;
  startDate: string;
  endDate: string;
  description: string;
};
type Area = {
  id: string;
  address: string;
  area: string;
  city: string;
  pinCode: string;
};

function dateValue(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
    ? date.getTime()
    : null;
}
function validateDates(
  errors: StepErrors,
  key: string,
  start: string,
  end: string,
  ongoing = false,
) {
  const from = dateValue(start),
    to = dateValue(end);
  if (from === null)
    errors[`${key}.startDate`] = 'Please select a valid start date.';
  if (!ongoing) {
    if (to === null)
      errors[`${key}.endDate`] = 'Please select a valid end date.';
    else if (from !== null && to < from)
      errors[`${key}.endDate`] = 'End date must be on or after start date.';
  }
}

export function validateWorkStep(form: {
  totalExperience: string;
  experiences: Experience[];
  educations: Education[];
}): StepErrors {
  const errors: StepErrors = {};
  if (!['lt1', '1-2', '2-5', '5-10', '10+'].includes(form.totalExperience))
    errors.totalExperience = 'Please select your experience range.';
  if (!form.experiences.length)
    errors.experiences = 'Please add at least one work experience.';
  form.experiences.forEach(entry => {
    const key = `experiences.${entry.id}`;
    if (!entry.jobTitle.trim())
      errors[`${key}.jobTitle`] = 'Please enter your job title.';
    if (!entry.companyName.trim())
      errors[`${key}.companyName`] =
        'Please enter the company or organization.';
    validateDates(
      errors,
      key,
      entry.startDate,
      entry.endDate,
      entry.currentlyWorking,
    );
  });
  if (!form.educations.length)
    errors.educations = 'Please add at least one education or certification.';
  form.educations.forEach(entry => {
    const key = `educations.${entry.id}`;
    if (!entry.title.trim())
      errors[`${key}.title`] = 'Please enter the degree or certificate.';
    if (!entry.institution.trim())
      errors[`${key}.institution`] = 'Please enter the institution.';
    if (!entry.description.trim())
      errors[`${key}.description`] = 'Please enter a short description.';
    validateDates(errors, key, entry.startDate, entry.endDate);
  });
  return errors;
}

export const PROVIDER_AVAILABILITY = [
  'FULL_TIME',
  'PART_TIME',
  'WEEKENDS',
  'FLEXIBLE',
];
export function validateRatesStep(form: {
  hourlyRate: string;
  serviceCallCharge: string;
  minimumCharge: string;
  availabilityPreference: string;
  workingAreas: Area[];
}): StepErrors {
  const errors: StepErrors = {};
  for (const field of [
    'hourlyRate',
    'serviceCallCharge',
    'minimumCharge',
  ] as const) {
    const value = form[field].trim();
    const number = Number(value);
    if (!value) errors[field] = 'Please enter an amount.';
    else if (
      !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ||
      !Number.isFinite(number) ||
      (field === 'hourlyRate' ? number <= 0 : number < 0)
    )
      errors[field] =
        field === 'hourlyRate'
          ? 'Enter a valid amount greater than zero.'
          : 'Enter a valid amount of zero or more.';
  }
  if (!PROVIDER_AVAILABILITY.includes(form.availabilityPreference))
    errors.availabilityPreference = 'Please select your availability.';
  if (!form.workingAreas.length)
    errors.workingAreas = 'Please add at least one working area.';
  form.workingAreas.forEach(entry => {
    for (const field of ['address', 'area', 'city', 'pinCode'] as const) {
      if (!entry[field].trim())
        errors[`workingAreas.${entry.id}.${field}`] = `Please enter ${
          field === 'pinCode'
            ? 'a pin code'
            : field === 'address'
            ? 'an address'
            : field === 'area'
            ? 'an area'
            : 'a city'
        }.`;
    }
  });
  return errors;
}
