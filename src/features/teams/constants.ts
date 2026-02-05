export const SPORT_OPTIONS = [
  { id: "e252ebdf-a9f5-4f99-8e08-48d7afbabd9c", label: "Lacrosse" },
  { id: "d4db1bea-5df9-4d15-9a5a-ac2fe8d24b2c", label: "Soccer" },
  { id: "c059b081-a9b5-4e1d-a0f4-01e8ae70a508", label: "Basketball" },
];

export const SPORT_LOOKUP = SPORT_OPTIONS.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.id] = option.label;
    return acc;
  },
  {},
);
