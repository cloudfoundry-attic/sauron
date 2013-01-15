class Defekt < ActiveRecord::Base

  belongs_to :projects

  before_create :set_day

  def set_day
    self.day = self.creation.to_date
  end

end

