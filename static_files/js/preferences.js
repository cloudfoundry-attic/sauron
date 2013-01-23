function banView(view_name){
  var banned_views = JSON.parse($.cookie('BANNED_VIEWS')) || [];
  banned_views.push(view_name);
  $.cookie('BANNED_VIEWS', JSON.stringify(banned_views));
}

function isBannedView(view_name){
  var banned_views = JSON.parse($.cookie('BANNED_VIEWS'));
  if(banned_views && _.contains(banned_views, view_name)){
    return true;
  }else{
    return false;
  }
}

function banJob(job_name){
  var banned_jobs = JSON.parse($.cookie('BANNED_JOBS')) || [];
  banned_jobs.push(job_name);
  $.cookie('BANNED_JOBS', JSON.stringify(banned_jobs));
}

function isBannedJob(job_name){
  var banned_jobs = JSON.parse($.cookie('BANNED_JOBS'));
  if(banned_jobs && _.contains(banned_jobs, job_name)){
    return true;
  }else{
    return false
  }
}

function confirmSetPreference(){
  var isConfirmed = JSON.parse($.cookie('CONFIRMED'));
  var promptMessage = "Do you want to remove this box? To reset it, you could clear your browser cookies later.";
  // it requires to be confirmed for only once
  if(isConfirmed || confirm(promptMessage)){
    $.cookie('CONFIRMED', 'true');
    return true;
  }else{
    return false;
  }
}

