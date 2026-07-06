export const numberRemoveEndZero = (value: string) => {
  if (!value.includes(".")) return value;
  return value.replace(/(?:\.0*|(\.\d+?)0+)$/, "$1");
};
