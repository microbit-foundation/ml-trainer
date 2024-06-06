/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { writable, type Writable } from 'svelte/store';

// Version of saved information.
// Increment if stored information types are changed
// or if a localstorage data needs to be wiped
// (incrementing it, will overwrite all persistantWritable data stored in localstorage)
const persistVersion = 1;

// Creates a svelte store which automatically loads from localstorage, and
// keeps localstorage up to date
export function persistantWritable<T>(key: string, initValue: T): Writable<T> {
  if (initValue === null || initValue === undefined) {
    throw new Error(
      "Do not use 'null' or 'undefined' values as initial value. Later checking for changes, will result in stored changes being deleted",
    );
  }
  const storedJson: string | null = localStorage.getItem(key);

  let storedObject: unknown;
  try {
    const parseSets = (key: string | number, value: unknown) => {
      if (value instanceof Array && key === 'includedFilters') {
        const setWithFilters = new Set(value);
        return setWithFilters;
      }
      return value;
    };
    storedObject = storedJson != null ? JSON.parse(storedJson, parseSets) : null;
  } catch (error) {
    console.warn(error);
    storedObject = null;
  }

  const useStored = shouldUseStored(storedObject, initValue);
  initValue = useStored
    ? (storedObject as { version: number; value: T }).value
    : initValue;

  const store: Writable<T> = writable(initValue);
  store.subscribe(val =>
    localStorage.setItem(
      key,
      JSON.stringify(
        { version: persistVersion, value: val },
        (key: string | number, value: unknown) => {
          if (value instanceof Set && key === 'includedFilters')
            return [...value] as unknown[];
          return value;
        },
      ),
    ),
  );

  return store;
}

function shouldUseStored<T>(storedObject: unknown, initValue: T): boolean {
  if (storedObject == null) {
    return false;
  }
  if (typeof storedObject !== 'object') {
    return false;
  }
  if (!('value' in storedObject) || !('version' in storedObject)) {
    return false;
  }
  const storedPersistObject = storedObject as { version: unknown; value: unknown }; // This should not be needed, but the typescript rollup plugin complains if we keep working directly on 'storedObject'
  if (storedPersistObject.version !== persistVersion) {
    return false;
  }

  return areMatchingTypes(initValue, storedPersistObject.value);
}

// Recursively checks if to variables of unknown type matches each
// other type and structure wise
// Due to javascript being a dumb language without proper typing, this cannot check
// properly if something in the initial values are null or undefined or if something gets set to null
// or undefined
function areMatchingTypes(value1: unknown, value2: unknown): boolean {
  if (value1 === value2) {
    return true;
  }
  if (value1 === null) {
    // This makes the type-checking incomplete, but otherwise we need to completely ban 'null' values in pesistant storage
    return true;
  }
  const type1 = typeof value1;
  const type2 = typeof value2;
  if (type1 !== type2) {
    return false;
  }

  if (['boolean', 'number', 'string', 'null'].includes(type1)) {
    // value is a primitive
    return true; // We know from previous check that type1 === type2
  }
  if (type1 === 'undefined') {
    throw new Error('You should never use "undefined" as values for persistant storage');
  }
  if (type1 !== 'object') {
    throw new Error('Unrecognised type: ' + type1);
  }

  const isType1Array = Array.isArray(value1);
  const isType2Array = Array.isArray(value2);

  if (isType1Array !== isType2Array) {
    return false;
  }

  if (isType1Array) {
    const array1 = value1 as unknown[];
    const array2 = value2 as unknown[];
    if (array1.length === 0 || array2.length === 0) {
      return true; // Either array is empty -> no type conflict
    }
    for (const item of array2) {
      const isValidItem = areMatchingTypes(array1[0], item);
      if (!isValidItem) {
        return false;
      }
    }
    return true;
  }

  // Both parameters are 'object's and not arrays

  const obj1 = value1 as object;
  const obj2 = value2 as object;

  const obj1Properties = Object.entries(obj1);

  for (const [key, value] of obj1Properties) {
    if (!(key in obj2) && value != null) {
      return false; // A property existing on one object does not exist on the other
    }
  }

  // The two objects have the same properties

  for (const [key, value] of obj1Properties) {
    const obj2Property: unknown = obj2[key as keyof object]; // A bit hacky, but we have already checked to two objects have the same keys
    const isMatch = areMatchingTypes(value as unknown, obj2Property);
    if (!isMatch) {
      return false;
    }
  }
  return true;
}
