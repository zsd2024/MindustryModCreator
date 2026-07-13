module.exports = function (source) {
    const uint8 = new Uint8Array(source);
    const hex = Array.from(uint8).map(b => '0x' + b.toString(16).padStart(2, '0')).join(',');
    return `module.exports=(new Uint8Array([${hex}])).buffer`;
};
module.exports.raw = true;
