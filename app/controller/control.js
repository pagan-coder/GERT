/**
 * Creating a new object that is going to manage appliaction's life cycle.
**/
if (Controller === undefined)
    var Controller = new Object();

// A variable to register if the cards were shown
Controller.wasPerformed = false;

// A variable to save the node that was clicked upon.
Controller.nodeClicked = null;

// Registering an onclick event for reset
$('.main-titles').click(function () {
    $('#backButton').blur(); // reset
    if (!Saver.saved && !confirm("Opravdu chcete odejít bez uložení změn?")) {
        return false;
    } else {
        $('.nav-link').removeClass('active');
        $('.navbar-collapse').collapse('hide'); // reset
        Saver.saved = true;
        Controller.perform();
    }
});

// Registering onclick events for labels
$("#label-header").dblclick(function () { Controller.changeText("label-header"); });
$("#label-top").dblclick(function () { Controller.changeText("label-top"); });
$("#label-left").dblclick(function () { Controller.changeText("label-left"); });
$("#label-right").dblclick(function () { Controller.changeText("label-right"); });
$("#label-bottom").dblclick(function () { Controller.changeText("label-bottom"); });

/**
 * Loads the screen and its content and functions.
**/
Controller.perform = function () {
    // Reset
    $("#label-method").text("");
    // Just showing cards
    if (Controller.wasPerformed) {
        $(".site-content").hide();
        $(".site-cards").show();
        return;
    }

    // Initializing the render
    Render.init();
    // Reading cards
    Controller.readAllFiles();
};

/**
 * Reads all tutorial files that should be included, shows them and registers events.
**/
Controller.readAllFiles = function () {
    // Hiding the site content
    $(".site-content").hide();

    // Reading file names from the includes directory
    d3.json("content/include.json", function (error, includes) {
        if (error)
            throw error;

        // Reading names from files
        var counter = 0;
        for (var i in includes.include) {
            var fileName = includes.include[i];
            (function (fileName) {
                return d3.json("content/" + fileName, function (file_error, graph) {
                    if (!file_error) {
                        // Creating a card
                        counter++;
                        var element = $("#reference-card").clone();
                        element.attr("id", "card_" + counter.toString());
                        element.find(".card-title").text(graph.settings.main_header ? graph.settings.main_header : graph.settings.label_header);
                        element.find(".card-text").text(graph.settings.description);
                        element.appendTo(".site-cards");
                        // Creating a menu item
                        var item = $("#reference-link").clone();
                        item.attr("id", "item_" + counter.toString());
                        item.text(graph.settings.main_header ? graph.settings.main_header : graph.settings.label_header);
                        item.appendTo("#main-nav");
                        // Setting the onclick method
                        var handler = (function (fileName, item) {
                            return function () {
                                // Checking if not saved
                                if ($(".site-content").is(":visible")) {
                                    if (!Saver.saved)
                                        if (!confirm("Opravdu chcete odejít bez uložení změn?")) {
                                            return;
                                        } else {
                                            Saver.saved = true;
                                        }
                                }
                                // Loading the file
                                Controller.loadFile(fileName);
                                // Highlighting the menu item
                                $(".nav-link").each(function () {
                                    $(this).removeClass("active");
                                });
                                item.addClass("active");
                                // Hiding cards
                                $(".site-cards").hide();
                                // Hiding the site content
                                $(".site-content").show();
                                // Hiding the menu
                                $('.navbar-collapse').collapse('hide');
                            }
                        })(fileName, item);
                        element.find("button").click(handler);
                        item.click(handler);
                    }
                })
            })(fileName);
        }
    });
    Controller.wasPerformed = true;
};

/**
 * Loads a graph from a specified file.
 * @param {String} fileName
**/
Controller.loadFile = function (fileName) {
    // Load a file
    d3.json("content/" + fileName, function (error, graph) {
        if (error)
            throw error;
        // Checking CPM limits
        if (graph.settings.type == "CPM") {
            // Nodes
            for (var i in graph.nodes) {
                graph.nodes[i].type = undefined;
            }
            // Links
            for (var i in graph.links) {
                graph.links[i].probability = 1;
            }
        }
        // Save the graph info to model
        Saver.JSON = graph;
        // Compute the graph for GERT and CPM methods
        var gertJSON = Gert.compute(Saver.JSON);
        // Draw the graph
        Render.renderGraph(gertJSON.settings, gertJSON.links, gertJSON.nodes)
    });
};

/**
 * Refreshes the graph.
**/
Controller.refresh = function () {
    // Clean
    var temporaryJSON = Saver.clean();
    // Compute the graph for GERT and CPM methods
    var gertJSON = Gert.compute(temporaryJSON);
    // Draw the graph
    Render.renderGraph(gertJSON.settings, gertJSON.links, gertJSON.nodes)
}

/**
 * Creates a new node within a specified position.
 * @param {int} x
 * @param {int} y
**/
Controller.createNode = function (x, y) {
    var maximumId = 0;
    // Getting maximum ID from previous nodes
    for (var i in Saver.JSON.nodes) {
        var node = Saver.JSON.nodes[i];
        if (node.id !== undefined && node.id > maximumId)
            maximumId = node.id;
    }
    // Creating a new node
    var newNode = new Object();
    newNode.id = maximumId + 1;
    newNode.fx = newNode.x = x;
    newNode.fy = newNode.y = y;
    newNode.vy = newNode.vx = 0;
    // Appending the new node
    Saver.JSON.nodes.push(newNode);
    // Refresh
    Saver.saved = false;
    Controller.refresh();
}

/**
 * Shows a dialog to edit a node.
 * @param {object} d
**/
Controller.editNode = function (d) {
    Controller.unclickNode(); // important
    Saver.tempData = d;
    // Values to be changed
    $('#edit-modal').find('.modal-title').text("Uzel " + d.id.toString());
    $('#edit-save-button').unbind('click');
    $('#edit-save-button').click(function () { Controller.editNodeCallback(); });
    $('#delete-link').unbind('click');
    $('#delete-link').click(function () { Controller.deleteNodeCallback(); });
    // Default values in inputs
    $("#input1").val(d.id.toString());
    $("#select1").val(d.type ? d.type : "conjunctive");
    // Showing used parts
    $("#input1-part").show();
    $("#input2a-part").hide();
    $("#input2b-part").hide();
    $("#input2c-part").hide();
    $("#input2d-part").hide();
    if (Saver.JSON.settings.type == "CPM") {
        $("#select-part").hide();
    } else {
        $("#select-part").show();
    }
    $("#delete-part").show();
    // Showing the modal
    Controller.allowInput = false;
    $('#edit-modal').modal('show');
};

/**
 * Shows a dialog to create a link.
 * @param {integer} source
 * @param {integer} target
**/
Controller.createLink = function (source, target) {
    Saver.tempData = null;
    // Values to be changed
    $('#edit-modal').find('.modal-title').text("Nová hrana");
    $('#edit-save-button').unbind('click');
    $('#edit-save-button').click(function () { Controller.editLinkCallback(); });
    $('#delete-link').unbind('click');
    // Default values in inputs
    $("#input2a").val(source.toString());
    $("#input2b").val(target.toString());
    $("#input2c").val(1);
    $("#input2d").val(1);
    // Showing used parts
    $("#input1-part").hide();
    $("#input2a-part").show();
    $("#input2b-part").show();
    $("#input2c-part").show();
    if (Saver.JSON.settings.type == "CPM") {
        $("#input2d-part").hide();
    } else {
        $("#input2d-part").show();
    }
    $("#select-part").hide();
    $("#delete-part").hide();
    // Showing the modal
    Controller.allowInput = false;
    $('#edit-modal').modal('show');
};

/**
 * Shows a dialog to edit a link.
 * @param {object} d
**/
Controller.editLink = function (d) {
    Saver.tempData = d;
    // Values to be changed
    $('#edit-modal').find('.modal-title').text("Hrana od " + d.source.id.toString() + " do " + d.target.id.toString());
    $('#edit-save-button').unbind('click');
    $('#edit-save-button').click(function () { Controller.editLinkCallback(); });
    $('#delete-link').unbind('click');
    $('#delete-link').click(function () { Controller.deleteLinkCallback(); });
    // Default values in inputs
    $("#input2a").val(d.source.id.toString());
    $("#input2b").val(d.target.id.toString());
    $("#input2c").val(d.duration.toString());
    $("#input2d").val(d.probability.toString());
    // Showing used parts
    $("#input1-part").hide();
    $("#input2a-part").hide();
    $("#input2b-part").hide();
    $("#input2c-part").show();
    if (Saver.JSON.settings.type == "CPM") {
        $("#input2d-part").hide();
    } else {
        $("#input2d-part").show();
    }
    $("#select-part").hide();
    $("#delete-part").show();
    // Showing the modal
    Controller.allowInput = false;
    $('#edit-modal').modal('show');
};

/**
 * Processes the editing of a node.
**/
Controller.editNodeCallback = function () {
    var node = Saver.getNodeById(Saver.tempData.id);
    // Checking
    var newId = parseInt($("#input1").val());
    if (isNaN(newId)) {
        alert("Vyplněné číslo uzlu není číslo!");
        return;
    }
    if (newId !== node.id && Saver.getNodeById(newId) !== null) {
        alert("Uzel s tímto číslem již existuje!");
        return;
    }
    // Setting values
    node.id = newId;
    node.type = $("#select1").val().toString();
    // Refresh
    Saver.saved = false;
    Controller.refresh();
    Controller.alInNow();
    $('#edit-modal').modal('hide');
};

/**
 * Processes the deleting of a node.
**/
Controller.deleteNodeCallback = function () {
    if (!confirm("Opravdu chcete tento uzel odstranit?"))
        return;

    var newJson = new Object();
    newJson.settings = Saver.JSON.settings;
    newJson.nodes = new Array();
    newJson.links = new Array();
    // Delete associated links
    for (var i in Saver.JSON.links) {
        if (Saver.JSON.links[i].source.id !== Saver.tempData.id
            && Saver.JSON.links[i].target.id !== Saver.tempData.id) {
            newJson.links.push(Saver.JSON.links[i]);
        }
    }
    // Delete the node
    for (var i in Saver.JSON.nodes) {
        if (Saver.JSON.nodes[i].id !== Saver.tempData.id) {
            newJson.nodes.push(Saver.JSON.nodes[i]);
        }
    }
    Saver.JSON = newJson;
    // Refresh
    Saver.saved = false;
    Controller.refresh();
    Controller.alInNow();
    $('#edit-modal').modal('hide');
};

/**
 * Processes the editing of a link.
**/
Controller.editLinkCallback = function () {
    var link = new Object();
    if (Saver.tempData !== null)
        link = Saver.getLinkByST(Saver.tempData.source.id, Saver.tempData.target.id);
    // Checking
    var newSource = parseInt($("#input2a").val());
    var newTarget = parseInt($("#input2b").val());
    var duration = parseFloat($("#input2c").val());
    var probability = parseFloat($("#input2d").val());
    if (Saver.tempData === null) {
        if (isNaN(newSource) || isNaN(newTarget)) {
            alert("Vyplněné číslo uzlu není číslo!");
            return;
        }
        if (Saver.getLinkByST(newSource, newTarget) !== null || Saver.getLinkByST(newTarget, newSource) !== null) {
            alert("Hrana mezi specifikovanými uzly již existuje!");
            return;
        }
        if (newSource == newTarget) {
            alert("Zdrojový a cílový uzel nesmí být stejné!");
            return;
        }
        if (Saver.checkAcyclic(newSource, newTarget)) {
            alert("Graf nesmí obsahovat smyčku! Zvolte jiný počátek nebo konec.");
            return;
        }
    }
    if (isNaN(duration) || duration < 0) {
        alert("Vyplněná doba trvání není číslo!");
        return;
    }
    if (isNaN(probability)) {
        alert("Vyplněná pravděpodobnost realizace není číslo!");
        return;
    }
    if (probability > 1 || probability < 0) {
        alert("Vyplněná pravděpodobnost realizace musí být z intervalu <0, 1>!");
        return;
    }
    // Setting values
    if (Saver.tempData === null) {
        link.source = Saver.getNodeById(newSource);
        link.target = Saver.getNodeById(newTarget);
    }
    link.duration = duration;
    link.probability = probability;
    // Appending the new node
    if (Saver.tempData === null)
        Saver.JSON.links.push(link);
    // Refresh
    Saver.saved = false;
    Controller.refresh();
    Controller.alInNow();
    $('#edit-modal').modal('hide');
};

/**
 * Processes the deleting of a node.
**/
Controller.deleteLinkCallback = function () {
    if (!confirm("Opravdu chcete tuto hranu odstranit?"))
        return;

    var newJson = new Object();
    newJson.settings = Saver.JSON.settings;
    newJson.nodes = Saver.JSON.nodes;
    newJson.links = new Array();
    // Delete associated links
    for (var i in Saver.JSON.links) {
        if (Saver.JSON.links[i].source.id !== Saver.tempData.source.id
            || Saver.JSON.links[i].target.id !== Saver.tempData.target.id) {
            newJson.links.push(Saver.JSON.links[i]);
        }
    }
    Saver.JSON = newJson;
    // Refresh
    Saver.saved = false;
    Controller.refresh();
    Controller.alInNow();
    $('#edit-modal').modal('hide');
};

/**
 * Removes information about the last selected node.
**/
Controller.unclickNode = function () {
    Controller.nodeClicked = null;
    $('svg').css('cursor', 'default');
};

/**
 * Selects a first node or runs the creation of an edge based on the second node.
 * @param {object} d
**/
Controller.clickNode = function (d) {
    if (Controller.nodeClicked === null || Controller.nodeClicked === d.id) {
        Controller.nodeClicked = d.id;
        $('svg').css('cursor', 'crosshair');
    } else {
        if (Saver.getLinkByST(Controller.nodeClicked, d.id) !== null) {
            Controller.editLink(Saver.getLinkByST(Controller.nodeClicked, d.id));
        } else if (Saver.getLinkByST(d.id, Controller.nodeClicked) !== null) {
            Controller.editLink(Saver.getLinkByST(d.id, Controller.nodeClicked));
        } else {
            Controller.createLink(Controller.nodeClicked, d.id);
        }
        Controller.unclickNode();
    }
};

/**
 * Shows a dialog to change a text.
 * @param {integer} id
**/
Controller.changeText = function (id) {
    Saver.tempData = id;
    // Values to be changed
    $('#text-save-button').unbind('click');
    $('#text-save-button').click(function () { Controller.editTextCallback(); });
    // Default values in inputs
    $("#text-area").val(Saver.JSON.settings[id.replace("-", "_")]);
    // Showing the modal
    Controller.allowInput = false;
    $('#text-edit-modal').modal('show');
};

/**
 * Processes the editing of a text.
**/
Controller.editTextCallback = function () {
    var text = $('#text-area').val();
    // Setting
    $("#" + Saver.tempData).html(text);
    Saver.JSON.settings[Saver.tempData.replace("-", "_")] = text;
    // Basic refresh
    Saver.saved = false;
    Controller.alInNow();
    $('#text-edit-modal').modal('hide');
};

/**
 * Allows a self input (f. e. S for save, etc.).
**/
Controller.alInNow = function () {
    Controller.allowInput = true;
}