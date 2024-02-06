export const CortexSpecialReg = {
  // Debug Halting Control and Status Register
  DHCSR: 0xe000edf0,
  S_RESET_ST: 1 << 25,

  NVIC_AIRCR: 0xe000ed0c,
  NVIC_AIRCR_VECTKEY: 0x5fa << 16,
  NVIC_AIRCR_SYSRESETREQ: 1 << 2,

  // Many more.
};
