/* Code Summary:
This utility script provides overall web app functionality related to user login, HTTP request authorization,
modal displays, and user input validation. */

var ABApp = {}

var userPool;

var token = null;
var cognitoUser;
var sessionUserAttributes;
var apiClient = apigClientFactory.newClient();

// Handles display and alteration of modal boxes
ABApp.displayModal = function (modal, modalMsg, message) {
    modal.style.display = "block";
    modalMsg.innerHTML = message;
}

// Checks to see if user has any stored authentication credentials then checks to see if they match an
// authorized user in either of the two user pools. If a match is found, the user is granted access to the
// page they are trying to reach; if no match is found, the user is redirected back to the login page.
ABApp.checkLogin = function (redirectOnRec, redirectOnUnrec) {
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    cognitoUser = userPool.getCurrentUser();
    if (cognitoUser !== null) {
        // Change flag to warn this user via modal than any delete operations they attempt will not succeed
        displayDeleteWarning = true;
        if (redirectOnRec) {
            window.location = '/index.html';
        }
    } else {
        userPool = new AmazonCognitoIdentity.CognitoUserPool(poolDataOffice);
        cognitoUser = userPool.getCurrentUser();
        if (cognitoUser !== null) {
            if (redirectOnRec) {
                window.location = '/index.html';
            }
        } else {
            if (redirectOnUnrec) {
                window.location = '/login.html';
            }
        }
    }
};

// Allows user to enter a username and password which will attempt to be authenticated via the
// relevant AWS Cognito user pool
ABApp.login = function () {
    // If the user is office staff rather than a field estimator, they can check this box. This will
    // ensure the correct user pool is referenced in the authentication attempt.
    var roleCheck = document.getElementById('roleCheck');
    if (roleCheck.checked) {
        userPool = new AmazonCognitoIdentity.CognitoUserPool(poolDataOffice);
    } else {
        userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    }

    var username = document.getElementById('username').value;
    var authenticationData = {
        Username: username,
        Password: document.getElementById('password').value
    };

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    var userData = {
        Username: username,
        Pool: userPool
    };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        // Successful authentication redirects the user to the Dashboard page
        onSuccess: function () {
            window.location = '/index.html';
        },
        // Failed login
        onFailure: function (err) {
            alert("Username and/or password was rejected. If this is your first time logging in, a new password must be entered at this time.");
        },
        // New users are required to change their password before their initial login will be authenticated
        newPasswordRequired: function (userAttributes, requiredAttributes) {
            delete userAttributes.email_verified;

            sessionUserAttributes = userAttributes;

            var newPassword = document.getElementById('newpassword').value;
            var confirmNewPassword = document.getElementById('confirmnewpassword').value;

            if (ABApp.validatePassword(newPassword) && ABApp.validatePassword(confirmNewPassword)) {
                if (newPassword === confirmNewPassword) {
                    cognitoUser.completeNewPasswordChallenge(newPassword, sessionUserAttributes, this);
                } else {
                    alert("New password entires do not match. Please try again.")
                }
            };

        }
    });
};

// Allows the current user to log out of their active session
ABApp.logout = function () {
    cognitoUser = userPool.getCurrentUser();
    cognitoUser.signOut();
    window.location = '/';
};

// Retrieves the stored authentication token for the current active user
// which can be used to authenticate HTTP requests sent by the web app
ABApp.useToken = function (callback) {
    if (token === null) {
        cognitoUser = userPool.getCurrentUser();
        if (cognitoUser !== null) {
            cognitoUser.getSession(function (err, session) {
                if (err) {
                    window.location = '/';
                }
                token = session.getIdToken().getJwtToken();
                callback(token);
            });
        }
    } else {
        callback(token);
    }
};

/**********************************CODE FOR INPUT VALIDATION FUNCTIONS*************************************/
// All functions will accept an HTML element as parameter then evaluate its value.
// A boolean is returned to express pass/failure. Failures display an alert message
// explaining the failure and will return browser focus to failing input field.

// Remove whitespace then check to see if the passed value has any content
ABApp.validateBlank = function (field) {
    if (field.value.trim().length == 0) {
        alert("A required field is blank.");
        field.focus();
        return false
    } else {
        return true
    }
}

// Check that email is either blank or in a valid format
ABApp.validateEmail = function (email) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email.value)) {
        return true
    } else if (email.value.trim().length == 0) {
        return true
    } else {
        alert("Please enter a valid email format.");
        email.focus();
        return false
    }
}

// Check that phone number is either blank or consists of ten digits with no separators
ABApp.validatePhone = function (phone) {
    var phoneFormat = /^\d{10}$/;
    if (phone.value.match(phoneFormat)) {
        return true;
    } else if (phone.value.trim().length == 0) {
        return true 
    } else {
        alert("Please enter phone number as ten digits with no separating characters.");
        phone.focus();
        return false;
    }
}

// Ensure password meets the requirements for "strong":
// at least 8 characters long, a special character, a numeric character,
// and both an uppercase and lowercase letter
ABApp.validatePassword = function (password) {
   if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/.test(password)) {
       return true
   } else {
       alert("Password must contain: At least 8 characters \nA number \nA special character \nAn uppercase letter \nA lowercase letter");
       password.focus();
       return false
   }
}
