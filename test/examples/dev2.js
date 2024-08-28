const shapeCoordMode = ShapeCoordModes.PARENT;
const edgeCoordMode = EdgeCoordModes.CONTAINER;

const graph = {
    id: "root",
    properties: {
        'algorithm': 'layered',
        'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'org.eclipse.elk.json.edgeCoords': edgeCoordMode,
    },
    children: [
        { id: "A",
            children: [
                { id: "x", width: 50, height: 90 },
                { id: "B",
                    children: [
                        { id: "y", width: 50, height: 90 },
                        { id: "z", width: 50, height: 90 },
                    ],
                    edges: [
                        { id: "e1", sources: [ "y" ], targets: [ "z" ] },
                        { id: "e2", sources: [ "x" ], targets: [ "z" ],
                          labels: [
                              { text: "Foo", width: 30, height: 12 }
                          ]
                        },
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
