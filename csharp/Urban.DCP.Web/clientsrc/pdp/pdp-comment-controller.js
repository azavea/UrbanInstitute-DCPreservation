(function (P) {
    var settings;
    var $comments;
    var $newCommentForm;
    var REQUIRED_CONTROLLER_PARAMETERS = ["commentFormTemplate", "commentTemplate", "propId", "commentContainer", "newCommentFormContainer",
        "currUser"];
    var STRINGS = {
        noComments: "There are currently no comments for this property.",
        errorDownloadingComment: "There was an error downloading the comments.",
        commentPosted: "Comment Posted",
        errorPuttingComment: "Error posting comment."
    };

    function throwIfSettingsInvalid(settings) {
        _.each(REQUIRED_CONTROLLER_PARAMETERS, function throwIfParamNotPresent(param) {
            if (!settings[param]) {
                throw new Error("Param: " + param + " is missing.");
            }
        });
    };

    var controller = P.CommentController = function (opts) {
        var self = this;
        Azavea.tryCatch("check CommentController params", function () { throwIfSettingsInvalid(opts) });
        settings = opts;
        $comments = $(settings.commentContainer);
        $newCommentForm = $(settings.newCommentFormContainer);
    };

    controller.prototype.init = function () {
        var self = this;
        self._reloadComments();
    };

    controller.prototype._reloadComments = function () {
        var self = this;
        var onError = function onCommentDataLoadError() {
            P.Util.alert(STRINGS.errorDownloadingComment, "Error");
        };
        P.Data.getComments(settings.propId, _.bind(self._renderComments, self), onError);
    };

    controller.prototype._renderComments = function (data) {
        var self = this;
        $comments.html("");

        if (data.length == 0) {
            $comments.append(STRINGS.noComments);
        } else {

            var template = _.template($(settings.commentTemplate).html());
            $comments.append("<h3>{{num}} Comment".replace(/{{num}}/, data.Comments.length)
                + (data.Comments.length > 1 ? "s" : "") + "</h3>");
            _.each(data.Comments, function (comment) {
                comment["forwho"] = _commentForField(comment);
                comment["formattedDate"] = moment(comment.Modified).format('MM/DD/YY h:mm A');
                var $newComment = $(template(comment));
                var submitButton = $newComment.find(".save-edit");
                $comments.append($newComment);
                $newComment.find(".trash-comment").click(_.bind(self._trashComment, self, comment.Id));
                $newComment.find(".edit-comment").click(_.bind(self._showCommentEditor, self, $newComment));
                $newComment.find(".cancel-edit").click(_.bind(self._hideCommentEditors, self));
                submitButton.click(_.bind(self._doCommentEdit, self, $newComment, comment.Id)); // non image click handler, maybe replaced later
                $newComment.find(".comment-access-level-edit").find('option[value="' + comment.AccessLevel + '"]').attr('selected', 'selected');

                var formData = function() {
                    return {
                        commentId: comment.Id,
                        removeImage: false,
                        text: $newComment.find(".edited-comment").val(),
                        level: $newComment.find(".comment-access-level-edit").val()
                    };
                };

                self._registerSubmit(formData, submitButton, $newComment);
            });
        }

        $(".swipebox").swipebox({
            hideBarsDelay: 0
        });
        
        if (data.CanAdd) {
            self._renderCommentForm(settings.propId);
        }
    };

    controller.prototype._renderCommentForm = function () {
        var self = this;
        var html = $(settings.commentFormTemplate).html();
        var template = _.template(html);
        var templateOpts = {};
        $newCommentForm.html("");
        $newCommentForm.append(template(templateOpts));

        var $submitButton = $("#submit-new-comment", $newCommentForm);
        var $comment = $("#new-comment");
        var $image = $("#comment-image");
        var $accessLevel = $("#comment-access-level");

        var success = function() {
            $comment.html("");
            $image.val("");
            self._reloadComments.call(self, settings.propId);
        };

        var error = function(resp, status, err) {
            Azavea.logError(status + " " + err);
            P.Util.alert(STRINGS.errorPuttingComment);
        };

        var onSubmit = function() {
            var text = $comment.val();
            var level = $accessLevel.val();
            P.Data.putComment(settings.propId, text, level, success, error);
        };
        $submitButton.click(onSubmit); // non-image click handler, maybe replaced later by fileupload


        //evaluated by fileupload at file-add time.
        var formData = function() {
            return { 
                "_method" : "PUT",
                "id": settings.propId,
                "text": $comment.val(),
                "level":  $accessLevel.val()
            };
        };

        self._registerSubmit(formData, $submitButton, $newCommentForm);
    };

    controller.prototype._registerSubmit = function (formData, $submitButton, $commentBlock) {

        var self = this,
            $uploader = $commentBlock.find(".edited-image"),
            $imageLabel = $commentBlock.find(".image-status");

        $uploader.fileupload({
            autoUpload: false,
            url: P.Data.path + 'handlers/comments.ashx',
            type: 'POST',
            done: function () {self._reloadComments(); },
            fail: function (e, data) {
                Azavea.logError(e + " " + data);
                P.Util.alert("Problem uploading file.");
            },
            // On file add, rebind a new click handler to the submit button, that submits the file upload.
            add: function (e, data) {
                $submitButton.off();
                var file = data.files[0];
                if (file) {
                    $uploader.hide();
                    $imageLabel.text("Comment Image: " + file.name);
                    $submitButton.click(function () {
                        $uploader.show();
                        data.formData = formData();
                        data.submit();
                    });
                }
            }
            
        });
    };
    
    controller.prototype._trashComment = function (commentId) {
        var self = this;
        var onSuccess = function () {
            self._reloadComments.call(self, settings.propId);
        };
        var onError = function(resp, status, err) {
            Azavea.logError(status + " " + err);
            self._reloadComments.call(self, settings.propId);
        };
        if (confirm("Are you sure you want to delete this comment?"))
        {
            P.Data.deleteComment(commentId, onSuccess, onError);
        }

    };

    controller.prototype._hideCommentEditors = function() {
        $(".comment .edit").hide("fast", function() {
            $(".comment .display").show("fast");
        });
    };

    controller.prototype._showCommentEditor = function($comment) {
        $comment.find(".display").hide("fast", function() {
            $comment.find(".edit").show("fast");
        });
    };


    function _commentForField(comment) {
        if (comment.AccessLevel == 'Public') {
            return "Everyone";
        } else if (comment.AccessLevel == 'SameOrg') {
            return comment.AssociatedOrgName
                ? comment.AssociatedOrgName + " members only"
                : "unknown organization members only";
        } else if (comment.AccessLevel == 'Network') {
            return "Network Members only";
        } else {
            return "";
        }
    }

    controller.prototype._doCommentEdit = function($comment, id) {
        var self = this,
            newText = $comment.find(".edited-comment").val(),
            removeImage = $comment.find(".remove-image").attr("checked") == "checked",
            accessLevel = $comment.find("select.comment-access-level-edit").val();

        var success = function() {
            self._reloadComments();
        };

        var error = function(resp, status, err) {
            Azavea.logError(err + " " + status);
            self._reloadComments();
        };

        P.Data.postComment(id, newText, removeImage, accessLevel, success, error);


    };
}(PDP));