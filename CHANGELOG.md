# Release v0.0.1

## Features

- feat: add functionality to edit a rating (put and patch)
- feat: add functionality to delete a rating
- feat: add functionality to get all ratings of a playlist
- feat: add functionality to get all ratings of a beat
- feat: add test fot functionality to get a rating by ratingId
- feat: add functionality to get a rating by ratingId
- feat: add functionality to get my rating from a playlist (add oas)
- feat: add functionality to get my rating from a playlist
- feat: add functionality to get my rating from a beat
- feat: add functionality to create a rating of a playlist
- feat: add functionality to create a rating of a beat
- feat: add comment CRUD
- feat: add functionality to update a comment partially and totally (put and patch)
- feat: add functionality to delete a comment by commentId
- feat: add functionality to get all comments of a playlist
- feat: add functionality to get all comments of a beat
- feat: add functionality to get a comment by commentId
- feat: add UNDOCUMENTED playlist endpoints
- feat: add functionality to create a comment for a playlist
- feat: add functionality to create a comment for a beat
- feat: create entities with database validations

## Tests

- test: add test for functionality to edit a rating (put and patch)
- test: add test for functionality to delete a rating
- test: add test for functionality to get all ratings of a playlist
- test: add test for functionality to get all ratings of a beat
- test: add test for functionality to get my rating from a playlist
- test: add test for functionality to get my rating from a beat
- test: add test for functionality to create a rating of a playlist
- test: add test for functionality to create a rating of a beat
- test: move health test to integration folder
- test: finish testing playlist endpoints
- test: add some test for playlists routes
- test: add more test for functionality to update a comment partially and totally (put and patch)
- test: add test for functionality to update a comment partially and totally (put and patch)
- test: add test for functionality to delete a comment by commentId
- test: add test for functionality to get all comments of a playlist
- test: add test for functionality to get all comments of a beat
- test: add some routes tests
- test: add remaining playlist service tests
- test: add get user playlists tests
- test: add test for functionality to get a comment by commentId
- test: add test functionality to create a comment for a playlist
- test: add playlist creation tests
- test: add test functionality to create a comment for a beat
- test: test entities validations

## Documentation

- docs: update jsdoc in ratingRoutes to use OASSchemas
- docs: upgrade comment and playlist documentation to contain refs
- docs: add models schemas to the swagger configuration
- docs: add oas to playlist routes

## Fixes

- fix: exclude also commitlint.config.cjs from coverage analysis
- fix: fix mispelling in a variable
- fix: add error validation in create playlist comment
- fix: add / to main.js logs

## Continuous integration (CI)

- ci: add secure shutdown to main.js (COMMIT FROM TEMPLATE)
- ci: add docker development enviroment

## Other changes

- Merge pull request #13 from SocialBeats/develop
- chore: change PORT from 3000 to 300 in .env.examples
- Merge pull request #11 from SocialBeats/3-crud-rating
- Merge pull request #10 from SocialBeats/4-crud-playlist
- chore: exclude some files in coverage analysis
- chore: rename routes.comments.test.js to routes.comment.test.js
- Merge remote-tracking branch 'origin/develop' into 4-crud-playlist
- chore: update jwt_scret configuration
- chore: merge with comment crud branch
- chore: adapt tests environment to multi db instance using PC memory
- Merge pull request #8 from SocialBeats/1-create-entities
- chore: adapt conf files to repo name
- chore: add skeleton of bakend logic to manage entities
- chore: add unique endpoint of models exportation
- chore: add skeleton for comment management
- chore: change name in package-lock.json
- Initial commit

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/...v0.0.1).
