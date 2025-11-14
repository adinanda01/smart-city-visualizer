// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const developmentType = document.getElementById('developmentType');
const features = document.getElementById('features');
const generationModel = document.getElementById('generationModel');
const submitBtn = document.getElementById('submitBtn');
const loadingState = document.getElementById('loadingState');
const results = document.getElementById('results');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const loadingMessage = document.getElementById('loadingMessage');

// Progress messages for better UX
const progressMessages = [
    "Analyzing landscape with AI...",
    "Understanding terrain and structures...",
    "Creating smart city blueprint...",
    "Adding sustainable features...",
    "Generating photorealistic visualization...",
    "Finalizing your smart city vision..."
];

// Image preview handling
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File size exceeds 10MB limit', 'error');
            imageInput.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
            imagePreview.classList.add('fade-in');
        };
        reader.readAsDataURL(file);
    }
});

// Simulate progress for better UX
function simulateProgress() {
    let progress = 0;
    let messageIndex = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 95) progress = 95;
        
        progressBar.style.width = `${progress}%`;
        progressPercent.textContent = `${Math.round(progress)}%`;
        
        // Update message
        if (progress > (messageIndex + 1) * 16 && messageIndex < progressMessages.length - 1) {
            messageIndex++;
            loadingMessage.textContent = progressMessages[messageIndex];
        }
        
        if (progress >= 95) {
            clearInterval(interval);
        }
    }, 500);
    
    return interval;
}

// Form submission
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!imageInput.files[0]) {
        showNotification('Please select an image first', 'error');
        return;
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    formData.append('developmentType', developmentType.value);
    formData.append('features', features.value);
    formData.append('generationModel', generationModel.value);
    
    // Show loading state
    submitBtn.disabled = true;
    loadingState.classList.remove('hidden');
    results.classList.add('hidden');
    
    // Reset progress
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    loadingMessage.textContent = progressMessages[0];
    
    // Start progress simulation
    const progressInterval = simulateProgress();
    
    try {
        // Send request to server
        const response = await fetch('/analyze-and-generate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Complete progress
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';
        loadingMessage.textContent = 'Complete!';
        
        // Small delay to show completion
        setTimeout(() => {
            if (data.success) {
                displayResults(data);
                showNotification('Smart city vision generated successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to generate image');
            }
        }, 500);
        
    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        loadingState.classList.add('hidden');
    }
});

// Display results with generated image
function displayResults(data) {
    // Clear previous results
    results.innerHTML = '';
    
    // Success header
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl p-6 mb-6 shadow-lg';
    header.innerHTML = `
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold mb-2">✨ Smart City Vision Generated!</h2>
                <p class="opacity-90">AI Model: ${data.modelUsed} | Processing complete</p>
            </div>
            <div class="text-4xl">🏙️</div>
        </div>
    `;
    results.appendChild(header);
    
    // Generated Image
    if (data.generatedImage) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'bg-white rounded-xl shadow-lg overflow-hidden mb-6';
        imageContainer.innerHTML = `
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-4 flex items-center">
                    <span class="mr-2">🎨</span> Your Smart City Visualization
                </h3>
                <div class="relative group">
                    <img src="data:${data.generatedImage.mimeType};base64,${data.generatedImage.data}" 
                         alt="Generated Smart City" 
                         class="w-full rounded-lg shadow-md">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg"></div>
                    <button onclick="downloadImage('${data.generatedImage.data}', '${data.generatedImage.mimeType}')" 
                            class="absolute top-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Download
                    </button>
                </div>
            </div>
        `;
        results.appendChild(imageContainer);
    }
    
    // Before/After Comparison
    const comparisonContainer = document.createElement('div');
    comparisonContainer.className = 'bg-white rounded-xl shadow-lg p-6 mb-6';
    comparisonContainer.innerHTML = `
        <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="mr-2">🔄</span> Before & After Transformation
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 class="font-medium text-gray-700 mb-2 text-center">Original Landscape</h4>
                <img src="${previewImg.src}" alt="Original" class="w-full rounded-lg shadow-md">
            </div>
            <div>
                <h4 class="font-medium text-gray-700 mb-2 text-center">Smart City Vision</h4>
                ${data.generatedImage 
                    ? `<img src="data:${data.generatedImage.mimeType};base64,${data.generatedImage.data}" alt="Vision" class="w-full rounded-lg shadow-md">`
                    : '<p class="text-gray-500 text-center py-20">Processing...</p>'
                }
            </div>
        </div>
    `;
    results.appendChild(comparisonContainer);
    
    // Analysis & Details
    if (data.analysis || data.prompt) {
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'bg-white rounded-xl shadow-lg p-6 mb-6';
        detailsContainer.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 flex items-center">
                <span class="mr-2">📊</span> Generation Details
            </h3>
            <div class="space-y-4">
                ${data.analysis ? `
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Landscape Analysis</h4>
                        <p class="text-gray-600 bg-gray-50 p-4 rounded-lg">${data.analysis}</p>
                    </div>
                ` : ''}
                ${data.prompt ? `
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Generation Prompt</h4>
                        <p class="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg font-mono">${data.prompt}</p>
                    </div>
                ` : ''}
            </div>
        `;
        results.appendChild(detailsContainer);
    }
    
    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'flex flex-col sm:flex-row gap-4';
    actions.innerHTML = `
        <button onclick="resetForm()" class="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-semibold">
            🔄 Try Another Image
        </button>
        <button onclick="shareResults()" class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            📤 Share Results
        </button>
    `;
    results.appendChild(actions);
    
    // Show results with animation
    results.classList.remove('hidden');
    results.classList.add('fade-in');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Download generated image
function downloadImage(base64Data, mimeType) {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = `smart-city-vision-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Image downloaded successfully!', 'success');
}

// Share results (copy link or open share dialog)
function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'Smart City Vision',
            text: 'Check out this AI-generated smart city transformation!',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        showNotification('Link copied to clipboard!', 'success');
    }
}

// Reset form
function resetForm() {
    uploadForm.reset();
    imagePreview.classList.add('hidden');
    previewImg.src = '';
    results.classList.add('hidden');
    results.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    submitBtn.disabled = false;
    loadingState.classList.add('hidden');
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Drag and drop
const dropZone = imageInput.parentElement.parentElement;

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });
});

dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        imageInput.files = files;
        imageInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
});

// Paste image from clipboard
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            const file = new File([blob], 'pasted-image.png', { type: blob.type });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
            imageInput.dispatchEvent(new Event('change', { bubbles: true }));
            showNotification('Image pasted!', 'success');
            break;
        }
    }
});

// Export functions for global access
window.downloadImage = downloadImage;
window.resetForm = resetForm;
window.shareResults = shareResults;
window.showNotification = showNotification;

// Initialize
console.log('Smart City Visualizer Ready');