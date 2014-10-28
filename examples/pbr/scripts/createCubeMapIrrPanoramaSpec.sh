
dir="$(pwd)"
input="$(readlink -f ${1})"
size="${3:-128}"

filename=$(basename "$input")

function encodeTexture()
{
    local input="${1}"

    local outputdir="${2-$(dirname ${input})}"

    local filename=$(basename "$input")
    local filename_without_extension="${filename%.*}"

    mkdir -p "${outputdir}"
    local output="${outputdir}/${filename_without_extension}.png"
    cd ~/dev/rgbx/build && ./rgbx -m rgbe "${input}" "${output}"
}

function convert_cubemap_face()
{
    local input="${1}"
    local num="${3}"
    local out="${2}_${num}.tif"

    oiiotool "${input}" --subimage "${num}" -o "${out}"
    encodeTexture "${out}"
}

function create_cubemap()
{
    local input="${1}"
    dirdest="${2}"


    convert_cubemap_face "${input}" "${dirdest}" 0
    convert_cubemap_face "${input}" "${dirdest}" 1
    convert_cubemap_face "${input}" "${dirdest}" 2
    convert_cubemap_face "${input}" "${dirdest}" 3
    convert_cubemap_face "${input}" "${dirdest}" 4
    convert_cubemap_face "${input}" "${dirdest}" 5
    echo "generated cubemap ${filename}"
}

function create_irr_cubemap()
{
    local in="${1}"
    local out="${2}"
    local tmp="/tmp/irr.tif"
    cd ~/dev/envtools/build && ./envtoirr -n $size "${in}" "${tmp}" >/tmp/create_irr_cubemap
    shCoef="$(grep "shCoef:" /tmp/create_irr_cubemap | cut -d ':' -f2 )"
    echo "${shCoef}" > ${out}/spherical
    create_cubemap "${tmp}" "${out}/cubemap_irradiance"
}

destdir="${2:-$(dirname $input)/output}"
mkdir -p ${destdir}
destdir="$(readlink -f ${destdir})"

iconvert "${input}" "/tmp/panorama.tif"
generic="/tmp/input_cubemap.tif"
cd ~/dev/envtools/build && ./envremap -o cube -n $size "/tmp/panorama.tif" "${generic}"

create_irr_cubemap "${generic}" "${destdir}"

#original for panorama specular
encodeTexture "/tmp/panorama.tif" "${destdir}"
if [ "${destdir}" != "$(dirname $input)" ]
then
    rm ${destdir}/*tif
fi