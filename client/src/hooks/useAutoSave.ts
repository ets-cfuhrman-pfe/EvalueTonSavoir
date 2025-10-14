// useAutoSave.ts
import { useEffect, useRef, useCallback, useState } from 'react';

export interface AutoSaveData {
    quizTitle: string;
    selectedFolder: string;
    content: string;
    timestamp: number;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
    key: string; // localStorage key (e.g., 'quiz-draft-new' or 'quiz-draft-123')
    data: AutoSaveData;
    enabled?: boolean; // Allow disabling auto-save
    debounceMs?: number; // Debounce delay in milliseconds (default: 2000ms = 2s)
    onRestore?: (data: AutoSaveData) => void; // Callback when data is restored
}

interface UseAutoSaveReturn {
    status: AutoSaveStatus;
    lastSaved: Date | null;
    clearDraft: () => void;
    restoreDraft: () => AutoSaveData | null;
    hasDraft: boolean;
}

/**
 * Hook for auto-saving quiz editor data to localStorage
 * - Automatically saves data after debounce period
 * - Provides draft restoration on component mount
 * - Shows save status
 * - Warns user before leaving with unsaved changes
 */
export const useAutoSave = ({
    key,
    data,
    enabled = true,
    debounceMs = 2000,
    onRestore
}: UseAutoSaveOptions): UseAutoSaveReturn => {
    const [status, setStatus] = useState<AutoSaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasDraft, setHasDraft] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);

    // Check for existing draft on mount
    useEffect(() => {
        if (isInitialMount.current) {
            const draft = restoreDraft();
            if (draft && onRestore) {
                setHasDraft(true);
                // Don't auto-restore, just notify that a draft exists
                // The component can decide whether to restore
            }
            isInitialMount.current = false;
        }
    }, []);

    // Save to localStorage
    const saveDraft = useCallback(() => {
        if (!enabled) return;

        try {
            setStatus('saving');
            const draftData: AutoSaveData = {
                ...data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(draftData));
            setStatus('saved');
            setLastSaved(new Date());
            setHasDraft(true);

            // Reset to idle after 2 seconds
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save draft:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    }, [key, data, enabled]);

    // Debounced auto-save effect
    useEffect(() => {
        if (!enabled || isInitialMount.current) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout for debounced save
        timeoutRef.current = setTimeout(() => {
            saveDraft();
        }, debounceMs);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, enabled, debounceMs, saveDraft]);

    // Restore draft from localStorage
    const restoreDraft = useCallback((): AutoSaveData | null => {
        try {
            const savedData = localStorage.getItem(key);
            if (savedData) {
                const parsed = JSON.parse(savedData) as AutoSaveData;
                return parsed;
            }
        } catch (error) {
            console.error('Failed to restore draft:', error);
        }
        return null;
    }, [key]);

    // Clear draft from localStorage
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(key);
            setHasDraft(false);
            setLastSaved(null);
        } catch (error) {
            console.error('Failed to clear draft:', error);
        }
    }, [key]);

    // Warn user before leaving with unsaved changes
    useEffect(() => {
        if (!enabled) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Only warn if there's unsaved content
            if (data.content.trim() !== '' || data.quizTitle.trim() !== '') {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [enabled, data.content, data.quizTitle]);

    return {
        status,
        lastSaved,
        clearDraft,
        restoreDraft,
        hasDraft
    };
};
