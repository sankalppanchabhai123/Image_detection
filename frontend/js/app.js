class AIContentDetector {
    // Update the apiEndpoint in your AIContentDetector class constructor
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.previewSection = document.getElementById('previewSection');
        this.previewContainer = document.getElementById('previewContainer');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        
        // API configuration
        this.apiEndpoint = 'http://localhost:3000/api/detect'; // Use the full URL with correct port
        
        this.initializeEventListeners();
    }
    
    // Remove the loadApiKey and promptForApiKey methods since we're handling the API key on the backend

    initializeEventListeners() {
        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // Click to upload
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        this.previewSection.classList.remove('hidden');
        this.previewContainer.innerHTML = '';
        
        Array.from(files).forEach(file => {
            const preview = this.createPreview(file);
            this.previewContainer.appendChild(preview);
            this.processFile(file, preview);
        });
    }

    createPreview(file) {
        const preview = document.createElement('div');
        preview.className = 'result-card p-4 rounded-lg glow';
        
        const content = document.createElement('div');
        content.className = 'space-y-4';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.className = 'w-full h-48 object-cover rounded';
            img.src = URL.createObjectURL(file);
            content.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.className = 'w-full h-48 object-cover rounded';
            video.src = URL.createObjectURL(file);
            video.controls = true;
            content.appendChild(video);
        }

        const status = document.createElement('div');
        status.className = 'text-center';
        status.innerHTML = `
            <div class="spinner mx-auto mb-2"></div>
            <p>Processing ${file.name}...</p>
        `;
        content.appendChild(status);

        preview.appendChild(content);
        return preview;
    }

    async processFile(file, previewElement) {
        try {
            const result = await this.sendFileToAPI(file);
            this.updatePreviewWithResult(previewElement, result);
        } catch (error) {
            console.error('Error processing file:', error);
            this.showError(previewElement, error.message);
        }
    }

    async sendFileToAPI(file) {
        // Create form data to send file
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                isAIGenerated: data.isAIGenerated,
                confidence: data.confidence,
                filename: file.name
            };
        } catch (error) {
            console.error('API request failed:', error);
            throw new Error('Failed to analyze content. Please try again.');
        }
    }

    // Fallback to simulation if API fails or for testing
    async simulateAPICall(file) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            isAIGenerated: Math.random() > 0.5,
            confidence: Math.random() * 100,
            filename: file.name
        };
    }

    updatePreviewWithResult(previewElement, result) {
        const statusDiv = previewElement.querySelector('div:last-child');
        const confidence = result.confidence.toFixed(1);
        
        statusDiv.innerHTML = `
            <div class="mb-4">
                <span class="text-lg font-semibold ${result.isAIGenerated ? 'text-red-400' : 'text-green-400'}">
                    ${result.isAIGenerated ? 'AI-Generated' : 'Real Content'}
                </span>
            </div>
            <div class="relative h-2 bg-gray-700 rounded">
                <div class="absolute h-full rounded bg-gradient-to-r from-cyan-400 to-purple-600 progress-bar"
                     style="--progress-width: ${confidence}%"></div>
            </div>
            <div class="mt-2 text-sm text-gray-400">
                AI Percentage: ${confidence}%
            </div>
        `;
    }

    showError(previewElement, message = 'Error processing file. Please try again.') {
        const statusDiv = previewElement.querySelector('div:last-child');
        statusDiv.innerHTML = `
            <div class="text-red-400">
                ${message}
            </div>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AIContentDetector();
});