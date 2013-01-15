function refreshJobs(jenkins_view_url) {

  var JOB_STAT_TYPE = {
    status: 1,
    build_stability: 2,
    last_failed: 3,
    duration: 4
  };

  jenkins_view_url += '/api/json?tree=jobs[name,color,url,lastFailedBuild[timestamp],lastSuccessfulBuild[timestamp,duration],healthReport[description,score]]&jsonp=?';

  $.getJSON(jenkins_view_url, function(data) {

    // Iterate through each Jenkins job
    $.each(data.jobs, function(index, job_data) {

      // Each Jenkins job is a div.content_box
      var view_content_box = $('<div/>', {
        class: 'content_box job',
      });

      // 27 is roughly the # of letters that can fit on one line
      var tiny = (job_data.name.length > 25) ? 'tiny' : '';

      // Render the title of the Jenkins job
      var view_title = '<h2 class="' + tiny + '"><a href="' + job_data.url + '">' + job_data.name + '</a></h2>';
      view_content_box.append(view_title);

      var job_build_stability_pct = 0, job_status = mapColorToStatus(job_data.color);
      $.each(job_data.healthReport, function(index, healthReport_data) {

        // Parse out the build stability
        var re = /Build stability/;
        var match = re.exec(healthReport_data.description);
        if (match && match.length > 0) {
          job_build_stability_pct = parseInt(healthReport_data.score);
        }
      });

      // Calculate time delta in sec, of last failed build
      var last_failed_build_time_delta = job_data.lastFailedBuild ? getTimeDeltaToNow(job_data.lastFailedBuild.timestamp/1000) : null;

      // Calculate duration
      var duration = job_data.lastSuccessfulBuild ? job_data.lastSuccessfulBuild.duration : null;

      // Add the job_info_boxes
      buildJobInfoBox(JOB_STAT_TYPE.status, job_status).appendTo(view_content_box);
      buildJobInfoBox(JOB_STAT_TYPE.build_stability, job_build_stability_pct).appendTo(view_content_box);
      buildJobInfoBox(JOB_STAT_TYPE.last_failed, last_failed_build_time_delta).appendTo(view_content_box);
      buildJobInfoBox(JOB_STAT_TYPE.duration, duration).appendTo(view_content_box);
      view_content_box.appendTo('div.content_box_container');
    });
  });

  function getAlertLevel(view_stat_type, value) {

    if (!value) {
      // The job has never failed, so no value is a good thing
      if (view_stat_type == JOB_STAT_TYPE.last_failed)
        return 'good';

      // For all other job_stat_type's, no value is a bad thing
      else
        return 'bad';
    }

    // Handle the job status string
    if (view_stat_type == JOB_STAT_TYPE.status) {
      value = value.toLowerCase();
      if (value == 'success') {
        return 'good';
      } else if ((value == 'unstable') || (value == 'disabled')) {
        return 'warning';
      } else {
        return 'bad';
      }
    }

    // Handle other numeric stat values
    var thresholds = {};
    thresholds[JOB_STAT_TYPE.build_stability] = {
      'warning': 80,
      'good': 90
    };
    thresholds[JOB_STAT_TYPE.last_failed] = {
      'warning': 60 * 60 * 12,
      'good': 60 * 60 * 24
    };
    thresholds[JOB_STAT_TYPE.duration] = {
      'warning': 90,
      'good': 1
    };

    if (value >= thresholds[view_stat_type]['good']) {
      return 'good';
    } else if ((value >= thresholds[view_stat_type]['warning']) && (value < thresholds[view_stat_type]['good'])) {
      return 'warning';
    } else if (value < thresholds[view_stat_type]['warning']) {
      return 'bad';
    }
  }

  function buildJobInfoBox(view_stat_type, value) {

    var stat_label, stat_value, stat_alert = getAlertLevel(view_stat_type, value);

    switch (view_stat_type) {
    case JOB_STAT_TYPE.status:
      stat_label = 'Status';
      stat_value = value;
      break;
    case JOB_STAT_TYPE.build_stability:
      stat_label = 'Build Stability';
      stat_value = isNaN(value) ? '-' : value + ' %';
      break;
    case JOB_STAT_TYPE.last_failed:
      stat_label = 'Last Failed';
      stat_value = !value ? '-' : getTimeDeltaStr(value);
      break;
    case JOB_STAT_TYPE.duration:
      stat_label = 'Duration';
      stat_value = !value ? '-' : getTimeDeltaStr(value/1000);
      break;
    default:
      stat_label = '?';
      stat_value = '?';
      break;
    }

    var job_info_box = $('<div/>', {
      class: 'job_info_box ' + stat_alert,
    });

    var value = $('<p/>', {
      text: stat_value,
      class: 'job_stat_value ' + stat_alert,
    }).appendTo(job_info_box);

    var label = $('<p/>', {
      text: stat_label,
      class: 'job_stat_name',
    }).appendTo(job_info_box);

    return job_info_box;
  }
}

function refreshViews() {

  var VIEW_STAT_TYPE = {
    passed: 1,
    coverage: 2,
    last_failed: 3,
    duration: 4
  };
  var config = new Config();
  var jenkins_root_url = config.JenkinsRootUrl();
  jenkins_root_url += '/api/json?tree=views[name,url,jobs[name,color,url,lastFailedBuild[timestamp],healthReport[description,score]]]&jsonp=?';

  $.getJSON(jenkins_root_url, function(data) {

    // Iterate through each Jenkins tab (aka 'view')
    $.each(data.views, function(index, view_data) {

      // To avoid overloading the UI, skip any Jenkins view named 'All'
      if (view_data.name.indexOf('All') >= 0) {
        return true;
      }

      var view_jobs_coverage = [];
      var view_jobs_num_failing_tests = 0;
      var view_jobs_num_total_tests = 0;
      var view_jobs_list = [];
      var last_failed_builds = [];

      // Each Jenkins view is a div.content_box
      var view_content_box = $('<div/>', {
        class: 'content_box',
      });

      // Render the title of the Jenkins view
      var view_title = '<h2 class="jenkins_view_url"><a href="' + view_data.url + '">' + view_data.name + '</a></h2>';
      view_content_box.append(view_title);

      // Iterate through each job of the Jenkins view, and aggregate job info (ie. coverage, failing tests)
      $.each(view_data.jobs, function(index, job_data) {

        // Skip disabled jobs + jobs with specified ommitted prefixes
        if ((job_data.name.indexOf('DELENG') < 0) && (mapColorToStatus(job_data.color) != 'Disabled')) {

          if (job_data.lastFailedBuild) {
            last_failed_builds.push(job_data.lastFailedBuild.timestamp / 1000);
          }

          view_jobs_list.push({
            name: job_data.name,
            status: mapColorToStatus(job_data.color),
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
            }
          });
        }
      });

      // Calculate time delta in sec, of last failed build string
      var last_failed_build = (last_failed_builds.length > 0) ? _.max(last_failed_builds) : null;
      var last_failed_build_time_delta = last_failed_build ? getTimeDeltaToNow(last_failed_build) : null;

      // Calculate average coverage string
      var coverage_sum = _.reduce(view_jobs_coverage, function(memo, num) {
        return memo + parseFloat(num, 10);
      }, 0);
      var coverage_avg_pct = coverage_sum / view_jobs_coverage.length;

      // Calculate test pass percentage
      var passed_pct = ((view_jobs_num_total_tests - view_jobs_num_failing_tests) / view_jobs_num_total_tests * 100);

      // Add the job_info_boxes (passed %, coverage %, last failed, duration)
      buildJobInfoBox(VIEW_STAT_TYPE.passed, passed_pct).appendTo(view_content_box);
      buildJobInfoBox(VIEW_STAT_TYPE.coverage, coverage_avg_pct).appendTo(view_content_box);
      buildJobInfoBox(VIEW_STAT_TYPE.last_failed, last_failed_build_time_delta).appendTo(view_content_box);
      buildJobInfoBox(VIEW_STAT_TYPE.duration, null).appendTo(view_content_box);

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
        }).addClass('status-' + view_job.status.toLowerCase()).appendTo(job_boxes_container);
      });

      job_boxes_container.appendTo(view_content_box);
      view_content_box.appendTo('div.content_box_container');
      view_content_box.on('click', function() {
        refreshUI(view_data.url);
      });
    });
  });

  function getAlertLevel(view_stat_type, value) {

    if (!value) {
      return 'bad';
    }

    var thresholds = {};
    thresholds[VIEW_STAT_TYPE.passed] = {
      'warning': 90,
      'good': 100
    };
    thresholds[VIEW_STAT_TYPE.coverage] = {
      'warning': 60,
      'good': 70
    };
    thresholds[VIEW_STAT_TYPE.last_failed] = {
      'warning': 60 * 60 * 12,
      'good': 60 * 60 * 24
    };
    thresholds[VIEW_STAT_TYPE.duration] = {
      'warning': 90,
      'good': 100
    };

    if (value >= thresholds[view_stat_type]['good']) {
      return 'good';
    } else if ((value >= thresholds[view_stat_type]['warning']) && (value < thresholds[view_stat_type]['good'])) {
      return 'warning';
    } else if (value < thresholds[view_stat_type]['warning']) {
      return 'bad';
    }
  }

  function buildJobInfoBox(view_stat_type, value) {

    var stat_label, stat_value, stat_alert = getAlertLevel(view_stat_type, value);

    switch (view_stat_type) {
    case VIEW_STAT_TYPE.passed:
      stat_label = 'Passed';
      stat_value = isNaN(value) ? '-' : value.toFixed(1) + ' %';
      break;
    case VIEW_STAT_TYPE.coverage:
      stat_label = 'Coverage';
      stat_value = isNaN(value) ? '-' : value.toFixed(1) + ' %';
      break;
    case VIEW_STAT_TYPE.last_failed:
      stat_label = 'Last Failed';
      stat_value = !value ? '-' : getTimeDeltaStr(value);
      break;
    case VIEW_STAT_TYPE.duration:
      stat_label = 'Duration';
      stat_value = !value ? '-' : value;
      break;
    default:
      stat_label = '?';
      stat_value = '?';
      break;
    }

    var job_info_box = $('<div/>', {
      class: 'job_info_box ' + stat_alert,
    });

    var value = $('<p/>', {
      text: stat_value,
      class: 'job_stat_value ' + stat_alert,
    }).appendTo(job_info_box);

    var label = $('<p/>', {
      text: stat_label,
      class: 'job_stat_name',
    }).appendTo(job_info_box);

    return job_info_box;
  }
}

function mapColorToStatus(color) {

  // Map Jenkins status colors -> status
  var MAP_COLOR_TO_STATUS = {
    blue: 'Success',
    blue_anime: 'Success',
    yellow: 'Unstable',
    yellow_anime: 'Unstable',
    red: 'Failed',
    red_anime: 'Failed',
    disabled: 'Disabled',
    grey: 'Disabled',
    grey_anime: 'Disabled',
    aborted: 'Disabled',
    aborted_anime: 'Disabled',
  };

  return MAP_COLOR_TO_STATUS[color];
}
