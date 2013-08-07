(function(P) {
    P.Data = {
        // Override this for pages that live outside of the 
        // root path (for /admin/page.aspx, set it to '../')
        path: ''
    };

    // Helper to more easily call jQuery.ajax function.  Provides for parameterized
    // form method, handler url, data to include as query params and success/fail callbacks
    var _callHandler = function(type, url, data, callback, error) {       
        $.ajax({
            url: url,
            data: data,
            type: type,
            dataType: 'json',
            success: function(resp) {
                if (callback && typeof callback === 'function') {
                    callback(resp);
                }
            },
            error: function(resp, status, err) {
                if (error && typeof error === 'function') {
                    error(resp.responseText);
                } else {
                    Azavea.log(status);
                    Azavea.log(err);
                }
            }
        });
    };

    // Takes an associative array and convert it to a complete query string, including the "?"
    var _objectToQueryString = Azavea.tryCatch('convert object to querystring', function(obj){
        var qs = '?';
        var param;
        for(param in obj) {
            if (obj.hasOwnProperty(param) && (obj[param] || obj[param] === 0)) {
                qs += encodeURIComponent(param) + '=' + encodeURIComponent(obj[param]) + '&';
            }
        }        
        // Remove the trailing "&"
        return qs.substring(0,qs.length-1);
    });
    
    // Method that authenicates and logs a user in
    P.Data.login = Azavea.tryCatch('user login', function(username, password, callback, error) {
        var url = P.Data.path + 'handlers/login.ashx';
        var data = { username: username, password: password };
                
        _callHandler('POST', url, data, callback, error);
    });
    
    // Checks with the server to see if there is a currently authenticated user
    P.Data.checkLoginStatus = Azavea.tryCatch('user login', function(callback, error) {
        var url = P.Data.path + 'handlers/login.ashx';
        _callHandler('GET', url, {}, callback, error);
    });
    
    // Terminates the currently logged in users session
    P.Data.logout = Azavea.tryCatch('user login', function(callback, error) {
        var url = P.Data.path + 'handlers/logout.ashx';
        _callHandler('POST', url, {}, callback, error);
    });
    
    // Creates new random password for username and emails to address on file
    P.Data.resetPassword = Azavea.tryCatch('data reset password', function(username, callback, error) {
        var url = P.Data.path + 'handlers/reset-password.ashx';
        var data = { username: username };
        _callHandler('POST', url, data, callback, error);
    });

    // Create a new user and logs them in
    P.Data.createUser = Azavea.tryCatch('data create user', function(username, name, email, password, roles, callback, error) {
        var url = P.Data.path + 'handlers/users.ashx';
        var data = { username: username, name: name, email: email, password: password, roles: roles };
        _callHandler('POST', url, data, callback, error);
    });
    
    // Get details of single user
    P.Data.getUser = Azavea.tryCatch('data get user', function(username, callback, error) {
        var url = P.Data.path + 'handlers/users.ashx';
        var data = { username: username};
        _callHandler('GET', url, data, callback, error);
    });
    
    // Get details of all users
    P.Data.getUsers = Azavea.tryCatch('data get users', function(page, pageSize, sortBy, sortAsc, callback, error) {
        var url = P.Data.path + 'handlers/users.ashx';
        var data = {page: page, pageSize: pageSize, sortby: sortBy, sortasc: sortAsc };
        _callHandler('GET', url, data, callback, error);
    });
        
    // Update user details    
    P.Data.updateUser = Azavea.tryCatch('data create user', function(username, name, email, password, roles, callback, error) {
        var url = P.Data.path + 'handlers/users.ashx';
        var data = { username: username, name: name, email: email, password: password, roles: roles, _method: 'PUT' };
        _callHandler('POST', url, data, callback, error);
    });
    
    // Gets pdb search attributes
    P.Data.getAttributes = Azavea.tryCatch('data get attributes', function(callback, error) {
        var url = P.Data.path + 'handlers/attributes.ashx';
        _callHandler('GET', url, null, callback, error);
    });

    // Query properties database
    P.Data.getProperties = function(criteria, pagesize, page, orderby, orderasc, groupbys, callback, error) {
        // Encode the collections as JSON objects.
        if (criteria && typeof criteria === 'object') {
            criteria = JSON.stringify(criteria);
        }
        if (groupbys && typeof groupbys === 'object') {
            groupbys = JSON.stringify(groupbys);
        }

        var url = P.Data.path + 'handlers/properties.ashx';
        var data = { pagesize: pagesize, page:page, criteria: criteria, sortby: orderby, sortasc: orderasc, groupby:groupbys};
        _callHandler('GET', url, data, callback, error);
    };
    
    // Query properties database and initiate results as a CSV download
    P.Data.getPropertiesCsv = Azavea.tryCatch('get properties cvs', function(criteria, groupbys){
        // Encode the collections as JSON objects.
        if (criteria && typeof criteria === 'object') {
            criteria = JSON.stringify(criteria);
        }
        if (groupbys && typeof groupbys === 'object') {
            groupbys = JSON.stringify(groupbys);
        }
        var url = P.Data.path + 'handlers/properties.ashx';
        var data = { csv: true, pagesize: -1, page:-1, criteria: criteria, sortby: -1, sortasc: false, groupby:groupbys};
        
        window.location.href = url + _objectToQueryString(data);
    });
    
    // Initiate download for detailed property report
    P.Data.getPropertyReport = Azavea.tryCatch('get property report', function(propertyId){
        var url = P.Data.path + 'handlers/report-download.ashx';
        var data = { propertyId : propertyId };
        window.location.href = url + _objectToQueryString(data);
    });
    
    // Checks to see if a property report is available for download
    P.Data.checkPropertyReportExists = function(propertyId, callback, error) {
        var url = P.Data.path + 'handlers/report-download.ashx';
        var data = { propertyId : propertyId };
        _callHandler('POST', url, data, callback, error);
    };   
    
    // Queries for property location information within a bounding box
    P.Data.getPropertyLocations = function(criteria, minx, miny, maxx, maxy, minBoundsX, minBoundsY, maxBoundsX, maxBoundsY, callback, error) {
        // Encode the collections as JSON objects.
        if (criteria && typeof criteria === 'object') {
            criteria = JSON.stringify(criteria);
        }

        var url = P.Data.path + 'handlers/property-locations.ashx';
        var data = { criteria: criteria, minx:minx, miny:miny, maxx:maxx, maxy:maxy, minBx: minBoundsX, maxBx: maxBoundsX, minBy: minBoundsY, maxBy: maxBoundsY };
        _callHandler('GET', url, data, callback, error);
    };
    
    // Query property details for given list of property Ids
    P.Data.getPropertyDetails = function(ids, callback, error) {
        var url = P.Data.path + 'handlers/property-details.ashx';
        var data = { ids:ids };
        _callHandler('GET', url, data, callback, error);
    };

    //  Retreive Nychanis search metadata        
    P.Data.getNychanisMeta = Azavea.tryCatch('data get Nychanis metadata', function(callback, error) {
        var url = P.Data.path + 'handlers/nyc-meta.ashx';
        _callHandler('GET', url, null, callback, error);
    });

    // Query Nychanis database
    P.Data.getNychanis = Azavea.tryCatch('data get Nychanis', function(pagesize, page, orderby, orderasc,
            indicator, resolution, timetype, minyear, maxyear, scope, subscope, callback, error) {
        var url = P.Data.path + 'handlers/nychanis.ashx';
        var data = { pagesize: pagesize, page: page, sortby: orderby, sortasc: orderasc, indicator: indicator,
            resolution: resolution, timetype: timetype, minyear: minyear, maxyear: maxyear, 
            borough: scope, subborough: subscope };
        _callHandler('GET', url, data, callback, error);
    });
    
    // Query Nychanis database and initiate results as a CSV download
    P.Data.getNychanisCsv = Azavea.tryCatch('data get Nychanis csv', function(indicator, resolution, timetype, minyear, maxyear, scope, subscope) {
        var url = P.Data.path + 'handlers/nychanis.ashx';
        var data = { csv: true, pagesize: -1, page: -1, sortby: -1, sortasc: false, indicator: indicator,
            resolution: resolution, timetype: timetype, minyear: minyear, maxyear: maxyear, 
            borough: scope, subborough: subscope };
            
        window.location.href = url + _objectToQueryString(data);
    });
}(PDP));