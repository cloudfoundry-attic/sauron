require 'yaml'

module Defekts
  set :public_folder, File.join( File.dirname(__FILE__), "..", "..", "static_files" )

  get "/" do
    defekt_config = settings.defekt_config

    # need to change this to more generic way once class pattern is redefined.
    if !defekt_config['pivotal'].nil?
      defekt_config['pivotal'].each do |site|
        PivotalHelper.sync(false, site['token'])
      end
    end
    if !defekt_config['jira'].nil?
      defekt_config['jira'].each do |site|
        JiraHelper.sync(false, site['site_url'], site['username'], site['password'])
      end
    end

    #p = Project.create( :name => "frameworks", :origin_id => "72352" )
    #po = Project.find_by_origin_id("72351")
    #puts po.id
    #puts po.name
    return
  end

  get "/version" do
    return Yajl::Encoder.encode(VERSION)
  end

  get "/graphs/:graphid" do

    g = params[:graphid].downcase

    if g == "trend"

      header = [ 'day', 'closed', 'open', 'new' ]

      data = [ header ]

      vals = Analysis.get_trend

      data.concat(vals)

      graph = { :data => data,
                :title => "defect trend",
                :x => "day",
                :y => "defect count",
                :position => "right",
                :name => "trends" }

    elsif g == "severity"

      header = [ 'severity', 'count' ]

      data = [ header ]

      vals = Analysis.get_severity

      data.concat(vals)

      graph = { :data => data,
                :title => "severity count",
                :x => "severity",
                :y => "defect count",
                :legend => "none",
                :name => "severity" }

    else
      halt 404, "Chart type not available."
    end

    return Yajl::Encoder.encode(graph)

  end

end

