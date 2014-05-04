import sys
import os
import subprocess
import math
import json

original_target_size = 512

def executeCommand( args ):
    print ' '.join( args )
    subprocess.call( args )

def get_target_size( level ):
    return int(math.pow(2, level))

def get_final_filename( target_size, level, filename ):
    name, ext = os.path.splitext( os.path.basename( filename ) )
    dirname = os.path.dirname( source_filename )
    final_filename = os.path.join( dirname, name + "_%d_%d.png" % (target_size, level ) )
    return final_filename

def computeLevel( level, nb, filename ):

    name, ext = os.path.splitext( os.path.basename( filename ) )
    dirname = os.path.dirname( source_filename )

    target_size = get_target_size( level )
    ratio_size = (level*1.0)/float(nb-1)
    target_filename = os.path.join('/tmp/', name + "_%d_%d.tif" % (target_size, level ) )
    final_filename = get_final_filename( target_size, level, filename )
    #blursize = int( max(original_target_size * ratio_size, 10 ) )
    blursize = int(math.pow(2, level + 1))

    print "process blur of size %d on mipmap level %d - resolution %d " % ( blursize, level, target_size )
    executeCommand( [ "shtrans", '-g%d' % blursize , '-o', '/tmp/processing.tif', filename ] )
    executeCommand( [ "shtrans", '-i', '-o', target_filename, '/tmp/processing.tif' ] )
    executeCommand( [ "convert", target_filename, '/tmp/processing.hdr' ] )

    executeCommand( [ "hdr2png", '-i' , '/tmp/processing.hdr', "-o", final_filename, "-w" , str(target_size*2), "-h", str(target_size) ] )
    return {
        'name': final_filename,
        'level': level
    }

#target_filename = os.path.join('/tmp/',name + ".tif" )
#subprocess.call( [ "convert", str(target_filename), "-resize", "%dx" % target_size, target_filename ] )

nb_mipmaps = int( 1+math.floor( math.log( original_target_size,2 )) )

source_filename = sys.argv[1]
name, ext = os.path.splitext( os.path.basename( source_filename ) )
dirname = os.path.dirname( source_filename )

valid_filename = source_filename
if ext != 'tif':
    valid_filename = os.path.join( dirname, name + '.tif' )
    executeCommand( [ "convert", source_filename, "-resize", "%dx" % (original_target_size*2), "-colorspace", "sRGB", valid_filename ] )

print "generate %d mipmap level for file %s" % (nb_mipmaps, valid_filename )
config = []
#for i in range (0,nb_mipmaps-1):
#    config.append( computeLevel( i, nb_mipmaps, valid_filename ) )

# finish with last level
level = nb_mipmaps-1
target_size = get_target_size( level )
final_filename = get_final_filename( target_size, level, valid_filename )
executeCommand( [ "hdr2png", '-i' , valid_filename, "-o", final_filename, "-w" , str(target_size*2), "-h", str(target_size) ] )
config.append( {
    'name': final_filename,
    'level': level
})

print json.dumps(config)
