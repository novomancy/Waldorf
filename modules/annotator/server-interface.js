let sha1 = require('sha1');

class ServerInterface {
    constructor(annotator){
        this.annotator = annotator;
        //localStorage.removeItem('waldorf_auth_token');
    }

    SetBaseURL(url){
        this.baseURL = url;
    }

    make_base_auth(user, password) {
        var tok = user + ':' + password;
        var hash = btoa(tok);
        return 'Basic ' + hash;
    }

    make_write_auth(text){
        if(this.annotator.apiKey){
            return 'ApiKey ' + text;
        } else {
            return 'Token ' + text;
        }
    }

    LoggedIn(){
        if(this.annotator.apiKey){
            // Return true if an email has been entered
            let user_email = localStorage.getItem('waldorf_user_email');
            return user_email !== null;
        }
        else {
            // Return true if a token has been registered
            let auth_token = localStorage.getItem('waldorf_auth_token');
            return auth_token !== null;
        }
    }

    LogIn(username, password){
        // If API key is used, just store the email address
        if(this.annotator.apiKey){
            console.log("[" + this.constructor.name + "] " + "Successfully logged in.");
            localStorage.setItem('waldorf_user_email', password);
            localStorage.setItem('waldorf_user_name', username);
            this.annotator.messageOverlay.ShowMessage("Logged in as "+username);
            return $.Deferred().resolve();
        }

        return $.ajax({
            url: this.baseURL + "/api/login",
            type: "POST",
            async: true,
            context: this,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', this.make_base_auth(username, password));
            }
        }).done((data) => {
            console.log("[" + this.constructor.name + "] " + "Successfully logged in.");
            localStorage.setItem('waldorf_auth_token', data.auth_token);
        }).fail((response) => {
            console.error("[" + this.constructor.name + "] " + "Could not log in.");
            this.annotator.messageOverlay.ShowError("Could not log in!");
        });
    }

    LogOut(){
        // If API key is used, just remove the email from local storage.
        if(this.annotator.apiKey){
            console.log("[" + this.constructor.name + "] " + "Successfully logged out.");
            localStorage.removeItem('waldorf_user_email');
            localStorage.removeItem('waldorf_user_name');
            return $.Deferred().resolve();
        }

        return $.ajax({
            url: this.baseURL + "/api/logout",
            type: "DELETE",
            async: true,
            context: this,
            beforeSend: function (xhr) {
                let auth_token = localStorage.getItem('waldorf_auth_token') || "";
                console.log(`[${this.constructor.name}] token: ${auth_token}`);
                xhr.setRequestHeader('Authorization', this.make_write_auth(auth_token));
            }
        }).done((data) => {
            console.log("[" + this.constructor.name + "] " + "Successfully logged out.");
            localStorage.removeItem('waldorf_auth_token');
        }).fail((response) => {
            console.error("[" + this.constructor.name + "] " + "Could not log out.");
            localStorage.removeItem('waldorf_auth_token');
        });
    }

    FetchAnnotationsScalar(searchKey, searchParam) {
        var ajax_url = this.baseURL + 'rdf/file/' + searchParam.replace(this.baseURL,'') + '?format=oac&prov=1&rec=2';
        return $.ajax({
            url: ajax_url,
            type: "GET",
            jsonp: "callback",
            dataType: "jsonp",
            async: true
        }).done(function (data) {
            console.log('[' + this.constructor.name + '] ' + 'Fetched ' + data.length + ' annotations for ' + searchKey + ': "' + searchParam + '".');
        }).fail(function (response) {
            console.error('[' + this.constructor.name + '] ' + 'Error fetching annotations for ' + searchKey + ': "' + searchParam + '"\n' + response.responseJSON.detail + '.');
            _this2.annotator.messageOverlay.ShowError('Could not retrieve annotations!<br>(' + response.responseJSON.detail + ')');
        });  
    }

    FetchAnnotationsStatler(searchKey, searchParam) {
        return $.ajax({
            url: this.baseURL + "/api/getAnnotationsByLocation",
            type: "GET",
            data: { [searchKey]: searchParam },
            dataType: "json",
            async: true
        }).done((data) => {
            console.log(`[${this.constructor.name}] Fetched ${data.length} annotations for ${searchKey}: "${searchParam}".`);
        }).fail((response) => {
            console.error(`[${this.constructor.name}] Error fetching annotations for ${searchKey}: "${searchParam}"\n${response.responseJSON.detail}.`);
            this.annotator.messageOverlay.ShowError(`Could not retrieve annotations!<br>(${response.responseJSON.detail})`);
        });
    }

    FetchAnnotations(searchKey, searchParam) {
        if (this.annotator.annotationServer == "statler") {
            return this.FetchAnnotationsStatler(searchKey, searchParam);
        } else {
            return this.FetchAnnotationsScalar(searchKey, searchParam);
        }
    }

    PostAnnotation(callback){
        console.log("[" + this.constructor.name + "] " + "Posting annotation...");
        let annotation = this.annotator.gui.GetAnnotationObject();
        console.log(annotation);

        let key;
        if (this.annotator.apiKey){
            key = this.annotator.apiKey;
            let email_storage = localStorage.getItem('waldorf_user_email');
            let name_storage = localStorage.getItem('waldorf_user_name');
            if (email_storage === null) {
                console.error("[" + this.constructor.name + "] " + "You are not logged in!");
                this.annotator.messageOverlay.ShowError("You are not logged in!");
                return false;
            }
            if(name_storage == null) name_storage = email_storage;
        } else {
            key = localStorage.getItem('waldorf_auth_token');
            if (key === null) {
                console.error("[" + this.constructor.name + "] " + "You are not logged in!");
                this.annotator.messageOverlay.ShowError("You are not logged in!");
                return false;
            }
        }

        if(this.annotator.apiKey){
            if(annotation["creator"] == null) annotation["creator"] = {};
            annotation["creator"]["email"] = localStorage.getItem('waldorf_user_email');
            annotation["creator"]["nickname"] = localStorage.getItem('waldorf_user_name');
            //annotation.metadata.userEmail = localStorage.getItem('waldorf_user_email');
            //anno_data["email"] = localStorage.getItem('waldorf_user_email'); // Email
        }
        
        //data = JSON.stringify(data);
        //console.log(anno_data);
        
        $.ajax({
            url: this.baseURL + "/api/addAnnotation",
            type: "POST",
            dataType: 'json', // Necessary for Rails to see this data type correctly
            contentType: 'application/json',  // Necessary for Rails to see this data type correctly
            data: JSON.stringify(annotation),  // Stringify necessary for Rails to see this data type correctly
            async: true,
            context: this,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', this.make_write_auth(key));
            },
            success: (data) => {
                console.log("[" + this.constructor.name + "] " + "Successfully posted new annotation.");
                this.annotator.messageOverlay.ShowMessage("Successfully created new annotation.");
                annotation.id = data.id; // Append the ID given by the response
                if(callback) callback(annotation);
            },
            error: (response) => {
                console.error(`[${this.constructor.name}] Could not post new annotation! Message:\n ${response.responseJSON.detail}`);
                this.annotator.messageOverlay.ShowError(`Could not post new annotation!<br>(${response.responseJSON.detail})`);
            }

        });
    }

    EditAnnotation(callback){
        let annotation = this.annotator.gui.GetAnnotationObject();
        
        let key;
        if (this.annotator.apiKey){
            key = this.annotator.apiKey;
            let email_storage = localStorage.getItem('waldorf_user_email');
            let name_storage = localStorage.getItem('waldorf_user_name');
            if (email_storage === null) {
                console.error("[" + this.constructor.name + "] " + "You are not logged in!");
                this.annotator.messageOverlay.ShowError("You are not logged in!");
                return false;
            }
            if(name_storage == null) name_storage = email_storage;
        } else {
            key = localStorage.getItem('waldorf_auth_token');
            if (key === null) {
                console.error("[" + this.constructor.name + "] " + "You are not logged in!");
                this.annotator.messageOverlay.ShowError("You are not logged in!");
                return false;
            }
        }

        if(this.annotator.apiKey){
            if(annotation["creator"] == null) annotation["creator"] = {};
            annotation["creator"]["email"] = localStorage.getItem('waldorf_user_email');
            annotation["creator"]["nickname"] = localStorage.getItem('waldorf_user_name');
        }

        let oldID = annotation.id;

        console.log("[" + this.constructor.name + "] " + "Modifying annotation " + oldID);
        
        $.ajax({
            url: this.baseURL + "/api/editAnnotation",
            type: "POST",
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(annotation),
            async: true,
            context: this,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', this.make_write_auth(key));
            },
            success: (data) => {
                //console.log(annotation);
                annotation.id = data.id; // Append the ID given by the response
                //console.log("Successfully edited the annotation. (ID is now " + data.id + ")");

                this.annotator.messageOverlay.ShowMessage("Successfully edited the anotation.");
                if(callback) callback(annotation, oldID);
            },
            error: (response) => {
                console.error(`[${this.constructor.name}] Could not edit the annotation! Message:\n ${response.responseJSON.detail}`);
                this.annotator.messageOverlay.ShowError(`Could not edit the annotation!<br>(${response.responseJSON.detail})`);
            }

        });
    }

    DeleteAnnotation(annotation){
        let key;
        if (this.annotator.apiKey){
            key = this.annotator.apiKey;
            let email_storage = localStorage.getItem('waldorf_user_email');
            if (email_storage === null) {
                console.error("[" + this.constructor.name + "] " + "You are not logged in!");
                this.annotator.messageOverlay.ShowError("You are not logged in!");
                let deferred = $.Deferred();
                deferred.reject({
                    success: false,
                    data: "Not logged in."
                });
                return deferred.promise();
            }
        } else {
            key = localStorage.getItem('waldorf_auth_token');
            if (key === null) {
                console.error("[" + this.constructor.name + "] " + "You are not logged in!");
                this.annotator.messageOverlay.ShowError("You are not logged in!");
                let deferred = $.Deferred();
                deferred.reject({
                    success: false,
                    data: "Not logged in."
                });
                return deferred.promise();
            }
        }

        console.log("Deleting annotation " + annotation.id);
        return $.ajax({
            url: this.baseURL + "/api/deleteAnnotation",
            type: "DELETE",
            data: {
                "id": annotation.id
            },
            async: true,
            context: this,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', this.make_write_auth(key));
            }

        }).done((response) => {
            console.log("[" + this.constructor.name + "] " + "Successfully deleted the annotation.");
            this.annotator.messageOverlay.ShowMessage("Successfully deleted the annotation.");
        }).fail((response) => {
            console.error(`[${this.constructor.name}] Could not delete the annotation. Message:\n ${response.responseJSON.detail}`);
            this.annotator.messageOverlay.ShowError(`Could not delete the annotation!<br>(${response.responseJSON.detail})`);
        });
    }

}


export { ServerInterface };