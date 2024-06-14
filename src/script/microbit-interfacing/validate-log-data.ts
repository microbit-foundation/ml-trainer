/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { PersistantGestureData } from '../domain/Gestures';
import { RecordingData, importGestureData } from '../stores/mlStore';

interface ActionMetaData {
  name: string;
  matrix: boolean[];
}

export const transformCsvToGestureData = (csv: string): PersistantGestureData[] => {
  const rawData = validateLogData(csv);
  const gestures: PersistantGestureData[] = [];
  processRawData(rawData, gestures);
  return gestures;
};

export const validateLogData = (csv: string) => {
  const rows = csvToRows(csv);
  if (!rows) {
    throw new Error('Log data invalid');
  }
  const header = rows[0];
  const actionMetaData = parseHeader(header);
  validateDataLabels(rows[1]);
  const rawData = rows.slice(2);
  return rawData;
};

let inc = 1;

const processRawData = (rawData: string[][], gestures: PersistantGestureData[]): void => {
  const maybeSaveRecording = () => {
    if (recordingLength >= 80 && actionName) {
      // Save current recording, start new recording.
      const logRecording = rawData.slice(
        recordingStart,
        recordingStart + recordingLength,
      );
      const gestureRecording = logRecordingToGestureRecording(logRecording);

      const existingGesture = gestures.find(g => g.name === actionName);
      if (!existingGesture) {
        const gesture = {
          ID: Date.now() + inc,
          recordings: [gestureRecording],
          output: {},
          name: actionName,
        };
        inc++;
        gestures.push(gesture);
      } else {
        existingGesture.recordings.push(gestureRecording);
      }
    }
  };

  let actionName: string | undefined;
  let recordingStart = 0;
  let recordingLength = 0;
  let skipToNextRecording = false;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (rowIsAction(row)) {
      // Save recording if it's valid.
      if (!skipToNextRecording) {
        maybeSaveRecording();
      }
      skipToNextRecording = false;
      recordingStart = i + 1;
      recordingLength = 0;
      actionName = getActionName(row);
      continue;
    }
    if (skipToNextRecording) {
      continue;
    }
    if (rowIsComplete(row)) {
      if (rowIsData(row)) {
        recordingLength++;
      }
    } else {
      skipToNextRecording = true;
    }
  }
  // Save last recording if it's valid.
  maybeSaveRecording();
};

const csvToRows = (csv: string): Array<Array<string>> | null => {
  const rows = csv
    .split('\n')
    .filter(r => r)
    .map(line => line.split(','));

  if (rows.length === 0) {
    return null;
  }
  return rows;
};

const logRecordingToGestureRecording = (logRecording: string[][]): RecordingData => {
  const gestureRecording: RecordingData = {
    ID: Date.now() + inc,
    data: {
      x: [],
      y: [],
      z: [],
    },
  };
  inc++;
  logRecording.forEach(row => {
    gestureRecording.data.x.push(parseFloat(row[0]) / 1000);
    gestureRecording.data.y.push(parseFloat(row[1]) / 1000);
    gestureRecording.data.z.push(parseFloat(row[2]) / 1000);
  });
  return gestureRecording;
};

// TODO
const parseHeader = (header: string[]): ActionMetaData[] => {
  return [];
};

const validateDataLabels = (dataLabels: string[]) => {
  if (dataLabels[0] !== 'x' || dataLabels[1] !== 'y' || dataLabels[2] !== 'z') {
    throw new Error('Data labels are invalid. Expected "x, y, z"');
  }
};

const rowIsAction = (row: string[]) => {
  return row[0] === 'action';
};

const getActionName = (row: string[]) => {
  const actionName = row[1];
  if (!actionName) {
    throw new Error('Action name missing');
  }
  return actionName;
};

const rowIsComplete = (row: string[]): boolean => {
  for (let i = 0; i < 3; i++) {
    if (!row[i]) {
      return false;
    }
  }
  return true;
};

const rowIsData = (row: string[]): boolean => {
  for (let i = 0; i < 3; i++) {
    if (isNaN(parseFloat(row[i]))) {
      throw new Error('Unexpected row');
    }
  }
  return true;
};
