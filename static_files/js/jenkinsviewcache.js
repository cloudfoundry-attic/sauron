function JenkinsViewCache() {

  if (arguments.callee._singletonInstance)
    return arguments.callee._singletonInstance;
  arguments.callee._singletonInstance = this;

  var url_cache = [];

  this.sync = function() {
    var config = new Config();
    var jenkins_root_url = config.JenkinsRootUrl();
    var url = jenkins_root_url + '/api/json?tree=views[name,url,jobs[name,color,url,lastFailedBuild[timestamp],healthReport[description,score]]]&jsonp=?';
    var refToFunction = this;

    this.reset();

    $.getJSON(url)
      .done(function(data) {
        $.each(data.views, function(index, view_data) {
          refToFunction.add(view_data.url);
        });
      });
  }

  this.add = function(view_url) {
    url_cache.push(view_url);
  }

  this.reset = function() {
    url_cache.length = 0;
  }

  this.first = function() {
    return url_cache[0];
  }

  this.list = function() {
    return url_cache;
  }

  this.pickNext = function(view_url) {
    var view_index = _.indexOf(url_cache, view_url);
    var view_name_reg = /\/([\w%]*?)\/$/;
    // the try times should be lower than the array length
    for(var i=0;i<url_cache.length;i++){
      if ((view_index + 1) >= url_cache.length) {
        view_index = 0;
      } else {
        view_index += 1;
      }
      var view_name_matches = url_cache[view_index].match(view_name_reg);
      var view_name = decodeURIComponent(view_name_matches && view_name_matches[1]);
      if(!isBannedView(view_name)){
        return url_cache[view_index];
      }
    }
    // if it doesn't find the proper next one, it returns the original one
    return view_url;
  }
}
