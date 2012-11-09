$(function() {
  
  var jenkins_root_url = 'http://ci.cloudfoundry.org';
  var jenkins_views = []; 
  var default_refresh_secs = 60;
  var timer_id = 0;
  
  // Map Jenkins status colors -> status
  var map_color_to_status = { 
    blue: 'Success',
    blue_anime: 'Success',
    yellow: 'Unstable',
    yellow_anime: 'Unstable',
    red: 'Failed',
    red_anime: 'Failed',
    disabled: 'Disabled',
    grey: 'Disabled',
  };  
  
  // Initialize the UI
  $('#jenkins_root_url').text(jenkins_root_url);
  $('#refresh_in_x_secs').text(default_refresh_secs); 
  $('#enable_auto_refresh').show();
  $('#disable_auto_refresh').hide();
  refreshViews(jenkins_root_url);

  // Click this button to refetch data from Jenkins
  $('#refresh_now').on('click', function() {
    refreshViews(jenkins_root_url);
  });

  // Click these two buttons to Enable/Disable Auto-Refresh
  $('#enable_auto_refresh, #disable_auto_refresh').on('click', function() {
    $(this).hide();

    if ($(this).attr('id') == 'enable_auto_refresh') {
      refreshViews(jenkins_root_url);
      
      timer_id = setInterval(function() { 
        refreshViews(jenkins_root_url); 
      }, default_refresh_secs * 1000);
      
      $('#disable_auto_refresh').show();            
    } else if ($(this).attr('id') == 'disable_auto_refresh') {
      clearInterval(timer_id);
      
      $('#enable_auto_refresh').show();
    }
  });
    
  // Target a different Jenkins
  $('#update_jenkins_target').on('click', function() {
    if ($('#jenkins_target').val()) {
      jenkins_root_url = 'http://' + $('#jenkins_target').val();
      refreshViews(jenkins_root_url);
      $('#jenkins_root_url').text(jenkins_root_url);
      $('#jenkins_target').val('');
    }
    return false;
  });

  // Build a human-readable string of the current date/time
  function getDateTime() {
    var now_date = new Date();
    return now_date.toLocaleTimeString() + " - " + now_date.toLocaleDateString();
  }
  
  // Build a human-readable string of the difference in time
  function getTimeDeltaStr(past_timestamp) {
		
    var now_ts_normalized = new Date().getTime() / 1000;    
    var delta_seconds = now_ts_normalized - past_timestamp;
    var seconds_in_minute = 60;
    var seconds_in_hour = 60 * seconds_in_minute;
    var seconds_in_day = 24 * seconds_in_hour;
    var seconds_in_week = 7 * seconds_in_day;
    var seconds_in_month = 30 * seconds_in_day;
    
    if (delta_seconds < seconds_in_minute) {
      return '1m';
      
    } else if (delta_seconds < seconds_in_hour) {
      return (delta_seconds / seconds_in_minute).toFixed(1) + 'm';
      
    } else if (delta_seconds < seconds_in_day) {
      return (delta_seconds / seconds_in_hour).toFixed(1) + 'h';
      
    } else if (delta_seconds < seconds_in_week) {
      return (delta_seconds / seconds_in_day).toFixed(1) + 'd';
      
    } else if (delta_seconds < seconds_in_month) {
      return (delta_seconds / seconds_in_week).toFixed(1) + 'w';

    } else if (delta_seconds >= seconds_in_month) {
      return (delta_seconds / seconds_in_week).toFixed(1) + 'w';
    }    
  }

	// -1 bad, 0 good, 1 warning
	function checkThreshold( name, value ) {

		var HOUR		          = 1;
		var GOOD              = 0;
		var BAD               = -1;
		var WARNING           = 1;
		
    THRESHOLDS = {
			"passed": { "bad": 80.0, "warning": 90.0, "good": 100.0 },
			"coverage": { "bad": 50.0, "warning": 60.0, "good": 70.0 },
			"last failed": { "bad": HOUR*4, "warning": HOUR*5, "good": HOUR*8 },
			"duration": { "bad": HOUR*4, "warning": HOUR*3, "good": HOUR } }
		
		threshold = THRESHOLDS[name];
		
		if( name == "last failed" || name == "duration") {
		
		  tcast		= value[value.length-1];
			
		  //alert(tcast);
		  if( tcast == 'd' || tcast == 'w' || tcast == 'h' ) {
				
				if(tcast == 'h') {
					
				  hours = parseFloat(value.substr( 0, value.length-1 ));
					//alert(hours);					
					if(hours >= threshold["good"]) {
						return GOOD;
					}
					else if(hours >= threshold["warning"] && hours < threshold["good"]) {
						return WARNING;
					}
					else {
						return BAD;
					}
					
				}
				else {
					return GOOD;
				}
				
			}
			else {
				return BAD;
			}
			
		}
		else {

		  if(value >= threshold["good"]) {
			  return GOOD;
			}
			else if( value >= threshold["warning"] && value < threshold["good"] ) {
				return WARNING;
			}
			else {
				return BAD;
			}

		}
		
	} // checkThreshold

	
  function refreshViews(jenkins_view_url) {
    $('#throbber').show();
    $('div.content_box').fadeOut('slow');
    $('div.content_box').remove();
    $('#updated_at').text( getDateTime() );
    
    // Define the tree structure of the JSON response from Jenkins
    jenkins_view_url += '/api/json?tree=views[name,url,jobs[name,color,url,lastFailedBuild[timestamp],healthReport[description,score]]]&jsonp=?';
    
    $.getJSON(jenkins_view_url, function(data) {
      $.each(data.views, function(index, view_data) {
        
        // To avoid overloading the UI, skip any Jenkins view named 'All'
        if (view_data.name.indexOf('All') >= 0) {
          return true;
        }

        var view_jobs = view_data.jobs;
        var view_jobs_coverage = [];
        var view_jobs_num_failing_tests = 0;
        var view_jobs_num_total_tests = 0;
        var view_jobs_list = [];
        var last_failed_builds = [];
        var map_jobs_to_num_tests = {};
        
        // Start building the HTML display
        var view_content_box = $('<div/>', { 
          class: 'content_box',
        });
              
        var view_title = '<h2><a href="' + view_data.url + '">' + view_data.name + '</a></h2>';
        view_content_box.append(view_title);
        
        $.each(view_jobs, function(index, job_data) {
          
          // Skip disabled jobs + jobs with specified ommitted prefixes
          if ( (job_data.name.indexOf('DELENG') < 0) && (map_color_to_status[job_data.color] != 'Disabled') ) {
          
            if (job_data.lastFailedBuild) {
              last_failed_builds.push(job_data.lastFailedBuild.timestamp / 1000);
            }
          
            view_jobs_list.push({ 
              name: job_data.name, 
              status: map_color_to_status[job_data.color], 
              url: job_data.url 
            });
        
            $.each(job_data.healthReport, function(index, healthReport_data) {
              // Parse out the code coverage
              var re = /\((\S+)\)/;
              var match = re.exec(healthReport_data.description);
              if (match && match.length > 0) {
                view_jobs_coverage.push(match[1]);
              }
          
              // Parse out the test results
              var re = /Test Result: (\d+) tests* failing out of a total of (\d+) tests*/;
              var match = re.exec(healthReport_data.description);
              if (match && match.length > 1) {
                view_jobs_num_failing_tests += parseInt(match[1]);
                view_jobs_num_total_tests += parseInt(match[2]);
                
                // console.log(match[1]);
                
                map_jobs_to_num_tests[job_data.name] = match[1];
              }
            });
          }                    
        });
        
        // Calculate last failed build
        var last_failed_build_str = (last_failed_builds.length > 0) ?
				  getTimeDeltaStr(_.max(last_failed_builds)) : '?';
      
        // Calculate average coverage
        var coverage_sum = _.reduce(view_jobs_coverage, function(memo, num) {
					return memo + parseFloat(num, 10); }, 0);
        var coverage_avg = coverage_sum / view_jobs_coverage.length;
        coverage_avg = isNaN(coverage_avg) ? '?' : coverage_avg.toFixed(2);

				var total 		= parseInt(view_jobs_num_total_tests);
				var failed		= parseInt(view_jobs_num_failing_tests);
				var passed		= ((total - failed) / total * 100).toFixed(1);
				var coverage	= parseFloat(coverage_avg).toFixed(1);
				var duration  = "-";				
								
        var job_info_data = { 
          'passed' : passed,
          'coverage' : coverage, 
          'last failed' : last_failed_build_str,
          'duration' : duration,
        };
        
        $.each(job_info_data, function(stat_name, stat_value) {
					
					var percent = "";
					
          var job_info_box = $('<div/>', {
            class: 'job_info_box',
          });
        
				  if( isNaN(stat_value) && stat_name != "last failed" &&
						stat_name != "duration" ) {
						stat_value = "-";
					}
					else if( stat_name == "passed" || stat_name == "coverage" ) {
						percent = "%";
					}
					
          var value = $('<p/>', {
            text: stat_value + percent,
            class: 'job_stat_value',
          }).appendTo(job_info_box);       
          
          var label = $('<p/>', {
            text: stat_name,
            class: 'job_stat_name',
          }).appendTo(job_info_box);

					if(stat_value == "-") {
						job_info_box.addClass("bad");
						value.addClass("bad");
						label.addClass("bad");
					}
					else {
						
						threshold = checkThreshold( stat_name, stat_value );
						
						switch(threshold) {
							case -1:
							  value.addClass("bad");
								job_info_box.addClass("bad");
								label.addClass("bad");
								break;					  
							case  1: value.addClass("warning"); break;
							case  0: value.addClass("good"); break;
							default: value.addClass("good"); break;
						}
						
					}						
					
          job_info_box.appendTo(view_content_box);   
        });

        var job_boxes_container = $('<div/>', {
          class: 'job_boxes_container clear',
        });
        
        // Add the job status boxes
        $.each(view_jobs_list, function(index, view_job) {
          $('<a/>', {
            class: 'job_status',
            title: view_job.name + ' - ' + view_job.status,
            href: view_job.url,
            target: '_blank'
            //text: map_jobs_to_num_tests[view_job.name],
          })
            .addClass('status-' + view_job.status.toLowerCase())
            .appendTo(job_boxes_container);
        });
      
        job_boxes_container.appendTo(view_content_box);
        view_content_box.appendTo('div.content_box_container');
      });
    });
    
    $('#throbber').fadeOut('slow');
  }
  
});


