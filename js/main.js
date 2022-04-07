var colors = new Array(
    [62, 35, 255], [60, 255, 60], [255, 35, 98], [45, 175, 230], [255, 0, 255], [255, 128, 0]);

var step = 0;
//color table indices for:
// current color left
// next color left
// current color right
// next color right
var colorIndices = [0, 1, 2, 3];

//transition speed
var gradientSpeed = 0.0015;

function updateGradient() {

    if ($ === undefined) return;

    var c0_0 = colors[colorIndices[0]];
    var c0_1 = colors[colorIndices[1]];
    var c1_0 = colors[colorIndices[2]];
    var c1_1 = colors[colorIndices[3]];

    var istep = 1 - step;
    var r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
    var g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
    var b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
    var color1 = "rgb(" + r1 + "," + g1 + "," + b1 + ")";

    var r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
    var g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
    var b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
    var color2 = "rgb(" + r2 + "," + g2 + "," + b2 + ")";

    $('#gradient').css({
        background: "-webkit-gradient(linear, left top, right top, from(" + color1 + "), to(" + color2 + "))"
    }).css({
        background: "-moz-linear-gradient(left, " + color1 + " 0%, " + color2 + " 100%)"
    });

    step += gradientSpeed;
    if (step >= 1) {
        step %= 1;
        colorIndices[0] = colorIndices[1];
        colorIndices[2] = colorIndices[3];

        //pick two new target color indices
        //do not pick the same as the current one
        colorIndices[1] = (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
        colorIndices[3] = (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;

    }
}

setInterval(updateGradient, 10);

// console.clear();

class musicPlayer {
    constructor() {
        this.play = this.play.bind(this);
        this.playBtn = document.getElementById('play');
        this.playBtn.addEventListener('click', this.play);
        this.controlPanel = document.getElementById('control-panel');
        this.infoBar = document.getElementById('info');
    }

    play() {
        let audio = new Audio('/music/forgetaboutme.mp3');

        let controlPanelObj = this.controlPanel,
            infoBarObj = this.infoBar
        Array.from(controlPanelObj.classList).find(function(element) {
            return element !== "active" ? controlPanelObj.classList.add('active') : controlPanelObj.classList.remove('active');
        });

        // audio.play();

        // Array.from(infoBarObj.classList).find(function(element) {
        //     return element !== "active" ? infoBarObj.classList.add('active') : infoBarObj.classList.remove('active');
        // });
        // audio.pause();
    }
}

// Decryption for text

var decrypted = document.getElementById("decoded");
var encrypted = document.getElementById("encoded");

function startdecrypt() {
    // Original text, split into an array and reversed (for faster pop())
    var originalText = decrypted.textContent.split('').reverse();
    var decryptedText = "";
    var i = 0;

    decrypted.textContent = "";

    setTimeout(function() {
        var shuffleInterval = setInterval(function() {

            // Generate random strings. You can modify the generator function range
            // (Math.random()*(to-from+1)+from);
            var shuffledText = '';
            var j = originalText.length;
            while (j--) shuffledText += String.fromCharCode((Math.random() * 94 + 33) | 0);

            // On every 10 cycles, remove a character from the original text to the decoded text
            if (i++ % 7 === 0) decryptedText += originalText.pop();

            // Display
            decrypted.textContent = decryptedText;
            encrypted.textContent = shuffledText;

            // Stop when done
            if (!shuffledText.length) clearInterval(shuffleInterval);
        }, 20);
    }, 2000);
}

if (window.addEventListener) {
    window.addEventListener('load', startdecrypt, false); //W3C
} else {
    window.attachEvent('onload', startdecrypt); //IE
}