function Config() {

  if (arguments.callee._singletonInstance)
    return arguments.callee._singletonInstance;
  arguments.callee._singletonInstance = this;

  // TODO: Should I be using var PAGE_TYPES instead of this.PAGE_TYPES?

  // Section: PAGE_TYPES are the main rotating pages
  this.PAGE_TYPES = {
    JENKINS_VIEWS: 1,
    JENKINS_JOBS_IN_VIEW: 2,
    BUGS: 3
  };

  this.PageJenkinsViews = function() {
    return this.PAGE_TYPES.JENKINS_VIEWS;
  }

  this.PageJenkinsJobsInView = function() {
    return this.PAGE_TYPES.JENKINS_JOBS_IN_VIEW;
  }

  this.PageBugs = function() {
    return this.PAGE_TYPES.BUGS;
  }

  this.DEFAULT_JENKINS_ROOT = 'http://ci.cloudfoundry.org';

  // Section: JENKINS_ROOT_URL is the URL of the main Jenkins page
  this.JENKINS_ROOT_URL = $.cookie('JENKINS_ROOT_URL') || this.DEFAULT_JENKINS_ROOT;

  this.JenkinsRootUrl = function() {
    return this.JENKINS_ROOT_URL;
  }

  this.setJenkinsRootUrl = function(url) {
    this.JENKINS_ROOT_URL = url;
  }

  // Section: DEFAULT_REFRESH_SECS is the # of seconds between page rotation
  this.DEFAULT_REFRESH_SECS = 20;

  this.DefaultRefreshSecs = function() {
    return this.DEFAULT_REFRESH_SECS;
  }
}
