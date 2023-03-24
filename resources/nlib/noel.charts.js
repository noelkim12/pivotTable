
function js_toggleWideView(el) {
    $("body > div.ct-container, div.sr-container, .sr-left-area, .sr-main-area").toggleClass("stat-mode");

    var hasClass =  $("body > div.ct-container, div.sr-container, .sr-left-area, .sr-main-area").hasClass("stat-mode");
    if ( el ) {
        [...el.childNodes].last().textContent = hasClass ? ' 축소' : ' 확대';
        el.querySelector("span").classList.remove('glyphicon-plus', 'glyphicon-minus')
        el.querySelector("span").classList.add(hasClass ? 'glyphicon-minus' : 'glyphicon-plus')
    }

    if ( !Highcharts ) return;

    setTimeout(() => {
        Highcharts.charts.forEach((c) => c?.reflow() );
    }, 1000)
}

(function($) {

    Highcharts.getOptions().colors.push("#1d1da7");

    $N.observeDOM(document.body.querySelector(".sr-main-area"), function(m) {
       m.forEach(record => {
           [...record.addedNodes].forEach(node => {
               if ( $N.contains(node.id, 'highcharts-data-table-') ) {
                    node.classList.add('tbl-list');
                    node.classList.add('bg-white');
                    node.classList.add('b-shadow');
                    node.querySelector("caption").classList.add('bg-white', 'b-shadow', 'caption-title');
                    node.querySelectorAll(".highcharts-number")?.forEach((td) => {
                        td.textContent = $.SM_NUM_COMMA(td.textContent);
                    })
               }
           })
       })
    });
    $N.chart = {
        build : function(div, chartsObj, chartsAttr, rawData, loopCnt) {
            if ( loopCnt === 0 ) chartsAttr = [];
            let chartId = $(div).attr("id")
              , dataSet = $(div).data()
              , colorIdx = dataSet.colorIdx || 2
              , palette = $N.chart.attr.palette;

            let paletteIdx = loopCnt || 0;
                paletteIdx = palette.length-1 < paletteIdx ? Math.floor(Math.random()*10) : paletteIdx;

            palette = palette[dataSet.paletteIdx || paletteIdx];

            $.ajax({
                url : "/bo/fm/voc/stat/common/JR_statList.do",
                data : {
                    mapperNm : dataSet.mapper || chartId,
                    jsonParam : JSON.stringify( $.extend(true, { isDrilldown: dataSet.drilldown }, eval(dataSet?.param), $N.formToJson(dataSet?.form, {removeDash : ['SD', 'ED']})) )
                },
                success: function(data, resp) {

                    let statData = $N.JsonParser(data);
                    let chartAttr = $.extend(true, $N.deepcopy($N.chart.attr[dataSet.type]), $N.chart.attr.plotOverChart);
                    if ( $N.isEmpty(chartAttr) ) chartAttr = $.extend(true, $N.deepcopy($N.chart.attr.column), { chart : { type : dataSet.type}} )

                    rawData[chartId] = statData;
                    chartAttr.title.text = $N.isNotEmpty(dataSet.title) ? "〈"+dataSet.title+"〉" : '';

                    try {
                        if ( $N.isEmpty(statData)
                               || ($N.isArray(statData) && $N.isEmpty(data[0]))
                               || ($N.isEmpty(statData[0].series1))
                               || ($N.isArray(statData[0].series1) && $N.isEmpty(statData[0].series1[0])
                                                                        || $N.contains(statData[0].series1[0], 'null' )
                                                                        || $N.isEmpty(statData[0].series1[0]?.DATA)  )  ) {
                            chartAttr.chart.renderTo = chartId;
                            chartsObj[chartId] = new Highcharts.Chart(chartAttr);
                            return false;
                        }
                    }
                    catch(e) {
                        chartAttr.chart.renderTo = chartId;
                        chartsObj[chartId] = new Highcharts.Chart(chartAttr);
                        return false;
                    }

                    if ( $N.isEmpty(dataSet.noExporting) ) $.extend(chartAttr, $N.chart.attr.exportOptions);
                    if ( dataSet.noExporting ) chartAttr.exporting.enabled = !dataSet.noExporting;
                    if ( dataSet.backgroundColor ) chartAttr.chart.backgroundColor = dataSet.backgroundColor;
                    if ( dataSet.resize ) chartAttr = $.extend(true, chartAttr, $N.chart.attr.resize);
                    if ( dataSet.chartMargin ) chartAttr.chart.margin = eval(dataSet.chartMargin);

                    if ( dataSet.sum ) $N.chart.addSum(Object.assign(statData, { options : dataSet}));
                    else if ( dataSet.avg ) $N.chart.addAvg(Object.assign(statData, { options : dataSet}));
                    else if ( dataSet.avgsum ) $N.chart.addAvgSum(Object.assign(statData, { options : dataSet}));
                    if ( dataSet.sort ) $N.chart.sort(statData, dataSet.sortKey || 'X');

                    chartAttr.legend.enabled = dataSet.legend || false;
                    if ( dataSet.subtitle ) chartAttr = $.extend(true, chartAttr, { subtitle : { text : dataSet.subtitle, align: 'right' }})

                    // category options
                    if ( dataSet.drilldown ) chartAttr = $.extend(true, chartAttr, $N.chart.attr.drilldownOptions);
                    else chartAttr.xAxis.categories = statData[0].nmz;

                    chartAttr.xAxis.categories = $N.JsonParser(chartAttr.xAxis.categories);

                    if ( dataSet.grouped ) {
                        $.extend(true, chartAttr, $N.chart.attr.groupedOptions)
                        chartAttr.chart.height = '1200px';
                    }

                    // data label option
                    chartAttr.plotOptions.series.dataLabels.y = dataSet.labely || -20
                    // set yAxis
                    if ( dataSet.yaxis )  chartAttr.yAxis = eval(dataSet.yaxis);
                    // set yAxis
                    if ( dataSet.plotOptions )  chartAttr.plotOptions = $.extend(true, chartAttr.plotOptions, $N.JsonParser(dataSet.plotOptions));


                    if ( dataSet.stacking ) $.extend(true, chartAttr, $N.chart.attr.columnStacking);
                    if ( dataSet.floatingYaxis ) $.extend(true, chartAttr, $N.chart.attr.floatingYaxis);
                    if ( dataSet.zoom ) chartAttr.chart.zoomType = dataSet.zoom;
                    if ( dataSet.manualXaxisHeight) $.extend(true, chartAttr, $N.chart.attr.manualXaxisHeight(dataSet.manualXaxisHeight));
                    if ( dataSet.xaxisTooltip ) $.extend(true, chartAttr, $N.chart.attr.xaxisTooltip);
                    if ( dataSet.tooltipFormat ) chartAttr.tooltip.formatter = $N.chart.attr.tooltipFormat[dataSet.tooltipFormat];

                    // set chart data series
                    $N.chart.chartDataSetter(statData, chartAttr, dataSet, palette, colorIdx);

                    if ( dataSet.changeRate ) $N.chart.addChangeRate(statData, chartAttr, dataSet, palette, colorIdx);

                    // set export options
                    if ( chartAttr.exporting ) {
                        chartAttr.exporting.width  = document.querySelector("#"+chartId)?.offsetWidth;
                        chartAttr.exporting.height = document.querySelector("#"+chartId)?.offsetHeight;
                    }

                    chartAttr.chart.renderTo = chartId;
                    chartsObj[chartId] = new Highcharts.Chart(chartAttr);

                    chartsAttr.push(chartAttr);

                    if ( dataSet.dynamicHeight ) $N.chart.dynamicHeight(div, chartId, chartAttr, chartsObj)
                    if ( dataSet.callback ) {
                        if ( $N.isString(dataSet.callback) ) dataSet.callback = dataSet.callback.split(",");
                        dataSet.callback.forEach((callback) => eval(callback).call(dataSet, div, chartAttr, chartsObj[chartId]) )
                    }
                }
            })
        },
        table  : function(div, rawData) {
            let chartId = $(div).attr("id")
              , dataSet = $(div).data();

            $.ajax({
                url : "/bo/fm/voc/stat/common/JR_statList.do",
                data : {
                    mapperNm : chartId,
                    jsonParam : JSON.stringify( $.extend(true, { HL_PS_DIV_CD : "20", isDrilldown: dataSet.drilldown }, eval(dataSet?.param), $N.formToJson(dataSet?.form, {removeDash : ['SD', 'ED']}) ) )
                },
                success: function(data, resp) {
                    let statData = $N.JsonParser(data);
                    $("tbody", "#"+ dataSet.target).empty();
                    $("thead", "#"+ dataSet.target).empty();

                    if ( $N.isEmpty(statData[0].series) ) {
                        $N.chart.noData(chartId);
                        return false;
                    }

                    rawData[chartId] = statData;

                    if ( $N.isNotEmpty(dataSet.sortKey) ) $N.chart.sort(statData, dataSet.sortkey, dataSet.sortorder);

                    let childAttr, headerAttr;
                    if ( $N.isNotEmpty(dataSet.attr) ) childAttr = eval(dataSet.attr);
                    if ( $N.isNotEmpty(statData[0].attr) ) childAttr = $N.deepcopy(statData[0].attr);

                    if ( $N.isNotEmpty(dataSet.header) ) headerAttr = eval(dataSet.header);
                    if ( $N.isNotEmpty(statData[0].header) ) headerAttr = $N.deepcopy(statData[0].header);
                    if ( $N.isEmpty(headerAttr) ) headerAttr = $N.deepcopy(childAttr);

                    if ( $N.isNotEmpty(headerAttr) ) {
                        headerAttr = $N.isObject(headerAttr[0]) ? [$N.deepcopy(headerAttr)] : headerAttr;
                        headerAttr.forEach((attr) => {

                            let trObj = Object.assign($N.tagObj("tr"), {children : []});

                            if ( $N.isArray(attr) ) {
                                attr.forEach((aItem) => {
                                    trObj.children.push(Object.assign($N.tagObj("th"), aItem));
                                })
                            }

                            $("thead", "#"+ dataSet.target).append($N.elCreator(trObj))
                        })
                    }

                    if ( $N.isNotEmpty(statData[0].cdz) ) $N.describe(statData[0]?.cdz, div)

                    let trs = [], rollupArr = [];

                    let tds = childAttr?.map((attr) => {
                        return $.extend(true, $N.tagObj("td"), attr);
                    })

                    statData?.forEach((s) => {
                        s.series?.forEach((item, sIdx) => {

                            if ( $N.isString(item?.DATA) )
                                item.DATA = $N.JsonParser(item.DATA);
                            if ( $N.isEmpty(item?.DATA[0]?.X_NM) ) {
                                 $N.chart.tableDataSetter(item, s.series, trs, tds);
                            }
                            else {
                                item.DATA.forEach((d) => {
                                    $N.chart.tableDataSetter(d, item, trs, tds);
                                })
                            }
                            if ( dataSet.rollup ) {
                                $N.chart.rollup(dataSet, item, tds, rollupArr, trs, '소계');
                            }
                        })
                    })
                    if ( dataSet.rollup ) {
                        $N.chart.rollup(dataSet, rollupArr, tds, rollupArr, trs, '합계', '#f5deb3', true);
                    }
                    $N.chart.formatter(trs);

                    $N.chart.rowAppender(trs, dataSet);

                    if ( $N.isNotEmpty(dataSet.rowspan) ) $N.chart.rowspaner(dataSet.target, dataSet.rowspan, trs.length);

                    if ( dataSet.callback ) {

                        if ( $N.isString(dataSet.callback) ) dataSet.callback = dataSet.callback.split(",");

                        dataSet.callback.forEach((callback) => eval(callback).call(dataSet) )
                    }
                }
            })
        },
        chartDataSetter : function(statData, chartAttr, dataSet, palette, colorIdx) {

            statData.forEach((s) => {
                // set series
                let _series = [];
                let maxIdx = Math.max(...s.series1.map((item) => item.DATA.length))
                s?.series1.forEach((item, i) => {
                    colorIdx = colorIdx > palette.length ? 0 : colorIdx;
                    var isLast = s?.series1.length === i+1;
                    let _data = {
                        name : item.X_NM || item.X,
                        type : item?.TYPE,
                        yAxis : ( item?.TYPE && dataSet.yaxis ? 1 : 0 ),
                        data : item.DATA.map((d, idx) => ({
                                name : d.X_NM,
                                x: statData[0].cdz.indexOf(d.X) > maxIdx ? maxIdx-1 : statData[0].cdz.indexOf(d.X),
                                y: d.CNT,
                                color : d?.COLOR || '',
                                drilldown : d.X !== 'SUM' ? d.DRILLDOWN : null
                            })
                        ),
                        color : dataSet.diffColor && 2 === colorIdx++ ? "#9E9E9E" : palette[colorIdx++]
                    }
                    if ( dataSet.highlightLast && isLast) {
                        _data.color = palette[7];
                    }

                    _series.push(_data)
                })
                chartAttr.series = _series || [];

                // set drilldown data
                if ( dataSet.drilldown ) {
                    for ( k in s ) {
                        if ( $N.contains(k, 'series') && !$N.contains(k, 1) ) {
                            let series = s[k], level = $N.contains(k, 2) ? 2 : 3, drillArr = [];
                            series.forEach((item) => {
                                let _data = {
                                    name : item.X_NM,
                                    id : item.ID || item.X2 + '_' + item.X,
                                    data : item.DATA.map((d, idx) => ({
                                            name : d.X_NM,
                                            y : d.CNT,
                                            lang : { noData : '데이터가 없습니다.' },
                                            drilldown : d.DRILLDOWN
                                        })
                                    )
                                }

                                if ( level === 3 ) {
                                    _data.data.forEach(function(item) {
                                        delete item.drilldown
                                    })
                                }
                                drillArr.push(_data);
                            })

                            chartAttr.drilldown.series.push(...drillArr);
                        }
                    }
                }
                // END OF set drilldown data
            })
        },
        addChangeRate : function(statData, chartAttr, dataSet, palette, colorIdx) {

            function sorter(a,b) {
                var sortKey = dataSet.sortKey || 'x';
                var order = dataSet.sortOrder || '';

                if (a[sortKey] < b[sortKey]) {
                    return order === 'desc' ? 1 : -1;
                }
                if (a[sortKey] > b[sortKey]) {
                    return order === 'desc' ? -1 : 1;
                }
                return 0;
            }

            if ( chartAttr.series.length < 2 ) return;

            var rateSeries = {
                name : '증감율',
                type : 'line',
                yAxis : 1,
                data : [],
                color : palette[colorIdx++]
            };

            var first = chartAttr.series.first(), last = chartAttr.series.last();

            first.data.forEach((_f)=> {

                var _l = last.data.filter((__l) => { return _f.x === __l.x });

                if ( $N.isEmpty(_l) ) return;

                _l = _l[0];

                var changeRate = Math.floor((_l.y-_f.y)/_f.y*100);

                rateSeries.data.push({
                    name : _f.name,
                    x : _f.x,
                    y : changeRate,
                    drilldown : null
                })
            })

            if ( dataSet.sort ) rateSeries.data.sort((a, b)=> sorter(a, b))

            chartAttr.series.push(rateSeries);
        },
        tableDataSetter : function(inner, outer, trs, tds) {
            let trEl = $N.elCreator($.extend(true, $N.tagObj("tr"), {children : $N.deepcopy(tds)}));

            if ( $N.isNotEmpty(inner.DATA) ) $.extend(true, inner, ...inner.DATA);
            $.extend(true, inner, { MAP_NM : outer?.MAP_NM })

            $.extend(true, trEl.dataset, {raw: JSON.stringify(inner)})

            // set data text
            $N.describe(inner, trEl, false);

            trs.push(trEl);
        },
        rollup : function(dataSet, item, tds, rollupArr, trs, nm, color, isLast) {

            color = color || '#faebd7';

            let rollupTd = $N.deepcopy(tds).map((td)=> $.extend(true, td, {'style' : 'background: '+ color +' !important;'}))
            let trEl = $N.elCreator($.extend(true, $N.tagObj("tr"), {children : rollupTd}));

            if ( $N.isNotEmpty(dataSet.rowspan) ) {
                let idxArr = $N.isNumber(dataSet.rowspan) ? [dataSet.rowspan] : dataSet.rowspan;
                for ( var i = 0; i < idxArr.length; i++ ) {
                    trEl.childNodes[i].classList.add("hide");
                    trEl.childNodes[i].id = '';
                }
                trEl.childNodes[Math.max(...idxArr)+1].setAttribute("colspan", ++idxArr.length);
            }

            let reducer = $N.isNotEmpty(item.DATA) ? item.DATA : item;
            if ( $N.isString(reducer) ) reducer = $N.JsonParser(reducer);

            let rollup = reducer.reduce((a, b) => {
                if ( $N.isObject(a) ) {
                    var keys = Object.keys(a)
                    var result = {};
                    keys.forEach((_k) => {
                        if ( $N.isNumber(a[_k]) ) {
                            var temp = {}
                            temp[_k] = a[_k] + b[_k]
                            $.extend(true, result, temp)
                        }
                    })
                    return result;
                }
            })

            trEl.classList.add('sum');
            if ( isLast ) trEl.classList.add('total');

            $N.describe($.extend(true, rollup, {X_NM : nm}), trEl);
            rollupArr.push(rollup);
            trs.push(trEl);
        },
        rowAppender: function(trs, dataSet) {
            trs.forEach((tr) => {
                $("tbody", "#"+ dataSet.target).append(tr)
            })
        },
        formatter : function(trs) {
            trs.forEach((tr) => {
                [...$("td.data", tr)].forEach((td) => {
                    let ognl = $(td).text();
                    if ( isNaN(ognl) ) return;
                    ognl = parseFloat(ognl) % 1 === 0 ? ognl : parseFloat(ognl).toFixed(2);
                    $(td).text($.SM_NUM_COMMA(ognl));
                })

            })
        },
        rowspaner : function(targetId, idxArr, trLen) {

            function setRowspan(curTr, nextTr, idx, spanSize) {

                spanSize = $N.isEmpty(spanSize) ? 1 : spanSize;
                nextTr = $N.isEmpty(nextTr) ? $(curTr).next() : nextTr;

                if ( nextTr.length === 0 ) return false;

                let curTd, nextTd;
                if ( curTr.next().length === 1 ) {
                    curTd = $(curTr).find("td").eq(idx);
                    nextTd = $(nextTr).find("td").eq(idx);
                }
                if ( curTd.text() === nextTd.text() ) {
                    spanSize++;
                    curTd.attr("rowspan", spanSize);
                    nextTr = nextTr.next();
                    nextTd.addClass("hide");
                }
                else {
                    spanSize = 1;
                    curTr = nextTr;
                    nextTr = null;
                }
                setRowspan(curTr, nextTr, idx, spanSize)
            }

            let curTr = $("#"+targetId+" tbody > tr").eq(0);

            if ( $N.isNumber(idxArr) ) idxArr = [idxArr];

            idxArr.sort().reverse()

            let trs = [...document.querySelectorAll("#"+targetId+" tbody tr")];

            let interval = setInterval(() => {
                if ( trs.length === trLen ) {
                    idxArr.forEach((cIdx) => {
                        setRowspan(curTr, null, cIdx, null);
                    })
                    clearInterval(interval)
                }
            }, 1000)
        },
        sort : function(statData, sortKey, order) {

            function sorter(a,b) {
                if (a[sortKey] < b[sortKey]) {
                    return order === 'desc' ? 1 : -1;
                }
                if (a[sortKey] > b[sortKey]) {
                    return order === 'desc' ? -1 : 1;
                }
                return 0;
            }
            statData.forEach(function(item) {
                for ( k in item ) {
                    if ( $N.contains(k, 'series') ) {
                        if ( $N.isArray(item[k]) ) {
                            item[k].forEach(function(d) {
                                d?.DATA?.sort((a, b) => sorter(a,b))
                            })
                            item[k].sort((a, b) => sorter(a, b));
                        }
                    }
                }
            })

            return statData;
        },
        addSum : function(statData) {

            function sumReducer(obj) {
                let sum = obj?.DATA?.reduce((a, b) => { return a += b?.CNT }, 0);
                obj?.DATA?.push({X: 'SUM', X_NM : '합계', CNT : parseFloat(sum.toFixed(1)), sortKey : 99})
            }

            statData.forEach(function(item) {
                Object.keys(item).forEach(k => {
                    if ( $N.contains(k, 'nmz') ) {
                        if ( statData.options.grouped )  {
                            if ( $N.isObject(item[k][0].categories[0]) ) item[k].push({ name : " ", categories : [{"name": "계", categories : ["합계"] }] });
                            else item[k].push({ name : "계", categories : ["합계"] });
                        }
                        else {
                            item[k].push('합계');
                        }
                    }
                    if ( $N.contains(k, 'cdz') ) item[k].push('SUM');
                    if ( $N.contains(k, 'series1') ) {
                        if ( $N.isArray(item[k]) ) {
                            item[k].forEach(function(d) {
                                sumReducer(d)
                            })
                        }
                        if ( $N.isObject(item[k]) ) {
                            sumReducer(item[k]);
                        }
                    }
                })
                for ( k in item ) {
                }
            })

            return statData;
        },
        addAvg : function(statData) {

            function avgReducer(obj) {
                let sum = obj?.DATA?.reduce((a, b) => { return a += b?.CNT }, 0);
                obj?.DATA?.push({X: 'AVG', X_NM : '평균', CNT : parseFloat((sum/obj?.DATA?.length).toFixed(1)), sortKey : 99})
            }

            statData.forEach(function(item) {
                for ( k in item ) {
                    if ( $N.contains(k, 'nmz') ) {
                        if ( statData.options.grouped )  item[k].push({ name : "-", categories : ["평균"] });
                        if ( !statData.options.grouped ) item[k].push('평균');
                    }
                    if ( $N.contains(k, 'cdz') ) item[k].push('AVG');
                    if ( $N.contains(k, 'series1') ) {
                        if ( $N.isArray(item[k]) ) {
                            item[k].forEach(function(d) {
                                avgReducer(d)
                            })
                        }
                        if ( $N.isObject(item[k]) ) {
                            avgReducer(item[k]);
                        }
                    }
                }
            })

            return statData;
        },
        addAvgSum : function(statData) {

            $N.chart.addSum(statData);

            statData.forEach(function(item) {
                for ( k in item ) {
                    if ( $N.contains(k, 'nmz') ) {
                        if ( statData.options.grouped )  item[k].modifyLast({ name : "-", categories : ["평균"] });
                        if ( !statData.options.grouped ) item[k].modifyLast('평균');
                    }
                    if ( $N.contains(k, 'cdz') ) item[k].modifyLast('SUM');
                    if ( $N.contains(k, 'series1') ) {
                        if ( $N.isArray(item[k]) ) {
                            let sumArr = item[k].filter((d) => !$N.contains(d.X, 'RATE'))
                                                .map((d) => d.DATA.last())

                            let rate = sumArr.reduce((a, b) => { return Math.round(((b.CNT-a.CNT)/a.CNT)*100) } );
                            item[k].last().DATA.last().CNT = rate;
                        }
                        if ( $N.isObject(item[k]) ) {
                        }
                    }

                }
            })
        },
        getRandomColor : function() {
            let colors = [];

            for (let i = 0; i < 20; i++) {
                let color = '#' + Math.floor(Math.random() * 16777215).toString(16);
                let str = color.substring(3, 4);

                colors.push(color.replace(str, '0'));
            }

            return colors;
        },
        noData: function(chartId) {
            $(".nodata","#"+chartId).remove();
            $("#"+chartId).append("<span class='nodata'>데이터가 없습니다.</span>");
        },
        dynamicHeight: function(div, chartId, chartAttr, chartsObj) {

            let height = chartAttr.series[0].data.length*30;

            $(div).css("height", "inherit");

            chartsObj[chartId].setSize(
                null,
                height < 400 ? 400 : height,
                true
            );
        },
        attr : {

            palette :[
                ["#E8F5E9", "#C8E6C9", "#A5D6A7", "#81C784", "#66BB6A", "#4CAF50", /*"#43A047", "#388E3C",*/ "#2E7D32", "#1B5E20", "#B9F6CA", "#69F0AE", "#00E676", "#00C853"], // 0 GREEN
                ["#E3F2FD", "#BBDEFB", "#90CAF9", "#64B5F6", "#42A5F5", "#2196F3", /*"#1E88E5", "#1976D2",*/ "#1565C0", "#0D47A1", "#82B1FF", "#448AFF", "#2979FF", "#2962FF"], // 1 BLUE
                ["#E8EAF6", "#C5CAE9", "#9FA8DA", "#7986CB", "#5C6BC0", "#3F51B5", /*"#3949AB", "#303F9F",*/ "#283593", "#1A237E", "#8C9EFF", "#536DFE", "#3D5AFE", "#304FFE"], // 2 INDIGO
                ["#E0F2F1", "#B2DFDB", "#80CBC4", "#4DB6AC", "#26A69A", "#009688", /*"#00897B", "#00796B",*/ "#00695C", "#004D40", "#A7FFEB", "#64FFDA", "#1DE9B6", "#00BFA5"], // 3 TEAL
                ["#F3E5F5", "#E1BEE7", "#CE93D8", "#BA68C8", "#AB47BC", "#9C27B0", /*"#8E24AA", "#7B1FA2",*/ "#6A1B9A", "#4A148C", "#EA80FC", "#E040FB", "#D500F9", "#AA00FF"], // 4 PURPLE
                ["#E1F5FE", "#B3E5FC", "#81D4FA", "#4FC3F7", "#29B6F6", "#03A9F4", /*"#039BE5", "#0288D1",*/ "#0277BD", "#01579B", "#80D8FF", "#40C4FF", "#00B0FF", "#0091EA"], // 5 LIGHT BLUE
                ["#E0F7FA", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA", "#00BCD4", /*"#00ACC1", "#0097A7",*/ "#00838F", "#006064", "#84FFFF", "#18FFFF", "#00E5FF", "#00B8D4"], // 6 CYAN
                ["#FFEBEE", "#FFCDD2", "#EF9A9A", "#E57373", "#EF5350", "#F44336", /*"#E53935", "#D32F2F",*/ "#C62828", "#B71C1C", "#FF8A80", "#FF5252", "#FF1744", "#D50000"], // 7 RED
                ["#FCE4EC", "#F8BBD0", "#F48FB1", "#F06292", "#EC407A", "#E91E63", /*"#D81B60", "#C2185B",*/ "#AD1457", "#880E4F", "#FF80AB", "#FF4081", "#F50057", "#C51162"], // 8 PINK
                ["#EDE7F6", "#D1C4E9", "#B39DDB", "#9575CD", "#7E57C2", "#673AB7", /*"#5E35B1", "#512DA8",*/ "#4527A0", "#311B92", "#B388FF", "#7C4DFF", "#651FFF", "#6200EA"], // 9 DEEP PURPLE
                ["#F1F8E9", "#DCEDC8", "#C5E1A5", "#AED581", "#9CCC65", "#8BC34A", /*"#7CB342", "#689F38",*/ "#558B2F", "#33691E", "#CCFF90", "#B2FF59", "#76FF03", "#64DD17"], // 10 LIGHT GREEN
                ["#F9FBE7", "#F0F4C3", "#E6EE9C", "#DCE775", "#D4E157", "#CDDC39", /*"#C0CA33", "#AFB42B",*/ "#9E9D24", "#827717", "#F4FF81", "#EEFF41", "#C6FF00", "#AEEA00"], // 11 LIME
                ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58", "#FFEB3B", /*"#FDD835", "#FBC02D",*/ "#F9A825", "#F57F17", "#FFFF8D", "#FFFF00", "#FFEA00", "#FFD600"], // 12 YELLOW
                ["#FFF8E1", "#FFECB3", "#FFE082", "#FFD54F", "#FFCA28", "#FFC107", /*"#FFB300", "#FFA000",*/ "#FF8F00", "#FF6F00", "#FFE57F", "#FFD740", "#FFC400", "#FFAB00"], // 13 AMBER
                ["#FFF3E0", "#FFE0B2", "#FFCC80", "#FFB74D", "#FFA726", "#FF9800", /*"#FB8C00", "#F57C00",*/ "#EF6C00", "#E65100", "#FFD180", "#FFAB40", "#FF9100", "#FF6D00"], // 14 ORANGE
                ["#FBE9E7", "#FFCCBC", "#FFAB91", "#FF8A65", "#FF7043", "#FF5722", /*"#F4511E", "#E64A19",*/ "#D84315", "#BF360C", "#FF9E80", "#FF6E40", "#FF3D00", "#DD2C00"], // 15 DEEP ORANGE
                ["#EFEBE9", "#D7CCC8", "#BCAAA4", "#A1887F", "#8D6E63", "#795548", /*"#6D4C41", "#5D4037",*/ "#4E342E", "#3E2723"], // 16 BROWN
                ["#FAFAFA", "#F5F5F5", "#EEEEEE", "#E0E0E0", "#BDBDBD", "#9E9E9E", /*"#757575", "#616161",*/ "#424242", "#212121"], // 17 GRAY
                ["#ECEFF1", "#CFD8DC", "#B0BEC5", "#90A4AE", "#78909C", "#607D8B", /*"#546E7A", "#455A64",*/ "#37474F", "#263238"], // 18 BLUE GRAY
                ["", "", "#C8E6C9", "#C8E6C9","#C8E6C9", "#C8E6C9", "#66BB6A", "#66BB6A", "#66BB6A", "#1B5E20", "#1B5E20", "#1B5E20", "#1a481d"], // 19 MANUAL GREEN COLOR SET
                ["", "", "#BBDEFB", "#BBDEFB","#BBDEFB", "#BBDEFB", "#42A5F5", "#42A5F5", "#42A5F5", "#0D47A1", "#0D47A1", "#0D47A1", "#448AFF"], // 20 MANUAL BLUE COLOR SET
                ["", "", "#C5CAE9", "#C5CAE9","#C5CAE9", "#C5CAE9", "#5C6BC0", "#5C6BC0", "#5C6BC0", "#1A237E", "#1A237E", "#1A237E", "#536DFE"], // 21 MANUAL INDIGO COLOR SET
                ["", "", "#B2DFDB", "#B2DFDB","#B2DFDB", "#B2DFDB", "#26A69A", "#26A69A", "#26A69A", "#004D40", "#004D40", "#004D40", "#27856F"], // 22 MANUAL TEAL COLOR SET
                ["", "", "#E1BEE7", "#E1BEE7","#E1BEE7", "#E1BEE7", "#AB47BC", "#AB47BC", "#AB47BC", "#4A148C", "#4A148C", "#4A148C", "#E040FB"], // 23 MANUAL PURPLE COLOR SET
            ],

            line : {
                chart: {
                        type: 'line',
                        style: {
                            fontFamily: 'Malgun Gothic,"맑은 고딕", Arial, sans-serif',
                        },
                        shadow: false,
                    },
                    title: {
                        text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    },
                },
                xAxis: {
                    type: 'category',
                    crosshair : true,
                },
                yAxis: {
                    title : '민원 건수'
                },
                series: [{
                    data: []
                }],
                credits: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        animation: true,
                        pointWidth: 20,
                        maxPointWidth: 50
                    }
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                legend: {
                    enabled: false,
                    style: {
                        fontFamily: 'Malgun Gothic,"맑은 고딕", Arial, sans-serif',
                    },
                },
                exporting: {
                    enabled : false
                },
                tooltip: {
                    formatter: function () {
                        return this?.points?.reduce(function (s, point) {
                            return s + '<br/>' + "●" + point.series.name + ': ' + point.y;
                        }, '<b>' + this.x + '</b>');
                    },
                    shared: true
                }
            },
            area : {
                chart: {
                    type: 'area',
                    style: {
                        fontFamily: 'Malgun Gothic,"맑은 고딕", Arial, sans-serif',
                    },
                    shadow: false,
                },
                title: {
                    text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    }
                },
                xAxis: {
                    type: 'category',
                    crosshair : true,
                },
                yAxis: {
                    title : '민원 건수'
                },
                series: [{
                    data: []
                }],
                credits: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        animation: false
                    }
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                legend: {
                    enabled: false,
                    style: {
                        fontFamily: 'Malgun Gothic,"맑은 고딕", Arial, sans-serif',
                    },
                },
                exporting: {
                    enabled : false
                },
                tooltip: {
                    formatter: function () {
                        return this.points.reduce(function (s, point) {
                            return s + '<br/>' + "●" + point.series.name + ': ' + point.y;
                        }, '<b>' + this.x + '</b>');
                    },
                    shared: true
                }
            },

            column : {
                chart: {
                    type: 'column',
                    style: {
                        fontFamily: 'Malgun Gothic,"맑은 고딕", Arial, sans-serif',
                    },
                    shadow: false,
                },
                title: {
                    text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    }
                },
                xAxis: {
                    type: 'category',
                    crosshair : true,
                },
                yAxis: {
                    title : '민원 건수'
                },
                series: [],
                legend: {
                    enabled: false
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                plotOptions: {
                    series: {
                        animation: true,
                        pointWidth: 20,
                        maxPointWidth: 50,
                    }
                },
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled : false
                },
                tooltip: {
                    formatter: function () {
                        let key = [...new Set(this.points.map((a) => {
                            return a.key
                        }) )][0]
                        key = $N.isObject(key) ? key.key : key;

                        let tooltipTxt = key + '<br/>';

                        this.points.forEach(function (point) {
                            tooltipTxt += "● " + point.series.name + ': ' + point.y+"<br/>";
                        })

                        return tooltipTxt;
                    },
                    shared: true
                }
            },

            bar : {
                chart: {
                    type: 'bar',
                    style: {
                        fontFamily: 'Malgun Gothic,"맑은 고딕", Arial, sans-serif',
                    },
                    shadow: false,
                },
                title: {
                    text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    }
                },
                xAxis: {
                    type: 'category',
                    crosshair : true,
                },
                yAxis: {
                    title : '민원 건수'
                },
                series: [],
                legend: {
                    enabled: false,
                    style: {
                        fontFamily: 'Malgun Gothic,"맑은 고딕", Arial, sans-serif',
                    },
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                plotOptions: {
                    series: {
                        animation: true,
                        pointWidth: 20,
                        maxPointWidth: 50
                    }
                },
                exporting: {
                    enabled : false
                },
                credits: {
                    enabled: false
                }
            },

            pie : {
                chart: {
                    type: 'pie',
                    plotBorderWidth: null,
                    shadow: false,
                    margin : [-10,-10,-10,-10]
                },
                title: {
                    text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    }
                },
                xAxis: {
                    type: 'category',
                    crosshair : true,
                },
                legend : {
                    align: 'right',
                    verticalAlign: 'top',
                    layout: 'vertical',
                    labelFormat: '{name} {percentage:.2f}%',
                    itemStyle: {
                        fontWeight:'bold',
                        fontSize: '18px'
                    }
                },
                series: [{
                    innerSize: '70%',
                    colorByPoint: true,
                    data: []
                }],
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        dataLabels: {
                            enabled: false,
                            allowOverlap: true,
                            overflow : "allow",
                            distance: -20,
                            format: "{point.percentage:.0f}%",
                            style: {
                                color: 'white',
                                textShadow: false
                            }
                        },
                        showInLegend: true,
                        innerSize : '70%',
                        size: '100%',
                    }
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                exporting: {
                    enabled : false
                },
                tooltip: {
                    shared: false,
                    outside: true,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    style: {
                        opacity: 1,
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                    formatter: function () {
                        let tooltipTxt = '<b>' + this.key + '</b><br/>';
                        tooltipTxt += $.SM_NUM_COMMA(this.y) + "건<br/>(" + this.percentage?.toFixed(2) + "%)"
                        return tooltipTxt;
                    },
                },
            },

            donut : {
                chart: {
                    type: 'pie',
                    plotBorderWidth: null,
                    shadow: false,
                    margin : [-10,-10,-10,-10]
                },
                title: {
                    text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    }
                },
                xAxis: {
                    type: 'category',
                    crosshair : true,
                },
                legend : {
                    labelFormat: '{name} {percentage:.2f}%',
                },
                series: [{
                    innerSize: '70%',
                    colorByPoint: true,
                    data: []
                }],
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        dataLabels: {
                            enabled: false,
                            allowOverlap: true,
                            overflow : "allow",
                            distance: -20,
                            format: "{point.percentage:.0f}%",
                            style: {
                                color: 'white',
                                textShadow: false
                            }
                        },
                        showInLegend: true,
                        innerSize : '70%',
                        size: '100%',
                    }
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                exporting: {
                    enabled : false
                },
                tooltip: {
                    shared: false,
                    outside: true,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    style: {
                        opacity: 1,
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                    formatter: function () {
                        let tooltipTxt = '<b>' + this.key + '</b><br/>';
                        tooltipTxt += $.SM_NUM_COMMA(this.y) + "건<br/>(" + this.percentage?.toFixed(2) + "%)"
                        return tooltipTxt;
                    },
                },
            },

            wordcloud : {
                chart: {
                    type: 'wordcloud',
                    marginRight  : 0,
                    marginLeft   : 0,
                    marginBottom : 0,
                    shadow: false,
                },
                title: {
                    text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    }
                },
                series: [{
                    spiral: 'rectangular',
                    rotation: {
                        from: 0,
                        to: 0
                    }
                }],
                credits: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        turboThreshold: 0
                    }
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                colors: $N.chart?.getRandomColor(),
                tooltip: {
                    useHTML: true,
                    formatter: function() {
                        return '<b>${this.key}:</b>${this.point.weight}'
                    }
                }
            },

            network : {
                chart: {
                    type: 'networkgraph',
                    plotBorderWidth: 1,
                    shadow: false,
                },
                title: {
                    text: '',
                    style : {
                        fontWeight : 600,
                        fontSize : 16,
                    }
                },
                plotOptions: {
                    networkgraph: {
                        keys: ['from', 'to'],
                        layoutAlgorithm: {
                            enableSimulation: false,
                            friction: -0.9
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                lang : {
                    noData : '데이터가 없습니다.'
                },
                series: [{
                    dataLabels: {
                        enabled : true,
                        linkFormat: ''
                    },
                    name: 'networkChart',
                }]
            },

            multilineTooltip : {
                headerFormat : '<span style="font-size:12px;font-weight:bold">{point.key}</span><br/>',
                pointFormat  : '<span style="fill:{point.color}" x="8" dy="15">●</span><span style="fill:{point.color}" x="8" dy="15">{point.series.name} : </span><span style="font-weight:bold" dx="0">{point.y}</span>'
            },

            tooltipFormat : {
                cnt : function () {
                    return '<b>' + this.key + '</b><br/>' + $.SM_NUM_COMMA(this.y) + '건<br/>(' + this.percentage?.toFixed(2) + '%)';
                },
                avg : function () {
                    return '<b>' + this.key + '</b><br/>' + this.y.toFixed(1) + '점';
                },
            },
            xaxisTooltip : function() {
                return {
                    xAxis : {
                        labels : {
                            events: {
                                mouseover: function(e) {
                                    const chart = this.chart,
                                    text = this.axis.userOptions.categories[this.pos];

                                chart.myLabel = chart.renderer.label(text, e.x, e.y, 'rectangle')
                                                              .css({ color: '#FFFFFF' })
                                                              .attr({ fill: 'rgba(0, 0, 0, 0.75)', padding: 8, r: 4, })
                                                              .add()
                                                              .toFront();
                                },
                                mouseout: function(e) {
                                    const chart = this.chart;
                                    if (chart.myLabel) {
                                        chart.myLabel.destroy();
                                    }
                                }
                            }
                        }
                    }
                }
            },

            manualXaxisHeight : function(size) {
                return {
                    xAxis : {
                        labels : {
                            style : {
                                height: size,
                                width : size,
                                wordBreak:'keep-all',
                                overflowX : "hidden",
                                textOverflow : 'ellipsis'
                            },
                            formatter: function () {
                                return '<div style="overflow-x: hidden; text-overflow:ellipsis; " title="'+ this.value+ '">' + this.value + '</div>';
                            }
                        }
                    }
                }
            },

            plotOverChart : {
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                            allowOverlap : true,
                            formatter: function() {
                                return $.SM_NUM_COMMA(this.y);
                            },
                            verticalAlign: 'top',
                            y: -20,
                        },
                    },
                },
            },

            plotHideZero : {
                plotOptions: {
                    series: {
                        dataLabels: {
                            formatter: function() {
                                return this.y > 0 ? $.SM_NUM_COMMA(this.y) : null;
                            },
                        },
                    },
                },
            },

            columnStacking : {
                plotOptions: {
                    column: {
                        stacking : 'normal',
                        dataLabels: {
                            enabled: true,
                            allowOverlap : false,
                            formatter: function() {
                                return this.y > 0 ? $.SM_NUM_COMMA(this.y) : null;
                            },
                            style: {
                                fontSize: 10,
                                color: 'white'
                            },
                            y: 5
                        },
                    },
                    line: {
                        dataLabels: {
                            enabled: true,
                            allowOverlap : false,
                            formatter: function() {
                                return this.y > 0 ? $.SM_NUM_COMMA(this.y) : null;
                            },
                            style: {
                                fontSize: 10,
                                color: 'black'
                            },
                            alignTo: 'plotEdges',
                            y :  -30,
                        },
                    },
                    series: {
                    },
                    pointPadding: 0
                },
                yAxis: {
                    endOnTick: true
                }
            },

            floatingYaxis : {
                plotOptions: {
                    column: {
                        dataLabels: {
                            enabled: true,
                            allowOverlap : true,
                            formatter: function() {
                                return this.y > 0 ? $.SM_NUM_COMMA(this.y) : null;
                            },
                            y: 5
                        },
                    },
                    line: {
                        dataLabels: {
                            enabled: true,
                            allowOverlap : false,
                            formatter: function() {
                                return this.y > 0 ? $.SM_NUM_COMMA(this.y) : null;
                            },
                            y :  -30,
                        },
                    },
                    pointPadding: 0
                },
                yAxis: {
                    endOnTick: true
                }
            },

            drilldownOptions : {
                drilldown: {
                    breadcrumbs: {
                        position: {
                            align: 'right'
                        }
                    },
                    series: []
                }
            },

            groupedOptions : {
                chart : {
                    marginRight: 10
                },
                xAxis : {
                    labels: {
                        x: -5,
                        useHTML : true,
                        groupedOptions: [{
                        }, {
                            rotation: 0,
                            align: 'center'

                        }],
                        rotation: 0
                    }
                },
                plotOptions : {
                    series : {
                        pointWidth: 10
                    }
                }
            },

            exportOptions : {
                exporting: {
                    enabled: true,
                    scale : 2,
                    menuItemDefinitions :{
                        downloadPNG: {
                            textKey: 'downloadPNG',
                            onclick: function () {
                                this.options.exporting.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.exporting.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.options.chart.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.chart.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.exportChart();
                                this.options.chart.width  = null;
                                this.options.chart.height = null;
                            }
                        },
                        downloadJPEG: {
                            textKey: 'downloadJPEG',
                            onclick: function () {
                                this.options.exporting.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.exporting.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.options.chart.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.chart.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.exportChart({
                                    type: 'image/jpeg'
                                });
                                this.options.chart.width  = null;
                                this.options.chart.height = null;
                            }
                        },
                        downloadPDF: {
                            textKey: 'downloadPDF',
                            onclick: function () {
                                this.options.exporting.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.exporting.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.options.chart.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.chart.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.exportChart({
                                    type: 'application/pdf'
                                });
                                this.options.chart.width  = null;
                                this.options.chart.height = null;
                            }
                        },
                        downloadSVG: {
                            textKey: 'downloadSVG',
                            onclick: function () {
                                this.options.exporting.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.exporting.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.options.chart.width  = document.querySelector("#"+this.options.chart.renderTo)?.offsetWidth;
                                this.options.chart.height = document.querySelector("#"+this.options.chart.renderTo)?.offsetHeight;
                                this.exportChart({
                                    type: 'image/svg+xml'
                                });
                                this.options.chart.width  = null;
                                this.options.chart.height = null;
                            }
                        },
                        resize : {
                            text : 'Enable Resizing',
                            onclick : function() {
                                var divId = this.options.chart.renderTo;
                                $("#"+divId).attr("style", "height:inherit;").wrap("<div class='resizer'><div class='inner-resizer'>");

                                $("#"+divId).closest(".resizer").resizable({
                                    resize: function () {
                                        Highcharts.charts.forEach((h) => {
                                            if ( $N.isNotEmpty(h) ) {
                                                if ( h.renderTo.id === divId ) {
                                                    h.setSize(
                                                        this.offsetWidth - 20,
                                                        this.offsetHeight - 20,
                                                        false
                                                    );
                                                }
                                            }
                                        })
                                    }
                                });

                            }
                        }
                    },
                    buttons: {
                        contextButton: {
                            menuItems: [
                                "viewFullscreen",
                                "printChart",
                                "separator",
                                "downloadPNG",
                                "downloadJPEG",
                                "downloadPDF",
                                "downloadSVG",
                                "separator",
                                "downloadXLS",
                                "viewData",
                                "resize"
                            ]
                        }
                    }
                },
            },

            resize : {
                chart : {
                    spacingTop: 3,
                    spacingRight: 0,
                    spacingBottom: 3,
                    spacingLeft: 0
                }
            }

        },
    }
})(jQuery)
