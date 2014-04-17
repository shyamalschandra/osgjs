Example.getModel = function ( func ) {

    var osg = OSG.osg;
    var osgDB = OSG.osgDB;

    var removeLoading = function ( node, child ) {

        this._nbLoading -= 1;
        this._loaded.push( child );

        if ( this._nbLoading === 0 ) {
            document.getElementById( 'loading' ).style.display = 'None';
            this._viewer.getManipulator().computeHomePosition();
        }

    }.bind( this );

    var addLoading = function() {

        if ( !this._nbLoading ) this._nbLoading= 0;
        if ( !this._loaded ) this._loaded= [];

        this._nbLoading += 1;
        document.getElementById( 'loading' ).style.display = 'Block';

    }.bind( this );


    var node = new osg.MatrixTransform();
    node.setMatrix( osg.Matrix.makeRotate( -Math.PI / 2, 1, 0, 0, [] ) );

    var loadModel = function ( url, cbfunc ) {
        osg.log( 'loading ' + url );
        var req = new XMLHttpRequest();
        req.open( 'GET', url, true );
        req.onreadystatechange = function ( aEvt ) {
            if ( req.readyState === 4 ) {
                if ( req.status === 200 ) {
                    Q.when( osgDB.parseSceneGraph( JSON.parse( req.responseText ) ) ).then( function ( child ) {
                        if ( cbfunc ) {
                            cbfunc( child );
                        }
                        node.addChild( child );
                        removeLoading( node, child );
                        osg.log( 'success ' + url );
                    } );
                }
                else {
                    removeLoading( node, child );
                    osg.log( 'error ' + url );
                }
            }
        };
        req.send( null );
        addLoading();
    };

    loadModel( 'model/Cerberus_by_Andrew_Maximov.osgjs' );
    return node;
};
