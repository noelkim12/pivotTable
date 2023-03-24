(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'nlib'], function ($N) {
            return factory($N, window, document);
        });
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                // CommonJS environments without a window global must pass a
                // root. This will give an error otherwise
                root = window;
            }

            if (!$) {
                $ = typeof window !== 'undefined' ? // jQuery's factory checks for a global window
                    require('jquery') :
                    require('jquery')(root);
            }
            if (!$N) {
                $N = typeof window !== 'undefined' ? // jQuery's factory checks for a global window
                    require('nlib') :
                    require('nlib')(root);
            }

            if (!$.fn.dataTable) {
                require('datatables.net')(root, $);
            }


            return factory($, root, root.document);
        };
    } else {
        // Browser
        factory(jQuery, window, document);
    }
}(function ($, window, document, undefined) {
    'use strict';
    var DataTable = $.fn.dataTable;
    var defaultOptions = {
        id : "",
        columns : [],
        data : [],
        responsive: true,
        colReorder: true,
        paging : false,
        searching : false,
        module : null
    };

    const CONF_STORE = {
        DROP_HOVER_TGT : "ui-droppable-hover",
        DROP_HOVER_CLS : "bg-clip-border p-6 bg-violet-600 border-4 border-violet-300 border-dashed"
    };
    window.nStorage = { };

    $N.pivot = {
        options : {},
        /**
         *
         * @param {object} options
         * @returns {$N.pivot} $N.pivot
         */
        api : (options) => {
            var current = $N.pivot;
            current.options = options;
            return current;
        },
        /**
         * initializing pivot table
         * @param {Object} userOptions
         * @requires options.id,options.renderTo
         * @return {$N.pivot} pivot object
         */
        init : (userOptions) => {

            if ( !$N.isObject(userOptions) ) throw "INVALID PARAMETER";

            // REQUIRED
            let {id, renderTo} = userOptions;

            if ( $N.isEmpty(id) || $N.isEmpty(renderTo) ) {
                console.error(`REQUIRED ATTRIBUTE NOT FOUND :: ${ $N.isEmpty(id) ? 'id' : 'renderTo'}`)
                return;
            }
            var pivot = $N.pivot.api($.extend(true, defaultOptions, userOptions));
            nStorage[pivot.options.id] = pivot;

            pivot.setColumns.call(pivot, pivot.options.columns);
            pivot.setData.call(pivot, pivot.options.data);
            pivot.drawTable();

            return pivot;
        },
        /**
         * @param {object|array} colObj - column object or  column array
         * @param {string|object} id - pivotTable ID or pivotTable Object
         */
        addColumn : function (colObj, id) {
            let columns = $N.isObject(colObj) ? [colObj] : colObj;
            $N.pivot.setColumns([...this.options.columns, ...columns]);
            $N.pivot.drawTable();
        },
        /**
         * set columns
         * @param {array} colArr
         */
        setColumns : function (colArr) {
            colArr.forEach((_i) => {
                Object.keys(_i).forEach((k) => {
                    if ( k.toLowerCase() === 'title' ) _i['sTitle'] = _i[k];
                    if ( k.toLowerCase() === 'data' ) _i['mData'] = _i[k];
                })
            })
            this.options.columns = colArr;
        },
        /**
         * set data
         * @param dataArr
         */
        setData : function (dataArr) {
            this.options.data = dataArr;
        },
        /**
         * draw table into target
         */
        drawTable : function () {

            this.options?.module?.destroy();
            $("#"+this.options.renderTo).empty();

            let tableEl = $N.elCreator({
                "id" : this.options.id,
                "tagName": "TABLE",
                "class": "stripe hover",
                "style": "width:100%; padding-top: 1em;  padding-bottom: 1em; border-collapse: collapse"
            });

            $("#"+this.options.renderTo).append(tableEl);
            this.options.module = $("#"+this.options.id).DataTable(this.options);

            // APPLY DROPPABLE ON PIVOT TABLE HEADER
            $(this.options?.module.table().header()).droppable({
                accept : ".draggable",
                classes : {
                    [`${CONF_STORE.DROP_HOVER_TGT}`] : CONF_STORE.DROP_HOVER_CLS
                },
                drop: function( event, ui ) {
                    console.log(event)
                    console.log(ui)
                }
            })
        },
        /**
         * enable draggable on selector
         * @param selector
         */
        enableDraggable : function (selector) {
            $(selector).draggable({revert : true});
        },
        /**
         *
         * @param {event} _event
         * @param {}
         */
        onDropOnHeader : function (_event, ui) {

        }
    }

}));
