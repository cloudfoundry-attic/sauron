google.load('visualization', '1.0', {'packages':['corechart']});

$(function() {

  var config = new Config();
  var jenkins_root_url = config.JenkinsRootUrl();
  var default_refresh_secs = config.DefaultRefreshSecs();

  var view_cache = new JenkinsViewCache();
  view_cache.sync();

  var timer_id = 0;

  // Initialize the UI
  $('#jenkins_root_url').text(jenkins_root_url);
  $('#refresh_in_x_secs').text(default_refresh_secs);
  $('#enable_auto_cycle').show();
  $('#disable_auto_cycle').hide();

  renderPage();

  // Click this button to refetch data from Jenkins
  $('#refresh_now, #jenkins_root_url').on('click', function() {
    view_cache.sync();
    $('body').data('curr_page', config.PageJenkinsViews());

    renderPage();
  });

  // Click these two buttons to Enable/Disable Auto-Refresh
  $('#enable_auto_cycle, #disable_auto_cycle').on('click', function() {
    $(this).hide();

    if ($(this).attr('id') == 'enable_auto_cycle') {

      timer_id = setInterval(function() {
        renderPage(jenkins_root_url);
      }, default_refresh_secs * 1000);

      $('#disable_auto_cycle').show();
    } else if ($(this).attr('id') == 'disable_auto_cycle') {
      clearInterval(timer_id);

      $('#enable_auto_cycle').show();
    }
  });

  // Target a different Jenkins
  $('#update_jenkins_target').on('click', function() {
    if ($('#jenkins_target').val()) {
      var jenkins_root_url = 'http://' + $('#jenkins_target').val();

      config.setJenkinsRootUrl(jenkins_root_url);
      view_cache.sync();
      $('body').data('curr_page', config.PageJenkinsViews());

      renderPage();

      $('#jenkins_root_url').text(jenkins_root_url);
      $('#jenkins_target').val('');
    }
    return false;
  });
});

