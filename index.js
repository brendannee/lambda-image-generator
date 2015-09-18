var jade = require('jade');
var moment = require('moment-timezone');
var path = require('path');
var webshot = require('webshot');


function formatDate(time, timezone) {
  try {
    return moment(time).tz(timezone).format('MMM D, YYYY');
  } catch(e) {
    return moment(time).format('MMM D, YYYY');
  }
}


function formatTime(time, timezone) {
  try {
    return moment(time).tz(timezone).format('h:mm A');
  } catch(e) {
    return moment(time).format('h:mm A');
  }
}


function formatDuration(s) {
  var result = {
    duration: formatDurationMinutes(s),
    duration_type: 'min'
  };

  if(result.duration >= 60) {
    result.duration = formatDurationHoursMinutes(s);
    result.duration_type = 'hrs';
  }

  return result;
}


function formatDurationHoursMinutes(s) {
  var duration = moment.duration(s, 'seconds');
  return Math.floor(duration.asHours()) + ':' + moment(duration.minutes(), 'm').format('mm');
}


function formatDurationMinutes(s) {
  var duration = moment.duration(s, 'seconds'),
      minutes = duration.asMinutes();
  return minutes ? minutes.toFixed(0) : '';
}


function m_to_mi(distance_m) {
  return distance_m / 1609.34;
}


function formatDistance(distance) {
  if(Math.round(distance) >= 100) {
    return distance.toFixed(0);
  } else {
    return (distance || 0).toFixed(1);
  }
}


function cleanAddress(address) {
  if(!address) {
    address = {};
  }

  address.cleaned = (address && address.name) ? address.name.replace(/\d+, USA/gi, '') : '';
  return address;
}


function formatTrip(trip) {
  trip.start_address = cleanAddress(trip.start_address);
  trip.end_address = cleanAddress(trip.end_address);
  trip.distance = formatDistance(m_to_mi(trip.distance_m));
  trip.started_at_time = formatTime(trip.started_at, trip.start_timezone);
  trip.started_at_date = formatDate(trip.started_at, trip.start_timezone);
  trip.ended_at_time = formatTime(trip.ended_at, trip.end_timezone);
  trip.ended_at_date = formatDate(trip.ended_at, trip.end_timezone);

  var duration = formatDuration(trip.duration_s);

  trip.duration = duration.duration;
  trip.duration_type = duration.duration_type;

  return trip;
}


// generate receipt image
function createReceipt(trip, cb) {
  var options = {
    siteType: 'html',
    streamType: 'png',
    takeShotOnCallback: true,
    timeout: 30000,
    windowSize: {width: 660, height: 660}
  };

  // if running on lambda, use the correct binary
  if(process.platform !== 'darwin') {
    options.phantomPath = path.join(__dirname, 'phantomjs');
  }

  webshot(jade.renderFile('./views/receipt.jade', trip), options, cb);
}


function getMapImage(trip) {
  if(!trip.path) {
    return;
  }

  var mapboxAccessToken = 'pk.eyJ1IjoiYXV0b21hdGljIiwiYSI6IlJaN2plLTAifQ.mMkxz6NUQIQD8L_LkjXnwQ',
      layer = 'automatic.idonii25',
      size = '580x350',
      zoom = 'auto',
      overlays = [];

  overlays.push('pin-l-a+08b1d5(' + trip.start_location.lon + ',' + trip.start_location.lat + ')');
  overlays.push('pin-l-b+08b1d5(' + trip.end_location.lon + ',' + trip.end_location.lat + ')');

  if(trip.path) {
    overlays.push('path-4+08b1d5-0.9(' + encodeURIComponent(trip.path) + ')');
  }

  return 'http://api.tiles.mapbox.com/v4/' + layer + '/' + overlays.join(',') + '/' + zoom + '/' + size + '.png?access_token=' + mapboxAccessToken;
}


exports.handler = function(event, context) {
  var trip = event;

  if (!trip) {
    return context.done(new Error('Invalid Input'));
  }

  trip.mapURL = getMapImage(trip);

  createReceipt(formatTrip(trip), function(e, renderStream) {
    if (e) {
      console.error(e);
      return context.done(e);
    }

    // collect all the parts
    var bufs = [];
    renderStream
    .on('data', function(d) {
      bufs.push(d);
    })
    .on('error', function(e) {
      return context.done(e);
    })
    .on('end', function(){
      if (bufs.length) {
        var receipt = Buffer.concat(bufs);
        context.done(null, receipt.toString('base64'));
      } else {
        return context.done(new Error('No image'));
      }
    });
  });
};


exports.html = function(event, context) {
  var trip = event;

  if (!trip) {
    return context.done(new Error('Invalid Input'));
  }

  trip.mapURL = getMapImage(trip);

  var html = jade.renderFile('./views/receipt.jade', formatTrip(trip));

  context.done(null, html);
};
