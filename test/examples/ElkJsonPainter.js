

const ShapeCoordModes = {
    PARENT: 'PARENT', ROOT: 'ROOT'
};

const EdgeCoordModes = {
    CONTAINER: 'CONTAINER', PARENT: 'PARENT', ROOT: 'ROOT'
};


/* ElkJsonPainter
 *
 * Draws ELK graphs given in JSON format as SVG.
 */
class ElkJsonPainter {

    constructor({
        nodeStyle = {stroke: "black", fill: "none"},
        edgeStyle = {stroke: "black", strokeWidth: 1},
        portStyle = {stroke: "black", fill: "black"},
        labelStyle = {fontSize: 12},
        shapeCoordMode = ShapeCoordModes.PARENT,
        edgeCoordMode = EdgeCoordModes.CONTAINER
    }) {
        this.nodeStyle = nodeStyle;
        this.edgeStyle = edgeStyle;
        this.portStyle = portStyle;
        this.labelStyle = labelStyle;
        this.shapeCoordMode = shapeCoordMode;
        this.edgeCoordMode = edgeCoordMode;
        this.reset()
    }

    reset() {
        this.svg = null;

        // Map node IDs to global coords:
        this.globalCoords = new Map();

        // Sequence of IDs of nodes we are currently inside of:
        this.currentPath = [];

        this.currentEdge = null;

        // The global coordinates of the node we are currently inside of:
        this.x0 = 0;
        this.y0 = 0;
    }

    draw(root) {
        this.reset()
        this.svg = SVG().addTo('body').size(root.width, root.height);
        this.drawNode(root)
    }

    getShapeShift() {
        let dv;
        switch (this.shapeCoordMode) {
            case ShapeCoordModes.PARENT:
                dv = [this.x0, this.y0];
                break;
            case ShapeCoordModes.ROOT:
                dv = [0, 0];
                break;
            default:
                throw "Unknown shape coord mode: " + this.shapeCoordMode;
        }
        return dv;
    }

    getEdgeShift() {
        let dv;
        switch (this.edgeCoordMode) {
            case EdgeCoordModes.CONTAINER:
                const id = this.currentEdge.container;
                dv = this.globalCoords.get(id);
                break;
            case EdgeCoordModes.PARENT:
                dv = [this.x0, this.y0];
                break;
            case EdgeCoordModes.ROOT:
                dv = [0, 0];
                break;
            default:
                throw 'Unknown edge coord mode: ' + this.edgeCoordMode;
        }
        return dv;
    }

    drawRectangle(r, style) {
        const [dx, dy] = this.getShapeShift();
        const rect = this.svg.rect(r.width, r.height).attr(style);
        rect.move(r.x + dx, r.y + dy);
    }

    enterRectangle(r) {
        this.currentPath.push(r.id);
        if (this.shapeCoordMode === ShapeCoordModes.PARENT) {
            this.x0 += r.x;
            this.y0 += r.y;
        } else {
            this.x0 = r.x;
            this.y0 = r.y;
        }
        this.globalCoords.set(r.id, [this.x0, this.y0]);
    }

    exitRectangle() {
        this.currentPath.pop();
        const n = this.currentPath.length;
        if (n > 0) {
            const id = this.currentPath[n-1];
            const p = this.globalCoords.get(id);
            this.x0 = p[0];
            this.y0 = p[1];
        } else {
            this.x0 = 0;
            this.y0 = 0;
        }
    }

    drawNode(node) {
        this.drawRectangle(node, this.nodeStyle);
        this.enterRectangle(node);

        for (const port of (node.ports || [])) {
            this.drawPort(port);
        }

        for (const edge of (node.edges || [])) {
            this.drawEdge(edge);
        }

        for (const label of (node.labels || [])) {
            this.drawLabel(label);
        }

        for (const child of (node.children || [])) {
            this.drawNode(child);
        }

        this.exitRectangle()
    }

    drawPort(port) {
        this.drawRectangle(port, this.portStyle);
        this.enterRectangle(port);

        for (const label of (port.labels || [])) {
            this.drawLabel(label);
        }

        this.exitRectangle();
    }

    drawLabel(label) {
        const [dx, dy] = this.currentEdge ? this.getEdgeShift() : this.getShapeShift();
        const text = this.svg.text(label.text).attr(this.labelStyle);
        text.move(label.x + dx, label.y + dy);
    }

    drawEdge(edge) {
        this.currentEdge = edge;

        for (const section of (edge.sections || [])) {
            this.drawEdgeSection(section);
        }

        for (const label of (edge.labels || [])) {
            this.drawLabel(label);
        }

        this.currentEdge = null;
    }

    drawEdgeSection(section) {
        const [dx, dy] = this.getEdgeShift();

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

        const polyline = this.svg.polyline(points).attr(this.edgeStyle);
        polyline.fill('none');
        polyline.dmove(dx, dy);
    }

}
