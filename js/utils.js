/**
 * Utility functions for the Pixel Garden Ecosystem
 */

// Generate a random number within a range
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Generate a random integer within a range
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random color in HSL format
function randomColor(hueMin = 0, hueMax = 360, saturation = 80, lightness = 60) {
    return `hsl(${random(hueMin, hueMax)}, ${saturation}%, ${lightness}%)`;
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Convert object to URL parameter string
function objectToParams(obj) {
    return Object.keys(obj)
        .map(key => {
            const value = typeof obj[key] === 'object' 
                ? JSON.stringify(obj[key]) 
                : obj[key];
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&');
}

// Convert URL parameter string to object
function paramsToObject(paramString) {
    const params = new URLSearchParams(paramString);
    const result = {};
    
    for (const [key, value] of params.entries()) {
        try {
            // Try to parse as JSON if it looks like an object or array
            if (value.startsWith('{') || value.startsWith('[')) {
                result[key] = JSON.parse(value);
            } else {
                result[key] = value;
            }
        } catch (e) {
            result[key] = value;
        }
    }
    
    return result;
}

// Throttle function to limit how often a function can be called
function throttle(callback, delay = 100) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            callback.apply(this, args);
        }
    };
}
