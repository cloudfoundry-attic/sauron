class InitSchema < ActiveRecord::Migration

  def self.up

    create_table :projects do |t|
      t.integer :origin_id, :unique => true
      t.string :name
      t.timestamps
    end

    create_table :defekts do |t|
      t.belongs_to :project
      t.integer :origin_id, :unique => true
      t.string :title, :null => false
      t.text :summary
      t.string :state
      t.integer :severity
      t.timestamp :creation
      t.timestamp :accepted
      t.date :day
      t.string :owner
      t.string :reporter
      t.timestamps
    end

    create_table :projectdefekts do |t|
      t.integer :project_id
      t.integer :defekt_id
    end

  end

  def self.down

    drop_table :projects

    drop_table :defekts

    drop_table :projectdefekts

  end

end

