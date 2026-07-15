import {Theme, defaultBlockColors} from '../../../src/lib/themes';
import {injectExtensionBlockTheme, injectExtensionCategoryTheme} from '../../../src/lib/themes/blockHelpers';
import {detectTheme, persistTheme} from '../../../src/lib/themes/themePersistance';

describe('themes', () => {
    let serializeToString;

    describe('core functionality', () => {
        test('provides the default theme colors', () => {
            expect(defaultBlockColors.motion.primary).toBeDefined();
        });

        test('returns the dark mode', () => {
            const colors = Theme.dark.getBlockColors();

            expect(colors.motion.primary).toBeDefined();
        });

        test('uses default theme colors when not specified', () => {
            const colors = Theme.dark.getBlockColors();

            expect(colors.motion.secondary).toBeDefined();
        });
    });

    describe('block helpers', () => {
        beforeEach(() => {
            serializeToString = jest.fn(() => 'mocked xml');

            global.XMLSerializer = function () {
                return {serializeToString};
            };
        });

        test('updates extension block colors based on theme', () => {
            const blockInfoJson = {
                type: 'dummy_block',
                colour: '#0FBD8C',
                colourSecondary: '#0DA57A',
                colourTertiary: '#0B8E69'
            };

            const darkBlocksTheme = Theme.light.set('blocks', 'dark');
            const updated = injectExtensionBlockTheme(blockInfoJson, darkBlocksTheme);

            // Dark theme customExtensionColors overrides the colors
            expect(updated.colour).not.toBe(blockInfoJson.colour);
            expect(updated.colourSecondary).not.toBe(blockInfoJson.colourSecondary);
            expect(updated.type).toBe('dummy_block');
            // The original value was not modified
            expect(blockInfoJson.colour).toBe('#0FBD8C');
        });

        test('updates extension block icon based on theme', () => {
            const blockInfoJson = {
                type: 'pen_block',
                args0: [
                    {
                        type: 'field_image',
                        src: 'original'
                    }
                ],
                colour: '#0FBD8C',
                colourSecondary: '#0DA57A',
                colourTertiary: '#0B8E69'
            };

            const darkBlocksTheme = Theme.light.set('blocks', 'dark');
            const updated = injectExtensionBlockTheme(blockInfoJson, darkBlocksTheme);

            // No icons configured in the dark theme extensions data
            expect(updated.args0[0].src).toBe('original');
            expect(updated.colour).not.toBe(blockInfoJson.colour);
            // The original value was not modified
            expect(blockInfoJson.args0[0].src).toBe('original');
        });

        test('bypasses updates if using the default theme', () => {
            const blockInfoJson = {
                type: 'dummy_block',
                colour: '#0FBD8C',
                colourSecondary: '#0DA57A',
                colourTertiary: '#0B8E69'
            };

            const updated = injectExtensionBlockTheme(blockInfoJson, Theme.light);

            expect(updated).toEqual({
                type: 'dummy_block',
                colour: '#0FBD8C',
                colourSecondary: '#0DA57A',
                colourTertiary: '#0B8E69'
            });
        });

        test('updates extension category based on theme', () => {
            const dynamicBlockXML = [
                {
                    id: 'pen',
                    xml: '<category name="Pen" id="pen" colour="#0FBD8C" secondaryColour="#0DA57A"></category>'
                }
            ];

            const darkBlocksTheme = Theme.light.set('blocks', 'dark');
            const result = injectExtensionCategoryTheme(dynamicBlockXML, darkBlocksTheme);

            expect(result).toBeDefined();
            expect(result.length).toBe(1);
        });
    });

    describe('theme persistance', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        test('returns the theme stored in localStorage', () => {
            localStorage.setItem('tw:theme', JSON.stringify({blocks: 'high-contrast'}));

            const theme = detectTheme();

            expect(theme.blocks).toEqual(Theme.highContrast.blocks);
        });

        test('returns the system theme when no stored preference', () => {
            const theme = detectTheme();

            expect(theme.accent).toEqual(Theme.light.accent);
            expect(theme.gui).toEqual(Theme.light.gui);
            expect(theme.blocks).toEqual(Theme.light.blocks);
        });

        test('persists theme to localStorage', () => {
            persistTheme(Theme.highContrast);

            const stored = JSON.parse(localStorage.getItem('tw:theme'));
            expect(stored.blocks).toEqual('high-contrast');
        });

        test('clears theme when matching system preferences', () => {
            persistTheme(Theme.highContrast);
            persistTheme(Theme.light);

            expect(localStorage.getItem('tw:theme')).toBeNull();
        });
    });
});
