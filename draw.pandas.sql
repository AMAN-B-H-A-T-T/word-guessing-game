CREATE TABLE tbl_users (
  id varchar(40) NOT NULL,
  email varchar(100) NOT NULL,
  password varchar(100) NOT NULL,
  display_name varchar(100) NOT NULL,
  avatar_url varchar(255) NOT NULL,
  created BIGINT NOT NULL,
  modified BIGINT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE tbl_player (
  id VARCHAR(40) NOT NULL,
  game_id VARCHAR(40) NOT NULL,
  user_id VARCHAR(40) NOT NULL,
  is_game_creator INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  created BIGINT NOT NULL,
  modified BIGINT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT tbl_game_fk FOREIGN KEY (game_id) REFERENCES tbl_game(id) ON DELETE CASCADE,
  CONSTRAINT tbl_user_fk FOREIGN KEY (user_id) REFERENCES tbl_users(id) ON DELETE CASCADE
);