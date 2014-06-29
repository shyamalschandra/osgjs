dir="$(pwd)"
input="$(readlink -f $1)"
size="$2"

filename=$(basename "$input")
dirname=$(dirname "$input")
filename_without_extension="${filename%.*}"


method="rgbm"
function get_range()
{
    range="$(iinfo --stats $1 | grep Max | sed 's/ *Stats Max://' | sed 's/(float)//g' | tr ' ' '\n' | sort -r | head -1 )"
    echo "${range}"
}


function create_specular()
{
    ibl_target="/tmp/${filename}_ibl.tif"
    cd ~/dev/envtools/ && ./build_ibl_specular.sh "${input}" "${ibl_target}" "${size}"

    file_range=$(get_range "${ibl_target}" )


    output="${dirname}/${filename_without_extension}_spec_${method}_${file_range}.png"

    cd ~/dev/rgbx/build && ./rgbx -m ${method} -r ${file_range} "${ibl_target}" "${output}"
    echo "generated specular ${output}"
}

function create_diffuse()
{
    cd ~/dev/envtools/ && ./envtoirr -f /tmp/cubemap.tif /tmp/diffuse_cubemap.tif
    ./envremap -i cube -n 128 /tmp/diffuse_cubemap.tif /tmp/diffuse_rect.tif

    file_range=$(get_range "/tmp/diffuse_rect.tif" )
    output_env="${dirname}/${filename_without_extension}_diff_${method}_${file_range}.png"
    cd ~/dev/rgbx/build && ./rgbx -m ${method} -r ${file_range} /tmp/diffuse_rect.tif "${output_env}"
    echo "generated diffuse ${output_env}"
}

create_specular
create_diffuse

cd ${dir}
