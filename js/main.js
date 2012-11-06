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
      return '1 min';
      
    } else if (delta_seconds < seconds_in_hour) {
      return (delta_seconds / seconds_in_minute).toFixed(1) + ' mins';
      
    } else if (delta_seconds < seconds_in_day) {
      return (delta_seconds / seconds_in_hour).toFixed(1) + ' hours';
      
    } else if (delta_seconds < seconds_in_week) {
      return (delta_seconds / seconds_in_day).toFixed(1) + ' days';
      
    } else if (delta_seconds < seconds_in_month) {
      return (delta_seconds / seconds_in_week).toFixed(1) + ' weeks';

    } else if (delta_seconds >= seconds_in_month) {
      return (delta_seconds / seconds_in_week).toFixed(1) + ' months';
    }    
  }
    
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
        var last_failed_build_str = (last_failed_builds.length > 0) ? getTimeDeltaStr(_.max(last_failed_builds)) : '?';
      
        // Calculate average coverage
        var coverage_sum = _.reduce(view_jobs_coverage, function(memo, num) { return memo + parseFloat(num, 10); }, 0);
        var coverage_avg = coverage_sum / view_jobs_coverage.length;
        coverage_avg = isNaN(coverage_avg) ? '?' : coverage_avg.toFixed(2);

        var job_info_data = { 
          'Tests failed' : view_jobs_num_failing_tests + " / " + view_jobs_num_total_tests,
          'Coverage' : coverage_avg + " %", 
          'Since last job failed' : last_failed_build_str,
          'Test duration' : '?',
        };
        
        $.each(job_info_data, function(stat_name, stat_value) {
          var job_info_box = $('<div/>', {
            class: 'job_info_box',
          });
          
          $('<div/>', {
            text: stat_value,
            class: 'job_stat_value',
          }).appendTo(job_info_box);       
          
          $('<div/>', {
            text: stat_name,
            class: 'job_stat_name',
          }).appendTo(job_info_box);

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
            target: '_blank',
            text: map_jobs_to_num_tests[view_job.name],
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


