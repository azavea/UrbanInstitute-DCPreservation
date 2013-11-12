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


    P.ManageOrgs = function (opts) {
        var self = this;
        throwIfSettingsInvalid(opts);
        self._settings = opts;
        self._orgs = [];
        self._rowTemplate = _.template($(self._settings.rowTemplateId).html());
        self._updateTemplate = _.template($(self._settings.updateTemplateId).html());

        self._handleDelete = function() {
            var $this = $(this),
                $row = $this.parents('tr'), id = $this.data("id"),
                name = $row.find('.name').text();

            var callback = function() {
                self._fetch();
            };
            var errback = function() {
                PDP.Util.alert("There was an error deleting that organization");
            };
            var ok = confirm("Are you sure you want to delete " + name + "?");
            if (ok) {
                P.Data.deleteOrganization(id, callback, errback);
            }
        };

        self._handleAddition = function () {
            var name = $(self._settings.addRowInputId).val();
            if (!name) {
                PDP.Util.alert("You must provide an organization name");
                return;
            }
            var callback = function() {
                self._fetch();
            };
            var errback = function() {
                PDP.Util.alert("There was an error adding that organization.", "Error");
            };
            P.Data.addOrganization(name, name, _.bind(callback, self), errback);
        };

        self._handleUpdate = function() {
            var name = $(this).parents('tr').find('.name').text(),
                id = $(this).data('id'),
                errback = function() {
                    PDP.Util.alert("There was an error updating the organization.", "Error");
                };
            
            $(self._updateTemplate({ name: name })).dialog({
                buttons: {
                    update: function () {
                        var newName = $(this).find('.updated-name').val();
                        P.Data.updateOrganization(id, newName, _.bind(self._fetch, self), errback);
                        $(this).dialog('destroy');
                    },
                    cancel: function () {
                        $(this).dialog('destroy');
                    }

                }
            });
                
        };
    };

    P.ManageOrgs.prototype.init = function() {
        var self = this;
        P.Data.path = "../";
        $("button[data-action=add]").click(self._handleAddition);
        $(self._settings.addRowInputId).keyup(function(e) {
            if (e.keyCode == ENTER_KEY) {
                self._handleAddition();
            }
        });

        $(self._settings.rowContainerId)
            .on('click', '.edit', self._handleUpdate)
            .on('click', '.delete', self._handleDelete);
        
        self._fetch();
    };
    
    P.ManageOrgs.prototype._fetch = function () {
        var self = this;
        self._orgs = [];
        var callback = function (data) {
            self._orgs = data;
            self._render();
        };
        var errback = function () {
            PDP.Util.alert("There was an error fetching network organizations", "Error");
        };
        P.Data.getOrganizations(callback, errback);
    };

    P.ManageOrgs.prototype._render = function () {
        var self = this,
            $rowContainer = $(self._settings.rowContainerId);

        $rowContainer.empty();
        _.each(self._orgs, function (org) {
            $rowContainer.append(self._rowTemplate(org));
        });
        $(self._settings.addRowInputId).val("");;
    };

}(PDP));

