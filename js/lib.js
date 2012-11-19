// Build a human-readable string of the current date/time
function getDateTime() {
  var now_date = new Date();
  return now_date.toLocaleTimeString() + " - " + now_date.toLocaleDateString();
}

function getTimeDeltaToNow(past_timestamp) {
  var now_ts_normalized = new Date().getTime() / 1000;    
  return now_ts_normalized - past_timestamp;
}

// Build a human-readable string of the difference in time
function getTimeDeltaStr(time_delta) {	
  var seconds_in_minute = 60;
  var seconds_in_hour = 60 * seconds_in_minute;
  var seconds_in_day = 24 * seconds_in_hour;
  var seconds_in_week = 7 * seconds_in_day;
  var seconds_in_month = 30 * seconds_in_day;
  
  if (time_delta < seconds_in_minute) {
    return '1m';
    
  } else if (time_delta < seconds_in_hour) {
    return (time_delta / seconds_in_minute).toFixed(1) + ' min';
    
  } else if (time_delta < seconds_in_day) {
    return (time_delta / seconds_in_hour).toFixed(1) + ' hrs';
    
  } else if (time_delta < seconds_in_week) {
    return (time_delta / seconds_in_day).toFixed(1) + ' days';
    
  } else if (time_delta < seconds_in_month) {
    return (time_delta / seconds_in_week).toFixed(1) + ' wks';

  } else if (time_delta >= seconds_in_month) {
    return (time_delta / seconds_in_month).toFixed(1) + ' mon';
  }    
}
