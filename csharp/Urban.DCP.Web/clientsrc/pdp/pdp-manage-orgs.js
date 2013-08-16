(function (P) {
    var ENTER_KEY = 13;

    function throwIfSettingsInvalid(settings) {
        return Azavea.tryCatch("org manager settings", function () {
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
        });
    }

    function handleDelete(row) {
        var self = this;
        var id = $(row).find('input').attr("data-id");
        var callback = function () {
            self._fetch();
        }
        var errback = function () {
            PDP.Util.alert("There was an error deleting that organization");
        }
        P.Data.deleteOrganization(id, _.bind(callback, self), errback);
    }

    function handleAddition() {
        var self = this;
        var name = $(self._settings.addRowInputId).val();
        if (!name) { return };
        var callback = function () {
            self._fetch();
        }
        var errback = function () {
            PDP.Util.alert("There was an error adding that organization.", "Error");
        }
        P.Data.addOrganization(name, name, _.bind(callback, self), errback);
    }

    function handleUpdate(row) {
        var self = this;
        var id = $(row).find('input').attr("data-id");
        var $input = $(row).find('input')
        var newName = $input.val();
        var callback = function () {
            $input.addClass("saved");
            setTimeout( function() {
                $input.removeClass("saved");
            }, 500);
        }
        var errback = function () {
            PDP.Util.alert("There was an error updating that organization.", "Error");
        }
        P.Data.updateOrganization(id, newName, callback, errback);
    }

    P.ManageOrgs = function (opts) {
        var self = this;
        throwIfSettingsInvalid(opts);
        self._settings = opts;
        self._orgs = [];
        self._rowTemplate = _.template($(self._settings.rowTemplateId).html());
    };

    P.ManageOrgs.prototype.init = function () {
        var self = this;
        P.Data.path = "../";
        $("button[data-action=add]").click(_.bind(handleAddition, self));
        $(self._settings.addRowInputId).keyup(function (e) {
            if (e.keyCode == ENTER_KEY) { handleAddition.call(self) }
        });
        self._fetch();
    }

    P.ManageOrgs.prototype._fetch = function () {
        var self = this;
        self._orgs = [];
        var callback = function (data) {
            self._orgs = data;
            self._render();
        };
        var errback = function () {
            PDP.Util.alert("There was an error fetching registered organizations", "Error");
        };
        P.Data.getOrganizations(callback, errback);
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
            $(row).find("input")
                .bind("change", _.bind(handleUpdate, self, row))
                .keyup(function(e) {
                    if (e.keyCode == ENTER_KEY) {
                        handleUpdate.call(self, row);
                    }
                });
        });
        $(self._settings.addRowInputId).val("");;
    };

}(PDP));

