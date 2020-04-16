/**
 * Creating a new object that is going to compute information relevant
 * to GERT and CPM methods and return them as JSON.
**/
var Gert = new Object();

/**
 * Calls functions to compute times and probabilities
 * according to the CPM and GERT methods.
 * @param {JSON} inputJSON
 * @returns {JSON} gertJSON
**/
Gert.compute = function (inputJSON) {
    var JSON = Gert.toStartNode(
        Gert.toFinalNode(
            Gert.enrichNodes(inputJSON)
        )
    );
    if (inputJSON.settings.type == "CPM" || inputJSON.settings.type == "GERT")
        JSON = Gert.checkCPM(JSON);
    return JSON;
};

/**
* A helper method that rounds a string number.
* @param {string} stringNumber
* @returns {string}
**/
Gert.round = function (stringNumber) {
    if (stringNumber.indexOf('.') !== -1) {
        var splitNumber = stringNumber.split('.');
        stringNumber = splitNumber[0] + '.' + splitNumber[1].substring(0, 2);
    }
    return stringNumber;
}

/**
 * Returns a node by its ID.
 * @param {JSON} inputJSON
 * @param {int} id
 * @returns {JSONObject} node
**/
Gert.getNodeById = function (inputJSON, id) {
    for (var i in inputJSON.nodes) {
        if (inputJSON.nodes[i].id == id) {
            return inputJSON.nodes[i];
        }
    }
    return null;
};

/**
 * Returns a link by its source and target nodes' IDs.
 * @param {JSON} inputJSON
 * @param {int} sourceId
 * @param {int} targetId
 * @returns {JSONObject} link
**/
Gert.getLinkByST = function (inputJSON, sourceId, targetId) {
    for (var i in inputJSON.links) {
        if (inputJSON.links[i].source == sourceId &&
            inputJSON.links[i].target == targetId) {
            return inputJSON.links[i];
        }
    }
    return null;
};

/**
 * Checks by nodes' IDs if a node was computed using a flag.
 * The value can be used for various purposes, f. e. when the GERT algorithm
 * computes one way of the process.
 * @param {JSON} inputJSON
 * @param {Array} nodesIds
 * @param {int} computedValue
 * @returns {boolean}
**/
Gert.checkIfComputedByIds = function (inputJSON, nodesIds, computedValue) {
    for (var i in nodesIds) {
        var node = Gert.getNodeById(inputJSON, nodesIds[i]);
        if (node.computed !== computedValue)
            return false;
    }
    return true;
};

/**
 * Checks if a node was computed using a flag.
 * The value can be used for various purposes, f. e. when the GERT algorithm
 * computes one way of the process.
 * @param {JSONArray} nodes
 * @param {int} computedValue
 * @returns {boolean}
**/
Gert.checkIfComputedByNodes = function (nodes, computedValue) {
    for (var i in nodes) {
        var node = nodes[i];
        if (node.computed !== computedValue)
            return false;
    }
    return true;
};

/**
 * Sets a flag that the link is part of the critical path.
 * @param {JSON} gertJSON
 * @param {int} sourceNodeId
 * @param {int} targetNodeId
 * @returns {JSON} gertJSON
**/
Gert.markCPMLink = function (gertJSON, sourceNodeId, targetNodeId) {
    for (var i in gertJSON.links) {
        var link = gertJSON.links[i];
        if (link.source == sourceNodeId && link.target == targetNodeId) {
            gertJSON.links[i].critical = 1;
            break;
        }
    }
    return gertJSON;
};

/**
 * Enriches nodes with information about its source/target nodes.
 * which are specified by links.
 * @param {JSON} inputJSON
 * @returns {JSON} enrichedJSON
**/
Gert.enrichNodes = function (inputJSON) {
    var enrichedJSON = inputJSON;
    for (var i in inputJSON.links) {
        var sourceNodeId = inputJSON.links[i].source;
        var targetNodeId = inputJSON.links[i].target;
        // Adding information to each node about its source/target
        for (var j in inputJSON.nodes) {
            var node = inputJSON.nodes[j];
            if (node.id == sourceNodeId) {
                if (enrichedJSON.nodes[j].sourceTo === undefined)
                    enrichedJSON.nodes[j].sourceTo = new Array();
                enrichedJSON.nodes[j].sourceTo.push(targetNodeId);
                // Checking if the node is deterministic or stochastic
                if (enrichedJSON.nodes[j].stochastic === undefined) {
                    var link = Gert.getLinkByST(inputJSON, node.id, targetNodeId);
                    if (link.probability != 1)
                        enrichedJSON.nodes[j].stochastic = 1;
                }
            } else if (node.id == targetNodeId) {
                if (enrichedJSON.nodes[j].targetTo === undefined)
                    enrichedJSON.nodes[j].targetTo = new Array();
                enrichedJSON.nodes[j].targetTo.push(sourceNodeId);
            }
        }
    }
    return enrichedJSON;
};

/**
 * One-way of the GERT algorithm to the final node.
 * It uses different computations based on the type of nodes.
 * @param {JSON} enrichedJSON
 * @returns {JSON} computedJSON
**/
Gert.toFinalNode = function (enrichedJSON) {
    var computedJSON = enrichedJSON;
    while (!Gert.checkIfComputedByNodes(computedJSON.nodes, true)) {
        for (var i in computedJSON.nodes) {
            var node = computedJSON.nodes[i];
            if (node.targetTo === undefined) {
                // The first node time is zero
                computedJSON.nodes[i].time0 = 0;
                computedJSON.nodes[i].probability = 1;
                computedJSON.nodes[i].computed = true;
            } else if (Gert.checkIfComputedByIds(computedJSON, node.targetTo, true)) {
                if (node.type !== undefined && node.type == "inclusive")
                    computedJSON = Gert.inclusiveNodeToFinal(computedJSON, i);
                else if (node.type !== undefined && node.type == "disjunctive")
                    computedJSON = Gert.disjunctiveNodeToFinal(computedJSON, i);
                else
                    computedJSON = Gert.conjunctiveNodeToFinal(computedJSON, i);
            }
        }
    }
    return computedJSON;
};

/**
 * The second way of the GERT algorithm back to the start node.
 * It uses different computations based on the type of nodes.
 * @param {JSON} computedJSON
 * @returns {JSON} gertJSON
**/
Gert.toStartNode = function (computedJSON) {
    var gertJSON = computedJSON;
    while (!Gert.checkIfComputedByNodes(gertJSON.nodes, undefined)) {
        for (var i in gertJSON.nodes) {
            var node = gertJSON.nodes[i];
            if (node.sourceTo === undefined) {
                // The last node time1 is the same as time0
                gertJSON.nodes[i].time1 = gertJSON.nodes[i].time0;
                gertJSON.nodes[i].computed = undefined;
            } else if (Gert.checkIfComputedByIds(gertJSON, node.sourceTo, undefined)) {
                if (node.type !== undefined && node.type == "inclusive")
                    gertJSON = Gert.inclusiveNodeToStart(gertJSON, i);
                else if (node.type !== undefined && node.type == "disjunctive")
                    gertJSON = Gert.disjunctiveNodeToStart(gertJSON, i);
                else
                    gertJSON = Gert.conjunctiveNodeToStart(gertJSON, i);
            }
        }
    }
    return gertJSON;
};

/**
 * Computes the first way of the GERT algorithm for conjunctive nodes.
 * @param {JSON} computedJSON
 * @param {int} currentNodeIndex
 * @returns {JSON} computedJSON
**/
Gert.conjunctiveNodeToFinal = function (computedJSON, currentNodeIndex) {
    // Preparing the variables
    var maximumTime = 0;
    var probability = 1;
    // Preparing current values
    var currentNode = computedJSON.nodes[currentNodeIndex];
    // Getting the maximum time value and the probability
    for (var j in currentNode.targetTo) {
        var sourceNode = Gert.getNodeById(computedJSON, currentNode.targetTo[j]);
        var link = Gert.getLinkByST(computedJSON, currentNode.targetTo[j], currentNode.id);
        var currentProbability = sourceNode.probability * link.probability;
        var time = sourceNode.time0 + link.duration * currentProbability;
        if (time > maximumTime) {
            maximumTime = time;
        }
        probability *= sourceNode.probability * link.probability;
    }
    // Saving and returning
    computedJSON.nodes[currentNodeIndex].time0 = maximumTime;
    computedJSON.nodes[currentNodeIndex].probability = probability;
    computedJSON.nodes[currentNodeIndex].computed = true;
    return computedJSON;
};

/**
 * Computes the second way of the GERT algorithm for conjunctive nodes.
 * @param {JSON} gertJSON
 * @param {int} currentNodeIndex
 * @returns {JSON} gertJSON
**/
Gert.conjunctiveNodeToStart = function (gertJSON, currentNodeIndex) {
    // Preparing the variables
    var minimumTime = Number.MAX_SAFE_INTEGER;
    var minimumTimeTargetNode = null;
    // Preparing current values
    var currentNode = gertJSON.nodes[currentNodeIndex];
    // Getting the minimum time value
    for (var j in currentNode.sourceTo) {
        var targetNode = Gert.getNodeById(gertJSON, currentNode.sourceTo[j]);
        var link = Gert.getLinkByST(gertJSON, currentNode.id, currentNode.sourceTo[j]);
        var currentProbability = currentNode.probability * link.probability;
        var time = targetNode.time1 - link.duration * currentProbability;
        if (time < minimumTime) {
            minimumTime = time;
            minimumTimeTargetNode = targetNode;
        }
    }
    // Saving
    gertJSON.nodes[currentNodeIndex].time1 = minimumTime;
    gertJSON.nodes[currentNodeIndex].computed = undefined;
    // Checking from settings
    if (gertJSON.settings.type == "CPM" || gertJSON.settings.type == "GERT") {
        // Marking the critical path
        if (parseInt(Gert.round(gertJSON.nodes[currentNodeIndex].time0.toString())) ==
            parseInt(Gert.round(gertJSON.nodes[currentNodeIndex].time1.toString()))
            && parseInt(Gert.round(minimumTimeTargetNode.time0.toString())) ==
            parseInt(Gert.round(minimumTimeTargetNode.time1.toString()))) {
            gertJSON = Gert.markCPMLink(gertJSON, currentNode.id, minimumTimeTargetNode.id);
        }
    }
    // Returning
    return gertJSON;
};

/**
 * Computes the first way of the GERT algorithm for inclusive nodes.
 * @param {JSON} computedJSON
 * @param {int} currentNodeIndex
 * @returns {JSON} computedJSON
**/
Gert.inclusiveNodeToFinal = function (computedJSON, currentNodeIndex) {
    // Preparing the variables
    var maximumTime = 0;
    var probability = 1;
    // Preparing current values
    var currentNode = computedJSON.nodes[currentNodeIndex];
    // Getting the maximum time value and the probability
    for (var j in currentNode.targetTo) {
        var sourceNode = Gert.getNodeById(computedJSON, currentNode.targetTo[j]);
        var link = Gert.getLinkByST(computedJSON, currentNode.targetTo[j], currentNode.id);
        var currentProbability = sourceNode.probability * link.probability;
        var time = sourceNode.time0 + link.duration * currentProbability;
        if (time > maximumTime) {
            maximumTime = time;
        }
        probability *= (1 - currentProbability);
    }
    // Saving and returning
    computedJSON.nodes[currentNodeIndex].time0 = maximumTime;
    computedJSON.nodes[currentNodeIndex].probability = 1 - probability;
    computedJSON.nodes[currentNodeIndex].computed = true;
    return computedJSON;
};

/**
 * Computes the second way of the GERT algorithm for inclusive nodes.
 * @param {JSON} gertJSON
 * @param {int} currentNodeIndex
 * @returns {JSON} gertJSON
**/
Gert.inclusiveNodeToStart = function (gertJSON, currentNodeIndex) {
    // Preparing the variables
    var minimumTime = Number.MAX_SAFE_INTEGER;
    var minimumTimeTargetNode = null;
    // Preparing current values
    var currentNode = gertJSON.nodes[currentNodeIndex];
    // Getting the minimum time value
    for (var j in currentNode.sourceTo) {
        var targetNode = Gert.getNodeById(gertJSON, currentNode.sourceTo[j]);
        var link = Gert.getLinkByST(gertJSON, currentNode.id, currentNode.sourceTo[j]);
        var currentProbability = currentNode.probability * link.probability;
        var time = targetNode.time1 - link.duration * currentProbability;
        if (time < minimumTime) {
            minimumTime = time;
            minimumTimeTargetNode = targetNode;
        }
    }
    // Saving
    gertJSON.nodes[currentNodeIndex].time1 = minimumTime;
    gertJSON.nodes[currentNodeIndex].computed = undefined;
    // Checking from settings
    if (gertJSON.settings.type == "CPM" || gertJSON.settings.type == "GERT") {
        // Marking the critical path
        if (parseInt(Gert.round(gertJSON.nodes[currentNodeIndex].time0.toString())) ==
            parseInt(Gert.round(gertJSON.nodes[currentNodeIndex].time1.toString()))
            && parseInt(Gert.round(minimumTimeTargetNode.time0.toString())) ==
            parseInt(Gert.round(minimumTimeTargetNode.time1.toString()))) {
            gertJSON = Gert.markCPMLink(gertJSON, currentNode.id, minimumTimeTargetNode.id);
        }
    }
    // Returning
    return gertJSON;
};

/**
 * Computes the first way of the GERT algorithm for disjunctive nodes.
 * @param {JSON} computedJSON
 * @param {int} currentNodeIndex
 * @returns {JSON} computedJSON
**/
Gert.disjunctiveNodeToFinal = function (computedJSON, currentNodeIndex) {
    // Preparing the variables
    var maximumTime = 0;
    var probability = 0;
    // Preparing current values
    var currentNode = computedJSON.nodes[currentNodeIndex];
    // Getting the maximum time value and the probability
    for (var j in currentNode.targetTo) {
        var sourceNode = Gert.getNodeById(computedJSON, currentNode.targetTo[j]);
        var link = Gert.getLinkByST(computedJSON, currentNode.targetTo[j], currentNode.id);
        var currentProbability = sourceNode.probability * link.probability;
        var time = sourceNode.time0 + link.duration * currentProbability;
        if (time > maximumTime) {
            maximumTime = time;
        }
        // Getting probabilities from other nodes
        var otherNodesProbability = 1;
        for (var k in currentNode.targetTo) {
            var otherNodeId = currentNode.targetTo[k];
            // j != k
            if (otherNodeId != currentNode.targetTo[j]) {
                var otherNode = Gert.getNodeById(computedJSON, otherNodeId);
                var linkK = Gert.getLinkByST(computedJSON, otherNodeId, currentNode.id);
                otherNodesProbability *= (1 - otherNode.probability * linkK.probability);
            }
        }
        probability += (currentProbability * otherNodesProbability);
    }
    // Saving and returning
    computedJSON.nodes[currentNodeIndex].time0 = maximumTime;
    computedJSON.nodes[currentNodeIndex].probability = probability;
    computedJSON.nodes[currentNodeIndex].computed = true;
    return computedJSON;
};

/**
 * Computes the second way of the GERT algorithm for disjunctive nodes.
 * @param {JSON} gertJSON
 * @param {int} currentNodeIndex
 * @returns {JSON} gertJSON
**/
Gert.disjunctiveNodeToStart = function (gertJSON, currentNodeIndex) {
    // This computation is the same as for inclusive nodes
    return Gert.inclusiveNodeToStart(gertJSON, currentNodeIndex);
};

/**
 * Checking that the CPM algorithm was correct.
 * @param {JSON} gertJSON
 * @returns {JSON} gertJSON
**/
Gert.checkCPM = function (gertJSON) {
    var queue = new Array();
    // Adding a first node's links to the queue
    for (var i in gertJSON.nodes) {
        var node = gertJSON.nodes[i];
        if (node.targetTo === undefined) {
            // The first node's links
            for (var j in gertJSON.links) {
                if (gertJSON.links[j].source == node.id) {
                    if (gertJSON.links[j].critical == 1) {
                        gertJSON.links[j].critical_confirmed = 1;
                        queue.push(gertJSON.links[j]);
                    }
                }
            }
        }
    }
    // Adding subsequent links
    while (queue.length >= 1) {
        var element = queue.shift();
        for (var i in gertJSON.links) {
            if (gertJSON.links[i].critical == 1
                && gertJSON.links[i].source == element.target) {
                gertJSON.links[i].critical_confirmed = 1;
                queue.push(gertJSON.links[i]);
            }
        }
    }
    return gertJSON;
};
