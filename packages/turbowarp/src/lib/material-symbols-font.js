const fontUrl = require('material-symbols/material-symbols-outlined.woff2');
const style = document.createElement('style');
style.textContent = '@font-face{font-family:"Material Symbols Outlined";font-style:normal;font-weight:100 700;font-display:block;src:url("' + fontUrl + '") format("woff2")}';
document.head.appendChild(style);
