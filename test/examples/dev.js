// Assumes svg.js (https://www.npmjs.com/package/@svgdotjs/svg.js) is loaded under global `SVG` object.

EdgeDrawingModes = {
    CONTAINER: 'CONTAINER', PARENT: 'PARENT', ROOT: 'ROOT'
};

const TESTING_MODE = [
    EdgeDrawingModes.CONTAINER, EdgeDrawingModes.PARENT, EdgeDrawingModes.ROOT
][0];

const graph = {
    id: "root",
    properties: {
        'algorithm': 'layered',
        'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'org.eclipse.elk.json.edgeCoords': TESTING_MODE,
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


class Painter {

    constructor({edgeDrawingMode = EdgeDrawingModes.CONTAINER}) {
        this.reset();
        this.edgeDrawingMode = edgeDrawingMode;
    }

    reset() {
        this.svg = null;
        this.globalCoords = {};
        this.currentPath = [];
        this.currentEdge = null;
        this.currentEdgeContainer = null;
        this.x0 = 0;
        this.y0 = 0;
    }

    enterNode(v) {
        this.currentPath.push(v.id);
        this.x0 += v.x;
        this.y0 += v.y;
        this.globalCoords[v.id] = [this.x0, this.y0];
    }

    exitNode() {
        this.currentPath.pop();
        const n = this.currentPath.length;
        if (n > 0) {
            const id = this.currentPath[n-1];
            const p = this.globalCoords[id];
            this.x0 = p[0];
            this.y0 = p[1];
        } else {
            this.x0 = 0;
            this.y0 = 0;
        }
    }

    draw(root) {
        this.reset();
        this.svg = SVG().addTo('body').size(root.width, root.height);
        this.drawRecursive(root);
    }

    drawRecursive(g) {
        if (Array.isArray(g)) {
            for (const obj of g) {
                this.drawRecursive(obj);
            }
        } else if (typeof(g) === 'object') {
            let enteredNode = false;
            let enteredEdge = false;

            if (g.hasOwnProperty('container')) {
                this.currentEdge = g;
                enteredEdge = true;
                this.currentEdgeContainer = g.container;
            }

            if (g.hasOwnProperty('width')) {
                if (g.hasOwnProperty('text')) {
                    this.drawElkLabel(g);
                } else {
                    this.drawElkRect(g);
                    this.enterNode(g);
                    enteredNode = true;
                }
            }

            if (g.hasOwnProperty('startPoint')) {
                this.drawElkEdgeSection(g);
            }

            for (const value of Object.values(g)) {
                this.drawRecursive(value);
            }

            if (enteredNode) {
                this.exitNode();
            }

            if (enteredEdge) {
                this.currentEdge = null;
            }
        }
    }

    drawElkLabel(label) {
        const text = this.svg.text(label.text)
        const [x0, y0] = this.currentEdge ? this.getCurrentEdgeShift() : [this.x0, this.y0];
        text.move(x0 + label.x, y0 + label.y)
    }

    drawElkRect(r) {
        const rect = this.svg.rect(r.width, r.height).attr({stroke: 'black', fill: 'none'});
        rect.move(this.x0 + r.x, this.y0 + r.y);
    }

    getCurrentEdgeShift() {
        let p;
        switch (this.edgeDrawingMode) {
            case EdgeDrawingModes.CONTAINER:
                const id = this.currentEdgeContainer;
                p = this.globalCoords[id];
                break;
            case EdgeDrawingModes.PARENT:
                p = [this.x0, this.y0];
                break;
            case EdgeDrawingModes.ROOT:
                p = [0, 0];
                break;
            default:
                throw 'Unknown edge drawing mode!';
        }
        return p;
    }

    drawElkEdgeSection(section) {
        const [x0, y0] = this.getCurrentEdgeShift();

        const points = [];

        function addPoint(point) {
            points.push([point.x, point.y]);
        }

        addPoint(section.startPoint);

        const bps = section.bendPoints || [];
        for (const bp of bps) {
            addPoint(bp);
        }

        addPoint(section.endPoint);

        const polyline = this.svg.polyline(points);
        polyline.fill('none');
        polyline.stroke({color: 'red', width: 1 });
        polyline.dmove(x0, y0);
    }

}


function main() {
    const elk = new ELK({
        workerUrl: '../../lib/elk-workerFOO.js'
    });

    const painter = new Painter({edgeDrawingMode: TESTING_MODE});

    elk.layout(graph).then(function(g) {
        painter.draw(g);

        const rawOutput = document.createElement('div');
        rawOutput.innerHTML = "<pre>" + JSON.stringify(g, null, " ") + "</pre>";
        document.body.appendChild(rawOutput);
    });
}

main();
