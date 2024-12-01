// Save credentials to storage
document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.tagName !== 'FORM') return; // Ensure the target is a form

    const usernameField = form.querySelector('input[type="text"], input[type="email"], input[name="username"], input[name="user"]');
    const passwordField = form.querySelector('input[type="password"]');

    if (usernameField && passwordField) {
        const username = usernameField.value;
        const password = passwordField.value;
        const siteName = window.location.hostname;

        if (username && password) {
                chrome.storage.local.get(['credentials'], (result) => {
                const credentials = result.credentials || [];
                const existingCredential = credentials.find(
                    (cred) => cred.siteName === siteName && cred.username === username
                );

                if (existingCredential) {
                    alert(`These credentials are already saved for this site: ${siteName}`);
                } else {
                    const confirmation = confirm(`Would you like to save your username and password for this site: ${siteName}?`);
                    if (confirmation) {
                        credentials.push({ siteName, username, password }); // Save new credentials
                        chrome.storage.local.set({ credentials }, () => {
                            alert(`Your credentials have been saved for ${siteName}.`);
                        });
                    }
                }
            });
        }
    }
});

// Autofill functionality for user credentials
window.addEventListener('load', () => {
    const autofillForms = () => {
        const forms = document.querySelectorAll('form');
        chrome.storage.local.get(['credentials'], (result) => {
            const credentials = result.credentials || [];
            const siteName = window.location.hostname;
            const availableCredentials = credentials.filter(
                (cred) => cred.siteName === siteName
            );

            if (availableCredentials.length > 0) {
                forms.forEach((form) => {
                    const usernameField = form.querySelector('input[type="text"], input[type="email"], input[name="username"], input[name="user"]');
                    const passwordField = form.querySelector('input[type="password"]');

                    if (usernameField && passwordField) {
                        const credential = availableCredentials[0]; // Use the first available credential
                        usernameField.value = credential.username;
                        passwordField.value = credential.password;
                    }
                });
            }
        });
    };

    // Initial autofill
    autofillForms();

    // Observe for new forms being added to the DOM
    const observer = new MutationObserver(autofillForms);
    observer.observe(document.body, { childList: true, subtree: true });
});

// Detect login forms and autofill
function detectAndAutofillLogin() {
    chrome.storage.local.get(['credentials'], (result) => {
        const credentials = result.credentials || [];
        const siteName = window.location.hostname;
        const availableCredentials = credentials.filter(
            (cred) => cred.siteName === siteName
        );

        if (availableCredentials.length > 0) {
            const forms = document.querySelectorAll('form');
            forms.forEach((form) => {
                const usernameField = form.querySelector('input[type="text"], input[type="email"], input[name="username"], input[name="user"]');
                const passwordField = form.querySelector('input[type="password"]');

                if (usernameField && passwordField) {
                    const credential = availableCredentials[0]; // Use the first available credential
                    usernameField.value = credential.username;
                    passwordField.value = credential.password;
                }
            });
        }
    });
}

// Call the detectAndAutofillLogin function on page load
window.addEventListener('load', detectAndAutofillLogin);

// Observe for new forms being added to the DOM and autofill them
const observer = new MutationObserver(detectAndAutofillLogin);
observer.observe(document.body, { childList: true, subtree: true });
