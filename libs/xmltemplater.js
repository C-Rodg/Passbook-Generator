/**
 * @author: Olga (helgadeville)
 * 
 * The unique Angular XML templating - directly from HTML pseudo-template
 * 
 * uses the following directives:
 * 
 * xml-scope[="watch1,watch2"] xml-element="NameOfElement"
 * xml-attribute="ATTRIBUTE_NAME:ATTRIBUTE_VALUE"
 * 
 */

(function() {
    var xmlTemplater = angular.module('xml-templater', []);

    xmlTemplater.factory('xml-helper', function() {
        var helper = {};
        /** This checks for disallowed attributes */
        helper.checkAttribute = function(attr) {
            return !(attr == "class" || attr == "xml-scope" || attr.substr(0, 3) == "ng-");
        };
        /** Fancy function to remove comments and add encoding */
        helper.getRawXML = function(id) {
            var element = typeof id == "string" ? document.getElementById(id) : id;
            if (!element) {
                return;
            }
            var xmls = [];
            var entries = [];
            var findEntries = function(entry) {
                if (entry.tagName && entry.tagName.toUpperCase() == "XML") {
                    entries.push(entry);
                }
                for (var i = 0; i < entry.childNodes.length; i++) {
                    var child = entry.childNodes[i];
                    findEntries(child);
                }
            };
            findEntries(element);
            // here in entries we are ready to parse through XML
            var getXmlFrom = function(entry) {
                // this will skip all text points
                var text = "";
                var tag = entry.tagName;
                if (!tag) {
                    return text;
                }
                // by default go to lowercase
                tag = tag.toLowerCase();
                var attributes = entry.attributes;
                var attr = "";
                if (attributes) {
                    for (var i = 0; i < attributes.length; i++) {
                        var name = attributes[i].name;
                        if (name && helper.checkAttribute(name)) {
                            var value = attributes[i].value;
                            // special case !
                            if (name == "xml-element") {
                                tag = value;
                                continue;
                            }
                            attr += " " + name + (value ? '="' + attributes[i].value + '"' : '');
                        }
                    }
                }
                text += "<" + tag + attr + ">";
                if (entry.childNodes) {
                    if (entry.childNodes.length == 1 && entry.childNodes[0].nodeType == entry.childNodes[0].TEXT_NODE) {
                        text += entry.textContent ? entry.textContent.trim() : "";
                    } else {
                        for (var i = 0; i < entry.childNodes.length; i++) {
                            var child = entry.childNodes[i];
                            text += getXmlFrom(child, text);
                        }
                    }
                }
                text += "</" + tag + ">";
                return text;
            };
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var attributes = entry.attributes;
                var attr = "";
                if (attributes) {
                    for (var j = 0; j < attributes.length; j++) {
                        var name = attributes[j].name;
                        if (name && helper.checkAttribute(name)) {
                            var value = attributes[j].value;
                            attr += " " + name + (value ? '="' + attributes[j].value + '"' : '');
                        }
                    }
                }
                var xml = "<?xml" + (attr ? attr : "") + "?>";
                for (var j = 0; j < entry.childNodes.length; j++) {
                    var child = entry.childNodes[j];
                    var html = child.innerHTML;
                    xml += html ? html.trim().replace(/<!--.+?-->/g, '') : '';
                }
                xmls.push(xml);
            }
            return xmls.length == 1 ? xmls[0] : xmls;
        };
        helper.getXML = function(id) {
            var element = typeof id == "string" ? document.getElementById(id) : id;
            if (!element) {
                return;
            }
            var xmls = [];
            var entries = [];
            var findEntries = function(entry) {
                if (entry.tagName && entry.tagName.toUpperCase() == "XML") {
                    entries.push(entry);
                }
                for (var i = 0; i < entry.childNodes.length; i++) {
                    var child = entry.childNodes[i];
                    findEntries(child);
                }
            };
            findEntries(element);
            // here in entries we are ready to parse through XML
            var getXmlFrom = function(entry) {
                // this will skip all text points
                var text = "";
                var tag = entry.tagName;
                if (!tag) {
                    return text;
                }
                // by default go to lowercase
                tag = tag.toLowerCase();
                var attributes = entry.attributes;
                var attr = "";
                if (attributes) {
                    for (var i = 0; i < attributes.length; i++) {
                        var name = attributes[i].name;
                        if (name && helper.checkAttribute(name)) {
                            var value = attributes[i].value;
                            // special case !
                            if (name == "xml-element") {
                                tag = value;
                                continue;
                            }
                            attr += " " + name + (value ? '="' + attributes[i].value + '"' : '');
                        }
                    }
                }
                text += "<" + tag + attr + ">";
                if (entry.childNodes) {
                    if (entry.childNodes.length == 1 && entry.childNodes[0].nodeType == entry.childNodes[0].TEXT_NODE) {
                        text += entry.textContent ? entry.textContent.trim() : "";
                    } else {
                        for (var i = 0; i < entry.childNodes.length; i++) {
                            var child = entry.childNodes[i];
                            text += getXmlFrom(child, text);
                        }
                    }
                }
                text += "</" + tag + ">";
                return text;
            };
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var attributes = entry.attributes;
                var attr = "";
                if (attributes) {
                    for (var j = 0; j < attributes.length; j++) {
                        var name = attributes[j].name;
                        if (name && helper.checkAttribute(name)) {
                            var value = attributes[j].value;
                            attr += " " + name + (value ? '="' + attributes[j].value + '"' : '');
                        }
                    }
                }
                var xml = "<?xml" + (attr ? attr : "") + "?>";
                for (var j = 0; j < entry.childNodes.length; j++) {
                    var child = entry.childNodes[j];
                    xml += getXmlFrom(child);
                }
                xmls.push(xml);
            }
            return xmls;
        };
        return helper;
    });

    /**
     * A custom directive for generating contents of dom tree in XML The
     * directive takes a form: <div xml="wachVariable1,watchVariable2"> ...
     */
    xmlTemplater.directive('xmlScope', [ '$document', 'xml-helper', function($document, xmlHelper) {
        var d = {
            restrict : 'A',
            templateNamespace : 'html',
            scope : false,
            link : function(scope, iElements, attributes, ngModelCtrl) {
                var processor = function(element) {
                    if (element.attributes) {
                        var toRemove = [];
                        for (var i = 0; i < element.attributes.length; i++) {
                            var attr = element.attributes[i].name;
                            if (!xmlHelper.checkAttribute(attr)) {
                                toRemove.push(attr);
                            }
                        }
                        for (var i = 0; i < toRemove.length; i++) {
                            element.attributes.removeNamedItem(toRemove[i]);
                        }
                    }
                };
                var recursor = function(rootElements) {
                    for (var i = 0; i < rootElements.length; i++) {
                        var iElement = rootElements[i];
                        if (iElement.attributes) {
                            for (var j = 0; j < iElement.attributes.length; j++) {
                                var attr = iElement.attributes[j];
                                if (attr.name == "xml-scope") {
                                    var val = attr.value;
                                    if (val && val.length > 0) {
                                        val = val.split(",");
                                        for (var k = 0; k < val.length; k++) {
                                            scope.$watch(val[k], function() {
                                                recursor(rootElements);
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        if (iElement.childNodes && iElement.childNodes.length > 0) {
                            recursor(iElement.childNodes);
                        }
                        processor(iElement);
                    }
                };
                // and this must be done AFTER $digest finishes :)
                setTimeout(function() {
                    recursor(iElements);
                }, 0);
            }
        };
        return d;
    } ]);

    /**
     * Directive for attributes
     */
    xmlTemplater.directive('xmlAttribute', [
            '$document',
            function($document) {
                var d = {
                    restrict : 'A',
                    templateNamespace : 'html',
                    scope : false,
                    link : function(scope, iElements, attributes, ngModelCtrl) {
                        if (!iElements) {
                            return;
                        }
                        var replacer = function(element) {
                            if (element.attributes) {
                                // we need to rebuild attribute list
                                // by adding new attributes and removing old
                                for (var j = 0; j < element.attributes.length; j++) {
                                    var attr = element.attributes[j];
                                    if (attr) {
                                        var name = attr.name;
                                        if (name == "xml-attribute") {
                                            var value = attr.value;
                                            element.removeAttributeNode(attr);
                                            if (!value) {
                                                continue;
                                            }
                                            var idxeq = value.indexOf('=');
                                            var idxsc = value.indexOf('|');
                                            var idx = idxeq > 0 && idxsc > 0 ? Math.min(idxeq, idxsc) : (idxeq > 0 ? idxeq
                                                    : (idxsc > 0 ? idxsc : -1));
                                            if (idx <= 0) {
                                                continue;
                                            }
                                            name = value.substr(0, idx);
                                            // removing old attribute
                                            element.removeAttribute(name);
                                            value = value.substr(idx + 1);
                                            var nowy = document.createAttribute(name);
                                            if (value) {
                                                nowy.value = value;
                                                var regex = /\{\{.+?\}\}/g;
                                                var result;
                                                while ((result = regex.exec(value))) {
                                                    var str = result.pop();
                                                    str = str.substr(2, str.length - 4);
                                                    if (str) {
                                                        scope.$watch(str, function() {
                                                            replacer(element);
                                                        });
                                                    }
                                                }
                                            }
                                            element.setAttributeNode(nowy);
                                        }
                                    }
                                }
                            }
                        }
                        for (var i = 0; i < iElements.length; i++) {
                            var element = iElements[i];
                            replacer(element);
                        }
                    }
                };
                return d;
            } ]);

}).call(this);
