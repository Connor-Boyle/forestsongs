module.exports = function(cb){
  var audioContext = new AudioContext()

  navigator.getUserMedia(
      	{
              "audio": {
                  "mandatory": {
                      "googEchoCancellation": "false",
                      "googAutoGainControl": "false",
                      "googNoiseSuppression": "false",
                      "googHighpassFilter": "false"
                  },
                  "optional": []
              },
          }, gotStream, handleError);
  function handleError(err){
    throw err
  }

  function gotStream(stream) {
      var buflen = 1024;
      var buf = new Float32Array( buflen );
      // Create an AudioNode from the stream.
      var mediaStreamSource = audioContext.createMediaStreamSource(stream);

      // Connect it to the destination.
      var analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      mediaStreamSource.connect( analyser );
      function render(){
        analyser.getFloatTimeDomainData( buf );
  	    var ac = autoCorrelate( buf, audioContext.sampleRate );
        cb(ac)
      }
      setInterval(render, 1000/60)
  }

  function filterVoice()

  function findNote(filteredStream) {
      var notes = [{note:"C", frequency:256.87},
                   {note:"D", frequency:288.33},
                   {note:"E", frequency:323.63},
                   {note:"F", frequency:342.88},
                   {note:"G", frequency:384.87},
                   {note:"A", frequency:432.00},
                   {note:"B", frequency:484.90}
                 ]
  }

  var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
  var GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

  function autoCorrelate( buf, sampleRate ) {
  	var SIZE = buf.length;
  	var MAX_SAMPLES = Math.floor(SIZE/2);
  	var best_offset = -1;
  	var best_correlation = 0;
  	var rms = 0;
  	var foundGoodCorrelation = false;
  	var correlations = new Array(MAX_SAMPLES);

  	for (var i=0;i<SIZE;i++) {
  		var val = buf[i];
  		rms += val*val;
  	}
  	rms = Math.sqrt(rms/SIZE);
  	if (rms<0.01) // not enough signal
  		return -1;

  	var lastCorrelation=1;
  	for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
  		var correlation = 0;

  		for (var i=0; i<MAX_SAMPLES; i++) {
  			correlation += Math.abs((buf[i])-(buf[i+offset]));
  		}
  		correlation = 1 - (correlation/MAX_SAMPLES);
  		correlations[offset] = correlation; // store it, for the tweaking we need to do below.
  		if ((correlation>GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
  			foundGoodCorrelation = true;
  			if (correlation > best_correlation) {
  				best_correlation = correlation;
  				best_offset = offset;
  			}
  		} else if (foundGoodCorrelation) {
  			// short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
  			// Now we need to tweak the offset - by interpolating between the values to the left and right of the
  			// best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
  			// we need to do a curve fit on correlations[] around best_offset in order to better determine precise
  			// (anti-aliased) offset.

  			// we know best_offset >=1,
  			// since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
  			// we can't drop into this clause until the following pass (else if).
  			var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];
  			return sampleRate/(best_offset+(8*shift));
  		}
  		lastCorrelation = correlation;
  	}
  	if (best_correlation > 0.01) {
  		// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
  		return sampleRate/best_offset;
  	}
  	return -1;
  //	var best_frequency = sampleRate/best_offset;
  }

}
