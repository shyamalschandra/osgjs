dir="$(pwd)"
input="$(readlink -f $1)"
output="$(readlink -f $2)"

filename=$(basename "$input")

ibl_target="/tmp/${filename}_ibl.tif"
cd ~/dev/envtools/ && ./build_ibl_specular.sh "${input}" "${ibl_target}"

method="rgbm"
range="$(iinfo --stats ${ibl_target} | grep Max | sed 's/ *Stats Max://' | sed 's/(float)//g' | tr ' ' '\n' | sort -r | head -1 )"
cd ~/dev/rgbx/build && ./rgbx -m ${method} -r ${range} "${ibl_target}" "${output}"
cd ${dir}
