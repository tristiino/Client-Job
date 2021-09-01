/* Code Summary:
This script allows the user to search for a client record by last name. Results can be selected by button, 
which will display the details of the client's record. At this point, the user has the options to:
1. Alter the client record data and submit Changes
2. Search for all job records associated with the client; results are displayed as a table containing the jobs' details
    a. Then, any job record may be selected and displayed
    b. Then, the selected job record details may be altered and submitted
    c. Or, the selected job record may be deleted
3. Create a new job record associated with the client
4. Delete the client record, which will also delete all associated job records
*/

// Variables to hold the data of currently retrieved client/job records
var activeClientData;
var activeJobData;

// Determines if a modal will be displayed informing user that they cannot perform delete operations
// NOTE: This only affects modal display; actual determine permissions is determined on the application back-end
var displayDeleteWarning = false;

// Create references to static HTML elements on page
const nameToFind = document.getElementById('searchLastName');
const findClient = document.getElementById('findClient');
const foundClients = document.getElementById('foundClients');
const selectedClient = document.getElementById('selectedClient');

const clientID = document.getElementById('clientID');
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const custPhone = document.getElementById('custPhone');
const custEmail = document.getElementById('custEmail');
const custStreet = document.getElementById('custStreet');
const custApt = document.getElementById('custApt');
const custCity = document.getElementById('custCity');
const custState = document.getElementById('custState');
const custZip = document.getElementById('custZIP');
const updateClient = document.getElementById('updateClient')
const findJobs = document.getElementById('findJobs')
const deleteClient = document.getElementById('deleteClient')

const jobsTableBody = document.getElementById('jobsTableBody');
const foundJobs = document.getElementById('foundJobs');

const jobAddressFieldset = document.getElementById('jobAddress');
const jobInfoFieldset = document.getElementById('jobInfo');
const sameAddress = document.getElementById('sameAddress');
const jobStreet = document.getElementById('jobStreet');
const jobCity = document.getElementById('jobCity');
const jobState = document.getElementById('jobState');
const jobZIP = document.getElementById('jobZIP');
const jobID = document.getElementById('jobID');
const reqDate = document.getElementById('requestDate');
const jobTypes = document.getElementsByName('jobType');
const jobDetails = document.getElementById('jobDetails');
const saveButton = document.getElementById('saveJob');
const saveButtonLabel = document.getElementById('saveJobLabel')
const jobChoice = document.getElementById('jobChoice1');


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



// Toggles HTTP request buttons to disabled for duration of a request to prevent spamming/duplicate requests/overlapping requests
ABApp.toggleButtonsDisabled = function(status) {
    findClient.disabled = status
    updateClient.disabled = status
    findJobs.disabled = status
    deleteClient.disabled = status
    saveButton.disabled = status
    findClient.disabled = status

    var deleteButton = document.getElementById('deleteJob');

    if (deleteButton) {
        deleteButton.disabled = status
    }
}

// Sends data to be used for searching any clients that have a last name matching the one submitted by the user
ABApp.findClient = function () {
    ABApp.toggleButtonsDisabled(true);

    if (ABApp.validateBlank(nameToFind)) {
        ABApp.useToken(function(token) {
            // Clean up display elements on page
            ABApp.clearJobs();
            ABApp.clearJobForm();

            // Send authorized GET request containing the Last Name to search for to AWS API Gateway
            apiClient.getclientGet({lname: nameToFind.value}, null, {headers: {Authorization: token}})
            .then(function (result) {
                nameToFind.value = "";
                // If any matching clients are found and returned, the display elements are made visible and
                // any results from previous queries are removed
                if (result !== []){

                    while (foundClients.firstChild) {
                        foundClients.removeChild(foundClients.lastChild);
                    }

                    foundClients.setAttribute('style', 'display: block');

                    // Client data returned is stored for eventual use by client selection buttons
                    activeClientData = result.data;

                    // A button element is created for each matching client found by the query
                    for (let i = 0; i < result.data.length; i++) {
                        var nameButton = document.createElement('button');
                        foundClients.appendChild(nameButton);
                        nameButton.setAttribute('style', 'padding: 10px; margin: 15px');
                        nameButton.setAttribute('data-index', i); // Get index of current client record for the generated button's use
                        nameButton.addEventListener("click", (event) => {window.ABApp.populateClient(event)})
                        nameButton.textContent = result.data[i].fname.S + " " + result.data[i].lname.S; // Label button with client's name
                    };

                }
                
            });
        });
    };

    ABApp.toggleButtonsDisabled(false);
};

// Displays the client record details as input boxes on the page
ABApp.populateClient = function (event) {
    // Clean up display elements on page
    ABApp.clearJobs();
    ABApp.clearJobForm();

    // Use client result index from the clicked client button to access the correct client record data
    var index = event.target.getAttribute('data-index');

    var targetClient = activeClientData[index];

    // Make selected client display area visible and enable interactive elements
    selectedClient.setAttribute('style', 'display: block');
    selectedClient.disabled = false;

    clientID.value = targetClient.id.S;
    firstName.value = targetClient.fname.S;
    lastName.value = targetClient.lname.S;
    custPhone.value = targetClient.phone.S;
    custEmail.value = targetClient.email.S;
    custStreet.value = targetClient.street.S;
    custApt.value = targetClient.apt.S;
    custCity.value = targetClient.city.S;
    custState.value = targetClient.state.S;
    custZip.value = targetClient.zip.S;

};

// Accepts changes to client record details and submits them
ABApp.updateClientInfo = function () {
    
    ABApp.toggleButtonsDisabled(true);

    var inputValid = ABApp.validateBlank(lastName) &&
                    ABApp.validatePhone(custPhone) &&
                    ABApp.validateEmail(custEmail)

    if (inputValid) {
        ABApp.useToken(function(token){  
            var clientObject = {
                id: clientID.value,
                fname: firstName.value,
                lname: lastName.value,
                phone: custPhone.value,
                email: custEmail.value,
                custStreet: custStreet.value,
                apt: custApt.value,
                custCity: custCity.value,
                custState: custState.value,
                custZip: custZIP.value
            };
            
            // Send authorized PATCH request containing the updated client object to AWS API Gateway
            // then conduct new client search using previous Last Name
            apiClient.updateclientPatch({}, clientObject, {headers: {Authorization: token}})
            .then(function () {
                nameToFind.value = clientObject.lname;
                ABApp.findClient();
                ABApp.displayModal(modal, modalMsg, "Client Record Updates Submitted");
            });
        });
    };

    ABApp.toggleButtonsDisabled(false);
};

// Sends data for client record deletion
ABApp.deleteClient = function () {
    ABApp.toggleButtonsDisabled(true);

    if (displayDeleteWarning == true){
        ABApp.displayModal(modal, modalMsg, "This Account is Not Authorized to Perform This Operation");
    } else {
        ABApp.useToken(function(token){
            var clientObject = {
                clientId: clientID.value
            }
            // Send authorized POST request containing the ID # of the client to be deleted to AWS API Gateway
            // then conduct new client search using previous Last Name
            apiClient.deleteclientPost({}, clientObject, {headers: {Authorization: token}})
            .then(function () {

                nameToFind.value = lastName.value; 

                ABApp.findClient();
            
                clientID.value = "";
                firstName.value = "";
                lastName.value = "";
                custPhone.value = "";
                custEmail.value = "";
                custStreet.value = "";
                custApt.value = "";
                custCity.value = "";
                custState.value = "";
                custZip.value = "";

                ABApp.displayModal(modal, modalMsg, "Client Deletion Request Submitted");
            });
        });
    };
    ABApp.toggleButtonsDisabled(false);

};

// Sends data to be used for searching all job records associated with the client ID # of the selected client record
// then displays the results in tabular format
ABApp.findJobs = function () {
    ABApp.toggleButtonsDisabled(true);

    ABApp.useToken(function(token) {
        // Clean up display elements on page
        ABApp.clearJobForm();
        ABApp.clearJobs();

        var clientId = clientID.value;

        // Send authorized GET request containing the ID # of the jobs-owning client to AWS API Gateway
        apiClient.getjobGet({clientId: clientId}, null, {headers: {Authorization: token}})
        .then(function (result) {

            // Job data returned is stored for eventual use by job editing features
            activeJobData = result.data;

            // Uses the returned job data to populate a generated table display
            result.data.forEach((jobEl, i) => {
                var jobRow = document.createElement('tr');
                var editColumn = document.createElement('td');
                jobRow.appendChild(editColumn);

                var editButton = document.createElement('button');
                editButton.setAttribute('style', 'padding: 5px');
                editButton.setAttribute('data-index', i);
                editButton.textContent = "Edit";
                editButton.addEventListener("click", (event) => {ABApp.populateJob(event)})
                editColumn.appendChild(editButton);

                jobsTableBody.appendChild(jobRow);
                for (const prop in jobEl) {
                    var jobColumn = document.createElement('td');
                    jobRow.appendChild(jobColumn);
                    jobColumn.textContent = jobEl[prop].S;
                };
            });
        });

        // Make table display visible
        foundJobs.setAttribute('style', 'display: block');
    });

    ABApp.toggleButtonsDisabled(false);

};

// Populates the individual job display with job record data
ABApp.populateJob = function (event) {
    // Make form visible
    ABApp.showJobForm();

    // Uses index from triggering button to retrieve correct job data
    var index = event.target.getAttribute('data-index');

    var targetJob = activeJobData[index];

    jobStreet.value = targetJob.jobStreet.S;
    jobCity.value = targetJob.jobCity.S;
    jobState.value = targetJob.jobState.S;
    jobZIP.value = targetJob.jobZip.S;
    jobID.value = targetJob.jobId.S;
    reqDate.value = targetJob.reqDate.S;
    jobTypes.forEach(element => {
        if (element.value == targetJob.jobType.S) {
            element.checked = true;
        }
    });
    jobDetails.value = targetJob.jobDetails.S;

    // Modify "Save" button from job creation feature for use in this job update feature
    saveButtonLabel.textContent = "Save Job Changes";
    saveButton.onclick = ABApp.updateJobInfo;

    var deleteDiv = document.getElementById('deleteDiv');

    // If page does not already have a deletion button, create one
    if(!deleteDiv){
        var deleteDiv = document.createElement('div');
        deleteDiv.id = "deleteDiv"

        var deleteButton = document.createElement('input');
        deleteButton.type = "checkbox";
        deleteButton.id = "deleteJob";
        deleteButton.onclick = ABApp.deleteJob;
        deleteDiv.appendChild(deleteButton);

        var deleteLabel = document.createElement('label');
        deleteLabel.className = "warning-button-label";
        deleteLabel.htmlFor = "deleteJob"
        deleteDiv.appendChild(deleteLabel);

        var deleteIcon = document.createElement('I');
        deleteIcon.className = "material-icons";

        deleteLabel.appendChild(deleteIcon);

        var iconText = document.createTextNode("delete_forever");
        deleteIcon.appendChild(iconText);

        var deleteText = document.createTextNode("Delete Job");

        deleteLabel.appendChild(deleteText);
    };

    jobInfoFieldset.appendChild(deleteDiv);
};

// Accepts changes to job record details and submits them
ABApp.updateJobInfo = function () {
    ABApp.toggleButtonsDisabled(true);

    var inputValid = ABApp.validateBlank(jobStreet) &&
    ABApp.validateBlank(jobCity) &&
    ABApp.validateBlank(jobState) &&
    ABApp.validateBlank(jobZIP)

    if (inputValid) {
        ABApp.useToken(function(token){

            var jobType;

            jobTypes.forEach(type => {
                if (type.checked) {
                    jobType = type;
                }
            });

            var jobObject = {
                jobId: jobID.value,
                jobStreet: jobStreet.value,
                jobCity: jobCity.value,
                jobState: jobState.value,
                jobZip: jobZIP.value,
                reqDate: reqDate.value,
                jobType: jobType.value,
                jobDetails: jobDetails.value
            };

            // Send authorized PATCH request containing the updated job object to AWS API Gateway
            // then conduct new job search to refresh table
            apiClient.updatejobPatch({}, jobObject, {headers: {Authorization: token}})
            .then(function () {
                ABApp.findJobs();
                ABApp.displayModal(modal, modalMsg, "Job Record Updates Submitted");
            });
            
        });
    };

    ABApp.toggleButtonsDisabled(false);

};

// Sends data for job record deletion
ABApp.deleteJob = function () {
    ABApp.toggleButtonsDisabled(true);

    if (displayDeleteWarning == true){
        ABApp.displayModal(modal, modalMsg, "This Account is Not Authorized to Perform This Operation");
    } else {
        ABApp.useToken(function(token){
            var jobObject = {
                jobId: jobID.value
            }
            // Send authorized POST request containing the ID # of the job to be deleted to AWS API Gateway
            // then conduct new job search to refresh table
            apiClient.deletejobPost({}, jobObject, {headers: {Authorization: token}})
            .then(function () {
                ABApp.findJobs();
                ABApp.displayModal(modal, modalMsg, "Job Deletion Request Submitted");
            });
        });
    };
    ABApp.toggleButtonsDisabled(false);

};

// Prepares display of job creation form
ABApp.showJobForm = function () {
    // Clear job search results table
    ABApp.clearJobs();

    // Make fields visible and interactive
    jobAddressFieldset.setAttribute('style', 'display: block');
    jobAddressFieldset.disabled = false;

    jobInfoFieldset.setAttribute('style', 'display: block');
    jobInfoFieldset.disabled = false;

    jobStreet.value = "";
    jobCity.value = "";
    jobState.value = "IN";
    jobZIP.value = "";
    jobID.value = "New";
    reqDate.value = "";
    jobChoice.checked = true;
    jobDetails.value = "";

    saveButtonLabel.textContent = "Save Job";
    saveButton.onclick = ABApp.saveJob;

    // Remove any delete button that may be present from prior
    // use of the form for job editing
    var deleteDiv = document.getElementById('deleteDiv');

    if(deleteDiv){
        jobInfoFieldset.removeChild(deleteDiv)
    };
};

// Hide the job form display when not needed and disable its interactions
ABApp.clearJobForm = function () {
    jobAddressFieldset.setAttribute('style', 'display: none');
    jobAddressFieldset.disabled = true;

    jobInfoFieldset.setAttribute('style', 'display: none');
    jobInfoFieldset.disabled = true;
};

// Deletes all elements from the job results table then hides it
ABApp.clearJobs = function () {
    while (jobsTableBody.firstChild) {
        jobsTableBody.removeChild(jobsTableBody.lastChild);
    }

    foundJobs.setAttribute('style', 'display: none');
};

// Send data for creation of a new job record
ABApp.saveJob = function () {
    ABApp.toggleButtonsDisabled(true);

    var inputValid = ABApp.validateBlank(jobStreet) &&
    ABApp.validateBlank(jobCity) &&
    ABApp.validateBlank(jobState) &&
    ABApp.validateBlank(jobZIP)

    if (inputValid) {
        ABApp.useToken(function(token) {
            var jobType;

            jobTypes.forEach(type => {
                if (type.checked) {
                    jobType = type;
                }
            });

            // Create job object to hold input data
            var jobObject = {
                clientId: clientID.value,
                jobStreet: jobStreet.value,
                jobCity: jobCity.value,
                jobState: jobState.value,
                jobZip: jobZIP.value,
                reqDate: reqDate.value,
                jobType: jobType.value,
                jobDetails: jobDetails.value
            };

            // Send authorized POST request containing job object to AWS API Gateway
            apiClient.createjobPost({}, jobObject, {headers: {Authorization: token}})
            .then(function () {
                jobStreet.value = "";
                jobCity.value = "";
                jobState.value = "";
                jobZIP.value = "";
                reqDate.value = "";
                jobChoice.checked = true;
                jobDetails.value = "";

                ABApp.displayModal(modal, modalMsg, "New Job Record Submitted");
            });
        });

    };
    
    ABApp.toggleButtonsDisabled(false);

};

// Used to copy Client address to Job address
ABApp.copyAddress = function () {
    if (sameAddress.checked) {
        jobStreet.value = custStreet.value;
        jobCity.value = custCity.value;
        jobState.value = custState.value;
        jobZIP.value = custZip.value;
    } else {
        jobStreet.value = "";
        jobCity.value = "";
        jobState.value = "";
        jobZIP.value = "";
    }
}
