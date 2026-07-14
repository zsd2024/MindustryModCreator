import 'web-audio-test-api';

const getProjectTitleFromFilename = (fileInputFilename) => {
    if (!fileInputFilename) return '';
    const matches = fileInputFilename.match(/^(.*)\.sb[23]?$/);
    if (!matches) return '';
    return matches[1].substring(0, 100);
};

describe('SBFileUploaderHOC', () => {
    test('correctly sets title with .sb3 filename', () => {
        const projectName = getProjectTitleFromFilename('my project is great.sb3');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb2 filename', () => {
        const projectName = getProjectTitleFromFilename('my project is great.sb2');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb filename', () => {
        const projectName = getProjectTitleFromFilename('my project is great.sb');
        expect(projectName).toBe('my project is great');
    });

    test('sets blank title with filename with no extension', () => {
        const projectName = getProjectTitleFromFilename('my project is great');
        expect(projectName).toBe('');
    });
});
