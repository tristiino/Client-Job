/* Code Summary:
This script provides the functionality for the Create New Client page. The user enters client
personal data in the relevant fields then clicks "Save Client" to submit the record to the 
client database via POST request. At minimum, a Last Name must be provided for the new client
for the operation to succeed. */

// Create references to static HTML elements on page
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const phone = document.getElementById('custPhone');
const email = document.getElementById('custEmail');
const custStreet = document.getElementById('custStreet');
const apartment = document.getElementById('custApt');
const custCity = document.getElementById('custCity');
const custState = document.getElementById('custState');
const custZIP = document.getElementById('custZIP');
const saveClient = document.getElementById('saveClient')

/******************************************STATIC ELEMENT AND EVENTS FOR DIALOG BOX DISPLAY*************************************************/

const modal = document.getElementById("myModal");
const closeSpan = document.getElementsByClassName("close")[0];
const modalMsg = document.getElementById("ttt");

closeSpan.onclick = function() {
    modal.style.display = "none";
    
}

window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
}

// Send data for creation of a new client record
ABApp.saveClient = function () {
    saveClient.disabled = true;

    var inputValid = ABApp.validateBlank(lastName) &&
                    ABApp.validatePhone(phone) &&
                    ABApp.validateEmail(email)

    if (inputValid) {
        ABApp.useToken(function(token) {
            
            // Create a customer object to hold all the values entered by user
            var custObject = {
                fname: firstName.value,
                lname: lastName.value,
                phone: phone.value,
                email: email.value,
                custStreet: custStreet.value,
                apt: apartment.value,
                custCity: custCity.value,
                custState: custState.value,
                custZip: custZIP.value
            };

            // Send authorized POST request containing customer object to AWS API Gateway 
            apiClient.createclientPost({}, custObject, {headers: {Authorization: token}})
            .then(function () {
                firstName.value = "";
                lastName.value = "";
                phone.value = "";
                email.value = "";
                custStreet.value = "";
                apartment.value = "";
                custCity.value = "";
                custState.value = "";
                custZIP.value = "";

                ABApp.displayModal(modal, modalMsg, "New Client Record Submitted");
            });
        });
    };

    saveClient.disabled = false;
};