import { EMPTY_VALUE_LABEL } from "../constants";

export const formatEmptyValue = (value: unknown, emptyLabel = EMPTY_VALUE_LABEL) => {
  const raw = value ?? "";
  const text = String(raw);
  return text !== "" ? text : emptyLabel;
};

export const formatDateTime = (value: unknown, emptyLabel = EMPTY_VALUE_LABEL) => {
  const raw = value ?? "";
  const text = String(raw);
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? (text || emptyLabel) : d.toLocaleString();
};
