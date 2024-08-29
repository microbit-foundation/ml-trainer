import { isValidGestureData } from "./hooks/use-gestures";

describe("isValidStoredGestureData", () => {
  it("checks data", () => {
    expect(isValidGestureData({})).toEqual(false);
    expect(isValidGestureData({ data: [] })).toEqual(true);
    expect(isValidGestureData({ data: 123 })).toEqual(false);
    expect(isValidGestureData({ data: {} })).toEqual(false);
  });
  it("checks data properties", () => {
    expect(isValidGestureData({ data: [{ invalid: 3 }] })).toEqual(false);
    expect(isValidGestureData({ data: [{ name: 3 }] })).toEqual(false);
    expect(
      isValidGestureData({
        data: [{ ID: 0, name: "some name", recordings: [] }],
      })
    ).toEqual(true);
  });
  it("checks data recordings", () => {
    const generateData = (recordings: unknown) => ({
      data: [{ ID: 0, name: "some name", recordings }],
    });
    expect(isValidGestureData(generateData({}))).toEqual(false);
    expect(isValidGestureData(generateData([]))).toEqual(true);
    expect(isValidGestureData(generateData([{ ID: 0, data: [] }]))).toEqual(
      false
    );
    expect(isValidGestureData(generateData([{ ID: 0, data: {} }]))).toEqual(
      false
    );
    expect(
      isValidGestureData(generateData([{ ID: 0, data: { x: 0, y: 0, z: 0 } }]))
    ).toEqual(false);
    expect(
      isValidGestureData(
        generateData([{ ID: 0, data: { x: [], y: [], z: [] } }])
      )
    ).toEqual(true);
  });
});
