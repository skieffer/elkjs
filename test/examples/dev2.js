const shapeCoordMode = [
    ShapeCoordModes.PARENT, ShapeCoordModes.ROOT
][0];

const edgeCoordMode = [
    EdgeCoordModes.CONTAINER, EdgeCoordModes.PARENT, EdgeCoordModes.ROOT
][0];

const graph = {
    id: "root",
    properties: {
        'algorithm': 'layered',
        'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'org.eclipse.elk.json.edgeCoords': edgeCoordMode,
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

function main() {
    const elk = new ELK({
        workerUrl: '../../lib/elk-workerFOO.js'
    });

    const painter = new ElkJsonPainter({
        edgeStyle: {stroke: "red"},
        shapeCoordMode: shapeCoordMode,
        edgeCoordMode: edgeCoordMode
    });

    elk.layout(graph).then(function(g) {
        painter.draw(g);

        const rawOutput = document.createElement('div');
        rawOutput.innerHTML = "<pre>" + JSON.stringify(g, null, " ") + "</pre>";
        document.body.appendChild(rawOutput);
    });
}

main();
