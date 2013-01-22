class Project < ActiveRecord::Base

  has_many :defekts
  belongs_to :systems

end
