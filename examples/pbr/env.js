var readHDRImage =  (function ( Q, OSG ) {

    function decodeHDRHeader( buf ) {
        var info = {
            exposure: 1.0
        };

        // find header size
        var size = -1,
            size2 = -1;

        var i;
        for ( i = 0; i < buf.length - 1; i++ ) {
            if ( buf[ i ] === 10 && buf[ i + 1 ] === 10 ) {
                size = i;
                break;
            }
        }
        for ( i = size + 2; i < buf.length - 1; i++ ) {
            if ( buf[ i ] === 10 ) {
                size2 = i;
                break;
            }
        }


        var line;
        var matches;
        // convert header from binary to text lines
        var header = String.fromCharCode.apply( null, new Uint8Array( buf.subarray( 0, size ) ) ); // header is in text format
        var lines = header.split( '\n' );
        if ( lines[ 0 ] !== '#?RADIANCE' ) {
            console.error( 'Invalid HDR image.' );
            return false;
        }
        for ( i = 0; i < lines.length; i++ ) {
            line = lines[ i ];
            matches = line.match( /(\w+)=(.*)/i );
            if ( matches != null ) {
                var key = matches[ 1 ],
                    value = matches[ 2 ];

                if ( key === 'FORMAT' )
                    info.format = value;
                else if ( key === 'EXPOSURE' )
                    info.exposure = parseFloat( value );
            }
        }

        // fill image resolution
        line = String.fromCharCode.apply( null, new Uint8Array( buf.subarray( size + 2, size2 ) ) );
        matches = line.match( /-Y (\d+) \+X (\d+)/ );
        info.width = parseInt( matches[ 2 ] );
        info.height = parseInt( matches[ 1 ] );
        info.scanlineWidth = parseInt( matches[ 2 ] );
        info.numScanlines = parseInt( matches[ 1 ] );

        info.size = size2 + 1;
        return info;
    }

    var osg = OSG.osg;


    // Read a radiance .hdr file (http://radsite.lbl.gov/radiance/refer/filefmts.pdf)
    // Ported from http://www.graphics.cornell.edu/~bjw/rgbe.html
    var readHDRImage = function ( url, options ) {

        if ( options === undefined ) {
            options = {};
        }

        var img = {
            'data': null,
            'width': 0,
            'height': 0
        };

        // download .hdr file
        var xhr = new XMLHttpRequest();
        xhr.open( 'GET', url, true );
        xhr.responseType = 'arraybuffer';

        var defer = Q.defer();
        xhr.onload = function ( ev ) {
            if ( xhr.response ) {
                var bytes = new Uint8Array( xhr.response );

                var header = decodeHDRHeader( bytes );
                if ( header === false )
                    return;

                // initialize output buffer
                var data = new Uint8Array( header.width * header.height * 4 );
                var imgOffset = 0;

                if ( ( header.scanlineWidth < 8 ) || ( header.scanlineWidth > 0x7fff ) ) {
                    console.error( 'not rle compressed .hdr file' );
                    return;
                }

                // read in each successive scanline
                var scanlineBuffer = new Uint8Array( 4 * header.scanlineWidth );
                var readOffset = header.size;
                var numScanlines = header.numScanlines;
                var count;
                while ( numScanlines > 0 ) {
                    var offset = 0;
                    var rgbe = [ bytes[ readOffset++ ], bytes[ readOffset++ ], bytes[ readOffset++ ], bytes[ readOffset++ ] ];
                    var buf = [ 0, 0 ];

                    if ( ( rgbe[ 0 ] !== 2 ) || ( rgbe[ 1 ] !== 2 ) || ( rgbe[ 2 ] & 0x80 ) ) {
                        console.error( 'this file is not run length encoded' );
                        return;
                    }

                    if ( ( ( rgbe[ 2 ] ) << 8 | rgbe[ 3 ] ) !== header.scanlineWidth ) {
                        console.error( 'wrong scanline width' );
                        return;
                    }

                    var i;
                    // read each of the four channels for the scanline into the buffer
                    for ( i = 0; i < 4; i++ ) {
                        var offsetEnd = ( i + 1 ) * header.scanlineWidth;
                        while ( offset < offsetEnd ) {
                            buf[ 0 ] = bytes[ readOffset++ ];
                            buf[ 1 ] = bytes[ readOffset++ ];

                            if ( buf[ 0 ] > 128 ) {
                                // a run of the same value
                                count = buf[ 0 ] - 128;
                                if ( ( count === 0 ) || ( count > offsetEnd - offset ) ) {
                                    console.error( 'bad scanline data' );
                                    return;
                                }
                                while ( count-- > 0 )
                                    scanlineBuffer[ offset++ ] = buf[ 1 ];
                            }
                            else {
                                // a non-run
                                count = buf[ 0 ];
                                if ( ( count === 0 ) || ( count > offsetEnd - offset ) ) {
                                    console.error( 'bad scanline data' );
                                    return;
                                }
                                scanlineBuffer[ offset++ ] = buf[ 1 ];

                                if ( --count > 0 ) {
                                    while ( count-- > 0 ) {
                                        scanlineBuffer[ offset++ ] = bytes[ readOffset++ ];
                                    }
                                }
                            }
                        }
                    }

                    // fill the image array
                    for ( i = 0; i < header.scanlineWidth; i++ ) {
                        data[ imgOffset++ ] = scanlineBuffer[ i ];
                        data[ imgOffset++ ] = scanlineBuffer[ i + header.scanlineWidth ];
                        data[ imgOffset++ ] = scanlineBuffer[ i + 2 * header.scanlineWidth ];
                        data[ imgOffset++ ] = scanlineBuffer[ i + 3 * header.scanlineWidth ];
                    }

                    numScanlines--;
                }

                // send deferred info
                img.data = data;
                img.width = header.width;
                img.height = header.height;
                defer.resolve( img );
            }
        };

        // async/defer
        xhr.send( null );
        return defer.promise;
    };

    return readHDRImage;

})( window.Q, window.OSG );
