# Release v1.1.1

## Features
No new features.
## Tests
No test changes.
## Documentation
No documentation changes.
## Fixes
No fixes added.
## Continuous integration (CI)
No CI changes.
## Other changes
- chore: update CHANGELOG and .version for v1.1.0
- Merge pull request #32 from SocialBeats/develop
- chore: add logging when not deleting a deleted content
- style: auto formatted by CI

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v1.0.6...v1.1.1).

# Release v1.1.0

## Features

No new features.

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

No fixes added.

## Continuous integration (CI)

No CI changes.

## Other changes

- Merge pull request #32 from SocialBeats/develop
- chore: add logging when not deleting a deleted content
- style: auto formatted by CI

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v1.0.6...v1.1.0).

# Release v1.0.5

## Features

- feat: fix some errors with cronjob

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

No fixes added.

## Continuous integration (CI)

No CI changes.

## Other changes

- style: auto formatted by CI
- Merge pull request #31 from SocialBeats/develop

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v1.0.4...v1.0.5).

# Release v1.0.4

## Features

- feat: add rating and comment creation events

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

No fixes added.

## Continuous integration (CI)

No CI changes.

## Other changes

- style: auto formatted by CI
- Merge pull request #30 from SocialBeats/develop

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v1.0.3...v1.0.4).

# Release v1.0.3

## Features

No new features.

## Tests

No test changes.

## Documentation

- docs: add 402 code to playlists routes and oas.yaml

## Fixes

No fixes added.

## Continuous integration (CI)

No CI changes.

## Other changes

- style: auto formatted by CI
- Merge pull request #29 from SocialBeats/develop

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v1.0.2...v1.0.3).

# Release v1.0.2

## Features

No new features.

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

- fix: fix problem trowing pricing errors

## Continuous integration (CI)

No CI changes.

## Other changes

- style: auto formatted by CI
- Merge pull request #28 from SocialBeats/develop

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v1.0.1...v1.0.2).

# Release v1.0.1

## Features

No new features.

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

- fix: adapt OpenRouter integration to conservative rate-limit

## Continuous integration (CI)

No CI changes.

## Other changes

- style: auto formatted by CI
- Merge pull request #27 from SocialBeats/develop

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v1.0.0...v1.0.1).

# Release v1.0.0

## Features

- feat: add pricing integration to limit users playlist number
- feat: add command to delete user from the app if he has more than 5 legitimate complaints
- feat: add OpenRouter integration
- feat: improve the content of the body of the request to the moderation API
- feat: add initial redis environment and openrouter connection
- feat: add integration with materialized views in moderation reports
- feat: add functionality to get all moderation reports
- feat: add functionality to get all moderation reports by userId
- feat: add functionality to get all moderation reports by authenticated user
- feat: add functionality to get a moderation report by its id
- feat: add create a moderation report for a playlist
- feat: add create a moderation report for a rating
- feat: add create a moderation report for a comment
- feat: add files for Moderation Report functionality
- feat: add Moderation Report entity

## Tests

- test: add test for functionality to get all moderation reports
- test: add test for functionality to get all moderation reports by userId
- test: add test for functionality to get all moderation reports by authenticated user
- test: add test for functionality to get a moderation report by its id
- test: add test for create a moderation report for a playlist
- test: add test for create a moderation report for a rating
- test: add test for create a moderation report for a comment
- test: add test for Moderation Report entity

## Documentation

- docs: add Moderation Report schema to the swagger configuration

## Fixes

- fix: fix environment problems in testing commands to fix workflow
- fix: remove :id from AUTH_SERVICE_URL
- fix: change model to include an existing free one
- fix: order ratings and comments lists by updatedAt instead of createdAt
- fix: fix problem in mongo queries with userId in materialized view integration
- fix: fix problem in mongo queries with userId in materialized view integration
- fix: reorder methods

## Continuous integration (CI)

- ci: add redis to .env.examples and docker-compose

## Other changes

- Merge pull request #26 from SocialBeats/develop
- Merge pull request #25 from SocialBeats/pricing-space-integration
- Merge pull request #24 from SocialBeats/5-content-moderation
- chore: add AUTH_SERVICE_URL envrionment variable
- chore: add INTERNAL_API_KEY variable
- style: auto formatted by CI
- Merge branch 'develop' into 5-content-moderation
- refactor: remove some unuseful comments
- Merge remote-tracking branch 'origin/develop' into 5-content-moderation
- Merge branch 'develop' into 5-content-moderation
- Merge branch 'develop' into 5-content-moderation
- Merge branch 'develop' into 5-content-moderation
- Merge branch 'develop' into 5-content-moderation
- refactor: remove unused imports
- Merge branch '3-crud-rating' into 5-content-moderation

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v0.0.5...v1.0.0).

# Release v0.0.5

## Features

No new features.

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

- fix: fix problem with beats materialized view

## Continuous integration (CI)

No CI changes.

## Other changes

- style: auto formatted by CI
- Merge pull request #22 from SocialBeats/develop

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v0.0.4...v0.0.5).

# Release v0.0.4

## Features

No new features.

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

- fix: fix problem searching collaborators in playlistService if kafka is enabled

## Continuous integration (CI)

No CI changes.

## Other changes

- style: auto formatted by CI
- Merge pull request #21 from SocialBeats/develop

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v0.0.3...v0.0.4).

# Release v0.0.3

## Features

No new features.

## Tests

No test changes.

## Documentation

No documentation changes.

## Fixes

- fix: fix problem in mongo queries with userId and beatId

## Continuous integration (CI)

No CI changes.

## Other changes

- Merge pull request #20 from SocialBeats/develop
- Merge branch 'develop' of https://github.com/SocialBeats/beats-interaction into develop
- style: auto formatted by CI

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v0.0.2...v0.0.3).

# Release v0.0.2

## Features

- feat: adapt auth middleware to use api-gateway custom headers
- feat: add author attributte for update a rating by id and its validations
- feat: add author attribute for get all ratings of a playlist and its validations
- feat: add author attribute for get all ratings of a beat and its validations
- feat: add author attribute for get my rating of a playlist
- feat: add author attribute for get my rating of a beat
- feat: add author attribute for get a rating by its id
- feat: add author attribute for post a rating of a playlist
- feat: add author attribute for post a rating of a beat
- feat: add author attributte for update a comment by id and its validations
- feat: add author attributte for get all comments of a playlist and its validations
- feat: add author attributte for get all comments of a beat and its validations
- feat: add author attributte for get a comment by its id
- feat: add author attributte for post a comment of a playlist and its validations
- feat: add author attributte for post a comment of a beat
- feat: add the deletion of comments and ratings associated with a playlist
- feat: add pagination to ratings list
- feat: add extra validations thanks to materialized view
- feat: add kafka connection to the API environment
- feat: improve kafka management to include DLQ
- feat: manage beat deletion using kafka
- feat: remove playlists when user is deleted
- feat: add basic Materialized view for Beats and Users

## Tests

- test: adapt integration.rating.test.js to work with \_id instead of .id
- test: add comment, rating and playlists integration tests
- test: adapt routes tests to adapt to new middleware
- test: prepare basic structure for integration tests
- test: move routes tests to /unit
- test: add tests for checking the deletion of comments and ratings associated with a playlist
- test: add tests for pagination of ratings list
- test: add unknown event case in kafka service tests
- test: add tests to check correct kafka event management

## Documentation

- docs: add user attribute to rating schema
- docs: fix documentation of get all ratings by playlist or beat
- docs: add author attribute to comment schema

## Fixes

- fix: change response in ratings endpoints of id for \_id
- fix: change response of id for \_id
- fix: fix bug author attributte for post a comment of a beat
- fix: fix author attributte for post a comment of a beat
- fix: fix problem with .env.example in testing workflow
- fix: add port configuration in OAS server url
- fix: ignore scripts to avoid linter workflow trying to execute tests without environment and database
- fix: add permissions to linter workflow to enable commit and push

## Continuous integration (CI)

- ci: fix linter workflow to not try to commit when linter fails
- ci: fix problem with linter workflow

## Other changes

- Merge pull request #19 from SocialBeats/develop
- chore: remove useless comments
- Merge pull request #18 from SocialBeats/integrations
- Merge remote-tracking branch 'origin/develop' into integrations
- Merge pull request #17 from SocialBeats/3-crud-rating
- chore: rename integration tests setup file
- Merge remote-tracking branch 'origin/develop' into integrations
- Merge pull request #16 from SocialBeats/2-crud-comment
- Merge pull request #15 from SocialBeats/integrations
- Merge branch 'develop' into integrations
- style: fix CHANGELOG.md lint
- Merge pull request #14 from SocialBeats/3-crud-rating
- chore: rename health routes test file
- chore: remove duplicated index

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/beats-interaction/compare/v0.0.1...v0.0.2).

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
