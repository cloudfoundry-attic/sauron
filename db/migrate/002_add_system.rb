class AddSystem < ActiveRecord::Migration

  def self.up

    create_table :systems do |t|
      t.string :system_type
      t.string :name, :unique => true
      t.string :url
      t.timestamps
    end

    add_column :projects, :system_id, :int
    change_column :projects, :origin_id, :int

  end

  def self.down
    change_column :projects, :origin_id, :int, :unique => true
    remove_column :projects, :system_id
    drop_table :systems
  end

end

