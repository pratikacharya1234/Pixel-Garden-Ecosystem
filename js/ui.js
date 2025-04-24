/**
 * UI class for the Pixel Garden Ecosystem
 * Handles user interface interactions and controls
 */

class UI {
    constructor(garden) {
        this.garden = garden;
        this.statsUpdateInterval = null;
        
        // Set up all event listeners for UI controls
        this.setupSeedButtons();
        this.setupEnvironmentControls();
        this.setupActionButtons();
        
        // Start statistics update
        this.startStatsUpdate();
    }
    
    setupSeedButtons() {
        // Handle seed type selection
        document.querySelectorAll('.seed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.seed-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Set the selected seed type in the garden
                const seedType = e.target.dataset.type;
                this.garden.setSelectedSeedType(seedType);
            });
        });
    }
    
    setupEnvironmentControls() {
        // Toggle rain
        document.getElementById('toggle-rain').addEventListener('click', (e) => {
            this.garden.environment.toggleRain();
            e.target.classList.toggle('active');
        });
        
        // Toggle sunshine
        document.getElementById('toggle-sun').addEventListener('click', (e) => {
            this.garden.environment.toggleSunshine();
            e.target.classList.toggle('active');
        });
        
        // Change season
        document.getElementById('toggle-season').addEventListener('click', (e) => {
            this.garden.environment.changeSeason();
            this.updateSeasonButton();
        });
        
        // Clear garden
        document.getElementById('clear-garden').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the garden?')) {
                this.garden.clearGarden();
            }
        });
    }
    
    setupActionButtons() {
        // Export garden as image
        document.getElementById('export-btn').addEventListener('click', () => {
            const dataURL = this.garden.exportAsImage();
            const link = document.createElement('a');
            link.download = 'pixel-garden.png';
            link.href = dataURL;
            link.click();
        });
        
        // Save garden to local storage
        document.getElementById('save-btn').addEventListener('click', () => {
            StorageManager.saveGarden(this.garden);
            alert('Garden saved successfully!');
        });
        
        // Load garden from local storage
        document.getElementById('load-btn').addEventListener('click', () => {
            if (confirm('Load the last saved garden? Current garden will be replaced.')) {
                const success = StorageManager.loadGarden(this.garden);
                if (success) {
                    alert('Garden loaded successfully!');
                } else {
                    alert('No saved garden found.');
                }
            }
        });
        
        // Share garden via URL
        document.getElementById('share-btn').addEventListener('click', () => {
            const shareURL = StorageManager.generateShareURL(this.garden);
            
            // Create a temporary input to copy the URL
            const tempInput = document.createElement('input');
            tempInput.value = shareURL;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            alert('Share URL copied to clipboard!');
        });
    }
    
    startStatsUpdate() {
        // Update statistics every second
        this.statsUpdateInterval = setInterval(() => {
            this.updateStatistics();
        }, 1000);
    }
    
    updateStatistics() {
        // Update plant count
        const plantCount = this.garden.getPlantCount();
        document.getElementById('plant-count').textContent = plantCount;
        
        // Update moisture and sunlight levels
        const envStats = this.garden.environment.getAverageStats();
        document.getElementById('moisture-level').textContent = `${envStats.moisture}%`;
        
        // Update sunlight based on time of day and season
        const sunlightText = this.getSunlightDescription(envStats.sunlight);
        document.getElementById('sunlight-level').textContent = sunlightText;
    }
    
    getSunlightDescription(sunlightValue) {
        if (sunlightValue > 80) return 'Strong';
        if (sunlightValue > 60) return 'Moderate';
        if (sunlightValue > 40) return 'Mild';
        if (sunlightValue > 20) return 'Weak';
        return 'Very Low';
    }
    
    updateSeasonButton() {
        const season = this.garden.environment.season;
        const capitalized = season.charAt(0).toUpperCase() + season.slice(1);
        document.getElementById('toggle-season').textContent = `Season: ${capitalized}`;
    }
    
    cleanup() {
        // Stop the stats update interval when needed
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
    }
}
