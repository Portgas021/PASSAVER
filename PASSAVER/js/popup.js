document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'login.html' || currentPage === 'signup.html') {
        checkLoginStatus();
    }

    if (currentPage === 'login.html') {
        setupLoginPage();
    } else if (currentPage === 'signup.html') {
        setupSignupPage();
    } else if (currentPage === 'dashboard.html') {
        setupDashboardPage();
    }

    function checkLoginStatus() {
        chrome.storage.local.get(['isLoggedIn', 'lastActivityTime'], (result) => {
            const currentTime = new Date().getTime();
            const lastActivityTime = result.lastActivityTime || 0;
            const oneHour = 60 * 60 * 1000;

            if (result.isLoggedIn && (currentTime - lastActivityTime < oneHour)) {
                chrome.storage.local.set({ lastActivityTime: currentTime });
                if (currentPage !== 'dashboard.html') {
                    window.location.href = 'dashboard.html';
                }
            } else {
                chrome.storage.local.set({ isLoggedIn: false });
                if (currentPage !== 'login.html' && currentPage !== 'signup.html') {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    function setupLoginPage() {
        const masterPasswordInput = document.getElementById('masterPassword');
        const loginButton = document.getElementById('loginButton');

        // Login Functionality
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                chrome.storage.local.get(['masterPassword'], (result) => {
                    if (masterPasswordInput.value === result.masterPassword) {
                        const currentTime = new Date().getTime();
                        chrome.storage.local.set({ isLoggedIn: true, lastActivityTime: currentTime }, () => {
                            window.location.href = 'dashboard.html';
                        });
                    } else {
                        alert('Incorrect Master Password');
                    }
                });
            });
        }
    }

    function setupSignupPage() {
        const signupForm = document.querySelector('.form-container');
        const newMasterPasswordInput = document.getElementById('newMasterPassword');
        const confirmMasterPasswordInput = document.getElementById('confirmMasterPassword');

        // Sign-Up functionality
        if (signupForm) {
            signupForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const newMasterPassword = newMasterPasswordInput.value;
                const confirmMasterPassword = confirmMasterPasswordInput.value;

                if (!newMasterPassword || !confirmMasterPassword) {
                    alert('Please fill out both fields.');
                    return;
                }

                if (newMasterPassword !== confirmMasterPassword) {
                    alert('Passwords do not match.');
                    return;
                }

                // Save Master Password in Chrome's local storage
                chrome.storage.local.set({ masterPassword: newMasterPassword }, () => {
                    alert('Master Password created successfully!');
                    window.location.href = 'login.html';
                });
            });
        }
    }

    function setupDashboardPage() {
        const credentialsList = document.getElementById('credentialsList');
        const logoutButton = document.getElementById('logoutButton');
        const deleteAccountButton = document.getElementById('deleteAccountButton');
        const showAddCredentialFormButton = document.getElementById('showAddCredentialFormButton');
        const addCredentialForm = document.getElementById('addCredentialForm');
        const credentialForm = document.getElementById('credentialForm');
        const generatePasswordButton = document.getElementById('generatePasswordButton');
        const generatedPasswordInput = document.getElementById('generatedPassword');
        const changeMasterPasswordButton = document.getElementById('changeMasterPasswordButton');
        const newMasterPasswordInput = document.getElementById('newMasterPassword');
        const confirmNewMasterPasswordInput = document.getElementById('confirmNewMasterPassword');
        const copyPasswordButton = document.getElementById('copyPasswordButton');
        const cancelAddCredentialButton = document.getElementById('cancelAddCredentialButton');

        // Update last activity time on any interaction
        document.body.addEventListener('click', () => {
            chrome.storage.local.set({ lastActivityTime: new Date().getTime() });
        });

        // Load saved credentials
        loadCredentials();

        // Show Add Credential Form with sliding effect
        if (showAddCredentialFormButton) {
            showAddCredentialFormButton.addEventListener('click', () => {
                addCredentialForm.classList.toggle('d-none');
                addCredentialForm.classList.toggle('slide-down');
            });
        }

        // Cancel Add Credential Form
        if (cancelAddCredentialButton) {
            cancelAddCredentialButton.addEventListener('click', () => {
                addCredentialForm.classList.add('d-none');
                addCredentialForm.classList.remove('slide-down');
            });
        }

        // Handle Add Credential Form submission
        if (credentialForm) {
            credentialForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const siteName = document.getElementById('siteName').value;
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                if (siteName && username && password) {
                    chrome.storage.local.get(['credentials'], (result) => {
                        const credentials = result.credentials || [];
                        const existingCredential = credentials.find(
                            (cred) => cred.siteName === siteName && cred.username === username
                        );

                        if (existingCredential && existingCredential.password === password) {
                            alert('This account already exists for the website.');
                        } else if (existingCredential) {
                            alert('This username already exists for the website with a different password.');
                        } else {
                            credentials.push({ siteName, username, password });
                            chrome.storage.local.set({ credentials }, () => {
                                alert('Credential saved successfully!');
                                loadCredentials();
                                addCredentialForm.classList.add('d-none');
                                credentialForm.reset();
                            });
                        }
                    });
                }
            });
        }

        // Logout functionality
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                chrome.storage.local.set({ isLoggedIn: false }, () => {
                    window.location.href = 'login.html';
                });
            });
        }

        // Delete account functionality
        if (deleteAccountButton) {
            deleteAccountButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    chrome.storage.local.clear(() => {
                        alert('Account deleted!');
                        window.location.href = 'login.html';
                    });
                }
            });
        }

        // Change Master Password
        if (changeMasterPasswordButton) {
            changeMasterPasswordButton.addEventListener('click', () => {
                newMasterPasswordInput.classList.toggle('d-none');
                confirmNewMasterPasswordInput.classList.toggle('d-none');
            });
        }

        // Auto-generate password
        if (generatePasswordButton) {
            generatePasswordButton.addEventListener('click', () => {
                const password = generateRandomPassword();
                generatedPasswordInput.value = password;
            });
        }

        // Copy generated password
        if (copyPasswordButton) {
            copyPasswordButton.addEventListener('click', () => {
                generatedPasswordInput.select();
                document.execCommand('copy');
                alert('Password copied to clipboard!');
            });
        }

        // Load credentials into the list
        function loadCredentials() {
            if (!credentialsList) return;
            credentialsList.innerHTML = '';
            chrome.storage.local.get(['credentials'], (result) => {
                const credentials = result.credentials || [];
                if (credentials.length === 0) {
                    const item = document.createElement('div');
                    item.className = 'credential-item';
                    item.innerHTML = `<div class="credential-info">No credentials saved yet.</div>`;
                    credentialsList.appendChild(item);
                } else {
                    credentials.forEach((credential, index) => {
                        const item = document.createElement('div');
                        item.className = 'credential-item d-flex justify-content-between align-items-center';
                        item.innerHTML = `
                            <div class="credential-info" style="font-family: 'Roboto', sans-serif;">
                                <span class="credential-site">${credential.siteName}</span>
                                <span class="credential-username">${credential.username}</span>
                                <span class="password-text">• • • • • • • •</span>
                            </div>
                            <div class="credential-actions">
                                <button class="togglePassword" data-index="${index}"><img src="img/vp.png" alt="View Password"></button>
                                <button class="editCredential" data-index="${index}"><img src="img/edit.png" alt="Edit"></button>
                                <button class="deleteCredential" data-index="${index}"><img src="img/delete.png" alt="Delete"></button>
                            </div>
                        `;
                        credentialsList.appendChild(item);
                    });

                    // Add event listener for toggling password visibility
                    const toggleButtons = document.querySelectorAll('.togglePassword img');
                    toggleButtons.forEach(button => {
                        button.addEventListener('click', (e) => {
                            const index = e.target.closest('button').dataset.index; // Get the index of the clicked item
                            const passwordText = e.target.closest('.credential-item').querySelector('.password-text'); // Find the password span

                            // Check the current state of the password (hidden or visible)
                            if (passwordText) {
                                if (passwordText.textContent === '********') {
                                    const password = credentials[index].password; // Get the password from the credentials
                                    passwordText.textContent = password; // Show the password
                                    e.target.src = 'img/vp.png'; // Optionally change the button icon (closed eye)
                                } else {
                                    passwordText.textContent = '********'; // Hide the password
                                    e.target.src = 'img/vp.png'; // Optionally change the button icon (open eye)
                                }
                            } else {
                                console.error('passwordText element is null or does not contain the expected text.');
                            }
                        });
                    });

                    // Add event listener for editing credentials
                    const editButtons = document.querySelectorAll('.editCredential img');
                    editButtons.forEach(button => {
                        button.addEventListener('click', (e) => {
                            const index = e.target.closest('button').dataset.index;
                            const credentialItem = e.target.closest('.credential-item');
                            const credentialInfo = credentialItem.querySelector('.credential-info');
                            const credential = credentials[index];

                            // Remove any existing save and cancel buttons
                            const existingSaveButton = credentialItem.querySelector('.save-button');
                            const existingCancelButton = credentialItem.querySelector('.cancel-button');
                            if (existingSaveButton) existingSaveButton.remove();
                            if (existingCancelButton) existingCancelButton.remove();

                            credentialInfo.innerHTML = `
                                <strong>${credential.siteName}</strong><br>
                                <input type="text" class="edit-username" value="${credential.username}"><br>
                                <input type="text" class="edit-password" value="${credential.password}">
                            `;

                            const saveButton = document.createElement('button');
                            saveButton.textContent = 'Save';
                            saveButton.className = 'btn btn-sm btn-success save-button';
                            saveButton.style.backgroundColor = 'black'; // Change button color to black
                            credentialItem.querySelector('.credential-actions').appendChild(saveButton);

                            const cancelButton = document.createElement('button');
                            cancelButton.textContent = 'Cancel';
                            cancelButton.className = 'btn btn-sm btn-secondary cancel-button';
                            cancelButton.style.backgroundColor = 'black'; // Change button color to black
                            credentialItem.querySelector('.credential-actions').appendChild(cancelButton);

                            saveButton.addEventListener('click', () => {
                                const newUsername = credentialItem.querySelector('.edit-username').value;
                                const newPassword = credentialItem.querySelector('.edit-password').value;

                                credentials[index] = { siteName: credential.siteName, username: newUsername, password: newPassword };
                                chrome.storage.local.set({ credentials }, () => {
                                    loadCredentials();
                                });
                            });

                            cancelButton.addEventListener('click', () => {
                                loadCredentials();
                            });
                        });
                    });

                    // Add event listener for deleting credentials
                    const deleteButtons = document.querySelectorAll('.deleteCredential img');
                    deleteButtons.forEach(button => {
                        button.addEventListener('click', (e) => {
                            const index = e.target.closest('button').dataset.index;
                            chrome.storage.local.get(['credentials'], (result) => {
                                const credentials = result.credentials || [];
                                credentials.splice(index, 1); // Remove the credential
                                chrome.storage.local.set({ credentials }, () => {
                                    alert('Credential deleted successfully!');
                                    loadCredentials();
                                });
                            });
                        });
                    });
                }
            });
        }
    }

    // Function to generate a random password
    function generateRandomPassword() {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
        let password = '';
        for (let i = 0; i < 12; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    }
});
