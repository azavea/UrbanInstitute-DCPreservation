(function(az) {
    az.renderers = {
        address: function(house, extension, unit, stprefix, stname, sttype, stsuffix) {
            var address = '';
            if (house && house.toString().trim().length > 0) {
                address += house;
            }
            if (extension && extension.toString().trim().length > 0) {
                address += ' - ' + extension;
            }
            if (unit && unit.toString().trim().length > 0) {
                address += ' ' + unit;
            }
            if (stprefix && stprefix.toString().trim().length > 0) {
                address += ' ' + stprefix;
            }
            if (stname && stname.toString().trim().length > 0) {
                address += ' ' + stname;
            }
            if (sttype && sttype.toString().trim().length > 0) {
                address += ' ' + sttype;
            }
            if (stsuffix && stsuffix.toString().trim().length > 0) {
                address += ' ' + stsuffix;
            }

            return address;
        },
        noValue: function(val) {
            if (typeof val === 'string') {
                val = val.trim();
            }
            if (val === 0) {
                return val;
            }
            return val || '[No Value]';
        },
        yesNo: function(yesNoVal) {
            var v = '';
            if (yesNoVal !== undefined) {
                v = yesNoVal ? 'Yes' : 'No';
            } else if (typeof yesNoVal === 'boolean' || typeof yesNoVal === 'number') {
                v = yesNoVal ? 'Yes' : 'No';
            } else if (typeof yesNoVal === 'string') {
                v = yesNoVal === '1' || yesNoVal.toLowerCase() === 'true';
            }
            return v;
        },
        date: function(dateVal) {
            var d = '';
            if (dateVal.getDate) {
                var dt = dateVal.getDate(), m = dateVal.getMonth() + 1;
                var day = (dt < 10 ? '0' : '') + dt;
                var month = (m < 10 ? '0' : '') + m;

                d = month + '-' + day + '-' + dateVal.getFullYear();
            }
            return d;
        },
        money: function(num, excludeCents) {
            /// <summary>Converts the input into a nicely formatted string ($##,###.##).</summary>
            // Inspiration for this function came from http://javascript.internet.com/forms/currency-format.html
            // This was determined to be public domain as the description said:
            //     Simply click inside the window below, use your cursor to highlight the script, and copy (type Control-c or Apple-c) the script into a new file in your text editor (such as Note Pad or Simple Text) and save (Control-s or Apple-s). The script is yours!!!
            num = num.toString().replace(/\$|\,/g, '');
            if (isNaN(num)) {
                num = "0";
            }
            // Convert back to a number since we need to check on value
            num = parseFloat(num);
            sign = (num === (num = Math.abs(num)));
            num = Math.floor(num * 100 + 0.50000000001);
            cents = num % 100;
            num = Math.floor(num / 100).toString();
            
            if (cents < 10) {
                cents = "0" + cents;
            }
            var i;
            for (i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
                num = num.substring(0, num.length - (4 * i + 3)) + ',' +
                    num.substring(num.length - (4 * i + 3));
            }
            
            var retVal = ((sign) ? '' : '-') + '$' + num;
            if (!excludeCents) {
                retVal += ('.' + cents);
            }
            return retVal;
        },
        length: function(lengthVal, units) {
            var n = '';
            if (typeof lengthVal === 'number') {
                n = Math.round(lengthVal, 0);
                n = n.superToString();
                n += ' ' + units;
            }
            return n;
        },
        area: function(areaVal, units) {
            var n = '';
            if (typeof areaVal === 'number') {
                n = Math.round(areaVal, 0);
                n = n.superToString();
                n += ' ' + units + '<sup>2</sup>';
            }
            return n;
        },
        elevation: function(bottom, top, flag) {
            var elev = '';
            if (flag && flag === 1) {
                if (typeof bottom === 'number') {
                    elev = bottom.toFixed(2);
                }
                if (typeof top === 'number') {
                    if (elev) { elev += ' to '; }
                    elev += top.toFixed(2);
                }
            }
            return elev;
        },
        merge: function(tokenizedStr, tokens) {
            // Looks for tokens like {ADDRESS} or {1} in tokenizedStr and merges
            // in the provided tokens.
            var s = tokenizedStr.trim(),
                token, key, i;
            for (i=0; i<tokens.length; i++) {
                token = tokens[i];
                if (isNaN(parseInt(i, 10))) {
                    //i is a string based key
                    key = i;
                } else {
                    //i is an index. Use a 1-based index.
                    key = i + 1;
                }

                s = s.replace('{' + key + '}', token);
            }

            return s;
        },
        concat: function() {
            var retVal = '', i;
            for(i=0; i<arguments.length; i++) {
                if (retVal) {
                    retVal += '-';
                }
                retVal += arguments[i];
            }
            return retVal;
        }
    };
}(Azavea));
