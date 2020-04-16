/**
 * Creating a new object that is going to render objects.
**/
var Render = new Object();

/**
 * Constant offsets of text labels from the center.
**/
Render.textOffsetXL = 30;
Render.textOffsetXR = 10;
Render.textOffsetYT = 10;
Render.textOffsetYB = 15;

/**
 * Constants of nodes and their content.
**/
Render.nodeImageWidth = 130;
Render.nodeImageHeight = 130;

/**
 * Constants of edges and their content.
**/
Render.edgeStartOffsetPL = "30%";
Render.edgeStartOffsetDL = "50%";
Render.edgeArrowOffsetX = 51;
Render.edgeArrowOffsetY = 0;
Render.edgeArrowWidth = 15;
Render.edgeArrowHeight = 15;

/**
 * GLOBAL variables with render-related data.
**/
Render.colors = d3.scaleOrdinal(d3.schemeCategory10);
Render.svg = d3.select("svg"),
    Render.width = +Render.svg.attr("width"),
    Render.height = +Render.svg.attr("height"),
    Render.node,
    Render.link;
Render.simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id; }).distance(100).strength(1))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(Render.width / 2, Render.height / 2));

/**
 * Initializes some important resources.
**/
Render.init = function () {
    // Setting the view dimensions
    //$(window).resize(function () {
   //     $("#viewplace").attr("width", $("#view-container").width());
    //    $("#viewplace").attr("height", $("#view-container").height());
    //});
    //$(window).resize();
};

/**
 * Returns an image resource.
 * @param {JSONObject} node
 * @returns {string} image URL resource
**/
Render.imageByNode = function (node) {
    var res = "app/view/img/";
    switch (node.type) {
        case "inclusive":
            if (node.stochastic !== undefined)
                res += "inc_sto.png";
            else
                res += "inc_det.png";
            break;
        case "disjunctive":
            if (node.stochastic !== undefined)
                res += "dis_sto.png";
            else
                res += "dis_det.png";
            break;
        default:
            if (node.stochastic !== undefined)
                res += "kon_sto.png";
            else
                res += "kon_det.png";
    }
    return res;
}

/**
 * Renders labels.
 * @param {JSONObject} settings
*/
Render.labels = function (settings) {
    // Major labels
    if (settings.label_header !== undefined)
        $("#label-header").html(settings.label_header);
    if (settings.label_top !== undefined)
        $("#label-top").html(settings.label_top);
    if (settings.label_left !== undefined)
        $("#label-left").html(settings.label_left);
    if (settings.label_right !== undefined)
        $("#label-right").html(settings.label_right);
    if (settings.label_bottom !== undefined)
        $("#label-bottom").html(settings.label_bottom);
    // Minor labels
    if (settings.type !== undefined)
        $("#label-method").text(settings.type);
};

/**
 * Sets styles for links according to the allow flag.
 * @param {String} id
 * @param {boolean} allowed
*/
Render.arrowLinkStyle = function (id, allowed) {
    if (allowed) {
        $("#" + id + " span").css("color", "green");
        $("#" + id + " span").css("cursor", "pointer");
        $("#" + id + " span").mouseenter(function () {
            $(this).css("color", "black");
        }).mouseleave(function () {
            $(this).css("color", "green");
        });
    } else {
        $("#" + id + " span").css("color", "lightgrey");
        $("#" + id + " span").css("cursor", "default");
        $("#" + id + " span").mouseenter(function () {
            $(this).css("color", "lightgrey");
        }).mouseleave(function () {
            $(this).css("color", "lightgrey");
        });
    }
};

/**
 * Cleans the SVG element from its children and adds definitions.
 * @param {svg} svg
*/
Render.cleanSVG = function (svg) {
    // Removing children
    svg.selectAll("*").remove();
    // Adding definitions
    svg.append('defs').append('marker')
        .attrs({
            'id': 'arrowhead',
            'viewBox': '-0 -5 10 10',
            'refX': Render.edgeArrowOffsetX,
            'refY': Render.edgeArrowOffsetY,
            'orient': 'auto',
            'markerWidth': Render.edgeArrowWidth,
            'markerHeight': Render.edgeArrowHeight,
            'xoverflow': 'visible'
        })
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('stroke', '#999')
        .style('fill', 'none');
};

/**
 * Draws the graph from specified JSON objects.
 * @param {JSONObject} settings
 * @param {JSONArray} links
 * @param {JSONArray} nodes
**/
Render.renderGraph = function (settings, links, nodes) {
    // Clean
    Render.cleanSVG(Render.svg);

    // Setting next and previous listeners
    // Next
    if (settings.next !== undefined && settings.next !== "") {
        Render.arrowLinkStyle("arrow-next", true);
        $("#arrow-next").unbind("click");
        $("#arrow-next").click(function () { if (Saver.saved || confirm("Opravdu chcete odejít bez uložení změn?")) { $(window).scrollTop(0); Saver.saved = true; Controller.loadFile(settings.next); } });
    } else {
        Render.arrowLinkStyle("arrow-next", false);
        $("#arrow-next").unbind("click");
    }
    // Previous
    if (settings.previous !== undefined && settings.previous !== "") {
        Render.arrowLinkStyle("arrow-previous", true);
        $("#arrow-previous").unbind("click");
        $("#arrow-previous").click(function () { if (Saver.saved || confirm("Opravdu chcete odejít bez uložení změn?")) { $(window).scrollTop(0); Saver.saved = true; Controller.loadFile(settings.previous); } });
    } else {
        Render.arrowLinkStyle("arrow-previous", false);
        $("#arrow-previous").unbind("click");
    }

    // Show labels
    Render.labels(settings);

    Render.link = Render.svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .on("dblclick", function (d) {
            Controller.editLink(d); // registering an event
            d3.event.stopPropagation();
        })
        .attr("class", function (d) { return "link" + (d.critical_confirmed !== undefined ? d.critical_confirmed.toString() : "0"); })
        .attr('marker-end', 'url(#arrowhead)')

    Render.link.append("title")
        .text(function (d) { return d.duration.toString(); });

    Render.edgepaths = Render.svg.selectAll(".edgepath")
        .data(links)
        .enter()
        .append('path')
        .attrs({
            'class': 'edgepath',
            'fill-opacity': 0,
            'stroke-opacity': 0,
            'id': function (d, i) { return 'edgepath' + i },
        })
        .style("pointer-events", "none");

    Render.edgelabels = Render.svg.selectAll(".edgelabel")
        .data(links)
        .enter()
        .append('text')
        .style("pointer-events", "none")
        .attrs({
            'class': 'edgelabel',
            'id': function (d, i) { return 'edgelabel' + i },
            'fill': '#aaa'
        });

    // Adding a duration label
    Render.edgelabels.append('textPath')
        .attr('class', 'arrow-label duration-label')
        .attr('xlink:href', function (d, i) { return '#edgepath' + i })
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .attr("startOffset", Render.edgeStartOffsetDL)
        .text(function (d) { return d.duration.toString(); });

    // Adding a probability label
    if (Saver.JSON.settings.type != "CPM") {
        Render.edgelabels.append('textPath')
            .attr('class', 'arrow-label probability-label')
            .attr('xlink:href', function (d, i) { return '#edgepath' + i })
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .attr("startOffset", Render.edgeStartOffsetPL)
            .text(function (d) { return d.probability.toString(); });
    }

    Render.node = Render.svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .on("dblclick", function (d) {
            Controller.editNode(d); // registering an event
            d3.event.stopPropagation();
        })
        .on("click", function (d) {
            Controller.clickNode(d); // registering an event
            d3.event.stopPropagation();
        })
        .call(d3.drag()
            .on("start", Render.dragstarted)
            .on("drag", Render.dragged)
            .on("end", Render.dragended)
        );

    Render.node.append("image")
        .attr('xlink:href', function (d) { return Render.imageByNode(d); })
        .attr('width', Render.nodeImageWidth)
        .attr('height', Render.nodeImageHeight)
        .attr("transform", "translate(" + -(Render.nodeImageWidth / 2) + "," + -(Render.nodeImageHeight / 2) + ")");

    Render.node.append("title")
        .text(function (d) { return d.id; });

    Render.node.append("text")
        .attr("class", "text-label text-label-node-id")
        .attr("dx", -Render.textOffsetXL)
        .attr("dy", -Render.textOffsetYT)
        .text(function (d) { return d.id.toString(); });

    if (Saver.JSON.settings.type != "CPM") {
        Render.node.append("text")
            .attr("class", "text-label text-label-probability")
            .attr("dx", Render.textOffsetXR)
            .attr("dy", -Render.textOffsetYT)
            .text(function (d) { return Gert.round(d.probability.toString()); });
    }

    Render.node.append("text")
        .attr("class", "text-label")
        .attr("dx", -Render.textOffsetXL)
        .attr("dy", Render.textOffsetYB)
        .text(function (d) { return Gert.round(d.time0.toString()); });

    Render.node.append("text")
        .attr("class", "text-label")
        .attr("dx", Render.textOffsetXR)
        .attr("dy", Render.textOffsetYB)
        .text(function (d) { return Gert.round(d.time1.toString()); });

    Render.simulation
        .nodes(nodes)
        .on("tick", Render.ticked);

    Render.simulation.force("link")
        .links(links);

    Render.simulation.alphaTarget(0.3).restart();
    $("svg").show();
    Render.init();
}

/**
 * Runs the simulation of the graph.
**/
Render.ticked = function () {
    Render.link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    Render.node
        .attr("transform", function (d) { return "translate(" + d.x + ", " + d.y + ")"; });

    Render.edgepaths.attr('d', function (d) {
        return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
    });

    Render.edgelabels.attr('transform', function (d) {
        if (d.target.x < d.source.x) {
            if (this.getBBox === undefined)
                return;

            try {
                var bbox = this.getBBox();
                rx = bbox.x + bbox.width / 2;
                ry = bbox.y + bbox.height / 2;
                return 'rotate(180 ' + rx + ' ' + ry + ')';
            } catch (err) { }
        }
        else {
            return 'rotate(0)';
        }
    });
};

/**
 * Handles link drag started event.
 * @param {Object} d
**/
Render.dragstarted = function (d) {
    // Saver.saved = false;
    if (!d3.event.active)
        Render.simulation.alphaTarget(0.3).restart()
    d.fx = d.x;
    d.fy = d.y;
};

/**
 * Handles link dragged event.
 * @param {Object} d
**/
Render.dragged = function (d) {
    // The dragging must respect borders
    d.fx = Math.max((Render.nodeImageWidth / 2) + 5, Math.min(d3.event.x, Render.svg.attr("width") - (Render.nodeImageWidth / 2)));
    d.fy = Math.max((Render.nodeImageHeight / 2), Math.min(d3.event.y, Render.svg.attr("height") - (Render.nodeImageHeight / 2)));
};

/**
 * Handles link drag ended event.
 * @param {Object} d
**/
Render.dragended = function (d) {
    var node = Saver.getNodeById(d.id);
    node.x = node.fx = d.fx;
    node.y = node.fy = d.fy;
};