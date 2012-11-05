$(function() {
  var color_to_status_map = { 
    blue: 'Success',
    blue_anime: 'Success',
    yellow: 'Unstable',
    yellow_anime: 'Unstable',
    red: 'Failed',
    red_anime: 'Failed',
    disabled: 'Disabled',
  };
  
	var jenkins_root_url = 'http://ci-legacy.cloudfoundry.org';
	$('#jenkins_root_url').text(jenkins_root_url);
	
	var jenkins_views = [];	
	
	var default_refresh_secs = 60;
	$('#refresh_in_x_secs').text(default_refresh_secs);
	
	$('#enable_auto_refresh').show();
	$('#disable_auto_refresh').hide();
		
	refreshViews(jenkins_root_url);
	
	$('#refresh_now').on('click', function() {
	  refreshViews(jenkins_root_url);
	});
	
	var timer_id = 0;
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
		
	$('#update_jenkins_target').on('click', function() {
	  if ($('#jenkins_target').val()) {
  	  jenkins_root_url = 'http://' + $('#jenkins_target').val();
      refreshViews(jenkins_root_url);
      $('#jenkins_root_url').text(jenkins_root_url);
    }
    
	  return false;
	});
		
	function getDateTime() {
	  var now_date = new Date();
    return now_date.toLocaleTimeString() + " - " + now_date.toLocaleDateString();
	}
	
	function getTimeDeltaStr(past_timestamp) {
	  var now_ts_normalized = new Date().getTime() / 1000;	  
	  sec_delta = now_ts_normalized - past_timestamp;
	  
	  // Unit: days
	  return ((sec_delta) / (60 * 60 * 24)).toFixed(1);
	}
		
	function refreshViews(jenkins_view_url) {
	  $('#throbber').show();
	  
	  $('div.content_box').fadeOut('slow');
	  $('div.content_box').remove();
	  
	  $('#updated_at').text( getDateTime() );
	  
	  jenkins_view_url += '/api/json?tree=views[name,url,jobs[name,color,url,lastFailedBuild[timestamp],healthReport[description,score]]]&jsonp=?';
	  
  	$.getJSON(jenkins_view_url, function(data) {
  		$.each(data.views, function(index, view_data) {
  		  
  		  // Skip view named 'All'
  		  if (view_data.name.indexOf('All') >= 0) {
  		    return true;
  		  }
  		  
  			var view_content_box = $('<div/>', { 
  				class: 'content_box',
  			});
			  			
  			var view_title = '<h2><a href="' + view_data.url + '">' + view_data.name + '</a></h2>';
  			view_content_box.append(view_title);
			
  			var view_jobs = view_data.jobs;
  			var view_jobs_coverage = [];
  			var view_jobs_num_failing_tests = 0;
  			var view_jobs_num_total_tests = 0;
  			var view_jobs_list = [];
  			var last_failed_builds = [];
  			
  			$.each(view_jobs, function(index, job_data) {
  			  
  			  // Skip disabled jobs + jobs with specified ommitted prefixes
          if ( (job_data.name.indexOf('DELENG') < 0) && (job_data.color != 'disabled') ) {
  			  
  			    if (job_data.lastFailedBuild) {
              last_failed_builds.push(job_data.lastFailedBuild.timestamp / 1000);
            }
  			  
    			  view_jobs_list.push( { title: job_data.name, health: job_data.color, url: job_data.url } );
			  
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
              }
            });
          }                    
  			});
  			
  			// Calculate last failed build
  			var last_failed_build_str = (last_failed_builds.length > 0) ? getTimeDeltaStr(_.max(last_failed_builds)) : '???';
			
  			// Calculate average coverage
  			var coverage_sum = _.reduce(view_jobs_coverage, function(memo, num) { return memo + parseFloat(num, 10); }, 0);
  			var coverage_avg = coverage_sum / view_jobs_coverage.length;
  			coverage_avg = isNaN(coverage_avg) ? '???' : coverage_avg.toFixed(2);
						  
  			var view_info_container = $('<div/>', {
  			  class: 'view_info_container',
  			});
			  			  
			  var warning = view_jobs_num_failing_tests > 0 ? ' text-error' : '';
  			var failing_tests = $('<h4/>', {
  			  text: view_jobs_num_failing_tests + " / " + view_jobs_num_total_tests + " tests failing",
  			  class: 'job_info clear' + warning,
  			}).appendTo(view_info_container);
  			  			
  			warning = last_failed_build_str < 7 ? ' text-error' : '';
      	$('<h4/>', {
  			  text: 'Last job failure ' + last_failed_build_str + ' days ago',
  			  class: 'job_info clear' + warning,
  			}).appendTo(view_info_container);						    			
  			
  			warning = coverage_avg < 70 ? ' text-error' : '';
  			$('<h4/>', {
  			  text: coverage_avg + "% coverage",
  			  class: 'job_info clear' + warning,
  			}).appendTo(view_info_container);  			
			
  			view_info_container.appendTo(view_content_box);

        $('<div/>', {
          text: 'Current job status',
          class: 'clear job_status_caption',
        }).appendTo(view_content_box);

        // Add the job status boxes
        $.each(view_jobs_list, function(index, view_job) {
          $('<a/>', {
            class: 'job_status',
            title: view_job.title,
            href: view_job.url,
            target: '_blank',
          })
            .addClass('health-' + view_job.health).appendTo(view_content_box)
            .on('mouseover', function() { 
              var caption = $(this).attr('title') + ": " + color_to_status_map[view_job.health];
              $(this).siblings('div.job_status_caption').text(caption);
            })
            .on('mouseout', function() {
              $(this).siblings('div.job_status_caption').text( 'Current job status' );
            });
        });
			
  			view_content_box.appendTo('div.content_box_container');
  		});
  	});
  	
  	$('#throbber').fadeOut('slow');
  }
	
});


