module Defekts

  class Analysis

    def self.get_trend(days=5)

      trend = Array.new
      # TODO: skip sat sun
      days.downto(1) do |i|

        day = Array.new

        day.push( Date::ABBR_MONTHNAMES[(Date.today - i).month] + " " +
          (Date.today - i).day.to_s )

        c = Defekt.where( :day => Date.today - i, :state => "accepted" )
        o = Defekt.where( :day => Date.today - i, :state => [ "unstarted",
          "unscheduled", "started", "finished", "rejected", "delivered" ] )
        n = Defekt.where( :day => Date.today - i, :state => [ "unscheduled",
          "unstarted" ] )

        day.push(c.count)
        day.push(o.count)
        day.push(n.count)

        trend.push(day)

      end

      return trend

    end

    def self.get_severity

      severity = Array.new

      p1 = Defekt.where( :severity => 1 ).count
      p2 = Defekt.where( :severity => 2 ).count
      p3 = Defekt.where( :severity => 3 ).count
      p4 = Defekt.where( :severity => -1 ).count

      severity.push( [ "p1", p1 ] )
      severity.push( [ "p2", p2 ] )
      severity.push( [ "p3", p3 ] )
      severity.push( [ "unclassified", p4 ] )

      return severity

    end

  end

end

