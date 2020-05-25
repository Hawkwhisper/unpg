onmessage = function(e) {
    var dat = e.data;

    dat._renderable = false;
    if (dat.x < -dat.w && dat.y < -dat.h &&
        dat.x > dat.sw + dat.w && dat.y > dat.sh + dat.h) {
        dat._renderable = true;
    }
    postMessage(dat);
}