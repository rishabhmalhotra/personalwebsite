// /**
//  * Sets up Justified Gallery.
//  */
// if (!!$.prototype.justifiedGallery) {
//     var options = {
//         rowHeight: 140,
//         margins: 4,
//         lastRow: "justify"
//     };
//     $(".article-gallery").justifiedGallery(options);
// }

// $(document).ready(function() {

//     /**
//      * Shows the responsive navigation menu on mobile.
//      */
//     $("#header > #nav > ul > .icon").click(function() {
//         $("#header > #nav > ul").toggleClass("responsive");
//     });


//     /**
//      * Controls the different versions of  the menu in blog post articles
//      * for Desktop, tablet and mobile.
//      */
//     if ($(".post").length) {
//         var menu = $("#menu");
//         var nav = $("#menu > #nav");
//         var menuIcon = $("#menu-icon, #menu-icon-tablet");

//         /**
//          * Display the menu on hi-res laptops and desktops.
//          */
//         if ($(document).width() >= 1440) {
//             menu.css("visibility", "visible");
//             menuIcon.addClass("active");
//         }

//         /**
//          * Display the menu if the menu icon is clicked.
//          */
//         menuIcon.click(function() {
//             if (menu.css("visibility") === "hidden") {
//                 menu.css("visibility", "visible");
//                 menuIcon.addClass("active");
//             } else {
//                 menu.css("visibility", "hidden");
//                 menuIcon.removeClass("active");
//             }
//             return false;
//         });

//         /**
//          * Add a scroll listener to the menu to hide/show the navigation links.
//          */
//         if (menu.length) {
//             $(window).on("scroll", function() {
//                 var topDistance = menu.offset().top;

//                 // hide only the navigation links on desktop
//                 if (!nav.is(":visible") && topDistance < 50) {
//                     nav.show();
//                 } else if (nav.is(":visible") && topDistance > 100) {
//                     nav.hide();
//                 }

//                 // on tablet, hide the navigation icon as well and show a "scroll to top
//                 // icon" instead
//                 if (!$("#menu-icon").is(":visible") && topDistance < 50) {
//                     $("#menu-icon-tablet").show();
//                     $("#top-icon-tablet").hide();
//                 } else if (!$("#menu-icon").is(":visible") && topDistance > 100) {
//                     $("#menu-icon-tablet").hide();
//                     $("#top-icon-tablet").show();
//                 }
//             });
//         }

//         /**
//          * Show mobile navigation menu after scrolling upwards,
//          * hide it again after scrolling downwards.
//          */
//         if ($("#footer-post").length) {
//             var lastScrollTop = 0;
//             $(window).on("scroll", function() {
//                 var topDistance = $(window).scrollTop();

//                 if (topDistance > lastScrollTop) {
//                     // downscroll -> show menu
//                     $("#footer-post").hide();
//                 } else {
//                     // upscroll -> hide menu
//                     $("#footer-post").show();
//                 }
//                 lastScrollTop = topDistance;

//                 // close all submenu"s on scroll
//                 $("#nav-footer").hide();
//                 $("#toc-footer").hide();
//                 $("#share-footer").hide();

//                 // show a "navigation" icon when close to the top of the page,
//                 // otherwise show a "scroll to the top" icon
//                 if (topDistance < 50) {
//                     $("#actions-footer > #top").hide();
//                 } else if (topDistance > 100) {
//                     $("#actions-footer > #top").show();
//                 }
//             });
//         }
//     }
// });


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

const newMusicplayer = new musicPlayer();
