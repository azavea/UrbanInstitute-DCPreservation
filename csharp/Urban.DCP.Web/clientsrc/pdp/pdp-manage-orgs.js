(function (P) {

    function throwIfSettingsInvalid(settings) {
        //TODO is there a magic Azavea.util.throw that logs?
        if (!settings.rowContainerId) {
            throw new Error("rowContainerId required");
        }
        if (!settings.rowClass) {
            throw new Error("rowClass required");
        }
        if (!settings.handler) {
            throw new Error("Handler required");
        }
        if (!settings.rowTemplateId) {
            throw new Error("rowTemplateId missing");
        }
        if (!settings.addRowInputId) {
            throw new Error("addRowInputId missing");
        }
        return settings;
    }

    function handleDelete(row) {
        var self = this;
        var id = $(row).find('input').attr("data-id");
        var callback = function () {
            self._fetch();
        }
        self._delete(id, _.bind(callback, self));
    }

    function handleAddition() {
        var self = this;
        var name = $(self._settings.addRowInputId).val();
        if (name) {
            var callback = function () {
                self._fetch();
            }
            self._add(name, _.bind(callback, self));
        }
    }

    function handleUpdate(row) {
        var self = this;
        var id = $(row).find('input').attr("data-id");
        var name = $(row).find('input').val();
        self._update(id, name);
    }

    P.ManageOrgs = function (opts) {
        var self = this;        
        self._settings = throwIfSettingsInvalid(opts);
        self._orgs = [];
        self._rowTemplate = _.template($(self._settings.rowTemplateId).html());
    };

    P.ManageOrgs.prototype.init = function () {
        var self = this;
        $("button[data-action=add]").click(_.bind(handleAddition, self));
        self._fetch();
    };

    P.ManageOrgs.prototype._add = function (name, callback) {
        var self = this;
        $.ajax({
            url: self._settings.handler,
            data: { "name": name },
            success: callback,
            error: function () {
                PDP.Util.alert("There was an error adding that organization.", "Error");
            },
            type: "POST"
        });
    };

    P.ManageOrgs.prototype._delete = function (id, callback) {
        var self = this;
        $.ajax({
            url: self._settings.handler,
            data: { "Id": id },
            success: callback,
            error: function () {
                PDP.Util.alert("There was an error deleting that organization");
            },
            type: "DELETE"
        });
    };


    P.ManageOrgs.prototype._fetch = function () {
        var self = this;
        self._orgs = [];
        $.ajax({
            url: self._settings.handler,
            success : function(data) {
                self._orgs = data;
                self._render();
            },
            error : function() {
                PDP.Util.alert("There was an error fetching registered organizations", "Error");
            },
            type: "GET",
            dataType: "json"
        });
    };

    P.ManageOrgs.prototype._update = function (id, newName) {
        var self = this;
        self._orgs = [];
        $.ajax({
            data: {"Id":id, "Name": newName},
            url: self._settings.handler,
            error: function () {
                PDP.Util.alert("There was an error updating that organization.", "Error");
            },
            type: "PUT"
        });
    };


    P.ManageOrgs.prototype._render = function () {
        var self = this;
        var $rowContainer = $(self._settings.rowContainerId);
        $rowContainer.empty();
        _.each(self._orgs, function (org) {
            $rowContainer.append(self._rowTemplate(org));
        });
        _.each($(self._settings.rowClass), function (row) {
            //bind delete handlers
            $(row).find("button[data-action=delete]").click(_.bind(handleDelete, self, row));
            //bind update handlers
            $(row).find("input").bind("blur change", _.bind(handleUpdate, self, row));
        });
    };

}(PDP));

