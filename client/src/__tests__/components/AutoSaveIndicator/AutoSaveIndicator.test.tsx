import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutoSaveIndicator from '../../../components/AutoSaveIndicator/AutoSaveIndicator';
import { AutoSaveStatus } from '../../../hooks/useAutoSave';

// Mock MUI icons
jest.mock('@mui/icons-material/CheckCircle', () => {
    return function MockCheckCircleIcon(props: any) {
        return <span data-testid="check-circle-icon" {...props} />;
    };
});

jest.mock('@mui/icons-material/Sync', () => {
    return function MockSyncIcon(props: any) {
        return <span data-testid="sync-icon" {...props} />;
    };
});

jest.mock('@mui/icons-material/Error', () => {
    return function MockErrorIcon(props: any) {
        return <span data-testid="error-icon" {...props} />;
    };
});

// Constants 
const THIRTY_SECONDS_MS = 30000;
const ONE_MINUTE_MS = 60000;
const FIVE_MINUTES_MS = 300000;
const TWO_HOURS_MS = 7200000;
const TEN_MINUTES_MS = 600000;
const THREE_HOURS_MS = 10800000;
const FIFTY_NINE_SECONDS_MS = 59000;

const SAVING_TEXT = 'Sauvegarde...';
const SAVED_TEXT = 'Sauvegardé';
const SAVED_INSTANT_TEXT = 'Sauvegardé à l\'instant';
const SAVED_ONE_MINUTE_TEXT = 'Sauvegardé il y a 1 minute';
const SAVED_FIVE_MINUTES_TEXT = 'Sauvegardé il y a 5 minutes';
const SAVED_TEN_MINUTES_TEXT = 'Sauvegardé il y a 10 minutes';
const SAVED_TIME_REGEX = /Sauvegardé \d{1,2} h \d{2}/;
const ERROR_TEXT = 'Erreur de sauvegarde';
const SAVED_REGEX = /Sauvegardé/;

const SYNC_ICON_TEST_ID = 'sync-icon';
const CHECK_CIRCLE_ICON_TEST_ID = 'check-circle-icon';
const ERROR_ICON_TEST_ID = 'error-icon';

const AUTO_SAVE_INDICATOR_CLASS = 'auto-save-indicator';
const AUTO_SAVE_INDICATOR_ICON_CLASS = 'auto-save-indicator__icon';
const AUTO_SAVE_INDICATOR_ICON_SPINNING_CLASS = 'auto-save-indicator__icon--spinning';

const MUI_CHIP_COLOR_INFO = 'MuiChip-colorInfo';
const MUI_CHIP_COLOR_SUCCESS = 'MuiChip-colorSuccess';
const MUI_CHIP_COLOR_ERROR = 'MuiChip-colorError';
const MUI_CHIP_OUTLINED = 'MuiChip-outlined';
const MUI_CHIP_SIZE_SMALL = 'MuiChip-sizeSmall';

describe('AutoSaveIndicator Component', () => {
    const mockDate = new Date('2023-10-09T10:30:00Z');

    beforeAll(() => {
        // Mock Date.now() for consistent testing
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    describe('Status rendering', () => {
        test('should render saving status correctly', () => {
            render(<AutoSaveIndicator status="saving" lastSaved={null} />);

            expect(screen.getByText(SAVING_TEXT)).toBeInTheDocument();
            expect(screen.getByTestId(SYNC_ICON_TEST_ID)).toBeInTheDocument();
            expect(screen.getByTestId(SYNC_ICON_TEST_ID)).toHaveClass(AUTO_SAVE_INDICATOR_ICON_SPINNING_CLASS);
        });

        test('should render saved status without timestamp', () => {
            render(<AutoSaveIndicator status="saved" lastSaved={null} />);

            expect(screen.getByText(SAVED_TEXT)).toBeInTheDocument();
            expect(screen.getByTestId(CHECK_CIRCLE_ICON_TEST_ID)).toBeInTheDocument();
        });

        test('should render saved status with recent timestamp', () => {
            const recentDate = new Date(mockDate.getTime() - THIRTY_SECONDS_MS); 
            render(<AutoSaveIndicator status="saved" lastSaved={recentDate} />);

            expect(screen.getByText(SAVED_INSTANT_TEXT)).toBeInTheDocument();
            expect(screen.getByTestId(CHECK_CIRCLE_ICON_TEST_ID)).toBeInTheDocument();
        });

        test('should render saved status with 1 minute timestamp', () => {
            const oneMinuteAgo = new Date(mockDate.getTime() - ONE_MINUTE_MS); 
            render(<AutoSaveIndicator status="saved" lastSaved={oneMinuteAgo} />);

            expect(screen.getByText(SAVED_ONE_MINUTE_TEXT)).toBeInTheDocument();
        });

        test('should render saved status with multiple minutes timestamp', () => {
            const fiveMinutesAgo = new Date(mockDate.getTime() - FIVE_MINUTES_MS); 
            render(<AutoSaveIndicator status="saved" lastSaved={fiveMinutesAgo} />);

            expect(screen.getByText(SAVED_FIVE_MINUTES_TEXT)).toBeInTheDocument();
        });

        test('should render saved status with time for old timestamps', () => {
            const twoHoursAgo = new Date(mockDate.getTime() - TWO_HOURS_MS); 
            render(<AutoSaveIndicator status="saved" lastSaved={twoHoursAgo} />);

            expect(screen.getByText(SAVED_TIME_REGEX)).toBeInTheDocument();
        });

        test('should render error status correctly', () => {
            render(<AutoSaveIndicator status="error" lastSaved={null} />);

            expect(screen.getByText(ERROR_TEXT)).toBeInTheDocument();
            expect(screen.getByTestId(ERROR_ICON_TEST_ID)).toBeInTheDocument();
        });

        test('should not render anything for idle status', () => {
            const { container } = render(<AutoSaveIndicator status="idle" lastSaved={null} />);

            expect(container.firstChild).toBeNull();
        });

        test('should not render anything for unknown status', () => {
            const { container } = render(
                <AutoSaveIndicator status={'unknown' as AutoSaveStatus} lastSaved={null} />
            );

            expect(container.firstChild).toBeNull();
        });
    });

    describe('CSS classes', () => {
        test('should apply correct CSS classes for saving status', () => {
            render(<AutoSaveIndicator status="saving" lastSaved={null} />);

            const chip = screen.getByText(SAVING_TEXT).closest('div'); 
            expect(chip).toHaveClass(AUTO_SAVE_INDICATOR_CLASS);

            const icon = screen.getByTestId(SYNC_ICON_TEST_ID);
            expect(icon).toHaveClass(AUTO_SAVE_INDICATOR_ICON_CLASS);
            expect(icon).toHaveClass(AUTO_SAVE_INDICATOR_ICON_SPINNING_CLASS);
        });

        test('should apply correct CSS classes for saved status', () => {
            render(<AutoSaveIndicator status="saved" lastSaved={mockDate} />);

            const chip = screen.getByText(SAVED_REGEX).closest('div');
            expect(chip).toHaveClass(AUTO_SAVE_INDICATOR_CLASS);

            const icon = screen.getByTestId(CHECK_CIRCLE_ICON_TEST_ID);
            expect(icon).toHaveClass(AUTO_SAVE_INDICATOR_ICON_CLASS);
            expect(icon).not.toHaveClass(AUTO_SAVE_INDICATOR_ICON_SPINNING_CLASS);
        });

        test('should apply correct CSS classes for error status', () => {
            render(<AutoSaveIndicator status="error" lastSaved={null} />);

            const chip = screen.getByText(ERROR_TEXT).closest('div');
            expect(chip).toHaveClass(AUTO_SAVE_INDICATOR_CLASS);

            const icon = screen.getByTestId(ERROR_ICON_TEST_ID);
            expect(icon).toHaveClass(AUTO_SAVE_INDICATOR_ICON_CLASS);
            expect(icon).not.toHaveClass(AUTO_SAVE_INDICATOR_ICON_SPINNING_CLASS);
        });
    });

    describe('Chip properties', () => {
        test('should render chip with correct props for saving status', () => {
            render(<AutoSaveIndicator status="saving" lastSaved={null} />);

            const chip = screen.getByText(SAVING_TEXT).closest('div');
            expect(chip).toHaveClass(MUI_CHIP_COLOR_INFO);
            expect(chip).toHaveClass(MUI_CHIP_OUTLINED);
            expect(chip).toHaveClass(MUI_CHIP_SIZE_SMALL);
        });

        test('should render chip with correct props for saved status', () => {
            render(<AutoSaveIndicator status="saved" lastSaved={mockDate} />);

            const chip = screen.getByText(SAVED_REGEX).closest('div');
            expect(chip).toHaveClass(MUI_CHIP_COLOR_SUCCESS);
            expect(chip).toHaveClass(MUI_CHIP_OUTLINED);
            expect(chip).toHaveClass(MUI_CHIP_SIZE_SMALL);
        });

        test('should render chip with correct props for error status', () => {
            render(<AutoSaveIndicator status="error" lastSaved={null} />);

            const chip = screen.getByText(ERROR_TEXT).closest('div');
            expect(chip).toHaveClass(MUI_CHIP_COLOR_ERROR);
            expect(chip).toHaveClass(MUI_CHIP_OUTLINED);
            expect(chip).toHaveClass(MUI_CHIP_SIZE_SMALL);
        });
    });

    describe('Timestamp formatting', () => {
        test('should format seconds correctly', () => {
            const thirtySecondsAgo = new Date(mockDate.getTime() - THIRTY_SECONDS_MS);
            render(<AutoSaveIndicator status="saved" lastSaved={thirtySecondsAgo} />);

            expect(screen.getByText(SAVED_INSTANT_TEXT)).toBeInTheDocument();
        });

        test('should format single minute correctly', () => {
            const oneMinuteAgo = new Date(mockDate.getTime() - ONE_MINUTE_MS);
            render(<AutoSaveIndicator status="saved" lastSaved={oneMinuteAgo} />);

            expect(screen.getByText(SAVED_ONE_MINUTE_TEXT)).toBeInTheDocument();
        });

        test('should format multiple minutes correctly', () => {
            const tenMinutesAgo = new Date(mockDate.getTime() - TEN_MINUTES_MS);
            render(<AutoSaveIndicator status="saved" lastSaved={tenMinutesAgo} />);

            expect(screen.getByText(SAVED_TEN_MINUTES_TEXT)).toBeInTheDocument();
        });

        test('should format hours as time string', () => {
            const threeHoursAgo = new Date(mockDate.getTime() - THREE_HOURS_MS); 
            render(<AutoSaveIndicator status="saved" lastSaved={threeHoursAgo} />);

            // Should show time in HH:MM format
            expect(screen.getByText(SAVED_TIME_REGEX)).toBeInTheDocument();
        });

        test('should handle null lastSaved date', () => {
            render(<AutoSaveIndicator status="saved" lastSaved={null} />);

            expect(screen.getByText(SAVED_TEXT)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA attributes for saving status', () => {
            render(<AutoSaveIndicator status="saving" lastSaved={null} />);

            const chip = screen.getByText(SAVING_TEXT).closest('div');
            expect(chip).toBeInTheDocument();
            expect(chip).toHaveTextContent(SAVING_TEXT);
        });

        test('should have proper ARIA attributes for saved status', () => {
            render(<AutoSaveIndicator status="saved" lastSaved={mockDate} />);

            const chip = screen.getByText(SAVED_REGEX).closest('div');
            expect(chip).toBeInTheDocument();
            expect(chip).toHaveTextContent(SAVED_REGEX);
        });

        test('should have proper ARIA attributes for error status', () => {
            render(<AutoSaveIndicator status="error" lastSaved={null} />);

            const chip = screen.getByText(ERROR_TEXT).closest('div');
            expect(chip).toBeInTheDocument();
            expect(chip).toHaveTextContent(ERROR_TEXT);
        });
    });

    describe('Edge cases', () => {
        test('should handle edge case of exactly 60 seconds', () => {
            const sixtySecondsAgo = new Date(mockDate.getTime() - ONE_MINUTE_MS);
            render(<AutoSaveIndicator status="saved" lastSaved={sixtySecondsAgo} />);

            expect(screen.getByText(SAVED_ONE_MINUTE_TEXT)).toBeInTheDocument();
        });

        test('should handle edge case of exactly 59 seconds', () => {
            const fiftyNineSecondsAgo = new Date(mockDate.getTime() - FIFTY_NINE_SECONDS_MS);
            render(<AutoSaveIndicator status="saved" lastSaved={fiftyNineSecondsAgo} />);

            expect(screen.getByText(SAVED_INSTANT_TEXT)).toBeInTheDocument();
        });

        test('should handle future dates gracefully', () => {
            const futureDate = new Date(mockDate.getTime() + ONE_MINUTE_MS); 
            render(<AutoSaveIndicator status="saved" lastSaved={futureDate} />);

            // Should still render without crashing
            expect(screen.getByText(SAVED_REGEX)).toBeInTheDocument();
        });
    });

    describe('Component updates', () => {
        test('should update when status changes', () => {
            const { rerender } = render(<AutoSaveIndicator status="idle" lastSaved={null} />);

            // Should not render anything initially
            expect(screen.queryByRole('button')).not.toBeInTheDocument();

            // Update to saving status
            rerender(<AutoSaveIndicator status="saving" lastSaved={null} />);
            expect(screen.getByText(SAVING_TEXT)).toBeInTheDocument();

            // Update to saved status
            rerender(<AutoSaveIndicator status="saved" lastSaved={mockDate} />);
            expect(screen.getByText(SAVED_REGEX)).toBeInTheDocument();
        });

        test('should update timestamp display when lastSaved changes', () => {
            const initialDate = new Date(mockDate.getTime() - ONE_MINUTE_MS); 
            const { rerender } = render(
                <AutoSaveIndicator status="saved" lastSaved={initialDate} />
            );

            expect(screen.getByText(SAVED_ONE_MINUTE_TEXT)).toBeInTheDocument();

            // Update to more recent save
            const recentDate = new Date(mockDate.getTime() - THIRTY_SECONDS_MS); 
            rerender(<AutoSaveIndicator status="saved" lastSaved={recentDate} />);

            expect(screen.getByText(SAVED_INSTANT_TEXT)).toBeInTheDocument();
        });
    });
});