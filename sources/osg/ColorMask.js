define( [
    'osg/Utils',
    'osg/StateAttribute'
], function ( MACROUTILS, StateAttribute ) {

    var ColorMask = function ( red, green, blue, alpha ) {
        StateAttribute.call( this );

        if ( !arguments.length ) {
            this._red = true;
            this._green = true;
            this._blue = true;
            this._alpha = true;
        } else {
            this._red = red;
            this._green = green;
            this._blue = blue;
            this._alpha = alpha;
        }
    };

    ColorMask.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {
        attributeType: 'ColorMask',
        cloneType: function () {
            return new ColorMask();
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType;
        },
        apply: function ( state ) {
            var gl = state.getGraphicContext();
            gl.colorMask( this._red, this._green, this._blue, this._alpha );
        }
    } ), 'osg', 'ColorMask' );

    return ColorMask;
} );
