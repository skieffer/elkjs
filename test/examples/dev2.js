const graph1 = {
    id: "root",
    properties: {
        'algorithm': 'layered',
        'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN'
    },
    children: [
        { id: "A",
            labels: [
                { text: "A", width: 10, height: 12 }
            ],
            children: [
                { id: "x", width: 50, height: 90,
                    labels: [
                        { text: "x", width: 10, height: 12 }
                    ]
                },
                { id: "B",
                    labels: [
                        { text: "B", width: 10, height: 12 }
                    ],
                    ports: [
                        { id: "p", width: 10, height: 10,
                            labels: [{ text: "p", width: 10, height: 12 }]
                        }
                    ],
                    children: [
                        { id: "y", width: 50, height: 90,
                            labels: [
                                { text: "y", width: 10, height: 12 }
                            ]
                        },
                        { id: "z", width: 50, height: 90,
                            labels: [
                                { text: "z", width: 10, height: 12 }
                            ]
                        },
                    ],
                    edges: [
                        { id: "e1", sources: [ "y" ], targets: [ "z" ],
                            labels: [
                                { text: "e1", width: 20, height: 12 }
                            ]
                        },
                        { id: "e2", sources: [ "x" ], targets: [ "z" ],
                          labels: [
                              { text: "e2", width: 20, height: 12 }
                          ]
                        },
                        { id: "e3", sources: ["x"], targets: ["p"] },
                        { id: "e4", sources: ["p"], targets: ["y"] }
                    ],
                },
            ],
        },
    ],
};

const graph2 = {
    "id": "root",
    "properties": {
        "algorithm": "layered",
        "org.eclipse.elk.hierarchyHandling": "INCLUDE_CHILDREN"
    },
    "children": [
        { "id": "A",
            "children": [
                { "id": "x", "width": 50, "height": 90 },
                { "id": "B",
                    "labels": [ { "text": "B", "width": 10, "height": 12 } ],
                    "ports": [
                        { "id": "p", "width": 10, "height": 10,
                            "labels": [ { "text": "p", "width": 10, "height": 12 } ]
                        }
                    ],
                    "children": [
                        { "id": "y", "width": 50, "height": 90 },
                        { "id": "z", "width": 50, "height": 90 }
                    ],
                    "edges": [
                        { "id": "e1", "sources": [ "y" ], "targets": [ "z" ] },
                        { "id": "e2", "sources": [ "x" ], "targets": [ "z" ],
                            "labels": [ { "text": "e2", "width": 20, "height": 12 } ]
                        },
                        { "id": "e3", "sources": [ "x" ], "targets": [ "p" ] },
                        { "id": "e4", "sources": [ "p" ], "targets": [ "y" ] }
                    ]
                }
            ]
        }
    ]
}

async function run(shapeCoordMode, edgeCoordMode, graph, {dump = true}) {
    graph.properties['org.eclipse.elk.json.shapeCoords'] = shapeCoordMode
    graph.properties['org.eclipse.elk.json.edgeCoords'] = edgeCoordMode

    const elk = new ELK({
        workerUrl: '../../lib/elk-workerFOO.js'
    });

    const painter = new ElkJsonPainter({
        edgeStyle: {stroke: "red"},
        shapeCoordMode: shapeCoordMode,
        edgeCoordMode: edgeCoordMode
    });

    const g = await elk.layout(graph);

    painter.draw(g);

    if (dump) {
        const rawOutput = document.createElement('div');
        rawOutput.innerHTML = "<pre>" + JSON.stringify(g, null, " ") + "</pre>";
        document.body.appendChild(rawOutput);
    }
}

async function main() {
    const shapeCoordModes = [
        ShapeCoordModes.PARENT, ShapeCoordModes.ROOT
    ];

    const edgeCoordModes = [
        EdgeCoordModes.CONTAINER, EdgeCoordModes.PARENT, EdgeCoordModes.ROOT
    ];

    for (const scm of shapeCoordModes) {
        for (const ecm of edgeCoordModes) {
            const h = document.createElement('h2');
            h.innerText = `Shape Coord Mode: ${scm}, Edge Coord Mode: ${ecm}`;
            document.body.appendChild(h);
            const options = {dump: false};
            await run(scm, ecm, graph2, options);
            document.body.appendChild(document.createElement('hr'));
        }
    }
}

main();
