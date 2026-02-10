// form.js - Contact Form Handler with Email Redirect

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
});

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };
    
    // Validate required fields
    if (!formData.name || !formData.phone || !formData.subject || !formData.message) {
        showFormResponse('দয়া করে সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন।', 'error');
        return;
    }
    
    // Get subject text in Bengali
    const subjectSelect = document.getElementById('subject');
    const subjectText = subjectSelect.options[subjectSelect.selectedIndex].text;
    
    // Create email body
    const emailBody = `নাম: ${formData.name}
ফোন নম্বর: ${formData.phone}
ইমেইল: ${formData.email || 'প্রদান করা হয়নি'}
বিষয়: ${subjectText}

বার্তা:
${formData.message}`;
    
    // Create mailto link
    const mailtoLink = `mailto:sarberiapallysebasamity07@gmail.com?subject=${encodeURIComponent('যোগাযোগ ফর্ম: ' + subjectText)}&body=${encodeURIComponent(emailBody)}`;
    
    // Show success message
    showFormResponse('আপনার ইমেইল ক্লায়েন্ট খোলা হচ্ছে...', 'success');
    
    // Redirect to email client
    window.location.href = mailtoLink;
    
    // Reset form after a short delay
    setTimeout(() => {
        contactForm.reset();
        hideFormResponse();
    }, 2000);
}

function showFormResponse(message, type) {
    const responseDiv = document.getElementById('form-response');
    
    if (responseDiv) {
        responseDiv.textContent = message;
        responseDiv.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
        responseDiv.style.display = 'block';
    }
}

function hideFormResponse() {
    const responseDiv = document.getElementById('form-response');
    
    if (responseDiv) {
        responseDiv.style.display = 'none';
    }
}
