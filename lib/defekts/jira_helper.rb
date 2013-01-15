require "jira"

module Defekts

  SITE_LEVEL_DELIMITTER = '____'

  module JiraHelper

    def self.sync(force=false, site_url, username, password)
      if Defekts.check_synced and !force
        return
      end
      options = {
                  :site     => site_url,
                  :username => username,
                  :password => password,
                  :context_path => '',
                  :auth_type => :basic
                }
      client = JIRA::Client.new(options)
      @projects = client.Project.all
      @projects.each do |p|
        project = Project.find_by_origin_id(p.id)
        if project.nil?
          project = Project.create(:name => p.name, :origin_id => p.id)
        end

        @defeckts = p.issues
        @defeckts.each do |d|
          severity = d.priority.id
          defekt = Defekt.find_by_origin_id d.id
          if defekt.nil?
            ndefekt = Defekt.create(
              :project_id => project.id,
              :origin_id => d.id,
              :title => d.summary,
              :summary => d.description,
              :creation => d.created,
              # todo, there is no closed date in Jira. need to look how to.
              :accepted => d.updated,
              :state => d.status.name,
              :severity => severity,
              :owner => d.assignee.displayName,
              :reporter => d.reporter.displayName
             )
          else
              defekt.title    = d.summary
              defekt.summary  = d.description
              defekt.creation = d.created
              defekt.accepted = d.updated
              defekt.state    = d.status.name
              defekt.severity = severity
              defekt.owner    = d.assignee.displayName
              defekt.reporter = d.reporter.displayName

              if defekt.changed?
                defekt.save
              end
          end
        end

      end
      settings.last_sync = Time.now
    end
  end
end

