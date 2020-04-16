/**
 * Creating a new object that is going to handle user input events.
**/
if (Controller === undefined)
    var Controller = new Object();

/**
 * A variable to be set when the input is allowed.
**/
Controller.allowInput = true;

/**
 * Listening for a double click upon a SVG to create a node.
**/
Render.svg.on("dblclick", function () {
    Controller.createNode(parseInt(d3.mouse(this)[0]), parseInt(d3.mouse(this)[1]));
});

/**
 * Listening for a click upon a SVG.
**/
Render.svg.on("click", function () {
    Controller.unclickNode();
});

/**
 * Listening for key inputs.
**/
document.onkeydown = function (e) {
    if (!Controller.allowInput)
        return;

    switch (e.keyCode) {
        case 83: // S
            Saver.saveJSONtoFile();
            break;
    }
};

/**
 * Listening for the back button.
**/
$(window).on('hashchange', function () {
    if ($(".site-content").is(":visible")) {
        if (!Saver.saved)
            return 'Opravdu chcete odejít bez uložení zmìn?';
    }
});

/**
 * Listening for environmental events.
**/
$(window).on('beforeunload', function () {
    if (!Saver.saved)
        return 'Opravdu chcete odejít bez uložení zmìn?';
});

/**
 * Saves the JSON into a file while handling the view.
*/
Controller.save = function () {
    Saver.saveJSONtoFile();
    $('#saveButton').blur();
};
