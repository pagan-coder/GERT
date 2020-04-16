/**
 * Creating a new object that is going to save relevant graph data.
**/
var Saver = new Object();

/**
 * A flag that determined whether the file was saved.
**/
Saver.saved = true;

/**
 * Used for temporary data.
**/
Saver.tempData;

/**
 * JSON to be saved for future use.
**/
Saver.JSON = {
    "settings": {},
    "nodes": [],
    "links": []
};

/**
 * Getting a node by ID.
 * @param {int} id
 * @returns {JSONObject} node
**/
Saver.getNodeById = function (id) {
    return Gert.getNodeById(Saver.JSON, id);
};

/**
 * Getting a link by its source and target nodes' IDs.
 * @param {int} sourceId
 * @param {int} targetId
 * @returns {JSONObject} link
**/
Saver.getLinkByST = function (sourceId, targetId) {
    for (var i in Saver.JSON.links) {
        if (Saver.JSON.links[i].source.id == sourceId &&
            Saver.JSON.links[i].target.id == targetId) {
            return Saver.JSON.links[i];
        }
    }
    return null;
};

/**
 * Saves the JSON into a file.
*/
Saver.saveJSONtoFile = function () {
    // Clean
    var temporaryJSON = Saver.clean();
    // Saving to the file
    Saver.saved = true; // flagging
    var blob = new Blob([JSON.stringify(temporaryJSON)], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "output.json");
};

/**
 * Removes computation-related data.
 * @returns {JSONObject} temporaryJSON
*/
Saver.clean = function () {
    var temporaryJSON = JSON.parse(JSON.stringify(Saver.JSON));
    // Removing computation-related data
    for (var i in temporaryJSON.nodes) {
        temporaryJSON.nodes[i].index = undefined;
        // GERT
        temporaryJSON.nodes[i].computed = undefined;
        temporaryJSON.nodes[i].probability = undefined;
        temporaryJSON.nodes[i].stochastic = undefined;
        temporaryJSON.nodes[i].sourceTo = undefined;
        temporaryJSON.nodes[i].targetTo = undefined;
        temporaryJSON.nodes[i].time0 = undefined;
        temporaryJSON.nodes[i].time1 = undefined;
    }
    for (var i in temporaryJSON.links) {
        temporaryJSON.links[i].index = undefined;
        temporaryJSON.links[i].source = temporaryJSON.links[i].source.id;
        temporaryJSON.links[i].target = temporaryJSON.links[i].target.id;
        // GERT
        temporaryJSON.links[i].critical = undefined;
        temporaryJSON.links[i].critical_confirmed = undefined;
    }
    return temporaryJSON;
};

/**
 * Checks if a graph is acyclic using a new edge.
 * @param {integer} source
 * @param {integer} target
 * @returns {boolean} acyclic
*/
Saver.checkAcyclic = function (source, target) {
    var queue = new Array();
    queue.push(target);
    while (queue.length >= 1) {
        var element = queue.shift();
        if (element == source)
            return true;
        for (var i in Saver.JSON.links) {
            if (Saver.JSON.links[i].source.id == element) {
                queue.push(Saver.JSON.links[i].target.id)
            }
        }
    }
    return false;
};
