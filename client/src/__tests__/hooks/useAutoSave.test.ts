import { renderHook, act } from '@testing-library/react';
import { useAutoSave, AutoSaveData } from '../../hooks/useAutoSave';

// Mock localStorage
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: jest.fn((index: number) => Object.keys(store)[index] || null),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

// Mock timers
jest.useFakeTimers();

// Constants
const DEBOUNCE_MS = 2000;
const CUSTOM_DEBOUNCE_MS = 5000;
const ALMOST_DEBOUNCE = 1999;
const ONE_MS = 1;
const HALF_DEBOUNCE = 1500;
const REMAINING_HALF = 500;
const ERROR_RESET_MS = 3000;
const ALMOST_CUSTOM_DEBOUNCE = 4999;

const TEST_KEY = 'test-quiz-draft';
const EXPECTED_QUIZ_TITLE_JSON = '"quizTitle":"Test Quiz"';
const EXPECTED_CONTENT_CHANGE_3 = '"content":"Change 3"';

describe('useAutoSave Hook', () => {
    const mockData: AutoSaveData = {
        quizTitle: 'Test Quiz',
        selectedFolder: 'folder-123',
        content: 'Test content',
        timestamp: Date.now()
    };

    const defaultOptions = {
        key: TEST_KEY,
        data: mockData,
        enabled: true,
        debounceMs: DEBOUNCE_MS
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        mockLocalStorage.clear();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    describe('Basic functionality', () => {
        test('should initialize with idle status', () => {
            const { result } = renderHook(() => useAutoSave(defaultOptions));

            expect(result.current.status).toBe('idle');
            expect(result.current.lastSaved).toBeNull();
            expect(result.current.hasDraft).toBe(false);
        });

        test('should auto-save after debounce period', async () => {
            const { result } = renderHook(() => useAutoSave(defaultOptions));

            // Fast-forward time to trigger debounced save
            act(() => {
                jest.advanceTimersByTime(DEBOUNCE_MS);
            });

            expect(result.current.status).toBe('saved');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                TEST_KEY,
                expect.stringContaining(EXPECTED_QUIZ_TITLE_JSON)
            );
        });

        test('should update status during save process', async () => {
            const { result } = renderHook(() => useAutoSave(defaultOptions));

            act(() => {
                jest.advanceTimersByTime(ALMOST_DEBOUNCE); 
            });
            expect(result.current.status).toBe('idle');

            act(() => {
                jest.advanceTimersByTime(ONE_MS); 
            });
            expect(result.current.status).toBe('saved');

            // Should reset to idle after 2 seconds
            act(() => {
                jest.advanceTimersByTime(DEBOUNCE_MS);
            });
            expect(result.current.status).toBe('idle');
        });
    });

    describe('Draft restoration', () => {
        test('should restore draft from localStorage', () => {
            const savedDraft = {
                quizTitle: 'Saved Quiz',
                selectedFolder: 'saved-folder',
                content: 'Saved content',
                timestamp: Date.now() - 5000
            };

            mockLocalStorage.setItem(TEST_KEY, JSON.stringify(savedDraft));

            const { result } = renderHook(() => useAutoSave(defaultOptions));

            const restoredDraft = result.current.restoreDraft();
            expect(restoredDraft).toEqual(savedDraft);
        });

        test('should return null if no draft exists', () => {
            const { result } = renderHook(() => useAutoSave(defaultOptions));

            const restoredDraft = result.current.restoreDraft();
            expect(restoredDraft).toBeNull();
        });

        test('should handle corrupted localStorage data', () => {
            mockLocalStorage.setItem(TEST_KEY, 'invalid-json');

            const { result } = renderHook(() => useAutoSave(defaultOptions));

            const restoredDraft = result.current.restoreDraft();
            expect(restoredDraft).toBeNull();
        });

        test('should detect existing draft on mount', () => {
            const savedDraft = {
                quizTitle: 'Existing Draft',
                selectedFolder: 'folder-123',
                content: 'Draft content',
                timestamp: Date.now()
            };

            mockLocalStorage.setItem(TEST_KEY, JSON.stringify(savedDraft));

            const onRestore = jest.fn();
            const { result } = renderHook(() => useAutoSave({
                ...defaultOptions,
                onRestore
            }));

            expect(result.current.hasDraft).toBe(true);
        });
    });

    describe('Draft clearing', () => {
        test('should clear draft from localStorage', () => {
            mockLocalStorage.setItem(TEST_KEY, JSON.stringify(mockData));

            const { result } = renderHook(() => useAutoSave(defaultOptions));

            act(() => {
                result.current.clearDraft();
            });

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(TEST_KEY);
            expect(result.current.hasDraft).toBe(false);
            expect(result.current.lastSaved).toBeNull();
        });
    });

    describe('Debouncing behavior', () => {
        test('should debounce multiple rapid changes', () => {
            const { rerender } = renderHook(
                ({ data }) => useAutoSave({ ...defaultOptions, data }),
                { initialProps: { data: mockData } }
            );

            // Make multiple rapid changes
            rerender({ data: { ...mockData, content: 'Change 1' } });
            rerender({ data: { ...mockData, content: 'Change 2' } });
            rerender({ data: { ...mockData, content: 'Change 3' } });

            // Fast-forward past debounce period
            act(() => {
                jest.advanceTimersByTime(DEBOUNCE_MS);
            });

            // Should only save once with the latest data
            expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                TEST_KEY,
                expect.stringContaining(EXPECTED_CONTENT_CHANGE_3)
            );
        });

        test('should reset debounce timer on new changes', () => {
            const { rerender } = renderHook(
                ({ data }) => useAutoSave({ ...defaultOptions, data }),
                { initialProps: { data: mockData } }
            );

            // Advance time partially
            act(() => {
                jest.advanceTimersByTime(HALF_DEBOUNCE);
            });

            // Make a change that should reset the timer
            rerender({ data: { ...mockData, content: 'New change' } });

            // Should not trigger save
            act(() => {
                jest.advanceTimersByTime(REMAINING_HALF);
            });

            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

            // Advance the full new debounce period
            act(() => {
                jest.advanceTimersByTime(DEBOUNCE_MS);
            });

            expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
        });
    });

    describe('Enabled/disabled state', () => {
        test('should not save when disabled', () => {
            renderHook(() => useAutoSave({
                ...defaultOptions,
                enabled: false
            }));

            act(() => {
                jest.advanceTimersByTime(DEBOUNCE_MS);
            });

            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });

        test('should not add beforeunload listener when disabled', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            renderHook(() => useAutoSave({
                ...defaultOptions,
                enabled: false
            }));

            expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

            addEventListenerSpy.mockRestore();
        });
    });

    describe('Browser warning', () => {
        test('should add beforeunload event listener', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            renderHook(() => useAutoSave(defaultOptions));

            expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

            addEventListenerSpy.mockRestore();
        });

        test('should remove beforeunload event listener on unmount', () => {
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

            const { unmount } = renderHook(() => useAutoSave(defaultOptions));

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

            removeEventListenerSpy.mockRestore();
        });

        test('should prevent unload when there is unsaved content', () => {
            renderHook(() => useAutoSave({
                ...defaultOptions,
                data: { ...mockData, content: 'Unsaved content' }
            }));

            const mockEvent = {
                preventDefault: jest.fn(),
                returnValue: ''
            } as any;

            // Simulate beforeunload event
            window.dispatchEvent(Object.assign(new Event('beforeunload'), mockEvent));

            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test('should not prevent unload when content is empty', () => {
            renderHook(() => useAutoSave({
                ...defaultOptions,
                data: { ...mockData, content: '', quizTitle: '' }
            }));

            const mockEvent = {
                preventDefault: jest.fn(),
                returnValue: ''
            } as any;

            // Simulate beforeunload event
            window.dispatchEvent(Object.assign(new Event('beforeunload'), mockEvent));

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        test('should handle localStorage save errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            const { result } = renderHook(() => useAutoSave(defaultOptions));

            act(() => {
                jest.advanceTimersByTime(DEBOUNCE_MS);
            });

            expect(result.current.status).toBe('error');
            expect(consoleSpy).toHaveBeenCalledWith('Failed to save draft:', expect.any(Error));

            // Should reset to idle after 3 seconds
            act(() => {
                jest.advanceTimersByTime(ERROR_RESET_MS);
            });
            expect(result.current.status).toBe('idle');

            consoleSpy.mockRestore();
        });

        test('should handle localStorage clear errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('Cannot remove item');
            });

            const { result } = renderHook(() => useAutoSave(defaultOptions));

            act(() => {
                result.current.clearDraft();
            });

            expect(consoleSpy).toHaveBeenCalledWith('Failed to clear draft:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('Custom debounce timing', () => {
        test('should respect custom debounce timing', () => {
            renderHook(() => useAutoSave({
                ...defaultOptions,
                debounceMs: CUSTOM_DEBOUNCE_MS
            }));

            // Should not save before custom debounce period
            act(() => {
                jest.advanceTimersByTime(ALMOST_CUSTOM_DEBOUNCE);
            });
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

            // Should save after custom debounce period
            act(() => {
                jest.advanceTimersByTime(ONE_MS);
            });
            expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
        });
    });
});