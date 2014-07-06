
size=512
path="textures/"


function makeibl()
{
    list="${1}"
    for texture in ${list}
    do
        ./make_ibl.sh ${path}/${texture} ${size}
    done
}

function makemipmap()
{
    opath=$(pwd)
    list="${1}"
    for texture in ${list}
    do
        cd ${opath}
        f="$(readlink -f ${path}/${texture})"
        dirname=$(dirname "$f")
        filename=$(basename "$f")
        filename_without_extension="${filename%.*}"

        fout="/tmp/${filename}_mip.tif"

        final="${dirname}/${filename_without_extension}_mip_rgbe.png"
        filename_without_extension="${filename%.*}"

        cd ~/dev/envtools && ./build_multires.sh ${f} ${fout} ${size}
        cd ~/dev/rgbx/build && ./rgbx -m rgbe ${fout} ${final}
    done
}

list="Alexs_Apartment/Alexs_Apt_2k.hdr Arches_E_PineTree/Arches_E_PineTree_3k.hdr GrandCanyon_C_YumaPoint/GCanyon_C_YumaPoint_3k.hdr Milkyway/Milkyway_small.hdr Walk_Of_Fame/Mans_Outside_2k.hdr Allego/panorama_map.hdr"

#makeibl "$list"
makemipmap "$list"
