(function(N) {
    N.ProjectDetailsController = function(id) {
        this._id = id;
    };

    N.ProjectDetailsController.prototype._load = function () {
        return $.ajax('handlers/property-details-children.ashx', {
            dataType: 'json',
            data: { id: this._id }
        });
    };

    N.ProjectDetailsController.prototype.render = function($target) {
        var self = this,
            xhr = this._load();
        xhr.done(function(details) {
            self.renderDetails(details, $target);
        });
    };

    N.ProjectDetailsController.prototype.renderDetails = function(details, $target) {
        var panelTmpl = _.template($('#project-details-template').html()),
            reacTmpl = _.template($('#reac-display-template').html()),
            parcelTmpl = _.template($('#parcel-display-template').html()),
            eventTmpl = _.template($('#property-display-template').html()),
            subsidyTmpl = _.template($('#subsidy-display-template').html()),
            formatDate = function (datestring) {
                if (!datestring) return '';
                return moment(datestring).format("MM/DD/YYYY");
            },
            renderAndFormat = function(list, dateFields, tmpl) {
                if (list) {
                    return _.map(list, function (x) {
                        var override = {};
                        _.each(dateFields, function(name) {
                            override[name] = formatDate(x[name]);
                        });
                        var ctx = $.extend(x, override);
                        return tmpl(ctx);
                    }).join('');
                }
                return null;
            };

        var children = {
            reac: renderAndFormat(details.Reac, ['ScoreDate'], reacTmpl),
            parcel: renderAndFormat(details.Parcel, ['OwnerDate'], parcelTmpl),
            property: renderAndFormat(details.Property, ['EventDate'], eventTmpl),
            subsidy: renderAndFormat(details.Subsidy,
                ['ProgramActiveStart', 'ProgramActiveEnd', 'SubsidyUpdate'], subsidyTmpl)
        };

        $target.empty().append(panelTmpl(children));
        console.log(children);
        console.log(panelTmpl(children));
    };

}(PDP));