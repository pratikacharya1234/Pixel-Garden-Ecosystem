/**
 * Main application script for the Pixel Garden Ecosystem
 * Initializes the garden, UI, and animation loop
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the garden canvas
    const garden = new GardenCanvas('garden-canvas');
    
    // Initialize UI controls
    const ui = new UI(garden);
    
    // Check if the URL contains garden data to load
    const hasLoadedFromURL = StorageManager.loadFromURL(garden);
    if (hasLoadedFromURL) {
        console.log('Garden loaded from shared URL');
    }
    
    // Animation loop
    let lastTime = 0;
    const fps = 30;
    const frameInterval = 1000 / fps;
    
    function gameLoop(timestamp) {
        // Calculate time delta
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        
        // Only update at the specified FPS
        if (deltaTime >= frameInterval) {
            // Update garden state
            garden.update();
            
            // Render the garden
            garden.render();
            
            lastTime = timestamp - (deltaTime % frameInterval);
        }
        
        // Request next frame
        requestAnimationFrame(gameLoop);
    }
    
    // Start the simulation
    requestAnimationFrame(gameLoop);
    
    // Add some helpful instructions to the console
    console.log('%cPixel Garden Ecosystem', 'font-size: 20px; color: #2E7D32; font-weight: bold;');
    console.log('Click on the canvas to plant seeds. Use the controls to modify the environment.');
    console.log('Watch how your plants grow and adapt to the changing conditions!');
    
    // Add polyfill for browsers that don't support path2d
    if (!window.Path2D) {
        console.warn('Path2D not supported in this browser. Using fallback rendering.');
    }
    
    // Handle page unload to prevent data loss
    window.addEventListener('beforeunload', (e) => {
        // Auto-save the garden when leaving the page
        StorageManager.saveGarden(garden);
    });
});
