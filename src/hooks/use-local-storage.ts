
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Use a ref to hold initialValue. This helps stabilize `readValue` if `initialValue` is a new reference
  // to a logically identical value (e.g. `[]` passed on every render from the parent).
  const initialValueRef = useRef(initialValue);

  // Update the ref if the initialValue prop actually changes.
  // This effect runs if `initialValue` itself changes (e.g. from [] to a different array).
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current; // Use ref's current value
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current; // Use ref
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current; // Use ref
    }
  }, [key]); // `readValue`'s identity now only changes if `key` changes.

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // This effect handles updates to `storedValue` if `key` changes after initial render.
  // `readValue`'s identity changes only when `key` changes, so this effect runs correctly.
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting localStorage key "${key}" even though environment is not a client`
      );
    }
    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
      window.dispatchEvent(new Event("local-storage")); // For cross-tab sync
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]); // `setValue` depends on `key` and `storedValue` (for functional updates)

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
         try {
           setStoredValue(JSON.parse(event.newValue) as T);
         } catch (error) {
            console.warn(`Error parsing storage event value for key "${key}":`, error);
         }
      }
    };
    const handleLocalStorageEvent = () => {
      // This handles same-tab updates triggered by `setValue` in another instance of the hook
      setStoredValue(readValue());
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleLocalStorageEvent); // For cross-tab sync

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleLocalStorageEvent);
    };
  }, [key, readValue]); // `readValue` dependency is fine since it only changes identity with `key`.

  return [storedValue, setValue];
}

export default useLocalStorage;
