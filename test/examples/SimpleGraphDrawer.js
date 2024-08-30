/* Simple drawing utilities for ELK graphs.
 */

const ShapeCoordModes = {
    PARENT: 'PARENT', ROOT: 'ROOT'
};

const EdgeCoordModes = {
    CONTAINER: 'CONTAINER', PARENT: 'PARENT', ROOT: 'ROOT'
};


/* Draws ELK graphs given in JSON format as SVG.
 *
 * Supports each of ELK's shape and edge coordinate modes, but only as a single,
 * global setting for the whole graph.
 */
class SimpleGraphDrawer {

    constructor({
        nodeStyle = {stroke: "black", fill: "none"},
        edgeStyle = {stroke: "black", "stroke-width": 1},
        portStyle = {stroke: "black", fill: "black"},
        /* When using monospace 16, a good rule for labels is to use height 20,
        *  and width 10n + 2, where the text is n letters long. */
        labelStyle = {"font-family": "monospace", "font-size": 16},
        shapeCoordMode = ShapeCoordModes.PARENT,
        edgeCoordMode = EdgeCoordModes.CONTAINER
    }) {
        this.nodeStyle = nodeStyle;
        this.edgeStyle = Object.assign(edgeStyle, {fill: 'none'});
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
        this.svg = new SvgDrawing(root.width, root.height);
        this.drawNode(root)
        return this.svg;
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
        this.svg.rect(r.x + dx, r.y + dy, r.width, r.height, style);
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
        this.svg.text(
            label.x + dx, label.y + dy,
            label.width, label.height,
            label.text, this.labelStyle
        );
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
            points.push([point.x + dx, point.y + dy]);
        }

        addPoint(section.startPoint);

        for (const bp of (section.bendPoints || [])) {
            addPoint(bp);
        }

        addPoint(section.endPoint);

        this.svg.polyline(points, this.edgeStyle);
    }

}


class SvgDrawing {

    constructor(W, H) {
        this.namespace = "http://www.w3.org/2000/svg";
        this.svg = this.makeElement('svg', {
            xmlns: this.namespace,
            version: "1.1",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            width: W,
            height: H
        });
    }

    makeElement(tag, attrs) {
        const elt = document.createElementNS(this.namespace, tag);
        for (const [k, v] of Object.entries(attrs)) {
            elt.setAttribute(k, v);
        }
        return elt;
    }

    addElement(tag, attrs) {
        const elt = this.makeElement(tag, attrs)
        this.svg.appendChild(elt);
        return elt;
    }

    addTo(element) {
        element.appendChild(this.svg);
    }

    rect(x, y, w, h, style) {
        const tag = 'rect';
        const attrs = Object.assign(style, {
            x: x, y: y, width: w, height: h
        });
        this.addElement(tag, attrs);
    }

    /*
     * pointsArray: array of pairs (arrays) of numbers
     */
    polyline(pointsArray, style) {
        const tag = 'polyline';
        const points = pointsArray.map(q => q.join(',')).join(' ');
        const attrs = Object.assign(style, {points});
        this.addElement(tag, attrs);
    }

    text(x0, y0, width, height, text, style) {
        const tag = 'text';
        const x1 = x0 + width/2;
        const y1 = y0 + height/2;
        const attrs = Object.assign(style, {
            x: x1, y: y1,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        });
        const elt = this.addElement(tag, attrs);
        elt.appendChild(document.createTextNode(text));
    }

}
