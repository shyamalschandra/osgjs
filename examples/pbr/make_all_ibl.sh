
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

list="Alexs_Apartment/Alexs_Apt_2k.hdr Arches_E_PineTree/Arches_E_PineTree_3k.hdr GrandCanyon_C_YumaPoint/GCanyon_C_YumaPoint_3k.hdr Milkyway/Milkyway_small.hdr Walk_Of_Fame/Mans_Outside_2k.hdr Allego/panorama_map.hdr"

makeibl "$list"
