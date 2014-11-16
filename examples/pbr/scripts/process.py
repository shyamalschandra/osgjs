import subprocess
import sys
import os
import time
import math
import OpenImageIO as oiio
import array


def execute_command(cmd, **kwargs):

    try:
        start = 0
        end = 0
        if kwargs.get("profile", True):
            start = time.time()

        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, shell=True)

        if kwargs.get("profile", True):
            end = time.time()

        if kwargs.get("verbose", True) or kwargs.get("print_command", False):
            print ("{} - {}".format(end - start, cmd))

        if kwargs.get("verbose", True) and output:
            print (output)

        return output

    except subprocess.CalledProcessError as error:
        print("error {} executing {}".format(error.returncode, cmd))
        print(error.output)
        sys.exit(1)
        return None


class ProcessEnvironment(object):

    def __init__(self, input_file, output_directory, **kwargs):
        self.input_file = os.path.abspath(input_file)
        self.output_directory = output_directory
        self.specular_size = kwargs.get("specular_size", 512 )
        self.irradiance_size = kwargs.get("irradiance_size", 32 )
        self.pattern_filter = kwargs.get("pattern_filter", "rgss" )

    def encode_texture(self, input_file, output_directory=None):

        if not output_directory:
            output_directory = os.path.dirname(input_file)

        filename = os.path.basename(input_file)
        filename_without_extension = os.path.splitext(filename)[0]

        output = os.path.join(output_directory, filename_without_extension) + ".png"

        cmd = "~/dev/rgbx/build/rgbx -m rgbe {} {}".format(input_file, output)
        output = execute_command(cmd, verbose=False)

    def extract_cubemap_face_and_encode(self, input, output, index):

        output_file = "{}_{}.tif".format(output, index)
        cmd = "oiiotool {} -subimage {} -o {}".format(input, index, output_file)
        execute_command(cmd)
        self.encode_texture(output_file)

    def create_cubemap(self, input_cubemap, output_directory):

        for cubemap_face in range(0, 6):
            self.extract_cubemap_face_and_encode(input_cubemap, output_directory, cubemap_face)

    def compute_irradiance(self, input):

        tmp = "/tmp/irr.tif"

        cmd = "~/dev/envtools/build/envtoirr -n {} {} {}".format(self.irradiance_size, input, tmp)
        output_log = execute_command(cmd, verbose=False, print_command=True)

        lines_list = output_log.split("\n")
        for line in lines_list:
            index = line.find("shCoef:")
            if index != -1:
                self.sh_coef = line[line.find(":") + 1:]
                with open(self.output_directory + "spherical", "w") as f:
                    f.write(self.sh_coef)
                break

        self.create_cubemap(tmp, os.path.join(self.output_directory, "cubemap_irradiance"))

        # compute the panorama version of irradiance
        panorama_size = self.irradiance_size * 2
        panorama_irradiance = "/tmp/panorama_irradiance.tif"

        cmd = "~/dev/envtools/build/envremap -n {} -i cube -o rect {} {}".format( panorama_size, tmp, panorama_irradiance)
        execute_command(cmd)

        self.encode_texture(panorama_irradiance, self.output_directory)

    def cubemap_fix_border(self, input, level):
        cmd = "~/dev/envtools/build/fixedge {} {}".format(input, level)
        execute_command(cmd)

    def cubemap_packer(self, pattern, max_level):
        cmd = "~/dev/envtools/build/packer {} {} {}".format(pattern, max_level, self.output_directory)
        execute_command(cmd)

        cmd = "gzip -f {}".format(os.path.join(self.output_directory, "*.bin"))
        execute_command(cmd)

    def cubemap_specular(self, input):

        max_level = int(math.log(self.specular_size) / math.log(2))

        previous_file = self.cubemap_generic
        self.cubemap_fix_border(previous_file, 0)

        for i in range(1, max_level + 1):
            size = int(math.pow(2, max_level - i))
            outout_filename = "/tmp/specular_{}.tif".format(i)
            cmd = "~/dev/envtools/build/envremap -p {} -n {} -i cube -o cube {} {}".format(self.pattern_filter, size, previous_file, outout_filename)
            previous_file = outout_filename
            execute_command(cmd)
            self.cubemap_fix_border(outout_filename, i)

        self.cubemap_packer("/tmp/fixup_%d_%d.tif", max_level)


    def panorama_specular(self, input):

        # compute the panorama from cubemap specular
        panorama_size = self.specular_size * 2
        panorama_specular = "/tmp/panorama.tif"
        cmd = "~/dev/envtools/build/envremap -p {} -n {} -i rect -o rect {} {}".format( self.pattern_filter, panorama_size, input, panorama_specular)
        execute_command(cmd)

        self.encode_texture(panorama_specular, self.output_directory)

    def run(self):

        start = time.time()

        if not os.path.exists(self.output_directory):
            os.makedirs(self.output_directory)

        cubemap_generic = "/tmp/input_cubemap.tif"

        original_file = "/tmp/original_panorama.tif"
        cmd = "iconvert {} {}".format(self.input_file, original_file )
        execute_command(cmd)

        cmd = "~/dev/envtools/build/envremap -p {} -o cube -n {} {} {}".format(self.pattern_filter, self.specular_size, original_file, cubemap_generic)
        self.cubemap_generic = cubemap_generic
        execute_command(cmd)

        # create cubemap original
        # we could remove this later
        self.create_cubemap(cubemap_generic, os.path.join(self.output_directory, 'cubemap'))

        # generate irradiance*PI panorama/cubemap/sph
        self.compute_irradiance(cubemap_generic)

        # generate specular
        self.cubemap_specular(cubemap_generic)

        # generate panorama specular
        self.panorama_specular(original_file)



        print ("processed in {} seconds".format(time.time() - start))


argv = sys.argv
input_file = argv[1]
output_directory = argv[2]
#pattern_filter = argv[3]

process = ProcessEnvironment(input_file, output_directory, pattern_filter = "box2")
process.run()


# create a cubemap for original to max size we will use


# compute irradiance
# compute irrandiance from cubemap
# extract spherical harmonics

# convert cubemap irradiance to panorama

# encode panorama irradiance to png rgbe
# encode cubemap irradiance to png rgbe


# specular
# for all mipmap level
# resize and fixEdge
# pack and encode
