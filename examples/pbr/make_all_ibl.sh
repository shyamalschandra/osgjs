
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

#list="Alexs_Apartment/Alexs_Apt_2k.hdr Arches_E_PineTree/Arches_E_PineTree_3k.hdr GrandCanyon_C_YumaPoint/GCanyon_C_YumaPoint_3k.hdr Walk_Of_Fame/Mans_Outside_2k.hdr Allego/panorama_map.hdr HDR_Free_City_Night_Lights/HDR_Free_City_Night_Lights_Ref.hdr"
list="Gdansk_shipyard_buildings/Gdansk_shipyard_buildings.exr abandoned_sanatorium_staircase/abandoned_sanatorium_staircase.exr airport/airport.exr bus_garage/bus_garage.exr cave_entry_in_the_forest/cave_entry_in_the_forest.exr elevator_corridor/elevator_corridor.exr glazed_patio/glazed_patio.exr industrial_room/industrial_room.exr panorama_map/panorama_map.hdr road_in_tenerife_mountain/road_in_tenerife_mountain.exr small_apartment/small_apartment.exr studio_02/studio_02.exr studio/studio.exr terrace_near_the_granaries/terrace_near_the_granaries.exr urban_exploring_interior/urban_exploring_interior.exr mestaty/test-mestaty.hdr"


makeibl "$list"
