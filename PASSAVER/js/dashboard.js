document.getElementById('copyPasswordButton').addEventListener('click', function() {
  const passwordField = document.getElementById('generatedPassword');
  passwordField.select();
  document.execCommand('copy');
});

document.getElementById('generatePasswordButton').addEventListener('click', function() {
  const generatedPassword = generatePassword();
  document.getElementById('generatedPassword').value = generatedPassword;
});

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Adjust container arrangement for a clean UI
window.addEventListener('resize', function() {
  const mainContainer = document.querySelector('.main-container');
  if (window.innerWidth < 768) {
    mainContainer.style.flexDirection = 'column';
  } else {
    mainContainer.style.flexDirection = 'row';
  }
});

// Initial setup for container design
document.addEventListener('DOMContentLoaded', function() {
  const mainContainer = document.querySelector('.main-container');
  mainContainer.style.maxWidth = '600px'; // Set the max-width for the container
  mainContainer.style.margin = '10px auto'; // Center the container

  // Add event listeners for toggling forms
  const showAddCredentialFormButton = document.getElementById('showAddCredentialFormButton');
  const addCredentialForm = document.getElementById('addCredentialForm');
  const cancelAddCredentialButton = document.getElementById('cancelAddCredentialButton');
  const changeMasterPasswordButton = document.getElementById('changeMasterPasswordButton');
  const newMasterPasswordInput = document.getElementById('newMasterPassword');
  const confirmNewMasterPasswordInput = document.getElementById('confirmNewMasterPassword');

  if (showAddCredentialFormButton) {
    showAddCredentialFormButton.addEventListener('click', () => {
      addCredentialForm.classList.toggle('d-none');
    });
  }

  if (cancelAddCredentialButton) {
    cancelAddCredentialButton.addEventListener('click', () => {
      addCredentialForm.classList.add('d-none');
    });
  }

  if (changeMasterPasswordButton) {
    changeMasterPasswordButton.addEventListener('click', () => {
      newMasterPasswordInput.classList.toggle('d-none');
      confirmNewMasterPasswordInput.classList.toggle('d-none');
    });
  }

  // Load accounts for the current site
  loadCurrentSiteAccounts();
});

function loadCurrentSiteAccounts() {
  const currentSiteAccountsList = document.getElementById('currentSiteAccountsList');
  if (!currentSiteAccountsList) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }

    const currentTab = tabs[0];
    const siteName = new URL(currentTab.url).hostname;

    chrome.storage.local.get(['credentials'], (result) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }

      const credentials = result.credentials || [];
      const siteCredentials = credentials.filter(
        (cred) => cred.siteName === siteName
      );

      currentSiteAccountsList.innerHTML = '';
      if (siteCredentials.length === 0) {
        const item = document.createElement('div');
        item.className = 'credential-item';
        item.innerHTML = `<div class="credential-info">No accounts saved for this site.</div>`;
        currentSiteAccountsList.appendChild(item);
      } else {
        siteCredentials.forEach((credential) => {
          const item = document.createElement('div');
          item.className = 'credential-item d-flex justify-content-between align-items-center';
          item.innerHTML = `
            <div class="credential-info" style="font-family: 'Roboto', sans-serif;">
              <span class="credential-site">${credential.siteName}</span>
              <span class="credential-username">${credential.username}</span>
              <span class="password-text">• • • • • • • •</span>
            </div>
          `;
          currentSiteAccountsList.appendChild(item);
        });
      }
    });
  });
}

function loadCredentials() {
  const credentialsList = document.getElementById('credentialsList');
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

        // Add event listener for toggling password visibility
        const toggleButton = item.querySelector('.togglePassword img');
        toggleButton.addEventListener('click', () => {
          const passwordText = item.querySelector('.password-text');
          if (passwordText.textContent === '********') {
            passwordText.textContent = credential.password;
            toggleButton.src = 'img/vp.png';
          } else {
            passwordText.textContent = '********';
            toggleButton.src = 'img/vp.png';
          }
        });

        // Add event listener for editing credentials
        const editButton = item.querySelector('.editCredential img');
        editButton.addEventListener('click', (e) => {
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
            <input type="password" class="edit-password" value="${credential.password}">
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
              loadCurrentSiteAccounts();
              loadCredentials(); // Ensure the dashboard is also updated
            });
          });

          cancelButton.addEventListener('click', () => {
            loadCurrentSiteAccounts();
            loadCredentials(); // Ensure the dashboard is also updated
          });
        });

        // Add event listener for deleting credentials
        const deleteButton = item.querySelector('.deleteCredential img');
        deleteButton.addEventListener('click', (e) => {
          const index = e.target.closest('button').dataset.index;
          chrome.storage.local.get(['credentials'], (result) => {
            const credentials = result.credentials || [];
            const deletedCredential = credentials.splice(index, 1)[0]; // Remove the credential and get the deleted credential
            chrome.storage.local.set({ credentials }, () => {
              alert('Credential deleted successfully!');
              loadCurrentSiteAccounts();
              loadCredentials(); // Ensure the dashboard is also updated

              // Automatically remove the same credential from the current site accounts list
              const currentSiteAccountsList = document.getElementById('currentSiteAccountsList');
              if (currentSiteAccountsList) {
                const siteCredentials = Array.from(currentSiteAccountsList.children);
                siteCredentials.forEach((item) => {
                  const siteName = item.querySelector('.credential-site').textContent;
                  const username = item.querySelector('.credential-username').textContent;
                  if (siteName === deletedCredential.siteName && username === deletedCredential.username) {
                    item.remove();
                  }
                });
              }
            });
          });
        });
      });
    }
  });
}