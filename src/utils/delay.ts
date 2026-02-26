export const delay = async (ms: number) =>
  new Promise((res) => setTimeout(res, ms));
export const delayInSec = async (s: number) => delay(s * 1000);
