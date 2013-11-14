(function (P) {
    var settings,
        $typeSelect,
        $revisionContainer,
        $requestButton,
        revisionTemplate;

    function throwIfSettingsInvalid(settings) {
        var required = ["typeSelect", "revisionRadio", "revisionContainer", "revisionTemplate", "requestButton"];
        
        for (var i = 0; i < required.length; i++) {
            var field = required[i],
                value = settings[field];

            if (!value) {
                throw new Error(field + " is required.");
            }
        }
    }

    var controller = P.UploadRevisionController = function (opts) {
        throwIfSettingsInvalid(opts);
        settings = opts;
    };

    controller.prototype.init = function() {
        var self = this;
        P.Data.path = "../";
        $typeSelect = $(settings.typeSelect);
        $revisionContainer = $(settings.revisionContainer);
        revisionTemplate = _.template($(settings.revisionTemplate).html());
        $requestButton = $(settings.requestButton);

        _.each([$typeSelect, $revisionContainer, $requestButton], function throwIfEmpty(elem) {
            if (elem.length == 0) {
                throw new Error("upload revision controller init error, selector not found.");
            }
        });

        if (!revisionTemplate) {
            throw new Error("upload revision controller init error, template not initialized.");
        }

        $requestButton.click(_.bind(self._handleRestoreRequest, self));

        $typeSelect.change(_.bind(self._fetch, self));

        self._fetch();
    };

    controller.prototype._fetch = function() {
        var self = this;
        var error = function () { alert("There was an error fetching revisions."); };
        var type = $typeSelect.val();
        P.Data.getUploadRevisions(type, _.bind(self._render, self), error);
    };

    controller.prototype._handleRestoreRequest = function () {
        var self = this;
        if (confirm("Are you sure you want to restore a revision?")) {
            var id = $(settings.revisionRadio).val();
            var error = function() {
                PDP.Util.alert("There was an error restoring that revision");
            };
            P.Data.postUploadRevisions(id, _.bind(self._fetch, self), error);
        }
    };

    controller.prototype._render = function (data) {
        $revisionContainer.html("");
        $requestButton.hide();
        _.each(data, function (r) {
            $requestButton.show();
            r["formattedDate"] = moment(r.Date).format('MM/DD/YYYY, h:mm:ss a');
            $revisionContainer.append(revisionTemplate(r));
        });
    }
})(PDP);