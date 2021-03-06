define( [
    'vendors/d3',
    'vendors/dagre',
    'vendors/jQuery',
    'osg/Utils',
    'osg/NodeVisitor',

], function ( d3, dagreD3, $, MACROUTILS, NodeVisitor ) {

    'use strict';

    // Simple tooltips implementation
    var SimpleTooltips = function ( options ) {

        this.options = options;
        var css = document.createElement( 'style' );
        css.type = 'text/css';
        css.innerHTML = [
            '.simple-tooltip {',
            'display: none;',
            'position: absolute;',
            'margin-left: 10px;',
            'border-radius: 4px;',
            'padding: 10px;',
            'background: rgba(0,0,0,.9);',
            'color: #ffffff;',
            '}',
            '.simple-tooltip:before {',
            'content: ',
            ';',
            'position: absolute;',
            'left: -10px;',
            'top: 8px;',
            'border: 10px solid transparent;',
            'border-width: 10px 10px 10px 0;',
            'border-right-color: rgba(0,0,0,.9);',
            '}'
        ].join( '\n' );
        document.getElementsByTagName( 'head' )[ 0 ].appendChild( css );

        this.el = document.createElement( 'div' );
        this.el.className = 'simple-tooltip';
        document.body.appendChild( this.el );

        var showTooltip = function ( e ) {
            var target = e.currentTarget;
            this.el.innerHTML = target.getAttribute( 'title' );
            this.el.style.display = 'block';
            this.el.style.left = ( $( target ).position().left + $( target ).get( 0 ).getBoundingClientRect().width ) + 'px';
            this.el.style.top = $( target ).position().top + 'px';
        };

        var hideTooltip = function ( /* e */) {
            this.el.style.display = 'none';
        };

        var nodes = document.querySelectorAll( this.options.selector );
        for ( var i = 0; i < nodes.length; i++ ) {
            nodes[ i ].addEventListener( 'mouseover', showTooltip.bind( this ), false );
            nodes[ i ].addEventListener( 'mouseout', hideTooltip.bind( this ), false );
        }
    };


    var DisplayNodeGraphVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );

        this._nodeListSize = 0;
        this._fullNodeList = [];
        this._nodeList = [];
        this._linkListSize = 0;
        this._linkList = [];
        this._focusedElement = 'scene';

        $( 'body' ).append( '<svg width=100% height=100%></svg>' );

        this._css = '.node {text-align: center;cursor: pointer;}.node rect {stroke: #FFF;}.edgePath path {stroke: #FFF;fill: none;}table {text-align: right;}svg {position: absolute;left: 0px;top: 0px;}.button {position: absolute;left: 15px;top: 15px;z-index: 5;border: 0;background: #65a9d7;background: -webkit-gradient(linear, left top, left bottom, from(#3e779d), to(#65a9d7));background: -webkit-linear-gradient(top, #3e779d, #65a9d7);background: -moz-linear-gradient(top, #3e779d, #65a9d7);background: -ms-linear-gradient(top, #3e779d, #65a9d7);background: -o-linear-gradient(top, #3e779d, #65a9d7);padding: 5px 10px;-webkit-border-radius: 7px;-moz-border-radius: 7px;border-radius: 7px;-webkit-box-shadow: rgba(0,0,0,1) 0 1px 0;-moz-box-shadow: rgba(0,0,0,1) 0 1px 0;box-shadow: rgba(0,0,0,1) 0 1px 0;text-shadow: rgba(0,0,0,.4) 0 1px 0;color: white;font-size: 15px;font-family: Helvetica, Arial, Sans-Serif;text-decoration: none;vertical-align: middle;}.button:hover {border-top-color: #28597a;background: #28597a;color: #ccc;}.button:active {border-top-color: #1b435e;background: #1b435e;}.simple-tooltip .name {font-weight: bold;color: #60b1fc;margin: 0;}.simple-tooltip .description {margin: 0;}';
    };

    DisplayNodeGraphVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {

        apply: function ( node ) {

            window.test = node;

            if ( this._fullNodeList[ node.getInstanceID() ] !== node ) {

                var nodeMatrix = '';
                if ( node.getMatrix ) {
                    nodeMatrix = this.createMatrixGrid( node, nodeMatrix, node.getMatrix() );
                }

                var stateset = '';
                if ( node.getStateSet() ) {
                    stateset = this.createStateset( node, stateset );
                }

                this._fullNodeList[ node.getInstanceID() ] = node;

                this._nodeList[ this._nodeListSize ] = {
                    name: node.getName(),
                    className: node.className(),
                    instanceID: node.getInstanceID(),
                    stateset: stateset,
                    matrix: nodeMatrix
                };
                this._nodeListSize++;

            }

            if ( node.getChildren ) {

                var children = node.getChildren();
                for ( var i = 0, l = children.length; i < l; i++ ) {
                    this._linkList[ this._linkListSize ] = {
                        parentNode: node.getInstanceID(),
                        childrenNode: children[ i ].getInstanceID()
                    };
                    this._linkListSize++;
                }
            }

            this.traverse( node );
        },

        reset: function () {
            this._nodeListSize = 0;
            this._fullNodeList = [];
            this._nodeList = [];
            this._linkListSize = 0;
            this._linkList = [];
        },

        // Apply all the style
        injectStyleElement: function () {
            $( 'body' ).append( '<button class="button">Access to the scene</button>' );

            $( '.button' ).click( function () {
                if ( this._focusedElement === 'scene' ) {
                    $( '.button' ).text( 'Access to the graph' );
                    $( 'svg' ).css( 'zIndex', '-2' );
                    this._focusedElement = 'graph';
                } else {
                    $( '.button' ).text( 'Access to the scene' );
                    $( 'svg' ).css( 'zIndex', '2' );
                    $( '.simple-tooltip' ).css( 'zIndex', '3' );
                    this._focusedElement = 'scene';
                }
            }.bind( this ) );

            var css = document.createElement( 'style' );
            css.type = 'text/css';
            css.innerHTML = this._css;
            document.getElementsByTagName( 'head' )[ 0 ].appendChild( css );
        },

        // Create and display a dagre d3 graph
        createGraph: function () {

            // Include dagre and d3 script
            // TODO: it should be handled correctly...
            //       - dont need to load them if it's already defined
            //       - if the files are not local maybe we should try on cdn
            $.when( $.getScript( '../vendors/d3.js' ), $.getScript( '../vendors/dagre.js' ) ).done( function () {

                var g = new dagreD3.Digraph();

                g = this.generateNodeAndLink( g );

                // Add the style of the graph
                this.injectStyleElement();

                // Create the renderer
                var renderer = new dagreD3.Renderer();

                // Set up an SVG group so that we can translate the final graph.
                var svg = d3.select( 'svg' ),
                    svgGroup = svg.append( 'g' );

                // Set initial zoom to 75%
                var initialScale = 0.75;
                var oldZoom = renderer.zoom();
                renderer.zoom( function ( graph, svg ) {
                    var zoom = oldZoom( graph, svg );

                    zoom.scale( initialScale ).event( svg );
                    return zoom;
                } );

                // Simple function to style the tooltip for the given node.
                var styleTooltip = function ( name, description ) {
                    return '<p class="name">' + name + '</p><pre class="description">' + description + '</pre>';
                };

                // Override drawNodes to set up the hover.
                var oldDrawNodes = renderer.drawNodes();
                renderer.drawNodes( function ( g, svg ) {
                    var svgNodes = oldDrawNodes( g, svg );

                    // Set the title on each of the nodes and use tipsy to display the tooltip on hover
                    svgNodes.attr( 'title', function ( d ) {
                        return styleTooltip( d, g.node( d ).description );
                    } );

                    return svgNodes;
                } );

                // Run the renderer. This is what draws the final graph.
                renderer.run( g, svgGroup );

                new SimpleTooltips( {
                    selector: '.node'
                } );

                var self = this;

                // Do a console log of the node (or stateset) and save it in Window.*
                $( '.node' ).click( function () {
                    var identifier = $( this ).attr( 'title' ).split( '<' )[ 1 ].split( '>' )[ 1 ];
                    if ( identifier.search( 'StateSet' ) === -1 ) {
                        window.activeNode = self._fullNodeList[ identifier ];
                        console.log( 'window.activeNode is set.' );
                        console.log( self._fullNodeList[ identifier ] );
                    } else {
                        var stateset = self._fullNodeList[ identifier.split( ' ' )[ 2 ] ].getStateSet();
                        window.activeStateset = stateset;
                        console.log( 'window.activeStateset is set.' );
                        console.log( stateset );
                    }

                } );

            }.bind( this ) );
        },

        // Subfunction of createGraph, will iterate to create all the node and link in dagre
        generateNodeAndLink: function ( g ) {
            for ( var i = 0; i < this._nodeListSize; i++ ) {
                var element = this._nodeList[ i ];

                g.addNode( element.instanceID, {
                    label: element.className + ( element.name ? '\n' + element.name : '' ),
                    description: ( element.stateset ? 'StateSetID : ' + element.stateset.statesetID : '' ) + ( element.stateset && element.matrix !== '' ? '<br /><br />' : '' ) + element.matrix
                } );

                if ( element.stateset ) {

                    g.addNode( element.stateset.name, {
                        label: 'StateSet',
                        description: 'numTexture : ' + element.stateset.numTexture,
                        style: 'fill: #0099FF;stroke-width: 0px;'
                    } );

                    g.addEdge( null, element.instanceID, element.stateset.name, {
                        style: 'stroke: #0099FF;'
                    } );
                }
            }

            for ( i = 0; i < this._linkListSize; i++ ) {
                g.addEdge( null, this._linkList[ i ].parentNode, this._linkList[ i ].childrenNode );
            }

            return g;
        },

        // Create an array to display the matrix
        createMatrixGrid: function ( node, nodeMatrix, matrixArray ) {

            nodeMatrix += '<table><tr><td>' + matrixArray[ 0 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 4 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 8 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 12 ] + '</td></tr>';

            nodeMatrix += '<tr><td>' + matrixArray[ 1 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 5 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 9 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 13 ] + '</td></tr>';

            nodeMatrix += '<tr><td>' + matrixArray[ 2 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 6 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 10 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 14 ] + '</td></tr>';

            nodeMatrix += '<tr><td>' + matrixArray[ 3 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 7 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 11 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 15 ] + '</td></tr></table>';

            return nodeMatrix;
        },

        // Get the stateset and create the stateset display structure
        createStateset: function ( node, stateset ) {
            stateset = {
                name: 'StateSet - ' + node.getInstanceID(),
                statesetID: node.getStateSet().getInstanceID(),
                parentID: node.getInstanceID(),
                stateset: node.getStateSet(),
                numTexture: node.getStateSet().getNumTextureAttributeLists()
            };
            return stateset;
        },

        getNodeListSize: function () {
            return this._nodeListSize;
        },

        getFullNodeList: function () {
            return this._fullNodeList;
        },

        getNodeList: function () {
            return this._nodeList;
        },

        getLinkListSize: function () {
            return this._linkListSize;
        },

        getLinkList: function () {
            return this._linkList;
        }

    } );

    return DisplayNodeGraphVisitor;
} );
