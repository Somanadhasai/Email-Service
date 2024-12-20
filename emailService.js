class EmailService {
    constructor() {
        this.providers = [this.mockProvider1, this.mockProvider2];
        this.attempts = {};
        this.rateLimit = 5; // Max emails per minute
        this.lastSentTime = 0;
    }

    async sendEmail(emailId, recipient, subject, body) {
        let status = 'Pending'; // Initialize status tracking
        console.log(`Starting to send email to ${recipient}...`); // Log start of email sending
        if (this.isRateLimited()) {
            console.log('Rate limit exceeded. Please try again later.');
            return;
        }

        // Check if the email has already been sent to ensure idempotency
        if (this.attempts[emailId]) {
            console.log('Email already sent. Idempotency check passed.'); 
            return;
        }

        this.attempts[emailId] = true; // Mark as attempted
        let attempt = 0;
        let success = false;

        while (attempt < this.providers.length && !success) {
            try {
                success = await this.sendWithProvider(this.providers[attempt], recipient, subject, body);
                if (success) {
                    console.log(`Email sent successfully to ${recipient} using provider ${attempt + 1}`);
                    this.lastSentTime = Date.now();
                } else {
                    throw new Error('Failed to send email');
                }
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
                attempt++;
                await this.exponentialBackoff(attempt);
            }
        }

        if (!success) {
            console.log('All providers failed to send the email.');
        }
    }

    async sendWithProvider(provider, recipient, subject, body) {
        return provider(recipient, subject, body);
    }

    async mockProvider1(recipient, subject, body) {
        // Simulate a successful send
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                Math.random() > 0.5 ? resolve(true) : reject(new Error('Provider 1 error'));
            }, 1000);
        });
    }

    async mockProvider2(recipient, subject, body) {
        // Simulate a successful send
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                Math.random() > 0.5 ? resolve(true) : reject(new Error('Provider 2 error'));
            }, 1000);
        });
    }

    async exponentialBackoff(attempt) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    isRateLimited() {
        const now = Date.now();
        return (now - this.lastSentTime) < (60 * 1000 / this.rateLimit);
    }
}

// Example usage
const emailService = new EmailService();
emailService.sendEmail('unique-email-id', 'recipient@example.com', 'Subject', 'Email body');
