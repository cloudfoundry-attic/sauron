function renderPage() {
  var config = new Config();
  var curr_page = $('body').data('curr_page') || config.PageJenkinsViews();
  var curr_job = $('body').data('curr_view');
  
  $('#throbber').show();
  $('div.content_box').fadeOut('slow');
  $('div.content_box').remove();
  $('#updated_at').text(getDateTime());

  // Display the current page, and set the next page/job state
  if (curr_page == config.PageJenkinsViews()) {
    renderJenkinsViewsPage();
    curr_page = config.PageJenkinsJobsInView();

  } else if (curr_page == config.PageJenkinsJobsInView()) {
    renderJenkinsJobsPage();
    curr_page = config.PageBugs();

  } 
  else if (curr_page == config.PageBugs()) {
    renderBugsPage();
    curr_page = config.PageJenkinsViews();
  }

  $('body').data('curr_page', curr_page);
  
  $('#throbber').fadeOut('slow');
}

function pickNextViewForJobsPage(view) {
  var view_cache = new JenkinsViewCache();
  return view_cache.pickNext(view);
}

function renderJenkinsViewsPage() {
  refreshViews();
}

function renderJenkinsJobsPage() {
  var view_cache = new JenkinsViewCache();
  var curr_view = $('body').data('curr_view') || view_cache.first();

  curr_view = pickNextViewForJobsPage(curr_view);  
  refreshJobs(curr_view);
  
  $('body').data('curr_view', curr_view);
}

function renderBugsPage() {
  console.log("bugs page");
}
