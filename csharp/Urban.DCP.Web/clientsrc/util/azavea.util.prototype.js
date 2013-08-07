(function(az) {
    /*
     * For those who prefer prototype augmentation, here are a number of utility methods
     * handily grafted onto the prototypes for the base objects.
     */
    String.prototype.trim = String.prototype.trim || function() {
        return az.trimString(this);
    };
    String.prototype.padLeft = String.prototype.padLeft || function(length, padding) {
        return az.padLeft(this, length, padding);
    };
    String.prototype.padRight = String.prototype.padRight || function(length, padding) {
        return az.padRight(this, length, padding);
    };
    String.prototype.htmlEncode = String.prototype.htmlEncode || function() {
        return az.escapeHTML(this);
    };

    Number.prototype.superToString = Number.prototype.superToString || function(precision, split) {
        return az.numberToString(this, precision, split);
    };

    Date.prototype.add = Date.prototype.add || function(interval, amt) {
        return az.addToDate(this, interval, amt);
    };
    Date.prototype.clone = Date.prototype.clone || function() {
        return az.cloneDate(this);
    };
    Date.prototype.toISOString = Date.prototype.toISOString || function() {
        return az.dateToISOString(this);
    };
    
    Date.prototype.parseISOString = Date.prototype.parseISOString || function (date) {
        return az.parseISOString(date);
    };
     
    // Some versions of IE do not natively support indexOf on arrays.
    Array.prototype.indexOf = Array.prototype.indexOf || function (item) {
        return az.arrayIndexOf(this, item);
    };

}(Azavea));
