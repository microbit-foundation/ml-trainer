/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import {
  transformCsvToGestureData,
  validateLogData,
} from '../script/microbit-interfacing/validate-log-data';
import {
  incompleteRowInShakeRecording,
  insufficientDataForShakeRecording,
  invalidDataLabels,
  missingActionName,
  shakeDataRecordingOne,
  stillDataRecordingOne,
  stillDataRecordingTwo,
  unexpectedRow,
  validLogData,
} from './fixtures/log-data';

describe('Import data log tests', () => {
  test('valid log is valid', async () => {
    expect(validateLogData(validLogData));
  });

  test('invalid data labels makes log is invalid', async () => {
    expect(() => validateLogData(invalidDataLabels)).toThrowError();
  });

  test('valid log produces expected gestures', async () => {
    const gestureOutput = transformCsvToGestureData(validLogData);
    expect(gestureOutput[0].name).toEqual('still');
    expect(gestureOutput[0].recordings[0].data).toEqual(stillDataRecordingOne);
    expect(gestureOutput[0].recordings[1].data).toEqual(stillDataRecordingTwo);
    expect(gestureOutput[1].name).toEqual('shake');
    expect(gestureOutput[1].recordings[0].data).toEqual(shakeDataRecordingOne);
  });

  test('recordings with insufficient data are dropped', async () => {
    const gestureOutput = transformCsvToGestureData(insufficientDataForShakeRecording);
    expect(gestureOutput[0].name).toEqual('still');
    expect(gestureOutput[0].recordings[0].data).toEqual(stillDataRecordingOne);
    expect(gestureOutput[0].recordings[1].data).toEqual(stillDataRecordingTwo);
    expect(gestureOutput.length).toBe(1);
  });

  test('recordings with incomplete rows are dropped', async () => {
    const gestureOutput = transformCsvToGestureData(incompleteRowInShakeRecording);
    expect(gestureOutput[0].name).toEqual('still');
    expect(gestureOutput[0].recordings[0].data).toEqual(stillDataRecordingOne);
    expect(gestureOutput[0].recordings[1].data).toEqual(stillDataRecordingTwo);
    expect(gestureOutput.length).toBe(1);
  });

  test('missing action name throws', async () => {
    expect(() => transformCsvToGestureData(missingActionName)).toThrowError();
  });

  test('unexpected row / data row in wrong format throws', async () => {
    expect(() => transformCsvToGestureData(unexpectedRow)).toThrowError();
  });
});
