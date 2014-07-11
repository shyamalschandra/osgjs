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

function encodeTexture()
{
    local input="${1}"
    outputdir="${2}"
    file_range=$(get_range "${input}" )

    local filename=$(basename "$input")
    local filename_without_extension="${filename%.*}"

    mkdir -p "${outputdir}/rgbm"
    output="${outputdir}/rgbm/${filename_without_extension}_${file_range}.png"
    cd ~/dev/rgbx/build && ./rgbx -m rgbm -r ${file_range} "${input}" "${output}"

    mkdir -p "${outputdir}/rgbe"
    output="${outputdir}/rgbe/${filename_without_extension}.png"
    cd ~/dev/rgbx/build && ./rgbx -m rgbe "${input}" "${output}"
}

function create_prefiltered_specular()
{
    local input="${1}"
    dirdest="${2}"

    ibl="${dirdest}/${filename_without_extension}_spec.tif"
    cd ~/dev/envtools/ && ./build_ibl_specular.sh "${input}" "${ibl}" "${size}"

    encodeTexture "${ibl}" "${dirdest}/prefilter"
    echo "generated specular ${filename}"
}

function create_prefiltered_diffuse()
{
    local input="${1}"
    dirdest="${2}"

    ibl="${dirdest}/${filename_without_extension}_diff.tif"

    cd ~/dev/envtools/ && ./envtoirr -f ${input} /tmp/diffuse_cubemap.tif
    ./envremap -i cube -n 128 /tmp/diffuse_cubemap.tif "${ibl}"

    encodeTexture "${ibl}" "${dirdest}/prefilter"
    echo "generated diffuse ${filename}"
}


function create_background()
{
    in="${1}"
    dirdest="${2}"
    out="${dirdest}/${filename_without_extension}_bg.jpg"

    oiiotool "${in}" --resize "${size}x${size}" -o /tmp/bg_square.tif
    cd ~/dev/sht/ && ./shtrans -g128 -o /tmp/bg.tif /tmp/bg_square.tif && ./shtrans -i -o /tmp/bg_blurred.tif /tmp/bg.tif

    let "h=${size}/2"
    oiiotool /tmp/bg_blurred.tif --resize "${size}x${h}" -o "${out}"
    echo "generated background ${filename}"
}


function create_mipmap()
{
    local input="${1}"
    dirdest="${2}"

    out="${dirdest}/${filename_without_extension}_mip.tif"

    cd ~/dev/envtools && ./build_multires.sh ${input} ${out} ${size}

    encodeTexture "${out}" "${dirdest}/solid"
    echo "generated mipmap ${filename}"
}


iconvert "${input}" "/tmp/input.tif"
generic="/tmp/input_cubemap.tif"
cd ~/dev/envtools/ && ./envremap -o cube -n $size "/tmp/input.tif" "${generic}"
destdir="${dirname}"


create_prefiltered_specular "${generic}" "${destdir}"
create_prefiltered_diffuse "${generic}" "${destdir}"
create_background "${input}" "${destdir}"
create_mipmap "${input}" "${destdir}"
