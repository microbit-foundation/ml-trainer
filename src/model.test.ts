import { isDatasetUserFileFormat } from "./model";

describe("isDatasetUserFileFormat", () => {
  it("checks data", () => {
    expect(isDatasetUserFileFormat([])).toEqual(true);
    expect(isDatasetUserFileFormat(123)).toEqual(false);
    expect(isDatasetUserFileFormat({})).toEqual(false);
  });
  it("checks data properties", () => {
    expect(isDatasetUserFileFormat([{ invalid: 3 }])).toEqual(false);
    expect(isDatasetUserFileFormat([{ name: 3 }])).toEqual(false);
    expect(
      isDatasetUserFileFormat([{ ID: 0, name: "some name", recordings: [] }])
    ).toEqual(true);
  });
  it("checks data recordings", () => {
    const generateData = (recordings: unknown) => [
      { ID: 0, name: "some name", recordings },
    ];
    expect(isDatasetUserFileFormat(generateData({}))).toEqual(false);
    expect(isDatasetUserFileFormat(generateData([]))).toEqual(true);
    expect(
      isDatasetUserFileFormat(generateData([{ ID: 0, data: [] }]))
    ).toEqual(false);
    expect(
      isDatasetUserFileFormat(generateData([{ ID: 0, data: {} }]))
    ).toEqual(false);
    expect(
      isDatasetUserFileFormat(
        generateData([{ ID: 0, data: { x: 0, y: 0, z: 0 } }])
      )
    ).toEqual(false);
    expect(
      isDatasetUserFileFormat(
        generateData([{ ID: 0, data: { x: [], y: [], z: [] } }])
      )
    ).toEqual(true);
  });
});
