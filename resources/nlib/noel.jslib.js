/**
 * JAVASCRIPT LIBRARY BY NOEL
 * ----------------------------------------------------
 * 
 * @Author NOEL
 * @Version 1.1
 */
(function() {
    if (!Array.prototype.first){
        Array.prototype.first = function(){
            return this[0];
        };
    };
    if (!Array.prototype.last){
        Array.prototype.last = function(){
            return this[this.length - 1];
        };
    };
    if (!Array.prototype.modifyLast){
        Array.prototype.modifyLast = function(arg){
            this[this.length - 1] = arg;
        };
    };
})()

var $N = (function () {  
    "use strict";
    return {
        /**
         * Create HTML Document Element
         * @function elCreator
         * @param {Object} attribute 
         *     -> @required @param {String, String} tagName-value 생성할 HTML태그명
         *     -> @param {String,Obejct} key-value HTML 속성명, 속성 인자
         *     -> @param {Array or Object} children 생성한 Element에 추가될 Children
         * @example $N.elCreator({ tagName : 'table'
                     , class: 'tbl-list'
                     , style: 'dislpay: inline;'
                     , children : [
                                     { tagName : 'th', text: 'test1' }
                                   , { tagName : 'th', text: 'test2' }
                                  ]
                    })
         */
        el : function(tagName, attribute) {
            
            attribute = attribute || {};
            
            attribute.tagName = tagName;
            
            return $N.elCreator(attribute);
        },
        elCreator : function(attribute) {
            
            if ( this.isEmpty(attribute) ) {
                console.error('NO ATTRIBUTE EXCEPTION');
                return;
            }
            if ( this.isString(attribute) ) attribute = { tagName : attribute };
            if ( this.isEmpty(attribute.tagName) ) {
                console.error('NO TAG NAME INCLUDED IN ATTRIBUTE');
                return;
            }

            var tagName = attribute.tagName;
            var el = document.createElement(tagName);
            
            $.each(attribute, function(k, v) {
                k = k.toLowerCase(); 
                if ( k === 'text' ) 
                    el.innerText = v;
                else if ( k === 'html' )
                    el.innerHTML = v;
                else if ( k === 'value' ) 
                    el.value = v;
                else if ( k === 'children' ) {
                
                    if ( $N.isArray(v) ) {
                        v.forEach(function(childObj, idx) {
                            var childEl = $N.elCreator(childObj);
                            el.appendChild(childEl);
                        })
                    }
                    if ( $N.isObject(v) ) {
                        var childEl = $N.elCreator(v);
                        el.appendChild(childEl);
                    }
                }
                else if ( k === 'tagname' ) {
                    
                }
                else 
                    el.setAttribute(k, v);
            })
            
            el.__proto__.setId = function(arg) { this.setAttribute("id", arg) }
            el.__proto__.setName = function(arg) { this.setAttribute("name", arg) }
            el.__proto__.setClass = function(arg) { this.setAttribute("class", arg) }
            el.__proto__.setText = function(arg) { this.innerText = arg }
            el.__proto__.setHTML = function(arg) { this.innerHTML = arg }
            el.__proto__.setValue = function(arg) { this.value = arg }
                        
            return el;
        },
        /**
         * HELP MAKING VALID EL CREATOR FORM
         * @function elCreatorHelper
         * @param {String} selector
         * @returns {Object} 
        */
        tagObj : function(tagName, additional) {
            return Object.assign({"tagName" : tagName}, additional);
        },
        elCreatorHelper : function(selector, isTagName) {
            
            var attributes = {}, domEl;
            
            if ( isTagName ) $N.elCreatorHelper($N.el(selector));
            
            if ( !$N.isString(selector) && !$N.isHtml(selector) ) throw 'ARG IS INVALID FOR THIS FUNCTION';
            
            if ( $N.isString(selector))
                domEl = document.querySelector(selector);
            if ( $N.isHtml(selector) ) 
                domEl = selector;
            
            if ( $N.isNotEmpty(domEl) ) {
                var nodeName = domEl?.nodeName,
                    rawAttr = domEl?.attributes,
                    keys = Object.keys(rawAttr);
                    
                attributes['tagName'] = nodeName;
                
                if ( $N.isNotEmpty(keys) ) {
                    keys.forEach(function(k) {
                        try {
                            if ( $N.isNotEmpty(rawAttr[k].name) )  
                                attributes[rawAttr[k].name] = rawAttr[k].value
                        }
                        catch(e) {}
                    })
                };
                
                
                for ( var i = 0; i < domEl.childNodes.length; i++ ) {
                    var cnode = domEl.childNodes[i];
                    
                    if ( $N.checkType(cnode, 'text') ) {
                        var txt = cnode.data.trim();
                        if ( $N.isNotEmpty(txt) ) attributes["text"] = txt;
                    }
                }
                
                var childrenArr = [];
                
                for ( var i = 0; i < domEl.children.length; i++ ) {
                    var childObj = $N.elCreatorHelper(domEl.children[i]);
                    if ( $N.isNotEmpty(childObj)) childrenArr.push(childObj);
                }
                
                if ( $N.isNotEmpty(childrenArr) ) {
                    attributes["children"] = childrenArr;
                }
                
                return attributes;
            }
        },
        /**
         * RETURN VARIABLE'S TYPE
         * @function getType
         * @param {variable} param :: 타입을 확인할 변수 명
         * @return {String} type
         */
        getType : function(param) {
            try {
                var cnsStr = param.constructor.toString().toLowerCase();
                
                return cnsStr;
            }
            catch (e) {
                return null;
            }
        },
        /**
         * CHECK PARAM'S TYPE
         * @function getType
         * @param {variable} param :: 타입을 확인할 변수 명
         * @param {String} type :: 타입명
         * @return {boolean}
         */
        checkType: function(param, type) {
            var typeNm = this.getType(param);
            try {
                return typeNm.indexOf(type) !== -1;
            }
            catch (e) {
                return false;
            }
        },
        /**
         * CHECK ARG IS ARRAY
         * @function isArray
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isArray : function(param) {
            return this.checkType(param, 'array');
        },
        /**
         * CHECK ARG IS OBJECT
         * @function isObject
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isObject : function(param) {
            return this.checkType(param, 'object');
        },
        /**
         * CHECK ARG IS HTMLElement
         * @function isHtml
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isHtml : function(param) {
            return this.checkType(param, 'html');
        },
        /**
         * CHECK ARG IS NODE
         * @function isNode
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isNode : function(param) {
            return this.checkType(param, 'node');
        },
        /**
         * CHECK ARG IS String
         * @function isString
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isString : function(param) {
            return this.checkType(param, 'string');
        },
        /**
         * CHECK ARG IS Number
         * @function isNumber
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isNumber : function(param) {
            return this.checkType(param, 'number');
        },
        /**
         * CHECK ARG IS Function
         * @function isFunction
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isFunction : function(param) {
            return this.checkType(param, 'function');
        },
        /**
         * CHECK ARG IS Jquery Object
         * @function isJqueryObj
         * @param {variable} param :: 확인할 변수 명
         * @return {boolean}
         */
        isJqueryObj : function(param) {
            return this.checkType(param, 'fn.init') && param.length != 0;
        },

        /**
         * CHECK ARG IS NOT EMPTY
         * @function isNotEmpty
         * @param {variable} src :: 비어있는지 확인할 변수  
         * @return {boolean}
         */
        isNotEmpty : function(src) {
            try {
                if (typeof src == 'undefined') return false;
                if ( this.checkType(src, 'list') ) {
                    if ( src.length === 0 ) return false;
                    else return true;
                }
                if ( this.isObject(src) ) {
                    var keys = Object.keys(src);
                    if ( keys.length === 0 ) return false;
                    else return true;
                }
                if ( this.isArray(src) ) {
                    if ( src.length === 0 ) return false;
                    else return true;
                }
                if ( this.isJqueryObj(src) ) {
                    if ( src.length === 0 ) return false;
                    else return true;
                }
                var obj = String(src);
                
                if (obj == null || obj == undefined || obj == 'null' || obj == 'undefined' || obj == '') return false;
                return true;
            }
            catch(e) {
                
            }
            return false;
        },
        /**
         * CHECK ARG IS EMPTY
         * @function isEmpty
         * @param {variable} src :: 비어있는지 확인할 변수  
         * @return {boolean}
         */
        isEmpty : function(src) {
            return !this.isNotEmpty(src);
        },
        isEmptyArray : function(src) {

            if ( $N.isArray(src) )
                return this.isEmpty(src.join(""));
            else
                return false;
        },
        /**
         * CHECK ARG IS EMPTY OBJECT
         * @function isEmptyObject
         * @param {variable} src :: 비어있는지 확인할 변수  
         * @return {boolean}
         */
        isEmptyObject : function(src) {
            
            if ( !$N.isObject(src) ) {
                console.error("ARG IS NOT OBJECT");
                return true;
            }
            
            var keys = Object.keys(src), builder = "";
            
            if ( keys.length === 0 ) return true; 
            try {
                keys.forEach(function(k) {
                    builder += src[k].trim();
                })
            }
            catch(e) {
            }
            
            console.log(builder)
            return this.isEmpty(builder);
        },
        /**
         * MAKE DEEP COPY OF OBJECT
         * @function deepcopy
         * @param {variable} src :: 복사할 변수  
         * @return {object} 
         */
        deepcopy : function(src) {
            
            if ( $N.isEmpty(src) && !$N.isArray(src) ) return null;
            
            var clone = $N.isObject(src) ? {} : $N.isArray(src) ? [] : '';
            if ( $N.isObject(src) ) {
                for (var key in src) {
                    if (typeof src[key] == "object" && src[key] != null) {
                        clone[key] = $N.deepcopy(src[key]);
                    } 
                    else {
                        clone[key] = src[key];
                    }
                }
            }
            else if ( $N.isArray(src) ) {
                src.forEach((itm) => {
                    clone.push($N.deepcopy(itm));
                })
            }
            else {
                clone = src;
            }
        
            return clone;
        },
        /**
         * POP SPECIFIC ARRAY ELEMENT WITH STRING
         * @function comparePop
         * @param {array} arr :: 대상 배열  
         * @param {object} tgt :: 삭제할 대상  
         * @return {array} 
         */
        comparePop : function(arr, tgt) {
            if ( !this.isArray(arr) ) throw 'PARAM1 IS NOT ARRAY';
            if ( this.isEmpty(tgt) ) return arr;

            var tgtIdx = arr.indexOf(tgt);

            if ( tgtIdx === -1 ) return arr;
            
            arr.splice(tgtIdx, 1);
            
            return arr; 
        },
        /**
         * Convert to json object from given form element
         * @function formToJson, formToObj
         * @param {jqueryEl} $formEl :: 대상 jquery element
         , removeDash : {String || Array}
         , exclude : {String || Array}
         * @return {JSON Object}
         */
        formToObj: function ($formEl) {
            return this.formToJson($formEl, {})
        },
        formToJson: function($formEl, options) {

            if ( $N.isHtml($formEl) ) {
                $formEl = $($formEl);
            }
            else if ( $N.isString($formEl) ) {
                if ( $formEl.indexOf("#") !== -1 ) {
                    $formEl = $($formEl);
                }
                else {
                    $formEl = $("#"+$formEl);
                }
            }
            if ( $N.isJqueryObj($formEl) ) {
                var arrays = $("select, input, textarea", $formEl).serializeArray();
                var jsonz = {};
    
                $.each(arrays, function() {
                    if (jsonz[this.name]) {
                        if (!jsonz[this.name].push) {
                            jsonz[this.name] = [jsonz[this.name]];
                        }
                        jsonz[this.name].push(this.value || '');
                    } else {
                        jsonz[this.name] = this.value || '';
                    }
                });
                
                if ( options?.isStringify ) {
                    return JSON.stringify(jsonz);
                }
                if ( options?.removeDash ) {
                    
                    if ( $N.isString(options.removeDash) ) options.removeDash = options.removeDash.split(",");
                    
                    options.removeDash.forEach(function(target) {
                        jsonz[target] = jsonz[target]?.replaceAll("-", "");
                    })
                }
                if ( options?.exclude ) {
                    
                    if ( $N.isString(options.exclude) ) options.exclude= options.exclude.split(",");
                    
                    options.exclude.forEach(function(target) {
                        delete jsonz[target];
                    })
                }
                
                return jsonz;
            }
                
        },
        /** 
         * DESCRIBE JSON INTO HTML
         * @function describe
         * @param {JSON} json
         * @param {selector} target
         * @eg -> $N.describe({vocSeq : 1234, vocCd : 1}, "dataForm")
         */
        describe : function(json, target, setRaw) {
            
            if ( $N.isEmpty(json) || $N.isEmpty(target) ) return false;
            if ( $N.isString(json)) json =JSON.parse(json);
            if ( $N.isEmpty(setRaw) ) setRaw = true;
            
            var wrap;
            
            if ( $N.isString(target) ) 
                wrap = document.querySelectorAll("[id='"+ target +"'], [name='"+ target +"']");
            else if ( $N.isJqueryObj(target) ) 
                wrap = target.toArray();
            else if ( $N.isHtml(target) ) 
                wrap = target;
            else if ( $N.isNode(target) ) 
                wrap = target;
                
            try {
                wrap = [...wrap];
            }
            catch (e) {
                wrap = [wrap];
            }
            
            if ( $N.isEmpty(wrap) ) throw 'not available target';
            
            var keys = Object.keys(json);

            keys.forEach(function(k) {
                try {
                    wrap.forEach(function(w) {
                        
                        if ( setRaw ) w.setAttribute("data-raw", JSON.stringify(json));
                        
                        var nodes = [w, ...w.querySelectorAll("[id='"+ k +"'], [name='"+ k +"']")].filter(el => el.matches("[id='"+ k +"'], [name='"+ k +"']"));
                        
                        nodes.forEach(function(n) {

                            if ( $N.isString(json[k]) || $N.isNumber(json[k]) ) {
                                var nodeName = n.nodeName.toLowerCase();
                                
                                if ( nodeName === 'input' || nodeName === 'select' || nodeName === 'textarea' ) {
                                    n.value = json[k];
                                }
                                else {
                                    if ( $N.isString(json[k]) ) 
                                        json[k] = json[k].replaceAll("\n", "<br/>");
                                        
                                    n.innerHTML = json[k];
                                    n.title = json[k];
                                }
                            }
                            
                        })
                    })  
                }
                catch(e) { 
                }
            })
            
        },
        /** 
         * SET PERIOD BETWEEN TWO DATEPCIKERS
         * @function setPeriod
         * @param {String} sd_id :: 검색 시작일 input form id
         * @param {String} ed_id :: 검색 종료일 input form id
         * @param {String} terms :: 기간-일D, 주W, 월M, SOM 해당월의 시작일,SOY 해당 년도의 시작일 
         * @param {String, Integer} quantity :: 기간(숫자) 
         * @eg -> 최근 3주를 검색기간으로 설정할 경우 
                  $N.setPeriod("startDt", "endDt", 3, "W")
         */
        setPeriod: function(sd_id, ed_id, terms, quantity){

            quantity = quantity || 1
            var isExt = false;
            
            if ( $N.isNotEmpty(Ext.getCmp('__'+sd_id)) ) isExt = true;
            
            var endDd = moment();
            var startDd = moment();
            
            if ( terms === 'SOW') {
                startDd = startDd.startOf('week');
                endDd = endDd.endOf('week');
            }
            else if ( terms === 'SOM') {
                startDd = startDd.startOf('month');
                endDd = endDd.endOf('month');
            }
            else if ( terms === 'SOY') {
                startDd = startDd.startOf('year');
                endDd = endDd.endOf('year');
            }
            else if (terms != 'D') {
                startDd = moment().subtract(quantity, terms);
            }
            
            if ( isExt ) {
                Ext.getCmp('__'+sd_id).setValue(startDd.format('YYYY-MM-DD'));
                Ext.getCmp('__'+ed_id).setValue(endDd.format('YYYY-MM-DD'));
            }
            else {
                $("#"+sd_id).val(startDd.format('YYYY-MM-DD'));
                $("#"+ed_id).val(endDd.format('YYYY-MM-DD'));
            }
        },
        /** 
         * MAKE HTML SELECT TAG WITH AJAX RESULT
         * @function selectWithAjax
         * @param {object} param :: {url : "JR_...", attr: {}, appendTo: "#id" }
         * @return {HTMLElement}  
         */
        selectWithAjax: function(param) {
            
            if ( $N.isEmpty(param) ) throw 'PARAMETER IS EMPTY';
            if ( $N.isEmpty(param.url) ) throw 'URL IS EMPTY';
            if ( !$N.isObject(param.attr) ) throw 'ATTRIBUTE IS NOT OBJECT';
            
            var attr = param.attr
              , url = param.url
              , appendTo = param.appendTo
              , onchange = param.onchange;
            
            attr.class = attr.class || 'smf-select';
            
            var childArr = [{tagName: 'option', value : '', label: '-- 선택하세요 --' }];
            
            // RESPONSE JSON MUST BE {key: "key", value: "value"} pattern
            $.get(url, function(data) {
                data.forEach(function(optObj) {
                    childArr.push({tagName : 'option', value: optObj.VALUE, label: optObj.KEY});
                })
                
                $.extend(attr, {tagName : 'select', children: childArr})
                
                var selectTag = $N.elCreator(attr);
                
                if ( $N.isNotEmpty(onchange) ) {
                    selectTag.onchange = onchange;
                }
                
                if ( $N.isNotEmpty(appendTo) ) {
                    document.querySelector(appendTo).appendChild(selectTag);
                } 
                
                return selectTag;
            })
            
        },
        
        /** 
         * CHECK {src} CONTAINS {val} 
         * @function contains
         * @param {object} source
         * @param {object} target
         * @return {Boolean}  
         */
        contains : function(src, val) {
            
            if ( $N.isString(src) || $N.isArray(src) ) {
                return src.indexOf(val) !== -1;
            }
            return false;
        },
        /** 
         * PARSE JSON STRING 
         * @function contains
         * @param {object} src
         * @return {Boolean}  
         */
        JsonParser : function(src) {
                
            if ( $N.isString(src) ) {
                try {
                    src = JSON.parse(src);
                }
                catch(e) { }
            }
            if ( $N.isObject(src) ) {
                Object.keys(src).forEach((k) => {
                    try {
                        src[k] = JSON.parse(src[k]);
                    }
                    catch(e) { }
                });
            }
            if ( $N.isArray(src) ) {
                src.forEach((item) => $N.JsonParser(item))
            }
            return src;
            
        },
        observeDOM : function( obj, callback ) {
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
            if( !obj || obj.nodeType !== 1 ) return; 
            
            if( MutationObserver ){
                // define a new observer
                var mutationObserver = new MutationObserver(callback)
            
                // have the observer observe foo for changes in children
                mutationObserver.observe( obj, { childList:true, subtree:true })
                return mutationObserver
            }
            
            // browser support fallback
            else if( window.addEventListener ){
                obj.addEventListener('DOMNodeInserted', callback, false)
                obj.addEventListener('DOMNodeRemoved', callback, false)
            }
        },

        regexOnlyDigits : function(src) {

            try {
                const regex = /[^0-9]/g;
                src = src.replace(regex, "");
            }
            catch (e) {}

            return src;
        }
    }
})();


