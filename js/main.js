$(function() {

  var jenkins_root_url = 'http://ci.cloudfoundry.org';
  var default_refresh_secs = 60;
  var timer_id = 0;

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

});
