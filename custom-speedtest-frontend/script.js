// Import Cloudflare Speedtest module
import SpeedTest from 'https://cdn.skypack.dev/@cloudflare/speedtest';

class CustomSpeedTest {
    constructor() {
        this.speedTest = null;
        this.isRunning = false;
        this.config = this.loadConfig();
        this.initializeElements();
        this.attachEventListeners();
        this.loadSavedConfig();
    }

    initializeElements() {
        // Control elements
        this.startButton = document.getElementById('startTest');
        this.stopButton = document.getElementById('stopTest');
        this.retryButton = document.getElementById('retryTest');
        this.restartButton = document.getElementById('restartTest');
        this.shareButton = document.getElementById('shareResults');
        this.saveConfigButton = document.getElementById('saveConfig');

        // Display elements
        this.progressContainer = document.querySelector('.progress-container');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');
        this.liveResults = document.querySelector('.live-results');
        this.finalResults = document.querySelector('.final-results');
        this.errorMessage = document.querySelector('.error-message');
        this.errorText = document.getElementById('errorText');
        this.qualityScore = document.getElementById('qualityScore');

        // Live result elements
        this.downloadSpeed = document.getElementById('downloadSpeed');
        this.uploadSpeed = document.getElementById('uploadSpeed');
        this.latency = document.getElementById('latency');
        this.jitter = document.getElementById('jitter');

        // Final result elements
        this.finalDownload = document.getElementById('finalDownload');
        this.finalUpload = document.getElementById('finalUpload');
        this.finalLatency = document.getElementById('finalLatency');
        this.finalJitter = document.getElementById('finalJitter');
        this.packetLoss = document.getElementById('packetLoss');

        // Quality score elements
        this.scoreBadge = document.getElementById('scoreBadge');
        this.scoreDescription = document.getElementById('scoreDescription');

        // Config elements
        this.serverUrlInput = document.getElementById('serverUrl');
        this.turnUrlInput = document.getElementById('turnUrl');
        this.enablePacketLossInput = document.getElementById('enablePacketLoss');
        this.enableLoadedLatencyInput = document.getElementById('enableLoadedLatency');
    }

    attachEventListeners() {
        this.startButton.addEventListener('click', () => this.startTest());
        this.stopButton.addEventListener('click', () => this.stopTest());
        this.retryButton.addEventListener('click', () => this.startTest());
        this.restartButton.addEventListener('click', () => this.startTest());
        this.shareButton.addEventListener('click', () => this.shareResults());
        this.saveConfigButton.addEventListener('click', () => this.saveConfig());
    }

    loadConfig() {
        const defaultConfig = {
            serverUrl: '',
            turnUrl: '',
            enablePacketLoss: true,
            enableLoadedLatency: true
        };

        try {
            const saved = localStorage.getItem('speedtest-config');
            return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
        } catch (error) {
            console.warn('Failed to load saved config:', error);
            return defaultConfig;
        }
    }

    loadSavedConfig() {
        this.serverUrlInput.value = this.config.serverUrl;
        this.turnUrlInput.value = this.config.turnUrl;
        this.enablePacketLossInput.checked = this.config.enablePacketLoss;
        this.enableLoadedLatencyInput.checked = this.config.enableLoadedLatency;
    }

    saveConfig() {
        this.config = {
            serverUrl: this.serverUrlInput.value.trim(),
            turnUrl: this.turnUrlInput.value.trim(),
            enablePacketLoss: this.enablePacketLossInput.checked,
            enableLoadedLatency: this.enableLoadedLatencyInput.checked
        };

        try {
            localStorage.setItem('speedtest-config', JSON.stringify(this.config));
            this.showNotification('Configuration saved successfully! 🚀', 'success');
        } catch (error) {
            console.error('Failed to save config:', error);
            this.showNotification('Failed to save configuration', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    hideAllSections() {
        this.progressContainer.style.display = 'none';
        this.liveResults.style.display = 'none';
        this.finalResults.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.qualityScore.style.display = 'none';
    }

    startTest() {
        if (this.isRunning) return;

        // Validate configuration
        if (!this.config.serverUrl) {
            this.showError('Please configure your Vinet speedtest server URL in Advanced Settings');
            return;
        }

        try {
            this.hideAllSections();
            this.isRunning = true;
            this.startButton.style.display = 'none';
            this.stopButton.style.display = 'inline-flex';
            this.progressContainer.style.display = 'block';
            this.liveResults.style.display = 'grid';

            // Reset progress
            this.progressFill.style.width = '0%';
            this.progressText.textContent = 'Initializing test...';

            // Clear previous results
            this.clearResults();

            // Configure SpeedTest
            const speedTestConfig = {
                autoStart: false,
                downloadApiUrl: `${this.config.serverUrl}/__down`,
                uploadApiUrl: `${this.config.serverUrl}/__up`,
                measureDownloadLoadedLatency: this.config.enableLoadedLatency,
                measureUploadLoadedLatency: this.config.enableLoadedLatency,
            };

            // Add TURN server config if provided and packet loss is enabled
            if (this.config.enablePacketLoss && this.config.turnUrl) {
                speedTestConfig.turnServerCredsApiUrl = this.config.turnUrl;
            }

            // Create and configure SpeedTest instance
            this.speedTest = new SpeedTest(speedTestConfig);

            // Attach event listeners
            this.speedTest.onRunningChange = (running) => {
                console.log('Running state changed:', running);
            };

            this.speedTest.onResultsChange = ({ type }) => {
                console.log('Results changed:', type);
                this.updateLiveResults();
                this.updateProgress(type);
            };

            this.speedTest.onFinish = (results) => {
                console.log('Test finished:', results.getSummary());
                this.handleTestComplete(results);
            };

            this.speedTest.onError = (error) => {
                console.error('SpeedTest error:', error);
                this.handleTestError(error);
            };

            // Start the test
            this.speedTest.play();

        } catch (error) {
            console.error('Failed to start test:', error);
            this.handleTestError('Failed to initialize speed test. Please check your configuration.');
        }
    }

    stopTest() {
        if (!this.isRunning || !this.speedTest) return;

        try {
            this.speedTest.pause();
            this.handleTestStop();
        } catch (error) {
            console.error('Failed to stop test:', error);
            this.handleTestError('Failed to stop the test properly.');
        }
    }

    handleTestStop() {
        this.isRunning = false;
        this.startButton.style.display = 'inline-flex';
        this.stopButton.style.display = 'none';
        this.progressText.textContent = 'Test stopped by user';
        this.showNotification('Speed test stopped - Ready when you are!', 'info');
    }

    clearResults() {
        // Clear live results
        this.downloadSpeed.textContent = '-- Mbps';
        this.uploadSpeed.textContent = '-- Mbps';
        this.latency.textContent = '-- ms';
        this.jitter.textContent = '-- ms';

        // Clear final results
        this.finalDownload.textContent = '-- Mbps';
        this.finalUpload.textContent = '-- Mbps';
        this.finalLatency.textContent = '-- ms';
        this.finalJitter.textContent = '-- ms';
        this.packetLoss.textContent = '-- %';
    }

    updateLiveResults() {
        if (!this.speedTest || !this.speedTest.results) return;

        const results = this.speedTest.results;

        // Update download speed
        const downloadBps = results.getDownloadBandwidth();
        if (downloadBps) {
            this.downloadSpeed.textContent = `${(downloadBps / 1e6).toFixed(2)} Mbps`;
        }

        // Update upload speed
        const uploadBps = results.getUploadBandwidth();
        if (uploadBps) {
            this.uploadSpeed.textContent = `${(uploadBps / 1e6).toFixed(2)} Mbps`;
        }

        // Update latency
        const latencyMs = results.getUnloadedLatency();
        if (latencyMs) {
            this.latency.textContent = `${latencyMs.toFixed(1)} ms`;
        }

        // Update jitter
        const jitterMs = results.getUnloadedJitter();
        if (jitterMs) {
            this.jitter.textContent = `${jitterMs.toFixed(1)} ms`;
        }
    }

    updateProgress(measurementType) {
        const progressSteps = {
            'latency': 20,
            'download': 60,
            'upload': 80,
            'packetLoss': 90
        };

        const progress = progressSteps[measurementType] || 0;
        this.progressFill.style.width = `${progress}%`;

        const messages = {
            'latency': 'Measuring latency...',
            'download': 'Testing download speed...',
            'upload': 'Testing upload speed...',
            'packetLoss': 'Checking packet loss...'
        };

        this.progressText.textContent = messages[measurementType] || 'Running test...';
    }

    handleTestComplete(results) {
        this.isRunning = false;
        this.startButton.style.display = 'inline-flex';
        this.stopButton.style.display = 'none';
        
        // Complete progress
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Test completed!';

        // Show final results
        setTimeout(() => {
            this.displayFinalResults(results);
        }, 1000);
    }

    displayFinalResults(results) {
        const summary = results.getSummary();
        
        // Update final results
        this.finalDownload.textContent = summary.downloadBandwidth ? 
            `${(summary.downloadBandwidth / 1e6).toFixed(2)} Mbps` : '-- Mbps';
        
        this.finalUpload.textContent = summary.uploadBandwidth ? 
            `${(summary.uploadBandwidth / 1e6).toFixed(2)} Mbps` : '-- Mbps';
        
        this.finalLatency.textContent = summary.latency ? 
            `${summary.latency.toFixed(1)} ms` : '-- ms';
        
        this.finalJitter.textContent = summary.jitter ? 
            `${summary.jitter.toFixed(1)} ms` : '-- ms';

        // Update packet loss if available
        const packetLossValue = results.getPacketLoss();
        this.packetLoss.textContent = packetLossValue !== null ? 
            `${(packetLossValue * 100).toFixed(2)}%` : '-- %';

        // Show final results section
        this.finalResults.style.display = 'block';
        this.finalResults.classList.add('slide-up');

        // Show quality scores if available
        try {
            const scores = results.getScores();
            if (scores) {
                this.displayQualityScores(scores);
            }
        } catch (error) {
            console.warn('Quality scores not available:', error);
        }

        this.showNotification('Speed test completed successfully! 🇿🇦', 'success');
    }

    displayQualityScores(scores) {
        // Display the overall score or a specific category
        const overallScore = scores.streaming || scores.gaming || scores.rtc || 'N/A';
        
        this.scoreBadge.textContent = overallScore;
        this.scoreDescription.textContent = this.getScoreDescription(overallScore);
        
        this.qualityScore.style.display = 'block';
        this.qualityScore.classList.add('fade-in');
    }

    getScoreDescription(score) {
        if (typeof score !== 'number') return 'Network quality analysis unavailable';
        
        if (score >= 80) return 'Excellent connection - Perfect for streaming, gaming, and video calls';
        if (score >= 60) return 'Good connection - Great for most online activities';
        if (score >= 40) return 'Fair connection - Suitable for basic browsing and emails';
        if (score >= 20) return 'Poor connection - Consider upgrading your Vinet package';
        return 'Very poor connection - Contact Vinet support for assistance';
    }

    handleTestError(error) {
        this.isRunning = false;
        this.startButton.style.display = 'inline-flex';
        this.stopButton.style.display = 'none';
        
        this.hideAllSections();
        this.errorMessage.style.display = 'block';
        this.errorText.textContent = typeof error === 'string' ? error : 
            'An error occurred during the speed test. Please try again.';
        
        console.error('SpeedTest error:', error);
        this.showNotification('Speed test failed. Please check your connection and try again.', 'error');
    }

    showError(message) {
        this.hideAllSections();
        this.errorMessage.style.display = 'block';
        this.errorText.textContent = message;
    }

    shareResults() {
        if (!this.speedTest || !this.speedTest.results) {
            this.showNotification('No results to share', 'error');
            return;
        }

        const summary = this.speedTest.results.getSummary();
        const shareText = `My Vinet Internet Speed Test Results 🇿🇦:
📥 Download: ${summary.downloadBandwidth ? (summary.downloadBandwidth / 1e6).toFixed(2) + ' Mbps' : 'N/A'}
📤 Upload: ${summary.uploadBandwidth ? (summary.uploadBandwidth / 1e6).toFixed(2) + ' Mbps' : 'N/A'}
📡 Latency: ${summary.latency ? summary.latency.toFixed(1) + ' ms' : 'N/A'}
📊 Jitter: ${summary.jitter ? summary.jitter.toFixed(1) + ' ms' : 'N/A'}

Tested with Vinet Internet Solutions speedtest
Get fast, reliable internet in South Africa: https://www.vinet.co.za

Test your speed: ${window.location.href}`;

        if (navigator.share) {
            navigator.share({
                title: 'Vinet Internet Speed Test Results',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Results copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Failed to copy results', 'error');
            });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CustomSpeedTest();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);