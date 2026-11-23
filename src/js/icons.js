// Built-in line icons (24x24, stroke based). No external icon font needed.
(function (w) {
  var HAT = w.HAT = w.HAT || {};

  var CLOUD = '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 10a4 4 0 0 1 0 8z"/>';
  var CLOUD_UP = '<path d="M7 15a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 7a4 4 0 0 1 0 8z"/>';
  var FAN_BLADE = 'M12 10.2c-.6-3.6.3-6.7 2.9-6.7 2.4 0 2.3 3.1-.9 5.6';

  var BULB_GROUP = '<defs><mask id="bg@ID@" maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28"><rect x="-2" y="-2" width="28" height="28" fill="#fff"/><g transform="translate(12 12.4) scale(0.72) translate(-12 -12)" fill="#000" stroke="#000" stroke-width="5.14"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/><path d="M9 18h6M10 21h4"/></g></mask></defs><g mask="url(#bg@ID@)"><g transform="translate(8.5 10.4) scale(0.62) translate(-12 -9.5) rotate(-8 12 16)" stroke-width="2.74"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></g><g transform="translate(15.5 10.4) scale(0.62) translate(-12 -9.5) rotate(8 12 16)" stroke-width="2.74"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></g></g><g transform="translate(12 12.4) scale(0.72) translate(-12 -12)" stroke-width="2.36"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/><path d="M9 18h6M10 21h4"/></g>';

  var P = {
    bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21.5h4"/>',
    bulbgroup: BULB_GROUP,
    tree: '<path d="M12 2.5L7.6 9h2.8L6 15h3.2L5 20.5h14L14.8 15H18l-4.4-6h2.8z"/><path d="M12 20.5v2"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
    fan: '<circle cx="12" cy="12" r="1.4"/><path d="' + FAN_BLADE + '"/><path d="' + FAN_BLADE + '" transform="rotate(120 12 12)"/><path d="' + FAN_BLADE + '" transform="rotate(240 12 12)"/>',
    thermo: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
    flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2 0-3-.5-5 1-8z"/>',
    drop: '<path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z"/>',
    blinds: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M4 12h16M4 16h16"/>',
    garage: '<path d="M3 21V9l9-6 9 6v12"/><path d="M7 21v-8h10v8M7 17h10"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    lockopen: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    door: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M4 21h16"/><circle cx="15" cy="12.5" r=".8"/>',
    window: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/>',
    motion: '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    speaker: '<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="14.5" r="3"/><circle cx="12" cy="7.5" r=".8"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    next: '<path d="M6 5l9 7-9 7zM18 5v14"/>',
    prev: '<path d="M18 5l-9 7 9 7zM6 5v14"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    cloud: CLOUD,
    rain: CLOUD_UP + '<path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    snow: CLOUD_UP + '<path d="M8 19h.01M12 19h.01M16 19h.01M10 21.5h.01M14 21.5h.01"/>',
    storm: CLOUD_UP + '<path d="M12 14l-2 3.5h3L11.5 21"/>',
    fog: '<path d="M4 8h16M6 12h12M4 16h16M8 20h8"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    battery: '<rect x="3" y="8" width="16" height="9" rx="2"/><path d="M21 11v3"/>',
    sofa: '<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z"/><path d="M6 18v2M18 18v2"/>',
    bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
    kitchen: '<path d="M7 3v7a2 2 0 0 0 2 2M11 3v7a2 2 0 0 1-2 2M9 3v18"/><path d="M17 21V3c-2.2 1.2-3 3.600-3 6.500V13h3"/>',
    flower: '<defs><mask id="gd@ID@" maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28"><rect x="-2" y="-2" width="28" height="28" fill="#fff"/><path d="M16.6 7.95L12.7 13.54L14.78 13.54L11.4 19.0L21.8 19.0L18.42 13.54L20.5 13.54z" fill="#000" stroke="#000" stroke-width="3.4" stroke-linejoin="round"/></mask></defs><g mask="url(#gd@ID@)"><g transform="translate(-1.5 0)"><path d="M9.5 3a5 5 0 0 0-4.6 7A4 4 0 0 0 6.5 17.5h6a4 4 0 0 0 1.6-7.6A5 5 0 0 0 9.5 3z"/><path d="M9.5 17.5V21.5"/></g></g><path d="M16.6 7.95L12.7 13.54L14.78 13.54L11.4 19.0L21.8 19.0L18.42 13.54L20.5 13.54z"/><path d="M16.6 19V21.5"/>',
    desk: '<path d="M3 8h18M5 8v12M19 8v12M5 14h6v6"/><path d="M14 4h5v4h-5z"/>',
    back: '<path d="M9 6L4 11l5 5"/><path d="M4 11h9a6 6 0 0 1 0 12h-3"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/>',
    power: '<path d="M12 3v9"/><path d="M6.3 6.5a8 8 0 1 0 11.4 0"/>',
    gear: '<path d="M9.99 2.52L9.99 2.52Q10.38 2.44 10.79 2.38L10.79 2.38Q11.19 2.33 11.59 2.32L11.59 2.32Q12.00 2.30 12.41 2.32L12.41 2.32Q12.81 2.33 13.21 2.38L13.21 2.38Q13.62 2.44 14.01 2.52L14.01 2.52Q14.41 2.60 14.55 3.60L14.64 4.26Q14.77 5.25 14.97 5.34L14.97 5.34Q15.17 5.42 15.36 5.52L15.36 5.52Q15.56 5.63 15.74 5.74L15.74 5.74Q15.93 5.85 16.11 5.97L16.11 5.97Q16.29 6.09 16.46 6.23L16.46 6.23Q16.64 6.36 16.80 6.50L16.80 6.50Q16.96 6.65 17.12 6.80L17.12 6.80Q17.27 6.95 17.42 7.11L17.42 7.11Q17.57 7.28 18.55 7.10L19.21 6.98Q20.19 6.80 20.39 7.15L20.39 7.15Q20.60 7.51 20.77 7.87L20.77 7.87Q20.94 8.24 21.08 8.62L21.08 8.62Q21.23 9.00 21.33 9.39L21.33 9.39Q21.44 9.78 21.52 10.18L21.52 10.18Q21.60 10.58 21.64 10.99L21.64 10.99Q21.68 11.39 20.78 11.83L20.18 12.12Q19.28 12.55 19.26 12.77L19.26 12.77Q19.23 12.98 19.20 13.20L19.20 13.20Q19.16 13.41 19.11 13.63L19.11 13.63Q19.06 13.84 19.00 14.05L19.00 14.05Q18.94 14.26 18.87 14.46L18.87 14.46Q18.80 14.67 18.71 14.87L18.71 14.87Q18.62 15.07 18.53 15.26L18.53 15.26Q18.43 15.46 18.32 15.65L18.32 15.65Q18.21 15.83 18.69 16.71L19.00 17.30Q19.47 18.18 19.20 18.48L19.20 18.48Q18.93 18.79 18.63 19.06L18.63 19.06Q18.34 19.34 18.02 19.60L18.02 19.60Q17.70 19.85 17.36 20.07L17.36 20.07Q17.02 20.30 16.67 20.49L16.67 20.49Q16.31 20.69 15.94 20.85L15.94 20.85Q15.57 21.02 14.88 20.30L14.42 19.82Q13.73 19.09 13.51 19.14L13.51 19.14Q13.30 19.18 13.08 19.22L13.08 19.22Q12.87 19.25 12.65 19.27L12.65 19.27Q12.44 19.29 12.22 19.29L12.22 19.29Q12.00 19.30 11.78 19.29L11.78 19.29Q11.56 19.29 11.35 19.27L11.35 19.27Q11.13 19.25 10.92 19.22L10.92 19.22Q10.70 19.18 10.49 19.14L10.49 19.14Q10.27 19.09 9.58 19.82L9.12 20.30Q8.43 21.02 8.06 20.85L8.06 20.85Q7.69 20.69 7.33 20.49L7.33 20.49Q6.98 20.30 6.64 20.07L6.64 20.07Q6.30 19.85 5.98 19.60L5.98 19.60Q5.66 19.34 5.37 19.06L5.37 19.06Q5.07 18.79 4.80 18.48L4.80 18.48Q4.53 18.18 5.00 17.30L5.31 16.71Q5.79 15.83 5.68 15.65L5.68 15.65Q5.57 15.46 5.47 15.26L5.47 15.26Q5.38 15.07 5.29 14.87L5.29 14.87Q5.20 14.67 5.13 14.46L5.13 14.46Q5.06 14.26 5.00 14.05L5.00 14.05Q4.94 13.84 4.89 13.63L4.89 13.63Q4.84 13.41 4.80 13.20L4.80 13.20Q4.77 12.98 4.74 12.77L4.74 12.77Q4.72 12.55 3.82 12.12L3.22 11.83Q2.32 11.39 2.36 10.99L2.36 10.99Q2.40 10.58 2.48 10.18L2.48 10.18Q2.56 9.78 2.67 9.39L2.67 9.39Q2.77 9.00 2.92 8.62L2.92 8.62Q3.06 8.24 3.23 7.87L3.23 7.87Q3.40 7.51 3.61 7.15L3.61 7.15Q3.81 6.80 4.79 6.98L5.45 7.10Q6.43 7.28 6.58 7.11L6.58 7.11Q6.73 6.95 6.88 6.80L6.88 6.80Q7.04 6.65 7.20 6.50L7.20 6.50Q7.36 6.36 7.54 6.23L7.54 6.23Q7.71 6.09 7.89 5.97L7.89 5.97Q8.07 5.85 8.26 5.74L8.26 5.74Q8.44 5.63 8.64 5.52L8.64 5.52Q8.83 5.42 9.03 5.34L9.03 5.34Q9.23 5.25 9.36 4.26L9.45 3.60Q9.59 2.60 9.99 2.52Z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>'
  };

  HAT.icons = P;

  // Returns an <svg> markup string for the given icon key
  var maskSeq = 0;
  HAT.iconSvg = function (key) {
    var body = P[key] || P.gauge;
    if (body.indexOf('@ID@') >= 0) body = body.replace(/@ID@/g, String(++maskSeq));  // unique mask id per instance
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  };
})(window);
