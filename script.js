// ============= REUSABLE VALIDATION FUNCTIONS =============

// Validation rules
const validators = {
    name: (value) => {
        value = value.trim();
        if (value.length < 3) return { valid: false, message: 'Name must be at least 3 characters' };
        if (value.length > 50) return { valid: false, message: 'Name must be less than 50 characters' };
        if (!/^[a-zA-Z\s]+$/.test(value)) return { valid: false, message: 'Name can only contain letters and spaces' };
        return { valid: true };
    },

    email: (value) => {
        value = value.trim();
        if (value.length === 0) return { valid: false, message: 'Email is required' };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return { valid: false, message: 'Please enter a valid email address' };
        return { valid: true };
    },

    rating: (value) => {
        const rating = parseInt(value);
        if (rating < 1 || rating > 5) return { valid: false, message: 'Please select a rating' };
        return { valid: true };
    },

    category: (value) => {
        if (!value) return { valid: false, message: 'Please select a category' };
        return { valid: true };
    },

    feedback: (value) => {
        value = value.trim();
        if (value.length < 10) return { valid: false, message: 'Feedback must be at least 10 characters' };
        if (value.length > 500) return { valid: false, message: 'Feedback must be less than 500 characters' };
        return { valid: true };
    }
};

// ============= FIELD VALIDATION FUNCTIONS =============

function validateName() {
    const field = document.getElementById('name');
    const value = field.value;
    const result = validators.name(value);
    
    updateFieldStatus('name', result);
    updateCharacterCount('name', value.length, 50);
    updatePreview();
    updateFormStats();
    
    return result.valid;
}

function validateEmail() {
    const field = document.getElementById('email');
    const value = field.value;
    const result = validators.email(value);
    
    updateFieldStatus('email', result);
    updatePreview();
    updateFormStats();
    
    return result.valid;
}

function validateRating() {
    const rating = document.getElementById('rating').value;
    const result = validators.rating(rating);
    
    updateFieldStatus('rating', result);
    updatePreview();
    updateFormStats();
    
    return result.valid;
}

function validateCategory() {
    const field = document.getElementById('category');
    const value = field.value;
    const result = validators.category(value);
    
    updateFieldStatus('category', result);
    updatePreview();
    updateFormStats();
    
    return result.valid;
}

function validateFeedback() {
    const field = document.getElementById('feedback');
    const value = field.value;
    const result = validators.feedback(value);
    
    updateFieldStatus('feedback', result);
    updateCharacterCount('feedback', value.length, 500);
    updatePreview();
    updateFormStats();
    
    return result.valid;
}

// Helper function to update field status
function updateFieldStatus(fieldId, result) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
        if (result.valid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            if (errorElement) errorElement.textContent = '';
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            if (errorElement) errorElement.textContent = result.message;
        }
    } else if (fieldId === 'rating') {
        // Special handling for rating
        const ratingText = document.getElementById('ratingText');
        if (result.valid) {
            document.getElementById('ratingError').textContent = '';
            if (ratingText) ratingText.style.color = '#28a745';
        } else {
            document.getElementById('ratingError').textContent = result.message;
            if (ratingText) ratingText.style.color = '#dc3545';
        }
    }
}

// Update character count
function updateCharacterCount(fieldId, length, max) {
    const countElement = document.getElementById(fieldId + 'Count');
    if (countElement) {
        countElement.textContent = `${length}/${max}`;
        if (length > max) {
            countElement.style.color = '#dc3545';
        } else if (length < 3 && fieldId === 'name' || length < 10 && fieldId === 'feedback') {
            countElement.style.color = '#ffc107';
        } else {
            countElement.style.color = '#28a745';
        }
    }
}

// ============= EVENT HANDLERS =============

// Handle keypress events
function handleKeyPress(event, fieldName) {
    const key = event.key;
    const timestamp = new Date().toLocaleTimeString();
    
    addToEventLog(`⏱️ ${timestamp} - Key pressed: '${key}' in ${fieldName} field`);
    
    // Special handling for Enter key
    if (key === 'Enter' && fieldName === 'feedback') {
        addToEventLog('   ↳ Enter key detected in feedback');
    }
}

// Highlight field on mouse enter
function highlightField(groupId) {
    const group = document.getElementById(groupId);
    group.classList.add('highlight');
    addToEventLog(`🖱️ Mouse entered: ${groupId.replace('Group', '')} field`);
}

// Remove highlight on mouse leave
function unhighlightField(groupId) {
    const group = document.getElementById(groupId);
    group.classList.remove('highlight');
    addToEventLog(`🖱️ Mouse left: ${groupId.replace('Group', '')} field`);
}

// Star rating functions
let currentRating = 0;

function setRating(rating) {
    currentRating = rating;
    document.getElementById('rating').value = rating;
    
    // Update stars
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
    
    // Update text
    const ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    document.getElementById('ratingText').textContent = ratingTexts[rating];
    
    addToEventLog(`⭐ Rating selected: ${rating} stars (${ratingTexts[rating]})`);
    validateRating();
}

function previewRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('preview');
        }
    });
}

function resetRatingPreview() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('preview');
    });
}

// Form submission with double-click confirmation
let submitClicked = false;

function handleSubmit() {
    addToEventLog('👆 Single click detected - Double-click to confirm');
    
    const btn = document.getElementById('submitBtn');
    btn.classList.add('confirming');
    btn.textContent = '⚠️ Double-click to confirm submission ⚠️';
    
    setTimeout(() => {
        btn.classList.remove('confirming');
        btn.textContent = '📤 Submit Feedback (Double-click to confirm)';
    }, 3000);
}

function confirmSubmit() {
    addToEventLog('✅ Double-click confirmed - Processing submission');
    
    // Validate all fields
    const isValid = validateName() & 
                    validateEmail() & 
                    validateRating() & 
                    validateCategory() & 
                    validateFeedback();
    
    if (isValid) {
        // Show success message
        showMessage('Feedback submitted successfully! Thank you for your feedback.', 'success');
        
        // Log submission
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            rating: currentRating,
            category: document.getElementById('category').value,
            feedback: document.getElementById('feedback').value
        };
        
        addToEventLog('📝 Form data: ' + JSON.stringify(formData));
        
        // Clear form (optional)
        // resetForm();
    } else {
        showMessage('Please fix the errors before submitting.', 'error');
        addToEventLog('❌ Submission failed - validation errors');
    }
    
    // Reset button
    const btn = document.getElementById('submitBtn');
    btn.classList.remove('confirming');
    btn.textContent = '📤 Submit Feedback (Double-click to confirm)';
}

// ============= PREVIEW FUNCTIONS =============

function updatePreview() {
    document.getElementById('previewName').textContent = 
        document.getElementById('name').value.trim() || 'Your Name';
    
    document.getElementById('previewEmail').textContent = 
        document.getElementById('email').value.trim() || 'email@example.com';
    
    document.getElementById('previewFeedback').textContent = 
        document.getElementById('feedback').value.trim() || 'Your feedback will appear here...';
    
    const category = document.getElementById('category');
    document.getElementById('previewCategory').textContent = 
        category.options[category.selectedIndex]?.text || 'Category';
    
    const rating = parseInt(document.getElementById('rating').value);
    document.getElementById('previewRating').innerHTML = '★ ' + (rating || '0');
}

function showPreview() {
    document.getElementById('previewCard').classList.remove('hidden');
    addToEventLog('👁️ Preview section shown');
}

function hidePreview() {
    document.getElementById('previewCard').classList.add('hidden');
    addToEventLog('👁️ Preview section hidden');
}

// ============= FORM STATS =============

function updateFormStats() {
    const fields = ['name', 'email', 'rating', 'category', 'feedback'];
    let completed = 0;
    let valid = 0;
    
    fields.forEach(field => {
        if (field === 'rating') {
            if (document.getElementById('rating').value > 0) {
                completed++;
                if (validators.rating(document.getElementById('rating').value).valid) valid++;
            }
        } else {
            const element = document.getElementById(field);
            if (element && element.value.trim()) {
                completed++;
                if (validators[field] && validators[field](element.value).valid) valid++;
            }
        }
    });
    
    document.getElementById('completedFields').textContent = `${completed}/${fields.length}`;
    document.getElementById('validFields').textContent = `${valid}/${fields.length}`;
    
    const completeness = Math.round((valid / fields.length) * 100);
    document.getElementById('formCompleteness').textContent = completeness + '%';
}

// ============= UTILITY FUNCTIONS =============

function showMessage(text, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = text;
    messageBox.className = `message-box ${type}`;
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function addToEventLog(message) {
    const log = document.getElementById('eventLog');
    const p = document.createElement('p');
    p.textContent = message;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    
    // Keep only last 10 messages
    while (log.children.length > 10) {
        log.removeChild(log.firstChild);
    }
}

function clearLog() {
    document.getElementById('eventLog').innerHTML = '<p>Events cleared...</p>';
}

function resetForm() {
    document.getElementById('feedbackForm').reset();
    setRating(0);
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('selected');
    });
    document.getElementById('ratingText').textContent = 'Select rating';
    document.getElementById('nameCount').textContent = '0/50';
    document.getElementById('feedbackCount').textContent = '0/500';
    
    // Clear validation styles
    ['name', 'email', 'category', 'feedback'].forEach(field => {
        const element = document.getElementById(field);
        element.classList.remove('valid', 'invalid');
    });
    
    addToEventLog('🔄 Form reset');
    updateFormStats();
    updatePreview();
}

// Initialize form stats on load
document.addEventListener('DOMContentLoaded', function() {
    updateFormStats();
    addToEventLog('🚀 Form initialized - Ready for input');
    
    // Add input event listeners for real-time preview
    document.getElementById('name').addEventListener('input', updatePreview);
    document.getElementById('email').addEventListener('input', updatePreview);
    document.getElementById('feedback').addEventListener('input', updatePreview);
    document.getElementById('category').addEventListener('change', updatePreview);
});