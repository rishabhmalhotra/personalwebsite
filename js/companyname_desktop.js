// List of sentences
var _CONTENT = [
    "\<pre\> def Block():\<br\>      building_blocks = [\"Square\", \<br\>                         \"Cash App\", \<br\>                         \"Spiral\", \<br\>                         \"Tidal\", \<br\>                         \"Proto\"] \<br\>\<br\>      return building_blocks[0] \<\/pre\>"
];

// Current sentence being processed
var _PART = 0;

// Character number of the current sentence being processed
var _PART_INDEX = 0;

// Holds the handle returned from setInterval
var _INTERVAL_VAL;

// Element that holds the text
var _ELEMENT = document.querySelector("#text");

// Only do this a few times
var cur_times = 1;
var total_times = 1;

// Implements typing effect
function Type() {
    var text = _CONTENT[_PART].substring(0, _PART_INDEX + 1);
    _ELEMENT.innerHTML = text;
    _ELEMENT.href = "squareup.com";
    _PART_INDEX++;

    // If full sentence has been displayed then start to delete the sentence after some time
    if (text === _CONTENT[_PART] && cur_times <= total_times) {
        cur_times++;
    }
}

function callType() {
    _INTERVAL_VAL = setInterval(Type, 35);
}

_INTERVAL_VAL = setTimeout(callType, 6000);