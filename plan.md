# Game Plan

## Events and Flow

### 1. Player Join Event

- **Event Name:** `join`
- **Data Broadcasted:**
  - `game_data`:
    - `settings data`
    - `state`
    - `players data`

---

### 2. Start Game Event

- **Event Name:** `start_game`
- **Triggered By:** Room Creator
- **State Change:** Game state updated from `init` to `ongoing`

#### Sub-Events:

1. **Turn Event**

   - **Data Broadcasted:**
     - `round`
     - `player_id`
     - `score` (array)

2. **Word Options Event**

   - **Triggered By:** `player_id`
   - **Data Emitted:**
     - `word_options`

3. **Word Selection Event**

   - **Triggered By:** `player_id`
   - **Data Emitted:**
     - `selection(word)`
   - **Broadcasted Event:**
     - `start_drawing`

4. **Chat Event**
   - **Triggered By:** Other Players (`player_id`)
   - **Data Emitted:**
     - `chat(message: word name)`

---

### Special Cases

#### If Player Guesses the Correct Word:

- **Server-Side Event:**
  - **Event Name:** `score`
  - **Data Emitted:**
    - Updated score of `player_id`

#### If Drawing Time Completes:

- No additional events specified.

---

## Data Storage in Redis

### Data Structures

#### Dictionary

- **Key:** `game:room_id:game_id:gameDetails`
- **Value:**
  ```json
  {
    "data of game": {
      "id": "<game_id>",
      "status": "<game_status>",
      "rounds": "<number_of_rounds>",
      "difficulty_level": "<difficulty>",
      "max_players": "<max_players>",
      "min_word_length": "<min_word_length>",
      "word_count": "<word_count>",
      "game_code": "<game_code>",
      "draw_time": "<draw_time>",
      "created": "<timestamp>",
      "modified": "<timestamp>"
    }
  }
  ```

#### Set

- **Key:** `game:room_id:game_id:players`
- **Value:** `{player_id}`

#### Hash

- **Key:** `game:room_id:player_id:playerDetails`
- **Value:**
  ```json
  {
    "id": "player.id",
    "score": "player.score",
    "user_id": "player.userId",
    "is_game_creator": "player.isGameCreator",
    "display_name": "player.user.displayName",
    "avatar_url": "player.user.avatarUrl"
  }
  ```

#### Circular Queue

- **Key:** `game:room_id:game_id:turns`
- **Value:** `{player_id}`

---

### Round Data Structure

- **Key:** `game_room_id:game_id:round`
- **Value:**
  ```json
  {
    "round": 1,
    "player_id": "score",
    "player_id": "score",
    "player_id": "score"
  }
  ```
